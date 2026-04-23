import { Button } from "@/components/ui/button";
import { Play, RefreshCw, RotateCcw } from "lucide-react";
import { SessionState } from "@/hooks/useSession";

interface ResumeSessionPromptProps {
  session: SessionState;
  onResume: () => void;
  onStartNew: () => void;
  onRestartFrom?: () => void;
}

export function ResumeSessionPrompt({ session, onResume, onStartNew, onRestartFrom }: ResumeSessionPromptProps) {
  const remaining = session.questionIds.length - session.currentIndex;
  const answered = session.currentIndex;

  return (
    <div className="rounded-2xl border bg-card p-5 shadow-sm">
      <h3 className="mb-2 font-semibold text-foreground">Resume Your Session?</h3>
      <p className="mb-4 text-sm text-muted-foreground">
        You answered {answered} of {session.questionIds.length} questions
        {session.stats.total > 0 && (
          <span className="block mt-1">
            Score so far: {session.stats.correct}/{session.stats.total}
          </span>
        )}
      </p>
      
      <div className="flex gap-3">
        <Button 
          onClick={onResume} 
          className="flex-1"
          size="lg"
        >
          <Play className="h-4 w-4" />
          Resume ({remaining} left)
        </Button>
        {onRestartFrom && answered > 0 && (
          <Button 
            onClick={onRestartFrom} 
            variant="secondary"
            size="lg"
          >
            <RotateCcw className="h-4 w-4" />
            Restart
          </Button>
        )}
        <Button 
          onClick={onStartNew} 
          variant="outline"
          size="lg"
        >
          <RefreshCw className="h-4 w-4" />
          New
        </Button>
      </div>
    </div>
  );
}
