import React, { useState, useMemo, useRef, useEffect } from "react";
import * as d3 from "d3";
import { Battery24hPoint, BatteryDegradationSummary } from "../types";
import { 
  generate24hBatteryHistory, 
  computeBatteryDegradationSummary 
} from "../data";
import { 
  Battery, 
  BatteryCharging, 
  BatteryWarning, 
  Sun, 
  Moon, 
  Zap, 
  ShieldCheck, 
  ShieldAlert, 
  Download, 
  Sliders, 
  Info, 
  TrendingDown, 
  RotateCcw,
  Sparkles,
  Layers,
  Activity,
  Flame
} from "lucide-react";

interface Battery24hDegradationChartProps {
  currentVoltage?: number;
  thresholdVoltage?: number;
  initialChemistry?: "12v_lifepo4" | "12v_lead_acid" | "3s_li_ion" | "5v_direct";
  onThresholdChange?: (newThreshold: number) => void;
}

export const Battery24hDegradationChart: React.FC<Battery24hDegradationChartProps> = ({
  currentVoltage = 12.6,
  thresholdVoltage = 11.8,
  initialChemistry = "12v_lifepo4",
  onThresholdChange
}) => {
  const [scenario, setScenario] = useState<"solar_nominal" | "cloudy_rain" | "heavy_inference" | "solar_surplus">("solar_nominal");
  const [chemistry, setChemistry] = useState<"12v_lifepo4" | "12v_lead_acid" | "3s_li_ion" | "5v_direct">(initialChemistry);
  const [cutoffThreshold, setCutoffThreshold] = useState<number>(thresholdVoltage);
  const [showUnprotectedComparison, setShowUnprotectedComparison] = useState<boolean>(true);
  const [showAgedPackComparison, setShowAgedPackComparison] = useState<boolean>(false);
  const [showSolarOverlay, setShowSolarOverlay] = useState<boolean>(true);
  const [showSocOverlay, setShowSocOverlay] = useState<boolean>(false);
  const [hoveredPoint, setHoveredPoint] = useState<Battery24hPoint | null>(null);
  const [hoverPosition, setHoverPosition] = useState<{ x: number; y: number } | null>(null);

  // Sync cutoff threshold if prop changes
  useEffect(() => {
    if (thresholdVoltage !== undefined) {
      setCutoffThreshold(thresholdVoltage);
    }
  }, [thresholdVoltage]);

  // Generate 24-hour historical dataset
  const historyData = useMemo(() => {
    return generate24hBatteryHistory({
      scenario,
      chemistry,
      cutoffThreshold,
      enableLoadShedding: true
    });
  }, [scenario, chemistry, cutoffThreshold]);

  // Compute 24-hour degradation statistical summary
  const summary: BatteryDegradationSummary = useMemo(() => {
    return computeBatteryDegradationSummary(historyData, cutoffThreshold);
  }, [historyData, cutoffThreshold]);

  // Chemistry specific configurations
  const chemConfig = useMemo(() => {
    switch (chemistry) {
      case "12v_lead_acid":
        return { name: "12V Lead-Acid / AGM", yMin: 10.5, yMax: 14.6, defaultThreshold: 11.6, unit: "V" };
      case "3s_li_ion":
        return { name: "3S Li-Ion (11.1V)", yMin: 9.0, yMax: 13.0, defaultThreshold: 10.5, unit: "V" };
      case "5v_direct":
        return { name: "5V Step-Down Rail", yMin: 4.2, yMax: 5.4, defaultThreshold: 4.8, unit: "V" };
      case "12v_lifepo4":
      default:
        return { name: "12V LiFePO4 (Lithium Iron)", yMin: 10.2, yMax: 14.0, defaultThreshold: 11.8, unit: "V" };
    }
  }, [chemistry]);

  const handleChemistryChange = (newChem: "12v_lifepo4" | "12v_lead_acid" | "3s_li_ion" | "5v_direct") => {
    setChemistry(newChem);
    let defaultThresh = 11.8;
    if (newChem === "12v_lead_acid") defaultThresh = 11.6;
    if (newChem === "3s_li_ion") defaultThresh = 10.5;
    if (newChem === "5v_direct") defaultThresh = 4.8;
    setCutoffThreshold(defaultThresh);
    onThresholdChange?.(defaultThresh);
  };

  const handleThresholdSlider = (val: number) => {
    setCutoffThreshold(val);
    onThresholdChange?.(val);
  };

  // CSV Export
  const handleExportTelemetry = () => {
    const headers = "timestamp,timeLabel,hourOffset,voltageV,unprotectedVoltageV,agedPackVoltageV,socPercent,solarWatts,loadWatts,netCurrentA,phase,isLoadShedding,cellTemperatureC\n";
    const rows = historyData.map(p => 
      `${p.timestamp},"${p.timeLabel}",${p.hourOffset},${p.voltageV},${p.unprotectedVoltageV || ""},${p.agedPackVoltageV || ""},${p.socPercent},${p.solarWatts},${p.loadWatts},${p.netCurrentA},"${p.phase}",${p.isLoadShedding},${p.cellTemperatureC}`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kaybit_battery_24h_${chemistry}_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // D3 Chart Dimensions
  const svgWidth = 840;
  const svgHeight = 280;
  const margin = { top: 20, right: 55, bottom: 35, left: 45 };
  const innerWidth = svgWidth - margin.left - margin.right;
  const innerHeight = svgHeight - margin.top - margin.bottom;

  // D3 Scales & Paths
  const {
    xScale,
    yScale,
    ySolarScale,
    primaryLinePath,
    primaryAreaPath,
    unprotectedLinePath,
    agedPackLinePath,
    solarAreaPath,
    socLinePath,
    thresholdY,
    nightZones
  } = useMemo(() => {
    if (!historyData || historyData.length === 0) {
      return {
        xScale: null,
        yScale: null,
        ySolarScale: null,
        primaryLinePath: "",
        primaryAreaPath: "",
        unprotectedLinePath: "",
        agedPackLinePath: "",
        solarAreaPath: "",
        socLinePath: "",
        thresholdY: null,
        nightZones: []
      };
    }

    const xScale = d3.scaleLinear()
      .domain([0, historyData.length - 1])
      .range([0, innerWidth]);

    const yMin = chemConfig.yMin;
    const yMax = chemConfig.yMax;

    const yScale = d3.scaleLinear()
      .domain([yMin, yMax])
      .range([innerHeight, 0]);

    // Secondary scale for solar watts (0W to 130W)
    const ySolarScale = d3.scaleLinear()
      .domain([0, 130])
      .range([innerHeight, 0]);

    // Secondary scale for SoC (0 to 100%)
    const ySocScale = d3.scaleLinear()
      .domain([0, 100])
      .range([innerHeight, 0]);

    // Primary Protected Voltage Line & Area
    const primaryLine = d3.line<Battery24hPoint>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d.voltageV))
      .curve(d3.curveMonotoneX);

    const primaryArea = d3.area<Battery24hPoint>()
      .x((_, i) => xScale(i))
      .y0(innerHeight)
      .y1(d => yScale(d.voltageV))
      .curve(d3.curveMonotoneX);

    // Unprotected Voltage Path
    const unprotectedLine = d3.line<Battery24hPoint>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d.unprotectedVoltageV ?? d.voltageV))
      .curve(d3.curveMonotoneX);

    // Aged Pack Path
    const agedPackLine = d3.line<Battery24hPoint>()
      .x((_, i) => xScale(i))
      .y(d => yScale(d.agedPackVoltageV ?? d.voltageV))
      .curve(d3.curveMonotoneX);

    // Solar Watts Area
    const solarArea = d3.area<Battery24hPoint>()
      .x((_, i) => xScale(i))
      .y0(innerHeight)
      .y1(d => ySolarScale(d.solarWatts))
      .curve(d3.curveMonotoneX);

    // SoC % Line
    const socLine = d3.line<Battery24hPoint>()
      .x((_, i) => xScale(i))
      .y(d => ySocScale(d.socPercent))
      .curve(d3.curveMonotoneX);

    const thresholdY = yScale(cutoffThreshold);

    // Identify night & daytime background intervals
    const nightZones: { startX: number; endX: number; label: string; isDay: boolean }[] = [];
    let currentZoneStart = 0;
    let currentIsDay = !historyData[0].isNight;

    for (let i = 1; i < historyData.length; i++) {
      const isDay = !historyData[i].isNight;
      if (isDay !== currentIsDay || i === historyData.length - 1) {
        nightZones.push({
          startX: xScale(currentZoneStart),
          endX: xScale(i),
          label: currentIsDay ? "Solar Window" : "Night Discharge",
          isDay: currentIsDay
        });
        currentZoneStart = i;
        currentIsDay = isDay;
      }
    }

    return {
      xScale,
      yScale,
      ySolarScale,
      primaryLinePath: primaryLine(historyData) || "",
      primaryAreaPath: primaryArea(historyData) || "",
      unprotectedLinePath: unprotectedLine(historyData) || "",
      agedPackLinePath: agedPackLine(historyData) || "",
      solarAreaPath: solarArea(historyData) || "",
      socLinePath: socLine(historyData) || "",
      thresholdY,
      nightZones
    };
  }, [historyData, innerWidth, innerHeight, chemConfig, cutoffThreshold]);

  // Generate X-Axis Tick Markers
  const xTicks = useMemo(() => {
    if (!historyData || historyData.length === 0 || !xScale) return [];
    // Select 7 nicely spaced ticks across 96 samples
    const step = Math.floor(historyData.length / 6);
    const ticks = [];
    for (let i = 0; i < historyData.length; i += step) {
      ticks.push({
        index: i,
        x: xScale(i),
        timeLabel: historyData[i].timeLabel,
        hourOffset: historyData[i].hourOffset === 0 ? "Now" : `${historyData[i].hourOffset}h`
      });
    }
    // Ensure the last point is present
    if (ticks[ticks.length - 1].index !== historyData.length - 1) {
      ticks.push({
        index: historyData.length - 1,
        x: xScale(historyData.length - 1),
        timeLabel: historyData[historyData.length - 1].timeLabel,
        hourOffset: "Now"
      });
    }
    return ticks;
  }, [historyData, xScale]);

  // Generate Y-Axis Tick Values
  const yTicks = useMemo(() => {
    if (!yScale) return [];
    return yScale.ticks(6);
  }, [yScale]);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-5 backdrop-blur-md">
      {/* Header & Scenario Controls */}
      <div className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="space-y-1">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <BatteryCharging className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-100">
                  24-Hour Battery Voltage Degradation & Solar Discharge Visualizer
                </h3>
                <span className="px-2 py-0.5 text-xs font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-full flex items-center space-x-1">
                  <Activity className="w-3 h-3" />
                  <span>D3 Time-Series Engine</span>
                </span>
                {summary.loadSheddingHours > 0 && (
                  <span className="px-2 py-0.5 text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-full">
                    +{summary.additionalRuntimeHours}h Life Shielded
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Tracks diurnal solar replenishment, continuous multi-camera IR drain, and low-voltage load-shedding events over a rolling 24-hour cycle.
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full xl:w-auto">
          {/* Scenario Selector */}
          <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setScenario("solar_nominal")}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer ${
                scenario === "solar_nominal"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Standard sunny diurnal solar charge & night discharge"
            >
              <Sun className="w-3 h-3" />
              <span>Nominal Solar</span>
            </button>
            <button
              onClick={() => setScenario("cloudy_rain")}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer ${
                scenario === "cloudy_rain"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Low solar generation (overcast rain storm) with steep discharge"
            >
              <TrendingDown className="w-3 h-3" />
              <span>Overcast Storm</span>
            </button>
            <button
              onClick={() => setScenario("heavy_inference")}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer ${
                scenario === "heavy_inference"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Heavy AI snake detection bursts + continuous IR illumination"
            >
              <Flame className="w-3 h-3 text-red-400" />
              <span>High AI Drain</span>
            </button>
            <button
              onClick={() => setScenario("solar_surplus")}
              className={`px-2.5 py-1 rounded-lg transition-colors flex items-center space-x-1 cursor-pointer ${
                scenario === "solar_surplus"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white"
              }`}
              title="Full solar irradiance surplus"
            >
              <Sparkles className="w-3 h-3" />
              <span>Surplus</span>
            </button>
          </div>

          {/* Export Dataset Button */}
          <button
            onClick={handleExportTelemetry}
            className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
            title="Download full 96-sample 24h battery telemetry as CSV"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        </div>
      </div>

      {/* Layer Toggles & Chemistry Selector Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        {/* Battery Chemistry Selector */}
        <div className="flex items-center space-x-2">
          <span className="text-slate-400">Chemistry:</span>
          <select
            value={chemistry}
            onChange={(e) => handleChemistryChange(e.target.value as any)}
            className="bg-slate-950 border border-slate-700 text-slate-200 rounded-lg px-2.5 py-1 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none cursor-pointer"
          >
            <option value="12v_lifepo4">12V LiFePO4 (11.8V Cutoff)</option>
            <option value="12v_lead_acid">12V Lead-Acid / AGM (11.6V Cutoff)</option>
            <option value="3s_li_ion">3S Li-Ion Pack (10.5V Cutoff)</option>
            <option value="5v_direct">5V DC Step-Down Rail (4.8V Cutoff)</option>
          </select>
        </div>

        {/* Visual Layer Toggles */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            onClick={() => setShowUnprotectedComparison(!showUnprotectedComparison)}
            className={`px-2.5 py-1 rounded-lg border text-xs flex items-center space-x-1 transition-all cursor-pointer ${
              showUnprotectedComparison
                ? "bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300"
            }`}
            title="Show voltage collapse trajectory if load shedding were disabled"
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Unprotected Baseline</span>
          </button>

          <button
            onClick={() => setShowAgedPackComparison(!showAgedPackComparison)}
            className={`px-2.5 py-1 rounded-lg border text-xs flex items-center space-x-1 transition-all cursor-pointer ${
              showAgedPackComparison
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300"
            }`}
            title="Show internal resistance sag curve of an aged battery pack (70% SOH)"
          >
            <span className="w-2 h-2 rounded-full bg-amber-400" />
            <span>Aged Cell Sag</span>
          </button>

          <button
            onClick={() => setShowSolarOverlay(!showSolarOverlay)}
            className={`px-2.5 py-1 rounded-lg border text-xs flex items-center space-x-1 transition-all cursor-pointer ${
              showSolarOverlay
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/40 font-bold"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300"
            }`}
            title="Overlay solar panel generation power (Watts)"
          >
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span>Solar Input (W)</span>
          </button>

          <button
            onClick={() => setShowSocOverlay(!showSocOverlay)}
            className={`px-2.5 py-1 rounded-lg border text-xs flex items-center space-x-1 transition-all cursor-pointer ${
              showSocOverlay
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-300"
            }`}
            title="Overlay battery State of Charge percentage (% SoC)"
          >
            <span className="w-2 h-2 rounded-full bg-purple-400" />
            <span>SoC %</span>
          </button>
        </div>
      </div>

      {/* Main D3 SVG Chart Container */}
      <div className="bg-slate-950 rounded-xl border border-slate-800 p-3.5 relative overflow-hidden">
        {/* Legend Ribbon inside chart */}
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2 px-1 text-[11px] font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center space-x-1.5">
              <span className="w-3 h-1 bg-emerald-400 rounded-full" />
              <span className="text-slate-200 font-semibold">Active Voltage (Load-Shed Protected)</span>
            </div>
            {showUnprotectedComparison && (
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-rose-400 border-b border-dashed border-rose-400" />
                <span className="text-rose-400">Unprotected (Deep Discharge)</span>
              </div>
            )}
            {showAgedPackComparison && (
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-amber-400 border-b border-dotted border-amber-400" />
                <span className="text-amber-400">Aged Pack Sag (85mΩ)</span>
              </div>
            )}
            {showSolarOverlay && (
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 bg-cyan-500/30 border border-cyan-400 rounded-sm" />
                <span className="text-cyan-300">Solar PV (0-120W)</span>
              </div>
            )}
            {showSocOverlay && (
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-0.5 bg-purple-400" />
                <span className="text-purple-300">State of Charge (%)</span>
              </div>
            )}
          </div>

          <div className="flex items-center space-x-1.5 text-slate-400">
            <span className="w-2.5 h-0.5 bg-red-500 border-b border-dashed border-red-500" />
            <span className="text-red-400 font-bold">Cutoff Threshold: {cutoffThreshold.toFixed(1)}V</span>
          </div>
        </div>

        {/* SVG Graphic */}
        <div className="relative">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto overflow-visible select-none"
          >
            <defs>
              {/* Primary Voltage Area Gradient */}
              <linearGradient id="batteryGradPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#10b981" stopOpacity="0.30" />
                <stop offset="60%" stopColor="#059669" stopOpacity="0.10" />
                <stop offset="100%" stopColor="#047857" stopOpacity="0.0" />
              </linearGradient>

              {/* Solar Area Gradient */}
              <linearGradient id="solarGradOverlay" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
              </linearGradient>

              {/* Danger Zone Gradient (Below Threshold) */}
              <linearGradient id="dangerZoneGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ef4444" stopOpacity="0.18" />
                <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
              </linearGradient>
            </defs>

            <g transform={`translate(${margin.left},${margin.top})`}>
              {/* Background Day / Night Zone Bands */}
              {nightZones.map((zone, zIdx) => (
                <g key={zIdx}>
                  <rect
                    x={zone.startX}
                    y={0}
                    width={Math.max(0, zone.endX - zone.startX)}
                    height={innerHeight}
                    fill={zone.isDay ? "#1e293b" : "#0f172a"}
                    fillOpacity={zone.isDay ? 0.35 : 0.65}
                  />
                  <text
                    x={zone.startX + 6}
                    y={12}
                    fill={zone.isDay ? "#38bdf8" : "#64748b"}
                    fontSize="8.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    {zone.isDay ? "☀️ DAY SOLAR WINDOW" : "🌙 NIGHT DISCHARGE"}
                  </text>
                </g>
              ))}

              {/* Danger Zone Shading Below Cutoff Threshold */}
              {thresholdY !== null && thresholdY <= innerHeight && (
                <rect
                  x={0}
                  y={thresholdY}
                  width={innerWidth}
                  height={innerHeight - thresholdY}
                  fill="url(#dangerZoneGrad)"
                />
              )}

              {/* Horizontal Grid lines */}
              {yTicks.map((tickVal, tIdx) => {
                if (!yScale) return null;
                const yPos = yScale(tickVal);
                return (
                  <g key={tIdx}>
                    <line
                      x1={0}
                      y1={yPos}
                      x2={innerWidth}
                      y2={yPos}
                      stroke="#334155"
                      strokeDasharray="3 3"
                      strokeOpacity="0.3"
                    />
                    <text
                      x={-6}
                      y={yPos + 3}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="monospace"
                    >
                      {tickVal.toFixed(1)}V
                    </text>
                  </g>
                );
              })}

              {/* Solar Generation Area (Secondary Overlay) */}
              {showSolarOverlay && solarAreaPath && (
                <path
                  d={solarAreaPath}
                  fill="url(#solarGradOverlay)"
                  stroke="#06b6d4"
                  strokeWidth="1.2"
                  strokeDasharray="2 2"
                  strokeOpacity="0.7"
                />
              )}

              {/* State of Charge Line Overlay */}
              {showSocOverlay && socLinePath && (
                <path
                  d={socLinePath}
                  fill="none"
                  stroke="#c084fc"
                  strokeWidth="1.5"
                  strokeDasharray="4 2"
                />
              )}

              {/* Unprotected Baseline (Without Load Shedding) */}
              {showUnprotectedComparison && unprotectedLinePath && (
                <path
                  d={unprotectedLinePath}
                  fill="none"
                  stroke="#fb7185"
                  strokeWidth="1.6"
                  strokeDasharray="4 3"
                  strokeOpacity="0.85"
                />
              )}

              {/* Aged Pack Line (Higher Internal Impedance) */}
              {showAgedPackComparison && agedPackLinePath && (
                <path
                  d={agedPackLinePath}
                  fill="none"
                  stroke="#f59e0b"
                  strokeWidth="1.5"
                  strokeDasharray="2 2"
                  strokeOpacity="0.8"
                />
              )}

              {/* Primary Protected Voltage Area */}
              {primaryAreaPath && (
                <path
                  d={primaryAreaPath}
                  fill="url(#batteryGradPrimary)"
                />
              )}

              {/* Primary Protected Voltage Line */}
              {primaryLinePath && (
                <path
                  d={primaryLinePath}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Threshold Line */}
              {thresholdY !== null && (
                <g>
                  <line
                    x1={0}
                    y1={thresholdY}
                    x2={innerWidth}
                    y2={thresholdY}
                    stroke="#ef4444"
                    strokeDasharray="5 4"
                    strokeWidth="1.5"
                  />
                  <text
                    x={innerWidth - 4}
                    y={thresholdY - 4}
                    textAnchor="end"
                    fill="#ef4444"
                    fontSize="9.5"
                    fontFamily="monospace"
                    fontWeight="bold"
                  >
                    ⚠️ LOAD-SHED CUTOFF: {cutoffThreshold.toFixed(1)}V
                  </text>
                </g>
              )}

              {/* X Axis Line */}
              <line
                x1={0}
                y1={innerHeight}
                x2={innerWidth}
                y2={innerHeight}
                stroke="#475569"
                strokeWidth="1"
              />

              {/* X Axis Ticks & Time Labels */}
              {xTicks.map((tick, idx) => (
                <g key={idx} transform={`translate(${tick.x}, ${innerHeight})`}>
                  <line y1={0} y2={4} stroke="#64748b" />
                  <text
                    y={15}
                    textAnchor="middle"
                    fill="#94a3b8"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {tick.timeLabel}
                  </text>
                  <text
                    y={25}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="7.5"
                    fontFamily="monospace"
                  >
                    {tick.hourOffset}
                  </text>
                </g>
              ))}

              {/* Interactive Hover Crosshair */}
              {hoveredPoint && xScale && yScale && (
                <g>
                  <line
                    x1={xScale(historyData.indexOf(hoveredPoint))}
                    y1={0}
                    x2={xScale(historyData.indexOf(hoveredPoint))}
                    y2={innerHeight}
                    stroke="#cbd5e1"
                    strokeDasharray="3 3"
                    strokeWidth="1.2"
                  />
                  {/* Circle on Primary Voltage */}
                  <circle
                    cx={xScale(historyData.indexOf(hoveredPoint))}
                    cy={yScale(hoveredPoint.voltageV)}
                    r="4.5"
                    fill="#10b981"
                    stroke="#0f172a"
                    strokeWidth="2"
                  />
                  {/* Circle on Unprotected if visible */}
                  {showUnprotectedComparison && hoveredPoint.unprotectedVoltageV !== undefined && (
                    <circle
                      cx={xScale(historyData.indexOf(hoveredPoint))}
                      cy={yScale(hoveredPoint.unprotectedVoltageV)}
                      r="3.5"
                      fill="#fb7185"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                  )}
                  {/* Circle on Solar if visible */}
                  {showSolarOverlay && ySolarScale && (
                    <circle
                      cx={xScale(historyData.indexOf(hoveredPoint))}
                      cy={ySolarScale(hoveredPoint.solarWatts)}
                      r="3.5"
                      fill="#06b6d4"
                      stroke="#0f172a"
                      strokeWidth="1.5"
                    />
                  )}
                </g>
              )}

              {/* Interactive Tracking Overlay Rect */}
              {xScale && (
                <rect
                  x={0}
                  y={0}
                  width={innerWidth}
                  height={innerHeight}
                  fill="transparent"
                  className="cursor-crosshair"
                  onMouseMove={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const mouseX = e.clientX - rect.left;
                    const index = Math.min(
                      historyData.length - 1,
                      Math.max(0, Math.round((mouseX / innerWidth) * (historyData.length - 1)))
                    );
                    setHoveredPoint(historyData[index] || null);
                    setHoverPosition({ x: mouseX, y: e.clientY - rect.top });
                  }}
                  onMouseLeave={() => {
                    setHoveredPoint(null);
                    setHoverPosition(null);
                  }}
                />
              )}
            </g>
          </svg>

          {/* Floating Tooltip */}
          {hoveredPoint && hoverPosition && (
            <div 
              className="absolute pointer-events-none z-30 bg-slate-900/95 border border-slate-700 rounded-xl p-3 shadow-2xl text-xs font-mono backdrop-blur-md min-w-[210px]"
              style={{
                left: Math.min(innerWidth - 200, Math.max(20, hoverPosition.x + 20)),
                top: Math.max(10, hoverPosition.y - 80)
              }}
            >
              <div className="flex items-center justify-between border-b border-slate-800 pb-1.5 mb-1.5">
                <span className="font-bold text-slate-100">{hoveredPoint.timeLabel} ({hoveredPoint.hourOffset}h)</span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  hoveredPoint.isLoadShedding 
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                    : hoveredPoint.isNight 
                    ? "bg-slate-800 text-slate-300" 
                    : "bg-emerald-500/20 text-emerald-400"
                }`}>
                  {hoveredPoint.isLoadShedding ? "SHEDDING ACTIVE" : hoveredPoint.isNight ? "NIGHT DRAIN" : "SOLAR BULK"}
                </span>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between">
                  <span className="text-emerald-400">Terminal Voltage:</span>
                  <span className="font-bold text-emerald-300">{hoveredPoint.voltageV.toFixed(2)}V</span>
                </div>
                {showUnprotectedComparison && hoveredPoint.unprotectedVoltageV !== undefined && (
                  <div className="flex justify-between text-rose-300">
                    <span>Unprotected V:</span>
                    <span>{hoveredPoint.unprotectedVoltageV.toFixed(2)}V</span>
                  </div>
                )}
                {showAgedPackComparison && hoveredPoint.agedPackVoltageV !== undefined && (
                  <div className="flex justify-between text-amber-300">
                    <span>Aged Pack (Sag):</span>
                    <span>{hoveredPoint.agedPackVoltageV.toFixed(2)}V</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-purple-400">State of Charge:</span>
                  <span className="text-purple-300 font-bold">{hoveredPoint.socPercent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-cyan-400">Solar Generation:</span>
                  <span className="text-cyan-300">{hoveredPoint.solarWatts}W</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-400">System Load:</span>
                  <span className="text-amber-300">{hoveredPoint.loadWatts}W</span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-800">
                  <span>Net Current:</span>
                  <span className={hoveredPoint.netCurrentA >= 0 ? "text-emerald-400" : "text-amber-400"}>
                    {hoveredPoint.netCurrentA >= 0 ? `+${hoveredPoint.netCurrentA}A` : `${hoveredPoint.netCurrentA}A`}
                  </span>
                </div>
                <div className="flex justify-between text-[10px] text-slate-400">
                  <span>Cell Temp / Sag:</span>
                  <span>{hoveredPoint.cellTemperatureC}°C • {(hoveredPoint.internalResistanceSagV * 1000).toFixed(0)}mV</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Threshold Governor Slider & Real-Time Adjustment */}
      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3.5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center space-x-2.5">
          <div className="p-1.5 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400">
            <Sliders className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-bold text-slate-200">Interactive Load-Shedding Cutoff Threshold</span>
              <span className="text-amber-400 font-bold">{cutoffThreshold.toFixed(1)}V</span>
            </div>
            <p className="text-[11px] text-slate-400">
              Adjusting threshold recalculates load shedding intervals and preserved perimeter runtime dynamically.
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3 w-full md:w-auto">
          <input
            type="range"
            min={chemConfig.yMin + 0.4}
            max={chemConfig.yMax - 1.0}
            step={0.1}
            value={cutoffThreshold}
            onChange={(e) => handleThresholdSlider(parseFloat(e.target.value))}
            className="w-full md:w-48 accent-amber-500 cursor-pointer"
          />
          <button
            onClick={() => handleThresholdSlider(chemConfig.defaultThreshold)}
            className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 text-[11px] flex items-center space-x-1 cursor-pointer"
            title="Reset to chemistry default threshold"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset ({chemConfig.defaultThreshold}V)</span>
          </button>
        </div>
      </div>

      {/* Statistical Degradation & Health Summary Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
        {/* 1. Peak to Trough Delta */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase flex items-center space-x-1">
            <TrendingDown className="w-3 h-3 text-amber-400" />
            <span>24h Voltage Sag</span>
          </div>
          <div className="text-base font-bold text-slate-100 mt-0.5">
            Δ {summary.voltageDeltaV}V
          </div>
          <div className="text-[10px] text-slate-500">
            {summary.minVoltageV}V min → {summary.peakVoltageV}V max
          </div>
        </div>

        {/* 2. Deepest Discharge */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase flex items-center space-x-1">
            <BatteryWarning className="w-3 h-3 text-red-400" />
            <span>Max Depth (DOD)</span>
          </div>
          <div className={`text-base font-bold mt-0.5 ${summary.deepestDodPercent > 75 ? "text-amber-400" : "text-emerald-400"}`}>
            {summary.deepestDodPercent.toFixed(0)}% <span className="text-xs text-slate-400 font-normal">DOD</span>
          </div>
          <div className="text-[10px] text-slate-500">
            Min SoC: {(100 - summary.deepestDodPercent).toFixed(0)}%
          </div>
        </div>

        {/* 3. Load Shedding Hours */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase flex items-center space-x-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" />
            <span>Shedding Duration</span>
          </div>
          <div className="text-base font-bold text-emerald-400 mt-0.5">
            {summary.loadSheddingHours} <span className="text-xs text-slate-400 font-normal">Hours</span>
          </div>
          <div className="text-[10px] text-slate-500">
            {summary.hoursBelowThreshold}h below {cutoffThreshold}V
          </div>
        </div>

        {/* 4. Energy Preserved */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase flex items-center space-x-1">
            <Zap className="w-3 h-3 text-cyan-400" />
            <span>Energy Preserved</span>
          </div>
          <div className="text-base font-bold text-cyan-400 mt-0.5">
            +{summary.energyPreservedWh} <span className="text-xs text-slate-400 font-normal">Wh</span>
          </div>
          <div className="text-[10px] text-slate-500">
            +{summary.additionalRuntimeHours}h perimeter runtime
          </div>
        </div>

        {/* 5. Net Solar Balance */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase flex items-center space-x-1">
            <Sun className="w-3 h-3 text-amber-400" />
            <span>24h Net Balance</span>
          </div>
          <div className={`text-base font-bold mt-0.5 ${summary.netEnergyWh >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
            {summary.netEnergyWh >= 0 ? `+${summary.netEnergyWh}` : summary.netEnergyWh} <span className="text-xs text-slate-400 font-normal">Wh</span>
          </div>
          <div className="text-[10px] text-slate-500">
            {summary.energyGeneratedWh}Wh in / {summary.energyConsumedWh}Wh out
          </div>
        </div>

        {/* 6. Estimated State of Health (SOH) */}
        <div className="p-3 bg-slate-950/80 rounded-xl border border-slate-800">
          <div className="text-[10px] text-slate-400 uppercase flex items-center space-x-1">
            <Battery className="w-3 h-3 text-purple-400" />
            <span>Cell SOH Health</span>
          </div>
          <div className="text-base font-bold text-purple-400 mt-0.5">
            {summary.estimatedSohPercent}% <span className="text-xs text-slate-400 font-normal">SOH</span>
          </div>
          <div className="text-[10px] text-slate-500">
            ESR: ~{summary.averageInternalResistanceMOhms} mΩ
          </div>
        </div>
      </div>

      {/* Engineering Technical Notes Accordion / Info Box */}
      <div className="p-3.5 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs font-mono text-slate-300 space-y-1.5">
        <div className="flex items-center space-x-2 text-slate-400">
          <Info className="w-4 h-4 text-amber-400 shrink-0" />
          <span className="font-bold text-slate-200 uppercase tracking-wider text-[11px]">
            LiFePO4 & Solar Voltage Discharge Analysis
          </span>
        </div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Lithium Iron Phosphate (LiFePO4) cells feature a distinctive flat voltage discharge plateau between 13.1V and 12.8V across 80% of capacity. 
          When voltage dips below <span className="text-amber-400 font-bold">{cutoffThreshold}V</span>, cell impedance rises steeply. Automated load-shedding disables non-essential camera video encodings, reducing power draw by 47% and arresting rapid voltage cliffing to ensure perimeter snake detection remains active until morning solar irradiance resumes.
        </p>
      </div>
    </div>
  );
};
