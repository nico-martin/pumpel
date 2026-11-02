import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  changeFolder,
  connectDrive,
  disconnectDrive,
  runBackup,
  useDriveBackupState,
} from "@/services/autoBackup";
import {
  PopupBlockedError,
  isDriveConfigured,
  isFolderPickerConfigured,
  loadGis,
  loadPicker,
} from "@/services/googleDrive";
import { CloudUpload, Folder } from "lucide-react";

function formatDateTime(timestamp: number) {
  const date = new Date(timestamp);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(date.getDate())}.${pad(date.getMonth() + 1)}.${date.getFullYear()} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function DriveBackupCard() {
  const backup = useDriveBackupState();
  const [connecting, setConnecting] = useState(false);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [showDisconnectConfirm, setShowDisconnectConfirm] = useState(false);
  const [changingFolder, setChangingFolder] = useState(false);
  const [folderError, setFolderError] = useState<string | null>(null);

  // Preload the Google script so a click can open the sign-in popup right
  // away (popups are blocked if they open too long after the click).
  useEffect(() => {
    if (isDriveConfigured()) loadGis().catch(() => {});
    if (isFolderPickerConfigured()) loadPicker().catch(() => {});
  }, []);

  if (!isDriveConfigured()) return null;

  const handleConnect = async () => {
    setConnecting(true);
    setConnectError(null);
    try {
      await connectDrive();
    } catch (error) {
      console.error("Error connecting Google Drive:", error);
      setConnectError(
        error instanceof PopupBlockedError
          ? "The Google sign-in window was closed or blocked."
          : "Could not connect to Google Drive. Please try again.",
      );
    } finally {
      setConnecting(false);
    }
  };

  const handleChangeFolder = async () => {
    setChangingFolder(true);
    setFolderError(null);
    try {
      await changeFolder();
    } catch (error) {
      console.error("Error changing backup folder:", error);
      setFolderError(
        error instanceof PopupBlockedError
          ? "The Google sign-in window was closed or blocked."
          : "Could not change the folder. Please try again.",
      );
    } finally {
      setChangingFolder(false);
    }
  };

  return (
    <Card size="sm" className="mb-6">
      <CardHeader>
        <CardTitle>Automatic Backups</CardTitle>
      </CardHeader>
      <CardContent>
        {!backup.connected ? (
          <div className="space-y-3 text-sm">
            <p className="text-muted-foreground">
              Connect Google Drive to save a backup after every finished or
              edited training. Pumpel creates a "Pumpel Backups" folder
              {isFolderPickerConfigured()
                ? " (you can choose a different one afterwards)"
                : ""}{" "}
              and can only access its own files and folders you pick. Backups
              older than 60 days are removed automatically.
            </p>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleConnect}
              disabled={connecting}
            >
              <CloudUpload className="size-4" />
              {connecting ? "Connecting…" : "Connect Google Drive"}
            </Button>
            {connectError && <p className="text-destructive">{connectError}</p>}
          </div>
        ) : (
          <div className="space-y-3 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Folder</span>
              <span className="flex items-center gap-1.5 font-medium truncate">
                <Folder className="size-4 shrink-0" />
                <span className="truncate">{backup.folderName}</span>
              </span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Last Backup</span>
              <span className="font-medium">
                {backup.running
                  ? "Backing up…"
                  : backup.lastBackupAt
                    ? formatDateTime(backup.lastBackupAt)
                    : "Never"}
              </span>
            </div>
            {backup.pending && !backup.running && (
              <p className="text-muted-foreground">
                {backup.lastError ?? "A backup is waiting to be uploaded."}
              </p>
            )}
            {isFolderPickerConfigured() && (
              <Button
                variant="outline"
                className="w-full"
                onClick={handleChangeFolder}
                disabled={changingFolder || backup.running}
              >
                <Folder className="size-4" />
                {changingFolder ? "Choosing folder…" : "Change folder"}
              </Button>
            )}
            {folderError && <p className="text-destructive">{folderError}</p>}
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => runBackup({ interactive: true })}
                disabled={backup.running}
              >
                Back up now
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowDisconnectConfirm(true)}
              >
                Disconnect
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      <AlertDialog
        open={showDisconnectConfirm}
        onOpenChange={setShowDisconnectConfirm}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Disconnect Google Drive</AlertDialogTitle>
            <AlertDialogDescription>
              Automatic backups will stop. Existing backups stay in your Google
              Drive folder.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => disconnectDrive()}>
              Disconnect
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
