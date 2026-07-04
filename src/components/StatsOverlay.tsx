import React from 'react';
import type { Household, SettlementCenter, School } from '../types';
import { isPointInSchoolCatchment } from '../utils/generator';

interface StatsOverlayProps {
  households: Household[];
  centers: SettlementCenter[];
  schools: School[];
}

export const StatsOverlay: React.FC<StatsOverlayProps> = ({ households, schools }) => {
  const total = households.length;

  // 1. Calculate School Assignment Splits
  const assignedToA = households.filter((h) => h.assignedSchoolId === 'school-a').length;
  const assignedToB = households.filter((h) => h.assignedSchoolId === 'school-b').length;

  // 2. Calculate Dual-Catchment Overlap Zone Residents
  let overlapCount = 0;
  const schoolA = schools.find((s) => s.id === 'school-a');
  const schoolB = schools.find((s) => s.id === 'school-b');

  if (schoolA && schoolB) {
    households.forEach((h) => {
      const inA = isPointInSchoolCatchment(h, schoolA);
      const inB = isPointInSchoolCatchment(h, schoolB);
      if (inA && inB) {
        overlapCount++;
      }
    });
  }

  // 3. Calculate Mean Travel Distance to Assigned School
  let totalTravelDist = 0;
  let assignedCount = 0;

  households.forEach((h) => {
    if (h.assignedSchoolId) {
      const school = schools.find((s) => s.id === h.assignedSchoolId);
      if (school) {
        const dist = Math.sqrt((h.x - school.x) ** 2 + (h.y - school.y) ** 2);
        totalTravelDist += dist;
        assignedCount++;
      }
    }
  });

  const meanTravelDistance = assignedCount > 0 ? (totalTravelDist / assignedCount).toFixed(2) : '0.00';

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
      {/* Travel Efficiency */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-lg backdrop-blur-xl flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-455 uppercase tracking-wider">Mean Travel Distance</p>
          <h3 className="text-2xl font-bold text-indigo-400 mt-1">
            {meanTravelDistance} <span className="text-xs font-medium text-slate-500">units</span>
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Average straight-line route</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        </div>
      </div>

      {/* Allocation Splits */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-lg backdrop-blur-xl flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-455 uppercase tracking-wider">School Allocations</p>
          <h3 className="text-lg font-bold text-slate-100 mt-1">
            {schools.length > 1 ? (
              <span className="flex items-center gap-2">
                <span className="text-blue-400">A: {assignedToA}</span>
                <span className="text-slate-600">|</span>
                <span className="text-red-400">B: {assignedToB}</span>
              </span>
            ) : (
              <span className="text-blue-400">A: {assignedToA}</span>
            )}
          </h3>
          <p className="text-[10px] text-slate-500 mt-1">Active student assignments</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </div>
      </div>

      {/* Overlap Zone */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-lg backdrop-blur-xl flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-455 uppercase tracking-wider">Overlap Zone Residents</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">
            {schools.length > 1 ? (
              <>
                {overlapCount} <span className="text-xs font-medium text-slate-450">({total > 0 ? Math.round((overlapCount / total) * 100) : 0}%)</span>
              </>
            ) : (
              <span className="text-slate-500">N/A (1 School)</span>
            )}
          </h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Students residing in both zones</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
          </svg>
        </div>
      </div>

      {/* Dispersion Index (Centroid Distance) */}
      <div className="bg-slate-900/60 border border-slate-800 p-4 rounded-xl shadow-lg backdrop-blur-xl flex items-center justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-455 uppercase tracking-wider">Household Density</p>
          <h3 className="text-2xl font-bold text-slate-100 mt-1">{total}</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">Total simulated student nodes</p>
        </div>
        <div className="h-10 w-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        </div>
      </div>
    </div>
  );
};
