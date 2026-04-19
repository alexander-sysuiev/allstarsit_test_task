import { useEffect, useRef } from 'react';
import type { Unit } from '../../entities/units/types';

interface MapCanvasProps {
  units: Unit[];
  width: number;
  height: number;
}

export const MapCanvas = ({ units, width, height }: MapCanvasProps): JSX.Element => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    // TODO: move rendering to OffscreenCanvas/worker if paint cost becomes high.
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }

    ctx.clearRect(0, 0, width, height);

    for (const unit of units) {
      ctx.fillStyle = unit.team === 'red' ? '#d94848' : '#3b82f6';
      ctx.globalAlpha = unit.status === 'destroyed' ? 0.25 : 0.95;
      ctx.fillRect((unit.x / 2000) * width, (unit.y / 2000) * height, 2, 2);
    }

    ctx.globalAlpha = 1;
  }, [units, width, height]);

  return <canvas ref={canvasRef} width={width} height={height} className="map-canvas" />;
};
