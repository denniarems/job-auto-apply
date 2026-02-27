const backendUrl = import.meta.env.VITE_BACKEND_URL;
if (!backendUrl) {
  throw new Error("VITE_BACKEND_URL environment variable is not set");
}
export const DEFAULT_BACKEND_URL: string = backendUrl;

// Re-export as BACKEND_URL for backwards compatibility
export const BACKEND_URL = DEFAULT_BACKEND_URL;
