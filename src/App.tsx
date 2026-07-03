import { useState, useEffect, useMemo } from 'react';
import { Header } from './components/Header';
import { ControlPanel } from './components/ControlPanel';
import { GridCanvas } from './components/GridCanvas';
import { StatsOverlay } from './components/StatsOverlay';
import { FinancialPanel } from './components/FinancialPanel';
import type { Household, SettlementCenter, ScenarioParams, School, TransportPolicy } from './types';
import { generateScenario, assignHouseholds, calculateFinancials } from './utils/generator';

function App() {
  // 1. Parameter State
  const [params, setParams] = useState<ScenarioParams>({
    settlementCount: 3,
    schoolCount: 3,
    villageCount: 45,
    isolatedCount: 10,
    clusterRadius: 8,
  });

  // 2. Active Transport Policy State
  const [transportPolicy, setTransportPolicy] = useState<TransportPolicy>('catchment');

  // Overlap Allocation States
  const [overlapRule, setOverlapRule] = useState<'community' | 'legacy_slider'>('community');
  const [legacySplit, setLegacySplit] = useState<{ a: number; b: number; c: number }>({ a: 40, b: 30, c: 30 });

  // 3. Scenario Data State
  const [households, setHouseholds] = useState<Household[]>([]);
  const [centers, setCenters] = useState<SettlementCenter[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  // 3.5. Reactive Transport Operational Cost calculations
  const financials = useMemo(() => {
    return calculateFinancials(households, centers, transportPolicy);
  }, [households, centers, transportPolicy]);

  // 4. Scenario generator trigger
  const handleGenerate = (
    currentParams = params,
    activePolicy = transportPolicy,
    activeOverlapRule = overlapRule,
    activeLegacySplit = legacySplit
  ) => {
    const { households: newHouseholds, centers: newCenters, schools: newSchools } = generateScenario(currentParams);
    
    // Apply assignments to the newly generated households
    const assigned = assignHouseholds(
      newHouseholds,
      newSchools,
      activePolicy,
      activeOverlapRule,
      activeLegacySplit,
      newCenters
    );
    
    setHouseholds(assigned);
    setCenters(newCenters);
    setSchools(newSchools);
  };

  // Run scenario generator on initial load
  useEffect(() => {
    handleGenerate();
  }, []);

  // Sync parameter changes and trigger re-generation if counts change
  const handleChangeParams = (newParams: ScenarioParams) => {
    setParams(newParams);
    
    // If user changed counts, instantly regenerate to reflect selection
    if (
      newParams.settlementCount !== params.settlementCount ||
      newParams.schoolCount !== params.schoolCount
    ) {
      handleGenerate(newParams);
    }
  };

  // Recalculate assignments on existing points when controls change
  const handlePolicyChange = (policy: TransportPolicy) => {
    setTransportPolicy(policy);
    setHouseholds((prev) => assignHouseholds(prev, schools, policy, overlapRule, legacySplit, centers));
  };

  const handleOverlapRuleChange = (rule: 'community' | 'legacy_slider') => {
    setOverlapRule(rule);
    setHouseholds((prev) => assignHouseholds(prev, schools, transportPolicy, rule, legacySplit, centers));
  };

  const handleLegacySplitChange = (split: { a: number; b: number; c: number }) => {
    setLegacySplit(split);
    setHouseholds((prev) => assignHouseholds(prev, schools, transportPolicy, overlapRule, split, centers));
  };

  // 5. Export scenario data as JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(
      {
        metadata: {
          generatedAt: new Date().toISOString(),
          activePolicy: transportPolicy,
          parameters: params,
          summary: {
            totalHouseholds: households.length,
            villageHouseholds: households.filter(h => h.type === 'village').length,
            isolatedHouseholds: households.filter(h => h.type === 'isolated').length,
            schools: schools.map(s => ({
              id: s.id,
              name: s.name,
              x: s.x,
              y: s.y,
              vertexCount: s.polygon.length,
            })),
          }
        },
        settlements: centers,
        schools: schools,
        households: households,
      },
      null,
      2
    );

    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `stag-scenario-${params.schoolCount}-schools-${transportPolicy}-policy.json`;
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
        <StatsOverlay households={households} centers={centers} schools={schools} />

        {/* Responsive Two-Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Controls Column */}
          <div className="lg:col-span-4 space-y-6">
            <ControlPanel
              params={params}
              onChangeParams={handleChangeParams}
              transportPolicy={transportPolicy}
              onPolicyChange={handlePolicyChange}
              overlapRule={overlapRule}
              onOverlapRuleChange={handleOverlapRuleChange}
              legacySplit={legacySplit}
              onLegacySplitChange={handleLegacySplitChange}
              onGenerate={() => handleGenerate(params, transportPolicy, overlapRule, legacySplit)}
              onExport={handleExport}
            />

            <FinancialPanel
              financials={financials}
              activePolicy={transportPolicy}
            />

            {/* Context/Information block */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-5 text-xs text-slate-400 space-y-3">
              <h3 className="font-bold text-slate-300 uppercase tracking-wider">Policy Comparison Framework</h3>
              <p>
                This visual mapping highlights the difference between local optimization policies:
              </p>
              <ul className="list-disc list-inside space-y-1.5 text-slate-450">
                <li>
                  <strong className="text-indigo-400 font-semibold">Catchment Policy</strong>: Restricts routing to administrative school boundaries. Points falling in the shared <span className="text-purple-400 font-semibold">Overlap Zone</span> are funneled to School A, and fallbacks are triggered for outliers outside both zones.
                </li>
                <li>
                  <strong className="text-emerald-400 font-semibold">Nearest Policy</strong>: Disregards boundaries, routing students to their closest destination to minimize transit time.
                </li>
              </ul>
              <p className="pt-1 text-[11px] text-slate-500 border-t border-slate-800/60">
                Observe the visual vectors shift in the overlap zones when toggling between policies.
              </p>
            </div>
          </div>

          {/* Visual Grid Column */}
          <div className="lg:col-span-8 h-full">
            <GridCanvas
              households={households}
              centers={centers}
              schools={schools}
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
