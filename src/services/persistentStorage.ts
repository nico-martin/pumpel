// Wrapper around the StorageManager persistence API. Persistent storage keeps
// the browser from evicting IndexedDB data under storage pressure.

export type PersistState = "unsupported" | "persisted" | "not-persisted";

export function isPersistSupported(): boolean {
  return typeof navigator !== "undefined" && !!navigator.storage?.persist;
}

export async function getPersistState(): Promise<PersistState> {
  if (!isPersistSupported()) return "unsupported";
  return (await navigator.storage.persisted()) ? "persisted" : "not-persisted";
}

// Returns true if the browser granted persistence. Chrome decides silently
// (e.g. based on installation/engagement), Firefox asks the user.
export async function requestPersistentStorage(): Promise<boolean> {
  if (!isPersistSupported()) return false;
  return navigator.storage.persist();
}
