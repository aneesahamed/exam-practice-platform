import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, QueryCommand } from '@aws-sdk/lib-dynamodb';
import { requireUserSub } from '../lib/auth';

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const TABLE_NAME = process.env.FLAGS_TABLE!;
const GSI_NAME = 'GSI1';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('flags-list event', JSON.stringify(event.queryStringParameters || {}, null, 2));
  
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

  const qs = event.queryStringParameters || {};
  const type = qs.type;
  const limitRaw = qs.limit;
  let limit = 50;
  if (limitRaw) {
    const n = parseInt(limitRaw, 10);
    if (!isNaN(n)) limit = Math.min(200, Math.max(1, n));
  }

  const cursor = qs.cursor;
  let exclusiveStartKey: any = undefined;
  if (cursor) {
    try {
      exclusiveStartKey = JSON.parse(decodeURIComponent(cursor));
    } catch (e) {
      // Invalid cursor, ignore and start from beginning
    }
  }

  try {
    if (type) {
      // Query GSI1 filtered by type
      const prefix = `TYPE#${type}#`;
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        IndexName: GSI_NAME,
        KeyConditionExpression: 'GSI1PK = :gpk AND begins_with(GSI1SK, :prefix)',
        ExpressionAttributeValues: { ':gpk': `USER#${userId}`, ':prefix': prefix },
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
        ScanIndexForward: false,
      });
      const res = await docClient.send(command);
      const nextCursor = res.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(res.LastEvaluatedKey)) : null;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ items: res.Items || [], next_cursor: nextCursor }),
      };
    } else {
      // Query base table by PK
      const command = new QueryCommand({
        TableName: TABLE_NAME,
        KeyConditionExpression: 'PK = :pk',
        ExpressionAttributeValues: { ':pk': `USER#${userId}` },
        Limit: limit,
        ExclusiveStartKey: exclusiveStartKey,
        ScanIndexForward: false,
      });
      const res = await docClient.send(command);
      const nextCursor = res.LastEvaluatedKey ? encodeURIComponent(JSON.stringify(res.LastEvaluatedKey)) : null;
      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify({ items: res.Items || [], next_cursor: nextCursor }),
      };
    }
  } catch (err) {
    console.error('flags-list error', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'Internal server error' }),
    };
  }
};
