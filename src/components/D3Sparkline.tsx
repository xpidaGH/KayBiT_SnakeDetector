import React, { useMemo, useState } from "react";
import * as d3 from "d3";

export interface SparklinePoint {
  timestamp: number;
  value: number;
  timeLabel?: string;
}

interface D3SparklineProps {
  data: SparklinePoint[];
  width?: number;
  height?: number;
  color?: string;
  fillColor?: string;
  unit?: string;
  title: string;
  minDomain?: number;
  maxDomain?: number;
  threshold?: number;
  thresholdLabel?: string;
  dangerAbove?: boolean;
  valueFormatter?: (val: number) => string;
}

export const D3Sparkline: React.FC<D3SparklineProps> = ({
  data,
  width = 320,
  height = 100,
  color = "#f59e0b",
  fillColor,
  unit = "",
  title,
  minDomain,
  maxDomain,
  threshold,
  thresholdLabel,
  dangerAbove = true,
  valueFormatter
}) => {
  const [hoveredPoint, setHoveredPoint] = useState<SparklinePoint | null>(null);

  const margin = { top: 12, right: 14, bottom: 20, left: 34 };
  const innerWidth = Math.max(10, width - margin.left - margin.right);
  const innerHeight = Math.max(10, height - margin.top - margin.bottom);

  // Compute Scales and D3 Path
  const { pathD, areaD, xScale, yScale, latestVal, minVal, maxVal, avgVal, thresholdY } = useMemo(() => {
    if (!data || data.length === 0) {
      return {
        pathD: "",
        areaD: "",
        xScale: null,
        yScale: null,
        latestVal: 0,
        minVal: 0,
        maxVal: 0,
        avgVal: 0,
        thresholdY: null
      };
    }

    const values = data.map(d => d.value);
    const minVal = Math.min(...values);
    const maxVal = Math.max(...values);
    const avgVal = parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(1));
    const latestVal = values[values.length - 1];

    const yMin = minDomain !== undefined ? minDomain : Math.max(0, minVal - (maxVal - minVal) * 0.15);
    const yMax = maxDomain !== undefined ? maxDomain : maxVal + (maxVal - minVal) * 0.15 || yMin + 10;

    const xScale = d3.scaleLinear()
      .domain([0, data.length - 1])
      .range([0, innerWidth]);

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0]);

    // D3 Line Generator with Monotone Curve for smooth continuous sensor signals
    const lineGenerator = d3.line<SparklinePoint>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    // D3 Area Generator for subtle glow fill
    const areaGenerator = d3.area<SparklinePoint>()
      .x((_, i) => xScale(i))
      .y0(innerHeight)
      .y1(d => yScale(d.value))
      .curve(d3.curveMonotoneX);

    const pathD = lineGenerator(data) || "";
    const areaD = areaGenerator(data) || "";

    const thresholdY = threshold !== undefined ? yScale(threshold) : null;

    return {
      pathD,
      areaD,
      xScale,
      yScale,
      latestVal,
      minVal,
      maxVal,
      avgVal,
      thresholdY
    };
  }, [data, innerWidth, innerHeight, minDomain, maxDomain, threshold]);

  const uniqueId = useMemo(() => `sparkline-grad-${Math.random().toString(36).substr(2, 9)}`, []);

  const formatValue = (v: number) => {
    if (valueFormatter) return valueFormatter(v);
    return `${v}${unit}`;
  };

  const isThresholdBreached = threshold !== undefined && 
    (dangerAbove ? latestVal >= threshold : latestVal <= threshold);

  return (
    <div className="bg-slate-950/70 rounded-xl border border-slate-800/90 p-3.5 space-y-2 relative overflow-hidden group hover:border-slate-700 transition-colors">
      {/* Header Info */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
          <span className="text-xs font-mono font-semibold text-slate-300">{title}</span>
        </div>
        <div className="flex items-baseline space-x-1 font-mono">
          <span className={`text-base font-bold ${isThresholdBreached ? "text-red-400 animate-pulse" : "text-slate-100"}`}>
            {formatValue(hoveredPoint ? hoveredPoint.value : latestVal)}
          </span>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto overflow-visible select-none"
        >
          <defs>
            <linearGradient id={uniqueId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={fillColor || color} stopOpacity="0.35" />
              <stop offset="90%" stopColor={fillColor || color} stopOpacity="0.0" />
            </linearGradient>
          </defs>

          <g transform={`translate(${margin.left},${margin.top})`}>
            {/* Horizontal Grid lines */}
            <line x1="0" y1="0" x2={innerWidth} y2="0" stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
            <line x1="0" y1={innerHeight / 2} x2={innerWidth} y2={innerHeight / 2} stroke="#334155" strokeDasharray="3 3" strokeOpacity="0.4" />
            <line x1="0" y1={innerHeight} x2={innerWidth} y2={innerHeight} stroke="#334155" strokeOpacity="0.6" />

            {/* Threshold Line if defined */}
            {thresholdY !== null && thresholdY >= 0 && thresholdY <= innerHeight && (
              <g>
                <line
                  x1="0"
                  y1={thresholdY}
                  x2={innerWidth}
                  y2={thresholdY}
                  stroke="#ef4444"
                  strokeDasharray="4 4"
                  strokeWidth="1.2"
                />
                <text
                  x={innerWidth - 2}
                  y={thresholdY - 3}
                  textAnchor="end"
                  fill="#ef4444"
                  fontSize="9"
                  fontFamily="monospace"
                >
                  {thresholdLabel || `Limit: ${threshold}${unit}`}
                </text>
              </g>
            )}

            {/* Gradient Area Fill */}
            {areaD && (
              <path
                d={areaD}
                fill={`url(#${uniqueId})`}
              />
            )}

            {/* Line Path */}
            {pathD && (
              <path
                d={pathD}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            )}

            {/* Latest Point Indicator */}
            {data && data.length > 0 && xScale && yScale && (
              <circle
                cx={xScale(data.length - 1)}
                cy={yScale(latestVal)}
                r="3.5"
                fill={color}
                stroke="#0f172a"
                strokeWidth="1.5"
                className="animate-pulse"
              />
            )}

            {/* Hover Indicator */}
            {hoveredPoint && xScale && yScale && (
              <g>
                <line
                  x1={xScale(data.indexOf(hoveredPoint))}
                  y1="0"
                  x2={xScale(data.indexOf(hoveredPoint))}
                  y2={innerHeight}
                  stroke="#94a3b8"
                  strokeDasharray="2 2"
                  strokeWidth="1"
                />
                <circle
                  cx={xScale(data.indexOf(hoveredPoint))}
                  cy={yScale(hoveredPoint.value)}
                  r="4.5"
                  fill="#ffffff"
                  stroke={color}
                  strokeWidth="2"
                />
              </g>
            )}

            {/* Invisible overlay rect for mouse tracking */}
            {xScale && (
              <rect
                x="0"
                y="0"
                width={innerWidth}
                height={innerHeight}
                fill="transparent"
                onMouseMove={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const mouseX = e.clientX - rect.left;
                  const index = Math.min(
                    data.length - 1,
                    Math.max(0, Math.round((mouseX / innerWidth) * (data.length - 1)))
                  );
                  setHoveredPoint(data[index] || null);
                }}
                onMouseLeave={() => setHoveredPoint(null)}
              />
            )}

            {/* Y Axis Min/Max labels */}
            {yScale && (
              <>
                <text x="-4" y="8" textAnchor="end" fill="#64748b" fontSize="8.5" fontFamily="monospace">
                  {yScale.domain()[1].toFixed(0)}
                </text>
                <text x="-4" y={innerHeight} textAnchor="end" fill="#64748b" fontSize="8.5" fontFamily="monospace">
                  {yScale.domain()[0].toFixed(0)}
                </text>
              </>
            )}
          </g>
        </svg>
      </div>

      {/* Footer Metrics (Min / Avg / Max) */}
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-900">
        <div>Min: <span className="text-slate-200">{formatValue(minVal)}</span></div>
        <div>Avg: <span className="text-slate-200">{formatValue(avgVal)}</span></div>
        <div>Peak: <span className="text-slate-200">{formatValue(maxVal)}</span></div>
        {hoveredPoint?.timeLabel && (
          <div className="text-amber-400 font-semibold">{hoveredPoint.timeLabel}</div>
        )}
      </div>
    </div>
  );
};
