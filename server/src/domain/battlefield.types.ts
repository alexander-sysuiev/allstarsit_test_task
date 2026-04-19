export type Team = 'red' | 'blue';

export type UnitStatus = 'idle' | 'moving' | 'attacking' | 'healing' | 'dead';

export type Zone = 'north-west' | 'north-east' | 'south-west' | 'south-east';

export interface Unit {
  id: string;
  name: string;
  team: Team;
  x: number;
  y: number;
  health: number;
  status: UnitStatus;
  alive: boolean;
  zone: Zone;
  version: number;
}

export type BattleEventType = 'move' | 'attack' | 'heal' | 'idle' | 'death' | 'zone-change';

export interface BattleEvent {
  id: string;
  tick: number;
  at: number;
  type: BattleEventType;
  unitId: string;
  team: Team;
  zone: Zone;
  details: string;
}

export interface TeamKpis {
  total: number;
  alive: number;
  avgHealth: number;
}

export type ZoneControl = Team | 'contested' | 'neutral';

export interface BattlefieldKpis {
  tick: number;
  totalUnits: number;
  aliveUnits: number;
  deadUnits: number;
  red: TeamKpis;
  blue: TeamKpis;
  zoneControl: Record<Zone, ZoneControl>;
}

export interface UnitPatch {
  id: string;
  version: number;
  changes: Partial<Pick<Unit, 'x' | 'y' | 'health' | 'status' | 'alive' | 'zone'>>;
}

export interface TickDelta {
  tick: number;
  at: number;
  patches: UnitPatch[];
  events: BattleEvent[];
  kpis: BattlefieldKpis;
}

export interface InitialSnapshot {
  tick: number;
  units: Unit[];
  kpis: BattlefieldKpis;
}

export interface MapBounds {
  width: number;
  height: number;
}
