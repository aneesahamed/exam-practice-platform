import { useState, useCallback, useMemo } from "react";
import { Question } from "@/types/question";
import { Button } from "@/components/ui/button";
import { MemoryHook } from "@/components/MemoryHook";
import { FlagButton } from "@/components/FlagButton";
import { useFlags } from "@/hooks/useFlags";
import { FlagType } from "@/api/flags";
import { cn } from "@/lib/utils";
import { Check, X, ChevronRight, AlertCircle } from "lucide-react";

interface QuestionCardProps {
  question: Question;
  onSubmit?: (selectedAnswers: string[], isCorrect: boolean) => void;
  onNext?: () => void;
  questionNumber: number;
  totalQuestions: number;
  mode?: "practice" | "revise";
}

export function QuestionCard({
  question,
  onSubmit,
  onNext,
  questionNumber,
  totalQuestions,
  mode = "practice",
}: QuestionCardProps) {
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [submitted, setSubmitted] = useState(mode === "revise"); // Auto-submit in revise mode
  
  const { currentFlag, addFlag, removeFlag } = useFlags(question.question_id);

  const isMultiAnswer = question.correct_answers.length > 1;
  const optionKeys = Object.keys(question.options_raw).sort();

  const handleOptionClick = useCallback((key: string) => {
    if (submitted || mode === "revise") return; // Disable clicks in revise mode

    if (isMultiAnswer) {
      setSelectedAnswers((prev) =>
        prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
      );
    } else {
      setSelectedAnswers([key]);
    }
  }, [submitted, isMultiAnswer, mode]);

  const handleSubmit = useCallback(() => {
    if (selectedAnswers.length === 0 || mode === "revise") return;

    const isCorrect =
      selectedAnswers.length === question.correct_answers.length &&
      selectedAnswers.every((a) => question.correct_answers.includes(a));

    setSubmitted(true);
    onSubmit?.(selectedAnswers, isCorrect);
  }, [selectedAnswers, question.correct_answers, onSubmit, mode]);

  const handleNext = useCallback(() => {
    if (mode === "practice") {
      setSelectedAnswers([]);
      setSubmitted(false);
    }
    onNext?.();
  }, [onNext, mode]);

  const getOptionVariant = useCallback(
    (key: string) => {
      if (mode === "revise") {
        // In revise mode, always show correct answers highlighted
        return question.correct_answers.includes(key) ? "option-correct" : "option";
      }

      if (!submitted) {
        return selectedAnswers.includes(key) ? "option-selected" : "option";
      }

      const isCorrectAnswer = question.correct_answers.includes(key);
      const wasSelected = selectedAnswers.includes(key);

      if (isCorrectAnswer && wasSelected) return "option-correct";
      if (isCorrectAnswer && !wasSelected) return "option-missed";
      if (!isCorrectAnswer && wasSelected) return "option-incorrect";
      return "option";
    },
    [submitted, selectedAnswers, question.correct_answers, mode]
  );

  const getOptionIcon = useCallback(
    (key: string) => {
      if (mode === "revise") {
        // In revise mode, always show check for correct answers
        return question.correct_answers.includes(key) ? (
          <Check className="h-5 w-5 text-success" />
        ) : null;
      }

      if (!submitted) return null;

      const isCorrectAnswer = question.correct_answers.includes(key);
      const wasSelected = selectedAnswers.includes(key);

      if (isCorrectAnswer) {
        return <Check className="h-5 w-5 text-success" />;
      }
      if (wasSelected && !isCorrectAnswer) {
        return <X className="h-5 w-5 text-error" />;
      }
      return null;
    },
    [submitted, selectedAnswers, question.correct_answers, mode]
  );

  const isCorrect = useMemo(() => {
    if (!submitted) return null;
    return (
      selectedAnswers.length === question.correct_answers.length &&
      selectedAnswers.every((a) => question.correct_answers.includes(a))
    );
  }, [submitted, selectedAnswers, question.correct_answers]);

  const wrongAnswerExplanations = useMemo(() => {
    if (!submitted) return [];
    
    // Get all incorrect options (not in correct_answers)
    const incorrectOptions = optionKeys.filter(
      (key) => !question.correct_answers.includes(key)
    );
    
    return incorrectOptions
      .map((key) => ({
        key,
        explanation: question.why_others_are_wrong?.[key] || 
          "This option is incorrect. Refer to the main explanation for more details.",
        wasSelected: selectedAnswers.includes(key)
      }))
      .filter(item => item.explanation); // Only show if explanation exists
  }, [submitted, selectedAnswers, question, optionKeys]);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-muted-foreground">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="flex items-center gap-2">
          <FlagButton
            questionId={question.question_id}
            currentFlagType={currentFlag?.flag_type}
            onFlag={async (flagType: FlagType, note?: string, suggestedAnswers?: string[]) => {
              await addFlag(question.question_id, {
                flag_type: flagType,
                note,
                suggested_correct_answers: suggestedAnswers,
              });
            }}
            onRemove={async () => {
              await removeFlag(question.question_id);
            }}
          />
          <span
            className={cn(
              "rounded-full px-3 py-1 text-xs font-medium",
              question.taxonomy.difficulty === "EASY" && "bg-success-light text-success",
              question.taxonomy.difficulty === "MEDIUM" && "bg-hook-light text-hook-foreground",
              question.taxonomy.difficulty === "HARD" && "bg-error-light text-error"
            )}
          >
            {question.taxonomy.difficulty}
          </span>
        </div>
      </div>

      {/* Question */}
      <div className="rounded-xl border bg-card p-5 shadow-sm">
        <p className="text-base leading-relaxed text-card-foreground">
          {question.question_text_raw}
        </p>
        {isMultiAnswer && (
          <p className="mt-3 text-sm font-medium text-primary">
            Select {question.correct_answers.length} answers
          </p>
        )}
      </div>

      {/* Options */}
      <div className="space-y-3">
        {optionKeys.map((key) => (
            <Button
            key={key}
            variant={getOptionVariant(key)}
            className="w-full h-auto min-h-[3rem] py-3 px-4"
            onClick={() => handleOptionClick(key)}
            disabled={submitted || mode === "revise"}
          >
            <span className="flex w-full items-start gap-3">
              <span className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border-2 text-sm font-semibold transition-colors mt-0.5",
                !submitted && selectedAnswers.includes(key) && "border-primary bg-primary text-primary-foreground",
                !submitted && !selectedAnswers.includes(key) && "border-border bg-background",
                submitted && question.correct_answers.includes(key) && "border-success bg-success text-success-foreground",
                submitted && selectedAnswers.includes(key) && !question.correct_answers.includes(key) && "border-error bg-error text-error-foreground"
              )}>
                {key}
              </span>
              <span className="flex-1 text-left break-words whitespace-normal leading-relaxed">{question.options_raw[key]}</span>
              <span className="shrink-0 mt-0.5">{getOptionIcon(key)}</span>
            </span>
          </Button>
        ))}
      </div>

      {/* Submit / Next Button */}
      {mode === "practice" && !submitted ? (
        <Button
          size="lg"
          className="w-full"
          onClick={handleSubmit}
          disabled={selectedAnswers.length === 0}
        >
          Submit Answer
        </Button>
      ) : mode === "practice" && submitted ? (
        <Button size="lg" className="w-full" onClick={handleNext}>
          Next Question
          <ChevronRight className="h-5 w-5" />
        </Button>
      ) : null}

      {/* Feedback Section - Show in practice mode after submission OR always in revise mode */}
      {(submitted || mode === "revise") && (
        <div className="animate-slide-up space-y-4">
          {/* Result Banner - Only show in practice mode */}
          {mode === "practice" && (
            <div
              className={cn(
                "flex items-center gap-3 rounded-xl p-4",
                isCorrect ? "bg-success-light" : "bg-error-light"
              )}
            >
              <div
                className={cn(
                  "rounded-full p-2",
                  isCorrect ? "bg-success/20" : "bg-error/20"
                )}
              >
                {isCorrect ? (
                  <Check className="h-5 w-5 text-success" />
                ) : (
                  <X className="h-5 w-5 text-error" />
                )}
              </div>
              <span
                className={cn(
                  "font-semibold",
                  isCorrect ? "text-success" : "text-error"
                )}
              >
                {isCorrect ? "Correct!" : "Incorrect"}
              </span>
            </div>
          )}

          {/* Explanation */}
          <div className="rounded-xl border bg-card p-4 shadow-sm">
            <h4 className="text-sm font-semibold text-muted-foreground">Explanation</h4>
            <p className="mt-2 text-sm leading-relaxed text-card-foreground">
              {question.explanation}
            </p>
          </div>

          {/* Why Others Are Wrong */}
          {wrongAnswerExplanations.length > 0 && (
            <div className="rounded-xl border border-muted bg-card p-4">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-muted-foreground" />
                <h4 className="text-sm font-semibold text-muted-foreground">
                  Why Other Options Are Incorrect
                </h4>
              </div>
              <div className="mt-3 space-y-3">
                {wrongAnswerExplanations.map(({ key, explanation, wasSelected }) => (
                  <div 
                    key={key} 
                    className={cn(
                      "rounded-lg p-3 text-sm leading-relaxed",
                      wasSelected ? "bg-error-light border border-error/20" : "bg-muted/50"
                    )}
                  >
                    <span className={cn(
                      "font-semibold",
                      wasSelected && "text-error"
                    )}>
                      Option {key}:
                    </span>{" "}
                    <span className="text-card-foreground">{explanation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Memory Hook */}
          <MemoryHook hook={question.memory_hook} />
        </div>
      )}
    </div>
  );
}
