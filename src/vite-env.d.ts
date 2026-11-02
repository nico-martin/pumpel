/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  // OAuth 2.0 Web client ID from Google Cloud Console. Enables Drive backups.
  readonly VITE_GOOGLE_CLIENT_ID?: string;
  // Browser API key + Cloud project number. Enable choosing the backup folder.
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_GOOGLE_APP_ID?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
