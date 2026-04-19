import type { MapBounds, Team, Unit, Zone, ZoneControl } from './battlefield.types.js';

export const ZONES: readonly Zone[] = ['north-west', 'north-east', 'south-west', 'south-east'];

export const clampToBounds = (value: number, min: number, max: number): number => {
  return Math.min(max, Math.max(min, value));
};

export const resolveZone = (x: number, y: number, bounds: MapBounds): Zone => {
  const halfWidth = bounds.width / 2;
  const halfHeight = bounds.height / 2;

  if (x < halfWidth && y < halfHeight) {
    return 'north-west';
  }
  if (x >= halfWidth && y < halfHeight) {
    return 'north-east';
  }
  if (x < halfWidth && y >= halfHeight) {
    return 'south-west';
  }
  return 'south-east';
};

export const calculateZoneControl = (units: Unit[]): Record<Zone, ZoneControl> => {
  const zoneCount: Record<Zone, { red: number; blue: number }> = {
    'north-west': { red: 0, blue: 0 },
    'north-east': { red: 0, blue: 0 },
    'south-west': { red: 0, blue: 0 },
    'south-east': { red: 0, blue: 0 }
  };

  for (const unit of units) {
    if (!unit.alive) {
      continue;
    }
    zoneCount[unit.zone][unit.team] += 1;
  }

  const control: Record<Zone, ZoneControl> = {
    'north-west': 'neutral',
    'north-east': 'neutral',
    'south-west': 'neutral',
    'south-east': 'neutral'
  };

  for (const zone of ZONES) {
    const zoneValue = zoneCount[zone];
    const leader: Team | 'tie' =
      zoneValue.red === zoneValue.blue ? 'tie' : zoneValue.red > zoneValue.blue ? 'red' : 'blue';

    control[zone] =
      zoneValue.red === 0 && zoneValue.blue === 0
        ? 'neutral'
        : leader === 'tie'
          ? 'contested'
          : leader;
  }

  return control;
};
