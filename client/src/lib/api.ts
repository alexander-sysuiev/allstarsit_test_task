import type { SnapshotResponse } from '../entities/units/types';
import { markApiEnd, markApiStart, measureApiSpan } from './performanceMarks';

const SERVER_BASE_URL = 'http://localhost:4000';

export const fetchInitialSnapshot = async (): Promise<SnapshotResponse> => {
  const measureName = 'api:snapshot';
  const startMark = markApiStart(measureName);
  const res = await fetch(`${SERVER_BASE_URL}/api/snapshot`);

  if (!res.ok) {
    const endMark = markApiEnd(measureName);
    measureApiSpan(measureName, startMark, endMark);
    throw new Error(`Failed to fetch snapshot: ${res.status}`);
  }

  const payload = (await res.json()) as SnapshotResponse;
  const endMark = markApiEnd(measureName);
  measureApiSpan(measureName, startMark, endMark);
  return payload;
};
