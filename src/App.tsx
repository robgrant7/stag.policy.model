import { useState, useEffect, useMemo } from 'react';
import { ControlPanel } from './components/ControlPanel';
import { GridCanvas } from './components/GridCanvas';
import { FinancialPanel } from './components/FinancialPanel';
import type { Household, SettlementCenter, ScenarioParams, School, TransportPolicy, BulkRunResult } from './types';
import { generateScenario, assignHouseholds, calculateFinancials, regenerateHouseholdsForCenters, runBulkSimulation } from './utils/generator';
import { BulkReportModal } from './components/BulkReportModal';

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

  const [households, setHouseholds] = useState<Household[]>([]);
  const [centers, setCenters] = useState<SettlementCenter[]>([]);
  const [schools, setSchools] = useState<School[]>([]);

  // Bulk Simulation States
  const [bulkRuns, setBulkRuns] = useState<BulkRunResult[]>([]);
  const [isBulking, setIsBulking] = useState<boolean>(false);
  const [bulkProgress, setBulkProgress] = useState<number>(0);
  const [isBulkReportModalOpen, setIsBulkReportModalOpen] = useState<boolean>(false);
  const [isHowItWorksOpen, setIsHowItWorksOpen] = useState<boolean>(false);

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

  // Execute Bulk Simulation Runs concurrently in async chunks (capped chunk sizes to prevent UI blocking)
  const handleRunBulk = (count: number) => {
    setIsBulking(true);
    setBulkProgress(0);
    setBulkRuns([]);

    const vehicleParams = {
      coachCapacity,
      coachThreshold,
      coachCost,
      minibusCapacity,
      minibusThreshold,
      minibusCost,
      taxiCapacity,
      taxiCost,
    };

    const allResults: BulkRunResult[] = [];
    // Cap chunk size to 50 runs to ensure browser never hangs/freezes and layout stays responsive
    const chunkSize = Math.min(50, Math.max(5, Math.floor(count / 20)));

    const runChunk = (startIndex: number) => {
      if (startIndex >= count) {
        setBulkRuns(allResults);
        setIsBulking(false);
        setBulkProgress(100);
        setIsBulkReportModalOpen(true);
        return;
      }

      const endIndex = Math.min(count, startIndex + chunkSize);
      const chunkCount = endIndex - startIndex;

      const chunkResults = runBulkSimulation(chunkCount, vehicleParams);

      chunkResults.forEach((r, idx) => {
        const runIdx = startIndex + idx;
        r.runId = runIdx + 1;
        
        // Memory Optimization: prune data field for runs >= 250 to prevent huge JS heap footprint
        if (runIdx >= 250) {
          delete r.data;
        }
        
        allResults.push(r);
      });

      const progressPercent = Math.round((endIndex / count) * 100);
      setBulkProgress(progressPercent);

      setTimeout(() => {
        runChunk(endIndex);
      }, 5); // very small timeout to keep UI fluid
    };

    // Trigger run loop
    setTimeout(() => {
      runChunk(0);
    }, 10);
  };

  const handleLoadBulkRun = (run: BulkRunResult) => {
    const newParams: ScenarioParams = {
      settlementCount: run.params.settlementCount,
      schoolCount: run.params.schoolCount,
      villageCount: run.params.villageCount,
      isolatedPercentage: run.params.isolatedPercentage,
      isolatedCount: run.params.isolatedCount,
      clusterRadius: run.params.clusterRadius,
    };
    setParams(newParams);
    
    if (run.data) {
      setCenters(run.data.centers);
      setSchools(run.data.schools);
      setHouseholds(run.data.households);
    } else {
      // High-volume pruned run: regenerate scenario on the fly deteministically/randomly
      const { households: rawHouseholds, centers: newCenters, schools: newSchools } = generateScenario(newParams);
      const snapped = assignHouseholds(
        rawHouseholds,
        newSchools,
        'catchment',
        run.params.overlapRule,
        run.params.legacySplit,
        newCenters,
        run.params.attractiveness,
        true
      );
      setCenters(newCenters);
      setSchools(newSchools);
      setHouseholds(snapped);
    }

    setOverlapRule(run.params.overlapRule);
    setLegacySplit(run.params.legacySplit);
    setAttractiveness(run.params.attractiveness);
    setIsBulkReportModalOpen(false);
  };

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
    <div className="h-screen max-h-screen w-full flex flex-col overflow-hidden bg-[#121212] text-white">
      {/* Top Header matching the financial app */}
      <header className="bg-black border-b-2 border-protest-yellow px-[4%] py-4 flex justify-between items-center z-10 shadow-md">
        <div className="flex flex-col">
          <h1 className="font-heading text-2xl md:text-3xl leading-none tracking-wider text-protest-yellow uppercase">
            Independent Spatial Policy Model
            <span className="text-[10px] font-sans font-medium bg-white/10 px-1.5 py-0.5 rounded ml-2.5 text-slate-300 align-middle">
              v2.2
            </span>
          </h1>
          <div className="text-[10px] tracking-[2px] uppercase text-slate-400 font-bold mt-1">
            Home to School Transport Policy Audit & Spatial Simulator
          </div>
        </div>
        <div>
          <button
            onClick={() => setIsHowItWorksOpen(true)}
            className="px-4 py-2 bg-protest-pink hover:bg-[#ff54a1] active:scale-[0.98] text-black font-heading text-sm font-bold tracking-wider uppercase rounded transition-all duration-150 cursor-pointer shadow-md shadow-protest-pink/20"
          >
            How this model works
          </button>
        </div>
      </header>

      {/* Main Container below Header */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel (Controls Sidebar) */}
        <aside className="w-1/3 h-full overflow-y-auto p-6 border-r border-[#333333] flex flex-col gap-6 bg-[#1a1a1a]">

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
            // Bulk Run Props
            bulkRuns={bulkRuns}
            isBulking={isBulking}
            bulkProgress={bulkProgress}
            onRunBulk={handleRunBulk}
            onOpenBulkReport={() => setIsBulkReportModalOpen(true)}
          />

          <FinancialPanel
            financials={financials}
          />

          {/* Context/Information block */}
          <div className="bg-[#222222] border border-[#333333] rounded-xl p-5 text-xs text-slate-400 space-y-3">
            <h3 className="font-heading text-protest-yellow text-sm tracking-wider uppercase">Policy Comparison Framework</h3>
            <p className="text-[11px] leading-normal text-slate-355">
              This simulator runs parallel cost calculations:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-slate-400 text-[11px]">
              <li>
                <strong className="text-protest-blue font-semibold">Catchment Policy</strong>: Restricts routing to administrative school boundaries, funneling overlap zones.
              </li>
              <li>
                <strong className="text-protest-green font-semibold">Nearest Policy</strong>: Disregards boundaries, routing students strictly to their closest destination school.
              </li>
            </ul>
          </div>

          <footer className="pt-4 border-t border-[#333333] text-center text-[10px] text-slate-500">
            STAG Policy Model • Rural Transport Spatial Simulator
          </footer>
        </aside>

        {/* Right Panel (Map Canvas Only) */}
        <main className="w-2/3 h-full p-6 bg-[#121212] overflow-hidden">
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

      {/* Bulk Run detailed interactive report modal overlay */}
      {isBulkReportModalOpen && (
        <BulkReportModal
          runs={bulkRuns}
          onClose={() => setIsBulkReportModalOpen(false)}
          onLoadRun={handleLoadBulkRun}
        />
      )}

      {/* Help Modal: How this model works */}
      {isHowItWorksOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-[#121212] border border-[#333333] rounded-2xl w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 animate-duration-150">
            {/* Header */}
            <div className="p-5 border-b border-[#333333] flex justify-between items-center bg-black">
              <h2 className="font-heading tracking-wider text-xl text-slate-100 uppercase">
                📖 How This Model Works & Why It Is Truthful
              </h2>
              <button
                onClick={() => setIsHowItWorksOpen(false)}
                className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#333333] text-slate-400 hover:text-white hover:bg-[#222222] transition-all cursor-pointer font-bold text-xs"
              >
                ✕
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-slate-300 leading-relaxed font-sans">
              <section className="space-y-2">
                <h3 className="font-heading tracking-wider text-lg text-protest-yellow uppercase">Overview</h3>
                <p>
                  This model is a spatial audit tool built to calculate the exact travel costs under two competing school transport rules:
                </p>
                <ul className="list-disc list-inside space-y-1 pl-2">
                  <li>
                    <strong className="text-protest-blue">Catchment Policy</strong>: Children are sent to schools based on pre-defined administrative boundaries (catchment areas).
                  </li>
                  <li>
                    <strong className="text-protest-green">Nearest Policy</strong>: School boundaries are ignored, and children are sent to whichever school is closest to their home by straight-line distance.
                  </li>
                </ul>
              </section>

              <section className="space-y-2">
                <h3 className="font-heading tracking-wider text-lg text-protest-yellow uppercase">Step-by-Step Methodology</h3>
                <ol className="list-decimal list-inside space-y-3 pl-2">
                  <li>
                    <strong>Generating the Map</strong>: The simulator sets up a 500x500 grid representing a rural area. It generates a user-defined number of village centers and scattered remote homes (isolated outliers).
                  </li>
                  <li>
                    <strong>Placing Schools</strong>: Schools are placed at the centers of selected villages. Catchment boundaries are drawn around them.
                  </li>
                  <li>
                    <strong>Assigning Students</strong>:
                    <ul className="list-disc list-inside space-y-1 pl-4 mt-1">
                      <li>Under the <strong>Nearest Policy</strong>, every house goes to its closest school.</li>
                      <li>
                        Under the <strong>Catchment Policy</strong>, houses inside overlapping boundaries are assigned based on choice. The **Feeder Settlement Unity** rule keeps villages together by routing the whole village to the school closest to its center. The **Legacy Preference** rule splits the village using a ratio slider. This allows some schools to become more "attractive" within a catchment, which reflects real life.
                      </li>
                    </ul>
                  </li>
                  <li>
                    <strong>Hiring the Transport Fleet</strong>: The model groups students in each village zone heading to the same school, and hires vehicles to fit them:
                    <ul className="list-disc list-inside space-y-1 pl-4 mt-1">
                      <li>If student count is at least the <strong>Coach Threshold</strong>, it hires a Coach (up to 50 capacity, costing £500/day).</li>
                      <li>If student count is at least the <strong>Minibus Threshold</strong>, it hires a Minibus (up to 16 capacity, costing £250/day).</li>
                      <li>Otherwise, it hires <strong>Taxis</strong> (up to 2 capacity, costing £150/day) to carry the remaining students.</li>
                      <li>Isolated outliers cannot walk to group bus stops, so they always travel in individual Taxis.</li>
                    </ul>
                  </li>
                  <li>
                    <strong>Total Cost Sum</strong>: The daily cost of the hired Coaches, Minibuses, and Taxis is calculated for both policies to find the cheaper option.
                  </li>
                </ol>
              </section>

              <section className="space-y-2">
                <h3 className="font-heading tracking-wider text-lg text-protest-yellow uppercase">Truthful Operational Assumptions</h3>
                <p>
                  To remain accurate, this model uses real-world transport constraints:
                </p>
                <ul className="list-disc list-inside space-y-2 pl-2">
                  <li>
                    <strong>Straight-Line Distance</strong>: Distances are calculated in a straight line. In reality, winding country lanes make journeys longer and taxis more expensive.
                    <span className="block text-xs text-slate-500 italic mt-0.5">Truth: Real costs are likely higher than shown here.</span>
                  </li>
                  <li>
                    <strong>No Shared Multi-Village Routes</strong>: Buses do not pick up students from multiple separate villages. 
                    <span className="block text-xs text-slate-500 italic mt-0.5">Truth: Consolidating routes might reduce some costs, but sparse rural geography makes this highly difficult in practice.</span>
                  </li>
                  <li>
                    <strong>Perfect Contract Consolidation</strong>: The model assumes the council instantly replaces taxis with minibuses or coaches when thresholds are met.
                    <span className="block text-xs text-slate-500 italic mt-0.5">Truth: Contract renegotiations are slow, so actual council transition costs will be higher.</span>
                  </li>
                </ul>
              </section>
            </div>
            
            {/* Footer */}
            <div className="p-4 border-t border-[#333333] bg-black/40 flex justify-end">
              <button
                onClick={() => setIsHowItWorksOpen(false)}
                className="px-4 py-2 bg-protest-yellow hover:bg-[#ffe240] text-black font-heading text-sm font-bold tracking-wider uppercase rounded cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
