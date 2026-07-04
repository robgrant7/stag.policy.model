import { useState, useEffect, useMemo } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { GridCanvas } from './components/GridCanvas';
import { StatsOverlay } from './components/StatsOverlay';
import { FinancialPanel } from './components/FinancialPanel';
import type { Household, SettlementCenter, ScenarioParams, School, TransportPolicy } from './types';
import { generateScenario, assignHouseholds, calculateFinancials, regenerateHouseholdsForCenters } from './utils/generator';

function App() {
  // 1. Parameter State
  const [params, setParams] = useState<ScenarioParams>({
    settlementCount: 4,
    schoolCount: 3,
    villageCount: 180,
    isolatedPercentage: 15,
    isolatedCount: 32,
    clusterRadius: 8,
  });

  // 2. Map View Policy State
  const [mapViewPolicy, setMapViewPolicy] = useState<TransportPolicy>('catchment');

  // Overlap Allocation States
  const [overlapRule, setOverlapRule] = useState<'community' | 'legacy_slider'>('community');
  const [legacySplit, setLegacySplit] = useState<{ a: number; b: number; c: number }>({ a: 40, b: 30, c: 30 });
  const [attractiveness, setAttractiveness] = useState<Record<string, number>>({
    'school-a': 0.0,
    'school-b': 0.0,
    'school-c': 0.0,
    'school-d': 0.0,
    'school-e': 0.0,
    'school-f': 0.0,
  });
  
  // Vehicle Parameter States
  const [coachCapacity, setCoachCapacity] = useState<number>(50);
  const [coachThreshold, setCoachThreshold] = useState<number>(17);
  const [coachCost, setCoachCost] = useState<number>(500);
  const [minibusCapacity, setMinibusCapacity] = useState<number>(16);
  const [minibusThreshold, setMinibusThreshold] = useState<number>(8);
  const [minibusCost, setMinibusCost] = useState<number>(250);
  const [taxiCapacity, setTaxiCapacity] = useState<number>(2);
  const [taxiCost, setTaxiCost] = useState<number>(150);

  // 3. Scenario Data State
  const [households, setHouseholds] = useState<Household[]>([]);
  const [centers, setCenters] = useState<SettlementCenter[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  // 3.5. Reactive Transport Operational Cost calculations (Parallel Costing)
  const financials = useMemo(() => {
    return calculateFinancials(
      households,
      centers,
      schools,
      coachCapacity,
      coachThreshold,
      coachCost,
      minibusCapacity,
      minibusThreshold,
      minibusCost,
      taxiCapacity,
      taxiCost,
      overlapRule,
      legacySplit,
      attractiveness
    );
  }, [
    households,
    centers,
    schools,
    coachCapacity,
    coachThreshold,
    coachCost,
    minibusCapacity,
    minibusThreshold,
    minibusCost,
    taxiCapacity,
    taxiCost,
    overlapRule,
    legacySplit,
    attractiveness
  ]);

  // displayedHouseholds drives the map display
  const displayedHouseholds = useMemo(() => {
    return assignHouseholds(
      households,
      schools,
      mapViewPolicy,
      overlapRule,
      legacySplit,
      centers,
      attractiveness,
      false
    );
  }, [households, schools, mapViewPolicy, overlapRule, legacySplit, centers, attractiveness]);

  // 4. Scenario generator trigger
  const handleGenerate = (
    currentParams = params,
    activeOverlapRule = overlapRule,
    activeLegacySplit = legacySplit,
    activeAttractiveness = attractiveness
  ) => {
    const { households: newHouseholds, centers: newCenters, schools: newSchools } = generateScenario(currentParams);
    
    // Reposition/snap households using Catchment Policy by default
    const snapped = assignHouseholds(
      newHouseholds,
      newSchools,
      'catchment',
      activeOverlapRule,
      activeLegacySplit,
      newCenters,
      activeAttractiveness,
      true
    );
    
    setHouseholds(snapped);
    setCenters(newCenters);
    setSchools(newSchools);
  };

  // Run scenario generator on initial load
  useEffect(() => {
    handleGenerate();
  }, []);

  // Sync parameter changes and trigger re-generation if counts change
  const handleChangeParams = (newParams: ScenarioParams) => {
    if (
      newParams.isolatedPercentage !== params.isolatedPercentage ||
      newParams.villageCount !== params.villageCount
    ) {
      const pct = newParams.isolatedPercentage ?? 15;
      const total = pct >= 100 ? newParams.villageCount : Math.round(newParams.villageCount / (1 - pct / 100));
      newParams.isolatedCount = Math.round(total * (pct / 100));
    }
    
    setParams(newParams);
    
    if (
      newParams.settlementCount !== params.settlementCount ||
      newParams.schoolCount !== params.schoolCount
    ) {
      handleGenerate(newParams);
    }
  };

  const handleOverlapRuleChange = (rule: 'community' | 'legacy_slider') => {
    setOverlapRule(rule);
  };

  const handleLegacySplitChange = (split: { a: number; b: number; c: number }) => {
    setLegacySplit(split);
  };

  const handleAttractivenessChange = (attr: Record<string, number>) => {
    setAttractiveness(attr);
  };

  const handleUpdateVillage = (villageId: string, fields: Partial<SettlementCenter>) => {
    const updatedCenters = centers.map((c) => {
      if (c.id === villageId) {
        return { ...c, ...fields };
      }
      return c;
    });
    setCenters(updatedCenters);

    const newHouseholds = regenerateHouseholdsForCenters(updatedCenters, params.villageCount, params.isolatedCount, schools);
    const snapped = assignHouseholds(
      newHouseholds,
      schools,
      'catchment',
      overlapRule,
      legacySplit,
      updatedCenters,
      attractiveness,
      true
    );
    setHouseholds(snapped);
  };

  const handleResetVillages = () => {
    const updatedCenters = centers.map((c) => ({
      ...c,
      archetype: 'nucleated' as const,
      dispersionRadius: 6.0,
    }));
    setCenters(updatedCenters);

    const newHouseholds = regenerateHouseholdsForCenters(updatedCenters, params.villageCount, params.isolatedCount, schools);
    const snapped = assignHouseholds(
      newHouseholds,
      schools,
      'catchment',
      overlapRule,
      legacySplit,
      updatedCenters,
      attractiveness,
      true
    );
    setHouseholds(snapped);
  };

  // 5. Export scenario data as JSON
  const handleExport = () => {
    const dataStr = JSON.stringify(
      {
        metadata: {
          generatedAt: new Date().toISOString(),
          activePolicy: mapViewPolicy,
          parameters: {
            ...params,
            coachCapacity,
            coachThreshold,
            coachCost,
            minibusCapacity,
            minibusThreshold,
            minibusCost,
            taxiCapacity,
            taxiCost,
          },
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
    link.download = `stag-scenario-${params.schoolCount}-schools-comparison.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="h-screen max-h-screen w-full flex overflow-hidden bg-slate-950 text-slate-100 font-sans">
      {/* Left Panel (Controls Sidebar) */}
      <aside className="w-1/3 h-full overflow-y-auto p-6 border-r border-slate-800 flex flex-col gap-6 bg-slate-950">
        {/* Header content inline */}
        <div className="flex items-center gap-3 pb-4 border-b border-slate-900">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <svg className="h-5 w-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold bg-gradient-to-r from-slate-50 via-slate-200 to-slate-400 bg-clip-text text-transparent tracking-tight">
              STAG Spatial Dispersion Model
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">
              School Transport Policy Modeling & Rural Simulator
            </p>
          </div>
        </div>

        {/* Mini stats dashboard inside left panel for better readability and structure */}
        <StatsOverlay households={displayedHouseholds} centers={centers} schools={schools} />

        <ControlPanel
          params={params}
          onChangeParams={handleChangeParams}
          overlapRule={overlapRule}
          onOverlapRuleChange={handleOverlapRuleChange}
          legacySplit={legacySplit}
          onLegacySplitChange={handleLegacySplitChange}
          attractiveness={attractiveness}
          onAttractivenessChange={handleAttractivenessChange}
          onGenerate={() => handleGenerate(params, overlapRule, legacySplit, attractiveness)}
          onExport={handleExport}
          centers={centers}
          onUpdateVillage={handleUpdateVillage}
          onResetVillages={handleResetVillages}
          coachCapacity={coachCapacity}
          onChangeCoachCapacity={setCoachCapacity}
          coachThreshold={coachThreshold}
          onChangeCoachThreshold={setCoachThreshold}
          coachCost={coachCost}
          onChangeCoachCost={setCoachCost}
          minibusCapacity={minibusCapacity}
          onChangeMinibusCapacity={setMinibusCapacity}
          minibusThreshold={minibusThreshold}
          onChangeMinibusThreshold={setMinibusThreshold}
          minibusCost={minibusCost}
          onChangeMinibusCost={setMinibusCost}
          taxiCapacity={taxiCapacity}
          onChangeTaxiCapacity={setTaxiCapacity}
          taxiCost={taxiCost}
          onChangeTaxiCost={setTaxiCost}
        />

        <FinancialPanel
          financials={financials}
        />

        {/* Context/Information block */}
        <div className="bg-slate-900/40 border border-slate-800/85 rounded-2xl p-5 text-xs text-slate-400 space-y-3">
          <h3 className="font-bold text-slate-350 uppercase tracking-wider text-[10px]">Policy Comparison Framework</h3>
          <p className="text-[11px] leading-normal text-slate-400">
            This simulator runs parallel cost calculations:
          </p>
          <ul className="list-disc list-inside space-y-1.5 text-slate-450 text-[11px]">
            <li>
              <strong className="text-indigo-400 font-semibold">Catchment Policy</strong>: Restricts routing to administrative school boundaries, funneling overlap zones.
            </li>
            <li>
              <strong className="text-emerald-400 font-semibold">Nearest Policy</strong>: Disregards boundaries, routing students strictly to their closest destination school.
            </li>
          </ul>
        </div>

        <footer className="pt-4 border-t border-slate-900 text-center text-[10px] text-slate-500">
          STAG Policy Model • Rural Transport Spatial Simulator
        </footer>
      </aside>

      {/* Right Panel (Map Canvas Only) */}
      <main className="w-2/3 h-full p-6 bg-slate-900 overflow-hidden">
        <GridCanvas
          households={displayedHouseholds}
          centers={centers}
          schools={schools}
          clusterRadius={params.clusterRadius}
          mapViewPolicy={mapViewPolicy}
          onMapViewPolicyChange={setMapViewPolicy}
        />
      </main>
    </div>
  );
}

export default App;
