import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Header";
import { StatCard } from "@/components/StatCard";
import { ProgressBar } from "@/components/ProgressBar";
import { Button } from "@/components/ui/button";
import { useProgress } from "@/hooks/useProgress";
import { useSession } from "@/hooks/useSession";
import { useQuestionsContext } from "@/context/QuestionsContext";
import { useAuth } from "@/context/AuthContext";
import { mockQuestions } from "@/data/mockQuestions";
import { Target, CheckCircle, XCircle, Award, Trash2, Cloud, HardDrive } from "lucide-react";
import { cn } from "@/lib/utils";

const TOPIC_LABELS: Record<string, string> = {
  storage: "Storage",
  compute: "Compute",
  networking: "Networking",
  security: "Security",
  databases: "Databases",
  serverless: "Serverless",
  "application-integration": "App Integration",
  analytics: "Analytics",
  migration: "Migration",
  reliability: "Reliability",
  "identity-access": "Identity & Access",
};
export default function Progress() {
  const navigate = useNavigate();
  const { questions: realQuestions } = useQuestionsContext();
  const { user } = useAuth();
  const allQuestions = realQuestions.length > 0 ? realQuestions : mockQuestions;
  const { getStats, resetProgress } = useProgress(allQuestions.length);
  const { clearSession } = useSession();
  const stats = getStats();

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all progress? This cannot be undone.")) {
      resetProgress(); // Clear progress data
      clearSession();  // Clear active session
      navigate("/");
    }
  };

  const difficulties = [
    { key: "EASY" as const, label: "Easy", color: "success" },
    { key: "MEDIUM" as const, label: "Medium", color: "hook" },
    { key: "HARD" as const, label: "Hard", color: "error" },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header title="Progress" showBack />

      <main className="container py-6 space-y-6">
        {/* Sync Status Banner */}
        {user && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-blue-50 border border-blue-200">
            <Cloud className="h-4 w-4 text-blue-600" />
            <span className="text-sm text-blue-700 font-medium">
              Progress synced to cloud
            </span>
          </div>
        )}
        {!user && (
          <div className="flex items-center gap-2 px-4 py-3 rounded-lg bg-gray-50 border border-gray-200">
            <HardDrive className="h-4 w-4 text-gray-600" />
            <span className="text-sm text-gray-700">
              Progress saved locally. <button onClick={() => navigate('/login')} className="text-blue-600 hover:underline font-medium">Sign in</button> to sync across devices.
            </span>
          </div>
        )}

        {/* Overview */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Overview
          </h2>
          <div className="grid grid-cols-2 gap-3">
            <StatCard
              label="Attempted"
              value={`${stats.attemptedCount}/${stats.totalQuestions}`}
              icon={Target}
              variant="primary"
            />
            <StatCard
              label="Accuracy"
              value={`${Math.round(stats.accuracy)}%`}
              icon={stats.accuracy >= 70 ? Award : Target}
              variant={stats.accuracy >= 70 ? "success" : "default"}
            />
            <StatCard
              label="Correct"
              value={stats.correctCount}
              icon={CheckCircle}
              variant="success"
            />
            <StatCard
              label="Incorrect"
              value={stats.incorrectCount}
              icon={XCircle}
              variant="warning"
            />
          </div>
        </section>

        {/* Progress Bar */}
        <section className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
            <span className="text-lg font-bold text-primary">
              {Math.round(stats.progressPercent)}%
            </span>
          </div>
          <ProgressBar value={stats.progressPercent} variant="primary" size="lg" />
        </section>

        {/* By Difficulty */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            By Difficulty
          </h2>
          <div className="space-y-3">
            {difficulties.map(({ key, label, color }) => {
              const data = stats.statsByDifficulty[key];
              const accuracy = data.attempted > 0 ? (data.correct / data.attempted) * 100 : 0;

              return (
                <div key={key} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          "h-2.5 w-2.5 rounded-full",
                          color === "success" && "bg-success",
                          color === "hook" && "bg-hook",
                          color === "error" && "bg-error"
                        )}
                      />
                      <span className="font-medium">{label}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {data.correct}/{data.attempted} correct
                      </span>
                    </div>
                  </div>
                  <ProgressBar
                    value={accuracy}
                    variant={color === "success" ? "success" : "primary"}
                    size="sm"
                  />
                  <div className="mt-1 text-right text-xs text-muted-foreground">
                    {Math.round(accuracy)}% accuracy
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* By Topic */}
        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            By Topic
          </h2>
          <div className="space-y-3">
            {Object.entries(stats.statsByTopic).map(([topic, data]) => {
              const accuracy = data.attempted > 0 ? (data.correct / data.attempted) * 100 : 0;
              const topicLabel = TOPIC_LABELS[topic] || topic;

              return (
                <div key={topic} className="rounded-xl border bg-card p-4 shadow-sm">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="font-medium capitalize">{topicLabel}</span>
                    <div className="text-right">
                      <span className="text-sm text-muted-foreground">
                        {data.correct}/{data.total} correct
                      </span>
                    </div>
                  </div>
                  <ProgressBar
                    value={data.total > 0 ? (data.correct / data.total) * 100 : 0}
                    variant="primary"
                    size="sm"
                  />
                  <div className="mt-1 flex justify-between text-xs text-muted-foreground">
                    <span>{data.attempted} attempted</span>
                    <span>{data.attempted > 0 ? `${Math.round(accuracy)}% accuracy` : "Not started"}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* Mastered Questions */}
        {stats.masteredCount > 0 && (
          <section className="rounded-xl border border-success/20 bg-success-light p-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-success/20 p-2">
                <Award className="h-5 w-5 text-success" />
              </div>
              <div>
                <h3 className="font-semibold text-success">Mastered Questions</h3>
                <p className="text-sm text-muted-foreground">
                  {stats.masteredCount} question{stats.masteredCount > 1 ? "s" : ""} you got wrong
                  then correct
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Reset Progress */}
        <section className="pt-4">
          <Button
            variant="outline"
            className="w-full text-muted-foreground hover:text-error hover:border-error"
            onClick={handleReset}
          >
            <Trash2 className="h-4 w-4" />
            Reset All Progress
          </Button>
        </section>
      </main>
    </div>
  );
}
