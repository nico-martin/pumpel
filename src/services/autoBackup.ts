// Automatic Google Drive backups.
//
// - The user connects Drive once from the Account page (creates/reuses a
//   "Pumpel Backups" folder).
// - A backup is uploaded whenever a training is finished, or a finished
//   training is edited or deleted.
// - After each backup, files in that folder older than 60 days are trashed.
// - Access tokens expire after ~1h and can only be renewed with a popup during
//   a user gesture. If that isn't possible, the backup is marked "pending" and
//   retried the next time it can be (next finished training, "Back up now",
//   or app start while the token is still valid).

import { useSyncExternalStore } from "react";
import { buildBackupJson } from "./backupData";
import {
  DriveHttpError,
  PopupBlockedError,
  findOrCreateFolder,
  getFolder,
  isDriveConfigured,
  loadGis,
  loadPicker,
  pickFolder,
  requestAccessToken,
  revokeToken,
  trashFilesOlderThan,
  uploadJsonFile,
  type AccessToken,
} from "./googleDrive";

const STORAGE_KEY = "pumpel.driveBackup";
const RETENTION_MS = 60 * 24 * 60 * 60 * 1000; // 60 days
const CLEANUP_INTERVAL_MS = 24 * 60 * 60 * 1000; // at most daily outside backups
const DEBOUNCE_MS = 4000;

export interface DriveBackupState {
  connected: boolean;
  folderId?: string;
  folderName?: string;
  accessToken?: string;
  tokenExpiresAt?: number;
  lastBackupAt?: number;
  lastBackupFile?: string;
  lastCleanupAt?: number;
  pending: boolean;
  lastError?: string;
  running: boolean; // runtime only, not persisted
}

const initialState: DriveBackupState = {
  connected: false,
  pending: false,
  running: false,
};

function loadState(): DriveBackupState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...initialState, ...JSON.parse(raw), running: false };
  } catch {
    // ignore corrupt or unavailable storage
  }
  return { ...initialState };
}

let state: DriveBackupState = loadState();
const listeners = new Set<() => void>();

