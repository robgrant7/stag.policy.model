import React, { useState, useMemo } from 'react';
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
  const [filterWinner, setFilterWinner] = useState<'all' | 'catchment' | 'nearest' | 'tie'>('all');
  const [sortField, setSortField] = useState<'runId' | 'deficit' | 'catchmentCost' | 'nearestCost'>('runId');
  const [sortAsc, setSortAsc] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // 1. Calculate General Aggregates
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
      if (diff < 0) {
        catchmentCheaperCount++;
        const savings = Math.abs(diff);
        if (savings > maxCatchmentSavings) maxCatchmentSavings = savings;
      } else if (diff > 0) {
        nearestCheaperCount++;
        const savings = diff;
        if (savings > maxNearestSavings) maxNearestSavings = savings;
      } else {
        tieCount++;
      }
    });

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
    };
  }, [runs]);

  // 2. Filter & Sort runs
  const processedRuns = useMemo(() => {
    let result = [...runs];

    // Filter by search query
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (r) =>
          r.runId.toString().includes(q) ||
          r.params.settlementCount.toString().includes(q) ||
          r.params.schoolCount.toString().includes(q)
      );
    }

    // Filter by Winner
    if (filterWinner !== 'all') {
      result = result.filter((r) => {
        const diff = r.metrics.deficit;
        if (filterWinner === 'catchment') return diff < 0;
        if (filterWinner === 'nearest') return diff > 0;
        return diff === 0;
      });
    }

    // Sort
    result.sort((a, b) => {
      let valA: number = 0;
      let valB: number = 0;

      if (sortField === 'runId') {
        valA = a.runId;
        valB = b.runId;
      } else if (sortField === 'deficit') {
        valA = a.metrics.deficit;
        valB = b.metrics.deficit;
      } else if (sortField === 'catchmentCost') {
        valA = a.metrics.catchmentCost;
        valB = b.metrics.catchmentCost;
      } else if (sortField === 'nearestCost') {
        valA = a.metrics.nearestCost;
        valB = b.metrics.nearestCost;
      }

      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [runs, filterWinner, sortField, sortAsc, searchQuery]);

  const handleSort = (field: 'runId' | 'deficit' | 'catchmentCost' | 'nearestCost') => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  if (!stats) return null;

  return (
    <div className="fixed inset-0 bg-slate-955/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Modal Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex justify-between items-center bg-slate-900/60 backdrop-blur-xl">
          <div>
            <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
              <span className="text-indigo-400 text-lg">📊</span> Batch Simulation Report
            </h2>
            <p className="text-xs text-slate-405 mt-0.5">
              Simulated {stats.totalRuns} runs with randomized settlement clusters, schools, overlap, and attractiveness sliders.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-lg border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800 transition-all cursor-pointer font-bold text-xs"
          >
            ✕
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* 1. Summary Cards Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            
            {/* cost comparison card */}
            <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Average Costs</span>
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-405 font-medium">Catchment:</span>
                    <span className="text-sm font-bold text-indigo-400">£{stats.avgCatchmentCost}/day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-405 font-medium">Nearest:</span>
                    <span className="text-sm font-bold text-emerald-400">£{stats.avgNearestCost}/day</span>
                  </div>
                </div>
              </div>
              <div className="pt-2.5 border-t border-slate-900 mt-3 text-[10.5px] text-slate-400">
                {stats.avgCatchmentCost < stats.avgNearestCost ? (
                  <span className="text-indigo-400 font-bold">Catchment is £{stats.avgNearestCost - stats.avgCatchmentCost}/day cheaper</span>
                ) : stats.avgNearestCost < stats.avgCatchmentCost ? (
                  <span className="text-emerald-400 font-bold">Nearest is £{stats.avgCatchmentCost - stats.avgNearestCost}/day cheaper</span>
                ) : (
                  <span>Policy costs are neutral on average</span>
                )}
              </div>
            </div>

            {/* winner distribution card */}
            <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 flex flex-col justify-between md:col-span-2">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Policy Winner Distribution</span>
                <div className="mt-3">
                  {/* Distribution Bar */}
                  <div className="w-full h-3.5 bg-slate-900 rounded-full flex overflow-hidden border border-slate-850">
                    <div
                      className="bg-indigo-600 h-full hover:opacity-90 transition-all"
                      style={{ width: `${stats.pctCatchmentCheaper}%` }}
                      title={`Catchment Cheaper: ${stats.pctCatchmentCheaper}%`}
                    />
                    <div
                      className="bg-slate-650 h-full hover:opacity-90 transition-all"
                      style={{ width: `${stats.pctTies}%` }}
                      title={`Ties: ${stats.pctTies}%`}
                    />
                    <div
                      className="bg-emerald-600 h-full hover:opacity-90 transition-all"
                      style={{ width: `${stats.pctNearestCheaper}%` }}
                      title={`Nearest Cheaper: ${stats.pctNearestCheaper}%`}
                    />
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-3 gap-2 mt-3 text-center text-[10px]">
                <div className="bg-slate-900/40 p-1.5 rounded-lg border border-slate-900">
                  <span className="block font-medium text-slate-500">Catchment wins</span>
                  <span className="text-xs font-bold text-indigo-400">{stats.pctCatchmentCheaper}% ({stats.catchmentCheaperCount})</span>
                </div>
                <div className="bg-slate-900/40 p-1.5 rounded-lg border border-slate-900">
                  <span className="block font-medium text-slate-500">Neutral (Ties)</span>
                  <span className="text-xs font-bold text-slate-400">{stats.pctTies}% ({stats.tieCount})</span>
                </div>
                <div className="bg-slate-900/40 p-1.5 rounded-lg border border-slate-900">
                  <span className="block font-medium text-slate-500">Nearest wins</span>
                  <span className="text-xs font-bold text-emerald-400">{stats.pctNearestCheaper}% ({stats.nearestCheaperCount})</span>
                </div>
              </div>
            </div>

            {/* peak savings card */}
            <div className="bg-slate-950/50 border border-slate-850 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Peak Savings Detected</span>
                <div className="mt-2 space-y-1.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-405 font-medium">Catchment Peak:</span>
                    <span className="text-xs font-bold text-indigo-400">£{stats.maxCatchmentSavings}/day</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-405 font-medium">Nearest Peak:</span>
                    <span className="text-xs font-bold text-emerald-400">£{stats.maxNearestSavings}/day</span>
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-slate-900 mt-2 text-[10px] text-slate-500 italic">
                Reflects optimal localized fleet configurations.
              </div>
            </div>

          </div>

          {/* 2. Fleet Deployments Average Bar Table */}
          <div className="bg-slate-950/40 border border-slate-850 rounded-xl p-5 space-y-4">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Average Active Fleet Deployments</h3>
            
            <div className="space-y-3">
              {/* Coaches */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 font-medium flex items-center gap-1">🚌 Coaches (Average)</span>
                  <span className="text-slate-300 font-bold">Catchment: {stats.avgCatchmentCoaches} vs Nearest: {stats.avgNearestCoaches}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(100, (stats.avgCatchmentCoaches / 10) * 100)}%` }} />
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, (stats.avgNearestCoaches / 10) * 100)}%` }} />
                  </div>
                </div>
              </div>

              {/* Minibuses */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 font-medium flex items-center gap-1">🚐 Minibuses (Average)</span>
                  <span className="text-slate-300 font-bold">Catchment: {stats.avgCatchmentMinibuses} vs Nearest: {stats.avgNearestMinibuses}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(100, (stats.avgCatchmentMinibuses / 15) * 100)}%` }} />
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, (stats.avgNearestMinibuses / 15) * 100)}%` }} />
                  </div>
                </div>
              </div>

              {/* Taxis */}
              <div className="space-y-1">
                <div className="flex justify-between text-[11px]">
                  <span className="text-slate-400 font-medium flex items-center gap-1">🚖 Taxis (Average)</span>
                  <span className="text-slate-300 font-bold">Catchment: {stats.avgCatchmentTaxis} vs Nearest: {stats.avgNearestTaxis}</span>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-indigo-500 h-full" style={{ width: `${Math.min(100, (stats.avgCatchmentTaxis / 20) * 100)}%` }} />
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden">
                    <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(100, (stats.avgNearestTaxis / 20) * 100)}%` }} />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Table Filters & Search */}
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Runs Data Log ({processedRuns.length} Runs shown)</h3>
              
              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                {/* Search */}
                <input
                  type="text"
                  placeholder="Search run, centers, schools..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors w-full sm:w-48"
                />

                {/* Filter */}
                <select
                  value={filterWinner}
                  onChange={(e) => setFilterWinner(e.target.value as any)}
                  className="bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 transition-colors cursor-pointer"
                >
                  <option value="all">All Winners</option>
                  <option value="catchment">Catchment Cheaper</option>
                  <option value="nearest">Nearest Cheaper</option>
                  <option value="tie">Neutral (Ties)</option>
                </select>
              </div>
            </div>

            {/* Table of Runs */}
            <div className="border border-slate-850 rounded-xl overflow-hidden bg-slate-955">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-950 text-[10px] uppercase font-bold text-slate-400 border-b border-slate-850 select-none">
                    <th onClick={() => handleSort('runId')} className="p-3 cursor-pointer hover:bg-slate-900 transition-colors">
                      Run ID {sortField === 'runId' && (sortAsc ? '▲' : '▼')}
                    </th>
                    <th className="p-3">Settlements</th>
                    <th className="p-3">Schools</th>
                    <th className="p-3">Students (Isolated)</th>
                    <th onClick={() => handleSort('catchmentCost')} className="p-3 cursor-pointer hover:bg-slate-900 transition-colors">
                      Catchment Cost {sortField === 'catchmentCost' && (sortAsc ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('nearestCost')} className="p-3 cursor-pointer hover:bg-slate-900 transition-colors">
                      Nearest Cost {sortField === 'nearestCost' && (sortAsc ? '▲' : '▼')}
                    </th>
                    <th onClick={() => handleSort('deficit')} className="p-3 cursor-pointer hover:bg-slate-900 transition-colors">
                      Delta {sortField === 'deficit' && (sortAsc ? '▲' : '▼')}
                    </th>
                    <th className="p-3">Verdict</th>
                    <th className="p-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-850 text-xs text-slate-300">
                  {processedRuns.map((run) => {
                    const diff = run.metrics.deficit;
                    let verdictText = 'Neutral';
                    let verdictClass = 'text-slate-400 bg-slate-900/60 border-slate-800';
                    if (diff < 0) {
                      verdictText = 'Catchment';
                      verdictClass = 'text-indigo-400 bg-indigo-950/40 border-indigo-900/30';
                    } else if (diff > 0) {
                      verdictText = 'Nearest';
                      verdictClass = 'text-emerald-400 bg-emerald-950/40 border-emerald-900/30';
                    }

                    return (
                      <tr key={run.runId} className="hover:bg-slate-900/30 transition-colors group">
                        <td className="p-3 font-mono font-bold text-slate-400">#{run.runId}</td>
                        <td className="p-3">{run.params.settlementCount}</td>
                        <td className="p-3">{run.params.schoolCount}</td>
                        <td className="p-3">
                          {run.params.villageCount} <span className="text-[10px] text-slate-500">({run.params.isolatedPercentage}%)</span>
                        </td>
                        <td className="p-3 font-semibold text-slate-350">£{run.metrics.catchmentCost}</td>
                        <td className="p-3 font-semibold text-slate-350">£{run.metrics.nearestCost}</td>
                        <td className="p-3 font-bold font-mono">
                          {diff < 0 ? (
                            <span className="text-indigo-400">−£{Math.abs(diff)}</span>
                          ) : diff > 0 ? (
                            <span className="text-emerald-400">+£{diff}</span>
                          ) : (
                            <span className="text-slate-500">£0</span>
                          )}
                        </td>
                        <td className="p-3">
                          <span className={`px-2 py-0.5 border text-[9px] font-bold rounded-full ${verdictClass}`}>
                            {verdictText}
                          </span>
                        </td>
                        <td className="p-3 text-right">
                          <button
                            onClick={() => onLoadRun(run)}
                            className="px-2.5 py-1 bg-slate-905 hover:bg-indigo-600 hover:text-white border border-slate-800 rounded-lg text-[10px] font-bold text-slate-300 transition-all opacity-80 group-hover:opacity-100 cursor-pointer"
                          >
                            {run.data ? 'Load to Map' : 'Load Sample'}
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                  {processedRuns.length === 0 && (
                    <tr>
                      <td colSpan={9} className="p-8 text-center text-slate-500 font-medium">
                        No simulation runs matched your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/20 text-center text-[10px] text-slate-500">
          Click "Load to Map" or "Load Sample" on any row to close this modal and inject a scenario directly onto the spatial editor.
        </div>

      </div>
    </div>
  );
};
