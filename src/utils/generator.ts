import type { Household, SettlementCenter, School, ScenarioParams, TransportPolicy } from '../types';

// Preset colors for the settlement clusters
const CLUSTER_COLORS = [
  '#10b981', // Emerald/Green (Settlement A)
  '#8b5cf6', // Violet/Purple (Settlement B)
  '#f59e0b', // Amber/Yellow (Settlement C)
];

const CLUSTER_NAMES = ['Settlement Alpha', 'Settlement Beta', 'Settlement Gamma'];

/**
 * Calculates Euclidean distance between two points
 */
function getDistance(x1: number, y1: number, x2: number, y2: number): number {
  return Math.sqrt((x2 - x1) ** 2 + (y2 - y1) ** 2);
}

/**
 * Ray-casting algorithm to check if a coordinate point lies inside a polygon boundary
 */
export function isPointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  const { x, y } = point;
  let inside = false;
  
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > y) !== (yj > y)) &&
      (x < ((xj - xi) * (y - yi)) / (yj - yi) + xi);
      
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Generates N well-spaced settlement center coordinates within the grid range [20, 80]
 */
export function generateSettlementCenters(count: number, minDistance = 25): SettlementCenter[] {
  const centers: SettlementCenter[] = [];
  
  for (let i = 0; i < count; i++) {
    let x = 50;
    let y = 50;
    let attempts = 0;
    let valid = false;
    let currentMinDist = minDistance;

    while (!valid && attempts < 100) {
      x = 20 + Math.random() * 60;
      y = 20 + Math.random() * 60;
      
      valid = true;
      for (const center of centers) {
        if (getDistance(x, y, center.x, center.y) < currentMinDist) {
          valid = false;
          break;
        }
      }
      
      attempts++;
      if (attempts % 20 === 0) {
        currentMinDist = Math.max(10, currentMinDist - 5);
      }
    }

    centers.push({
      id: `settlement-${i + 1}`,
      name: CLUSTER_NAMES[i] || `Settlement ${String.fromCharCode(65 + i)}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      color: CLUSTER_COLORS[i % CLUSTER_COLORS.length],
    });
  }

  return centers;
}

/**
 * Generates an irregular, simple (non-self-intersecting) polygon around a center point
 * by generating sorted radial angles and random distances between 25 and 45 units.
 */
export function generateCatchmentPolygon(cx: number, cy: number): { x: number; y: number }[] {
  const vertexCount = 6 + Math.floor(Math.random() * 3); // 6 to 8 vertices
  const angles: number[] = [];

  for (let i = 0; i < vertexCount; i++) {
    angles.push(Math.random() * 2 * Math.PI);
  }
  
  // Sort angles ascending to guarantee a simple, non-self-intersecting shape
  angles.sort((a, b) => a - b);

  return angles.map((theta) => {
    // Distance uniformly distributed between 25 and 45 units
    const r = 25 + Math.random() * 20;
    
    let x = cx + r * Math.cos(theta);
    let y = cy + r * Math.sin(theta);
    
    // Clamp to 100x100 canvas bounds
    x = Math.max(0, Math.min(100, x));
    y = Math.max(0, Math.min(100, y));

    return {
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    };
  });
}

/**
 * Generates school positions and their catchment polygons based on school count
 */
export function generateSchools(count: number): School[] {
  const schools: School[] = [];

  if (count === 1) {
    // Centered School A (X: 40-60, Y: 40-60)
    const x = 40 + Math.random() * 20;
    const y = 40 + Math.random() * 20;
    const roundedX = Math.round(x * 10) / 10;
    const roundedY = Math.round(y * 10) / 10;
    
    schools.push({
      id: 'school-a',
      name: 'School Alpha',
      x: roundedX,
      y: roundedY,
      color: '#3b82f6', // Indigo / Blue-500
      polygon: generateCatchmentPolygon(roundedX, roundedY),
    });
  } else {
    // 2 schools: School A on Left, School B on Right
    // School A (X: 15-35, Y: 20-80)
    const ax = 15 + Math.random() * 20;
    const ay = 20 + Math.random() * 60;
    const roundedAx = Math.round(ax * 10) / 10;
    const roundedAy = Math.round(ay * 10) / 10;

    schools.push({
      id: 'school-a',
      name: 'School Alpha',
      x: roundedAx,
      y: roundedAy,
      color: '#3b82f6', // Blue-500
      polygon: generateCatchmentPolygon(roundedAx, roundedAy),
    });

    // School B (X: 65-85, Y: 20-80)
    const bx = 65 + Math.random() * 20;
    const by = 20 + Math.random() * 60;
    const roundedBx = Math.round(bx * 10) / 10;
    const roundedBy = Math.round(by * 10) / 10;

    schools.push({
      id: 'school-b',
      name: 'School Beta',
      x: roundedBx,
      y: roundedBy,
      color: '#ef4444', // Red-500
      polygon: generateCatchmentPolygon(roundedBx, roundedBy),
    });
  }

  return schools;
}

/**
 * Asserts the transport policy assignment rules on a set of student nodes
 */
export function assignHouseholds(
  households: Household[],
  schools: School[],
  policy: TransportPolicy
): Household[] {
  return households.map((h) => {
    if (schools.length === 0) return h;

    // Calculate Euclidean distances to active schools
    const distances = schools.map((s) => ({
      id: s.id,
      distance: getDistance(h.x, h.y, s.x, s.y),
    }));

    // Find the closest school
    distances.sort((a, b) => a.distance - b.distance);
    const closestSchoolId = distances[0].id;

    if (policy === 'nearest' || schools.length === 1) {
      return {
        ...h,
        assignedSchoolId: closestSchoolId,
      };
    }

    // policy === 'catchment'
    const schoolA = schools.find((s) => s.id === 'school-a');
    const schoolB = schools.find((s) => s.id === 'school-b');

    const inA = schoolA ? isPointInPolygon(h, schoolA.polygon) : false;
    const inB = schoolB ? isPointInPolygon(h, schoolB.polygon) : false;

    let assignedSchoolId: 'school-a' | 'school-b';

    if (inA && inB) {
      // Overlap Zone: defaults to School A (historical preference)
      assignedSchoolId = 'school-a';
    } else if (inA) {
      assignedSchoolId = 'school-a';
    } else if (inB) {
      assignedSchoolId = 'school-b';
    } else {
      // Outside both polygons: fallback to physically closer school
      assignedSchoolId = closestSchoolId;
    }

    return {
      ...h,
      assignedSchoolId,
    };
  });
}

/**
 * Main function to generate a new scenario containing settlement centers,
 * clustered village households, uniform isolated households, and school geometries.
 */
export function generateScenario(params: ScenarioParams): {
  households: Household[];
  centers: SettlementCenter[];
  schools: School[];
} {
  const { settlementCount, schoolCount, villageCount, isolatedCount, clusterRadius } = params;
  
  // 1. Generate centers & schools
  const centers = generateSettlementCenters(settlementCount);
  const schools = generateSchools(schoolCount);
  const households: Household[] = [];

  // 2. Generate village households clustered around centers
  const baseVillagePerCenter = Math.floor(villageCount / settlementCount);
  const remainder = villageCount % settlementCount;

  centers.forEach((center, index) => {
    const countForThisCenter = baseVillagePerCenter + (index < remainder ? 1 : 0);

    for (let i = 0; i < countForThisCenter; i++) {
      const theta = Math.random() * 2 * Math.PI;
      const r = Math.pow(Math.random(), 1.5) * clusterRadius;
      
      let x = center.x + r * Math.cos(theta);
      let y = center.y + r * Math.sin(theta);
      
      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));

      households.push({
        id: `village-${center.id}-${i + 1}`,
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
        type: 'village',
        settlementId: center.id,
      });
    }
  });

  // 3. Generate isolated households (uniform random across the entire 100x100 canvas)
  for (let i = 0; i < isolatedCount; i++) {
    const x = Math.random() * 100;
    const y = Math.random() * 100;

    households.push({
      id: `isolated-${i + 1}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      type: 'isolated',
    });
  }

  return {
    households,
    centers,
    schools,
  };
}
