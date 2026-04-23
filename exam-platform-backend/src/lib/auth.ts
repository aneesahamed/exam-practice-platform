import { APIGatewayProxyEvent } from 'aws-lambda';

export function getUserSub(event: APIGatewayProxyEvent): string | null {
  const userId = event.requestContext?.authorizer?.claims?.sub;
  return userId ?? null;
}

export function requireUserSub(event: APIGatewayProxyEvent): string {
  const sub = getUserSub(event);
  if (!sub) throw new Error('Unauthorized: missing user id');
  return sub;
}
