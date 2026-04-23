import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { requireUserSub } from '../lib/auth';

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const TABLE_NAME = process.env.FLAGS_TABLE!;

/**
 * GET /flags/summary
 * Returns counts of flags by type for the authenticated user
 * 
 * NOTE: This implementation queries all flags and counts them in Lambda.
 * For MVP scale (<1000 flags per user), this is acceptable.
 * TODO: If flags per user exceeds 1000, consider maintaining atomic counters
 * in a separate metadata item for O(1) summary queries.
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('flags-summary event');
  
  let userId: string;
  try {
    userId = requireUserSub(event);
  } catch (err) {
    return {
      statusCode: 401,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'Unauthorized' }),
    };
  }

  const pk = `USER#${userId}`;
  const counts: Record<string, number> = { 
    REVIEW: 0, 
    WRONG_ANSWER: 0, 
    BAD_QUESTION: 0, 
    GOLDEN_NOTE: 0 
  };
  let total = 0;
  let ExclusiveStartKey: any = undefined;

  try {
    // Query all flags for this user and count by type
    do {
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': pk },
        ExclusiveStartKey,
      });
      
      const res = await docClient.send(command);
      const items = res.Items || [];
      
      for (const item of items) {
        const flagType = item.flag_type as string;
        if (flagType && counts[flagType] !== undefined) {
          counts[flagType] += 1;
        }
        total += 1;
      }
      
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ counts, total }),
    };
  } catch (err) {
    console.error('flags-summary error', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'Internal server error' }),
    };
  }
};
