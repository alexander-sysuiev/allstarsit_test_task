import type { Unit } from '../entities/units/types';

const SERVER_BASE_URL = 'http://localhost:4000';

interface UnitsResponse {
  units: Unit[];
}

export const fetchInitialUnits = async (): Promise<Unit[]> => {
  const res = await fetch(`${SERVER_BASE_URL}/api/units`);

  if (!res.ok) {
    throw new Error(`Failed to fetch units: ${res.status}`);
  }

  const json = (await res.json()) as UnitsResponse;
  return json.units;
};
