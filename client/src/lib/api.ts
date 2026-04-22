import type { SnapshotResponse } from '../entities/units/types';
import { SNAPSHOT_URL } from './env';
import { markApiEnd, markApiStart, measureApiSpan } from './performanceMarks';

export const fetchInitialSnapshot = async (): Promise<SnapshotResponse> => {
  const measureName = 'api:snapshot';
  const startMark = markApiStart(measureName);
  const res = await fetch(SNAPSHOT_URL);

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
