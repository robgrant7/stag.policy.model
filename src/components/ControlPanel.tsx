import React, { useState } from 'react';
import type { ScenarioParams, SettlementCenter, BulkRunResult } from '../types';

const Tooltip: React.FC<{ text: string }> = ({ text }) => (
  <span className="group relative cursor-help ml-1.5 inline-flex items-center justify-center w-3.5 h-3.5 rounded-full bg-slate-850 text-[10px] text-slate-400 font-bold hover:bg-protest-yellow hover:text-black transition-colors select-none z-10">
    ?
    <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 w-48 hidden group-hover:block bg-black text-slate-200 border border-[#333333] text-[10px] rounded p-2 shadow-xl z-20 font-sans normal-case tracking-normal text-left font-normal leading-normal">
      {text}
    </span>
  </span>
);

interface ControlPanelProps {
  params: ScenarioParams;
  onChangeParams: (params: ScenarioParams) => void;
  overlapRule: 'community' | 'legacy_slider';
  onOverlapRuleChange: (rule: 'community' | 'legacy_slider') => void;
  legacySplit: { a: number; b: number; c: number };
  onLegacySplitChange: (split: { a: number; b: number; c: number }) => void;
  attractiveness: Record<string, number>;
  onAttractivenessChange: (attr: Record<string, number>) => void;
  onGenerate: () => void;
  onExport: () => void;
  centers?: SettlementCenter[];
  onUpdateVillage?: (villageId: string, fields: Partial<SettlementCenter>) => void;
  onResetVillages?: () => void;
  
  // Vehicle Slider Props
  coachCapacity: number;
  onChangeCoachCapacity: (val: number) => void;
  coachThreshold: number;
  onChangeCoachThreshold: (val: number) => void;
  coachCost: number;
  onChangeCoachCost: (val: number) => void;
  minibusCapacity: number;
  onChangeMinibusCapacity: (val: number) => void;
  minibusThreshold: number;
  onChangeMinibusThreshold: (val: number) => void;
  minibusCost: number;
  onChangeMinibusCost: (val: number) => void;
  taxiCapacity: number;
  onChangeTaxiCapacity: (val: number) => void;
  taxiCost: number;
  onChangeTaxiCost: (val: number) => void;

  // Bulk Run Props
  bulkRuns: BulkRunResult[];
  isBulking: boolean;
  bulkProgress: number;
  onRunBulk: (count: number) => void;
  onOpenBulkReport: () => void;
}

export const ControlPanel: React.FC<ControlPanelProps> = ({
  params,
  onChangeParams,
  overlapRule,
  onOverlapRuleChange,
  legacySplit,
  onLegacySplitChange,
  attractiveness,
  onAttractivenessChange,
  onGenerate,
  onExport,
  centers = [],
  onUpdateVillage,
  onResetVillages,
  
  coachCapacity,
  onChangeCoachCapacity,
  coachThreshold,
  onChangeCoachThreshold,
  coachCost,
  onChangeCoachCost,
  minibusCapacity,
  onChangeMinibusCapacity,
  minibusThreshold,
  onChangeMinibusThreshold,
  minibusCost,
  onChangeMinibusCost,
  taxiCapacity,
  onChangeTaxiCapacity,
  taxiCost,
  onChangeTaxiCost,

  bulkRuns,
  isBulking,
  bulkProgress,
  onRunBulk,
  onOpenBulkReport,
}) => {
  // All accordions collapsed by default
  const [activeAccordion, setActiveAccordion] = useState<string | null>(null);

  const toggleAccordion = (panel: string) => {
    setActiveAccordion(activeAccordion === panel ? null : panel);
  };

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
    <div className="bg-[#121212] border border-[#333333] rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-protest-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Scenario Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure vehicle sizes, village shapes, and run rules to test transport costs.
        </p>
      </div>

      {/* Accordion Panels */}
      <div className="flex flex-col gap-4">
        {/* 1. Bus & Taxi Cost Settings */}
        <div className="border-b border-[#333333] pb-4">
          <button
            type="button"
            onClick={() => toggleAccordion('vehicles')}
            className="w-full flex items-center justify-between py-2 text-slate-300 hover:text-white transition-colors cursor-pointer select-none"
          >
            <span className="flex items-center gap-2 font-heading tracking-wider text-base uppercase">
              <span className="text-protest-yellow text-sm">🚌</span> Accordion 1: Vehicle Fleet Tiers
            </span>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${activeAccordion === 'vehicles' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              activeAccordion === 'vehicles' ? 'max-h-[1200px] opacity-100 mt-4 space-y-5' : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            {/* Taxi parameters */}
            <div className="space-y-3 p-3.5 bg-slate-955/40 border border-slate-855 rounded-xl">
              <div className="flex items-center gap-2 text-slate-305 font-bold text-[10px] uppercase tracking-wider border-b border-slate-900 pb-1.5">
                <span className="text-rose-400 text-xs">🚕</span> TAXI TIER
              </div>
              {/* Capacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-455 font-medium">Taxi Capacity</span>
                  <span className="text-rose-400 font-bold">{taxiCapacity} pupils</span>
                </div>
                <input
                  type="range"
                  min="2"
                  max="6"
                  step="1"
                  value={taxiCapacity}
                  onChange={(e) => onChangeTaxiCapacity(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-rose-500 border border-slate-855"
                />
              </div>
              {/* Cost */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-455 font-medium">Taxi Daily Rate (Point-to-Point)</span>
                  <span className="text-rose-400 font-bold">£{taxiCost}/day</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="300"
                  step="10"
                  value={taxiCost}
                  onChange={(e) => onChangeTaxiCost(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-rose-500 border border-slate-855"
                />
              </div>
            </div>

            {/* Minibus parameters */}
            <div className="space-y-3 p-3.5 bg-slate-955/40 border border-slate-855 rounded-xl">
              <div className="flex items-center gap-2 text-slate-305 font-bold text-[10px] uppercase tracking-wider border-b border-slate-900 pb-1.5">
                <span className="text-emerald-400 text-xs">🚐</span> MINIBUS TIER
              </div>
              {/* Capacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-455 font-medium">Minibus Capacity</span>
                  <span className="text-emerald-400 font-bold">{minibusCapacity} pupils</span>
                </div>
                <input
                  type="range"
                  min="8"
                  max="24"
                  step="2"
                  value={minibusCapacity}
                  onChange={(e) => onChangeMinibusCapacity(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-emerald-500 border border-slate-855"
                />
              </div>
              {/* Threshold */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-455 font-medium">Minibus Min Threshold</span>
                  <span className="text-emerald-400 font-bold">{minibusThreshold} pupils</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="12"
                  step="1"
                  value={minibusThreshold}
                  onChange={(e) => onChangeMinibusThreshold(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-emerald-500 border border-slate-855"
                />
              </div>
              {/* Cost */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-455 font-medium">Minibus Daily Rate</span>
                  <span className="text-emerald-400 font-bold">£{minibusCost}/day</span>
                </div>
                <input
                  type="range"
                  min="100"
                  max="400"
                  step="10"
                  value={minibusCost}
                  onChange={(e) => onChangeMinibusCost(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-emerald-500 border border-slate-855"
                />
              </div>
            </div>

            {/* Coach parameters */}
            <div className="space-y-3 p-3.5 bg-slate-955/40 border border-[#333333] rounded-xl">
              <div className="flex items-center gap-2 text-slate-305 font-heading text-xs uppercase tracking-wider border-b border-[#333333] pb-1.5">
                <span className="text-protest-yellow text-xs">🚌</span> COACH TIER
              </div>
              {/* Capacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-455 font-medium">Coach Capacity</span>
                  <span className="text-protest-yellow font-bold">{coachCapacity} pupils</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="70"
                  step="5"
                  value={coachCapacity}
                  onChange={(e) => onChangeCoachCapacity(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-protest-yellow border border-slate-855"
                />
              </div>
              {/* Threshold */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-455 font-medium">Coach Min Threshold</span>
                  <span className="text-protest-yellow font-bold">{coachThreshold} pupils</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="40"
                  step="1"
                  value={coachThreshold}
                  onChange={(e) => onChangeCoachThreshold(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-protest-yellow border border-slate-855"
                />
              </div>
              {/* Cost */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-455 font-medium">Coach Daily Rate</span>
                  <span className="text-protest-yellow font-bold">£{coachCost}/day</span>
                </div>
                <input
                  type="range"
                  min="200"
                  max="800"
                  step="20"
                  value={coachCost}
                  onChange={(e) => onChangeCoachCost(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-protest-yellow border border-slate-855"
                />
              </div>
            </div>
          </div>
        </div>

        {/* 2. Village & School Setup */}
        <div className="border-b border-[#333333] pb-4">
          <button
            type="button"
            onClick={() => toggleAccordion('density')}
            className="w-full flex items-center justify-between py-2 text-slate-300 hover:text-white transition-colors cursor-pointer select-none"
          >
            <span className="flex items-center gap-2 font-heading tracking-wider text-base uppercase">
              <span className="text-protest-yellow text-sm">📊</span> Accordion 2: Scenario Density Controls
            </span>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${activeAccordion === 'density' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              activeAccordion === 'density' ? 'max-h-[1000px] opacity-100 mt-4 space-y-4' : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            {/* School Count Picker */}
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Number of Schools
              </label>
              <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1.5 rounded-xl border border-slate-800/80">
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
                          : 'text-slate-455 hover:text-slate-200 hover:bg-slate-900'
                      }`}
                    >
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Settlement Count Dropdown */}
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Number of Villages List
              </label>
              <select
                value={params.settlementCount}
                onChange={(e) => handleSettlementChange(parseInt(e.target.value))}
                className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-protest-yellow transition-colors cursor-pointer"
              >
                {Array.from({ length: 12 }, (_, i) => i + 1).map((count) => (
                  <option key={count} value={count}>
                    {count} {count === 1 ? 'Village' : 'Villages'}
                  </option>
                ))}
              </select>
            </div>

            {/* Village Households Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-405 font-medium">Village Households</span>
                <span className="text-protest-yellow font-bold">{params.villageCount}</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={params.villageCount}
                onChange={(e) => handleSliderChange('villageCount', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-955 rounded-lg appearance-none cursor-pointer accent-protest-yellow border border-slate-800"
              />
            </div>

            {/* Isolated Outliers Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-405 font-medium">Isolated Outliers (% of Total)</span>
                <span className="text-rose-455 font-bold">{params.isolatedPercentage}% ({params.isolatedCount})</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={params.isolatedPercentage}
                onChange={(e) => handleSliderChange('isolatedPercentage', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-955 rounded-lg appearance-none cursor-pointer accent-protest-yellow border border-slate-800"
              />
            </div>

            {/* Cluster Radius Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-405 font-medium">Village Cluster Radius</span>
                <span className="text-protest-yellow font-bold">{params.clusterRadius} u</span>
              </div>
              <input
                type="range"
                min="3"
                max="25"
                step="1"
                value={params.clusterRadius}
                onChange={(e) => handleSliderChange('clusterRadius', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-955 rounded-lg appearance-none cursor-pointer accent-protest-yellow border border-slate-800"
              />
            </div>

            {/* Overlap Assignment Controls */}
            {params.schoolCount > 1 && (
              <div className="space-y-4 p-4 rounded-xl border border-protest-yellow/20 bg-protest-yellow/5 mt-4">
                <div className="space-y-2">
                  <label className="block text-xs font-heading tracking-wider text-protest-yellow uppercase">
                    Catchment Overlap Rule
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => onOverlapRuleChange('community')}
                      className={`p-3 rounded-xl border text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                        overlapRule === 'community'
                          ? 'bg-protest-yellow/10 border-protest-yellow text-protest-yellow ring-2 ring-protest-yellow/10'
                          : 'bg-slate-950/60 border-slate-855 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                      }`}
                    >
                      <span className="font-extrabold text-[11px]">Keep Villages Together</span>
                      <span className="text-[9px] font-normal text-slate-500 opacity-90">Community Rule</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => onOverlapRuleChange('legacy_slider')}
                      className={`p-3 rounded-xl border text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                        overlapRule === 'legacy_slider'
                          ? 'bg-protest-yellow/10 border-protest-yellow text-protest-yellow ring-2 ring-protest-yellow/10'
                          : 'bg-slate-950/60 border-slate-855 text-slate-400 hover:text-slate-200 hover:border-slate-800'
                      }`}
                    >
                      <span className="font-extrabold text-[11px]">Split Villages</span>
                      <span className="text-[9px] font-normal text-slate-500 opacity-90">Parent Choice</span>
                    </button>
                  </div>
                </div>

                {overlapRule === 'legacy_slider' && params.schoolCount === 2 && (
                  <div className="space-y-2 pt-1 bg-slate-950/40 border border-slate-855 p-4 rounded-xl">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase tracking-wider flex items-center">Parent Choice Split (A vs B)<Tooltip text="The historical percentage division of student choice between School A and School B." /></span>
                      <span className="text-protest-yellow font-extrabold">{legacySplit.a}% / {100 - legacySplit.a}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      step="5"
                      value={legacySplit.a}
                      onChange={(e) => {
                        const val = parseInt(e.target.value);
                        onLegacySplitChange({ a: val, b: 100 - val, c: 0 });
                      }}
                      className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-protest-yellow border border-slate-800"
                    />
                    <div className="flex justify-between text-[8px] text-slate-555">
                      <span>School A (Left)</span>
                      <span>School B (Right)</span>
                    </div>
                  </div>
                )}

                {overlapRule === 'legacy_slider' && params.schoolCount >= 3 && (
                  <div className="space-y-4 pt-1 bg-slate-950/40 border border-slate-855 p-4 rounded-xl">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-350 uppercase tracking-wider">Attractiveness Sliders</span>
                      <span className="text-[10px] text-protest-yellow font-bold bg-protest-yellow/10 px-2 py-0.5 rounded-full border border-protest-yellow/20">
                        Parent Preference
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                      {Array.from({ length: params.schoolCount }).map((_, index) => {
                        const SCHOOL_IDS = ['school-a', 'school-b', 'school-c', 'school-d', 'school-e', 'school-f'];
                        const SCHOOL_NAMES = ['School A', 'School B', 'School C', 'School D', 'School E', 'School F'];
                        const SCHOOL_COLORS = ['#3b82f6', '#ef4444', '#84cc16', '#a855f7', '#f97316', '#06b6d4'];
                        
                        const id = SCHOOL_IDS[index];
                        const name = SCHOOL_NAMES[index];
                        const color = SCHOOL_COLORS[index];
                        const val = attractiveness[id] ?? 0.0;
                        
                        return (
                          <div key={id} className="space-y-1">
                            <div className="flex justify-between text-[10px] items-center">
                              <span className="font-semibold" style={{ color }}>{name}</span>
                              <span className="font-black px-1.5 py-0.2 bg-slate-900 border border-slate-800 rounded text-[9px]" style={{ color }}>
                                {val >= 0 ? `+${val.toFixed(1)}` : val.toFixed(1)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="-1.0"
                              max="1.0"
                              step="0.1"
                              value={val}
                              onChange={(e) => {
                                const value = parseFloat(e.target.value);
                                onAttractivenessChange({
                                  ...attractiveness,
                                  [id]: value
                                });
                              }}
                              className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer border border-slate-855"
                              style={{ accentColor: color }}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 3. Custom Village Layouts */}
        <div className="border-b border-[#333333] pb-4">
          <button
            type="button"
            onClick={() => toggleAccordion('registry')}
            className="w-full flex items-center justify-between py-2 text-slate-300 hover:text-white transition-colors cursor-pointer select-none"
          >
            <span className="flex items-center gap-2 font-heading tracking-wider text-base uppercase">
              <span className="text-protest-yellow text-sm">🏘️</span> Accordion 3: Settlement Registry & Archetypes
            </span>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${activeAccordion === 'registry' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              activeAccordion === 'registry' ? 'max-h-[1200px] opacity-100 mt-4 space-y-4' : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">Settlements</span>
              {onResetVillages && (
                <button
                  type="button"
                  onClick={onResetVillages}
                  className="text-[9px] font-bold text-rose-450 bg-[#331111]/20 hover:bg-[#441111]/45 hover:bg-rose-955/40 border border-rose-900/40 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  Reset Villages
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {centers.map((center) => (
                <div key={center.id} className="bg-black/40 border border-[#333333] p-4 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full border shadow-sm" style={{ backgroundColor: center.color, borderColor: center.color }} />
                      <span className="text-xs font-bold text-slate-200">{center.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded-full border border-slate-850">
                      {center.headcount} Pupils (North Yorkshire)
                    </span>
                  </div>

                  {/* Archetype Toggle Button Group */}
                  <div className="space-y-1">
                    <span className="text-[9px] text-slate-450 uppercase tracking-wider font-semibold">Layout Archetype</span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => onUpdateVillage?.(center.id, { archetype: 'nucleated' })}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                          center.archetype === 'nucleated'
                            ? 'bg-protest-yellow text-black border-protest-yellow shadow-md shadow-protest-yellow/20 font-bold'
                            : 'bg-[#121212] text-slate-405 border-[#333333] hover:text-slate-200 hover:bg-[#1a1a1a]'
                        }`}
                      >
                        Clustered
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateVillage?.(center.id, { archetype: 'linear' })}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                          center.archetype === 'linear'
                            ? 'bg-protest-yellow text-black border-protest-yellow shadow-md shadow-protest-yellow/20 font-bold'
                            : 'bg-[#121212] text-slate-405 border-[#333333] hover:text-slate-200 hover:bg-[#1a1a1a]'
                        }`}
                      >
                        Roadside
                      </button>
                    </div>
                  </div>

                  {/* Spread Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-medium flex items-center">Village Spread Size<Tooltip text="The physical spread area of this village cluster on the map." /></span>
                      <span className="text-protest-yellow font-bold">{center.dispersionRadius.toFixed(1)} u</span>
                    </div>
                    <input
                      type="range"
                      min="3.0"
                      max="14.0"
                      step="0.5"
                      value={center.dispersionRadius}
                      onChange={(e) => onUpdateVillage?.(center.id, { dispersionRadius: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-slate-955 rounded-lg appearance-none cursor-pointer accent-protest-yellow border border-slate-855"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 4. Test Many Scenarios (Bulk Run) */}
        <div className="border-b border-[#333333] pb-4">
          <button
            type="button"
            onClick={() => toggleAccordion('bulk')}
            className="w-full flex items-center justify-between py-2 text-slate-300 hover:text-white transition-colors cursor-pointer select-none"
          >
            <span className="flex items-center gap-2 font-heading tracking-wider text-base uppercase">
              <span className="text-protest-yellow text-sm">🧪</span> Accordion 4: Bulk Simulation Run
            </span>
            <svg
              className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${activeAccordion === 'bulk' ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden ${
              activeAccordion === 'bulk' ? 'max-h-[800px] opacity-100 mt-4 space-y-4' : 'max-h-0 opacity-0 pointer-events-none'
            }`}
          >
            <div className="space-y-3 p-3.5 bg-slate-955/40 border border-slate-855 rounded-xl">
              <p className="text-[11px] leading-relaxed text-slate-400">
                Run multiple randomized scenarios in the background to see which policy is generally cheaper. Each scenario randomizes the layout, school locations, attractiveness choice, and student distribution.
              </p>

              {/* Number of Runs Input Box */}
              <div className="space-y-1.5">
                <label className="block text-[9px] font-bold text-slate-500 uppercase tracking-wider">
                  Number of Simulation Runs
                </label>
                <input
                  type="number"
                  id="bulk-runs-count"
                  min="1"
                  max="2500"
                            className="w-full bg-slate-950 text-slate-200 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold focus:outline-none focus:border-protest-yellow transition-colors"
                  placeholder="e.g. 100"
                />
              </div>

              {/* Progress indicator */}
              {isBulking && (
                <div className="space-y-2 pt-2 border-t border-[#333333]">
                  <div className="flex justify-between text-[10px] text-slate-400 font-bold">
                    <span>Simulating runs...</span>
                    <span className="text-protest-yellow font-black">{bulkProgress}%</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-1.5 overflow-hidden border border-slate-900">
                    <div
                      className="bg-protest-yellow h-full transition-all duration-150 ease-out"
                      style={{ width: `${bulkProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Simulation Trigger Button */}
              <button
                type="button"
                disabled={isBulking}
                onClick={() => {
                  const inputEl = document.getElementById('bulk-runs-count') as HTMLInputElement;
                  let count = inputEl ? parseInt(inputEl.value) : 50;
                  if (isNaN(count) || count < 1) count = 1;
                  if (count > 2500) count = 2500;
                  onRunBulk(count);
                }}
                className={`w-full py-2 px-4 rounded-xl text-xs font-bold transition-all duration-150 flex items-center justify-center gap-2 cursor-pointer ${
                  isBulking
                    ? 'bg-slate-900 text-slate-650 border border-slate-800 cursor-not-allowed'
                    : 'bg-protest-yellow hover:bg-[#ffe240] text-black active:scale-[0.98]'
                }`}
              >
                {isBulking ? (
                  <>
                    <svg className="animate-spin h-3.5 w-3.5 text-slate-650" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Running Tests...
                  </>
                ) : (
                  <>
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14.7 15.3a6 6 0 0 1-8.4 0L3 12m0 0l3-3m-3 3h12m4 4v-1a3 3 0 0 0-3-3h-1m4-4V5a3 3 0 0 0-3-3h-2" />
                    </svg>
                    Start Bulk Test
                  </>
                )}
              </button>
            </div>

            {/* Quick summary stats of previous run if any */}
            {bulkRuns.length > 0 && !isBulking && (
              <div className="bg-[#222222] border border-[#333333] rounded-xl p-3.5 space-y-2.5 transition-all">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-350 uppercase tracking-wider border-b border-[#333333] pb-1.5">
                  <span>Test Run Results ({bulkRuns.length} Runs)</span>
                  <span className="text-emerald-450 font-extrabold uppercase">Complete</span>
                </div>
                
                {(() => {
                  const catchmentCheaper = bulkRuns.filter((r) => r.metrics.deficit < 0).length;
                  const nearestCheaper = bulkRuns.filter((r) => r.metrics.deficit > 0).length;
                  const ties = bulkRuns.filter((r) => r.metrics.deficit === 0).length;

                  const pctCatchment = Math.round((catchmentCheaper / bulkRuns.length) * 100);
                  const pctNearest = Math.round((nearestCheaper / bulkRuns.length) * 100);
                  const pctTies = Math.round((ties / bulkRuns.length) * 100);

                  return (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-1 text-center">
                        <div className="bg-slate-900/50 p-1.5 rounded-lg">
                          <span className="block text-[8px] text-slate-500 font-semibold uppercase">Catchment</span>
                          <span className="text-xs font-bold text-protest-yellow">{pctCatchment}%</span>
                        </div>
                        <div className="bg-slate-900/50 p-1.5 rounded-lg">
                          <span className="block text-[8px] text-slate-500 font-semibold uppercase">Nearest</span>
                          <span className="text-xs font-bold text-protest-green">{pctNearest}%</span>
                        </div>
                        <div className="bg-slate-900/50 p-1.5 rounded-lg">
                          <span className="block text-[8px] text-slate-500 font-semibold uppercase">Neutral / Ties</span>
                          <span className="text-xs font-bold text-slate-400">{pctTies}%</span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={onOpenBulkReport}
                        className="w-full py-2 px-3 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white rounded-lg text-[10.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5 text-protest-yellow" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2m0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" />
                        </svg>
                        Open Interactive Report
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Action Buttons (Safe at bottom, always visible) */}
      <div className="pt-4 space-y-3 border-t border-[#333333]">
        <button
          onClick={onGenerate}
          className="w-full py-3 px-4 bg-protest-yellow hover:bg-[#ffe240] active:scale-[0.98] text-black font-heading text-lg font-bold tracking-wider uppercase rounded-xl shadow-lg shadow-protest-yellow/10 flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer border border-protest-yellow"
        >
          <svg className="w-5 h-5 animate-spin-hover" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 4H15" />
          </svg>
          Generate New Scenario
        </button>

        <button
          onClick={onExport}
          className="w-full py-2.5 px-4 bg-[#222222] hover:bg-[#2e2e2e] active:scale-[0.98] text-slate-200 hover:text-white font-heading text-sm font-semibold tracking-wider uppercase rounded-xl border border-[#333333] flex items-center justify-center gap-2 transition-all duration-150 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export Scenario (JSON)
        </button>
      </div>
    </div>
  );
};
