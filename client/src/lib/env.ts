const apiBaseUrl = import.meta.env.VITE_API_BASE_URL;

if (!apiBaseUrl) {
  throw new Error('Missing VITE_API_BASE_URL');
}

export const API_BASE_URL = apiBaseUrl;
export const SNAPSHOT_URL = `${API_BASE_URL}/api/snapshot`;
export const STREAM_URL = `${API_BASE_URL}/api/stream`;
