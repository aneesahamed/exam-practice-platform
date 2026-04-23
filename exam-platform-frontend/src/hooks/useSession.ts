import { useState, useEffect, useCallback } from "react";
import { Difficulty } from "@/types/question";

export interface SessionState {
  questionIds: string[];
  currentIndex: number;
  stats: { correct: number; total: number };
  filters?: {
    topics?: string[];
    difficulties?: Difficulty[];
  };
  startedAt: number;
}

const SESSION_KEY = "examPractice_session";

export function useSession() {
  const [session, setSession] = useState<SessionState | null>(null);

  // Load session from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(SESSION_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as SessionState;
        // Only restore if there are remaining questions
        if (parsed.currentIndex < parsed.questionIds.length) {
          setSession(parsed);
        } else {
          // Session was completed, clear it
          localStorage.removeItem(SESSION_KEY);
        }
      } catch {
        localStorage.removeItem(SESSION_KEY);
      }
    }
  }, []);

  const saveSession = useCallback((newSession: SessionState) => {
    setSession(newSession);
    localStorage.setItem(SESSION_KEY, JSON.stringify(newSession));
  }, []);

  const startSession = useCallback((
    questionIds: string[],
    filters?: { topics?: string[]; difficulties?: Difficulty[] }
  ) => {
    const newSession: SessionState = {
      questionIds,
      currentIndex: 0,
      stats: { correct: 0, total: 0 },
      filters,
      startedAt: Date.now(),
    };
    saveSession(newSession);
    return newSession;
  }, [saveSession]);

  const updateSession = useCallback((
    currentIndex: number,
    stats: { correct: number; total: number }
  ) => {
    if (session) {
      const updated = { ...session, currentIndex, stats };
      saveSession(updated);
    }
  }, [session, saveSession]);

  const clearSession = useCallback(() => {
    setSession(null);
    localStorage.removeItem(SESSION_KEY);
  }, []);

  const restartFromQuestion = useCallback((
    questionNumber: number,
    deleteAttemptsCallback: (questionIds: string[]) => void,
    progressAttempts: { question_id: string; is_correct: boolean; attempted_at: number }[]
  ) => {
    if (!session) return false;

    // Validate input (1-based question number)
    const maxAllowed = session.currentIndex + 1;
    if (!Number.isFinite(questionNumber) || questionNumber < 1 || questionNumber > maxAllowed) {
      return false;
    }

    // Convert to 0-based index
    const restartIndex = questionNumber - 1;

    // Compute suffix question IDs to delete (from restart point onwards)
    const suffixIds = session.questionIds.slice(restartIndex);

    // Delete all attempts for those questions
    deleteAttemptsCallback(suffixIds);

    // Recalculate session stats from remaining attempts (only for questions in this session up to restartIndex)
    const remainingQuestionIds = session.questionIds.slice(0, restartIndex);
    const remainingQuestionIdSet = new Set(remainingQuestionIds);

    // Get latest attempt per question by attempted_at timestamp
    const latestAttempts = new Map<string, { is_correct: boolean; attempted_at: number }>();
    
    progressAttempts.forEach((attempt) => {
      if (remainingQuestionIdSet.has(attempt.question_id)) {
        const existing = latestAttempts.get(attempt.question_id);
        if (!existing || attempt.attempted_at > existing.attempted_at) {
          latestAttempts.set(attempt.question_id, {
            is_correct: attempt.is_correct,
            attempted_at: attempt.attempted_at,
          });
        }
      }
    });

    // Count correct from latest attempts
    let correctCount = 0;
    latestAttempts.forEach((attempt) => {
      if (attempt.is_correct) correctCount++;
    });

    const newStats = {
      correct: correctCount,
      total: latestAttempts.size,
    };

    // Update session
    const updated: SessionState = {
      ...session,
      currentIndex: restartIndex,
      stats: newStats,
    };

    saveSession(updated);
    return true;
  }, [session, saveSession]);

  const hasUnfinishedSession = session !== null && session.currentIndex < session.questionIds.length;

  return {
    session,
    hasUnfinishedSession,
    startSession,
    updateSession,
    clearSession,
    restartFromQuestion,
  };
}
