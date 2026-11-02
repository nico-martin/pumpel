import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  getPersistState,
  requestPersistentStorage,
  type PersistState,
} from "@/services/persistentStorage";
import { ShieldCheck } from "lucide-react";

export function StorageCard() {
  const [persistState, setPersistState] = useState<PersistState | null>(null);
  const [requesting, setRequesting] = useState(false);
  const [denied, setDenied] = useState(false);

  useEffect(() => {
    getPersistState().then(setPersistState);
  }, []);

  const handlePersist = async () => {
    setRequesting(true);
    try {
      const granted = await requestPersistentStorage();
      setDenied(!granted);
      setPersistState(await getPersistState());
    } catch (error) {
      console.error("Error requesting persistent storage:", error);
      setDenied(true);
    } finally {
      setRequesting(false);
    }
  };

  if (persistState === null) return null;

  return (
    <Card size="sm" className="mb-6">
      <CardHeader>
        <CardTitle>Storage</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3 text-sm">
          {persistState === "unsupported" && (
            <p className="text-muted-foreground">
              This browser doesn't support persistent storage.
            </p>
          )}

          {persistState === "persisted" && (
            <p className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-primary" />
              <span>
                Data is persisted. The browser won't delete it automatically.
              </span>
            </p>
          )}

          {persistState === "not-persisted" && (
            <>
              <p className="text-muted-foreground">
                Without persistent storage, the browser may delete your data
                when the device runs low on space.
              </p>
              <Button
                variant="outline"
                className="w-full"
                onClick={handlePersist}
                disabled={requesting}
              >
                Persist Data
              </Button>
              {denied && (
                <p className="text-muted-foreground">
                  The browser declined the request. Installing Pumpel to your
                  home screen and using it regularly usually helps. Then try
                  again.
                </p>
              )}
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
