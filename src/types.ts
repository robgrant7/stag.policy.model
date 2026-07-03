export interface Household {
  id: string;
  x: number; // Coordinate on 0-100 scale
  y: number; // Coordinate on 0-100 scale
  type: 'village' | 'isolated';
  settlementId?: string; // Links village household to a specific settlement center
}

export interface SettlementCenter {
  id: string;
  name: string;
  x: number; // Coordinate on 0-100 scale
  y: number; // Coordinate on 0-100 scale
  color: string; // Color code for styling this cluster uniquely
}

export interface ScenarioParams {
  settlementCount: number; // 1, 2, or 3
  villageCount: number;    // default 40
  isolatedCount: number;   // default 10
  clusterRadius: number;   // default 8
}
