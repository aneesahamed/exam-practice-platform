/**
 * Validation utilities for question flags
 */

export type FlagType = 'REVIEW' | 'WRONG_ANSWER' | 'BAD_QUESTION' | 'GOLDEN_NOTE';

const VALID_FLAG_TYPES: FlagType[] = ['REVIEW', 'WRONG_ANSWER', 'BAD_QUESTION', 'GOLDEN_NOTE'];
const VALID_ANSWERS = ['A', 'B', 'C', 'D', 'E'];

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidatedFlagData {
  flag_type: FlagType;
  note?: string;
  suggested_correct_answers?: string[];
}

/**
 * Validate and normalize flag data from request body
 */
export function validateFlagData(data: any): { valid: true; data: ValidatedFlagData } | { valid: false; errors: ValidationError[] } {
  const errors: ValidationError[] = [];

  // Validate flag_type
  if (!data.flag_type) {
    errors.push({ field: 'flag_type', message: 'flag_type is required' });
  } else if (!VALID_FLAG_TYPES.includes(data.flag_type)) {
    errors.push({ 
      field: 'flag_type', 
      message: `flag_type must be one of: ${VALID_FLAG_TYPES.join(', ')}` 
    });
  }

  // Validate note (optional)
  let note: string | undefined;
  if (data.note !== undefined && data.note !== null) {
    if (typeof data.note !== 'string') {
      errors.push({ field: 'note', message: 'note must be a string' });
    } else {
      const trimmed = data.note.trim();
      if (trimmed.length > 500) {
        errors.push({ field: 'note', message: 'note must be 500 characters or less' });
      }
      // Convert empty string to undefined
      if (trimmed.length === 0) {
        note = undefined;
      } else {
        note = trimmed;
      }
    }
  }

  // Validate suggested_correct_answers
  let suggestedAnswers: string[] | undefined;
  if (data.flag_type === 'WRONG_ANSWER') {
    // Required for WRONG_ANSWER
    if (!data.suggested_correct_answers || !Array.isArray(data.suggested_correct_answers)) {
      errors.push({ 
        field: 'suggested_correct_answers', 
        message: 'suggested_correct_answers is required for WRONG_ANSWER flag type' 
      });
    } else {
      // Normalize: uppercase and deduplicate
      const normalized = [...new Set(
        data.suggested_correct_answers
          .map((ans: any) => typeof ans === 'string' ? ans.toUpperCase().trim() : null)
          .filter((ans: any) => ans !== null)
      )] as string[];

      // Must have at least one answer
      if (normalized.length === 0) {
        errors.push({ 
          field: 'suggested_correct_answers', 
          message: 'suggested_correct_answers must contain at least one answer' 
        });
      } else {
        // Check all answers are valid (A-E)
        const invalid = normalized.filter((ans: string) => !VALID_ANSWERS.includes(ans));
        if (invalid.length > 0) {
          errors.push({ 
            field: 'suggested_correct_answers', 
            message: `Invalid answers: ${invalid.join(', ')}. Must be A, B, C, D, or E` 
          });
        } else {
          suggestedAnswers = normalized;
        }
      }
    }
  } else {
    // Forbidden for other flag types
    if (data.suggested_correct_answers && 
        Array.isArray(data.suggested_correct_answers) && 
        data.suggested_correct_answers.length > 0) {
      errors.push({ 
        field: 'suggested_correct_answers', 
        message: 'suggested_correct_answers is not allowed for this flag type' 
      });
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    data: {
      flag_type: data.flag_type,
      note,
      suggested_correct_answers: suggestedAnswers,
    },
  };
}

/**
 * Validate question ID format
 */
export function isValidQuestionId(questionId: string): boolean {
  return typeof questionId === 'string' && questionId.length > 0 && questionId.length <= 100;
}
