/**
 * useFlags Hook
 * Manages flag state and operations for questions
 */

import { useState, useCallback, useEffect } from 'react';
import { putFlag, deleteFlag, listFlags, getFlagsSummary, Flag, FlagType, CreateFlagRequest, FlagsSummary } from '@/api/flags';
import { useToast } from '@/hooks/use-toast';

export function useFlags(questionId?: string) {
  const [flags, setFlags] = useState<Flag[]>([]);
  const [summary, setSummary] = useState<FlagsSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentFlag, setCurrentFlag] = useState<Flag | null>(null);
  const { toast } = useToast();

  // Get the current flag for a specific question
  const getCurrentFlag = useCallback((qId: string) => {
    return flags.find(f => f.question_id === qId) || null;
  }, [flags]);

  // Load flag for specific question
  const loadQuestionFlag = useCallback(async (qId: string) => {
    try {
      const response = await listFlags();
      const flag = response.items.find(f => f.question_id === qId);
      setCurrentFlag(flag || null);
      return flag || null;
    } catch (error) {
      console.error('Error loading flag:', error);
      return null;
    }
  }, []);

  // Load all flags
  const loadFlags = useCallback(async (type?: FlagType) => {
    setLoading(true);
    try {
      const response = await listFlags(type);
      setFlags(response.items);
      return response.items;
    } catch (error) {
      console.error('Error loading flags:', error);
      toast({
        title: 'Error',
        description: 'Failed to load flags',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  // Load summary
  const loadSummary = useCallback(async () => {
    try {
      const data = await getFlagsSummary();
      setSummary(data);
      return data;
    } catch (error) {
      console.error('Error loading summary:', error);
      return null;
    }
  }, []);

  // Add or update flag
  const addFlag = useCallback(async (qId: string, data: CreateFlagRequest) => {
    try {
      const flag = await putFlag(qId, data);
      setFlags(prev => {
        const existing = prev.findIndex(f => f.question_id === qId);
        if (existing >= 0) {
          const updated = [...prev];
          updated[existing] = flag;
          return updated;
        }
        return [...prev, flag];
      });
      if (qId === questionId) {
        setCurrentFlag(flag);
      }
      toast({
        title: 'Success',
        description: 'Question flagged successfully',
      });
      return flag;
    } catch (error) {
      console.error('Error adding flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to flag question',
        variant: 'destructive',
      });
      throw error;
    }
  }, [questionId, toast]);

  // Remove flag
  const removeFlag = useCallback(async (qId: string) => {
    try {
      await deleteFlag(qId);
      setFlags(prev => prev.filter(f => f.question_id !== qId));
      if (qId === questionId) {
        setCurrentFlag(null);
      }
      toast({
        title: 'Success',
        description: 'Flag removed',
      });
    } catch (error) {
      console.error('Error removing flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove flag',
        variant: 'destructive',
      });
      throw error;
    }
  }, [questionId, toast]);

  // Load current question's flag on mount if questionId provided
  useEffect(() => {
    if (questionId) {
      loadQuestionFlag(questionId);
    }
  }, [questionId, loadQuestionFlag]);

  return {
    flags,
    summary,
    loading,
    currentFlag,
    getCurrentFlag,
    loadFlags,
    loadSummary,
    addFlag,
    removeFlag,
    loadQuestionFlag,
  };
}
