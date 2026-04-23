import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Play, RotateCcw, BarChart3, BookOpen, Target, LogOut, User, Eye, Flag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatCard } from "@/components/StatCard";
import { ProgressBar } from "@/components/ProgressBar";
import { ResumeSessionPrompt } from "@/components/ResumeSessionPrompt";
import { PracticeFilters } from "@/components/PracticeFilters";
import { LoadingState } from "@/components/LoadingState";
import { ErrorState } from "@/components/ErrorState";
import { ThemeToggle } from "@/components/theme-toggle";
import { RestartFromDialog } from "@/components/RestartFromDialog";
import { useProgress } from "@/hooks/useProgress";
import { useSession } from "@/hooks/useSession";
import { useQuestionsContext } from "@/context/QuestionsContext";
import { useAuth } from "@/context/AuthContext";
import { examInfo, mockQuestions } from "@/data/mockQuestions";
import { Difficulty } from "@/types/question";

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const Index = () => {
  const navigate = useNavigate();
  const { session, hasUnfinishedSession, startSession, clearSession, restartFromQuestion } = useSession();
  const { user, signOut } = useAuth();
  
  // Fetch real questions from backend via context
  const { questions: realQuestions, loading, error, retry } = useQuestionsContext();
  
  // Use real questions if available, fallback to mock
  const questions = realQuestions.length > 0 ? realQuestions : mockQuestions;
  const totalQuestions = questions.length;
  
  // Pass the actual question count to useProgress
  const { getStats, resetProgress, deleteAttemptsForQuestions, progress } = useProgress(totalQuestions);
  
  // Always get fresh stats (not memoized) - recalculates on every render
  // This ensures we see the latest progress when navigating back from Practice
  const stats = getStats();

  const [showFilters, setShowFilters] = useState(false);
  const [restartDialogOpen, setRestartDialogOpen] = useState(false);

  const handleStartNewPractice = () => {
    // Keep questions in the order received from backend (sorted by sequential number)
    const questionIds = questions.map((q) => q.question_id);
    startSession(questionIds);
    navigate("/practice");
  };

  const handleResume = () => {
    navigate("/practice");
  };

  const handleStartFiltered = (filters: { topics: string[]; difficulties: Difficulty[] }) => {
    const filtered = questions.filter((q) => {
      const topicMatch =
        filters.topics.length === 0 || filters.topics.includes(q.taxonomy.primary_topic_id);
      const difficultyMatch =
        filters.difficulties.length === 0 || filters.difficulties.includes(q.taxonomy.difficulty);
      return topicMatch && difficultyMatch;
    });

    // Keep questions in sequential order (no shuffle)
    const questionIds = filtered.map((q) => q.question_id);
    startSession(questionIds, filters);
    navigate("/practice");
  };

  const handleRestartFrom = (questionNumber: number) => {
    if (!session) return;
    
    const success = restartFromQuestion(
      questionNumber,
      deleteAttemptsForQuestions,
      progress.attempts
    );
    
    if (success) {
      navigate("/practice");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card">
        <div className="container py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-3">
                <BookOpen className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">{examInfo.short_name}</h1>
                <p className="text-sm text-muted-foreground">{examInfo.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {user ? (
                <>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <User className="h-4 w-4" />
                    <span>{user.username}</span>
                  </div>
                  <Button variant="outline" size="sm" onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" />
                    Sign Out
                  </Button>
                </>
              ) : (
                <Button variant="outline" size="sm" onClick={() => navigate("/login")}>
                  Sign In
                </Button>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container py-6">
        {/* Loading State */}
        {loading && (
          <LoadingState message="Fetching questions from backend..." />
        )}

        {/* Error State */}
        {error && !loading && (
          <ErrorState
            title="Failed to load questions"
            message={error}
            onRetry={retry}
          />
        )}

        {/* Main Content - Only show when not loading and no error */}
        {!loading && !error && (
          <>
            {/* Resume Session Prompt */}
            {hasUnfinishedSession && session && !showFilters && (
              <section className="mb-6">
                <ResumeSessionPrompt
                  session={session}
                  onResume={handleResume}
                  onStartNew={() => {
                    clearSession();
                    // Note: We clear the session but keep progress history
                    // If you want to also reset progress, uncomment below:
                    // resetProgress();
                    handleStartNewPractice();
                  }}
                  onRestartFrom={() => setRestartDialogOpen(true)}
                />
              </section>
            )}

            {/* Practice Filters */}
            {showFilters && (
              <section className="mb-6">
                <PracticeFilters
                  onStart={handleStartFiltered}
                  onCancel={() => setShowFilters(false)}
                />
              </section>
            )}

        {/* Progress Overview */}
        <section className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Your Progress
          </h2>
          <div className="rounded-2xl border bg-card p-5 shadow-sm">
            <div className="mb-4 flex items-end justify-between">
              <div>
                <span className="text-3xl font-bold text-foreground">
                  {Math.round(stats.progressPercent)}%
                </span>
                <p className="text-sm text-muted-foreground">
                  {stats.attemptedCount} of {totalQuestions} questions attempted
                </p>
              </div>
              <div className="text-right">
                <span className="text-2xl font-bold text-success">
                  {Math.round(stats.accuracy)}%
                </span>
                <p className="text-sm text-muted-foreground">Accuracy</p>
              </div>
            </div>
            <ProgressBar value={stats.progressPercent} variant="primary" size="lg" />
          </div>
        </section>

        {/* Stats Grid */}
        <section className="mb-8 grid grid-cols-2 gap-3">
          <StatCard
            label="Correct"
            value={stats.correctCount}
            variant="success"
          />
          <StatCard
            label="To Review"
            value={stats.incorrectCount}
            variant="warning"
          />
        </section>

        {/* Actions */}
        <section className="space-y-3">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Practice
          </h2>

          {!hasUnfinishedSession && !showFilters && (
            <Button
              variant="nav"
              className="w-full"
              onClick={handleStartNewPractice}
            >
              <div className="rounded-lg bg-primary/10 p-2">
                <Play className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 text-left">
                <span className="block font-semibold">Start Practice</span>
                <span className="text-sm text-muted-foreground">
                  {loading ? "Loading..." : `${totalQuestions} questions available`}
                </span>
              </div>
            </Button>
          )}

          {!showFilters && (
            <Button
              variant="nav"
              className="w-full"
              onClick={() => setShowFilters(true)}
            >
              <div className="rounded-lg bg-secondary p-2">
                <Target className="h-5 w-5 text-secondary-foreground" />
              </div>
              <div className="flex-1 text-left">
                <span className="block font-semibold">Practice by Focus</span>
                <span className="text-sm text-muted-foreground">
                  Filter by topic or difficulty
                </span>
              </div>
            </Button>
          )}

          <Button
            variant="nav"
            className="w-full"
            onClick={() => navigate("/review")}
            disabled={stats.incorrectCount === 0}
          >
            <div className="rounded-lg bg-hook/10 p-2">
              <RotateCcw className="h-5 w-5 text-hook" />
            </div>
            <div className="flex-1 text-left">
              <span className="block font-semibold">Retry Incorrect</span>
              <span className="text-sm text-muted-foreground">
                {stats.incorrectCount} question{stats.incorrectCount !== 1 ? "s" : ""} to retry
              </span>
            </div>
          </Button>

          <Button
            variant="nav"
            className="w-full"
            onClick={() => navigate("/revise")}
          >
            <div className="rounded-lg bg-primary/10 p-2">
              <Eye className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 text-left">
              <span className="block font-semibold">Quick Revise</span>
              <span className="text-sm text-muted-foreground">
                Browse answers fast (ideal before exam)
              </span>
            </div>
          </Button>

          <Button
            variant="nav"
            className="w-full"
            onClick={() => navigate("/flags")}
          >
            <div className="rounded-lg bg-amber-100 dark:bg-amber-900/20 p-2">
              <Flag className="h-5 w-5 text-amber-600 dark:text-amber-500" />
            </div>
            <div className="flex-1 text-left">
              <span className="block font-semibold">Flagged Questions</span>
              <span className="text-sm text-muted-foreground">
                Review flagged items and notes
              </span>
            </div>
          </Button>

          <Button
            variant="nav"
            className="w-full"
            onClick={() => navigate("/progress")}
          >
            <div className="rounded-lg bg-muted p-2">
              <BarChart3 className="h-5 w-5 text-muted-foreground" />
            </div>
            <div className="flex-1 text-left">
              <span className="block font-semibold">View Progress</span>
              <span className="text-sm text-muted-foreground">
                Stats by difficulty and topic
              </span>
            </div>
          </Button>
        </section>
          </>
        )}

        {/* Restart From Dialog */}
        {session && (
          <RestartFromDialog
            open={restartDialogOpen}
            onOpenChange={setRestartDialogOpen}
            currentIndex={session.currentIndex}
            onConfirm={handleRestartFrom}
          />
        )}
      </main>
    </div>
  );
};

export default Index;
