import React from 'react';
import type { FinancialReport } from '../utils/generator';
import type { TransportPolicy } from '../types';

interface FinancialPanelProps {
  financials: FinancialReport;
  activePolicy: TransportPolicy;
}

export const FinancialPanel: React.FC<FinancialPanelProps> = ({
  financials,
  activePolicy,
}) => {
  const isNearest = activePolicy === 'nearest';
  const hasDeficit = financials.deficit > 0;

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-4">
      {/* Title */}
      <div>
        <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
          <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          Financial Transport Costing
        </h2>
        <p className="text-[10px] text-slate-400 mt-0.5">
          Contrasts daily route contract pricing between policies.
        </p>
      </div>

      {/* Cost Displays */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        <div className="bg-slate-950/50 border border-slate-900 rounded-xl p-3">
          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Catchment Cost</p>
          <p className="text-lg font-extrabold text-slate-300 mt-0.5">
            £{financials.catchmentCost}
            <span className="text-[10px] font-normal text-slate-500"> /day</span>
          </p>
          <span className="text-[8px] text-slate-500">Efficient contract base rate</span>
        </div>

        <div className={`border rounded-xl p-3 transition-colors duration-250 ${
          isNearest 
            ? 'bg-indigo-950/20 border-indigo-900/50' 
            : 'bg-slate-950/50 border-slate-900'
        }`}>
          <p className="text-[9px] font-semibold text-slate-500 uppercase tracking-wider">Nearest Cost</p>
          <p className={`text-lg font-extrabold mt-0.5 ${
            isNearest ? 'text-indigo-400' : 'text-slate-405'
          }`}>
            £{financials.nearestCost}
            <span className="text-[10px] font-normal text-slate-500"> /day</span>
          </p>
          <span className="text-[8px] text-slate-500">Subject to route splits</span>
        </div>
      </div>

      {/* Active Cost Banner */}
      <div className="bg-slate-950/70 border border-slate-900/80 rounded-xl p-4 flex items-center justify-between">
        <div>
          <span className="text-[10px] text-slate-400">Active Daily Allocation Budget:</span>
          <p className="text-xs font-semibold text-slate-200 mt-0.5 italic">
            Using {isNearest ? 'Nearest School' : 'Catchment'} Policy
          </p>
        </div>
        <div className="text-right">
          <span className={`text-xl font-black ${
            isNearest ? 'text-amber-400' : 'text-emerald-400'
          }`}>
            £{financials.activeCost}
          </span>
          <span className="text-[10px] text-slate-500 block">per day</span>
        </div>
      </div>

      {/* Deficit Alert Box */}
      {isNearest && hasDeficit && (
        <div className="bg-rose-500/10 border border-rose-500/20 text-rose-250 rounded-xl p-3.5 flex items-start gap-2.5 animate-fadeIn">
          <svg className="w-4 h-4 text-rose-400 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div className="text-[10.5px] leading-snug space-y-0.5">
            <p className="font-bold text-rose-350">
              Policy Cost Deficit: +£{financials.deficit}/day budget penalty
            </p>
            <p className="text-slate-400 text-[10px]">
              Nearest routing fragments pupil destinations, forcing high-cost minibus/taxi contracts (£25/day rate) for groups of 16 or fewer.
            </p>
          </div>
        </div>
      )}

      {/* Village Fragmentation split warnings */}
      {isNearest && (
        <div className="space-y-2 pt-1 border-t border-slate-800/40">
          <h3 className="text-[10px] font-bold text-slate-450 uppercase tracking-wider">
            Cluster Fragmentation Audit
          </h3>
          
          {financials.splits.length > 0 ? (
            <div className="space-y-1.5">
              {financials.splits.map((s) => (
                <div key={s.centerId} className="bg-slate-950/40 border border-slate-900/60 rounded-lg p-2.5 text-[10px] flex items-start justify-between">
                  <div>
                    <span className="font-bold text-slate-300">{s.centerName}</span>
                    <span className="text-slate-500 ml-1.5">({s.totalStudents} total pupils)</span>
                    <p className="text-rose-400/90 mt-0.5 font-medium leading-normal">
                      ⚠ {s.fragmentedCount} students split onto high-cost alternative routes
                    </p>
                  </div>
                  <div className="text-right text-[9px] text-slate-500 space-y-0.5">
                    {s.distribution.map((d) => (
                      <div key={d.schoolId}>
                        School {d.schoolId.replace('school-', '').toUpperCase()}: {d.count}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-slate-950/40 border border-slate-900/60 rounded-lg p-2.5 text-[10.5px] text-emerald-400/80 italic text-center font-medium">
              ✓ No village clusters split. Operational efficiency optimized.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