function setState(patch: Partial<DriveBackupState>) {
  state = { ...state, ...patch };
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { running, ...persisted } = state;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(persisted));
  } catch {
    // ignore
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useDriveBackupState(): DriveBackupState {
  return useSyncExternalStore(subscribe, () => state);
}

// --- Token helpers ---------------------------------------------------------

function storedToken(): AccessToken | null {
  if (
    state.accessToken &&
    state.tokenExpiresAt &&
    state.tokenExpiresAt > Date.now()
  ) {
    return { token: state.accessToken, expiresAt: state.tokenExpiresAt };
  }
  return null;
}

function hasUserActivation(): boolean {
  // Popups are only allowed shortly after a user gesture.
  const activation = (
    navigator as Navigator & { userActivation?: { isActive: boolean } }
  ).userActivation;
  // Browsers without the API (older Safari): assume we may try; GIS reports a
  // blocked popup via error_callback, which we handle as "pending".
  return activation ? activation.isActive : true;
}

async function getToken(interactive: boolean): Promise<AccessToken | null> {
  const token = storedToken();
  if (token) return token;
  if (!interactive) return null;

  const fresh = await requestAccessToken("");
  setState({ accessToken: fresh.token, tokenExpiresAt: fresh.expiresAt });
  return fresh;
}

// --- Connect / disconnect -------------------------------------------------

// Must be called from a click handler.
export async function connectDrive(): Promise<void> {
  if (!isDriveConfigured()) throw new Error("Google Drive is not configured.");

  const token = await requestAccessToken("consent");
  setState({ accessToken: token.token, tokenExpiresAt: token.expiresAt });

  const folder = await findOrCreateFolder(token.token);
  setState({
    connected: true,
    folderId: folder.id,
    folderName: folder.name,
    lastError: undefined,
  });

  await runBackup({ interactive: false });
}

// Lets the user pick any Drive folder for future backups. Must be called from
// a click handler (may need a sign-in popup first). Existing backups stay in
// the old folder; the 60-day cleanup only applies to the current folder.
// Returns false if the user cancelled.
export async function changeFolder(): Promise<boolean> {
  if (!state.connected) return false;
  // Start loading the picker in parallel with a possible token refresh.
  const pickerReady = loadPicker();
  const token = await getToken(true);
  if (!token) return false;
  await pickerReady;

  const folder = await pickFolder(token.token);
  if (!folder) return false;
  if (folder.id === state.folderId) return true;

  setState({ folderId: folder.id, folderName: folder.name });
  // Put a current backup into the new folder right away.
  void runBackup({ interactive: false });
  return true;
}

export async function disconnectDrive(): Promise<void> {
  if (debounceTimer) clearTimeout(debounceTimer);
  const token = state.accessToken;
  state = { ...initialState };
  setState({});
  if (token) await revokeToken(token);
}

// --- Backup ---------------------------------------------------------------

let inFlight: Promise<void> | null = null;
let rerunRequested = false;
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

function backupFileName(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return (
    `pumpel-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}` +
    `_${pad(date.getHours())}-${pad(date.getMinutes())}-${pad(date.getSeconds())}.json`
  );
}

async function performBackup(interactive: boolean): Promise<void> {
  let token = await getToken(interactive);
  if (!token) {
    setState({ pending: true });
    return;
  }

  try {
    await uploadAndCleanup(token.token);
  } catch (error) {
    // Token revoked/expired early: drop it and retry once if we can.
    if (error instanceof DriveHttpError && error.status === 401) {
      setState({ accessToken: undefined, tokenExpiresAt: undefined });
      token = await getToken(interactive);
      if (!token) {
        setState({ pending: true });
        return;
      }
      await uploadAndCleanup(token.token);
    } else {
      throw error;
    }
  }
}

async function uploadAndCleanup(token: string): Promise<void> {
  // The folder may have been deleted in Drive meanwhile; recreate if needed.
  let folderId = state.folderId;
  const folder = folderId ? await getFolder(token, folderId) : null;
  if (!folder) {
    const created = await findOrCreateFolder(token, state.folderName);
    folderId = created.id;
    setState({ folderId: created.id, folderName: created.name });
  } else if (folder.name !== state.folderName) {
    setState({ folderName: folder.name });
  }

  const json = await buildBackupJson();
  const file = await uploadJsonFile(token, folderId!, backupFileName(), json);
  setState({
    lastBackupAt: Date.now(),
    lastBackupFile: file.name,
    pending: false,
    lastError: undefined,
  });

  // Cleanup only runs right after a successful upload, so the newest backup
  // is always fresh and never removed.
  try {
    await trashFilesOlderThan(token, folderId!, Date.now() - RETENTION_MS);
    setState({ lastCleanupAt: Date.now() });
  } catch (error) {
    console.warn("Backup cleanup failed:", error);
  }
}

export async function runBackup({
  interactive,
}: {
  interactive: boolean;
}): Promise<void> {
  if (!state.connected) return;

  if (inFlight) {
    rerunRequested = true;
    return inFlight;
  }

  setState({ running: true });
  inFlight = (async () => {
    try {
      do {
        rerunRequested = false;
        await performBackup(interactive);
      } while (rerunRequested);
    } catch (error) {
      console.error("Google Drive backup failed:", error);
      setState({
        pending: true,
        lastError:
          error instanceof PopupBlockedError
            ? "Google sign-in is needed again. Tap “Back up now”."
            : error instanceof Error
              ? error.message
              : String(error),
      });
    } finally {
      inFlight = null;
      setState({ running: false });
    }
  })();
  return inFlight;
}

// Call after a training was finished, or a finished training changed.
// `immediate` should be used directly in click handlers (e.g. "Finish
// training") so a token refresh popup is still allowed. Everything else is
// debounced so several quick edits result in a single upload.
export function notifyTrainingChanged({
  immediate = false,
}: { immediate?: boolean } = {}): void {
  if (!state.connected) return;

  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = null;

  if (immediate) {
    void runBackup({ interactive: hasUserActivation() });
    return;
  }

  setState({ pending: true });
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    void runBackup({ interactive: false });
  }, DEBOUNCE_MS);
}

// Call once on app start: catches up on pending backups and periodic cleanup
// while the stored token is still valid (no popup possible here).
export function initAutoBackup(): void {
  if (!state.connected) return;
  // Preload so a later token refresh popup opens fast enough after a click.
  loadGis().catch(() => {});
  const token = storedToken();
  if (!token) return;

  if (state.pending) {
    void runBackup({ interactive: false });
  } else if (
    state.folderId &&
    (!state.lastCleanupAt ||
      Date.now() - state.lastCleanupAt > CLEANUP_INTERVAL_MS)
  ) {
    trashFilesOlderThan(token.token, state.folderId, Date.now() - RETENTION_MS)
      .then(() => setState({ lastCleanupAt: Date.now() }))
      .catch((error) => console.warn("Backup cleanup failed:", error));
  }
}
