/**
 * Backend Progress API Client
 * 
 * Functions to interact with progress tracking endpoints
 */

import { apiRequest } from './client';

export interface RecordProgressRequest {
  question_id: string;
  selected_answer: string;
  is_correct: boolean;
  time_spent_seconds?: number;
  difficulty?: string;
}

export interface RecordProgressResponse {
  success: boolean;
  data: {
    user_id: string;
    question_id: string;
    recorded_at: string;
  };
}

export interface ProgressStats {
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

export interface ProgressStatsResponse {
  success: boolean;
  data: {
    stats: ProgressStats;
    user_id: string;
  };
}

export interface IncorrectQuestion {
  question_id: string;
  selected_answer: string;
  attempts: number;
  last_attempt_at: string;
}

export interface IncorrectQuestionsResponse {
  success: boolean;
  data: {
    incorrect_questions: IncorrectQuestion[];
    count: number;
    total_incorrect: number;
  };
}

/**
 * Record a question attempt
 */
export async function recordProgress(
  data: RecordProgressRequest
): Promise<RecordProgressResponse> {
  return apiRequest<RecordProgressResponse>(
    '/progress/attempt',
    {
      method: 'POST',
      body: JSON.stringify(data),
    },
    true // Requires authentication
  );
}

/**
 * Get user progress statistics
 */
export async function getProgressStats(): Promise<ProgressStatsResponse> {
  return apiRequest<ProgressStatsResponse>(
    '/progress/stats',
    {},
    true // Requires authentication
  );
}

/**
 * Get list of incorrectly answered questions
 */
export async function getIncorrectQuestions(
  limit: number = 50
): Promise<IncorrectQuestionsResponse> {
  return apiRequest<IncorrectQuestionsResponse>(
    `/progress/incorrect?limit=${limit}`,
    {},
    true // Requires authentication
  );
}
