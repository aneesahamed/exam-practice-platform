import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RotateCcw } from "lucide-react";

interface RestartFromDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentIndex: number; // 0-based
  onConfirm: (questionNumber: number) => void; // 1-based
}

export function RestartFromDialog({
  open,
  onOpenChange,
  currentIndex,
  onConfirm,
}: RestartFromDialogProps) {
  const maxAllowed = currentIndex + 1; // Convert 0-based to 1-based
  const [value, setValue] = useState<string>(String(maxAllowed));

  const handleConfirm = () => {
    const num = parseInt(value, 10);
    if (Number.isFinite(num) && num >= 1 && num <= maxAllowed) {
      onConfirm(num);
      onOpenChange(false);
    }
  };

  const clamp = (n: number) => Math.min(Math.max(1, n), maxAllowed);

  const handleQuickSelect = (qNum: number) => {
    setValue(String(clamp(qNum)));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RotateCcw className="h-5 w-5" />
            Restart from Question
          </DialogTitle>
          <DialogDescription>
            Choose a question number between <strong>1</strong> and{" "}
            <strong>{maxAllowed}</strong>. All attempts from that point onward will be
            reset.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="question-number">Question Number</Label>
            <Input
              id="question-number"
              type="number"
              min={1}
              max={maxAllowed}
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  handleConfirm();
                }
              }}
              placeholder={`Enter 1-${maxAllowed}`}
            />
          </div>

          <div className="space-y-2">
            <Label>Quick Select</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(1)}
              >
                Start (1)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(maxAllowed - 10)}
                disabled={maxAllowed <= 10}
              >
                -10 ({Math.max(1, maxAllowed - 10)})
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleQuickSelect(maxAllowed)}
              >
                Current ({maxAllowed})
              </Button>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleConfirm}>Restart</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
