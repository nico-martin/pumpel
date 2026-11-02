// Minimal Google Drive client for browser-only use.
//
// Auth uses Google Identity Services (GIS) token flow: there is no server, so
// there is no refresh token. Access tokens live ~1h. When a token is expired we
// can only get a new one via a popup, which browsers allow only during a user
// gesture. Callers handle that by marking a backup as "pending".
//
// Scope is `drive.file`: the app can only see and touch files/folders it created
// itself, or that the user explicitly picked in the Google Picker (that's how a
// custom backup folder is chosen). Nothing else in the user's Drive.

const GIS_SRC = "https://accounts.google.com/gsi/client";
const SCOPE = "https://www.googleapis.com/auth/drive.file";
const DRIVE_API = "https://www.googleapis.com/drive/v3";
const UPLOAD_API = "https://www.googleapis.com/upload/drive/v3";
const FOLDER_MIME = "application/vnd.google-apps.folder";

export const DEFAULT_FOLDER_NAME = "Pumpel Backups";

export const GOOGLE_CLIENT_ID: string | undefined = import.meta.env
  .VITE_GOOGLE_CLIENT_ID;

// Needed for the folder picker. The app ID is the Cloud project *number*;
// without it, picking a folder wouldn't grant the app access to it.
export const GOOGLE_API_KEY: string | undefined = import.meta.env
  .VITE_GOOGLE_API_KEY;
export const GOOGLE_APP_ID: string | undefined = import.meta.env
  .VITE_GOOGLE_APP_ID;

export function isDriveConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID);
}

export function isFolderPickerConfigured(): boolean {
  return Boolean(GOOGLE_CLIENT_ID && GOOGLE_API_KEY && GOOGLE_APP_ID);
}

// --- GIS typings (only what we use) ---------------------------------------

interface TokenResponse {
  access_token: string;
  expires_in: number;
  error?: string;
  error_description?: string;
}

interface TokenClient {
  requestAccessToken(overrides?: { prompt?: string }): void;
}

interface GoogleAccountsOAuth2 {
  initTokenClient(config: {
    client_id: string;
    scope: string;
    callback: (response: TokenResponse) => void;
    error_callback?: (error: { type: string; message?: string }) => void;
  }): TokenClient;
  revoke(token: string, done?: () => void): void;
}

// --- Picker typings (only what we use) ------------------------------------

interface PickerDoc {
  id: string;
  name: string;
}

interface PickerResponse {
  action: string;
  docs?: PickerDoc[];
}

interface PickerBuilder {
  setAppId(appId: string): PickerBuilder;
  setOAuthToken(token: string): PickerBuilder;
  setDeveloperKey(key: string): PickerBuilder;
  addView(view: unknown): PickerBuilder;
  setTitle(title: string): PickerBuilder;
  setCallback(callback: (data: PickerResponse) => void): PickerBuilder;
  build(): { setVisible(visible: boolean): void; dispose(): void };
}

interface DocsView {
  setIncludeFolders(include: boolean): DocsView;
  setSelectFolderEnabled(enabled: boolean): DocsView;
  setMimeTypes(mimeTypes: string): DocsView;
}

interface GooglePicker {
  PickerBuilder: new () => PickerBuilder;
  DocsView: new (viewId?: string) => DocsView;
  ViewId: { FOLDERS: string };
  Action: { PICKED: string; CANCEL: string };
}

declare global {
  interface Window {
    google?: {
      accounts: { oauth2: GoogleAccountsOAuth2 };
      picker?: GooglePicker;
    };
    gapi?: { load(api: string, callback: () => void): void };
  }
}

// --- Script loading --------------------------------------------------------

let gisPromise: Promise<GoogleAccountsOAuth2> | null = null;

export function loadGis(): Promise<GoogleAccountsOAuth2> {
  if (window.google?.accounts?.oauth2) {
    return Promise.resolve(window.google.accounts.oauth2);
  }
  if (gisPromise) return gisPromise;

  gisPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = GIS_SRC;
    script.async = true;
    script.onload = () => {
      if (window.google?.accounts?.oauth2) {
        resolve(window.google.accounts.oauth2);
      } else {
        reject(new Error("Google Identity Services failed to initialize"));
      }
    };
    script.onerror = () => {
      gisPromise = null;
      script.remove();
      reject(new Error("Could not load Google Identity Services"));
    };
    document.head.appendChild(script);
  });
  return gisPromise;
}

