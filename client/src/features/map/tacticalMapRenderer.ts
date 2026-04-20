import type { Unit } from '../../entities/units/types';
import type { FiltersState } from '../../store/slices/filtersSlice';

const WORLD_WIDTH = 2000;
const WORLD_HEIGHT = 2000;
const TEAM_COLORS = {
  red: '#d94848',
  blue: '#2563eb'
} as const;

interface TacticalMapScene {
  units: Unit[];
  filters: FiltersState;
  tickNumber: number;
}

const filtersMatch = (unit: Unit, filters: FiltersState): boolean => {
  if (filters.team !== 'all' && unit.team !== filters.team) {
    return false;
  }

  if (filters.zone !== 'all' && unit.zone !== filters.zone) {
    return false;
  }

  if (!filters.includeDestroyed && !unit.alive) {
    return false;
  }

  return true;
};

export class TacticalMapRenderer {
  private readonly canvas: HTMLCanvasElement;
  private readonly context: CanvasRenderingContext2D;
  private frameId: number | null = null;
  private width = 0;
  private height = 0;
  private pixelRatio = 1;
  private pendingScene: TacticalMapScene | null = null;
  private drawnTick = -1;
  private drawnFiltersKey = '';

  constructor(canvas: HTMLCanvasElement) {
    const context = canvas.getContext('2d');
    if (!context) {
      throw new Error('2D canvas context is not available');
    }

    this.canvas = canvas;
    this.context = context;
  }

  resize(width: number, height: number): void {
    const nextWidth = Math.max(1, Math.floor(width));
    const nextHeight = Math.max(1, Math.floor(height));
    const nextPixelRatio = window.devicePixelRatio || 1;

    if (
      nextWidth === this.width &&
      nextHeight === this.height &&
      nextPixelRatio === this.pixelRatio
    ) {
      return;
    }

    this.width = nextWidth;
    this.height = nextHeight;
    this.pixelRatio = nextPixelRatio;

    this.canvas.width = nextWidth * nextPixelRatio;
    this.canvas.height = nextHeight * nextPixelRatio;

    this.scheduleDraw();
  }

  setScene(scene: TacticalMapScene): void {
    const filtersKey = `${scene.filters.team}|${scene.filters.zone}|${scene.filters.includeDestroyed}`;
    if (scene.tickNumber === this.drawnTick && filtersKey === this.drawnFiltersKey) {
      return;
    }

    this.pendingScene = scene;
    this.scheduleDraw();
  }

  destroy(): void {
    if (this.frameId !== null) {
      cancelAnimationFrame(this.frameId);
    }
  }

  private scheduleDraw(): void {
    if (this.frameId !== null) {
      return;
    }

    this.frameId = requestAnimationFrame(() => {
      this.frameId = null;
      this.draw();
    });
  }

  private draw(): void {
    const scene = this.pendingScene;
    if (!scene || this.width === 0 || this.height === 0) {
      return;
    }

    const ctx = this.context;
    ctx.setTransform(this.pixelRatio, 0, 0, this.pixelRatio, 0, 0);
    ctx.clearRect(0, 0, this.width, this.height);

    const scaleX = this.width / WORLD_WIDTH;
    const scaleY = this.height / WORLD_HEIGHT;

    for (const unit of scene.units) {
      if (!filtersMatch(unit, scene.filters)) {
        continue;
      }

      const x = unit.x * scaleX;
      const y = unit.y * scaleY;
      const color = TEAM_COLORS[unit.team];

      if (unit.alive) {
        ctx.fillStyle = color;
        ctx.globalAlpha = 0.9;
        ctx.beginPath();
        ctx.arc(x, y, 2.25, 0, Math.PI * 2);
        ctx.fill();
        continue;
      }

      ctx.strokeStyle = color;
      ctx.lineWidth = 1.5;
      ctx.globalAlpha = 0.45;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.globalAlpha = 1;

    this.drawnTick = scene.tickNumber;
    this.drawnFiltersKey = `${scene.filters.team}|${scene.filters.zone}|${scene.filters.includeDestroyed}`;
  }
}
