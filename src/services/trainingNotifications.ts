// Training notification tag - constant to update same notification
const TRAINING_NOTIFICATION_TAG = 'active-training';

export interface TrainingNotificationData {
  trainingId: string;
  startTime: number;
}

// Extended notification options to include service worker specific properties
interface ExtendedNotificationOptions extends NotificationOptions {
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  badge?: string;
  requireInteraction?: boolean;
}

/**
 * Setup and request notification permissions
 */
export async function setupTrainingNotifications(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator) || !('Notification' in window)) {
    console.log('Service Worker or Notifications not supported');
    return null;
  }

  try {
    // Wait for service worker to be ready
    const registration = await navigator.serviceWorker.ready;

    // Request notification permission
    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
      console.log('Notification permission denied');
      return null;
    }

    return registration;
  } catch (error) {
    console.error('Error setting up notifications:', error);
    return null;
  }
}

/**
 * Show notification for active training
 */
export async function showTrainingNotification(
  trainingId: string,
  startTime: number,
  elapsedMinutes: number
): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;

    if (!registration || Notification.permission !== 'granted') {
      return;
    }

    const hours = Math.floor(elapsedMinutes / 60);
    const minutes = elapsedMinutes % 60;
    const timeStr = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

    const options: ExtendedNotificationOptions = {
      body: `Training in progress - ${timeStr}`,
      icon: '/favicon.svg',
      badge: '/favicon.svg',
      tag: TRAINING_NOTIFICATION_TAG,
      requireInteraction: true,
      silent: true,
      data: {
        type: 'training-active',
        trainingId,
        startTime,
        url: '/'
      },
      actions: [
        { action: 'open', title: 'Open' },
        { action: 'stop', title: 'Finish' }
      ]
    };

    await registration.showNotification('Active Training', options);
  } catch (error) {
    console.error('Error showing training notification:', error);
  }
}

/**
 * Close all training notifications
 */
export async function closeTrainingNotifications(): Promise<void> {
  try {
    const registration = await navigator.serviceWorker.ready;

    if (!registration) {
      return;
    }

    const notifications = await registration.getNotifications({
      tag: TRAINING_NOTIFICATION_TAG
    });

    notifications.forEach(notification => notification.close());
  } catch (error) {
    console.error('Error closing training notifications:', error);
  }
}

/**
 * Check if notifications are supported and enabled
 */
export function areNotificationsSupported(): boolean {
  return 'serviceWorker' in navigator && 'Notification' in window;
}

/**
 * Check if notification permission is granted
 */
export function hasNotificationPermission(): boolean {
  return areNotificationsSupported() && Notification.permission === 'granted';
}
