export type TransportPolicy = 'catchment' | 'nearest';

export interface Household {
  id: string;
  x: number; // Coordinate on 0-100 scale
  y: number; // Coordinate on 0-100 scale
  type: 'village' | 'isolated';
  settlementId?: string; // Links village household to a specific settlement center
  assignedSchoolId?: 'school-a' | 'school-b'; // Result of active policy assignment
}

export interface SettlementCenter {
  id: string;
  name: string;
  x: number; // Coordinate on 0-100 scale
  y: number; // Coordinate on 0-100 scale
  color: string; // Color code for styling this cluster uniquely
}

export interface School {
  id: 'school-a' | 'school-b';
  name: string;
  x: number; // Coordinate on 0-100 scale
  y: number; // Coordinate on 0-100 scale
  color: string; // Hex color code
  polygon: { x: number; y: number }[]; // Ordered vertices of the irregular catchment area
}

export interface ScenarioParams {
  settlementCount: number; // 1, 2, or 3
  schoolCount: number;     // 1 or 2
  villageCount: number;    // default 40
  isolatedCount: number;   // default 10
  clusterRadius: number;   // default 8
}
