import { CheckCircle2, XCircle } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface ExplanationPanelProps {
  explanation?: string;
  whyOthersWrong?: Record<string, string>;
  correctAnswers: string[];
  options: Record<string, string>;
}

export function ExplanationPanel({
  explanation,
  whyOthersWrong,
  correctAnswers,
  options,
}: ExplanationPanelProps) {
  // Filter to only show incorrect options that exist in options_raw
  const incorrectOptionsExplanations = Object.entries(whyOthersWrong || {})
    .filter(([key]) => !correctAnswers.includes(key) && key in options)
    .sort(([a], [b]) => a.localeCompare(b)); // Sort A-E

  const hasIncorrectExplanations = incorrectOptionsExplanations.length > 0;

  return (
    <div className="space-y-4">
      {/* Main Explanation */}
      {explanation && (
        <div className="rounded-lg border bg-success/5 p-4">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="h-5 w-5 shrink-0 text-success mt-0.5" />
            <div>
              <h4 className="font-semibold text-success mb-2">Explanation</h4>
              <p className="text-sm text-foreground leading-relaxed">{explanation}</p>
            </div>
          </div>
        </div>
      )}

      {/* Why Others Are Wrong - Only show if there are explanations for incorrect options */}
      {hasIncorrectExplanations && (
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="why-wrong" className="border rounded-lg">
            <AccordionTrigger className="px-4 hover:no-underline">
              <div className="flex items-center gap-2">
                <XCircle className="h-4 w-4 text-muted-foreground" />
                <span className="font-semibold text-sm">Why other options are wrong</span>
                <span className="text-xs text-muted-foreground">
                  ({incorrectOptionsExplanations.length} {incorrectOptionsExplanations.length === 1 ? 'option' : 'options'})
                </span>
              </div>
            </AccordionTrigger>
            <AccordionContent className="px-4 pb-4">
              <div className="space-y-3">
                {incorrectOptionsExplanations.map(([optionKey, reasoning]) => (
                  <div
                    key={optionKey}
                    className="rounded-md bg-muted/50 p-3 border border-border"
                  >
                    <div className="flex items-start gap-2">
                      <span className="font-bold text-sm text-muted-foreground shrink-0">
                        {optionKey}.
                      </span>
                      <div className="flex-1">
                        <p className="text-xs text-muted-foreground mb-1 line-clamp-2">
                          {options[optionKey]}
                        </p>
                        <p className="text-sm text-foreground leading-relaxed">
                          {reasoning}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      )}
    </div>
  );
}
