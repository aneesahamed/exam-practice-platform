import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, UpdateCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.PROGRESS_TABLE!;

interface RecordProgressRequest {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  time_spent_seconds?: number;
  difficulty?: string;
}

const CORS_HEADERS = {
  'Content-Type': 'application/json',
  'Access-Control-Allow-Origin': '*',
};

/**
 * POST /progress/attempt
 *
 * Records a question attempt atomically:
 *   - First attempt: sets first_attempt_at, attempts = 1
 *   - Subsequent attempts: increments attempts counter, updates last_attempt_at
 *
 * Uses a single UpdateCommand with ADD for atomic increment —
 * no GET → PUT race condition, no attempts counter reset.
 */
export const handler = async (
  event: APIGatewayProxyEvent
): Promise<APIGatewayProxyResult> => {
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    return {
      statusCode: 401,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'Unauthorized' }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'Missing request body' }),
    };
  }

  let body: RecordProgressRequest;
  try {
    body = JSON.parse(event.body);
  } catch {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({ success: false, error: 'Invalid JSON' }),
    };
  }

  const { question_id, selected_answer, is_correct } = body;
  if (!question_id || selected_answer === undefined || is_correct === undefined) {
    return {
      statusCode: 400,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: 'Missing required fields: question_id, selected_answer, is_correct',
      }),
    };
  }

  const now = new Date().toISOString();

  try {
    /**
     * Single atomic UpdateCommand:
     *
     * - ADD attempts 1          → increments on every call (starts at 0, becomes 1 on first call)
     * - SET selected_answer     → always update to latest answer
     * - SET is_correct          → always update to latest result
     * - SET last_attempt_at     → always update
     * - SET updated_at          → always update
     * - SET first_attempt_at    → only set if attribute does not exist yet (if_not_exists)
     * - SET question_id         → always set (needed for queries)
     *
     * This is the correct DynamoDB pattern for an incrementing counter.
     * No GET required, no race condition, no reset.
     */
    await docClient.send(
      new UpdateCommand({
        TableName: TABLE_NAME,
        Key: {
          PK: `USER#${userId}`,
          SK: `QUESTION#${question_id}`,
        },
        UpdateExpression: `
          ADD attempts :inc
          SET selected_answer    = :selected_answer,
              is_correct         = :is_correct,
              last_attempt_at    = :now,
              updated_at         = :now,
              first_attempt_at   = if_not_exists(first_attempt_at, :now),
              question_id        = if_not_exists(question_id, :question_id),
              time_spent_seconds = if_not_exists(time_spent_seconds, :time_spent),
              difficulty         = if_not_exists(difficulty, :difficulty)
        `,
        ExpressionAttributeValues: {
          ':inc':             1,
          ':selected_answer': selected_answer,
          ':is_correct':      is_correct,
          ':now':             now,
          ':question_id':     question_id,
          ':time_spent':      body.time_spent_seconds ?? null,
          ':difficulty':      body.difficulty ?? null,
        },
      })
    );

    console.log(`Recorded attempt for ${userId}/${question_id}`);

    return {
      statusCode: 200,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: true,
        data: { user_id: userId, question_id, recorded_at: now },
      }),
    };
  } catch (error) {
    console.error('Error recording progress:', error);
    return {
      statusCode: 500,
      headers: CORS_HEADERS,
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
