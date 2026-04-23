import { useState, useEffect, useCallback } from "react";
import { LearnerProgress, QuestionAttempt, Difficulty } from "@/types/question";
import { mockQuestions } from "@/data/mockQuestions";
import { useQuestionsContext } from "@/context/QuestionsContext";
import { useAuth } from "@/context/AuthContext";
import { recordProgress as recordProgressAPI } from "@/api/progress";

const STORAGE_KEY = "examPractice_progress";

const getInitialProgress = (): LearnerProgress => {
  if (typeof window === "undefined") {
    return {
      exam_id: "aws-saa-c03",
      attempts: [],
      mastered_question_ids: [],
    };
  }

  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch {
      return {
        exam_id: "aws-saa-c03",
        attempts: [],
        mastered_question_ids: [],
      };
    }
  }

  return {
    exam_id: "aws-saa-c03",
    attempts: [],
    mastered_question_ids: [],
  };
};

export function useProgress(totalQuestionsCount?: number) {
  const [progress, setProgress] = useState<LearnerProgress>(getInitialProgress);
  const { questions: realQuestions } = useQuestionsContext();
  const { user } = useAuth();
  
  // Use real questions if available, fallback to mock
  const allQuestions = realQuestions.length > 0 ? realQuestions : mockQuestions;

  // Persist to localStorage whenever progress changes
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  }, [progress]);

  const recordAttempt = useCallback(async (attempt: QuestionAttempt) => {
    // Always save to localStorage first (for offline support and speed)
    setProgress((prev) => {
      const newAttempts = [...prev.attempts, attempt];
      
      // Check if this question should be marked as mastered
      // (answered correctly after previously being incorrect)
      let newMastered = [...prev.mastered_question_ids];
      
      const previousAttempts = prev.attempts.filter(
        (a) => a.question_id === attempt.question_id
      );
      const hadIncorrect = previousAttempts.some((a) => !a.is_correct);
      
      if (hadIncorrect && attempt.is_correct && !newMastered.includes(attempt.question_id)) {
        newMastered = [...newMastered, attempt.question_id];
      }

      return {
        ...prev,
        attempts: newAttempts,
        mastered_question_ids: newMastered,
      };
    });

    // If user is authenticated, sync to backend
    if (user) {
      try {
        await recordProgressAPI({
          question_id: attempt.question_id,
          selected_answer: attempt.selected_answers[0] || '', // Backend expects single answer
          is_correct: attempt.is_correct,
        });
        console.log('✅ Progress synced to backend');
      } catch (error) {
        console.error('❌ Failed to sync progress to backend:', error);
        // Don't throw - localStorage save already succeeded
      }
    }
  }, [user]);

  const getLatestAttempt = useCallback(
    (questionId: string): QuestionAttempt | undefined => {
      const questionAttempts = progress.attempts.filter(
        (a) => a.question_id === questionId
      );
      return questionAttempts[questionAttempts.length - 1];
    },
    [progress.attempts]
  );

  const getIncorrectQuestionIds = useCallback((): string[] => {
    const latestByQuestion = new Map<string, QuestionAttempt>();
    
    progress.attempts.forEach((attempt) => {
      latestByQuestion.set(attempt.question_id, attempt);
    });

    return Array.from(latestByQuestion.entries())
      .filter(([id, attempt]) => !attempt.is_correct && !progress.mastered_question_ids.includes(id))
      .map(([id]) => id);
  }, [progress.attempts, progress.mastered_question_ids]);

  const getStats = useCallback(() => {
    const uniqueAttempted = new Set(progress.attempts.map((a) => a.question_id));
    const totalQuestions = totalQuestionsCount ?? mockQuestions.length;
    
    // Get latest attempt for each question to calculate accuracy
    const latestByQuestion = new Map<string, QuestionAttempt>();
    progress.attempts.forEach((attempt) => {
      latestByQuestion.set(attempt.question_id, attempt);
    });

    const correctCount = Array.from(latestByQuestion.values()).filter(
      (a) => a.is_correct
    ).length;

    const attemptedCount = uniqueAttempted.size;
    const accuracy = attemptedCount > 0 ? (correctCount / attemptedCount) * 100 : 0;

    // Stats by difficulty
    const statsByDifficulty: Record<Difficulty, { attempted: number; correct: number }> = {
      EASY: { attempted: 0, correct: 0 },
      MEDIUM: { attempted: 0, correct: 0 },
      HARD: { attempted: 0, correct: 0 },
    };

    // Stats by topic
    const statsByTopic: Record<string, { attempted: number; correct: number; total: number }> = {};
    
    // Initialize topic stats with all topics from questions
    allQuestions.forEach((q) => {
      const topic = q.taxonomy.primary_topic_id;
      if (!statsByTopic[topic]) {
        statsByTopic[topic] = { attempted: 0, correct: 0, total: 0 };
      }
      statsByTopic[topic].total++;
    });

    latestByQuestion.forEach((attempt, questionId) => {
      const question = allQuestions.find((q) => q.question_id === questionId);
      if (question) {
        const difficulty = question.taxonomy.difficulty;
        const topic = question.taxonomy.primary_topic_id;
        
        statsByDifficulty[difficulty].attempted++;
        if (attempt.is_correct) {
          statsByDifficulty[difficulty].correct++;
        }

        statsByTopic[topic].attempted++;
        if (attempt.is_correct) {
          statsByTopic[topic].correct++;
        }
      }
    });

    return {
      totalQuestions,
      attemptedCount,
      correctCount,
      accuracy,
      progressPercent: (attemptedCount / totalQuestions) * 100,
      incorrectCount: getIncorrectQuestionIds().length,
      masteredCount: progress.mastered_question_ids.length,
      statsByDifficulty,
      statsByTopic,
    };
  }, [progress, getIncorrectQuestionIds, totalQuestionsCount, allQuestions]);

  const resetProgress = useCallback(() => {
    setProgress({
      exam_id: "aws-saa-c03",
      attempts: [],
      mastered_question_ids: [],
    });
  }, []);

  const deleteAttemptsForQuestions = useCallback((questionIds: string[]) => {
    const questionIdSet = new Set(questionIds);
    setProgress((prev) => ({
      ...prev,
      attempts: prev.attempts.filter(
        (attempt) => !questionIdSet.has(attempt.question_id)
      ),
    }));
  }, []);

  return {
    progress,
    recordAttempt,
    getLatestAttempt,
    getIncorrectQuestionIds,
    getStats,
    resetProgress,
    deleteAttemptsForQuestions,
  };
}
