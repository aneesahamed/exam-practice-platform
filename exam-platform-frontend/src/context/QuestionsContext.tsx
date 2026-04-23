/**
 * Questions Context
 * 
 * Provides access to fetched questions across the app
 * Eliminates need to re-fetch in multiple pages
 */

import { createContext, useContext, ReactNode } from 'react';
import { useQuestions } from '@/hooks/useQuestions';
import type { Question } from '@/types/question';

interface QuestionsContextValue {
  questions: Question[];
  loading: boolean;
  error: string | null;
  total: number;
  retry: () => void;
}

const QuestionsContext = createContext<QuestionsContextValue | null>(null);

export function QuestionsProvider({ children }: { children: ReactNode }) {
  const { questions, loading, error, total, retry } = useQuestions({ limit: 1000 }); // Fetch all questions (980 available)

  return (
    <QuestionsContext.Provider value={{ questions, loading, error, total, retry }}>
      {children}
    </QuestionsContext.Provider>
  );
}

export function useQuestionsContext() {
  const context = useContext(QuestionsContext);
  if (!context) {
    throw new Error('useQuestionsContext must be used within QuestionsProvider');
  }
  return context;
}
