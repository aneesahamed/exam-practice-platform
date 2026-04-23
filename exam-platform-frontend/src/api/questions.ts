/**
 * Questions API
 * 
 * Fetch questions from backend without pagination for simplicity
 * Strategy: Fetch large batch upfront (100 max per request), cache locally
 */

import { apiRequest } from './client';

/**
 * Backend API types (matching backend response)
 */
export interface BackendQuestion {
  question_id: string;
  exam: {
    vendor: string;
    certification: string;
    code: string;
    version: string;
  };
  source: string;
  question_text_raw: string;
  options_raw: Record<string, string>;
  correct_answers: string[];
  explanation: string;
  why_others_are_wrong: Record<string, string>;
  memory_hook: string;
  taxonomy: {
    primary_topic_id: string;
    service_ids: string[];
    concept_tag_ids: string[];
    exam_triggers: string[];
    difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  };
  status: string;
  quality: {
    answer_source: string;
    confidence: number;
    flags: string[];
  };
}

interface QuestionsResponse {
  questions: BackendQuestion[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasMore: boolean;
  };
  filters: {
    exam?: string | null;
    topic?: string | null;
    difficulty?: string | null;
  };
}

export interface FetchQuestionsOptions {
  limit?: number;  // Max 100 per backend
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD';
  topic?: string;
}

/**
 * Fetch questions from backend
 * No pagination UI - just fetch large batch upfront
 */
export async function fetchQuestions(
  options: FetchQuestionsOptions = {}
): Promise<BackendQuestion[]> {
  const params = new URLSearchParams();
  
  // Fetch maximum allowed per request (100)
  params.append('limit', String(options.limit || 100));
  
  if (options.difficulty) {
    params.append('difficulty', options.difficulty);
  }
  
  if (options.topic) {
    params.append('topic', options.topic);
  }

  const response = await apiRequest<QuestionsResponse>(
    `/questions?${params.toString()}`
  );

  return response.questions;
}

/**
 * Fetch ALL questions by making multiple requests
 * Use sparingly - only when truly need all 980 questions
 * Better: Use fetchQuestions with filters
 */
export async function fetchAllQuestions(): Promise<BackendQuestion[]> {
  const allQuestions: BackendQuestion[] = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    const response = await apiRequest<QuestionsResponse>(
      `/questions?limit=100&page=${page}`
    );

    allQuestions.push(...response.questions);
    hasMore = response.pagination.hasMore;
    page++;

    // Safety limit: max 10 requests (1000 questions)
    if (page > 10) {
      console.warn('Reached max pagination limit');
      break;
    }
  }

  return allQuestions;
}

/**
 * Get question count by difficulty
 */
export async function getQuestionStats() {
  // Fetch minimal data (page 1, limit 1) for each difficulty to get totals
  const [easy, medium, hard] = await Promise.all([
    apiRequest<QuestionsResponse>('/questions?limit=1&difficulty=EASY'),
    apiRequest<QuestionsResponse>('/questions?limit=1&difficulty=MEDIUM'),
    apiRequest<QuestionsResponse>('/questions?limit=1&difficulty=HARD'),
  ]);

  return {
    easy: easy.pagination.total,
    medium: medium.pagination.total,
    hard: hard.pagination.total,
    total: easy.pagination.total + medium.pagination.total + hard.pagination.total,
  };
}
