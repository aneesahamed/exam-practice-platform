/**
 * Flags API Client
 * Methods for flagging questions with different types
 */

import { apiRequest } from './client';

export type FlagType = 'REVIEW' | 'WRONG_ANSWER' | 'BAD_QUESTION' | 'GOLDEN_NOTE';

export interface Flag {
  PK: string;
  SK: string;
  user_id: string;
  question_id: string;
  flag_type: FlagType;
  note?: string;
  suggested_correct_answers?: string[];
  created_at: string;
  updated_at: string;
  GSI1PK: string;
  GSI1SK: string;
}

export interface CreateFlagRequest {
  flag_type: FlagType;
  note?: string;
  suggested_correct_answers?: string[];
}

export interface FlagsSummary {
  counts: {
    REVIEW: number;
    WRONG_ANSWER: number;
    BAD_QUESTION: number;
    GOLDEN_NOTE: number;
  };
  total: number;
}

export interface ListFlagsResponse {
  items: Flag[];
  next_cursor: string | null;
}

/**
 * Create or update a flag on a question
 */
export async function putFlag(questionId: string, data: CreateFlagRequest): Promise<Flag> {
  const response = await apiRequest<{ ok: boolean; flag: Flag }>(`/flags/${questionId}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }, true);
  return response.flag;
}

/**
 * Delete a flag from a question
 */
export async function deleteFlag(questionId: string): Promise<void> {
  await apiRequest<{ ok: boolean }>(`/flags/${questionId}`, {
    method: 'DELETE',
  }, true);
}

/**
 * List all flags or filter by type
 */
export async function listFlags(type?: FlagType, cursor?: string, limit = 50): Promise<ListFlagsResponse> {
  const params = new URLSearchParams();
  if (type) params.append('type', type);
  if (cursor) params.append('cursor', cursor);
  if (limit) params.append('limit', limit.toString());
  
  const queryString = params.toString();
  const url = queryString ? `/flags?${queryString}` : '/flags';
  
  return apiRequest<ListFlagsResponse>(url, {}, true);
}

/**
 * Get summary counts of flags by type
 */
export async function getFlagsSummary(): Promise<FlagsSummary> {
  return apiRequest<FlagsSummary>('/flags/summary', {}, true);
}
