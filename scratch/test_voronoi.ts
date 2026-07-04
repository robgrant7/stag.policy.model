import { getVoronoiCellForCenter, mergePolygons } from '../src/utils/generator';

interface Point { x: number; y: number; }

const centers = [
  { id: 'settlement-1', x: 28.7, y: 67.9 },
  { id: 'settlement-2', x: 32.5, y: 50.0 },
  { id: 'settlement-3', x: 35.0, y: 15.0 },
  { id: 'settlement-4', x: 72.0, y: 40.0 },
] as any;

centers.forEach((c: any) => {
  const cell = getVoronoiCellForCenter(c, centers);
  console.log(`Center ${c.id} at (${c.x}, ${c.y}) cell:`, JSON.stringify(cell));
});
