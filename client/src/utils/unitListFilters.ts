import type { FiltersState } from '../store/slices/filtersSlice';
import type { Unit, UnitStatus } from '../entities/units/types';

export interface UnitListFilters {
  query: string;
  status: UnitStatus | 'all';
  minHealth: number;
  maxHealth: number;
}

export const normalizeHealthRange = (
  minHealthInput: string,
  maxHealthInput: string
): Pick<UnitListFilters, 'minHealth' | 'maxHealth'> => {
  const minHealth = Math.max(0, Number(minHealthInput) || 0);
  const maxHealth = Math.max(minHealth, Number(maxHealthInput) || 0);

  return { minHealth, maxHealth };
};

export const matchesUnitListFilters = (unit: Unit, filters: UnitListFilters): boolean => {
  if (filters.query.length > 0 && !unit.name.toLowerCase().includes(filters.query)) {
    return false;
  }

  if (filters.status !== 'all' && unit.status !== filters.status) {
    return false;
  }

  if (unit.health < filters.minHealth || unit.health > filters.maxHealth) {
    return false;
  }

  return true;
};

export const filterUnitsForList = (
  units: Unit[],
  battlefieldFilters: FiltersState,
  listFilters: UnitListFilters
): Unit[] => {
  return units.filter((unit) => {
    if (battlefieldFilters.team !== 'all' && unit.team !== battlefieldFilters.team) {
      return false;
    }

    if (battlefieldFilters.zone !== 'all' && unit.zone !== battlefieldFilters.zone) {
      return false;
    }

    if (!battlefieldFilters.includeDestroyed && !unit.alive) {
      return false;
    }

    return matchesUnitListFilters(unit, listFilters);
  });
};
