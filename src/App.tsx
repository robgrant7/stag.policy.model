import { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { GridCanvas } from './components/GridCanvas';
import { StatsOverlay } from './components/StatsOverlay';
import type { Household, SettlementCenter, ScenarioParams } from './types';
import { generateScenario } from './utils/generator';

function App() {
  // 1. Parameter State
  const [params, setParams] = useState<ScenarioParams>({
    settlementCount: 2,
    villageCount: 40,
    isolatedCount: 10,
    clusterRadius: 8,
  });

  // 2. Scenario Data State
  const [households, setHouseholds] = useState<Household[]>([]);
  const [centers, setCenters] = useState<SettlementCenter[]>([]);

  // 3. Scenario generator trigger
  const handleGenerate = (currentParams = params) => {
    const { households: newHouseholds, centers: newCenters } = generateScenario(currentParams);
    setHouseholds(newHouseholds);
    setCenters(newCenters);
  };

  // Run scenario generator on initial load
  useEffect(() => {
    handleGenerate();
  }, []);

  // Sync parameter changes and trigger re-generation if counts change
  const handleChangeParams = (newParams: ScenarioParams) => {
    setParams(newParams);
    // If user changed the settlement count, instantly regenerate to reflect selection
    if (newParams.settlementCount !== params.settlementCount) {
      handleGenerate(newParams);
    }
  };

  // 4. Export scenario data as JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(
      {
        metadata: {
          generatedAt: new Date().toISOString(),
          parameters: params,
          summary: {
            totalHouseholds: households.length,
            villageHouseholds: households.filter(h => h.type === 'village').length,
            isolatedHouseholds: households.filter(h => h.type === 'isolated').length,
            settlements: centers,
          }
        },
        settlements: centers,
        households: households,
      },
      null,
      2
    );

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stag-geographic-scenario-${params.settlementCount}-settlements.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Header Banner */}
      <Header />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">
        {/* Analytics stats banner */}
        <StatsOverlay households={households} centers={centers} />

        {/* Responsive Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-4 space-y-6">
            <ControlPanel
              params={params}
              onChangeParams={handleChangeParams}
              onGenerate={() => handleGenerate()}
              onExport={handleExport}
            />

            {/* Context/Information block */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-3">
              <h3 className="font-bold text-slate-300 uppercase tracking-wider">Spatial Dispersion Context</h3>
              <p>
                Rural geographic layouts often present spatial logistics challenges. This tool generates
                representative scenarios to demonstrate dispersion:
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-400">
                <li>
                  <strong className="text-slate-350">Village cores</strong> mimic denser housing developments clustered
                  around coordinates.
                </li>
                <li>
                  <strong className="text-slate-350">Isolated outliers</strong> represent scattered farms or single dwellings.
                </li>
              </ul>
              <p>
                In the next phase, we will map transport vectors and school destinations to analyze route efficiency
                across split community configurations.
              </p>
            </div>
          </div>

          {/* Visual Grid Column */}
          <div className="lg:col-span-8 h-full">
            <GridCanvas
              households={households}
              centers={centers}
              clusterRadius={params.clusterRadius}
            />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 px-6 text-center text-xs text-slate-500">
        STAG Policy Model • Rural Transport Spatial Simulator • Built with React & Tailwind CSS v4
      </footer>
    </div>
  );
}

export default App;