const GAPI_SRC = "https://apis.google.com/js/api.js";
let pickerPromise: Promise<GooglePicker> | null = null;

export function loadPicker(): Promise<GooglePicker> {
  if (window.google?.picker) return Promise.resolve(window.google.picker);
  if (pickerPromise) return pickerPromise;

  pickerPromise = new Promise<GooglePicker>((resolve, reject) => {
    const onGapi = () =>
      window.gapi!.load("picker", () => {
        if (window.google?.picker) resolve(window.google.picker);
        else reject(new Error("Google Picker failed to initialize"));
      });

    if (window.gapi) {
      onGapi();
      return;
    }
    const script = document.createElement("script");
    script.src = GAPI_SRC;
    script.async = true;
    script.onload = onGapi;
    script.onerror = () => {
      script.remove();
      reject(new Error("Could not load Google Picker"));
    };
    document.head.appendChild(script);
  }).catch((error) => {
    pickerPromise = null;
    throw error;
  });
  return pickerPromise;
}

// Shows Google's folder picker. Resolves with the picked folder, or null if
// the user cancelled. Picking grants the app (drive.file) access to it.
export async function pickFolder(token: string): Promise<DriveFolder | null> {
  if (!isFolderPickerConfigured()) {
    throw new Error("The folder picker is not configured.");
  }
  const picker = await loadPicker();

  return new Promise((resolve) => {
    const view = new picker.DocsView(picker.ViewId.FOLDERS)
      .setIncludeFolders(true)
      .setSelectFolderEnabled(true)
      .setMimeTypes(FOLDER_MIME);

    const instance = new picker.PickerBuilder()
      .setAppId(GOOGLE_APP_ID!)
      .setOAuthToken(token)
      .setDeveloperKey(GOOGLE_API_KEY!)
      .addView(view)
      .setTitle("Choose a folder for Pumpel backups")
      .setCallback((data) => {
        if (data.action === picker.Action.PICKED && data.docs?.[0]) {
          instance.dispose();
          resolve({ id: data.docs[0].id, name: data.docs[0].name });
        } else if (data.action === picker.Action.CANCEL) {
          instance.dispose();
          resolve(null);
        }
      })
      .build();
    instance.setVisible(true);
  });
}

// --- Tokens ----------------------------------------------------------------

export interface AccessToken {
  token: string;
  expiresAt: number;
}

export class PopupBlockedError extends Error {
  constructor() {
    super("The Google sign-in popup was blocked or closed.");
    this.name = "PopupBlockedError";
  }
}

export class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AuthError";
  }
}

// Opens the Google popup. Must be called from (or very shortly after) a user
// gesture, otherwise the popup gets blocked.
// `prompt: "consent"` forces the account/consent screen (first connect),
// `prompt: ""` lets Google skip it if consent was already given.
export async function requestAccessToken(
  prompt: "" | "consent" = "",
): Promise<AccessToken> {
  if (!GOOGLE_CLIENT_ID) {
    throw new AuthError("Google Drive backup is not configured.");
  }
  const oauth2 = await loadGis();

  return new Promise((resolve, reject) => {
    const client = oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID!,
      scope: SCOPE,
      callback: (response) => {
        if (response.error || !response.access_token) {
          reject(
            new AuthError(
              response.error_description ||
                response.error ||
                "Authorization failed",
            ),
          );
          return;
        }
        resolve({
          token: response.access_token,
          // Subtract a minute so we never use a token right at its expiry.
          expiresAt: Date.now() + (response.expires_in - 60) * 1000,
        });
      },
      error_callback: (error) => {
        if (
          error.type === "popup_failed_to_open" ||
          error.type === "popup_closed"
        ) {
          reject(new PopupBlockedError());
        } else {
          reject(new AuthError(error.message || error.type));
        }
      },
    });
    client.requestAccessToken({ prompt });
  });
}

export async function revokeToken(token: string): Promise<void> {
  try {
    const oauth2 = await loadGis();
    await new Promise<void>((resolve) => oauth2.revoke(token, resolve));
  } catch {
    // Revoking is best-effort.
  }
}

