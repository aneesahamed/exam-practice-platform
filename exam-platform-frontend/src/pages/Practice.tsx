import { useState, useMemo, useCallback, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { QuestionCard } from "@/components/QuestionCard";
import { Header } from "@/components/Header";
import { EmptyState } from "@/components/EmptyState";
import { ProgressBar } from "@/components/ProgressBar";
import { SessionSummary } from "@/components/SessionSummary";
import { RestartFromDialog } from "@/components/RestartFromDialog";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/useProgress";
import { useSession } from "@/hooks/useSession";
import { useQuestionsContext } from "@/context/QuestionsContext";
import { mockQuestions } from "@/data/mockQuestions";
import { Home, RotateCcw, AlertCircle } from "lucide-react";

export default function Practice() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, updateSession, clearSession, restartFromQuestion } = useSession();
  
  // Get real questions from context
  const { questions: realQuestions } = useQuestionsContext();
  
  // Use real questions if available, fallback to mock
  const allQuestions = realQuestions.length > 0 ? realQuestions : mockQuestions;
  
  const { recordAttempt, deleteAttemptsForQuestions, progress } = useProgress(allQuestions.length);

  // Detect if we're in Retry Incorrect mode (hide restart button)
  const isRetryMode = location.pathname === "/review";

  const [restartDialogOpen, setRestartDialogOpen] = useState(false);

  // Get questions based on session
  const sessionQuestions = useMemo(() => {
    if (!session) return [];
    return session.questionIds
      .map((id) => allQuestions.find((q) => q.question_id === id))
      .filter(Boolean) as typeof allQuestions;
  }, [session, allQuestions]);

  const [currentIndex, setCurrentIndex] = useState(session?.currentIndex ?? 0);
  const [sessionComplete, setSessionComplete] = useState(false);
  const [sessionStats, setSessionStats] = useState(session?.stats ?? { correct: 0, total: 0 });

  // Sync currentIndex and stats with session when it changes (new session detected by startedAt)
  useEffect(() => {
    if (session) {
      setCurrentIndex(session.currentIndex);
      setSessionStats(session.stats);
      setSessionComplete(false); // Reset completion state
    }
  }, [session?.startedAt, session]); // Depend on startedAt to detect new sessions

  const currentQuestion = sessionQuestions[currentIndex];

  const handleSubmit = useCallback(
    (selectedAnswers: string[], isCorrect: boolean) => {
      if (!currentQuestion) return;

      recordAttempt({
        question_id: currentQuestion.question_id,
        selected_answers: selectedAnswers,
        is_correct: isCorrect,
        attempted_at: Date.now(),
      });

      const newStats = {
        correct: sessionStats.correct + (isCorrect ? 1 : 0),
        total: sessionStats.total + 1,
      };
      setSessionStats(newStats);
      updateSession(currentIndex, newStats);
    },
    [currentQuestion, recordAttempt, sessionStats, currentIndex, updateSession]
  );

  const handleNext = useCallback(() => {
    if (currentIndex < sessionQuestions.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      updateSession(nextIndex, sessionStats);
    } else {
      setSessionComplete(true);
      clearSession();
    }
  }, [currentIndex, sessionQuestions.length, updateSession, sessionStats, clearSession]);

  const handlePracticeAgain = () => {
    clearSession();
    navigate("/");
  };

  const handleRestartFrom = useCallback((questionNumber: number) => {
    if (!session) return;
    
    const success = restartFromQuestion(
      questionNumber,
      deleteAttemptsForQuestions,
      progress.attempts
    );
    
    if (success) {
      // Navigate to the restarted question
      setCurrentIndex(questionNumber - 1);
      setSessionStats(session.stats);
    }
  }, [session, restartFromQuestion, deleteAttemptsForQuestions, progress.attempts]);

  if (sessionComplete) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Session Complete" />
        <main className="container py-6">
          <SessionSummary stats={sessionStats} />
          <div className="mt-6 space-y-3">
            <Button className="w-full" onClick={() => navigate("/")}>
              <Home className="h-4 w-4" />
              Back to Home
            </Button>
            <Button
              variant="outline"
              className="w-full"
              onClick={handlePracticeAgain}
            >
              <RotateCcw className="h-4 w-4" />
              Practice Again
            </Button>
          </div>
        </main>
      </div>
    );
  }

  if (!session || sessionQuestions.length === 0) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Practice" showBack />
        <main className="container py-6">
          <EmptyState
            icon={AlertCircle}
            title="No Questions Available"
            description="There are no practice questions available. Please start a new session from the home screen."
            action={{
              label: "Go Home",
              onClick: () => navigate("/"),
            }}
          />
        </main>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background">
        <Header title="Practice" showBack />
        <main className="container py-6">
          <EmptyState
            icon={AlertCircle}
            title="Question Not Found"
            description="This question could not be loaded."
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
      <Header
        title="Practice"
        showBack
        rightAction={
          <div className="flex items-center gap-3">
            {!isRetryMode && session && currentIndex > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setRestartDialogOpen(true)}
              >
                <RotateCcw className="h-4 w-4 mr-1" />
                Restart
              </Button>
            )}
            <span className="text-sm font-medium text-muted-foreground">
              {sessionStats.correct}/{sessionStats.total}
            </span>
          </div>
        }
      />
      
      {/* Session Progress */}
      <div className="container py-3">
        <ProgressBar
          value={currentIndex + 1}
          max={sessionQuestions.length}
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
          totalQuestions={sessionQuestions.length}
        />
      </main>

      {/* Restart From Dialog */}
      {!isRetryMode && session && (
        <RestartFromDialog
          open={restartDialogOpen}
          onOpenChange={setRestartDialogOpen}
          currentIndex={currentIndex}
          onConfirm={handleRestartFrom}
        />
      )}
    </div>
  );
}
