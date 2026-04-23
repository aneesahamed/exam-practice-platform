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
  attempts: number;
  difficulty?: string;
  time_spent_seconds?: number;
  last_attempt_at: string;
}

interface ProgressStats {
  total_attempted: number;
  correct_count: number;
  incorrect_count: number;
  accuracy_percentage: number;
  by_difficulty?: {
    [key: string]: {
      attempted: number;
      correct: number;
      accuracy: number;
    };
  };
  total_time_spent_seconds?: number;
  last_activity_at?: string;
}

/**
 * Lambda handler to get user progress statistics
 * GET /progress/stats
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

  try {
    const pk = `USER#${userId}`;

    // Query all progress items for this user
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      KeyConditionExpression: 'PK = :pk',
      ExpressionAttributeValues: {
        ':pk': pk,
      },
    });

    const result = await docClient.send(command);
    const items = (result.Items || []) as ProgressItem[];

    console.log(`Found ${items.length} progress items for user ${userId}`);

    // Calculate statistics
    const stats: ProgressStats = {
      total_attempted: items.length,
      correct_count: 0,
      incorrect_count: 0,
      accuracy_percentage: 0,
      by_difficulty: {},
      total_time_spent_seconds: 0,
    };

    let mostRecentAttempt: string | undefined;

    items.forEach((item) => {
      // Count correct/incorrect
      if (item.is_correct) {
        stats.correct_count++;
      } else {
        stats.incorrect_count++;
      }

      // Track by difficulty if available
      if (item.difficulty) {
        if (!stats.by_difficulty![item.difficulty]) {
          stats.by_difficulty![item.difficulty] = {
            attempted: 0,
            correct: 0,
            accuracy: 0,
          };
        }
        stats.by_difficulty![item.difficulty].attempted++;
        if (item.is_correct) {
          stats.by_difficulty![item.difficulty].correct++;
        }
      }

      // Sum time spent
      if (item.time_spent_seconds) {
        stats.total_time_spent_seconds! += item.time_spent_seconds;
      }

      // Track most recent activity
      if (!mostRecentAttempt || item.last_attempt_at > mostRecentAttempt) {
        mostRecentAttempt = item.last_attempt_at;
      }
    });

    // Calculate accuracy percentage
    if (stats.total_attempted > 0) {
      stats.accuracy_percentage = Math.round(
        (stats.correct_count / stats.total_attempted) * 100
      );
    }

    // Calculate accuracy by difficulty
    if (stats.by_difficulty) {
      Object.keys(stats.by_difficulty).forEach((difficulty) => {
        const diffStats = stats.by_difficulty![difficulty];
        if (diffStats.attempted > 0) {
          diffStats.accuracy = Math.round(
            (diffStats.correct / diffStats.attempted) * 100
          );
        }
      });
    }

    stats.last_activity_at = mostRecentAttempt;

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
      body: JSON.stringify({
        success: true,
        data: {
          stats,
          user_id: userId,
        },
      }),
    };
  } catch (error) {
    console.error('Error fetching progress stats:', error);
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
