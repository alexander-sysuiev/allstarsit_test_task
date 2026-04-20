import type { SnapshotResponse } from '../entities/units/types';

const SERVER_BASE_URL = 'http://localhost:4000';

export const fetchInitialSnapshot = async (): Promise<SnapshotResponse> => {
  const res = await fetch(`${SERVER_BASE_URL}/api/snapshot`);

  if (!res.ok) {
    throw new Error(`Failed to fetch snapshot: ${res.status}`);
  }

  const payload = (await res.json()) as SnapshotResponse;
  return payload;
};
