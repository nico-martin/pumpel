import { useEffect, useState } from 'react';
import { useRegisterSW } from 'virtual:pwa-register/react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

export function PWAUpdatePrompt() {
  const [showPrompt, setShowPrompt] = useState(false);

  const {
    offlineReady: [offlineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('Service Worker registered:', r);
    },
    onRegisterError(error) {
      console.error('Service Worker registration error:', error);
    },
  });

  useEffect(() => {
    if (offlineReady) {
      console.log('App ready to work offline');
    }
  }, [offlineReady]);

  useEffect(() => {
    setShowPrompt(needRefresh);
  }, [needRefresh]);

  const handleUpdate = () => {
    updateServiceWorker(true);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setNeedRefresh(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 md:left-auto md:right-4 md:max-w-sm">
      <Card className="border-2 border-primary shadow-lg">
        <CardContent className="pt-6">
          <div className="space-y-3">
            <div>
              <p className="font-semibold">New version available!</p>
              <p className="text-sm text-muted-foreground">
                A new version of Pumpel is ready. Reload to update.
              </p>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleUpdate} size="sm" className="flex-1">
                Reload
              </Button>
              <Button onClick={handleDismiss} variant="outline" size="sm" className="flex-1">
                Later
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
