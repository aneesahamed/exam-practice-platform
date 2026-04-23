export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface QuestionTaxonomy {
  primary_topic_id: string;
  service_ids: string[];
  concept_tag_ids: string[];
  exam_triggers: string[];
  difficulty: Difficulty;
}

export interface Question {
  question_id: string;
  question_text_raw: string;
  options_raw: Record<string, string>;
  correct_answers: string[];
  explanation: string;
  why_others_are_wrong: Record<string, string>;
  memory_hook: string;
  taxonomy: QuestionTaxonomy;
}

export interface QuestionAttempt {
  question_id: string;
  selected_answers: string[];
  is_correct: boolean;
  attempted_at: number;
}

export interface LearnerProgress {
  exam_id: string;
  attempts: QuestionAttempt[];
  mastered_question_ids: string[];
}

export interface ExamInfo {
  id: string;
  name: string;
  short_name: string;
  description: string;
  total_questions: number;
}
