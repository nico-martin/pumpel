import { useEffect, useState } from 'react';
import { getActiveTraining, createTraining } from '@/db/trainings';
import { getTrainingWithDetails } from '@/db/queries';
import type { Training, TrainingWithDetails } from '@/db/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

export function StartScreen() {
  const [activeTraining, setActiveTraining] = useState<Training | null>(null);
  const [trainingDetails, setTrainingDetails] = useState<TrainingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActiveTraining();
  }, []);

  const loadActiveTraining = async () => {
    try {
      setLoading(true);
      const training = await getActiveTraining();
      setActiveTraining(training);

      if (training) {
        const details = await getTrainingWithDetails(training.id);
        setTrainingDetails(details);
      }
    } catch (error) {
      console.error('Error loading active training:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartTraining = async () => {
    try {
      const newTraining = await createTraining({
        startTime: Date.now(),
        endTime: 0, // Active training has endTime set to 0
      });
      setActiveTraining(newTraining);
      setTrainingDetails({
        ...newTraining,
        sets: [],
      });
    } catch (error) {
      console.error('Error starting training:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!activeTraining) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-6 p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Pumpel</h1>
          <p className="text-muted-foreground">Ready to start your training?</p>
        </div>
        <Button onClick={handleStartTraining} size="lg" className="w-full max-w-xs">
          Start Training
        </Button>
      </div>
    );
  }

  // Active training view
  const startTime = new Date(activeTraining.startTime);
  const duration = Math.floor((Date.now() - activeTraining.startTime) / 1000 / 60); // minutes

  return (
    <div className="min-h-screen p-4">
      <Card>
        <CardHeader>
          <CardTitle>Active Training</CardTitle>
          <CardDescription>
            Started at {startTime.toLocaleTimeString()} • {duration} min
          </CardDescription>
        </CardHeader>
        <CardContent>
          {trainingDetails && trainingDetails.sets.length > 0 ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Sets completed: {trainingDetails.sets.length}</p>
              {trainingDetails.sets.map((set, idx) => (
                <div key={set.id} className="text-xs text-muted-foreground">
                  {idx + 1}. {set.exercise.name} - {set.rounds.length} rounds
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No sets recorded yet</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
