import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getActiveTraining } from '@/db/trainings';
import { TrainingView } from '@/components/TrainingView';
import {
  showTrainingNotification,
  hasNotificationPermission
} from '@/services/trainingNotifications';

export function TrainingPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [isActive, setIsActive] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkIfActive();
  }, [id]);

  // Check if app was opened from a notification
  useEffect(() => {
    const checkNotificationParam = async () => {
      if (searchParams.get('from') === 'notification' && id) {
        const activeTraining = await getActiveTraining();

        // Show notification immediately if this is the active training
        if (activeTraining && activeTraining.id === id && hasNotificationPermission()) {
          const elapsed = Math.floor((Date.now() - activeTraining.startTime) / 1000 / 60);
          showTrainingNotification(activeTraining.id, activeTraining.startTime, elapsed);
        }

        // Clear the query parameter
        searchParams.delete('from');
        setSearchParams(searchParams, { replace: true });
      }
    };

    checkNotificationParam();
  }, [id, searchParams, setSearchParams]);

  const checkIfActive = async () => {
    try {
      const activeTraining = await getActiveTraining();
      setIsActive(activeTraining?.id === id);
    } catch (error) {
      console.error('Error checking if training is active:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTrainingEnd = () => {
    navigate('/');
  };

  const handleBack = () => {
    navigate('/');
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!id) {
    navigate('/');
    return null;
  }

  return (
    <TrainingView
      trainingId={id}
      onTrainingEnd={handleTrainingEnd}
      onBack={handleBack}
      isActive={isActive}
    />
  );
}
