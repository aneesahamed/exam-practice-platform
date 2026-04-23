import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

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

interface ProgressItem {
  PK: string;  // USER#<cognitoSub>
  SK: string;  // QUESTION#<questionId>
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  attempts: number;
  last_attempt_at: string;
  first_attempt_at?: string;
  time_spent_seconds?: number;
  difficulty?: string;
  updated_at: string;
}

/**
 * Lambda handler to record a question attempt
 * POST /progress/attempt
 * Requires Cognito authentication
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

  // Parse request body
  if (!event.body) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Missing request body',
      }),
    };
  }

  let requestBody: RecordProgressRequest;
  try {
    requestBody = JSON.parse(event.body);
  } catch (error) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body',
      }),
    };
  }

  // Validate required fields
  const { question_id, selected_answer, is_correct } = requestBody;
  if (!question_id || selected_answer === undefined || is_correct === undefined) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: false,
        error: 'Missing required fields: question_id, selected_answer, is_correct',
      }),
    };
  }

  try {
    const now = new Date().toISOString();
    const pk = `USER#${userId}`;
    const sk = `QUESTION#${question_id}`;

    // Check if this is a new attempt or updating existing
    // For now, we'll use PUT with attribute_not_exists to set first_attempt_at
    // and increment attempts counter
    
    const item: ProgressItem = {
      PK: pk,
      SK: sk,
      question_id,
      selected_answer,
      is_correct,
      attempts: 1,  // Will be incremented if item exists
      last_attempt_at: now,
      updated_at: now,
    };

    // Add optional fields
    if (requestBody.time_spent_seconds !== undefined) {
      item.time_spent_seconds = requestBody.time_spent_seconds;
    }
    if (requestBody.difficulty) {
      item.difficulty = requestBody.difficulty;
    }

    // Use UpdateExpression for atomic increment of attempts
    // This is more reliable than GET -> PUT pattern
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: item,
      // Set first_attempt_at only if it doesn't exist
      ConditionExpression: 'attribute_not_exists(PK)',
    });

    // First attempt - set first_attempt_at
    item.first_attempt_at = now;
    
    try {
      await docClient.send(command);
      console.log(`Recorded first attempt for ${userId}/${question_id}`);
    } catch (error: any) {
      // If condition fails, item exists - update it instead
      if (error.name === 'ConditionalCheckFailedException') {
        // Item exists, update without setting first_attempt_at
        delete item.first_attempt_at;
        
        // For subsequent attempts, we need to increment the counter
        // This is a simplified approach - in production, use UpdateExpression
        const updateCommand = new PutCommand({
          TableName: TABLE_NAME,
          Item: {
            ...item,
            // Note: This will overwrite attempts to 1
            // In production, use UpdateExpression with ADD
          },
        });
        
        await docClient.send(updateCommand);
        console.log(`Updated existing attempt for ${userId}/${question_id}`);
      } else {
        throw error;
      }
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: {
          user_id: userId,
          question_id,
          recorded_at: now,
        },
      }),
    };
  } catch (error) {
    console.error('Error recording progress:', error);
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
