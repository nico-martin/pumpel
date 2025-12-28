import { useEffect, useState } from 'react';
import { getTrainingWithDetails } from '@/db/queries';
import type { TrainingWithDetails } from '@/db/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';

interface TrainingDetailsProps {
  trainingId: string;
  onBack: () => void;
}

const formatDate = (timestamp: number) => {
  const date = new Date(timestamp);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}.${month}.${year}`;
};

const formatTime = (timestamp: number) => {
  const date = new Date(timestamp);
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

export function TrainingDetails({ trainingId, onBack }: TrainingDetailsProps) {
  const [training, setTraining] = useState<TrainingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTraining();
  }, [trainingId]);

  const loadTraining = async () => {
    try {
      setLoading(true);
      const details = await getTrainingWithDetails(trainingId);
      setTraining(details);
    } catch (error) {
      console.error('Error loading training:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!training) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">Training not found</p>
      </div>
    );
  }

  const durationMinutes = Math.floor((training.endTime - training.startTime) / 1000 / 60);
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const duration = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div className="min-h-screen p-4 pb-24">
      <Button variant="ghost" onClick={onBack} className="mb-4">
        ← Back
      </Button>

      <Card className="mb-4">
        <CardHeader>
          <CardTitle>{training.name || 'Training'}</CardTitle>
          <CardDescription>
            {formatDate(training.startTime)} • {formatTime(training.startTime)} - {formatTime(training.endTime)} • {duration}
          </CardDescription>
        </CardHeader>
        {(training.notes || training.warmUp || training.calmDown) && (
          <CardContent>
            {training.warmUp && (
              <div className="mb-2">
                <p className="text-xs font-medium">Warm Up</p>
                <p className="text-xs text-muted-foreground">{training.warmUp}</p>
              </div>
            )}
            {training.calmDown && (
              <div className="mb-2">
                <p className="text-xs font-medium">Cool Down</p>
                <p className="text-xs text-muted-foreground">{training.calmDown}</p>
              </div>
            )}
            {training.notes && (
              <div>
                <p className="text-xs font-medium">Notes</p>
                <p className="text-xs text-muted-foreground">{training.notes}</p>
              </div>
            )}
          </CardContent>
        )}
      </Card>

      {training.sets.length > 0 ? (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">Exercises</h2>
          {training.sets.map((set, idx) => (
            <Card key={set.id} size="sm">
              <CardHeader>
                <CardTitle>
                  {idx + 1}. {set.exercise.name}
                </CardTitle>
              </CardHeader>
              {set.rounds.length > 0 && (
                <CardContent>
                  <div className="space-y-1">
                    {set.rounds.map((round, roundIdx) => (
                      <div key={round.id} className="flex gap-2 text-xs">
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
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      ) : (
        <p className="text-sm text-muted-foreground text-center">No exercises recorded</p>
      )}
    </div>
  );
}
