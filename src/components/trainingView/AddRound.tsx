import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Info, Plus, Minus, Trash2 } from "lucide-react";
import { getRecentSetsForExercise, type RecentExerciseSet } from "@/db/queries";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { WeightUnit } from "@/components/exercises/ExerciseForm.tsx";

interface CurrentRound {
  weight: string;
  reps: string;
  notes: string;
}

interface AddRoundProps {
  exerciseName: string;
  exerciseId: string;
  trainingId: string;
  weightUnit: WeightUnit;
  steps: number;
  currentRound: CurrentRound;
  onRoundChange: (field: keyof CurrentRound, value: string) => void;
  onAddRound: () => void;
  onDeleteSet: () => void;
  inline?: boolean;
  exerciseDescription?: string;
}

export function AddRound({
  exerciseName,
  exerciseId,
  trainingId,
  weightUnit,
  steps,
  currentRound,
  onRoundChange,
  onAddRound,
  onDeleteSet,
  inline = false,
  exerciseDescription,
}: AddRoundProps) {
  const [showHistory, setShowHistory] = useState(false);
  const [recentSets, setRecentSets] = useState<RecentExerciseSet[]>([]);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, "0");
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleShowHistory = async () => {
    try {
      const data = await getRecentSetsForExercise(exerciseId, trainingId);
      setRecentSets(data);
      setShowHistory(true);
    } catch (error) {
      console.error("Error fetching exercise history:", error);
    }
  };

  const handleIncrementWeight = () => {
    const currentWeight = parseFloat(currentRound.weight) || 0;
    const newWeight = currentWeight + steps;
    onRoundChange("weight", newWeight.toString());
  };

  const handleDecrementWeight = () => {
    const currentWeight = parseFloat(currentRound.weight) || 0;
    const newWeight = Math.max(0, currentWeight - steps);
    onRoundChange("weight", newWeight.toString());
  };

  const handleIncrementReps = () => {
    const currentReps = parseInt(currentRound.reps) || 0;
    const newReps = currentReps + 1;
    onRoundChange("reps", newReps.toString());
  };

  const handleDecrementReps = () => {
    const currentReps = parseInt(currentRound.reps) || 0;
    const newReps = Math.max(0, currentReps - 1);
    onRoundChange("reps", newReps.toString());
  };

  const content = (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Unit ({weightUnit})
          </label>
          <div className="flex">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleDecrementWeight}
              className="rounded-r-none border-r-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              inputMode="decimal"
              placeholder="0"
              value={currentRound.weight}
              onChange={(e) => onRoundChange("weight", e.target.value)}
              className="text-center rounded-none border-x-0 focus-visible:z-10"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleIncrementWeight}
              className="rounded-l-none border-l-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">
            Reps
          </label>
          <div className="flex">
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleDecrementReps}
              className="rounded-r-none border-r-0"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Input
              type="number"
              inputMode="numeric"
              placeholder="0"
              value={currentRound.reps}
              onChange={(e) => onRoundChange("reps", e.target.value)}
              className="text-center rounded-none border-x-0 focus-visible:z-10"
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              onClick={handleIncrementReps}
              className="rounded-l-none border-l-0"
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
      <div>
        <label className="text-xs text-muted-foreground mb-1 block">
          Notes (optional)
        </label>
        <Textarea
          placeholder="How did it feel?"
          value={currentRound.notes}
          onChange={(e) => onRoundChange("notes", e.target.value)}
          rows={2}
        />
      </div>
      <Button
        className="w-full"
        onClick={onAddRound}
        disabled={!currentRound.weight || !currentRound.reps}
      >
        Add Round
      </Button>
    </div>
  );

  const historyDialog = (
    <AlertDialog open={showHistory} onOpenChange={setShowHistory}>
      <AlertDialogTrigger asChild>
        <Button
          size="icon-xs"
          variant="ghost"
          onClick={handleShowHistory}
          aria-label={`Show recent ${exerciseName} sets`}
        >
          <Info className="h-4 w-4" />
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto">
        <AlertDialogHeader>
          {exerciseDescription && (
            <div className="mb-3 text-left text-sm whitespace-pre-wrap text-muted-foreground">
              {exerciseDescription}
            </div>
          )}
          <AlertDialogTitle>Recent Sets</AlertDialogTitle>
          <AlertDialogDescription>
            Last five recorded sets, newest first.
          </AlertDialogDescription>
        </AlertDialogHeader>
        {recentSets.length > 0 ? (
          <div className="space-y-2">
            {recentSets.map((set, setIndex) => (
              <div key={set.id} className="rounded-lg border p-3">
                <div className="mb-2 flex items-center justify-between gap-2 text-xs text-muted-foreground">
                  <span>{formatDate(set.date)}</span>
                  <span>
                    {setIndex === 0
                      ? "Latest"
                      : `${setIndex} set${setIndex === 1 ? "" : "s"} ago`}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {set.rounds.map((round) => (
                    <div
                      key={round.id}
                      className="max-w-full rounded-md bg-muted px-2 py-1 text-left text-xs"
                    >
                      <span className="font-medium">
                        {round.weight}
                        {weightUnit} × {round.reps}
                      </span>
                      {round.notes && (
                        <span className="block max-w-48 truncate text-muted-foreground">
                          {round.notes}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No previous data found for this exercise.
          </p>
        )}
        <AlertDialogFooter>
          <AlertDialogAction>Close</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );

  // Inline mode - no card wrapper, just content with a small title
  if (inline) {
    return (
      <div className="pt-3 border-t">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium">Add Round</h4>
          <div className="flex items-center gap-1">
            {historyDialog}
            <Button
              size="icon-xs"
              variant="destructive"
              onClick={onDeleteSet}
              aria-label={`Delete ${exerciseName} set`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
        {content}
      </div>
    );
  }

  // Standalone mode - full card with title
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Add Round to {exerciseName}</span>
          <div className="flex items-center gap-1">
            {historyDialog}
            <Button
              size="icon-xs"
              variant="destructive"
              onClick={onDeleteSet}
              aria-label={`Delete ${exerciseName} set`}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>{content}</CardContent>
    </Card>
  );
}
