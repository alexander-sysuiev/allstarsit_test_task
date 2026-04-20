export type Team = 'red' | 'blue';

export type Zone = 'north-west' | 'north-east' | 'south-west' | 'south-east';

export type UnitStatus = 'idle' | 'moving' | 'attacking' | 'healing' | 'dead';

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

export interface UnitPatch {
  id: string;
  version: number;
  changes: Partial<Pick<Unit, 'x' | 'y' | 'health' | 'status' | 'alive' | 'zone'>>;
}

export type ZoneControl = Team | 'contested' | 'neutral';

export interface BattlefieldKpis {
  unitsAlive: number;
  destroyedCount: number;
  zoneControl: Record<Zone, ZoneControl>;
}

export type BattleEventType = 'move' | 'attack' | 'heal' | 'idle' | 'destroy' | 'capture';

export interface BattleEvent {
  id: string;
  tickNumber: number;
  serverTime: number;
  type: BattleEventType;
  zone: Zone;
  details: string;
  unitId?: string;
  targetId?: string;
  team?: Team;
}

export interface TickDelta {
  tickNumber: number;
  serverTime: number;
  changedUnits: UnitPatch[];
  events: BattleEvent[];
  kpis: BattlefieldKpis;
}

export interface SnapshotResponse {
  tickNumber: number;
  kpis: BattlefieldKpis;
  units: Unit[];
}
