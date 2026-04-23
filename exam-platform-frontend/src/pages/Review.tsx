import { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { QuestionCard } from "@/components/QuestionCard";
import { Header } from "@/components/Header";
import { EmptyState } from "@/components/EmptyState";
import { ProgressBar } from "@/components/ProgressBar";
import { SessionSummary } from "@/components/SessionSummary";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/useProgress";
import { mockQuestions } from "@/data/mockQuestions";
import { useQuestionsContext } from "@/context/QuestionsContext";
import { Home, RotateCcw, PartyPopper } from "lucide-react";

export default function Review() {
  const navigate = useNavigate();
  const { questions: realQuestions } = useQuestionsContext();

  const allQuestions = realQuestions.length > 0 ? realQuestions : mockQuestions;
  const { recordAttempt, getIncorrectQuestionIds } = useProgress(allQuestions.length);
  const incorrectIds = getIncorrectQuestionIds();
  const reviewQuestions = useMemo(
    () => allQuestions.filter((q) => incorrectIds.includes(q.question_id)),
    [incorrectIds, allQuestions]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });

  const currentQuestion = reviewQuestions[currentIndex];

  const handleSubmit = useCallback(
    (selectedAnswers: string[], isCorrect: boolean) => {
      recordAttempt({
        question_id: currentQuestion.question_id,
        selected_answers: selectedAnswers,
        is_correct: isCorrect,
        attempted_at: Date.now(),
      });

      setSessionStats((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
    },
    [currentQuestion, recordAttempt]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < reviewQuestions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setSessionComplete(true);
    }
  }, [currentIndex, reviewQuestions.length]);

  // Empty state - no questions to review
  if (reviewQuestions.length === 0 && !sessionComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Retry Incorrect" showBack />
        <main className="container py-6">
          <EmptyState
            icon={PartyPopper}
            title="All Caught Up!"
            description="You don't have any incorrect questions to review. Keep practicing!"
            variant="success"
            action={{
              label: "Start Practice",
              onClick: () => navigate("/practice"),
            }}
          />
        </main>
      </div>
    );
  }

  if (sessionComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Retry Complete" />
        <main className="container py-6">
          <SessionSummary stats={sessionStats} />
          <div className="mt-6 space-y-3">
            <Button className="w-full" onClick={() => navigate("/")}>
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
            {incorrectIds.length > 0 && (
              <Button
                variant="outline"
                className="w-full"
                onClick={() => {
                  setCurrentIndex(0);
                  setSessionComplete(false);
                  setSessionStats({ correct: 0, total: 0 });
                }}
              >
                <RotateCcw className="h-4 w-4" />
                Retry Remaining ({incorrectIds.length})
              </Button>
            )}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header
        title="Retry Incorrect"
        showBack
        rightAction={
          <span className="text-sm font-medium text-muted-foreground">
            {sessionStats.correct}/{sessionStats.total}
          </span>
        }
      />
      
      {/* Session Progress */}
      <div className="container py-3">
        <ProgressBar
          value={currentIndex + 1}
          max={reviewQuestions.length}
          variant="primary"
          size="sm"
        />
      </div>

      <main className="container pb-8">
        <QuestionCard
          key={currentQuestion.question_id}
          question={currentQuestion}
          onSubmit={handleSubmit}
          onNext={handleNext}
          questionNumber={currentIndex + 1}
          totalQuestions={reviewQuestions.length}
        />
      </main>
    </div>
  );
}
