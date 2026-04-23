/**
 * FlagButton Component
 * Dropdown menu for flagging questions with different types
 */

import { useState } from 'react';
import { Flag, Bookmark, AlertCircle, MessageSquare, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { FlagType } from '@/api/flags';

interface FlagButtonProps {
  questionId: string;
  currentFlagType?: FlagType;
  onFlag: (flagType: FlagType, note?: string, suggestedAnswers?: string[]) => Promise<void>;
  onRemove: () => Promise<void>;
}

const FLAG_OPTIONS = [
  { type: 'REVIEW' as FlagType, icon: Bookmark, label: 'Review Later', color: 'text-blue-500' },
  { type: 'WRONG_ANSWER' as FlagType, icon: AlertCircle, label: 'Answer Seems Wrong', color: 'text-red-500' },
  { type: 'BAD_QUESTION' as FlagType, icon: MessageSquare, label: 'Bad Question', color: 'text-orange-500' },
  { type: 'GOLDEN_NOTE' as FlagType, icon: Star, label: 'Golden Note', color: 'text-yellow-500' },
];

export function FlagButton({ questionId, currentFlagType, onFlag, onRemove }: FlagButtonProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedType, setSelectedType] = useState<FlagType>('REVIEW');
  const [note, setNote] = useState('');
  const [suggestedAnswers, setSuggestedAnswers] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);

  const currentOption = FLAG_OPTIONS.find(opt => opt.type === currentFlagType);

  const handleSelectType = async (type: FlagType) => {
    if (type === 'WRONG_ANSWER') {
      // Open dialog for wrong answer with suggested answers
      setSelectedType(type);
      setNote('');
      setSuggestedAnswers(new Set());
      setDialogOpen(true);
    } else {
      // Direct flag for other types
      await onFlag(type);
    }
  };

  const handleSubmitWrongAnswer = async () => {
    if (suggestedAnswers.size === 0) {
      return;
    }
    setLoading(true);
    try {
      await onFlag(selectedType, note || undefined, Array.from(suggestedAnswers));
      setDialogOpen(false);
      setNote('');
      setSuggestedAnswers(new Set());
    } finally {
      setLoading(false);
    }
  };

  const toggleAnswer = (answer: string) => {
    setSuggestedAnswers(prev => {
      const newSet = new Set(prev);
      if (newSet.has(answer)) {
        newSet.delete(answer);
      } else {
        newSet.add(answer);
      }
      return newSet;
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant={currentFlagType ? 'default' : 'ghost'}
            size="sm"
            className="gap-2"
          >
            {currentOption ? (
              <>
                <currentOption.icon className={`h-4 w-4 ${currentOption.color}`} />
                <span className="hidden sm:inline">{currentOption.label}</span>
              </>
            ) : (
              <>
                <Flag className="h-4 w-4" />
                <span className="hidden sm:inline">Flag</span>
              </>
            )}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56">
          {FLAG_OPTIONS.map((option) => (
            <DropdownMenuItem
              key={option.type}
              onClick={() => handleSelectType(option.type)}
              className={currentFlagType === option.type ? 'bg-accent' : ''}
            >
              <option.icon className={`mr-2 h-4 w-4 ${option.color}`} />
              <span>{option.label}</span>
            </DropdownMenuItem>
          ))}
          {currentFlagType && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onRemove} className="text-red-600">
                <Flag className="mr-2 h-4 w-4" />
                <span>Remove Flag</span>
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Report Wrong Answer</DialogTitle>
            <DialogDescription>
              Select what you believe are the correct answers and optionally add a note.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Suggested Correct Answers *</Label>
              <div className="mt-2 space-y-2">
                {['A', 'B', 'C', 'D', 'E'].map(answer => (
                  <div key={answer} className="flex items-center space-x-2">
                    <Checkbox
                      id={`answer-${answer}`}
                      checked={suggestedAnswers.has(answer)}
                      onCheckedChange={() => toggleAnswer(answer)}
                    />
                    <label
                      htmlFor={`answer-${answer}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Option {answer}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="note">Note (optional)</Label>
              <Textarea
                id="note"
                placeholder="Why do you think the answer is wrong?"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                maxLength={500}
                className="mt-1"
              />
              <p className="mt-1 text-xs text-muted-foreground">{note.length}/500</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmitWrongAnswer}
              disabled={suggestedAnswers.size === 0 || loading}
            >
              {loading ? 'Submitting...' : 'Submit'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
