import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { QuestionCard } from "@/components/QuestionCard";
import { ExplanationPanel } from "@/components/ExplanationPanel";
import { Header } from "@/components/Header";
import { EmptyState } from "@/components/EmptyState";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { Button } from "@/components/ui/button";
import { useQuestionsContext } from "@/context/QuestionsContext";
import { mockQuestions } from "@/data/mockQuestions";
import { ChevronLeft, ChevronRight, Home, BookOpen } from "lucide-react";

export default function Revise() {
  const navigate = useNavigate();
  const { questions: realQuestions, loading, error, retry } = useQuestionsContext();
  
  // Use real questions if available, fallback to mock
  const questions = realQuestions.length > 0 ? realQuestions : mockQuestions;
  
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showExplanation, setShowExplanation] = useState(true);

  const currentQuestion = questions[currentIndex];

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handleJumpTo = (questionNumber: number) => {
    const index = questionNumber - 1;
    if (index >= 0 && index < questions.length) {
      setCurrentIndex(index);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Quick Revise" showBack />
        <main className="container py-6">
          <LoadingState message="Loading questions..." />
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Quick Revise" showBack />
        <main className="container py-6">
          <ErrorState
            title="Failed to load questions"
            message={error}
            onRetry={retry}
          />
        </main>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Quick Revise" showBack />
        <main className="container py-6">
          <EmptyState
            icon={BookOpen}
            title="No Questions Available"
            description="There are no questions to revise. Please check back later."
            action={{
              label: "Go Home",
              onClick: () => navigate("/"),
            }}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <Header title="Quick Revise" showBack />

      <main className="container py-6">
        {/* Top Controls */}
        <div className="mb-6 rounded-xl border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-foreground">Quick Revise Mode</h3>
              <p className="text-sm text-muted-foreground">
                Browse answers without affecting your progress
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm font-medium text-muted-foreground">
                Question {currentIndex + 1} of {questions.length}
              </span>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevious}
              disabled={currentIndex === 0}
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>

            {/* Jump to Question */}
            <div className="flex-1 flex items-center gap-2">
              <label htmlFor="jump-to" className="text-sm text-muted-foreground whitespace-nowrap">
                Jump to:
              </label>
              <input
                id="jump-to"
                type="number"
                min="1"
                max={questions.length}
                value={currentIndex + 1}
                onChange={(e) => handleJumpTo(parseInt(e.target.value) || 1)}
                className="w-20 rounded-md border bg-background px-3 py-1 text-sm"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              disabled={currentIndex === questions.length - 1}
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          {/* Toggle Explanation */}
          <div className="mt-4 pt-4 border-t">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={showExplanation}
                onChange={(e) => setShowExplanation(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300"
              />
              <span className="text-sm text-muted-foreground">
                Show explanation and reasoning
              </span>
            </label>
          </div>
        </div>

        {/* Question Display */}
        {currentQuestion && (
          <div className="space-y-6">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentIndex + 1}
              totalQuestions={questions.length}
              mode="revise"
            />

            {/* Explanation Panel */}
            {showExplanation && (
              <ExplanationPanel
                explanation={currentQuestion.explanation}
                whyOthersWrong={currentQuestion.why_others_are_wrong}
                correctAnswers={currentQuestion.correct_answers}
                options={currentQuestion.options_raw}
              />
            )}
          </div>
        )}

        {/* Bottom Navigation */}
        <div className="mt-8 flex gap-3">
          <Button
            variant="outline"
            size="lg"
            onClick={handlePrevious}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/")}
            className="flex-1"
          >
            <Home className="h-4 w-4" />
            Home
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={handleNext}
            disabled={currentIndex === questions.length - 1}
            className="flex-1"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </main>
    </div>
  );
}
