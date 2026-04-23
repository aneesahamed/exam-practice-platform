import { useMemo } from "react";
import { CheckCircle2, XCircle, Target, TrendingDown } from "lucide-react";
import { StatCard } from "./StatCard";
import { mockQuestions } from "@/data/mockQuestions";
import { Difficulty } from "@/types/question";

interface SessionStats {
  correct: number;
  total: number;
  questionIds?: string[];
}

interface SessionSummaryProps {
  stats: SessionStats;
}

const TOPIC_LABELS: Record<string, string> = {
  storage: "Storage",
  compute: "Compute",
  networking: "Networking",
  security: "Security",
  databases: "Databases",
  serverless: "Serverless",
  "application-integration": "Application Integration",
  analytics: "Analytics",
  migration: "Migration",
  reliability: "Reliability",
  "identity-access": "Identity & Access",
};

export function SessionSummary({ stats }: SessionSummaryProps) {
  const accuracy = stats.total > 0 ? (stats.correct / stats.total) * 100 : 0;
  const incorrect = stats.total - stats.correct;

  // Calculate weakest difficulty based on session performance
  const weakestDifficulty = useMemo(() => {
    if (!stats.questionIds || stats.questionIds.length === 0) return null;

    const difficultyStats: Record<Difficulty, { correct: number; total: number }> = {
      EASY: { correct: 0, total: 0 },
      MEDIUM: { correct: 0, total: 0 },
      HARD: { correct: 0, total: 0 },
    };

    // This is a simplified calculation - in practice you'd track which questions were correct
    // For now, we'll base it on overall question difficulty distribution
    stats.questionIds.forEach((qId, index) => {
      const question = mockQuestions.find((q) => q.question_id === qId);
      if (question) {
        const difficulty = question.taxonomy.difficulty;
        difficultyStats[difficulty].total++;
      }
    });

    // Find the difficulty with the lowest accuracy (only if there are attempts)
    let weakest: Difficulty | null = null;
    let lowestAccuracy = 100;

    (["EASY", "MEDIUM", "HARD"] as Difficulty[]).forEach((diff) => {
      if (difficultyStats[diff].total > 0) {
        // For now just check if there were questions at this level
        // A more sophisticated approach would track per-question correctness
        if (!weakest) weakest = diff;
      }
    });

    return weakest;
  }, [stats.questionIds]);

  return (
    <div className="space-y-6">
      {/* Score Banner */}
      <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
        <p className="text-sm font-medium text-muted-foreground mb-2">Your Score</p>
        <p className="text-4xl font-bold text-foreground">
          {stats.correct} / {stats.total}
        </p>
        <p className="text-2xl font-semibold text-primary mt-1">
          {Math.round(accuracy)}%
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <StatCard
          label="Correct"
          value={stats.correct}
          icon={CheckCircle2}
          variant="success"
        />
        <StatCard
          label="Incorrect"
          value={incorrect}
          icon={XCircle}
          variant={incorrect > 0 ? "warning" : "default"}
        />
      </div>

      {/* Weakest Area Highlight */}
      {incorrect > 0 && (
        <div className="rounded-xl border border-hook/20 bg-hook/5 p-4">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-hook/20 p-2">
              <TrendingDown className="h-5 w-5 text-hook" />
            </div>
            <div>
              <h3 className="font-semibold text-hook">Keep Practicing</h3>
              <p className="text-sm text-muted-foreground">
                {incorrect} question{incorrect !== 1 ? "s" : ""} added to your retry list
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
