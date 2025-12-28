import { useEffect, useState } from 'react';
import { updateTraining, deleteTraining } from '@/db/trainings';
import { getTrainingWithDetails, getLastUsedWeightForExercise } from '@/db/queries';
import { createSet, deleteSet } from '@/db/sets';
import { createRound, deleteRound } from '@/db/rounds';
import { deleteRoundsBySetId } from '@/db/rounds';
import { getUser } from '@/db/user';
import type { Exercise, TrainingWithDetails } from '@/db/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ExerciseSelector } from '@/components/ExerciseSelector';
import { HugeiconsIcon } from '@hugeicons/react';
import { Delete02Icon, InformationCircleIcon } from '@hugeicons/core-free-icons';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface TrainingViewProps {
  trainingId: string;
  onTrainingEnd: () => void;
  onBack?: () => void;
  isActive?: boolean;
}

interface CurrentRound {
  weight: string;
  reps: string;
  notes: string;
}

export function TrainingView({ trainingId, onTrainingEnd, onBack, isActive = true }: TrainingViewProps) {
  const [userName, setUserName] = useState<string>('');
  const [training, setTraining] = useState<TrainingWithDetails | null>(null);
  const [currentSetId, setCurrentSetId] = useState<string | null>(null);
  const [showExerciseSelector, setShowExerciseSelector] = useState(false);
  const [currentRound, setCurrentRound] = useState<CurrentRound>({
    weight: '',
    reps: '9',
    notes: '',
  });
  const [duration, setDuration] = useState(0);
  const [showLastUsed, setShowLastUsed] = useState(false);
  const [lastUsedData, setLastUsedData] = useState<{
    weight: number;
    reps: number;
    date: number;
  } | null>(null);
  const [showWarmUpCoolDown, setShowWarmUpCoolDown] = useState(false);
  const [warmUp, setWarmUp] = useState('');
  const [coolDown, setCoolDown] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    loadTraining();
    loadUserName();
  }, [trainingId]);

  const loadUserName = async () => {
    const user = await getUser();
    if (user) {
      setUserName(user.name);
    }
  };

  useEffect(() => {
    const interval = setInterval(() => {
      if (training) {
        setDuration(Math.floor((Date.now() - training.startTime) / 1000 / 60));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [training]);

  useEffect(() => {
    if (currentSetId && training) {
      loadLastUsedWeight();
    }
  }, [currentSetId, training]);

  const loadLastUsedWeight = async () => {
    if (!currentSetId || !training) return;

    const currentSet = training.sets.find((s) => s.id === currentSetId);
    if (!currentSet) return;

    try {
      // Exclude current training to get weight from previous trainings
      const data = await getLastUsedWeightForExercise(currentSet.exerciseId, trainingId);
      if (data) {
        setCurrentRound((prev) => ({
          ...prev,
          weight: data.weight.toString(),
        }));
      } else {
        // No history for this exercise, clear weight
        setCurrentRound((prev) => ({
          ...prev,
          weight: '',
        }));
      }
    } catch (error) {
      console.error('Error loading last used weight:', error);
    }
  };

  const loadTraining = async () => {
    const details = await getTrainingWithDetails(trainingId);
    if (details) {
      setTraining(details);
      setWarmUp(details.warmUp || '');
      setCoolDown(details.calmDown || '');
      // Don't automatically select a set - let user click "Continue"
    }
  };

  const handleSelectExercise = async (exercise: Exercise) => {
    try {
      const orderInTraining = training?.sets.length || 0;
      const newSet = await createSet({
        trainingId,
        exerciseId: exercise.id,
        orderInTraining,
      });

      setShowExerciseSelector(false);

      // Reload training first to get the new set
      await loadTraining();

      // Then set current set ID, which will trigger the useEffect to load weight
      setCurrentSetId(newSet.id);
    } catch (error) {
      console.error('Error creating set:', error);
    }
  };

  const handleAddRound = async () => {
    if (!currentSetId || !currentRound.weight || !currentRound.reps) {
      return;
    }

    try {
      const currentSet = training?.sets.find((s) => s.id === currentSetId);
      const orderInSet = currentSet?.rounds.length || 0;

      await createRound({
        setId: currentSetId,
        orderInSet,
        weight: parseFloat(currentRound.weight),
        reps: parseInt(currentRound.reps, 10),
        notes: currentRound.notes || undefined,
      });

      // Reset to defaults, keeping the same weight
      setCurrentRound((prev) => ({ weight: prev.weight, reps: '9', notes: '' }));
      await loadTraining();
    } catch (error) {
      console.error('Error adding round:', error);
    }
  };

  const handleFinishTraining = async () => {
    try {
      // If this is an active training
      if (isActive) {
        // If no sets were recorded, delete the training instead of saving it
        if (!training || training.sets.length === 0) {
          await deleteTraining(trainingId);
          onTrainingEnd();
          return;
        }

        // Otherwise, mark it as complete
        await updateTraining(trainingId, {
          endTime: Date.now(),
        });
      }

      // For both active and completed trainings, go back
      onTrainingEnd();
    } catch (error) {
      console.error('Error finishing training:', error);
    }
  };

  const handleStartNewSet = () => {
    setShowExerciseSelector(true);
    setCurrentSetId(null);
  };

  const handleDeleteSet = async (setId: string) => {
    try {
      // Delete all rounds first
      await deleteRoundsBySetId(setId);
      // Delete the set
      await deleteSet(setId);

      // If we deleted the current set, clear it
      if (currentSetId === setId) {
        setCurrentSetId(null);
      }

      await loadTraining();
    } catch (error) {
      console.error('Error deleting set:', error);
    }
  };

  const handleDeleteRound = async (roundId: string) => {
    try {
      await deleteRound(roundId);
      await loadTraining();
    } catch (error) {
      console.error('Error deleting round:', error);
    }
  };

  const handleShowLastUsed = async () => {
    if (!currentSet) return;

    try {
      // Exclude current training to show data from previous trainings
      const data = await getLastUsedWeightForExercise(currentSet.exerciseId, trainingId);
      setLastUsedData(data);
      setShowLastUsed(true);
    } catch (error) {
      console.error('Error fetching last used data:', error);
    }
  };

  const handleSaveWarmUpCoolDown = async () => {
    try {
      await updateTraining(trainingId, {
        warmUp: warmUp || undefined,
        calmDown: coolDown || undefined,
      });
      setShowWarmUpCoolDown(false);
      await loadTraining();
    } catch (error) {
      console.error('Error saving warm up/cool down:', error);
    }
  };

  const handleDeleteTraining = async () => {
    try {
      setShowDeleteConfirm(false);
      // Delete all rounds for all sets
      for (const set of training?.sets || []) {
        await deleteRoundsBySetId(set.id);
      }
      // Delete all sets
      for (const set of training?.sets || []) {
        await deleteSet(set.id);
      }
      // Delete the training
      await deleteTraining(trainingId);
      onTrainingEnd();
    } catch (error) {
      console.error('Error deleting training:', error);
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  if (!training) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  const currentSet = training.sets.find((s) => s.id === currentSetId);

  return (
    <div className="min-h-screen p-4 pb-24">
      {onBack && (
        <Button variant="ghost" onClick={onBack} className="mb-4">
          ← Back
        </Button>
      )}

      <Card className="mb-4">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>{isActive ? 'Active Training' : 'Training'}</span>
            <div className="flex gap-1">
              <Button
                size="icon-xs"
                variant="ghost"
                onClick={() => setShowWarmUpCoolDown(true)}
              >
                <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
              </Button>
              <Button
                size="icon-xs"
                variant="destructive"
                onClick={() => setShowDeleteConfirm(true)}
              >
                <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
              </Button>
            </div>
          </CardTitle>
          <CardDescription>
            {isActive ? (
              <>Started at {formatTime(training.startTime)} • {duration} min</>
            ) : (
              <>{formatDate(training.startTime)} • {formatTime(training.startTime)} - {formatTime(training.endTime)}</>
            )}
          </CardDescription>
        </CardHeader>
        {(training.warmUp || training.calmDown) && (
          <CardContent>
            {training.warmUp && (
              <div className="mb-2">
                <p className="text-xs font-medium">Warm Up</p>
                <p className="text-xs text-muted-foreground">{training.warmUp}</p>
              </div>
            )}
            {training.calmDown && (
              <div>
                <p className="text-xs font-medium">Cool Down</p>
                <p className="text-xs text-muted-foreground">{training.calmDown}</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      <AlertDialog open={showWarmUpCoolDown} onOpenChange={setShowWarmUpCoolDown}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Warm Up & Cool Down</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-3 mt-2">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Warm Up
                  </label>
                  <Textarea
                    placeholder="Describe your warm up routine..."
                    value={warmUp}
                    onChange={(e) => setWarmUp(e.target.value)}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">
                    Cool Down
                  </label>
                  <Textarea
                    placeholder="Describe your cool down routine..."
                    value={coolDown}
                    onChange={(e) => setCoolDown(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSaveWarmUpCoolDown}>
              Save
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Training</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this training? This will remove all sets and rounds. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTraining} variant="destructive">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {training.sets.length > 0 && (
        <div className="mb-4 space-y-3">
          {training.sets.map((set, idx) => (
            <Card
              key={set.id}
              size="sm"
              className={currentSetId === set.id ? 'ring-2 ring-primary' : ''}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {idx + 1}. {set.exercise.name}
                  </span>
                  <div className="flex gap-1">
                    {currentSetId !== set.id && (
                      <Button
                        size="xs"
                        variant="ghost"
                        onClick={() => setCurrentSetId(set.id)}
                      >
                        Continue
                      </Button>
                    )}
                    <Button
                      size="icon-xs"
                      variant="destructive"
                      onClick={() => handleDeleteSet(set.id)}
                    >
                      <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              {set.rounds.length > 0 && (
                <CardContent>
                  <div className="space-y-1">
                    {set.rounds.map((round, roundIdx) => (
                      <div key={round.id} className="flex gap-2 text-xs items-center">
                        <span className="text-muted-foreground w-8">
                          #{roundIdx + 1}
                        </span>
                        <span className="font-medium">{round.weight}kg</span>
                        <span className="text-muted-foreground">×</span>
                        <span className="font-medium">{round.reps} reps</span>
                        {round.notes && (
                          <span className="text-muted-foreground ml-2">
                            {round.notes}
                          </span>
                        )}
                        <Button
                          size="icon-xs"
                          variant="ghost"
                          onClick={() => handleDeleteRound(round.id)}
                          className="ml-auto"
                        >
                          <HugeiconsIcon icon={Delete02Icon} strokeWidth={2} />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}

      {showExerciseSelector ? (
        <Card>
          <CardHeader>
            <CardTitle>Select Exercise</CardTitle>
          </CardHeader>
          <CardContent>
            <ExerciseSelector onSelect={handleSelectExercise} />
            <Button
              variant="ghost"
              size="sm"
              className="mt-2 w-full"
              onClick={() => setShowExerciseSelector(false)}
            >
              Cancel
            </Button>
          </CardContent>
        </Card>
      ) : currentSetId ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Add Round to {currentSet?.exercise.name}</span>
              <AlertDialog open={showLastUsed} onOpenChange={setShowLastUsed}>
                <AlertDialogTrigger asChild>
                  <Button
                    size="icon-xs"
                    variant="ghost"
                    onClick={handleShowLastUsed}
                  >
                    <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={2} />
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Last Used</AlertDialogTitle>
                    <AlertDialogDescription>
                      {lastUsedData ? (
                        <div className="space-y-2">
                          <p>
                            <strong>Weight:</strong> {lastUsedData.weight} kg
                          </p>
                          <p>
                            <strong>Reps:</strong> {lastUsedData.reps}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {(() => {
                              const date = new Date(lastUsedData.date);
                              const day = String(date.getDate()).padStart(2, '0');
                              const month = String(date.getMonth() + 1).padStart(2, '0');
                              const year = date.getFullYear();
                              return `${day}.${month}.${year}`;
                            })()}
                          </p>
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
                    Weight (kg)
                  </label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    placeholder="0"
                    value={currentRound.weight}
                    onChange={(e) =>
                      setCurrentRound((prev) => ({ ...prev, weight: e.target.value }))
                    }
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">
                    Reps
                  </label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    placeholder="0"
                    value={currentRound.reps}
                    onChange={(e) =>
                      setCurrentRound((prev) => ({ ...prev, reps: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">
                  Notes (optional)
                </label>
                <Textarea
                  placeholder="How did it feel?"
                  value={currentRound.notes}
                  onChange={(e) =>
                    setCurrentRound((prev) => ({ ...prev, notes: e.target.value }))
                  }
                  rows={2}
                />
              </div>
              <div className="flex gap-2">
                <Button
                  className="flex-1"
                  onClick={handleAddRound}
                  disabled={!currentRound.weight || !currentRound.reps}
                >
                  Add Round
                </Button>
                <Button variant="outline" onClick={handleStartNewSet}>
                  New Set
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Button className="w-full" onClick={handleStartNewSet}>
          Start New Set
        </Button>
      )}

      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        {isActive && training?.sets.length === 0 && (
          <p className="text-xs text-muted-foreground text-center mb-2">
            Keep it up, {userName}! Add your first set to get started.
          </p>
        )}
        {isActive && training && training.sets.length > 0 && (
          <p className="text-xs text-muted-foreground text-center mb-2">
            Great work, {userName}! {training.sets.length} {training.sets.length === 1 ? 'set' : 'sets'} completed.
          </p>
        )}
        <Button
          variant={isActive ? "destructive" : "default"}
          className="w-full"
          onClick={handleFinishTraining}
        >
          {isActive ? 'Finish Training' : 'Update'}
        </Button>
      </div>
    </div>
  );
}
