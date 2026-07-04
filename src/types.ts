export type TransportPolicy = 'catchment' | 'nearest';

export interface Household {
  id: string;
  x: number; // Coordinate on 0-100 scale
  y: number; // Coordinate on 0-100 scale
  type: 'village' | 'isolated';
  settlementId?: string; // Links village household to a specific settlement center
  assignedSchoolId?: 'school-a' | 'school-b' | 'school-c' | 'school-d' | 'school-e' | 'school-f'; // Result of active policy assignment
}

export interface SettlementCenter {
  id: string;
  name: string;
  x: number; // Coordinate on 0-100 scale
  y: number; // Coordinate on 0-100 scale
  color: string; // Color code for styling this cluster uniquely
  headcount: number;
  archetype: 'nucleated' | 'linear';
  dispersionRadius: number;
  roadAngle: number;
}

export interface School {
  id: 'school-a' | 'school-b' | 'school-c' | 'school-d' | 'school-e' | 'school-f';
  name: string;
  x: number; // Coordinate on 0-100 scale
  y: number; // Coordinate on 0-100 scale
  color: string; // Hex color code
  polygon: { x: number; y: number }[]; // Ordered vertices of the irregular catchment area
  polygons?: { x: number; y: number }[][]; // Multiple polygons for Settlement-First Voronoi cells
  weight?: number; // Boundary weight for Voronoi cells
  pathD?: string; // Cubic Bezier path command for rendering
}

export interface ScenarioParams {
  settlementCount: number; // 1, 2, or 3
  schoolCount: number;     // 1 to 6
  villageCount: number;    // default 40
  isolatedCount: number;   // default 10
  isolatedPercentage?: number; // default 15%
  clusterRadius: number;   // default 8
  coachCapacity?: number;
  coachThreshold?: number;
  coachCost?: number;
  minibusCapacity?: number;
  minibusThreshold?: number;
  minibusCost?: number;
  taxiCapacity?: number;
  taxiCost?: number;
}

export interface BulkRunResult {
  runId: number;
  params: {
    settlementCount: number;
    schoolCount: number;
    villageCount: number;
    isolatedPercentage: number;
    isolatedCount: number;
    clusterRadius: number;
    overlapRule: 'community' | 'legacy_slider';
    legacySplit: { a: number; b: number; c: number };
    attractiveness: Record<string, number>;
  };
  metrics: {
    catchmentCost: number;
    nearestCost: number;
    deficit: number;
    catchmentCoaches: number;
    catchmentMinibuses: number;
    catchmentTaxis: number;
    nearestCoaches: number;
    nearestMinibuses: number;
    nearestTaxis: number;
  };
  data: {
    households: Household[];
    centers: SettlementCenter[];
    schools: School[];
  };
}
