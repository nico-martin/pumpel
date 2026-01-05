import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Info, Plus, Minus } from 'lucide-react';
import { getLastSetForExercise } from '@/db/queries';
import type { Round } from '@/db/types';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface CurrentRound {
  weight: string;
  reps: string;
  notes: string;
}

interface LastSetData {
  rounds: Round[];
  date: number;
}

interface AddRoundProps {
  exerciseName: string;
  exerciseId: string;
  trainingId: string;
  weightUnit: 'kg' | 'lb';
  steps: number;
  currentRound: CurrentRound;
  onRoundChange: (field: keyof CurrentRound, value: string) => void;
  onAddRound: () => void;
  onStartNewSet: () => void;
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
  onStartNewSet,
}: AddRoundProps) {
  const [showLastUsed, setShowLastUsed] = useState(false);
  const [lastSetData, setLastSetData] = useState<LastSetData | null>(null);

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const handleShowLastUsed = async () => {
    try {
      const data = await getLastSetForExercise(exerciseId, trainingId);
      setLastSetData(data);
      setShowLastUsed(true);
    } catch (error) {
      console.error('Error fetching last set data:', error);
    }
  };

  const handleIncrementWeight = () => {
    const currentWeight = parseFloat(currentRound.weight) || 0;
    const newWeight = currentWeight + steps;
    onRoundChange('weight', newWeight.toString());
  };

  const handleDecrementWeight = () => {
    const currentWeight = parseFloat(currentRound.weight) || 0;
    const newWeight = Math.max(0, currentWeight - steps);
    onRoundChange('weight', newWeight.toString());
  };

  const handleIncrementReps = () => {
    const currentReps = parseInt(currentRound.reps) || 0;
    const newReps = currentReps + 1;
    onRoundChange('reps', newReps.toString());
  };

  const handleDecrementReps = () => {
    const currentReps = parseInt(currentRound.reps) || 0;
    const newReps = Math.max(0, currentReps - 1);
    onRoundChange('reps', newReps.toString());
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Add Round to {exerciseName}</span>
          <AlertDialog open={showLastUsed} onOpenChange={setShowLastUsed}>
            <AlertDialogTrigger asChild>
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={handleShowLastUsed}
              >
                <Info className="h-4 w-4" />
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Last Set</AlertDialogTitle>
                <AlertDialogDescription>
                  {lastSetData ? (
                    <div className="space-y-3">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(lastSetData.date)}
                      </p>
                      <div className="space-y-1">
                        {lastSetData.rounds.map((round, index) => (
                          <div key={round.id} className="flex gap-2 text-sm">
                            <span className="text-muted-foreground w-8">
                              #{index + 1}
                            </span>
                            <span className="font-medium">{round.weight}{weightUnit}</span>
                            <span className="text-muted-foreground">×</span>
                            <span className="font-medium">{round.reps} reps</span>
                            {round.notes && (
                              <span className="text-muted-foreground ml-2">
                                {round.notes}
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <p>No previous data found for this exercise.</p>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogAction>Close</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">
                Weight ({weightUnit})
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
                  onChange={(e) => onRoundChange('weight', e.target.value)}
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
                  onChange={(e) => onRoundChange('reps', e.target.value)}
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
              onChange={(e) => onRoundChange('notes', e.target.value)}
              rows={2}
            />
          </div>
          <div className="flex gap-2">
            <Button
              className="flex-1"
              onClick={onAddRound}
              disabled={!currentRound.weight || !currentRound.reps}
            >
              Add Round
            </Button>
            <Button variant="outline" onClick={onStartNewSet}>
              New Set
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
