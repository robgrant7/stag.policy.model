import { getVoronoiCellForCenter, mergePolygons, isPointInPolygon, getDistanceToSegment } from '../src/utils/generator';

interface Point { x: number; y: number; }

const centers = [
  { id: 'settlement-1', x: 19.0, y: 67.5 },
  { id: 'settlement-2', x: 27.0, y: 83.0 },
  { id: 'settlement-3', x: 70.0, y: 42.0 },
  { id: 'settlement-4', x: 65.0, y: 27.0 },
] as any;

const schools = [
  { id: 'school-a', name: 'School A', x: 19.0, y: 67.5, color: '#3b82f6', polygon: [], polygons: [] },
  { id: 'school-b', name: 'School B', x: 27.0, y: 83.0, color: '#ef4444', polygon: [], polygons: [] },
  { id: 'school-c', name: 'School C', x: 70.0, y: 42.0, color: '#84cc16', polygon: [], polygons: [] },
] as any;

const schoolAssignments: Record<string, string[]> = {};

// Identify the home village center containing each school
const homeCenters = new Set<string>();
const anchorForSchool: Record<string, string> = {}; // schoolId -> centerId

schools.forEach((s: any) => {
  const matchingCenter = centers.find((c: any) => Math.abs(s.x - c.x) < 0.1 && Math.abs(s.y - c.y) < 0.1);
  if (matchingCenter) {
    homeCenters.add(matchingCenter.id);
    anchorForSchool[s.id] = matchingCenter.id;
  }
});

// Helper to calculate minimum distance from a school center to a Voronoi cell polygon
function getDistanceToCell(school: { x: number; y: number }, cell: Point[]): number {
  if (isPointInPolygon(school, cell)) return 0;
  
  let minDist = Infinity;
  for (let i = 0; i < cell.length; i++) {
    const p1 = cell[i];
    const p2 = cell[(i + 1) % cell.length];
    const dist = getDistanceToSegment(school.x, school.y, p1.x, p1.y, p2.x, p2.y);
    if (dist < minDist) {
      minDist = dist;
    }
  }
  return minDist;
}

// Assign each village to schools
centers.forEach((center: any) => {
  let assignedSchools: string[] = [];
  
  // If it's a home center of a school, it is assigned EXCLUSIVELY to that school to prevent rival pin engulfment
  let isHome = false;
  schools.forEach((s: any) => {
    if (anchorForSchool[s.id] === center.id) {
      assignedSchools = [s.id];
      isHome = true;
    }
  });
  
  if (!isHome) {
    const cell = getVoronoiCellForCenter(center, centers);
    
    // Find the closest school to the center point
    let closestSchoolId = schools[0].id;
    let minSchoolDist = Infinity;
    schools.forEach((s: any) => {
      const dist = Math.sqrt((center.x - s.x) ** 2 + (center.y - s.y) ** 2);
      if (dist < minSchoolDist) {
        minSchoolDist = dist;
        closestSchoolId = s.id;
      }
    });

    schools.forEach((s: any) => {
      const isClosest = s.id === closestSchoolId;
      const distToCell = getDistanceToCell(s, cell);
      const isWithin30 = distToCell <= 30.0;
      
      if (isClosest || isWithin30) {
        assignedSchools.push(s.id);
      }
    });
  }
  
  schoolAssignments[center.id] = assignedSchools;
});

// Snapping function to lock borders to canvas edges and prevent dead zones
function snapToPerimeter(poly: Point[]): Point[] {
  if (poly.length === 0) return [];
  
  let minX = 100, maxX = 0, minY = 100, maxY = 0;
  poly.forEach((p) => {
    if (p.x < minX) minX = p.x;
    if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y;
    if (p.y > maxY) maxY = p.y;
  });

  return poly.map((p) => {
    let x = p.x;
    let y = p.y;
    if (minX <= 30.0 && x <= 30.0) x = 0;
    if (maxX >= 70.0 && x >= 70.0) x = 100;
    if (minY <= 30.0 && y <= 30.0) y = 0;
    if (maxY >= 70.0 && y >= 70.0) y = 100;
    return { x, y };
  });
}

// Calculate and merge Voronoi cells for each school
schools.forEach((school: any) => {
  const assignedCenters = centers.filter((c: any) => schoolAssignments[c.id].includes(school.id));
  const baseCells = assignedCenters.map((c: any) => getVoronoiCellForCenter(c, centers));

  console.log(`School ${school.id} base cells count:`, baseCells.length);
  baseCells.forEach((cell, idx) => {
    console.log(`  Cell ${idx}:`, JSON.stringify(cell));
  });

  if (baseCells.length > 0) {
    const mergedPolys = mergePolygons(baseCells);
    school.polygons = mergedPolys.map((poly) => snapToPerimeter(poly));
    school.polygon = school.polygons[0] || [];
  } else {
    school.polygon = [];
    school.polygons = [];
  }
  
  console.log(`School ${school.id} final polygons:`, JSON.stringify(school.polygons));
  console.log('----------------------------------------------------');
});
