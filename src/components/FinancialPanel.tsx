import React from 'react';
import type { FinancialReport } from '../utils/generator';

interface FinancialPanelProps {
  financials: FinancialReport;
}

export const FinancialPanel: React.FC<FinancialPanelProps> = ({ financials }) => {
  const delta = financials.deficit; // nearest - catchment

  const pluralize = (count: number, singular: string, plural: string) => {
    return `${count} ${count === 1 ? singular : plural}`;
  };

  return (
    <div className="bg-[#222222] border border-[#333333] rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#333333] pb-3">
        <div>
          <h2 className="font-heading tracking-wider text-base text-slate-200 flex items-center gap-2">
            <svg className="w-4 h-4 text-protest-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
            </svg>
            Comparative Transport Cost Dashboard
          </h2>
          <p className="text-[10px] text-slate-400 mt-0.5 font-sans">
            Compare daily transport costs under the Catchment policy vs the Nearest School policy.
          </p>
        </div>
        <span className="text-[9px] text-slate-400 bg-black/60 px-2 py-0.5 rounded border border-[#333333] font-heading tracking-wider uppercase">
          Dual-Policy Engine Active
        </span>
      </div>

      {/* Main Stack */}
      <div className="flex flex-col gap-4 font-sans">
        {/* Left: Catchment Policy Column */}
        <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-protest-blue uppercase tracking-wider">Catchment Policy</span>
              <span className="text-[9px] text-slate-550 font-bold uppercase tracking-wider">School boundary zones</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-200 font-sans">£{financials.catchmentCost}</span>
              <span className="text-xs font-semibold text-slate-500 font-sans"> /day</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#333333] space-y-1.5">
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">Vehicle Inventory</span>
            <div className="grid grid-cols-3 gap-1">
              <div className="bg-[#121212] p-1.5 rounded-lg text-center">
                <span className="text-xs">🚌</span>
                <span className="block text-[8px] font-bold text-protest-blue mt-0.5">
                  {pluralize(financials.catchmentCoaches, 'Coach', 'Coaches')}
                </span>
              </div>
              <div className="bg-[#121212] p-1.5 rounded-lg text-center">
                <span className="text-xs">🚐</span>
                <span className="block text-[8px] font-bold text-protest-green mt-0.5">
                  {pluralize(financials.catchmentMinibuses, 'Minibus', 'Minibuses')}
                </span>
              </div>
              <div className="bg-[#121212] p-1.5 rounded-lg text-center">
                <span className="text-xs">🚖</span>
                <span className="block text-[8px] font-bold text-protest-pink mt-0.5">
                  {pluralize(financials.catchmentTaxis, 'Taxi', 'Taxis')}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Center: Analytical Verdict Banner */}
        <div className="flex items-center justify-center font-sans">
          {delta > 0 && (
            <div className="bg-protest-pink/10 text-protest-pink border border-protest-pink/30 rounded-md p-3 text-sm font-medium text-center space-y-1.5 flex flex-col justify-center w-full">
              <span className="text-base">⚠️</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-protest-pink font-heading tracking-widest text-xs">Nearest Policy is More Expensive</p>
              <p className="text-[10.5px] leading-snug font-medium">
                Nearest School policy is more expensive. Sending children to their closest school splits up villages and requires more individual taxi contracts, costing an extra £{delta}/day.
              </p>
            </div>
          )}

          {delta === 0 && (
            <div className="bg-[#1a1a1a] text-slate-400 border border-[#333333] rounded-md p-3 text-sm text-center space-y-1.5 flex flex-col justify-center w-full">
              <span className="text-base">⚖️</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 font-heading tracking-widest text-xs">Both Policies Cost the Same</p>
              <p className="text-[10.5px] leading-snug font-medium">
                Both policies cost the same amount. The same numbers of coaches, minibuses, and taxis are needed.
              </p>
            </div>
          )}

          {delta < 0 && (
            <div className="bg-protest-green/10 text-protest-green border border-protest-green/30 rounded-md p-3 text-sm font-medium text-center space-y-1.5 flex flex-col justify-center w-full">
              <span className="text-base">✅</span>
              <p className="text-[10px] font-bold uppercase tracking-wider text-protest-green font-heading tracking-widest text-xs">Nearest Policy Saves Money</p>
              <p className="text-[10.5px] leading-snug font-medium">
                Nearest School policy saves money. Sending children to their closest school allows for better bus routes, saving £{Math.abs(delta)}/day.
              </p>
            </div>
          )}
        </div>

        {/* Right: Nearest School Policy Column */}
        <div className="bg-[#1a1a1a] border border-[#333333] rounded-xl p-4 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-protest-green uppercase tracking-wider">Nearest School Policy</span>
              <span className="text-[9px] text-slate-550 font-bold uppercase tracking-wider">Closest school by straight-line</span>
            </div>
            <div className="mt-2">
              <span className="text-2xl font-black text-slate-200 font-sans">£{financials.nearestCost}</span>
              <span className="text-xs font-semibold text-slate-500 font-sans"> /day</span>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#333333] space-y-1.5">
            <span className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider block">Vehicle Inventory</span>
            <div className="grid grid-cols-3 gap-1 font-sans">
              <div className="bg-[#121212] p-1.5 rounded-lg text-center">
                <span className="text-xs">🚌</span>
                <span className="block text-[8px] font-bold text-protest-blue mt-0.5">
                  {pluralize(financials.nearestCoaches, 'Coach', 'Coaches')}
                </span>
              </div>
              <div className="bg-[#121212] p-1.5 rounded-lg text-center">
                <span className="text-xs">🚐</span>
                <span className="block text-[8px] font-bold text-protest-green mt-0.5">
                  {pluralize(financials.nearestMinibuses, 'Minibus', 'Minibuses')}
                </span>
              </div>
              <div className="bg-[#121212] p-1.5 rounded-lg text-center">
                <span className="text-xs">🚖</span>
                <span className="block text-[8px] font-bold text-protest-pink mt-0.5">
                  {pluralize(financials.nearestTaxis, 'Taxi', 'Taxis')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
