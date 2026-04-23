import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFlags } from "../hooks/useFlags";
import { FlagType } from "../api/flags";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Bookmark, AlertCircle, MessageSquare, Star, Trash2, PlayCircle, Flag } from "lucide-react";
import { LoadingState } from "../components/LoadingState";
import { ErrorState } from "../components/ErrorState";
import { EmptyState } from "../components/EmptyState";

const FLAG_CONFIGS = {
  REVIEW: {
    label: "Review",
    icon: Bookmark,
    color: "bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300",
  },
  WRONG_ANSWER: {
    label: "Wrong Answer",
    icon: AlertCircle,
    color: "bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300",
  },
  BAD_QUESTION: {
    label: "Bad Question",
    icon: MessageSquare,
    color: "bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300",
  },
  GOLDEN_NOTE: {
    label: "Golden Note",
    icon: Star,
    color: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300",
  },
} as const;

export default function FlagsPage() {
  const navigate = useNavigate();
  const [selectedTab, setSelectedTab] = useState<FlagType | "all">("all");
  const { flags, summary, loading, loadFlags, loadSummary, removeFlag } = useFlags();

  useEffect(() => {
    loadSummary();
    loadFlags();
  }, []);

  const handleTabChange = (value: string) => {
    const tab = value as FlagType | "all";
    setSelectedTab(tab);
    if (tab === "all") {
      loadFlags();
    } else {
      loadFlags(tab);
    }
  };

  const handlePracticeQuestion = (questionId: string) => {
    // Navigate to practice page with this specific question
    // TODO: Update this route based on your actual routing structure
    navigate(`/practice?question=${questionId}`);
  };

  const handleRemoveFlag = async (questionId: string) => {
    await removeFlag(questionId);
    // Reload flags after removal
    if (selectedTab === "all") {
      loadFlags();
    } else {
      loadFlags(selectedTab);
    }
    loadSummary();
  };

  if (loading && flags.length === 0) {
    return <LoadingState message="Loading flagged questions..." />;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Flagged Questions</h1>
        <p className="text-muted-foreground">
          Review, track wrong answers, report bad questions, and save golden notes
        </p>
      </div>

      <Tabs value={selectedTab} onValueChange={handleTabChange} className="space-y-6">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="all" className="flex items-center gap-2">
            All
            {summary && (
              <Badge variant="secondary" className="ml-1">
                {Object.values(summary).reduce((a, b) => a + b, 0)}
              </Badge>
            )}
          </TabsTrigger>
          {Object.entries(FLAG_CONFIGS).map(([type, config]) => {
            const Icon = config.icon;
            return (
              <TabsTrigger key={type} value={type} className="flex items-center gap-2">
                <Icon className="h-4 w-4" />
                {config.label}
                {summary && summary[type as FlagType] > 0 && (
                  <Badge variant="secondary" className="ml-1">
                    {summary[type as FlagType]}
                  </Badge>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <TabsContent value={selectedTab} className="space-y-4">
          {flags.length === 0 ? (
            <EmptyState
              icon={selectedTab === "all" ? Flag : FLAG_CONFIGS[selectedTab as FlagType]?.icon || Flag}
              title={
                selectedTab === "all"
                  ? "No flagged questions"
                  : `No ${FLAG_CONFIGS[selectedTab as FlagType]?.label.toLowerCase()} flags`
              }
              description={
                selectedTab === "all"
                  ? "Flag questions while practicing to track them here"
                  : `Flag questions as ${FLAG_CONFIGS[selectedTab as FlagType]?.label.toLowerCase()} to see them here`
              }
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {flags.map((flag) => {
                const config = FLAG_CONFIGS[flag.flag_type];
                const Icon = config.icon;
                return (
                  <Card key={flag.question_id} className="hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`p-2 rounded-lg ${config.color}`}>
                            <Icon className="h-4 w-4" />
                          </div>
                          <div>
                            <CardTitle className="text-sm font-medium">{config.label}</CardTitle>
                            <CardDescription className="text-xs">
                              {new Date(flag.updated_at).toLocaleDateString()}
                            </CardDescription>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveFlag(flag.question_id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-2 text-sm">
                        <span className="font-mono font-medium text-muted-foreground">
                          {flag.question_id}
                        </span>
                      </div>

                      {flag.note && (
                        <div className="text-sm bg-muted p-3 rounded-md">
                          <p className="font-medium mb-1">Note:</p>
                          <p className="text-muted-foreground whitespace-pre-wrap">{flag.note}</p>
                        </div>
                      )}

                      {flag.suggested_correct_answers && flag.suggested_correct_answers.length > 0 && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">Suggested answers:</span>
                          <div className="flex gap-1">
                            {flag.suggested_correct_answers.map((answer) => (
                              <Badge key={answer} variant="outline" className="font-mono">
                                {answer}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button
                        className="w-full mt-2"
                        variant="outline"
                        onClick={() => handlePracticeQuestion(flag.question_id)}
                      >
                        <PlayCircle className="h-4 w-4 mr-2" />
                        Practice This Question
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
