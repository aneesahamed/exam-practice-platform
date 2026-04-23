import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Difficulty } from "@/types/question";
import { useQuestionsContext } from "@/context/QuestionsContext";
import { Play, X } from "lucide-react";

interface PracticeFiltersProps {
  onStart: (filters: { topics: string[]; difficulties: Difficulty[] }) => void;
  onCancel: () => void;
}

// Get unique topics from questions
const getAvailableTopics = (questions: any[]) => {
  const topics = new Set<string>();
  questions.forEach((q) => {
    if (q.taxonomy?.primary_topic_id) {
      topics.add(q.taxonomy.primary_topic_id);
    }
  });
  return Array.from(topics).sort();
};

const DIFFICULTIES: Difficulty[] = ["EASY", "MEDIUM", "HARD"];

const topicLabels: Record<string, string> = {
  storage: "Storage",
  databases: "Databases",
  compute: "Compute",
  security: "Security",
  networking: "Networking",
  migration: "Migration",
  integration: "App Integration",
  analytics: "Analytics",
  serverless: "Serverless",
  identity_and_access: "Identity & Access",
  cost_optimization: "Cost Optimization",
  high_availability: "Reliability",
  governance: "Governance",
  performance: "Performance",
  monitoring: "Monitoring",
  scalability: "Scalability",
  devops: "DevOps",
};

const difficultyColors: Record<Difficulty, string> = {
  EASY: "bg-success/10 text-success border-success/20 hover:bg-success/20",
  MEDIUM: "bg-hook/10 text-hook border-hook/20 hover:bg-hook/20",
  HARD: "bg-destructive/10 text-destructive border-destructive/20 hover:bg-destructive/20",
};

export function PracticeFilters({ onStart, onCancel }: PracticeFiltersProps) {
  const { questions } = useQuestionsContext();
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [selectedDifficulties, setSelectedDifficulties] = useState<Difficulty[]>([]);

  const availableTopics = getAvailableTopics(questions);

  const toggleTopic = (topic: string) => {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  };

  const toggleDifficulty = (difficulty: Difficulty) => {
    setSelectedDifficulties((prev) =>
      prev.includes(difficulty)
        ? prev.filter((d) => d !== difficulty)
        : [...prev, difficulty]
    );
  };

  // Count questions matching current filters
  const matchingCount = questions.filter((q) => {
    const topicMatch =
      selectedTopics.length === 0 || selectedTopics.includes(q.taxonomy?.primary_topic_id || '');
    const difficultyMatch =
      selectedDifficulties.length === 0 || selectedDifficulties.includes(q.taxonomy?.difficulty as Difficulty);
    return topicMatch && difficultyMatch;
  }).length;

  const handleStart = () => {
    onStart({ topics: selectedTopics, difficulties: selectedDifficulties });
  };

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold text-foreground">Practice by Focus</h3>
        <Button variant="ghost" size="icon" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Difficulty Filter */}
      <div className="mb-4">
        <p className="mb-2 text-sm font-medium text-muted-foreground">Difficulty</p>
        <div className="flex flex-wrap gap-2">
          {DIFFICULTIES.map((difficulty) => (
            <Badge
              key={difficulty}
              variant="outline"
              className={`cursor-pointer transition-colors ${
                selectedDifficulties.includes(difficulty)
                  ? difficultyColors[difficulty]
                  : "hover:bg-muted"
              }`}
              onClick={() => toggleDifficulty(difficulty)}
            >
              {difficulty.charAt(0) + difficulty.slice(1).toLowerCase()}
            </Badge>
          ))}
        </div>
      </div>

      {/* Topic Filter */}
      <div className="mb-5">
        <p className="mb-2 text-sm font-medium text-muted-foreground">Topic</p>
        <div className="flex flex-wrap gap-2">
          {availableTopics.map((topic) => (
            <Badge
              key={topic}
              variant="outline"
              className={`cursor-pointer transition-colors ${
                selectedTopics.includes(topic)
                  ? "bg-primary/10 text-primary border-primary/20"
                  : "hover:bg-muted"
              }`}
              onClick={() => toggleTopic(topic)}
            >
              {topicLabels[topic] || topic}
            </Badge>
          ))}
        </div>
      </div>

      {/* Start Button */}
      <Button onClick={handleStart} className="w-full" size="lg" disabled={matchingCount === 0}>
        <Play className="h-4 w-4" />
        Start Practice ({matchingCount} question{matchingCount !== 1 ? "s" : ""})
      </Button>
    </div>
  );
}
