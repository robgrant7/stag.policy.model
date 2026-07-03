import React, { useState } from 'react';
import type { ScenarioParams, TransportPolicy } from '../types';

interface ControlPanelProps {
  params: ScenarioParams;
  onChangeParams: (params: ScenarioParams) => void;
  transportPolicy: TransportPolicy;
  onPolicyChange: (policy: TransportPolicy) => void;
  overlapRule: 'community' | 'legacy_slider';
  onOverlapRuleChange: (rule: 'community' | 'legacy_slider') => void;
  legacyPreference: number;
  onLegacyPreferenceChange: (pref: number) => void;
  onGenerate: () => void;
  onExport: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onChangeParams,
  transportPolicy,
  onPolicyChange,
  overlapRule,
  onOverlapRuleChange,
  legacyPreference,
  onLegacyPreferenceChange,
  onGenerate,
  onExport,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleSettlementChange = (count: number) => {
    onChangeParams({
      ...params,
      settlementCount: count,
    });
  };

  const handleSchoolCountChange = (count: number) => {
    onChangeParams({
      ...params,
      schoolCount: count,
    });
  };

  const handleSliderChange = (key: keyof ScenarioParams, value: number) => {
    onChangeParams({
      ...params,
      [key]: value,
    });
  };

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl space-y-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Scenario Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure distribution parameters for rural geographic mapping.
        </p>
      </div>

