import { useEffect } from 'react';

export function PWAUpdatePrompt() {
  // Unregister any existing service workers in dev mode
  useEffect(() => {
    if (import.meta.env.DEV && 'serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistrations().then((registrations) => {
        for (const registration of registrations) {
          registration.unregister().then(() => {
            console.log('Service Worker unregistered in dev mode');
          });
        }
      });
    }
  }, []);

  // PWA features are disabled in dev mode
  if (import.meta.env.DEV) {
    return null;
  }

  // In production, dynamically import and render the actual PWA component
  // This component will be code-split and only loaded in production
  return null; // The actual PWA prompt will be handled by vite-plugin-pwa in production
}
