import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);

const TABLE_NAME = process.env.PROGRESS_TABLE!;

interface ProgressItem {
  PK: string;
  SK: string;
  question_id: string;
  is_correct: boolean;
  selected_answer: string;
  attempts: number;
  last_attempt_at: string;
}

interface IncorrectQuestion {
  question_id: string;
  selected_answer: string;
  attempts: number;
  last_attempt_at: string;
}

/**
 * Lambda handler to get user's incorrect questions
 * GET /progress/incorrect
 * Requires Cognito authentication
 * 
 * Query params:
 * - limit: number (default: 50, max: 100)
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));

  // Extract user ID from Cognito JWT
  const userId = event.requestContext?.authorizer?.claims?.sub;
  if (!userId) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Unauthorized - missing user ID',
      }),
    };
  }

  try {
    // Parse query parameters
    const limit = Math.min(
      parseInt(event.queryStringParameters?.limit || '50'),
      100
    );

    const pk = `USER#${userId}`;

    // Query all progress items for this user
    // Then filter for incorrect ones (DynamoDB doesn't support filtering on non-key attributes in query)
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': pk,
      },
    });

    const result = await docClient.send(command);
    const items = (result.Items || []) as ProgressItem[];

    console.log(`Found ${items.length} total progress items for user ${userId}`);

    // Filter for incorrect answers
    const incorrectItems = items
      .filter((item) => !item.is_correct)
      .sort((a, b) => b.last_attempt_at.localeCompare(a.last_attempt_at)) // Most recent first
      .slice(0, limit);

    console.log(`Found ${incorrectItems.length} incorrect questions`);

    // Map to response format
    const incorrectQuestions: IncorrectQuestion[] = incorrectItems.map((item) => ({
      question_id: item.question_id,
      selected_answer: item.selected_answer,
      attempts: item.attempts,
      last_attempt_at: item.last_attempt_at,
    }));

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: {
          incorrect_questions: incorrectQuestions,
          count: incorrectQuestions.length,
          total_incorrect: items.filter((item) => !item.is_correct).length,
        },
      }),
    };
  } catch (error) {
    console.error('Error fetching incorrect questions:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      }),
    };
  }
};