      {/* Policy Switcher (High Visibility) */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-400">
          Active Transport Policy
        </label>
        <div className="grid grid-cols-2 gap-2 bg-indigo-950/20 p-1.5 rounded-xl border border-indigo-900/30">
          <button
            type="button"
            onClick={() => onPolicyChange('catchment')}
            className={`py-2 px-3 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
              transportPolicy === 'catchment'
                ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-500/20'
                : 'text-indigo-300/70 hover:text-indigo-200 hover:bg-indigo-950/40'
            }`}
          >
            <span>Catchment School</span>
            <span className="text-[9px] font-normal opacity-85">Polygons & Overlaps</span>
          </button>
          
          <button
            type="button"
            onClick={() => onPolicyChange('nearest')}
            className={`py-2 px-3 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-0.5 ${
              transportPolicy === 'nearest'
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-750 text-white shadow-md shadow-emerald-500/20'
                : 'text-emerald-300/70 hover:text-emerald-200 hover:bg-emerald-950/40'
            }`}
          >
            <span>Nearest School</span>
            <span className="text-[9px] font-normal opacity-85">Straight Euclidean</span>
          </button>
        </div>
      </div>

      {/* Overlap Assignment Controls (Only if Catchment policy is active and 2 schools are enabled) */}
      {transportPolicy === 'catchment' && params.schoolCount > 1 && (
        <div className="space-y-4 p-4 rounded-xl border border-indigo-950/40 bg-indigo-950/5 animate-fadeIn">
          <div className="space-y-2">
            <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-400">
              Overlap Assignment Rule
            </label>
            <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-lg border border-slate-900">
              <button
                type="button"
                onClick={() => onOverlapRuleChange('community')}
                className={`py-1.5 px-2 rounded text-[10px] font-bold tracking-wide transition-all duration-150 cursor-pointer text-center ${
                  overlapRule === 'community'
                    ? 'bg-indigo-650/90 text-white font-bold'
                    : 'text-slate-455 hover:text-slate-200'
                }`}
              >
                Community Unity
              </button>
              
              <button
                type="button"
                onClick={() => onOverlapRuleChange('legacy_slider')}
                className={`py-1.5 px-2 rounded text-[10px] font-bold tracking-wide transition-all duration-150 cursor-pointer text-center ${
                  overlapRule === 'legacy_slider'
                    ? 'bg-indigo-650/90 text-white font-bold'
                    : 'text-slate-455 hover:text-slate-200'
                }`}
              >
                Legacy Preference
              </button>
            </div>
          </div>

          {overlapRule === 'legacy_slider' && (
            <div className="space-y-1.5 pt-1 animate-fadeIn">
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-450 font-medium">Split (School A vs B)</span>
                <span className="text-indigo-400 font-bold">{legacyPreference}% / {100 - legacyPreference}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="100"
                step="5"
                value={legacyPreference}
                onChange={(e) => onLegacyPreferenceChange(parseInt(e.target.value))}
                className="w-full h-1 bg-slate-950 rounded appearance-none cursor-pointer accent-indigo-500 border border-slate-800"
              />
              <p className="text-[9px] text-slate-500 leading-tight">
                Deterministic random split of student nodes residing in the central overlap corridor.
              </p>
            </div>
          )}
          
          {overlapRule === 'community' && (
            <p className="text-[9px] text-slate-500 leading-tight">
              * Feeder Settlement Unity: Village student nodes in the overlap corridor are assigned as a single block based on village centroid proximity. Outliers fallback to closest center.
            </p>
          )}
        </div>
      )}

      {/* School Count Picker */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Number of Schools
        </label>
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
          {[1, 2, 3].map((count) => {
            const isActive = params.schoolCount === count;
            return (
              <button
                key={count}
                type="button"
                onClick={() => handleSchoolCountChange(count)}
                className={`py-1.5 px-3 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-slate-850 text-white border border-slate-700/60 shadow-sm'
                    : 'text-slate-450 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {count} {count === 1 ? 'School' : 'Schools'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Settlement Count Picker */}
      <div className="space-y-2">
        <label className="block text-xs font-semibold uppercase tracking-wider text-slate-400">
          Number of Settlements
        </label>
        <div className="grid grid-cols-3 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
          {[1, 2, 3].map((count) => {
            const isActive = params.settlementCount === count;
            return (
              <button
                key={count}
                type="button"
                onClick={() => handleSettlementChange(count)}
                className={`py-1.5 px-2 rounded-lg text-xs font-semibold tracking-wide transition-all duration-200 cursor-pointer ${
                  isActive
                    ? 'bg-slate-850 text-white border border-slate-700/60 shadow-sm'
                    : 'text-slate-455 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                {count} {count === 1 ? 'Settlement' : 'Settlements'}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Action Buttons */}
      <div className="pt-2 space-y-3">
        <button
          onClick={onGenerate}
          className="w-full py-3.5 px-4 bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 active:scale-[0.98] text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer border border-indigo-400/20"
        >
          <svg className="w-5 h-5 animate-spin-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 4H15" />
          </svg>
          Generate New Scenario
        </button>

        <button
          onClick={onExport}
          className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-750 active:scale-[0.98] text-slate-200 hover:text-white font-medium rounded-xl border border-slate-700/60 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Scenario (JSON)
        </button>
      </div>

      {/* Advanced Panel Toggle */}
      <div className="pt-2 border-t border-slate-800/80">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full flex items-center justify-between text-xs font-semibold text-slate-400 hover:text-slate-200 transition-colors py-1 cursor-pointer"
        >
          <span>ADVANCED PARAMETERS</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showAdvanced && (
          <div className="mt-4 space-y-4 pt-2 animate-fadeIn">
            {/* Village Count Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Village Households</span>
                <span className="text-indigo-400 font-bold">{params.villageCount}</span>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                step="5"
                value={params.villageCount}
                onChange={(e) => handleSliderChange('villageCount', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-slate-800"
              />
            </div>

            {/* Isolated Outlier Count Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Isolated Outliers</span>
                <span className="text-rose-400 font-bold">{params.isolatedCount}</span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="2"
                value={params.isolatedCount}
                onChange={(e) => handleSliderChange('isolatedCount', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-slate-800"
              />
            </div>

            {/* Cluster Radius Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Village Cluster Radius</span>
                <span className="text-indigo-400 font-bold">{params.clusterRadius} u</span>
              </div>
              <input
                type="range"
                min="3"
                max="25"
                step="1"
                value={params.clusterRadius}
                onChange={(e) => handleSliderChange('clusterRadius', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-slate-800"
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
