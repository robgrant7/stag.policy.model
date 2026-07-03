import type { Household, SettlementCenter, School, ScenarioParams, TransportPolicy } from '../types';

// Preset colors for the settlement clusters
const CLUSTER_COLORS = [
  '#10b981', // Emerald/Green (Settlement A)
  '#8b5cf6', // Violet/Purple (Settlement B)
  '#f59e0b', // Amber/Yellow (Settlement C)
  '#ec4899', // Pink (Settlement D)
  '#06b6d4', // Cyan (Settlement E)
  '#f97316', // Orange (Settlement F)
];

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
export function generateSettlementCenters(count: number): SettlementCenter[] {
  const centers: SettlementCenter[] = [];
  const minDistance = 15; // Minimum distance buffer to prevent overlap

  for (let i = 0; i < count; i++) {
    let bestX = 50;
    let bestY = 50;

    for (let attempts = 0; attempts < 100; attempts++) {
      // Wide range: X in [5, 95], Y in [10, 90]
      const x = 5 + Math.random() * 90;
      const y = 10 + Math.random() * 80;

      // Check distance to all existing centers
      let ok = true;
      for (const existing of centers) {
        const d = getDistance(x, y, existing.x, existing.y);
        if (d < minDistance) {
          ok = false;
          break;
        }
      }

      if (ok || attempts === 99) {
        bestX = x;
        bestY = y;
        break;
      }
    }

    const prefixes = ['Kirk', 'Great', 'Upper', 'Nether', 'Appleton', 'Thistle', 'Slings', 'Gallow'];
    const suffixes = ['by', 'thorpe', 'wick', 'ley', 'oside', 'ford', 'ham'];

    const prefix = prefixes[i % prefixes.length];
    const suffix = suffixes[(i * 3) % suffixes.length];
    let villageName = prefix + suffix;
    if (i === 0) {
      villageName = 'Kirkby-on-the-Moor';
    } else if (i === 2) {
      villageName = `${villageName}-in-the-Moors`;
    } else if (i === 4) {
      villageName = `Upper ${villageName}`;
    }

    const archetype = Math.random() < 0.4 ? 'linear' : 'nucleated';
    const dispersionRadius = 6.0;
    const roadAngle = Math.round(Math.random() * 360);

    centers.push({
      id: `settlement-${i + 1}`,
      name: villageName,
      x: Math.round(bestX * 10) / 10,
      y: Math.round(bestY * 10) / 10,
      color: CLUSTER_COLORS[i] || '#475569',
      headcount: 0, // Will be set in generateScenario
      archetype,
      dispersionRadius,
      roadAngle,
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
  const SCHOOL_NAMES = ['School A', 'School B', 'School C', 'School D', 'School E', 'School F'];
  const SCHOOL_COLORS = ['#3b82f6', '#ef4444', '#84cc16', '#a855f7', '#f97316', '#06b6d4'];
  const SCHOOL_IDS = ['school-a', 'school-b', 'school-c', 'school-d', 'school-e', 'school-f'] as const;

  for (let i = 0; i < count; i++) {
    let x = 50;
    if (count > 1) {
      const defaultX = 10 + (i * 80) / (count - 1);
      const offset = -4 + Math.random() * 8; // slight randomized offset
      x = Math.max(5, Math.min(95, defaultX + offset));
    } else {
      x = 40 + Math.random() * 20;
    }
    const y = 20 + Math.random() * 60;

    schools.push({
      id: SCHOOL_IDS[i],
      name: SCHOOL_NAMES[i],
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      color: SCHOOL_COLORS[i],
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
 * Helper to calculate perpendicular distance from point P to line segment AB
 */
export function getDistanceToSegment(px: number, py: number, ax: number, ay: number, bx: number, by: number): number {
  const dx = bx - ax;
  const dy = by - ay;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.sqrt((px - ax) ** 2 + (py - ay) ** 2);
  
  let t = ((px - ax) * dx + (py - ay) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t)); // Clamp to segment
  
  const projX = ax + t * dx;
  const projY = ay + t * dy;
  return Math.sqrt((px - projX) ** 2 + (py - projY) ** 2);
}

/**
 * Checks if a point lies in the vertical column overlap corridor (within 10 units of any midpoint split)
 */
export function isPointInOverlap(
  px: number,
  _py: number,
  schools: School[],
  buffer = 10
): boolean {
  if (schools.length <= 1) return false;
  
  // schools are sorted left-to-right
  const sorted = [...schools].sort((a, b) => a.x - b.x);
  
  if (sorted.length === 2) {
    const xMid = (sorted[0].x + sorted[1].x) / 2;
    return Math.abs(px - xMid) <= buffer;
  } else {
    const xMid12 = (sorted[0].x + sorted[1].x) / 2;
    const xMid23 = (sorted[1].x + sorted[2].x) / 2;
    return Math.abs(px - xMid12) <= buffer || Math.abs(px - xMid23) <= buffer;
  }
}

/**
 * Helper to determine which horizontal catchment column a student falls into exclusively
 */
export function getExclusiveSchoolId(px: number, schools: School[]): string {
  if (schools.length === 0) return 'school-a';
  if (schools.length === 1) return schools[0].id;
  
  const sorted = [...schools].sort((a, b) => a.x - b.x);
  
  if (sorted.length === 2) {
    const xMid = (sorted[0].x + sorted[1].x) / 2;
    return px < xMid ? sorted[0].id : sorted[1].id;
  } else {
    const xMid12 = (sorted[0].x + sorted[1].x) / 2;
    const xMid23 = (sorted[1].x + sorted[2].x) / 2;
    if (px < xMid12) return sorted[0].id;
    if (px > xMid23) return sorted[2].id;
    return sorted[1].id;
  }
}

export function getEligibleSchoolsForPoint(point: { x: number; y: number }, schools: School[]): string[] {
  const eligible: string[] = [];
  schools.forEach((school) => {
    if (isPointInPolygon(point, school.polygon)) {
      eligible.push(school.id);
    }
  });
  return eligible;
}

/**
 * Asserts the transport policy assignment rules on a set of student nodes
 */
export function assignHouseholds(
  households: Household[],
  schools: School[],
  policy: TransportPolicy,
  overlapRule: 'community' | 'legacy_slider' = 'community',
  legacySplitInput: number | { a: number; b: number; c: number } = { a: 40, b: 30, c: 30 },
  centers: SettlementCenter[] = [],
  attractiveness: Record<string, number> = {}
): Household[] {
  // Normalize legacySplit input
  let legacySplit = { a: 40, b: 30, c: 30 };
  if (typeof legacySplitInput === 'number') {
    legacySplit = { a: legacySplitInput, b: 100 - legacySplitInput, c: 0 };
  } else {
    legacySplit = legacySplitInput;
  }

  // Ensure schools are sorted by X to guarantee stable left-to-right indexing
  const sortedSchools = [...schools].sort((a, b) => a.x - b.x);

  return households.map((h) => {
    if (sortedSchools.length === 0) return h;

    // Calculate Euclidean distances to active schools
    const distances = sortedSchools.map((s) => ({
      id: s.id,
      distance: getDistance(h.x, h.y, s.x, s.y),
    }));

    // Find the closest school
    distances.sort((a, b) => a.distance - b.distance);
    const closestSchoolId = distances[0].id;

    // Strict Policy check
    if (policy === 'nearest' || sortedSchools.length === 1) {
      return {
        ...h,
        assignedSchoolId: closestSchoolId as any,
      };
    }

    // policy === 'catchment'
    // Determine which school polygons contain the student point
    const eligible = getEligibleSchoolsForPoint(h, sortedSchools);

    let assignedSchoolId: string;

    if (eligible.length === 0) {
      // Outlier fallback: assign to closest school
      assignedSchoolId = closestSchoolId;
    } else if (eligible.length === 1) {
      // Exclusive catchment allocation: 100% to this single school, bypassing any preference checks
      assignedSchoolId = eligible[0];
    } else {
      // Overlap Zone (shared by 2 or more schools)
      if (overlapRule === 'community') {
        if (h.type === 'village' && h.settlementId) {
          const center = centers.find((c) => c.id === h.settlementId);
          if (center) {
            // Find eligible schools for the village center point
            const centerEligible = getEligibleSchoolsForPoint(center, sortedSchools);
            
            // If the village center resides in only one school polygon, they all route exclusively to it
            if (centerEligible.length === 1) {
              assignedSchoolId = centerEligible[0];
            } else {
              // Village center is in an overlap zone or outside (fallback to student eligibility)
              const activeEligible = centerEligible.length > 0 ? centerEligible : eligible;
              
              if (activeEligible.length === 1) {
                assignedSchoolId = activeEligible[0];
              } else {
                // Unified community routing based on utility split at the center
                const utilities = activeEligible.map((schoolId) => {
                  const s = sortedSchools.find((sch) => sch.id === schoolId)!;
                  const dist = getDistance(center.x, center.y, s.x, s.y);
                  const distTerm = dist > 0.1 ? 1.0 / dist : 10.0;
                  const attr = attractiveness[schoolId] ?? 0.0;
                  const utility = distTerm * (1.0 + attr);
                  return { id: schoolId, utility };
                });
                utilities.sort((a, b) => b.utility - a.utility);
                assignedSchoolId = utilities[0].id;
              }
            }
          } else {
            assignedSchoolId = closestSchoolId;
          }
        } else {
          // isolated student: check utility at student coordinate
          const utilities = eligible.map((schoolId) => {
            const s = sortedSchools.find((sch) => sch.id === schoolId)!;
            const dist = getDistance(h.x, h.y, s.x, s.y);
            const distTerm = dist > 0.1 ? 1.0 / dist : 10.0;
            const attr = attractiveness[schoolId] ?? 0.0;
            const utility = distTerm * (1.0 + attr);
            return { id: schoolId, utility };
          });
          utilities.sort((a, b) => b.utility - a.utility);
          assignedSchoolId = utilities[0].id;
        }
      } else {
        // legacy_slider
        if (sortedSchools.length === 2) {
          const score = getDeterministicScore(h.id);
          assignedSchoolId = score < legacySplit.a ? sortedSchools[0].id : sortedSchools[1].id;
        } else {
          // Attractiveness utility-based split
          const utilities = eligible.map((schoolId) => {
            const school = sortedSchools.find((sch) => sch.id === schoolId)!;
            const dist = getDistance(h.x, h.y, school.x, school.y);
            const distTerm = dist > 0.1 ? 1.0 / dist : 10.0;
            const attr = attractiveness[schoolId] ?? 0.0;
            const utility = distTerm * (1.0 + attr);
            return { id: schoolId, utility };
          });
          
          const sumUtility = utilities.reduce((sum, u) => sum + u.utility, 0);
          
          if (sumUtility > 0) {
            const score = getDeterministicScore(h.id);
            let accum = 0;
            let assignedId = eligible[0];
            
            for (let k = 0; k < utilities.length; k++) {
              const prob = (utilities[k].utility / sumUtility) * 100;
              accum += prob;
              if (score < accum) {
                assignedId = utilities[k].id;
                break;
              }
            }
            assignedSchoolId = assignedId;
          } else {
            assignedSchoolId = eligible[0];
          }
        }
      }
    }

    return {
      ...h,
      assignedSchoolId: assignedSchoolId as any,
    };
  });
}

/**
 * Enforces that every settlement is completely enclosed within at least one school catchment polygon
 */
export function ensureSettlementInclusion(schools: School[], centers: SettlementCenter[]) {
  centers.forEach((center) => {
    // Check if this center resides in at least one school polygon
    const isInside = schools.some((school) => isPointInPolygon(center, school.polygon));
    
    if (!isInside) {
      // Find absolute nearest school based on Euclidean distance
      let nearestSchool = schools[0];
      let minDist = Infinity;
      schools.forEach((s) => {
        const d = getDistance(center.x, center.y, s.x, s.y);
        if (d < minDist) {
          minDist = d;
          nearestSchool = s;
        }
      });

      const sx = nearestSchool.x;
      const sy = nearestSchool.y;
      
      const vertices = nearestSchool.polygon;
      const updatedVertices = vertices.map((vertex) => {
        const dx = vertex.x - sx;
        const dy = vertex.y - sy;
        const currentRadius = Math.sqrt(dx * dx + dy * dy);
        const vertexAngle = Math.atan2(dy, dx);

        const cdx = center.x - sx;
        const cdy = center.y - sy;
        const distToVillage = Math.sqrt(cdx * cdx + cdy * cdy);
        let villageAngle = Math.atan2(cdy, cdx);
        if (villageAngle < 0) villageAngle += 2 * Math.PI;

        let diff = Math.abs(villageAngle - vertexAngle);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;

        // If vertex is in the direction of the stranded village (within 60 degrees)
        if (diff < Math.PI / 3) {
          const maxSpread = center.dispersionRadius * 2;
          const requiredRadius = distToVillage + maxSpread + 6.0;
          if (requiredRadius > currentRadius) {
            const newX = sx + requiredRadius * Math.cos(vertexAngle);
            const newY = sy + requiredRadius * Math.sin(vertexAngle);
            return {
              x: Math.max(0, Math.min(100, Math.round(newX * 10) / 10)),
              y: Math.max(0, Math.min(100, Math.round(newY * 10) / 10)),
            };
          }
        }
        return vertex;
      });
      
      nearestSchool.polygon = updatedVertices;
    }
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
  const { settlementCount, schoolCount, villageCount, isolatedCount } = params;
  
  // 1. Generate centers & schools (polygons will be overwritten with edge-to-edge layout)
  const centers = generateSettlementCenters(settlementCount);
  const schools = generateSchools(schoolCount);
  
  // Apply Real-World School Placement Anchor Rules
  if (schoolCount === 1) {
    const schoolA = schools.find((s) => s.id === 'school-a');
    if (schoolA && centers[0]) {
      schoolA.x = centers[0].x;
      schoolA.y = centers[0].y;
    }
  } else if (schoolCount === 2) {
    const schoolA = schools.find((s) => s.id === 'school-a');
    const schoolB = schools.find((s) => s.id === 'school-b');
    
    if (schoolA && centers[0]) {
      schoolA.x = centers[0].x;
      schoolA.y = centers[0].y;
    }
    if (schoolB) {
      if (centers[1]) {
        schoolB.x = centers[1].x;
        schoolB.y = centers[1].y;
      } else {
        // Fallback: random in right sector (X: 65-85, Y: 20-80)
        schoolB.x = Math.round((65 + Math.random() * 20) * 10) / 10;
        schoolB.y = Math.round((20 + Math.random() * 60) * 10) / 10;
      }
    }
  } else if (schoolCount === 3) {
    const schoolA = schools.find((s) => s.id === 'school-a');
    const schoolB = schools.find((s) => s.id === 'school-b');
    const schoolC = schools.find((s) => s.id === 'school-c');
    
    if (schoolA && centers[0]) {
      schoolA.x = centers[0].x;
      schoolA.y = centers[0].y;
    }
    if (schoolB && centers[1]) {
      schoolB.x = centers[1].x;
      schoolB.y = centers[1].y;
    }
    if (schoolC) {
      if (centers[2]) {
        schoolC.x = centers[2].x;
        schoolC.y = centers[2].y;
      } else {
        // Fallback: random in right sector (X: 75-90, Y: 20-80)
        schoolC.x = Math.round((75 + Math.random() * 15) * 10) / 10;
        schoolC.y = Math.round((20 + Math.random() * 60) * 10) / 10;
      }
    }
  }

  // Sort schools horizontally from left to right by their x coordinate
  schools.sort((a, b) => a.x - b.x);
  
  // Re-assign IDs, names, and colors based on horizontal order to match UI indicators
  const SCHOOL_IDS = ['school-a', 'school-b', 'school-c', 'school-d', 'school-e', 'school-f'] as const;
  const SCHOOL_NAMES = ['School A', 'School B', 'School C', 'School D', 'School E', 'School F'];
  const SCHOOL_COLORS = ['#3b82f6', '#ef4444', '#84cc16', '#a855f7', '#f97316', '#06b6d4'];
  
  schools.forEach((school, idx) => {
    school.id = SCHOOL_IDS[idx];
    school.name = SCHOOL_NAMES[idx];
    school.color = SCHOOL_COLORS[idx];
  });

  const households: Household[] = [];

  // 2. Generate village households clustered around centers
  const SETTLEMENT_WEIGHTS: Record<number, number[]> = {
    1: [45],
    2: [30, 15],
    3: [25, 13, 7],
    4: [22, 12, 7, 4],
    5: [20, 12, 7, 4, 2],
    6: [18, 11, 7, 5, 3, 1],
  };

  const weights = SETTLEMENT_WEIGHTS[settlementCount] || [45];

  centers.forEach((center, index) => {
    const weight = weights[index] ?? 1;
    const countForThisCenter = Math.round(villageCount * (weight / 45));
    center.headcount = countForThisCenter;

    const rad = center.dispersionRadius;
    const angleRad = (center.roadAngle * Math.PI) / 180;

    for (let i = 0; i < countForThisCenter; i++) {
      let x = center.x;
      let y = center.y;

      if (center.archetype === 'linear') {
        const t = (Math.random() - 0.5) * 2 * rad;
        const d = (Math.random() - 0.5) * 3.0; // tight maximum perpendicular offset of 1.5 units
        x += t * Math.cos(angleRad) - d * Math.sin(angleRad);
        y += t * Math.sin(angleRad) + d * Math.cos(angleRad);
      } else {
        // nucleated
        const theta = Math.random() * 2 * Math.PI;
        const r = Math.sqrt(Math.random()) * rad;
        x += r * Math.cos(theta);
        y += r * Math.sin(theta);
      }
      
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

  // 3. Generate isolated households (scattered across un-utilized open grid countryside cells)
  const utilizedCells = new Set<string>();
  centers.forEach((c) => {
    const row = Math.max(0, Math.min(9, Math.floor(c.y / 10)));
    const col = Math.max(0, Math.min(9, Math.floor(c.x / 10)));
    utilizedCells.add(`${row},${col}`);
  });

  const unutilized: { row: number; col: number }[] = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (!utilizedCells.has(`${r},${c}`)) {
        unutilized.push({ row: r, col: c });
      }
    }
  }

  for (let i = 0; i < isolatedCount; i++) {
    const cell = unutilized.length > 0
      ? unutilized[Math.floor(Math.random() * unutilized.length)]
      : { row: Math.floor(Math.random() * 10), col: Math.floor(Math.random() * 10) };

    const x = cell.col * 10 + Math.random() * 10;
    const y = cell.row * 10 + Math.random() * 10;

    households.push({
      id: `isolated-${i + 1}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      type: 'isolated',
    });
  }

  // 4. Generate dynamic school catchment polygons satisfying settlement inclusion and overlap rules
  const villageAssignments: Record<string, string[]> = {};
  centers.forEach((center) => {
    villageAssignments[center.id] = [];
    
    // Always assign to the closest school (Euclidean)
    let closestSchool = schools[0];
    let minDist = Infinity;
    schools.forEach((s) => {
      const d = getDistance(center.x, center.y, s.x, s.y);
      if (d < minDist) {
        minDist = d;
        closestSchool = s;
      }
    });
    
    villageAssignments[center.id].push(closestSchool.id);
    
    // 40% chance to also assign to another random school to create overlap
    if (schools.length > 1 && Math.random() < 0.4) {
      const otherSchools = schools.filter((s) => s.id !== closestSchool.id);
      const secondSchool = otherSchools[Math.floor(Math.random() * otherSchools.length)];
      villageAssignments[center.id].push(secondSchool.id);
    }
  });

  // Generate custom polygons for each school
  schools.forEach((school) => {
    const assignedCenters = centers.filter((c) => villageAssignments[c.id].includes(school.id));
    
    const vertexCount = 8;
    const angles: number[] = [];
    const shift = Math.random() * 0.15 + 0.05;
    for (let i = 0; i < vertexCount; i++) {
      angles.push(shift + (i * 2 * Math.PI) / vertexCount);
    }

    school.polygon = angles.map((angle) => {
      let maxRequiredRadius = 25.0; // minimum base radius for school polygon

      assignedCenters.forEach((center) => {
        const dx = center.x - school.x;
        const dy = center.y - school.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        
        let vAngle = Math.atan2(dy, dx);
        if (vAngle < 0) vAngle += 2 * Math.PI;

        let diff = Math.abs(vAngle - angle);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;

        if (diff < Math.PI / 3) {
          const maxSpread = center.dispersionRadius * 2;
          const required = dist + maxSpread + 6.0;
          if (required > maxRequiredRadius) {
            maxRequiredRadius = required;
          }
        }
      });

      const radius = maxRequiredRadius + Math.random() * 3.0;

      let x = school.x + radius * Math.cos(angle);
      let y = school.y + radius * Math.sin(angle);

      x = Math.max(0, Math.min(100, x));
      y = Math.max(0, Math.min(100, y));

      return {
        x: Math.round(x * 10) / 10,
        y: Math.round(y * 10) / 10,
      };
    });
  });

  // Run the strict catchment inclusion fail-safe to enclose any stranded settlements
  ensureSettlementInclusion(schools, centers);

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
  activePolicy: TransportPolicy,
  schools: School[] = []
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
    const counts: Record<string, number> = {};
    if (schools.length > 0) {
      schools.forEach((s) => {
        counts[s.id] = 0;
      });
    } else {
      counts['school-a'] = 0;
      counts['school-b'] = 0;
      counts['school-c'] = 0;
    }

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

export function regenerateHouseholdsForCenters(
  centers: SettlementCenter[],
  villageCount: number,
  isolatedCount: number,
  _schools: School[]
): Household[] {
  const households: Household[] = [];
  const settlementCount = centers.length;
  
  const SETTLEMENT_WEIGHTS: Record<number, number[]> = {
    1: [45],
    2: [30, 15],
    3: [25, 13, 7],
    4: [22, 12, 7, 4],
    5: [20, 12, 7, 4, 2],
    6: [18, 11, 7, 5, 3, 1],
  };

  const weights = SETTLEMENT_WEIGHTS[settlementCount] || [45];

  centers.forEach((center, index) => {
    const weight = weights[index] ?? 1;
    const countForThisCenter = Math.round(villageCount * (weight / 45));
    center.headcount = countForThisCenter;

    const rad = center.dispersionRadius;
    const angleRad = (center.roadAngle * Math.PI) / 180;

    for (let i = 0; i < countForThisCenter; i++) {
      let x = center.x;
      let y = center.y;

      if (center.archetype === 'linear') {
        const t = (Math.random() - 0.5) * 2 * rad;
        const d = (Math.random() - 0.5) * 3.0; // tight maximum perpendicular offset of 1.5 units
        x += t * Math.cos(angleRad) - d * Math.sin(angleRad);
        y += t * Math.sin(angleRad) + d * Math.cos(angleRad);
      } else {
        // nucleated
        const theta = Math.random() * 2 * Math.PI;
        const r = Math.sqrt(Math.random()) * rad;
        x += r * Math.cos(theta);
        y += r * Math.sin(theta);
      }
      
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

  // Re-generate isolated households (scattered across un-utilized open grid countryside cells)
  const utilizedCells = new Set<string>();
  centers.forEach((c) => {
    const row = Math.max(0, Math.min(9, Math.floor(c.y / 10)));
    const col = Math.max(0, Math.min(9, Math.floor(c.x / 10)));
    utilizedCells.add(`${row},${col}`);
  });

  const unutilized: { row: number; col: number }[] = [];
  for (let r = 0; r < 10; r++) {
    for (let c = 0; c < 10; c++) {
      if (!utilizedCells.has(`${r},${c}`)) {
        unutilized.push({ row: r, col: c });
      }
    }
  }

  for (let i = 0; i < isolatedCount; i++) {
    const cell = unutilized.length > 0
      ? unutilized[Math.floor(Math.random() * unutilized.length)]
      : { row: Math.floor(Math.random() * 10), col: Math.floor(Math.random() * 10) };

    const x = cell.col * 10 + Math.random() * 10;
    const y = cell.row * 10 + Math.random() * 10;

    households.push({
      id: `isolated-${i + 1}`,
      x: Math.round(x * 10) / 10,
      y: Math.round(y * 10) / 10,
      type: 'isolated',
    });
  }

  return households;
}
