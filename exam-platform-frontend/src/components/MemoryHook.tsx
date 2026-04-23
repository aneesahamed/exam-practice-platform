import { Lightbulb } from "lucide-react";

interface MemoryHookProps {
  hook: string;
}

export function MemoryHook({ hook }: MemoryHookProps) {
  return (
    <div className="animate-fade-in rounded-xl border-2 border-hook/30 bg-hook-light p-4">
      <div className="flex items-start gap-3">
        <div className="rounded-lg bg-hook/20 p-2">
          <Lightbulb className="h-5 w-5 text-hook" />
        </div>
        <div>
          <h4 className="text-sm font-semibold text-hook-foreground">Memory Hook</h4>
          <p className="mt-1 text-sm leading-relaxed text-hook-foreground/80">{hook}</p>
        </div>
      </div>
    </div>
  );
}
