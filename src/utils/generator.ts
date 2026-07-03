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
 * Calculates cross product of vectors OA and OB
 * Returns positive if counter-clockwise turn, negative if clockwise, zero if collinear
 */
function crossProduct(o: { x: number; y: number }, a: { x: number; y: number }, b: { x: number; y: number }): number {
  return (a.x - o.x) * (b.y - o.y) - (a.y - o.y) * (b.x - o.x);
}

/**
 * Computes the Convex Hull of a set of points using Andrew's Monotone Chain algorithm
 */
export function getConvexHull(points: { x: number; y: number }[]): { x: number; y: number }[] {
  if (points.length <= 1) return [...points];
  
  // Remove duplicates
  const uniquePoints = points.filter((p, index, self) =>
    self.findIndex(t => t.x === p.x && t.y === p.y) === index
  );
  
  if (uniquePoints.length <= 2) {
    return uniquePoints;
  }

  // Sort points by x-coordinate, then by y-coordinate
  uniquePoints.sort((a, b) => (a.x !== b.x ? a.x - b.x : a.y - b.y));

  const lower: { x: number; y: number }[] = [];
  for (let i = 0; i < uniquePoints.length; i++) {
    while (
      lower.length >= 2 &&
      crossProduct(lower[lower.length - 2], lower[lower.length - 1], uniquePoints[i]) <= 0
    ) {
      lower.pop();
    }
    lower.push(uniquePoints[i]);
  }

  const upper: { x: number; y: number }[] = [];
  for (let i = uniquePoints.length - 1; i >= 0; i--) {
    while (
      upper.length >= 2 &&
      crossProduct(upper[upper.length - 2], upper[upper.length - 1], uniquePoints[i]) <= 0
    ) {
      upper.pop();
    }
    upper.push(uniquePoints[i]);
  }

  // Remove the last point of each half because it is repeated
  lower.pop();
  upper.pop();

  return lower.concat(upper);
}

/**
 * Expands a polygon outward from its centroid by a padding distance
 */
export function expandPolygon(vertices: { x: number; y: number }[], padding = 5): { x: number; y: number }[] {
  if (vertices.length === 0) return [];
  
  // Calculate centroid
  let sumX = 0;
  let sumY = 0;
  vertices.forEach(v => {
    sumX += v.x;
    sumY += v.y;
  });
  const cx = sumX / vertices.length;
  const cy = sumY / vertices.length;
  
  // Move each vertex outward from centroid by padding units
  return vertices.map(v => {
    const dx = v.x - cx;
    const dy = v.y - cy;
    const len = Math.sqrt(dx * dx + dy * dy);
    
    let x = v.x;
    let y = v.y;
    
    if (len > 0) {
      x = v.x + (dx / len) * padding;
      y = v.y + (dy / len) * padding;
    }
    
    // Do NOT clamp to 100x100 bounds to prevent cutting off corners of expanded polygons
    return {
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
    };
  });
}

/**
 * Ray-casting algorithm to check if a coordinate point lies inside a polygon boundary
 */
export function isPointInPolygon(point: { x: number; y: number }, polygon: { x: number; y: number }[]): boolean {
  if (!polygon || polygon.length === 0) return false;
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
export function generateCatchmentPolygon(cx: number, cy: number, baseRadius = 35): { x: number; y: number }[] {
  const vertexCount = 6 + Math.floor(Math.random() * 3); // 6 to 8 vertices
  const angles: number[] = [];

  for (let i = 0; i < vertexCount; i++) {
    // Uniformly distribute angles with small random variance to prevent self-intersection
    const baseAngle = (i * 2 * Math.PI) / vertexCount;
    const sectorWidth = (2 * Math.PI) / vertexCount;
    const variance = (Math.random() - 0.5) * sectorWidth * 0.5; // up to 25% variance either side
    angles.push(baseAngle + variance);
  }
  
  // Sort angles ascending to ensure a simple, non-self-crossing polygon
  angles.sort((a, b) => a - b);

  return angles.map((angle) => {
    // Generate radius with a small variance above baseRadius
    const radius = baseRadius + Math.random() * 4;
    
    let x = cx + radius * Math.cos(angle);
    let y = cy + radius * Math.sin(angle);
    
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
      color: '#3b82f6', // Blue
      polygon: [],
    });
  } else if (count === 2) {
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
      color: '#3b82f6', // Blue
      polygon: [],
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
      color: '#ef4444', // Red
      polygon: [],
    });
  } else {
    // 3 schools
    // School A (X: 10-25, Y: 20-80)
    const ax = 10 + Math.random() * 15;
    const ay = 20 + Math.random() * 60;
    
    schools.push({
      id: 'school-a',
      name: 'School Alpha',
      x: Math.round(ax * 10) / 10,
      y: Math.round(ay * 10) / 10,
      color: '#3b82f6', // Blue
      polygon: [],
    });

    // School B (X: 45-55, Y: 20-80)
    const bx = 45 + Math.random() * 10;
    const by = 20 + Math.random() * 60;

    schools.push({
      id: 'school-b',
      name: 'School Beta',
      x: Math.round(bx * 10) / 10,
      y: Math.round(by * 10) / 10,
      color: '#ef4444', // Red
      polygon: [],
    });

    // School C (X: 75-90, Y: 20-80)
    const cx = 75 + Math.random() * 15;
    const cy = 20 + Math.random() * 60;

    schools.push({
      id: 'school-c',
      name: 'School Gamma',
      x: Math.round(cx * 10) / 10,
      y: Math.round(cy * 10) / 10,
      color: '#eab308', // Yellow
      polygon: [],
    });
  }

  return schools;
}

