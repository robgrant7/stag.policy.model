import React, { useMemo } from 'react';
import type { BulkRunResult } from '../types';

interface BulkReportModalProps {
  runs: BulkRunResult[];
  onClose: () => void;
  onLoadRun: (run: BulkRunResult) => void;
}

export const BulkReportModal: React.FC<BulkReportModalProps> = ({
  runs,
  onClose,
  onLoadRun,
}) => {
  // 1. Calculate General Aggregates and Distribution Statistics
  const stats = useMemo(() => {
    if (runs.length === 0) return null;

    const totalRuns = runs.length;
    let catchmentCostSum = 0;
    let nearestCostSum = 0;
    let catchmentCoachesSum = 0;
    let catchmentMinibusesSum = 0;
    let catchmentTaxisSum = 0;
    let nearestCoachesSum = 0;
    let nearestMinibusesSum = 0;
    let nearestTaxisSum = 0;

    let catchmentCheaperCount = 0;
    let nearestCheaperCount = 0;
    let tieCount = 0;

    let maxCatchmentSavings = 0;
    let maxNearestSavings = 0;

    // 1.1. Deficit Distribution Histogram Buckets
    let deltaSigCatchment = 0; // < -200
    let deltaModCatchment = 0; // -200 to -50
    let deltaNeutral = 0;      // -50 to 50
    let deltaModNearest = 0;   // 50 to 200
    let deltaSigNearest = 0;   // > 200

    // 1.2. Settlement Density Tiers
    const densityStats = {
      low: { catchmentWins: 0, tieWins: 0, nearestWins: 0, total: 0 },  // 1-4
      med: { catchmentWins: 0, tieWins: 0, nearestWins: 0, total: 0 },  // 5-8
      high: { catchmentWins: 0, tieWins: 0, nearestWins: 0, total: 0 }, // 9-12
    };

    // 1.3. School Count Tiers
    const schoolStats = {
      few: { catchmentWins: 0, tieWins: 0, nearestWins: 0, total: 0 },  // 1-2
      some: { catchmentWins: 0, tieWins: 0, nearestWins: 0, total: 0 }, // 3-4
      many: { catchmentWins: 0, tieWins: 0, nearestWins: 0, total: 0 }, // 5-6
    };

    // 1.4. Overlap Rules Tiers
    const overlapStats = {
      community: { catchmentWins: 0, tieWins: 0, nearestWins: 0, total: 0 },
      legacy_slider: { catchmentWins: 0, tieWins: 0, nearestWins: 0, total: 0 },
    };

    runs.forEach((r) => {
      catchmentCostSum += r.metrics.catchmentCost;
      nearestCostSum += r.metrics.nearestCost;

      catchmentCoachesSum += r.metrics.catchmentCoaches;
      catchmentMinibusesSum += r.metrics.catchmentMinibuses;
      catchmentTaxisSum += r.metrics.catchmentTaxis;

      nearestCoachesSum += r.metrics.nearestCoaches;
      nearestMinibusesSum += r.metrics.nearestMinibuses;
      nearestTaxisSum += r.metrics.nearestTaxis;

      const diff = r.metrics.deficit; // catchmentCost - nearestCost
      
      // Cost Margin Buckets
      if (diff < -200) {
        deltaSigCatchment++;
        catchmentCheaperCount++;
        const savings = Math.abs(diff);
        if (savings > maxCatchmentSavings) maxCatchmentSavings = savings;
      } else if (diff < -50) {
        deltaModCatchment++;
        catchmentCheaperCount++;
        const savings = Math.abs(diff);
        if (savings > maxCatchmentSavings) maxCatchmentSavings = savings;
      } else if (diff <= 50) {
        deltaNeutral++;
        tieCount++;
      } else if (diff <= 200) {
        deltaModNearest++;
        nearestCheaperCount++;
        const savings = diff;
        if (savings > maxNearestSavings) maxNearestSavings = savings;
      } else {
        deltaSigNearest++;
        nearestCheaperCount++;
        const savings = diff;
        if (savings > maxNearestSavings) maxNearestSavings = savings;
      }

      // Settlement Density Tiers
      const sCount = r.params.settlementCount;
      const sTier = sCount <= 4 ? 'low' : sCount <= 8 ? 'med' : 'high';
      densityStats[sTier].total++;
      if (diff < 0) densityStats[sTier].catchmentWins++;
      else if (diff > 0) densityStats[sTier].nearestWins++;
      else densityStats[sTier].tieWins++;

      // School Count Tiers
      const schCount = r.params.schoolCount;
      const schTier = schCount <= 2 ? 'few' : schCount <= 4 ? 'some' : 'many';
      schoolStats[schTier].total++;
      if (diff < 0) schoolStats[schTier].catchmentWins++;
      else if (diff > 0) schoolStats[schTier].nearestWins++;
      else schoolStats[schTier].tieWins++;

      // Overlap Rules
      const rule = r.params.overlapRule;
      overlapStats[rule].total++;
      if (diff < 0) overlapStats[rule].catchmentWins++;
      else if (diff > 0) overlapStats[rule].nearestWins++;
      else overlapStats[rule].tieWins++;
    });

    const maxBucketCount = Math.max(
      deltaSigCatchment,
      deltaModCatchment,
      deltaNeutral,
      deltaModNearest,
      deltaSigNearest,
      1
    );

    return {
      totalRuns,
      avgCatchmentCost: Math.round(catchmentCostSum / totalRuns),
      avgNearestCost: Math.round(nearestCostSum / totalRuns),
      avgCatchmentCoaches: Math.round((catchmentCoachesSum / totalRuns) * 10) / 10,
      avgCatchmentMinibuses: Math.round((catchmentMinibusesSum / totalRuns) * 10) / 10,
      avgCatchmentTaxis: Math.round((catchmentTaxisSum / totalRuns) * 10) / 10,
      avgNearestCoaches: Math.round((nearestCoachesSum / totalRuns) * 10) / 10,
      avgNearestMinibuses: Math.round((nearestMinibusesSum / totalRuns) * 10) / 10,
      avgNearestTaxis: Math.round((nearestTaxisSum / totalRuns) * 10) / 10,
      pctCatchmentCheaper: Math.round((catchmentCheaperCount / totalRuns) * 100),
      pctNearestCheaper: Math.round((nearestCheaperCount / totalRuns) * 100),
      pctTies: Math.round((tieCount / totalRuns) * 100),
      catchmentCheaperCount,
      nearestCheaperCount,
      tieCount,
      maxCatchmentSavings,
      maxNearestSavings,
      histogram: {
        deltaSigCatchment,
        deltaModCatchment,
        deltaNeutral,
        deltaModNearest,
        deltaSigNearest,
        maxBucketCount,
      },
      densityStats,
      schoolStats,
      overlapStats,
    };
  }, [runs]);

  // Load a random scenario matching winner parameters
  const handleLoadRandomWinner = (type: 'catchment' | 'nearest') => {
    const matching = runs.filter((r) => {
      const diff = r.metrics.deficit;
      return type === 'catchment' ? diff < 0 : diff > 0;
    });

    if (matching.length > 0) {
      const randomRun = matching[Math.floor(Math.random() * matching.length)];
      onLoadRun(randomRun);
    }
  };

  if (!stats) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="bg-[#121212] border border-[#333333] rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-[#333333] flex justify-between items-center bg-black backdrop-blur-xl">
          <div>
            <h2 className="font-heading tracking-wider text-xl text-slate-100 flex items-center gap-2 uppercase">
              <span className="text-protest-yellow text-lg">📊</span> Batch Simulation Report
            </h2>
            <p className="text-xs text-slate-405 mt-0.5">
              Simulated {stats.totalRuns} runs with randomized parameters. Analyzing spatial distributions.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-[#333333] text-slate-400 hover:text-white hover:bg-[#222222] transition-all cursor-pointer font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 1. Summary Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* cost comparison card */}
            <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average Costs</span>
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-405 font-medium">Catchment:</span>
                    <span className="text-sm font-bold text-protest-blue">£{stats.avgCatchmentCost}/day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-405 font-medium">Nearest:</span>
                    <span className="text-sm font-bold text-protest-green">£{stats.avgNearestCost}/day</span>
                  </div>
                </div>
              </div>
              <div className="pt-2.5 border-t border-[#333333] mt-3 text-[10.5px] text-slate-400">
                {stats.avgCatchmentCost < stats.avgNearestCost ? (
                  <span className="text-protest-blue font-bold">Catchment is £{stats.avgNearestCost - stats.avgCatchmentCost}/day cheaper</span>
                ) : stats.avgNearestCost < stats.avgCatchmentCost ? (
                  <span className="text-protest-green font-bold">Nearest is £{stats.avgCatchmentCost - stats.avgNearestCost}/day cheaper</span>
                ) : (
                  <span>Policy costs are neutral on average</span>
                )}
              </div>
            </div>

            {/* winner distribution card */}
            <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-4 flex flex-col justify-between md:col-span-2">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Overall Policy Win Ratio</span>
                <div className="mt-3">
                  {/* Distribution Bar */}
                  <div className="w-full h-3.5 bg-black rounded-full flex overflow-hidden border border-[#333333]">
                    <div
                      className="bg-protest-blue h-full hover:opacity-90 transition-all"
                      style={{ width: `${stats.pctCatchmentCheaper}%` }}
                      title={`Catchment Cheaper: ${stats.pctCatchmentCheaper}%`}
                    />
                    <div
                      className="bg-[#333333] h-full hover:opacity-90 transition-all"
                      style={{ width: `${stats.pctTies}%` }}
                      title={`Ties: ${stats.pctTies}%`}
                    />
                    <div
                      className="bg-protest-green h-full hover:opacity-90 transition-all"
                      style={{ width: `${stats.pctNearestCheaper}%` }}
                      title={`Nearest Cheaper: ${stats.pctNearestCheaper}%`}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[10px]">
                <div className="bg-black/40 p-1.5 rounded-lg border border-[#333333]">
                  <span className="block font-medium text-slate-500">Catchment wins</span>
                  <span className="text-xs font-bold text-protest-blue">{stats.pctCatchmentCheaper}% ({stats.catchmentCheaperCount})</span>
                </div>
                <div className="bg-black/40 p-1.5 rounded-lg border border-[#333333]">
                  <span className="block font-medium text-slate-500">Neutral (Ties)</span>
                  <span className="text-xs font-bold text-slate-400">{stats.pctTies}% ({stats.tieCount})</span>
                </div>
                <div className="bg-black/40 p-1.5 rounded-lg border border-[#333333]">
                  <span className="block font-medium text-slate-500">Nearest wins</span>
                  <span className="text-xs font-bold text-protest-green">{stats.pctNearestCheaper}% ({stats.nearestCheaperCount})</span>
                </div>
              </div>
            </div>

            {/* peak savings card */}
            <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Peak Savings Detected</span>
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-405 font-medium">Catchment Peak:</span>
                    <span className="text-xs font-bold text-protest-blue">£{stats.maxCatchmentSavings}/day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-405 font-medium">Nearest Peak:</span>
                    <span className="text-xs font-bold text-protest-green">£{stats.maxNearestSavings}/day</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-[#333333] mt-2 text-[10px] text-slate-500 italic">
                Reflects optimal localized configurations.
              </div>
            </div>

          </div>

          {/* 2. Deficit Distribution Histogram Chart */}
          <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-5 space-y-5">
            <div>
              <h3 className="text-xs font-heading tracking-wider uppercase text-slate-300">Cost Savings Margin Distribution</h3>
              <p className="text-[11px] text-slate-505 mt-0.5">
                Deficit delta breakdown (Catchment Cost − Nearest Cost). Left shows Catchment savings, right shows Nearest savings.
              </p>
            </div>
            
            <div className="flex flex-col md:flex-row items-end justify-between gap-6 h-60 pt-6 border-b border-[#333333] pb-2 px-4">
              {/* Bucket 1: Significant Catchment Savings */}
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono font-bold text-protest-blue opacity-0 group-hover:opacity-100 transition-opacity">
                  {stats.histogram.deltaSigCatchment} runs
                </span>
                <div
                  className="w-full bg-protest-blue rounded-t-lg transition-all duration-300 group-hover:opacity-90"
                  style={{ height: `${(stats.histogram.deltaSigCatchment / stats.histogram.maxBucketCount) * 80}%` }}
                />
                <span className="text-[9px] font-bold text-protest-blue/90 text-center uppercase tracking-wider block">
                  Catchment &gt; £200
                </span>
              </div>

              {/* Bucket 2: Moderate Catchment Savings */}
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono font-bold text-protest-blue opacity-0 group-hover:opacity-100 transition-opacity">
                  {stats.histogram.deltaModCatchment} runs
                </span>
                <div
                  className="w-full bg-protest-blue/70 rounded-t-lg transition-all duration-300 group-hover:opacity-80"
                  style={{ height: `${(stats.histogram.deltaModCatchment / stats.histogram.maxBucketCount) * 80}%` }}
                />
                <span className="text-[9px] font-bold text-protest-blue/80 text-center uppercase tracking-wider block">
                  Catchment £50–£200
                </span>
              </div>

              {/* Bucket 3: Near Tie / Neutral */}
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono font-bold text-slate-350 opacity-0 group-hover:opacity-100 transition-opacity">
                  {stats.histogram.deltaNeutral} runs
                </span>
                <div
                  className="w-full bg-slate-700/80 rounded-t-lg transition-all duration-300 group-hover:bg-slate-600"
                  style={{ height: `${(stats.histogram.deltaNeutral / stats.histogram.maxBucketCount) * 80}%` }}
                />
                <span className="text-[9px] font-bold text-slate-400 text-center uppercase tracking-wider block">
                  Neutral ±£50
                </span>
              </div>

              {/* Bucket 4: Moderate Nearest Savings */}
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono font-bold text-emerald-405 opacity-0 group-hover:opacity-100 transition-opacity">
                  {stats.histogram.deltaModNearest} runs
                </span>
                <div
                  className="w-full bg-emerald-500/70 rounded-t-lg transition-all duration-300 group-hover:bg-emerald-450"
                  style={{ height: `${(stats.histogram.deltaModNearest / stats.histogram.maxBucketCount) * 80}%` }}
                />
                <span className="text-[9px] font-bold text-emerald-305 text-center uppercase tracking-wider block">
                  Nearest £50–£200
                </span>
              </div>

              {/* Bucket 5: Significant Nearest Savings */}
              <div className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                <span className="text-[10px] font-mono font-bold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  {stats.histogram.deltaSigNearest} runs
                </span>
                <div
                  className="w-full bg-emerald-600 rounded-t-lg transition-all duration-300 group-hover:bg-emerald-500"
                  style={{ height: `${(stats.histogram.deltaSigNearest / stats.histogram.maxBucketCount) * 80}%` }}
                />
                <span className="text-[9px] font-bold text-emerald-400/90 text-center uppercase tracking-wider block">
                  Nearest &gt; £200
                </span>
              </div>
            </div>
          </div>

          {/* 3. Multi-Variable Influence Segmentation */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 3.1. Settlement Density influence */}
            <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Outcome by Village Count</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">How the number of villages generated affects which policy is cheaper.</p>
              </div>

              <div className="space-y-4">
                {Object.entries(stats.densityStats).map(([tier, data]) => {
                  const label = tier === 'low' ? 'Few Villages (1-4)' : tier === 'med' ? 'Some Villages (5-8)' : 'Many Villages (9-12)';
                  const total = data.total || 1;
                  const cPct = Math.round((data.catchmentWins / total) * 100);
                  const tPct = Math.round((data.tieWins / total) * 100);
                  const nPct = Math.round((data.nearestWins / total) * 100);

                  return (
                    <div key={tier} className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-medium text-slate-400">
                        <span>{label}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-450">({total} runs)</span>
                      </div>
                      <div className="w-full h-3 bg-[#121212] rounded-full flex overflow-hidden border border-[#333333]">
                        <div className="bg-protest-blue h-full" style={{ width: `${cPct}%` }} title={`Catchment: ${cPct}%`} />
                        <div className="bg-[#333333] h-full" style={{ width: `${tPct}%` }} title={`Tie: ${tPct}%`} />
                        <div className="bg-protest-green h-full" style={{ width: `${nPct}%` }} title={`Nearest: ${nPct}%`} />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold px-1">
                        <span className="text-protest-blue">Catchment: {cPct}%</span>
                        <span className="text-slate-450">Ties: {tPct}%</span>
                        <span className="text-protest-green">Nearest: {nPct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3.2. School Count influence */}
            <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Performance by School Count</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Correlation between number of schools and policy winner.</p>
              </div>

              <div className="space-y-4">
                {Object.entries(stats.schoolStats).map(([tier, data]) => {
                  const label = tier === 'few' ? '1–2 Schools (Small Fleet)' : tier === 'some' ? '3–4 Schools (Medium Fleet)' : '5–6 Schools (Large Fleet)';
                  const total = data.total || 1;
                  const cPct = Math.round((data.catchmentWins / total) * 100);
                  const tPct = Math.round((data.tieWins / total) * 100);
                  const nPct = Math.round((data.nearestWins / total) * 100);

                  return (
                    <div key={tier} className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-medium text-slate-400">
                        <span>{label}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-450">({total} runs)</span>
                      </div>
                      <div className="w-full h-3 bg-[#121212] rounded-full flex overflow-hidden border border-[#333333]">
                        <div className="bg-protest-blue h-full" style={{ width: `${cPct}%` }} title={`Catchment: ${cPct}%`} />
                        <div className="bg-[#333333] h-full" style={{ width: `${tPct}%` }} title={`Tie: ${tPct}%`} />
                        <div className="bg-protest-green h-full" style={{ width: `${nPct}%` }} title={`Nearest: ${nPct}%`} />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold px-1">
                        <span className="text-protest-blue">Catchment: {cPct}%</span>
                        <span className="text-slate-455">Ties: {tPct}%</span>
                        <span className="text-protest-green">Nearest: {nPct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3.3. Overlap Allocation rule influence */}
            <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Outcome by Overlap Rule</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">How different village assignment rules affect which policy is cheaper.</p>
              </div>

              <div className="space-y-4">
                {Object.entries(stats.overlapStats).map(([rule, data]) => {
                  const label = rule === 'community' ? 'Keep Villages Together (Community Rule)' : 'Split Villages (Parent Choice Rule)';
                  const total = data.total || 1;
                  const cPct = Math.round((data.catchmentWins / total) * 100);
                  const tPct = Math.round((data.tieWins / total) * 100);
                  const nPct = Math.round((data.nearestWins / total) * 100);

                  return (
                    <div key={rule} className="space-y-1.5">
                      <div className="flex justify-between text-[11px] font-medium text-slate-400">
                        <span>{label}</span>
                        <span className="text-[10px] font-mono font-bold text-slate-450">({total} runs)</span>
                      </div>
                      <div className="w-full h-3 bg-[#121212] rounded-full flex overflow-hidden border border-[#333333]">
                        <div className="bg-protest-blue h-full" style={{ width: `${cPct}%` }} title={`Catchment: ${cPct}%`} />
                        <div className="bg-[#333333] h-full" style={{ width: `${tPct}%` }} title={`Tie: ${tPct}%`} />
                        <div className="bg-protest-green h-full" style={{ width: `${nPct}%` }} title={`Nearest: ${nPct}%`} />
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-500 font-bold px-1">
                        <span className="text-protest-blue">Catchment: {cPct}%</span>
                        <span className="text-slate-455">Ties: {tPct}%</span>
                        <span className="text-protest-green">Nearest: {nPct}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 3.4. Fleet Deployments Average Bar Table */}
            <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
              <div>
                <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Average Fleet Deployments</h4>
                <p className="text-[10px] text-slate-500 mt-0.5">Average active transport fleet size comparison.</p>
              </div>

              <div className="space-y-3">
                {/* Coaches */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10.5px]">
                    <span className="text-slate-400 font-medium">🚌 Coaches (Average)</span>
                    <span className="text-slate-300 font-bold">Catchment: {stats.avgCatchmentCoaches} vs Nearest: {stats.avgNearestCoaches}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-full bg-black rounded-full h-1.5 overflow-hidden border border-[#333333]">
                      <div className="bg-protest-blue h-full" style={{ width: `${Math.min(100, (stats.avgCatchmentCoaches / 10) * 100)}%` }} />
                    </div>
                    <div className="w-full bg-black rounded-full h-1.5 overflow-hidden border border-[#333333]">
                      <div className="bg-protest-green h-full" style={{ width: `${Math.min(100, (stats.avgNearestCoaches / 10) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                {/* Minibuses */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10.5px]">
                    <span className="text-slate-400 font-medium">🚐 Minibuses (Average)</span>
                    <span className="text-slate-300 font-bold">Catchment: {stats.avgCatchmentMinibuses} vs Nearest: {stats.avgNearestMinibuses}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-full bg-black rounded-full h-1.5 overflow-hidden border border-[#333333]">
                      <div className="bg-protest-blue h-full" style={{ width: `${Math.min(100, (stats.avgCatchmentMinibuses / 15) * 100)}%` }} />
                    </div>
                    <div className="w-full bg-black rounded-full h-1.5 overflow-hidden border border-[#333333]">
                      <div className="bg-protest-green h-full" style={{ width: `${Math.min(100, (stats.avgNearestMinibuses / 15) * 100)}%` }} />
                    </div>
                  </div>
                </div>

                {/* Taxis */}
                <div className="space-y-1">
                  <div className="flex justify-between text-[10.5px]">
                    <span className="text-slate-400 font-medium">🚖 Taxis (Average)</span>
                    <span className="text-slate-300 font-bold">Catchment: {stats.avgCatchmentTaxis} vs Nearest: {stats.avgNearestTaxis}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="w-full bg-black rounded-full h-1.5 overflow-hidden border border-[#333333]">
                      <div className="bg-protest-blue h-full" style={{ width: `${Math.min(100, (stats.avgCatchmentTaxis / 20) * 100)}%` }} />
                    </div>
                    <div className="w-full bg-black rounded-full h-1.5 overflow-hidden border border-[#333333]">
                      <div className="bg-protest-green h-full" style={{ width: `${Math.min(100, (stats.avgNearestTaxis / 20) * 100)}%` }} />
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
        
        {/* Footer with Scenario Injector Actions */}
        <div className="p-4 border-t border-[#333333] bg-black/40 flex flex-col sm:flex-row justify-between items-center gap-3">
          <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider font-heading">
            Want to visualize the layouts? Load a random scenario winner directly:
          </span>
          <div className="flex items-center gap-3 font-heading">
            <button
              onClick={() => handleLoadRandomWinner('catchment')}
              disabled={stats.catchmentCheaperCount === 0}
              className="px-3.5 py-1.5 bg-protest-blue/10 hover:bg-protest-blue/20 disabled:bg-slate-900 border border-protest-blue/30 disabled:border-[#333333] rounded-lg text-xs font-bold text-protest-blue disabled:text-slate-650 transition-all cursor-pointer tracking-wider uppercase"
            >
              🎲 Load Random Catchment Winner
            </button>
            <button
              onClick={() => handleLoadRandomWinner('nearest')}
              disabled={stats.nearestCheaperCount === 0}
              className="px-3.5 py-1.5 bg-protest-green/10 hover:bg-protest-green/20 disabled:bg-slate-900 border border-protest-green/30 disabled:border-[#333333] rounded-lg text-xs font-bold text-protest-green disabled:text-slate-655 transition-all cursor-pointer tracking-wider uppercase"
            >
              🎲 Load Random Nearest Winner
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
