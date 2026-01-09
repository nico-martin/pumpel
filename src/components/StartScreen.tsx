import { useEffect, useState, useCallback, useRef } from 'react';
import { getActiveTraining, createTraining, getTrainingsByStartTime, deleteTraining } from '@/db/trainings';
import { getTrainingWithDetails } from '@/db/queries';
import { deleteSet } from '@/db/sets';
import { deleteRoundsBySetId } from '@/db/rounds';
import { getUser } from '@/db/user';
import type { Training, TrainingWithDetails } from '@/db/types';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { TrainingView } from '@/components/TrainingView';
import { Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  setupTrainingNotifications,
  showTrainingNotification,
  closeTrainingNotifications,
  hasNotificationPermission
} from '@/services/trainingNotifications';

export function StartScreen() {
  const [userName, setUserName] = useState<string>('');
  const [activeTraining, setActiveTraining] = useState<Training | null>(null);
  const [recentTrainings, setRecentTrainings] = useState<Training[]>([]);
  const [trainingDetails, setTrainingDetails] = useState<Map<string, TrainingWithDetails>>(new Map());
  const [expandedTrainings, setExpandedTrainings] = useState<Set<string>>(new Set());
  const [selectedTrainingId, setSelectedTrainingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const notificationIntervalRef = useRef<number | null>(null);

  // Setup notifications
  useEffect(() => {
    setupTrainingNotifications();
  }, []);

  useEffect(() => {
    loadData();

    // Cleanup on unmount
    return () => {
      if (notificationIntervalRef.current) {
        clearInterval(notificationIntervalRef.current);
      }
    };
  }, []);

  // Check if app was opened from a notification
  useEffect(() => {
    if (window.location.hash === '#from-training-notification' && activeTraining) {
      // Show notification immediately
      if (hasNotificationPermission()) {
        const elapsed = Math.floor((Date.now() - activeTraining.startTime) / 1000 / 60);
        showTrainingNotification(activeTraining.id, activeTraining.startTime, elapsed);
      }

      // Clear the hash
      window.history.replaceState(null, '', window.location.pathname + window.location.search);
    }
  }, [activeTraining]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [user, training, recent] = await Promise.all([
        getUser(),
        getActiveTraining(),
        getTrainingsByStartTime(10),
      ]);

      if (user) {
        setUserName(user.name);
      }

      setActiveTraining(training);
      setRecentTrainings(recent);

      // If there's an active training, start notifications
      if (training) {
        startNotificationUpdates(training.id, training.startTime);
      }

      // Load details for each training
      const detailsMap = new Map<string, TrainingWithDetails>();
      for (const t of recent) {
        const details = await getTrainingWithDetails(t.id);
        if (details) {
          detailsMap.set(t.id, details);
        }
      }
      setTrainingDetails(detailsMap);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  // Start notification updates for active training
  const startNotificationUpdates = useCallback((trainingId: string, startTime: number) => {
    // Clear any existing interval
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
    }

    // Show initial notification
    const showNotification = () => {
      if (hasNotificationPermission()) {
        const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60);
        showTrainingNotification(trainingId, startTime, elapsed);
      }
    };

    showNotification();

    // Update notification every minute
    notificationIntervalRef.current = setInterval(showNotification, 60000);
  }, []);

  // Stop notification updates and close notifications
  const stopNotificationUpdates = useCallback(() => {
    if (notificationIntervalRef.current) {
      clearInterval(notificationIntervalRef.current);
      notificationIntervalRef.current = null;
    }
    closeTrainingNotifications();
  }, []);

  const handleStartTraining = async () => {
    // Prevent starting a new training if one is already active
    if (activeTraining) {
      return;
    }

    try {
      const newTraining = await createTraining({
        startTime: Date.now(),
        endTime: 0, // Active training has endTime set to 0
      });
      setActiveTraining(newTraining);
      setSelectedTrainingId(newTraining.id); // Navigate to the new training

      // Start showing notifications
      startNotificationUpdates(newTraining.id, newTraining.startTime);
    } catch (error) {
      console.error('Error starting training:', error);
    }
  };

  const handleTrainingEnd = () => {
    stopNotificationUpdates();
    setActiveTraining(null);
    setSelectedTrainingId(null); // Clear selected training to go back to list
    loadData(); // Reload to show the newly completed training in the list
  };

  const handleBackToList = () => {
    setSelectedTrainingId(null);
    loadData();
  };

  const toggleExpanded = (trainingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpandedTrainings((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(trainingId)) {
        newSet.delete(trainingId);
      } else {
        newSet.add(trainingId);
      }
      return newSet;
    });
  };

  const handleDeleteClick = (trainingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirmId(trainingId);
  };

  const handleDeleteTraining = async () => {
    if (!deleteConfirmId) return;

    try {
      const details = trainingDetails.get(deleteConfirmId);
      if (details) {
        // Delete all rounds for all sets
        for (const set of details.sets) {
          await deleteRoundsBySetId(set.id);
        }
        // Delete all sets
        for (const set of details.sets) {
          await deleteSet(set.id);
        }
      }
      // Delete the training
      await deleteTraining(deleteConfirmId);

      // Clear active training if it was deleted
      if (activeTraining?.id === deleteConfirmId) {
        stopNotificationUpdates();
        setActiveTraining(null);
      }

      setDeleteConfirmId(null);
      await loadData();
    } catch (error) {
      console.error('Error deleting training:', error);
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  };

  const formatDuration = (startTime: number, endTime: number) => {
    const durationMinutes = Math.floor((endTime - startTime) / 1000 / 60);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (selectedTrainingId) {
    // Check if selected training is active
    const isSelectedActive = activeTraining?.id === selectedTrainingId;

    return (
      <TrainingView
        trainingId={selectedTrainingId}
        onTrainingEnd={handleTrainingEnd}
        onBack={handleBackToList}
        isActive={isSelectedActive}
      />
    );
  }

  return (
    <div className="min-h-screen p-4 space-y-6">
      <div className="mt-1">
        <h1 className="text-2xl font-bold mb-2">Pumpel</h1>
        <p className="text-muted-foreground">
          {activeTraining
            ? `Hi ${userName}, training in progress`
            : `Hi ${userName}, ready to start your training?`}
        </p>
      </div>

      {!activeTraining && (
        <Button onClick={handleStartTraining} size="lg" className="w-full">
          Start Training
        </Button>
      )}

      {recentTrainings.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-sm font-medium">
            {activeTraining ? 'Current & Recent Trainings' : 'Recent Trainings'}
          </h2>
          {recentTrainings.map((training) => {
            const date = formatDate(training.startTime);
            const isActive = training.endTime === 0;
            const duration = isActive
              ? 'In progress'
              : formatDuration(training.startTime, training.endTime);

            const handleClick = () => {
              // Open TrainingView for all trainings (active and completed)
              setSelectedTrainingId(training.id);
            };

            const details = trainingDetails.get(training.id);
            const isExpanded = expandedTrainings.has(training.id);
            const hasExercises = details && details.sets.length > 0;
            const visibleSets = hasExercises
              ? isExpanded
                ? details.sets
                : details.sets.slice(0, 3)
              : [];
            const hasMore = hasExercises && details.sets.length > 3;

            return (
              <Card
                key={training.id}
                size="sm"
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={handleClick}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isActive && (
                        <span className="relative flex h-2 w-2">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
                        </span>
                      )}
                      <span>{date}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground font-normal">
                        {duration}
                      </span>
                      <Button
                        size="icon-xs"
                        variant="ghost"
                        onClick={(e) => handleDeleteClick(training.id, e)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardTitle>
                </CardHeader>
                {(training.name || hasExercises) && (
                  <CardContent>
                    {training.name && (
                      <p className="text-xs text-muted-foreground mb-2">{training.name}</p>
                    )}
                    {hasExercises && (
                      <div className="space-y-2">
                        {visibleSets.map((set) => {
                          const maxWeight = set.rounds.length > 0
                            ? Math.max(...set.rounds.map(r => r.weight)).toFixed(1)
                            : '0';
                          const totalReps = set.rounds.reduce((sum, r) => sum + r.reps, 0);

                          return (
                            <div key={set.id} className="text-xs flex items-center justify-between">
                              <span className="font-medium">{set.exercise.name}</span>
                              <span className="text-muted-foreground">
                                {set.rounds.length} × {maxWeight}kg × {totalReps} reps
                              </span>
                            </div>
                          );
                        })}
                        {hasMore && (
                          <Button
                            size="xs"
                            variant="ghost"
                            className="w-full"
                            onClick={(e) => toggleExpanded(training.id, e)}
                          >
                            {isExpanded ? 'Show less' : `Show ${details.sets.length - 3} more`}
                          </Button>
                        )}
                      </div>
                    )}
                  </CardContent>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <AlertDialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
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
    </div>
  );
}