// --- Drive REST calls ------------------------------------------------------

export class DriveHttpError extends Error {
  readonly status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = "DriveHttpError";
    this.status = status;
  }
}

async function driveFetch(
  token: string,
  url: string,
  init: RequestInit = {},
): Promise<Response> {
  const response = await fetch(url, {
    ...init,
    headers: { ...init.headers, Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    let message = `${response.status} ${response.statusText}`;
    try {
      const body = await response.json();
      message = body?.error?.message || message;
    } catch {
      // ignore non-JSON error bodies
    }
    throw new DriveHttpError(response.status, message);
  }
  return response;
}

function escapeQuery(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/'/g, "\\'");
}

export interface DriveFolder {
  id: string;
  name: string;
}

// Returns the folder if it still exists and isn't trashed, otherwise null.
export async function getFolder(
  token: string,
  folderId: string,
): Promise<DriveFolder | null> {
  try {
    const response = await driveFetch(
      token,
      `${DRIVE_API}/files/${encodeURIComponent(folderId)}?fields=id,name,trashed`,
    );
    const file = await response.json();
    return file.trashed ? null : { id: file.id, name: file.name };
  } catch (error) {
    if (error instanceof DriveHttpError && error.status === 404) return null;
    throw error;
  }
}

// Reuses an existing app-created folder with that name (e.g. when connecting
// again from another device) or creates a new one.
export async function findOrCreateFolder(
  token: string,
  name: string = DEFAULT_FOLDER_NAME,
): Promise<DriveFolder> {
  const q = `name = '${escapeQuery(name)}' and mimeType = '${FOLDER_MIME}' and trashed = false`;
  const listResponse = await driveFetch(
    token,
    `${DRIVE_API}/files?q=${encodeURIComponent(q)}&fields=files(id,name)&orderBy=createdTime&spaces=drive`,
  );
  const { files } = await listResponse.json();
  if (files?.length) {
    return { id: files[0].id, name: files[0].name };
  }

  const createResponse = await driveFetch(
    token,
    `${DRIVE_API}/files?fields=id,name`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, mimeType: FOLDER_MIME }),
    },
  );
  const folder = await createResponse.json();
  return { id: folder.id, name: folder.name };
}

export async function uploadJsonFile(
  token: string,
  folderId: string,
  fileName: string,
  json: string,
): Promise<{ id: string; name: string }> {
  const boundary = `pumpel-${crypto.randomUUID()}`;
  const metadata = {
    name: fileName,
    mimeType: "application/json",
    parents: [folderId],
  };
  const body =
    `--${boundary}\r\n` +
    `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
    `${JSON.stringify(metadata)}\r\n` +
    `--${boundary}\r\n` +
    `Content-Type: application/json\r\n\r\n` +
    `${json}\r\n` +
    `--${boundary}--`;

  const response = await driveFetch(
    token,
    `${UPLOAD_API}/files?uploadType=multipart&fields=id,name`,
    {
      method: "POST",
      headers: { "Content-Type": `multipart/related; boundary=${boundary}` },
      body,
    },
  );
  return response.json();
}

// Moves every file in the folder created before `olderThan` to the Drive
// trash (Drive empties the trash itself after 30 days). Returns the count.
export async function trashFilesOlderThan(
  token: string,
  folderId: string,
  olderThan: number,
): Promise<number> {
  const cutoff = new Date(olderThan).toISOString();
  const q = `'${escapeQuery(folderId)}' in parents and trashed = false and mimeType != '${FOLDER_MIME}' and createdTime < '${cutoff}'`;

  let trashed = 0;
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      q,
      fields: "nextPageToken,files(id)",
      pageSize: "100",
      spaces: "drive",
    });
    if (pageToken) params.set("pageToken", pageToken);

    const response = await driveFetch(token, `${DRIVE_API}/files?${params}`);
    const page = await response.json();

    for (const file of page.files ?? []) {
      await driveFetch(token, `${DRIVE_API}/files/${file.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trashed: true }),
      });
      trashed++;
    }
    pageToken = page.nextPageToken;
  } while (pageToken);

  return trashed;
}
