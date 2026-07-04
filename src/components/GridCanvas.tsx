import React, { useState, useMemo } from 'react';
import type { Household, SettlementCenter, School } from '../types';
import { isPointInSchoolCatchment } from '../utils/generator';

interface GridCanvasProps {
  households: Household[];
  centers: SettlementCenter[];
  schools: School[];
  clusterRadius: number;
  mapViewPolicy: 'catchment' | 'nearest';
  onMapViewPolicyChange: (policy: 'catchment' | 'nearest') => void;
}

export const GridCanvas: React.FC<GridCanvasProps> = ({
  households,
  centers,
  schools,
  clusterRadius,
  mapViewPolicy,
  onMapViewPolicyChange,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<Household | SettlementCenter | School | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedSettlementFilter, setSelectedSettlementFilter] = useState<string | null>(null);

  const diagnostics = useMemo(() => {
    const testPoints = [
      { name: 'Bottom-Left (0,0)', x: 0.5, y: 0.5 },
      { name: 'Bottom-Right (500,0)', x: 499.5, y: 0.5 },
      { name: 'Top-Left (0,500)', x: 0.5, y: 499.5 },
      { name: 'Top-Right (500,500)', x: 499.5, y: 499.5 },
    ];
    const uncoveredCorners = testPoints.filter(
      (pt) => !schools.some((school) => isPointInSchoolCatchment(pt, school))
    ).map((pt) => pt.name);

    return {
      uncoveredCorners,
      isClean: uncoveredCorners.length === 0,
      schoolCount: schools.length,
    };
  }, [schools]);

  // Filter households based on legend clicks
  const filteredHouseholds = households.filter((h) => {
    if (filterType === 'isolated' && h.type !== 'isolated') return false;
    if (filterType === 'village' && h.type !== 'village') return false;
    if (filterType.startsWith('school-') && h.assignedSchoolId !== filterType) return false;
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

  // Build grid ticks 0, 50, 100, ..., 500
  const ticks = Array.from({ length: 11 }, (_, i) => i * 50);

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
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <p className="text-xs text-slate-400">
              500x500 geographic space. Fills show school catchments.
            </p>
            <span className="text-slate-700 hidden sm:inline">•</span>
            <div className="flex items-center gap-0.5 bg-slate-950 p-0.5 rounded-lg border border-slate-800/80">
              <button
                type="button"
                onClick={() => onMapViewPolicyChange('catchment')}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all duration-150 cursor-pointer ${
                  mapViewPolicy === 'catchment'
                    ? 'bg-indigo-600 text-white shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                Catchment View
              </button>
              <button
                type="button"
                onClick={() => onMapViewPolicyChange('nearest')}
                className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all duration-150 cursor-pointer ${
                  mapViewPolicy === 'nearest'
                    ? 'bg-emerald-650 text-white shadow-sm font-extrabold'
                    : 'text-slate-500 hover:text-slate-350'
                }`}
              >
                Nearest View
              </button>
            </div>
          </div>
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
                ? 'bg-slate-850 border-slate-700 text-white'
                : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
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
                ? 'bg-indigo-950/40 border-indigo-850/60 text-indigo-300'
                : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
            Village Clusters ({households.filter((h) => h.type === 'village').length})
          </button>

          <button
            onClick={() => {
              setFilterType('isolated');
              setSelectedSettlementFilter(null);
            }}
            className={`px-2.5 py-1 rounded-md font-semibold border transition-all flex items-center gap-1.5 cursor-pointer ${
              filterType === 'isolated'
                ? 'bg-rose-950/40 border-rose-850/60 text-rose-350'
                : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            Isolated Outliers ({households.filter((h) => h.type === 'isolated').length})
          </button>
        </div>
      </div>

      {/* Map Inspector status bar row */}
      <div className="bg-slate-950/60 border border-slate-800 rounded-lg p-3 min-h-[50px] mb-4 text-xs text-slate-350 backdrop-blur-md shadow-lg flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-[10px] text-indigo-400 font-bold tracking-wide uppercase border-r border-slate-800 pr-3">
            Map Inspector (V2.1 - Repositioning Active)
          </div>
          {hoveredPoint ? (
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
              <span className="font-bold text-slate-100">
                {'polygon' in hoveredPoint
                  ? hoveredPoint.name
                  : 'name' in hoveredPoint
                  ? hoveredPoint.name
                  : hoveredPoint.id}
              </span>
              
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{
                    backgroundColor:
                      'polygon' in hoveredPoint
                        ? hoveredPoint.color
                        : 'color' in hoveredPoint
                        ? hoveredPoint.color
                        : hoveredPoint.type === 'isolated'
                        ? '#f43f5e'
                        : centers.find((c) => c.id === hoveredPoint.settlementId)?.color || '#6366f1',
                  }}
                />
                <span className="capitalize text-[10px] text-slate-400">
                  {'polygon' in hoveredPoint
                    ? 'School Landmark'
                    : 'color' in hoveredPoint
                    ? 'Settlement Center'
                    : `${hoveredPoint.type} household`}
                </span>
              </div>

              {'assignedSchoolId' in hoveredPoint && hoveredPoint.assignedSchoolId && (() => {
                const s = schools.find((sch) => sch.id === hoveredPoint.assignedSchoolId);
                return (
                  <div className="text-[10px] text-slate-400">
                    Assigned: <span className="font-bold" style={{ color: s ? s.color : '#94a3b8' }}>{s ? s.name : hoveredPoint.assignedSchoolId}</span>
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-3">
              <div className="text-slate-500 italic text-[10px]">
                Hover over pins or dots to inspect...
              </div>
              {!diagnostics.isClean && (
                <div className="text-rose-400 font-semibold text-[10px] px-2 py-0.5 rounded border border-rose-950/40 bg-rose-950/10 animate-pulse">
                  ⚠️ Catchment Gap at {diagnostics.uncoveredCorners.join(', ')}! Please Hard Reload (Ctrl+F5)
                </div>
              )}
              {diagnostics.schoolCount > 3 && (
                <div className="text-amber-400 font-semibold text-[10px] px-2 py-0.5 rounded border border-amber-950/40 bg-amber-950/10">
                  ⚠️ Active Schools: {diagnostics.schoolCount} (Maximum 3 recommended). Please Hard Reload
                </div>
              )}
            </div>
          )}
        </div>
        {hoveredPoint && (
          <div className="font-mono text-indigo-300 text-[10px] bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
            X: {hoveredPoint.x.toFixed(1)} | Y: {hoveredPoint.y.toFixed(1)}
          </div>
        )}
      </div>

      {/* Grid Canvas Wrapper */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center p-4 md:p-6 select-none">
        
        {/* Aspect Ratio Box (Square 1:1) */}
        <div className="w-full max-w-full max-h-full aspect-square bg-slate-950 border border-slate-800 relative flex items-center justify-center m-auto shadow-2xl" style={{ padding: '5%' }}>
          
          {/* Grid Lines */}
          {ticks.map((tick) => (
            <React.Fragment key={tick}>
              <div
                className="absolute top-0 bottom-0 border-l border-slate-900/60 pointer-events-none"
                style={{ left: `${tick / 5}%` }}
              />
              <div
                className="absolute left-0 right-0 border-t border-slate-900/60 pointer-events-none"
                style={{ bottom: `${tick / 5}%` }}
              />
            </React.Fragment>
          ))}

          {/* Coordinate Labels along Axes */}
          {ticks.map((tick) => (
            <React.Fragment key={`label-${tick}`}>
              {tick % 100 === 0 && (
                <span
                  className="absolute -bottom-6 text-[10px] font-mono text-slate-500 -translate-x-1/2"
                  style={{ left: `${tick / 5}%` }}
                >
                  {tick}
                </span>
              )}
              {tick % 100 === 0 && (
                <span
                  className="absolute -left-6 text-[10px] font-mono text-slate-500 translate-y-1/2"
                  style={{ bottom: `${tick / 5}%` }}
                >
                  {tick}
                </span>
              )}
            </React.Fragment>
          ))}

          {/* SVG Overlay Layer: Polygons and Assignment Vectors */}
          {/* Note: In SVG, (0,0) is top-left, so we convert y coordinate: svg_y = 500 - y */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none z-10"
            viewBox="0 0 500 500"
            preserveAspectRatio="none"
          >
            <defs>
              <clipPath id="grid-clip">
                <rect width="500" height="500" x="0" y="0" />
              </clipPath>
            </defs>

            <g clipPath="url(#grid-clip)">
              {/* 1. School Catchment Polygons (Translucent solid tints, naturally blending at overlaps) */}
              {schools.map((school) => {
                const polys = school.polygons && school.polygons.length > 0
                  ? school.polygons
                  : [school.polygon];
                return polys.map((poly, pIdx) => {
                  const pointsStr = poly
                    .map((p) => `${p.x},${500 - p.y}`)
                    .join(' ');
                  return (
                    <polygon
                      key={`poly-${school.id}-${pIdx}`}
                      points={pointsStr}
                      fill={school.color}
                      fillOpacity={0.15}
                      stroke={school.color}
                      strokeWidth="0.75"
                      className="transition-all duration-300"
                    />
                  );
                });
              })}

              {/* 2. Interactive Selection Route Lines (Narrow Muted Links) */}
              {(() => {
                const activeSchoolId = filterType.startsWith('school-') ? filterType : null;

                if (!activeSchoolId) return null;
                const activeSchool = schools.find((s) => s.id === activeSchoolId);
                if (!activeSchool) return null;

                return centers.map((center) => {
                  const studentCount = households.filter(
                    (h) => h.settlementId === center.id && h.assignedSchoolId === activeSchoolId
                  ).length;

                  if (studentCount === 0) return null;

                  return (
                    <line
                      key={`route-${activeSchool.id}-${center.id}`}
                      x1={activeSchool.x}
                      y1={500 - activeSchool.y}
                      x2={center.x}
                      y2={500 - center.y}
                      stroke="#475569"
                      strokeWidth="1"
                      opacity="0.5"
                      className="transition-all duration-300"
                    />
                  );
                });
              })()}

              {/* 3. Fine Student-to-School Leader Lines (Clutter-Free Links) */}
              {(() => {
                const activeSchoolId = filterType.startsWith('school-') ? filterType : null;

                if (!activeSchoolId) return null;

                return households.map((h) => {
                  if (h.assignedSchoolId !== activeSchoolId) return null;
                  const school = schools.find((s) => s.id === activeSchoolId);
                  if (!school) return null;
                  return (
                    <line
                      key={`leader-${h.id}`}
                      x1={h.x}
                      y1={500 - h.y}
                      x2={school.x}
                      y2={500 - school.y}
                      stroke={school.color}
                      strokeWidth="0.5"
                      opacity={0.15}
                      className="transition-all duration-300 pointer-events-none"
                    />
                  );
                });
              })()}
            </g>
          </svg>

          {/* Settlement Cluster Radius Rings (Faint overlays, scaled by final village headcount) */}
          {centers.map((center) => {
            const headcount = households.filter((h) => h.settlementId === center.id).length;
            const localRadius = clusterRadius * 5 * Math.sqrt(headcount / 15); // scaled by 5 for 500x500 space
            return (
              <div
                key={`ring-${center.id}`}
                className="absolute border border-dashed rounded-full pointer-events-none transition-all duration-300 ease-out"
                style={{
                  width: `${(localRadius * 2) / 5}%`,
                  height: `${(localRadius * 2) / 5}%`,
                  left: `${(center.x - localRadius) / 5}%`,
                  bottom: `${(center.y - localRadius) / 5}%`,
                  borderColor: `${center.color}20`,
                  backgroundColor: `${center.color}02`,
                }}
              />
            );
          })}

          {/* Settlement Centers */}
          {centers.map((center) => (
            <div
              key={center.id}
              className="absolute -translate-x-1/2 translate-y-1/2 z-20 group cursor-pointer"
              style={{
                left: `${center.x / 5}%`,
                bottom: `${center.y / 5}%`,
              }}
              onMouseEnter={() => setHoveredPoint(center)}
              onMouseLeave={() => setHoveredPoint(null)}
              onClick={() => {
                setFilterType('village');
                setSelectedSettlementFilter(selectedSettlementFilter === center.id ? null : center.id);
              }}
            >
              <div
                className="w-4 h-4 rounded-full border flex items-center justify-center transition-transform group-hover:scale-125 bg-slate-950 shadow-md"
                style={{ borderColor: center.color }}
              >
                <div className="w-1 h-1 rounded-full" style={{ backgroundColor: center.color }} />
              </div>
            </div>
          ))}

          {/* School Landmarks (Prominent markers) */}
          {schools.map((school) => {
            const isHovered = hoveredPoint && hoveredPoint.id === school.id;
            return (
              <div
                key={school.id}
                className="absolute -translate-x-1/2 translate-y-1/2 z-30 flex flex-col items-center group cursor-pointer"
                style={{
                  left: `${school.x / 5}%`,
                  bottom: `${school.y / 5}%`,
                }}
                onMouseEnter={() => setHoveredPoint(school)}
                onMouseLeave={() => setHoveredPoint(null)}
                onClick={() => {
                  setFilterType(filterType === school.id ? 'all' : school.id);
                }}
              >
                {/* School Icon Pin */}
                <div
                  className={`p-1.5 rounded-xl border-2 flex items-center justify-center bg-slate-950 transition-all duration-200 ${
                    isHovered ? 'scale-125 ring-4 ring-white/10' : 'group-hover:scale-110'
                  }`}
                  style={{
                    borderColor: school.color,
                    boxShadow: `0 0 10px ${school.color}60`,
                  }}
                >
                  <svg className="w-4 h-4" fill="none" stroke={school.color} viewBox="0 0 24 24" strokeWidth="2.5">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
                  </svg>
                </div>
                
                {/* School Name Label Badge */}
                <div
                  className="mt-1 px-1.5 py-0.5 rounded text-[8px] font-bold border transition-colors bg-slate-950/90"
                  style={{
                    color: school.color,
                    borderColor: `${school.color}40`,
                  }}
                >
                  {school.name.replace('School ', '')}
                </div>
                
                {/* Pulse circle */}
                <span
                  className="absolute top-2 w-7 h-7 rounded-full animate-ping opacity-15 pointer-events-none"
                  style={{ backgroundColor: school.color }}
                />
              </div>
            );
          })}

          {/* Student/Household Dots */}
          {filteredHouseholds.map((h) => {
            const isHovered = hoveredPoint && hoveredPoint.id === h.id;
            const inlineColor = getInlineBgColor(h);

            return (
              <div
                key={h.id}
                className="absolute -translate-x-1/2 translate-y-1/2 z-20 group cursor-crosshair"
                style={{
                  left: `${h.x / 5}%`,
                  bottom: `${h.y / 5}%`,
                }}
                onMouseEnter={() => setHoveredPoint(h)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <div
                  className={`w-2 h-2 rounded-full transition-all duration-100 ease-out border border-slate-950/70 ${
                    isHovered ? 'scale-175 z-40 ring-2 ring-white/50' : 'hover:scale-150'
                  }`}
                  style={{
                    backgroundColor: inlineColor,
                    boxShadow: `0 0 5px ${inlineColor}80`,
                  }}
                />
              </div>
            );
          })}
        </div>


      </div>

      {/* Map Legend (Bottom detailed description) */}
      <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3">
        {/* Row 1: Infrastructure Legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Schools:</span>
            {schools.map((school) => (
              <button
                key={school.id}
                onClick={() => setFilterType(filterType === school.id ? 'all' : school.id)}
                className={`flex items-center gap-1.5 py-0.5 px-2 rounded-md border transition-all cursor-pointer ${
                  filterType === school.id
                    ? 'bg-slate-800 text-white font-bold'
                    : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                }`}
                style={{ borderColor: filterType === school.id ? school.color : undefined }}
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke={school.color} viewBox="0 0 24 24" strokeWidth="2.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z" />
                </svg>
                <span>{school.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px]">Zones:</span>
            <div className="flex flex-wrap items-center gap-4">
              {schools.map((school) => (
                <div key={`legend-zone-${school.id}`} className="flex items-center gap-1.5">
                  <span
                    className="w-4 h-2.5 rounded border inline-block"
                    style={{
                      borderColor: school.color,
                      backgroundColor: `${school.color}15`,
                    }}
                  />
                  <span className="text-slate-400">Catchment {school.id.replace('school-', '').toUpperCase()}</span>
                </div>
              ))}
              {schools.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-2.5 rounded border border-slate-700 bg-slate-800/40 inline-block" />
                  <span className="text-slate-400 font-medium">Catchment Overlaps (Blended Fills)</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Row 2: Settlements Legend */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs border-t border-slate-850 pt-2">
          <span className="text-slate-500 font-semibold uppercase tracking-wider text-[10px] self-center">Settlements:</span>
          {centers.map((center) => {
            const isFilterActive = selectedSettlementFilter === center.id;
            return (
              <button
                key={center.id}
                onClick={() => {
                  setFilterType('village');
                  setSelectedSettlementFilter(isFilterActive ? null : center.id);
                }}
                className={`flex items-center gap-1.5 py-0.5 px-2 rounded-md border transition-all cursor-pointer ${
                  isFilterActive
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-950 border-slate-900 text-slate-400 hover:text-slate-200'
                }`}
                style={{ borderColor: isFilterActive ? center.color : undefined }}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: center.color }} />
                <span>{center.name}</span>
                <span className="text-slate-500 font-mono">
                  ({households.filter((h) => h.type === 'village' && h.settlementId === center.id).length})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Collapsible Debug Panel */}
      <div className="mt-4 pt-2 border-t border-slate-850">
        <details className="group">
          <summary className="text-[10px] text-indigo-400 font-bold uppercase tracking-wide cursor-pointer select-none hover:text-indigo-300">
            📊 Polygon Debug Coordinates
          </summary>
          <div className="mt-2 space-y-1 font-mono text-[9px] text-slate-400 bg-slate-950 p-2 rounded border border-slate-900 overflow-x-auto max-h-[150px]">
            {schools.map((school) => (
              <div key={`debug-${school.id}`}>
                <span className="font-bold" style={{ color: school.color }}>{school.name}:</span>{' '}
                {JSON.stringify(school.polygons || [school.polygon])}
              </div>
            ))}
          </div>
        </details>
      </div>
    </div>
  );
};
