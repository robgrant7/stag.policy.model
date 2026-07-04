import React, { useState } from 'react';
import type { ScenarioParams, SettlementCenter } from '../types';

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
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col gap-6">
      {/* Title */}
      <div>
        <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
          <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          Scenario Configuration
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Configure vehicle logistics and distribution parameters for parallel policy modeling.
        </p>
      </div>

      {/* Accordion Panels */}
      <div className="flex flex-col gap-4">
        {/* Accordion 1: Vehicle Fleet Tiers */}
        <div className="border-b border-slate-800 pb-4">
          <button
            type="button"
            onClick={() => toggleAccordion('vehicles')}
            className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-300 hover:text-slate-100 transition-colors uppercase tracking-wider cursor-pointer select-none"
          >
            <span className="flex items-center gap-2">
              <span className="text-indigo-400 text-sm">🚌</span> Accordion 1: Vehicle Fleet Tiers
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
                  min="20"
                  max="100"
                  step="5"
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
                  min="60"
                  max="200"
                  step="5"
                  value={minibusCost}
                  onChange={(e) => onChangeMinibusCost(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-emerald-500 border border-slate-855"
                />
              </div>
            </div>

            {/* Coach parameters */}
            <div className="space-y-3 p-3.5 bg-slate-955/40 border border-slate-855 rounded-xl">
              <div className="flex items-center gap-2 text-slate-305 font-bold text-[10px] uppercase tracking-wider border-b border-slate-900 pb-1.5">
                <span className="text-indigo-400 text-xs">🚌</span> COACH TIER
              </div>
              {/* Capacity */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-455 font-medium">Coach Capacity</span>
                  <span className="text-indigo-400 font-bold">{coachCapacity} pupils</span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="70"
                  step="5"
                  value={coachCapacity}
                  onChange={(e) => onChangeCoachCapacity(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-indigo-500 border border-slate-855"
                />
              </div>
              {/* Threshold */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-455 font-medium">Coach Min Threshold</span>
                  <span className="text-indigo-400 font-bold">{coachThreshold} pupils</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="50"
                  step="5"
                  value={coachThreshold}
                  onChange={(e) => onChangeCoachThreshold(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-indigo-500 border border-slate-855"
                />
              </div>
              {/* Cost */}
              <div className="space-y-1">
                <div className="flex justify-between text-[10px]">
                  <span className="text-slate-455 font-medium">Coach Daily Rate</span>
                  <span className="text-indigo-400 font-bold">£{coachCost}/day</span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="500"
                  step="10"
                  value={coachCost}
                  onChange={(e) => onChangeCoachCost(parseInt(e.target.value))}
                  className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-indigo-500 border border-slate-855"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Accordion 2: Scenario Density Controls */}
        <div className="border-b border-slate-800 pb-4">
          <button
            type="button"
            onClick={() => toggleAccordion('density')}
            className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-300 hover:text-slate-100 transition-colors uppercase tracking-wider cursor-pointer select-none"
          >
            <span className="flex items-center gap-2">
              <span className="text-indigo-400 text-sm">📊</span> Accordion 2: Scenario Density Controls
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

            {/* Settlement Count Picker */}
            <div className="space-y-2">
              <label className="block text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                Number of Settlements
              </label>
              <div className="grid grid-cols-6 gap-1 bg-slate-955 p-1.5 rounded-xl border border-slate-800/80">
                {[1, 2, 3, 4, 5, 6].map((count) => {
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
                      {count}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Village Households Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Village Households</span>
                <span className="text-indigo-400 font-bold">{params.villageCount}</span>
              </div>
              <input
                type="range"
                min="50"
                max="300"
                step="10"
                value={params.villageCount}
                onChange={(e) => handleSliderChange('villageCount', parseInt(e.target.value))}
                className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-slate-800"
              />
            </div>

            {/* Isolated Outliers Slider */}
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs">
                <span className="text-slate-400 font-medium">Isolated Outliers (% of Total)</span>
                <span className="text-rose-400 font-bold">{params.isolatedPercentage}% ({params.isolatedCount})</span>
              </div>
              <input
                type="range"
                min="0"
                max="40"
                step="5"
                value={params.isolatedPercentage}
                onChange={(e) => handleSliderChange('isolatedPercentage', parseInt(e.target.value))}
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
                className="w-full h-1.5 bg-slate-955 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-slate-800"
              />
            </div>

            {/* Overlap Assignment Controls */}
            {params.schoolCount > 1 && (
              <div className="space-y-4 p-4 rounded-xl border border-indigo-950/40 bg-indigo-950/5 mt-4">
                <div className="space-y-2">
                  <label className="block text-xs font-semibold uppercase tracking-wider text-indigo-400">
                    Catchment Overlap Rule
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => onOverlapRuleChange('community')}
                      className={`p-3 rounded-xl border text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                        overlapRule === 'community'
                          ? 'bg-indigo-955/40 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/20'
                          : 'bg-slate-950/60 border-slate-855 text-slate-450 hover:text-slate-200 hover:border-slate-800'
                      }`}
                    >
                      <span className="font-extrabold text-[11px]">Feeder Settlement Unity</span>
                      <span className="text-[9px] font-normal text-slate-500 opacity-90">Community Rule</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => onOverlapRuleChange('legacy_slider')}
                      className={`p-3 rounded-xl border text-xs font-bold tracking-wide transition-all duration-200 cursor-pointer flex flex-col items-center justify-center gap-1 text-center ${
                        overlapRule === 'legacy_slider'
                          ? 'bg-indigo-955/40 border-indigo-500 text-indigo-200 ring-2 ring-indigo-500/20'
                          : 'bg-slate-950/60 border-slate-855 text-slate-450 hover:text-slate-200 hover:border-slate-800'
                      }`}
                    >
                      <span className="font-extrabold text-[11px]">Historical Legacy Split</span>
                      <span className="text-[9px] font-normal text-slate-500 opacity-90">Parental Preference</span>
                    </button>
                  </div>
                </div>

                {overlapRule === 'legacy_slider' && params.schoolCount === 2 && (
                  <div className="space-y-2 pt-1 bg-slate-950/40 border border-slate-855 p-4 rounded-xl">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-bold uppercase tracking-wider">Legacy Preference (A vs B)</span>
                      <span className="text-indigo-400 font-extrabold">{legacySplit.a}% / {100 - legacySplit.a}%</span>
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
                      className="w-full h-1 bg-slate-900 rounded appearance-none cursor-pointer accent-indigo-500 border border-slate-800"
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
                      <span className="text-xs font-bold text-slate-300 uppercase tracking-wider">Attractiveness Sliders</span>
                      <span className="text-[10px] text-indigo-400 font-bold bg-indigo-950/30 px-2 py-0.5 rounded-full border border-indigo-900/40">
                        Utility Multiplier
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

        {/* Accordion 3: Settlement Registry & Archetypes */}
        <div className="border-b border-slate-800 pb-4">
          <button
            type="button"
            onClick={() => toggleAccordion('registry')}
            className="w-full flex items-center justify-between py-2 text-xs font-bold text-slate-300 hover:text-slate-100 transition-colors uppercase tracking-wider cursor-pointer select-none"
          >
            <span className="flex items-center gap-2">
              <span className="text-indigo-400 text-sm">🏘️</span> Accordion 3: Settlement Registry & Archetypes
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
                  className="text-[9px] font-bold text-rose-400 bg-rose-955/20 hover:bg-rose-955/40 border border-rose-900/40 px-2.5 py-1 rounded-lg transition-all cursor-pointer"
                >
                  Reset All Settlements to Defaults
                </button>
              )}
            </div>
            
            <div className="space-y-3">
              {centers.map((center) => (
                <div key={center.id} className="bg-slate-900/50 border border-slate-800/80 p-4 rounded-xl space-y-3">
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
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/30'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-250 hover:bg-slate-900'
                        }`}
                      >
                        Nucleated
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateVillage?.(center.id, { archetype: 'linear' })}
                        className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold transition-all border cursor-pointer ${
                          center.archetype === 'linear'
                            ? 'bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-900/30'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-250 hover:bg-slate-900'
                        }`}
                      >
                        Linear
                      </button>
                    </div>
                  </div>

                  {/* Spread Slider */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px]">
                      <span className="text-slate-400 font-medium">Cluster Spread</span>
                      <span className="text-indigo-400 font-bold">{center.dispersionRadius.toFixed(1)} u</span>
                    </div>
                    <input
                      type="range"
                      min="3.0"
                      max="14.0"
                      step="0.5"
                      value={center.dispersionRadius}
                      onChange={(e) => onUpdateVillage?.(center.id, { dispersionRadius: parseFloat(e.target.value) })}
                      className="w-full h-1 bg-slate-955 rounded-lg appearance-none cursor-pointer accent-indigo-500 border border-slate-855"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Main Action Buttons (Safe at bottom, always visible) */}
      <div className="pt-2 space-y-3 border-t border-slate-800/80">
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
    </div>
  );
};
