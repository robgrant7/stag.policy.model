import React from 'react';
import type { Household, SettlementCenter } from '../types';

interface StatsOverlayProps {
  households: Household[];
  centers: SettlementCenter[];
}

export const StatsOverlay: React.FC<StatsOverlayProps> = ({ households, centers }) => {
  const total = households.length;
  const villageCount = households.filter((h) => h.type === 'village').length;
  const isolatedCount = households.filter((h) => h.type === 'isolated').length;
  
  // Calculate average dispersion (mean distance of village households to their center)
  let totalDistance = 0;
  let villageCountWithDist = 0;

  households.forEach((h) => {
    if (h.type === 'village' && h.settlementId) {
      const center = centers.find((c) => c.id === h.settlementId);
      if (center) {
        const dist = Math.sqrt((h.x - center.x) ** 2 + (h.y - center.y) ** 2);
        totalDistance += dist;
        villageCountWithDist++;
      }
    }
  });

  const meanDispersion = villageCountWithDist > 0 ? (totalDistance / villageCountWithDist).toFixed(2) : '0.00';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* Total Students Card */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-lg backdrop-blur-xl flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Total Households</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">{total}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Simulated student nodes</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
        </div>
      </div>

      {/* Village Core Card */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-lg backdrop-blur-xl flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Village Clusters</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">
            {villageCount} <span className="text-sm font-medium text-slate-450">({total > 0 ? Math.round((villageCount / total) * 100) : 0}%)</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Clustered student locations</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
      </div>

      {/* Isolated Outliers Card */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-lg backdrop-blur-xl flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Isolated Outliers</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">
            {isolatedCount} <span className="text-sm font-medium text-slate-450">({total > 0 ? Math.round((isolatedCount / total) * 100) : 0}%)</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Outlier homesteads / farms</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center text-rose-450">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </div>
      </div>

      {/* Dispersion Index Card */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-lg backdrop-blur-xl flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Mean Village Spread</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">
            {meanDispersion} <span className="text-xs font-medium text-slate-550">units</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Average distance to center</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
