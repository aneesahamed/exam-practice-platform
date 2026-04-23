/**
 * useQuestions Hook
 * 
 * Manages question fetching with simple caching
 * No pagination UI - fetch batch upfront and work with it locally
 */

import { useState, useEffect } from 'react';
import { fetchQuestions, type BackendQuestion, type FetchQuestionsOptions } from '@/api/questions';
import type { Question } from '@/types/question';

// Cache questions in memory for session duration
let questionsCache: BackendQuestion[] | null = null;
let cacheOptions: string | null = null;

// Force clear cache on module load to ensure fresh data after code changes
if (import.meta.hot) {
  questionsCache = null;
  cacheOptions = null;
}

/**
 * Convert backend question format to frontend Question type
 */
function convertQuestion(backendQ: BackendQuestion): Question {
  return {
    question_id: backendQ.question_id,
    question_text_raw: backendQ.question_text_raw,
    options_raw: backendQ.options_raw,
    correct_answers: backendQ.correct_answers,
    explanation: backendQ.explanation,
    why_others_are_wrong: backendQ.why_others_are_wrong,
    memory_hook: backendQ.memory_hook,
    taxonomy: backendQ.taxonomy,
  };
}

export function useQuestions(options: FetchQuestionsOptions = {}) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    const cacheKey = JSON.stringify(options);
    console.log('🔍 useQuestions called with options:', options);

    // Use cache if same options (but not on retry)
    if (questionsCache && cacheOptions === cacheKey && retryCount === 0) {
      console.log('✅ Using cached questions:', questionsCache.length);
      setQuestions(questionsCache.map(convertQuestion));
      setLoading(false);
      return;
    }

    // Fetch fresh questions
    const loadQuestions = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('🌐 Fetching fresh questions from backend...');
        const fetchedQuestions = await fetchQuestions(options);
        console.log('✅ Fetched questions:', fetchedQuestions.length);
        
        // Cache for reuse
        questionsCache = fetchedQuestions;
        cacheOptions = cacheKey;

        setQuestions(fetchedQuestions.map(convertQuestion));
      } catch (err) {
        console.error('Failed to fetch questions:', err);
        setError(err instanceof Error ? err.message : 'Failed to load questions');
        setQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadQuestions();
  }, [JSON.stringify(options), retryCount]);

  const retry = () => {
    setRetryCount(prev => prev + 1);
  };

  return {
    questions,
    loading,
    error,
    total: questions.length,
    retry,
  };
}

/**
 * Clear the questions cache (useful for refresh)
 */
export function clearQuestionsCache() {
  questionsCache = null;
  cacheOptions = null;
}
