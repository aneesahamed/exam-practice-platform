import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand, PutCommand } from '@aws-sdk/lib-dynamodb';
import { requireUserSub } from '../lib/auth';
import { validateFlagData } from '../lib/validation/flags';

const ddbClient = new DynamoDBClient({ region: process.env.AWS_REGION });
const docClient = DynamoDBDocumentClient.from(ddbClient);
const TABLE_NAME = process.env.FLAGS_TABLE!;

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('flags-put event', JSON.stringify(event, null, 2));

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

  const questionId = event.pathParameters?.questionId;
  if (!questionId) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'Missing questionId in path' }),
    };
  }

  if (!event.body) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'Missing request body' }),
    };
  }

  let parsed: any;
  try {
    parsed = JSON.parse(event.body);
  } catch (e) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'Invalid JSON' }),
    };
  }

  const validation = validateFlagData(parsed);
  if (!validation.valid) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: validation.errors[0]?.message || 'Validation failed' }),
    };
  }

  const { flag_type, note, suggested_correct_answers } = validation.data;
  const pk = `USER#${userId}`;
  const sk = `FLAG#${questionId}`;
  const now = new Date().toISOString();

  try {
    // Try to get existing item to preserve created_at
    const existingRes = await docClient.send(new GetCommand({ TableName: TABLE_NAME, Key: { PK: pk, SK: sk } }));
    const existing = existingRes.Item as any | undefined;
    const created_at = existing?.created_at ?? now;

    const item: any = {
      PK: pk,
      SK: sk,
      user_id: userId,
      question_id: questionId,
      flag_type,
      created_at,
      updated_at: now,
      GSI1PK: pk,
      GSI1SK: `TYPE#${flag_type}#${now}`,
    };

    if (note) item.note = note;
    if (suggested_correct_answers) item.suggested_correct_answers = suggested_correct_answers;

    await docClient.send(new PutCommand({ TableName: TABLE_NAME, Item: item }));

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: true, flag: item }),
    };
  } catch (err: any) {
    console.error('flags-put error', err);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      body: JSON.stringify({ ok: false, error: 'Internal server error' }),
    };
  }
};
