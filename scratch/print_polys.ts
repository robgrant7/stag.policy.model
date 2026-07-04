import { generateScenario } from '../src/utils/generator';

const scenario = generateScenario({
  settlementCount: 4,
  schoolCount: 3,
  villageCount: 40,
  isolatedCount: 10,
  clusterRadius: 8,
});

scenario.schools.forEach((school) => {
  console.log(`School ${school.name} at (${school.x}, ${school.y})`);
  console.log(`Polygon:`, JSON.stringify(school.polygon));
  console.log('-------------------');
});
