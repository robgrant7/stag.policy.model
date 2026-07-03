import type { Household, SettlementCenter, ScenarioParams } from '../types';

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
      // Keep centers slightly away from absolute edges (20 to 80 range)
      x = 20 + Math.random() * 60;
      y = 20 + Math.random() * 60;
      
      // Check distance from existing centers
      valid = true;
      for (const center of centers) {
        if (getDistance(x, y, center.x, center.y) < currentMinDist) {
          valid = false;
          break;
        }
      }
      
      attempts++;
      // If we are struggling to find a spot, gradually relax the spacing constraint
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
 * Main function to generate a new scenario containing settlement centers,
 * clustered village households, and uniform isolated households.
 */
export function generateScenario(params: ScenarioParams): {
  households: Household[];
  centers: SettlementCenter[];
} {
  const { settlementCount, villageCount, isolatedCount, clusterRadius } = params;
  
  // 1. Generate centers
  const centers = generateSettlementCenters(settlementCount);
  const households: Household[] = [];

  // 2. Generate village households clustered around centers
  // Distribute the total village count as evenly as possible across the centers
  const baseVillagePerCenter = Math.floor(villageCount / settlementCount);
  const remainder = villageCount % settlementCount;

  centers.forEach((center, index) => {
    // Add 1 extra to the first 'remainder' centers to sum up to exactly villageCount
    const countForThisCenter = baseVillagePerCenter + (index < remainder ? 1 : 0);

    for (let i = 0; i < countForThisCenter; i++) {
      // Use random angle (theta) and radius (r) with exponential scaling
      // to create a dense core that tapers off towards the edges
      const theta = Math.random() * 2 * Math.PI;
      
      // Math.pow(random, 1.5) pulls points closer to the center, creating a core
      const r = Math.pow(Math.random(), 1.5) * clusterRadius;
      
      let x = center.x + r * Math.cos(theta);
      let y = center.y + r * Math.sin(theta);
      
      // Clamp coordinates to grid boundary [0, 100]
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
  };
}
