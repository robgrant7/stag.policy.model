import React, { useState } from 'react';
import type { Household, SettlementCenter } from '../types';

interface GridCanvasProps {
  households: Household[];
  centers: SettlementCenter[];
  clusterRadius: number;
}

export const GridCanvas: React.FC<GridCanvasProps> = ({
  households,
  centers,
  clusterRadius,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<Household | SettlementCenter | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'village' | 'isolated'>('all');
  const [selectedSettlementFilter, setSelectedSettlementFilter] = useState<string | null>(null);

  // Filter households based on legend clicks
  const filteredHouseholds = households.filter((h) => {
    if (filterType === 'isolated' && h.type !== 'isolated') return false;
    if (filterType === 'village' && h.type !== 'village') return false;
    if (h.type === 'village' && selectedSettlementFilter && h.settlementId !== selectedSettlementFilter) {
      return false;
    }
    return true;
  });

  // Helper to build color class for inline styling (safeguard for Tailwind compiled colors)
  const getInlineBgColor = (h: Household) => {
    if (h.type === 'isolated') return '#f43f5e'; // rose-500
    const center = centers.find((c) => c.id === h.settlementId);
    return center ? center.color : '#6366f1'; // indigo-500
  };

  // Build grid ticks 0, 10, 20, ..., 100
  const ticks = Array.from({ length: 11 }, (_, i) => i * 10);

  return (
    <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6 backdrop-blur-xl shadow-xl flex flex-col h-full">
      {/* Canvas Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <div>
          <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <svg className="w-5 h-5 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
            </svg>
            Spatial Map Grid
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Geographic grid representing a 100x100 space. (0,0) is bottom-left.
          </p>
        </div>

        {/* Legend / Quick Filter */}
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            onClick={() => {
              setFilterType('all');
              setSelectedSettlementFilter(null);
            }}
            className={`px-2.5 py-1 rounded-md font-semibold border transition-all cursor-pointer ${
              filterType === 'all' && !selectedSettlementFilter
                ? 'bg-slate-800 border-slate-700 text-white'
                : 'bg-slate-950 border-slate-900 text-slate-450 hover:text-slate-200'
            }`}
          >
            All ({households.length})
          </button>
          
          <button
            onClick={() => {
              setFilterType('village');
              setSelectedSettlementFilter(null);
            }}
            className={`px-2.5 py-1 rounded-md font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'village' && !selectedSettlementFilter
                ? 'bg-indigo-950/40 border-indigo-800/60 text-indigo-300'
                : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 inline-block" />
            Village Clusters ({households.filter((h) => h.type === 'village').length})
          </button>

          <button
            onClick={() => {
              setFilterType('isolated');
              setSelectedSettlementFilter(null);
            }}
            className={`px-2.5 py-1 rounded-md font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'isolated'
                ? 'bg-rose-950/40 border-rose-800/60 text-rose-350'
                : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block animate-pulse" />
            Isolated Outliers ({households.filter((h) => h.type === 'isolated').length})
          </button>
        </div>
      </div>

      {/* Grid Canvas Wrapper */}
      <div className="relative flex-1 min-h-[400px] md:min-h-[500px] w-full bg-slate-950 border border-slate-850 rounded-xl overflow-hidden shadow-inner flex items-center justify-center p-8 select-none">
        
        {/* Aspect Ratio Box (Square 1:1) */}
        <div className="relative w-full h-full max-w-[460px] max-h-[460px] aspect-square border border-slate-800/60 bg-slate-950/90 shadow-2xl">
          
          {/* Grid Lines */}
          {ticks.map((tick) => (
            <React.Fragment key={tick}>
              {/* Vertical line (constant X) */}
              <div
                className="absolute top-0 bottom-0 border-l border-slate-900/60 pointer-events-none"
                style={{ left: `${tick}%` }}
              />
              {/* Horizontal line (constant Y) */}
              <div
                className="absolute left-0 right-0 border-t border-slate-900/60 pointer-events-none"
                style={{ bottom: `${tick}%` }}
              />
            </React.Fragment>
          ))}

          {/* Coordinate Labels along Axes */}
          {ticks.map((tick) => (
            <React.Fragment key={`label-${tick}`}>
              {/* X Axis Label */}
              {tick % 20 === 0 && (
                <span
                  className="absolute -bottom-6 text-[10px] font-mono text-slate-500 -translate-x-1/2"
                  style={{ left: `${tick}%` }}
                >
                  {tick}
                </span>
              )}
              {/* Y Axis Label */}
              {tick % 20 === 0 && (
                <span
                  className="absolute -left-6 text-[10px] font-mono text-slate-500 translate-y-1/2"
                  style={{ bottom: `${tick}%` }}
                >
                  {tick}
                </span>
              )}
            </React.Fragment>
          ))}

          {/* Settlement Cluster Radius Rings */}
          {centers.map((center) => (
            <div
              key={`ring-${center.id}`}
              className="absolute border border-dashed rounded-full pointer-events-none transition-all duration-300 ease-out"
              style={{
                width: `${clusterRadius * 2}%`,
                height: `${clusterRadius * 2}%`,
                left: `${center.x - clusterRadius}%`,
                bottom: `${center.y - clusterRadius}%`,
                borderColor: `${center.color}40`, // 25% opacity
                backgroundColor: `${center.color}05`, // 2% opacity
              }}
            />
          ))}

          {/* Settlement Centers (as clickable/hoverable anchors) */}
          {centers.map((center) => (
            <div
              key={center.id}
              className="absolute -translate-x-1/2 translate-y-1/2 z-20 group cursor-pointer"
              style={{
                left: `${center.x}%`,
                bottom: `${center.y}%`,
              }}
              onMouseEnter={() => setHoveredPoint(center)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={() => {
                setFilterType('village');
                setSelectedSettlementFilter(selectedSettlementFilter === center.id ? null : center.id);
              }}
            >
              {/* Target Indicator */}
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center transition-transform group-hover:scale-125 bg-slate-950 shadow-lg"
                style={{ borderColor: center.color }}
              >
                <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: center.color }} />
              </div>
              
              {/* Visual pulsing ripple */}
              <span
                className="absolute top-0 left-0 w-5 h-5 rounded-full animate-ping opacity-25 pointer-events-none"
                style={{ backgroundColor: center.color }}
              />
            </div>
          ))}

          {/* Student/Household Dots */}
          {filteredHouseholds.map((h) => {
            const isHovered = hoveredPoint && hoveredPoint.id === h.id;
            const inlineColor = getInlineBgColor(h);

            return (
              <div
                key={h.id}
                className="absolute -translate-x-1/2 translate-y-1/2 z-10 group cursor-crosshair"
                style={{
                  left: `${h.x}%`,
                  bottom: `${h.y}%`,
                }}
                onMouseEnter={() => setHoveredPoint(h)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                {/* Visual Dot */}
                <div
                  className={`w-2.5 h-2.5 rounded-full transition-all duration-100 ease-out border border-slate-950/65 ${
                    isHovered ? 'scale-175 z-30 shadow-md ring-2 ring-white/30' : 'hover:scale-150'
                  }`}
                  style={{
                    backgroundColor: inlineColor,
                    boxShadow: `0 0 6px ${inlineColor}80`,
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Floating Tooltip / Details Box (Top Left corner of Grid Panel) */}
        <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 backdrop-blur-md shadow-lg pointer-events-none min-w-[140px] z-30">
          <div className="text-[10px] text-indigo-400 font-semibold tracking-wide uppercase">
            Map Inspector
          </div>
          {hoveredPoint ? (
            <div className="mt-1 space-y-1">
              <div className="font-bold text-slate-100">
                {'name' in hoveredPoint ? hoveredPoint.name : hoveredPoint.id}
              </div>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      'color' in hoveredPoint
                        ? hoveredPoint.color
                        : hoveredPoint.type === 'isolated'
                        ? '#f43f5e'
                        : centers.find((c) => c.id === hoveredPoint.settlementId)?.color || '#6366f1',
                  }}
                />
                <span className="capitalize text-[11px]">
                  {'color' in hoveredPoint ? 'Settlement Center' : `${hoveredPoint.type} household`}
                </span>
              </div>
              <div className="font-mono text-indigo-300 text-[11px] mt-0.5">
                X: {hoveredPoint.x.toFixed(1)} | Y: {hoveredPoint.y.toFixed(1)}
              </div>
            </div>
          ) : (
            <div className="mt-1 text-slate-500 italic">
              Hover over centers or household dots to inspect...
            </div>
          )}
        </div>
      </div>

      {/* Sub-Legend showing detailed settlement breakdown */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap gap-x-6 gap-y-2 text-xs">
        <span className="text-slate-500 font-medium self-center">Settlements:</span>
        {centers.map((center) => {
          const isFilterActive = selectedSettlementFilter === center.id;
          return (
            <button
              key={center.id}
              onClick={() => {
                setFilterType('village');
                setSelectedSettlementFilter(isFilterActive ? null : center.id);
              }}
              className={`flex items-center gap-1.5 py-1 px-2.5 rounded-md border transition-all cursor-pointer ${
                isFilterActive
                  ? 'bg-slate-800 text-white'
                  : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
              }`}
              style={{ borderColor: isFilterActive ? center.color : undefined }}
            >
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: center.color }} />
              <span className="font-semibold">{center.name}</span>
              <span className="text-slate-500 font-mono">
                ({households.filter((h) => h.type === 'village' && h.settlementId === center.id).length})
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};
