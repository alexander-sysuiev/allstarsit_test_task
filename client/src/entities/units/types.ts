export type Team = 'red' | 'blue';

export interface Unit {
  id: string;
  x: number;
  y: number;
  hp: number;
  team: Team;
  status: 'active' | 'destroyed';
}

export interface UnitDelta {
  id: string;
  x?: number;
  y?: number;
  hp?: number;
  status?: Unit['status'];
}

export interface UnitsDeltaEvent {
  updates: UnitDelta[];
  ts: number;
}