/**
 * Helper to compute a stable, deterministic integer between 0 and 99 from a string ID
 */
export function getDeterministicScore(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash << 5) - hash + id.charCodeAt(i);
    hash |= 0; // Convert to 32bit integer
  }
  return Math.abs(hash) % 100;
}

/**
 * Asserts the transport policy assignment rules on a set of student nodes
 */
export function assignHouseholds(
  households: Household[],
  schools: School[],
  policy: TransportPolicy,
  overlapRule: 'community' | 'legacy_slider' = 'community',
  legacyPreference = 70,
  centers: SettlementCenter[] = []
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

    // Strict Policy check
    if (policy === 'nearest' || schools.length === 1) {
      return {
        ...h,
        assignedSchoolId: closestSchoolId as 'school-a' | 'school-b' | 'school-c',
      };
    }

    // policy === 'catchment'
    // Find all schools whose polygon contains the student
    const matchingSchools = schools.filter((s) => isPointInPolygon(h, s.polygon));

    let assignedSchoolId: string;

    if (matchingSchools.length === 1) {
      // Exclusive Zone
      assignedSchoolId = matchingSchools[0].id;
    } else if (matchingSchools.length === 2) {
      // Overlap Corridor (A & B, or B & C)
      // Sort left-to-right to identify school1 and school2
      const sortedMatches = [...matchingSchools].sort((a, b) => a.x - b.x);
      const school1 = sortedMatches[0];
      const school2 = sortedMatches[1];

      if (overlapRule === 'community') {
        // Feeder Settlement Unity
        if (h.type === 'village' && h.settlementId) {
          const center = centers.find((c) => c.id === h.settlementId);
          if (center) {
            const distTo1 = getDistance(center.x, center.y, school1.x, school1.y);
            const distTo2 = getDistance(center.x, center.y, school2.x, school2.y);
            assignedSchoolId = distTo1 <= distTo2 ? school1.id : school2.id;
          } else {
            // Outlier fallback inside the two matching schools
            const distTo1 = getDistance(h.x, h.y, school1.x, school1.y);
            const distTo2 = getDistance(h.x, h.y, school2.x, school2.y);
            assignedSchoolId = distTo1 <= distTo2 ? school1.id : school2.id;
          }
        } else {
          // Outlier fallback inside the two matching schools
          const distTo1 = getDistance(h.x, h.y, school1.x, school1.y);
          const distTo2 = getDistance(h.x, h.y, school2.x, school2.y);
          assignedSchoolId = distTo1 <= distTo2 ? school1.id : school2.id;
        }
      } else {
        // Historical Legacy Split (deterministic probability check)
        const score = getDeterministicScore(h.id);
        assignedSchoolId = score < legacyPreference ? school1.id : school2.id;
      }
    } else {
      // Fallback for outside all polygons or in 3-way overlap (if any) -> closest school among all active schools
      assignedSchoolId = closestSchoolId;
    }

    return {
      ...h,
      assignedSchoolId: assignedSchoolId as 'school-a' | 'school-b' | 'school-c',
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
  
  // 1. Generate centers & schools (polygons will be overwritten with edge-to-edge layout)
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

  // 4. Calculate edge-to-edge catchment polygons
  if (schoolCount === 1) {
    const schoolA = schools.find((s) => s.id === 'school-a');
    if (schoolA) {
      schoolA.polygon = [
        { x: 0, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: 0, y: 100 },
      ];
    }
  } else if (schoolCount === 2) {
    const schoolA = schools.find((s) => s.id === 'school-a');
    const schoolB = schools.find((s) => s.id === 'school-b');
    
    if (schoolA && schoolB) {
      const xMid = (schoolA.x + schoolB.x) / 2;
      const overlapWidth = 15;
      
      // School A Catchment Polygon: covers X=0 to X_mid + overlapWidth
      schoolA.polygon = [
        { x: 0, y: 0 },
        { x: Math.round((xMid + overlapWidth) * 10) / 10, y: 0 },
        { x: Math.round((xMid + overlapWidth) * 10) / 10, y: 100 },
        { x: 0, y: 100 },
      ];
      
      // School B Catchment Polygon: covers X_mid - overlapWidth to X=100
      schoolB.polygon = [
        { x: Math.round((xMid - overlapWidth) * 10) / 10, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: Math.round((xMid - overlapWidth) * 10) / 10, y: 100 },
      ];
    }
  } else {
    // 3 schools: A, B, C
    const schoolA = schools.find((s) => s.id === 'school-a');
    const schoolB = schools.find((s) => s.id === 'school-b');
    const schoolC = schools.find((s) => s.id === 'school-c');
    
    if (schoolA && schoolB && schoolC) {
      const xMidAB = (schoolA.x + schoolB.x) / 2;
      const xMidBC = (schoolB.x + schoolC.x) / 2;
      const overlapWidth = 12;
      
      // Polygon A (Left): covers X=0 to X_midAB + overlapWidth
      schoolA.polygon = [
        { x: 0, y: 0 },
        { x: Math.round((xMidAB + overlapWidth) * 10) / 10, y: 0 },
        { x: Math.round((xMidAB + overlapWidth) * 10) / 10, y: 100 },
        { x: 0, y: 100 },
      ];
      
      // Polygon B (Center): covers X_midAB - overlapWidth to X_midBC + overlapWidth
      schoolB.polygon = [
        { x: Math.round((xMidAB - overlapWidth) * 10) / 10, y: 0 },
        { x: Math.round((xMidBC + overlapWidth) * 10) / 10, y: 0 },
        { x: Math.round((xMidBC + overlapWidth) * 10) / 10, y: 100 },
        { x: Math.round((xMidAB - overlapWidth) * 10) / 10, y: 100 },
      ];
      
      // Polygon C (Right): covers X_midBC - overlapWidth to X=100
      schoolC.polygon = [
        { x: Math.round((xMidBC - overlapWidth) * 10) / 10, y: 0 },
        { x: 100, y: 0 },
        { x: 100, y: 100 },
        { x: Math.round((xMidBC - overlapWidth) * 10) / 10, y: 100 },
      ];
    }
  }

  return {
    households,
    centers,
    schools,
  };
}

export interface FinancialReport {
  catchmentCost: number;
  nearestCost: number;
  activeCost: number;
  deficit: number;
  splits: {
    centerId: string;
    centerName: string;
    totalStudents: number;
    fragmentedCount: number;
    distribution: { schoolId: string; count: number }[];
  }[];
}

/**
 * Calculates daily transport operational costs and detects village splits
 */
export function calculateFinancials(
  households: Household[],
  centers: SettlementCenter[],
  activePolicy: TransportPolicy
): FinancialReport {
  const totalStudents = households.length;
  const catchmentCost = totalStudents * 10;

  // 1. Group households by cohort
  const villageCohorts: Record<string, Household[]> = {};
  const isolatedCohort: Household[] = [];

  households.forEach((h) => {
    if (h.type === 'village' && h.settlementId) {
      if (!villageCohorts[h.settlementId]) {
        villageCohorts[h.settlementId] = [];
      }
      villageCohorts[h.settlementId].push(h);
    } else {
      isolatedCohort.push(h);
    }
  });

  let nearestCost = 0;
  const splits: FinancialReport['splits'] = [];

  // 2. Helper to calculate cost for a cohort
  const calculateCohortCost = (cohortHouseholds: Household[], centerId?: string) => {
    const counts: Record<string, number> = {
      'school-a': 0,
      'school-b': 0,
      'school-c': 0,
    };

    cohortHouseholds.forEach((h) => {
      if (h.assignedSchoolId) {
        counts[h.assignedSchoolId] = (counts[h.assignedSchoolId] || 0) + 1;
      }
    });

    let cohortCost = 0;
    const distribution: { schoolId: string; count: number }[] = [];

    Object.keys(counts).forEach((schoolId) => {
      const headcount = counts[schoolId];
      if (headcount > 0) {
        distribution.push({ schoolId, count: headcount });
        if (headcount > 16) {
          cohortCost += headcount * 10;
        } else {
          cohortCost += headcount * 25;
        }
      }
    });

    // Check splits for village cohorts
    if (centerId) {
      const center = centers.find((c) => c.id === centerId);
      const activeDestinations = distribution.filter((d) => d.count > 0);
      
      if (activeDestinations.length > 1) {
        const sortedDests = [...activeDestinations].sort((a, b) => b.count - a.count);
        const majorityDest = sortedDests[0];
        const fragmentedCount = cohortHouseholds.length - majorityDest.count;
        
        splits.push({
          centerId,
          centerName: center ? center.name : `Village ${centerId}`,
          totalStudents: cohortHouseholds.length,
          fragmentedCount,
          distribution,
        });
      }
    }

    return cohortCost;
  };

  // Calculate village cohort costs
  Object.keys(villageCohorts).forEach((centerId) => {
    nearestCost += calculateCohortCost(villageCohorts[centerId], centerId);
  });

  // Calculate isolated cohort cost
  nearestCost += calculateCohortCost(isolatedCohort);

  const activeCost = activePolicy === 'catchment' ? catchmentCost : nearestCost;
  const deficit = nearestCost - catchmentCost;

  return {
    catchmentCost,
    nearestCost,
    activeCost,
    deficit,
    splits,
  };
}
