// Type definitions for Workbox
declare module 'workbox-precaching' {
  export function precacheAndRoute(entries: any[]): void;
  export function cleanupOutdatedCaches(): void;
}

declare module 'workbox-core' {
  export function clientsClaim(): void;
}

// Workbox manifest injected by vite-plugin-pwa
declare const __WB_MANIFEST: any;
