import React, { useState, useMemo } from 'react';
import type { Household, SettlementCenter, School } from '../types';

interface GridCanvasProps {
  households: Household[];
  centers: SettlementCenter[];
  schools: School[];
  clusterRadius: number;
}

export const GridCanvas: React.FC<GridCanvasProps> = ({
  households,
  centers,
  schools,
  clusterRadius,
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<Household | SettlementCenter | School | null>(null);
  const [filterType, setFilterType] = useState<string>('all');
  const [selectedSettlementFilter, setSelectedSettlementFilter] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{ row: number; col: number; eligibleSchools: string[]; status: string } | null>(null);

  const parishes = useMemo(() => {
    const cells: { row: number; col: number; eligibleSchools: string[]; status: 'exclusive' | 'dual' | 'multi' }[] = [];
    const sortedSchools = [...schools].sort((a, b) => a.x - b.x);
    if (sortedSchools.length === 0) return [];

    const xMid12 = sortedSchools[0] && sortedSchools[1] ? (sortedSchools[0].x + sortedSchools[1].x) / 2 : 50;
    const xMid23 = sortedSchools[1] && sortedSchools[2] ? (sortedSchools[1].x + sortedSchools[2].x) / 2 : 75;

    for (let r = 0; r < 10; r++) {
      for (let c = 0; c < 10; c++) {
        const x = c * 10 + 5;
        const eligible: string[] = [];
        
        if (sortedSchools.length === 1) {
          eligible.push(sortedSchools[0].id);
        } else if (sortedSchools.length === 2) {
          if (x < xMid12 + 10) {
            eligible.push(sortedSchools[0].id);
          }
          if (x >= xMid12 - 10) {
            eligible.push(sortedSchools[1].id);
          }
        } else if (sortedSchools.length === 3) {
          if (x < xMid12 + 10) {
            eligible.push(sortedSchools[0].id);
          }
          if (x >= xMid12 - 10 && x < xMid23 + 10) {
            eligible.push(sortedSchools[1].id);
          }
          if (x >= xMid23 - 10) {
            eligible.push(sortedSchools[2].id);
          }
        }

        let status: 'exclusive' | 'dual' | 'multi' = 'exclusive';
        if (eligible.length === 2) status = 'dual';
        if (eligible.length > 2) status = 'multi';

        cells.push({ row: r, col: c, eligibleSchools: eligible, status });
      }
    }
    return cells;
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
            100x100 geographic space. Irregular shapes represent school catchment polygons.
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

      {/* Grid Canvas Wrapper */}
      <div className="flex-1 w-full flex items-center justify-center p-6 md:p-8 select-none">
        
        {/* Aspect Ratio Box (Square 1:1) */}
        <div className="w-full h-full max-w-[85vw] max-h-[82vh] aspect-square bg-slate-950 border border-slate-800 relative flex items-center justify-center m-auto shadow-2xl">
          
          {/* Grid Lines */}
          {ticks.map((tick) => (
            <React.Fragment key={tick}>
              <div
                className="absolute top-0 bottom-0 border-l border-slate-900/60 pointer-events-none"
                style={{ left: `${tick}%` }}
              />
              <div
                className="absolute left-0 right-0 border-t border-slate-900/60 pointer-events-none"
                style={{ bottom: `${tick}%` }}
              />
            </React.Fragment>
          ))}

          {/* Coordinate Labels along Axes */}
          {ticks.map((tick) => (
            <React.Fragment key={`label-${tick}`}>
              {tick % 20 === 0 && (
                <span
                  className="absolute -bottom-6 text-[10px] font-mono text-slate-500 -translate-x-1/2"
                  style={{ left: `${tick}%` }}
                >
                  {tick}
                </span>
              )}
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

          {/* SVG Overlay Layer: Polygons and Assignment Vectors */}
          {/* Note: In SVG, (0,0) is top-left, so we convert y coordinate: svg_y = 100 - y */}
          <svg
            className="absolute inset-0 w-full h-full z-10"
            viewBox="0 0 100 100"
            preserveAspectRatio="xMidYMid meet"
          >
            <defs>
              <clipPath id="grid-clip">
                <rect width="100" height="100" x="0" y="0" />
              </clipPath>
              <pattern id="hatch-a-b" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill="#3b82f60a" />
                <line x1="0" y1="0" x2="0" y2="10" stroke="#3b82f6" strokeWidth="1.5" opacity="0.3" />
                <line x1="5" y1="0" x2="5" y2="10" stroke="#ef4444" strokeWidth="1.5" opacity="0.3" />
              </pattern>
              <pattern id="hatch-b-c" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill="#ef44440a" />
                <line x1="0" y1="0" x2="0" y2="10" stroke="#ef4444" strokeWidth="1.5" opacity="0.3" />
                <line x1="5" y1="0" x2="5" y2="10" stroke="#84cc16" strokeWidth="1.5" opacity="0.3" />
              </pattern>
              <pattern id="hatch-a-c" width="10" height="10" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                <rect width="10" height="10" fill="#3b82f60a" />
                <line x1="0" y1="0" x2="0" y2="10" stroke="#3b82f6" strokeWidth="1.5" opacity="0.3" />
                <line x1="5" y1="0" x2="5" y2="10" stroke="#84cc16" strokeWidth="1.5" opacity="0.3" />
              </pattern>
            </defs>

            <g clipPath="url(#grid-clip)">
              {/* Background grid rects (Parishes) */}
              {parishes.map((cell) => {
                const x = cell.col * 10;
                const y = (9 - cell.row) * 10; // row 0 is top Y=90, row 9 is bottom Y=0
                
                let fill = 'transparent';
                if (cell.status === 'exclusive') {
                  const sid = cell.eligibleSchools[0];
                  if (sid === 'school-a') fill = '#3b82f61a';
                  else if (sid === 'school-b') fill = '#ef44441a';
                  else if (sid === 'school-c') fill = '#84cc161a';
                } else if (cell.status === 'dual') {
                  const sids = cell.eligibleSchools;
                  if (sids.includes('school-a') && sids.includes('school-b')) {
                    fill = 'url(#hatch-a-b)';
                  } else if (sids.includes('school-b') && sids.includes('school-c')) {
                    fill = 'url(#hatch-b-c)';
                  } else {
                    fill = 'url(#hatch-a-c)';
                  }
                } else if (cell.status === 'multi') {
                  // Multi-school overlap (>2 schools): solid deep purple hue
                  fill = '#6b21a826';
                }

                return (
                  <rect
                    key={`parish-${cell.row}-${cell.col}`}
                    x={x}
                    y={y}
                    width="10"
                    height="10"
                    fill={fill}
                    stroke="#ffffff08"
                    strokeWidth="0.5"
                    className="transition-all duration-200"
                    style={{ pointerEvents: 'auto' }}
                    onMouseEnter={() => setHoveredCell(cell)}
                    onMouseLeave={() => setHoveredCell(null)}
                  />
                );
              })}
            </g>
          </svg>

          {/* Settlement Cluster Radius Rings (Faint overlays, scaled by final village headcount) */}
          {centers.map((center) => {
            const headcount = households.filter((h) => h.settlementId === center.id).length;
            const localRadius = clusterRadius * Math.sqrt(headcount / 15);
            return (
              <div
                key={`ring-${center.id}`}
                className="absolute border border-dashed rounded-full pointer-events-none transition-all duration-300 ease-out"
                style={{
                  width: `${localRadius * 2}%`,
                  height: `${localRadius * 2}%`,
                  left: `${center.x - localRadius}%`,
                  bottom: `${center.y - localRadius}%`,
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
                  left: `${school.x}%`,
                  bottom: `${school.y}%`,
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
                  left: `${h.x}%`,
                  bottom: `${h.y}%`,
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

        {/* Floating Tooltip / Details Box (Top Left corner of Grid Panel) */}
        <div className="absolute top-3 left-3 bg-slate-900/90 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-300 backdrop-blur-md shadow-lg pointer-events-none min-w-[150px] z-40">
          <div className="text-[10px] text-indigo-400 font-semibold tracking-wide uppercase">
            Map Inspector
          </div>
          {hoveredPoint ? (
            <div className="mt-1 space-y-1">
              <div className="font-bold text-slate-100">
                {'polygon' in hoveredPoint
                  ? hoveredPoint.name
                  : 'name' in hoveredPoint
                  ? hoveredPoint.name
                  : hoveredPoint.id}
              </div>
              
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
                <span className="capitalize text-[10px]">
                  {'polygon' in hoveredPoint
                    ? 'School Landmark'
                    : 'color' in hoveredPoint
                    ? 'Settlement Center'
                    : `${hoveredPoint.type} household`}
                </span>
              </div>

              {/* Assignment details for students */}
              {'assignedSchoolId' in hoveredPoint && hoveredPoint.assignedSchoolId && (() => {
                const s = schools.find((sch) => sch.id === hoveredPoint.assignedSchoolId);
                return (
                  <div className="text-[10px] text-slate-400">
                    Assigned to:{' '}
                    <span
                      className="font-bold"
                      style={{ color: s ? s.color : '#94a3b8' }}
                    >
                      {s ? s.name : hoveredPoint.assignedSchoolId}
                    </span>
                  </div>
                );
              })()}

              <div className="font-mono text-indigo-300 text-[10px] mt-0.5">
                X: {hoveredPoint.x.toFixed(1)} | Y: {hoveredPoint.y.toFixed(1)}
              </div>
            </div>
          ) : hoveredCell ? (
            <div className="mt-1 space-y-0.5">
              <div className="font-bold text-slate-100 text-[11px]">
                Parish Grid [Row {10 - hoveredCell.row}, Col {hoveredCell.col + 1}]
              </div>
              <div className="text-[10px] text-slate-400">
                Status:{' '}
                <span className="font-bold text-indigo-300">
                  {hoveredCell.status === 'exclusive' ? 'Exclusive Zone' : 'Shared Catchment'}
                </span>
              </div>
              <div className="text-[10px] text-slate-400">
                Eligible:{' '}
                <span className="font-bold text-slate-250">
                  {hoveredCell.eligibleSchools
                    .map((sid) => schools.find((s) => s.id === sid)?.name || sid)
                    .join(', ')}
                </span>
              </div>
            </div>
          ) : (
            <div className="mt-1 text-slate-500 italic text-[10px]">
              Hover over cells, pins, or dots to inspect...
            </div>
          )}
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
                    className="w-4 h-2.5 rounded border border-dashed inline-block"
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
                  <span className="w-4 h-2.5 rounded border border-dashed border-purple-500 bg-purple-500/10 inline-block" />
                  <span className="text-slate-350 font-medium">Overlap Corridor(s)</span>
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
    </div>
  );
};
