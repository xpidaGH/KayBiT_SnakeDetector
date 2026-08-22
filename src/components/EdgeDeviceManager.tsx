import React, { useState } from "react";
import { EdgeDeviceConfig, CameraFeed, PropertyZone } from "../types";
import { PYTHON_EDGE_SCRIPT } from "../data/codeSnippets";
import { SystemHealthDashboard } from "./SystemHealthDashboard";
import { 
  Cpu, 
  Sliders, 
  Download, 
  Copy, 
  Check, 
  Terminal, 
  Activity, 
  Zap, 
  Radio, 
  ShieldCheck,
  ShieldAlert,
  RefreshCw,
  HardDrive,
  Battery,
  BatteryCharging,
  BatteryWarning,
  BatteryLow,
  Video,
  VideoOff,
  SunMedium,
  Gauge,
  Power,
  Info,
  Shield,
  Clock,
  ArrowRight
} from "lucide-react";

interface EdgeDeviceManagerProps {
  config: EdgeDeviceConfig;
  onUpdateConfig: (newConfig: Partial<EdgeDeviceConfig>) => void;
  cameras?: CameraFeed[];
  zones?: PropertyZone[];
  onToggleCameraEssential?: (cameraId: string) => void;
  onSelectTab?: (tab: any) => void;
}

export const EdgeDeviceManager: React.FC<EdgeDeviceManagerProps> = ({
  config,
  onUpdateConfig,
  cameras = [],
  zones = [],
  onToggleCameraEssential,
  onSelectTab
}) => {
  const [activeSubView, setActiveSubView] = useState<"power" | "health" | "settings">("power");
  const [copied, setCopied] = useState<boolean>(false);
  const [copiedService, setCopiedService] = useState<boolean>(false);
  
  // Power & Battery State
  const [batteryVoltage, setBatteryVoltage] = useState<number>(config.battery_voltage ?? 12.6);
  const [batteryThreshold, setBatteryThreshold] = useState<number>(config.batteryVoltageThreshold ?? 11.8);
  const [isPowerSaveEnabled, setIsPowerSaveEnabled] = useState<boolean>(config.lowBatteryPowerSaveEnabled ?? true);
  const [batteryChemistry, setBatteryChemistry] = useState<string>(config.batteryChemistry ?? "12v_lifepo4");
  
  // Inference State
  const [confidence, setConfidence] = useState<number>(config.confidenceThreshold);
  const [consecutiveFrames, setConsecutiveFrames] = useState<number>(config.consecutiveFramesRequired);
  const [irContrast, setIrContrast] = useState<number>(config.irContrastBoost);
  const [cooldown, setCooldown] = useState<number>(config.cooldownSeconds);

  // Derive active load-shedding status
  const isLoadSheddingActive = isPowerSaveEnabled && batteryVoltage < batteryThreshold;

  // Calculate battery percentage from 12V LiFePO4 / Lead-Acid voltage curve
  const calculateBatteryPercent = (volts: number, chem: string) => {
    if (chem === "5v_direct") {
      return Math.min(100, Math.max(0, Math.round(((volts - 4.5) / (5.2 - 4.5)) * 100)));
    }
    if (chem === "3s_li_ion") {
      return Math.min(100, Math.max(0, Math.round(((volts - 9.6) / (12.6 - 9.6)) * 100)));
    }
    // 12V LiFePO4 / AGM
    return Math.min(100, Math.max(0, Math.round(((volts - 10.8) / (13.4 - 10.8)) * 100)));
  };

  const currentPercent = calculateBatteryPercent(batteryVoltage, batteryChemistry);

  // Power math
  const defaultCameras = cameras.length > 0 ? cameras : [
    { id: "cam-01", name: "Garden Bed & South Patio Cam", location: "South Perimeter Garden", isEssential: true, priority: "critical_perimeter" as const, powerDrawWatts: 4.2, status: "live" as const },
    { id: "cam-02", name: "Front Porch IR Night Vision", location: "Front Entrance Steps", isEssential: true, priority: "critical_perimeter" as const, powerDrawWatts: 5.1, status: "live" as const },
    { id: "cam-03", name: "Tool Shed & Woodpile Cam", location: "North Woodpile Storage", isEssential: false, priority: "standard" as const, powerDrawWatts: 3.4, status: "live" as const },
    { id: "cam-04", name: "Backyard Pool Deck & Lawn", location: "West Recreational Area", isEssential: false, priority: "low" as const, powerDrawWatts: 4.8, status: "live" as const }
  ];

  const totalFullPowerWatts = defaultCameras.reduce((acc, c) => acc + (c.powerDrawWatts || 4.0), 0) + 7.5; // +7.5W for RPi 5 + NPU
  const sheddedPowerWatts = defaultCameras
    .filter(c => !c.isEssential)
    .reduce((acc, c) => acc + (c.powerDrawWatts || 4.0), 0);
  const currentActualPowerWatts = isLoadSheddingActive ? (totalFullPowerWatts - sheddedPowerWatts) : totalFullPowerWatts;
  const powerReductionPercent = Math.round((sheddedPowerWatts / totalFullPowerWatts) * 100);
  const estimatedExtendedHours = (sheddedPowerWatts * 1.8).toFixed(1);

  const handleVoltageChange = (newVoltage: number) => {
    setBatteryVoltage(newVoltage);
    const newPercent = calculateBatteryPercent(newVoltage, batteryChemistry);
    const newIsShedding = isPowerSaveEnabled && newVoltage < batteryThreshold;
    
    onUpdateConfig({
      battery_voltage: newVoltage,
      battery_percentage: newPercent,
      powerSaveModeActive: newIsShedding,
      batteryVoltageThreshold: batteryThreshold,
      lowBatteryPowerSaveEnabled: isPowerSaveEnabled
    });
  };

  const handleThresholdChange = (newThreshold: number) => {
    setBatteryThreshold(newThreshold);
    const newIsShedding = isPowerSaveEnabled && batteryVoltage < newThreshold;
    onUpdateConfig({
      batteryVoltageThreshold: newThreshold,
      powerSaveModeActive: newIsShedding
    });
  };

  const handleTogglePowerSave = () => {
    const nextVal = !isPowerSaveEnabled;
    setIsPowerSaveEnabled(nextVal);
    const newIsShedding = nextVal && batteryVoltage < batteryThreshold;
    onUpdateConfig({
      lowBatteryPowerSaveEnabled: nextVal,
      powerSaveModeActive: newIsShedding
    });
  };

  const handleChemistryPreset = (chem: string, defaultCutoff: number) => {
    setBatteryChemistry(chem);
    setBatteryThreshold(defaultCutoff);
    const newIsShedding = isPowerSaveEnabled && batteryVoltage < defaultCutoff;
    onUpdateConfig({
      batteryChemistry: chem as any,
      batteryVoltageThreshold: defaultCutoff,
      powerSaveModeActive: newIsShedding
    });
  };

  const handleCopyScript = () => {
    navigator.clipboard.writeText(PYTHON_EDGE_SCRIPT);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadScript = () => {
    const element = document.createElement("a");
    const file = new Blob([PYTHON_EDGE_SCRIPT], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = "kaybit_edge_detector.py";
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleSaveInferenceSettings = () => {
    onUpdateConfig({
      confidenceThreshold: confidence,
      consecutiveFramesRequired: consecutiveFrames,
      irContrastBoost: irContrast,
      cooldownSeconds: cooldown,
      battery_voltage: batteryVoltage,
      batteryVoltageThreshold: batteryThreshold,
      lowBatteryPowerSaveEnabled: isPowerSaveEnabled,
      batteryChemistry: batteryChemistry as any
    });
  };

  const systemdServiceCode = `[Unit]
Description=KayBiT Edge AI Snake Detector Daemon
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/kaybit
ExecStart=/usr/bin/python3 /home/pi/kaybit/kaybit_edge_detector.py
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target`;

  return (
    <div className="space-y-6">
      {/* Top Header & Navigation Sub-Tabs */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/90 p-4 rounded-2xl border border-slate-800 backdrop-blur shadow-xl">
        <div>
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">Edge Device Manager & Power Governor</h2>
                {isLoadSheddingActive ? (
                  <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-300 font-mono font-bold rounded border border-amber-500/40 animate-pulse flex items-center space-x-1">
                    <BatteryWarning className="w-3 h-3" />
                    <span>LOAD SHEDDING ACTIVE</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 font-mono font-bold rounded border border-emerald-500/30 flex items-center space-x-1">
                    <BatteryCharging className="w-3 h-3" />
                    <span>SOLAR NORMAL ({batteryVoltage.toFixed(1)}V)</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Raspberry Pi 5 (8GB) + Hailo-8L NPU • I2C INA219 Solar Bus Voltage Governor & Perimeter Shield
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {/* Sub-view switcher */}
          <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
            <button
              onClick={() => setActiveSubView("power")}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all font-bold ${
                activeSubView === "power"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Battery className="w-3.5 h-3.5" />
              <span>Battery & Stream Shedding</span>
            </button>

            <button
              onClick={() => setActiveSubView("health")}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all font-bold ${
                activeSubView === "health"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              <span>D3 Sparklines & Telemetry</span>
            </button>

            <button
              onClick={() => setActiveSubView("settings")}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all font-bold ${
                activeSubView === "settings"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Inference & Python Daemon</span>
            </button>
          </div>

          {activeSubView === "settings" && (
            <button
              onClick={handleSaveInferenceSettings}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center space-x-1.5 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save Parameters</span>
            </button>
          )}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: BATTERY POWER GOVERNOR & STREAM SHEDDING (PRIMARY FEATURE)    */}
      {/* ========================================================================= */}
      {activeSubView === "power" && (
        <div className="space-y-6">
          {/* Main Status Callout Banner */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isLoadSheddingActive
              ? "bg-gradient-to-r from-amber-950/80 via-slate-900 to-amber-950/80 border-amber-500/50 shadow-lg shadow-amber-500/10"
              : "bg-gradient-to-r from-emerald-950/40 via-slate-900 to-slate-900 border-emerald-500/40"
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className={`p-3 rounded-xl border mt-0.5 ${
                  isLoadSheddingActive
                    ? "bg-amber-500/20 border-amber-500/40 text-amber-400 animate-pulse"
                    : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                }`}>
                  {isLoadSheddingActive ? <BatteryLow className="w-6 h-6" /> : <SunMedium className="w-6 h-6" />}
                </div>
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      isLoadSheddingActive ? "bg-amber-500 text-slate-950" : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                    }`}>
                      {isLoadSheddingActive ? "⚠️ Low-Voltage Load Shedding Active" : "✓ Nominal Solar Power State"}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Bus: <strong className="text-slate-200">{batteryVoltage.toFixed(2)}V</strong> | Cutoff Threshold: <strong className="text-amber-400">{batteryThreshold.toFixed(1)}V</strong>
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-slate-100">
                    {isLoadSheddingActive 
                      ? "Non-Essential Camera Streams Automatically Suspended — Perimeter Defense 100% Protected"
                      : "All 4 RTSP Video Streams & YOLOv8 Inferences Active"}
                  </h3>
                  <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
                    {isLoadSheddingActive 
                      ? `Battery voltage (${batteryVoltage.toFixed(2)}V) has fallen below the safety threshold (${batteryThreshold.toFixed(1)}V). Non-essential cameras (Woodpile Storage & Pool Deck) are paused to reduce power by ${powerReductionPercent}%, extending critical perimeter defense (South Garden & Front Entry) by +${estimatedExtendedHours} hours.`
                      : "Solar charge levels are sufficient. Continuous multi-channel AI vision is monitoring all 4 property zones simultaneously with Hailo-8L hardware acceleration."}
                  </p>
                </div>
              </div>

              {/* Power Savings Box */}
              <div className="bg-slate-950/80 p-3.5 rounded-xl border border-slate-800 flex md:flex-col items-center justify-between md:justify-center gap-3 shrink-0 min-w-[200px]">
                <div className="text-center">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Current Power Draw</div>
                  <div className="text-xl font-bold font-mono text-slate-100">
                    {currentActualPowerWatts.toFixed(1)} <span className="text-xs text-amber-400">Watts</span>
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-800 md:h-px md:w-full" />
                <div className="text-center">
                  <div className="text-[11px] font-mono text-slate-400 uppercase">Power Saved by Shedding</div>
                  <div className={`text-sm font-bold font-mono ${isLoadSheddingActive ? "text-emerald-400" : "text-slate-400"}`}>
                    {isLoadSheddingActive ? `-${sheddedPowerWatts.toFixed(1)} W (-${powerReductionPercent}%)` : "0.0 W (Standby)"}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Battery Tuning & Voltage Injection Controls */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Left: Interactive Governor Configuration (7 cols) */}
            <div className="lg:col-span-7 bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Sliders className="w-5 h-5 text-amber-400" />
                  <h3 className="font-bold text-slate-100 text-base">Governor Voltage Cutoff & Hysteresis</h3>
                </div>

                {/* Master Power Save Toggle */}
                <button
                  onClick={handleTogglePowerSave}
                  className={`px-3 py-1.5 rounded-xl font-mono text-xs font-bold transition-all flex items-center space-x-2 border ${
                    isPowerSaveEnabled
                      ? "bg-amber-500/20 text-amber-400 border-amber-500/40"
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  }`}
                >
                  <Power className="w-3.5 h-3.5" />
                  <span>{isPowerSaveEnabled ? "Auto Shedding ENABLED" : "Auto Shedding DISABLED"}</span>
                </button>
              </div>

              {/* Threshold Slider */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold flex items-center space-x-1.5">
                    <span>Low Voltage Shedding Threshold</span>
                    <span className="text-slate-500">(Cutoff Trigger)</span>
                  </span>
                  <span className="text-amber-400 font-bold text-base">{batteryThreshold.toFixed(1)} V</span>
                </div>
                <input
                  type="range"
                  min="10.0"
                  max="12.8"
                  step="0.1"
                  value={batteryThreshold}
                  onChange={(e) => handleThresholdChange(parseFloat(e.target.value))}
                  disabled={!isPowerSaveEnabled}
                  className="w-full accent-amber-500 cursor-pointer disabled:opacity-40"
                />
                <div className="flex justify-between text-[10px] font-mono text-slate-400">
                  <span>10.0V (Extreme Deep Cycle)</span>
                  <span className="text-amber-400">Default: 11.8V (LiFePO4 20% Reserve)</span>
                  <span>12.8V (Float Cutoff)</span>
                </div>
              </div>

              {/* Battery Chemistry Presets */}
              <div className="space-y-2">
                <label className="text-xs font-mono text-slate-300 font-bold flex items-center space-x-1.5">
                  <Zap className="w-3.5 h-3.5 text-amber-400" />
                  <span>Battery Chemistry Presets & Cutoff Recommendations</span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <button
                    onClick={() => handleChemistryPreset("12v_lifepo4", 11.8)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      batteryChemistry === "12v_lifepo4"
                        ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm"
                        : "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="font-bold">12V LiFePO4</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">11.8V Cutoff (80% DoD)</div>
                  </button>

                  <button
                    onClick={() => handleChemistryPreset("12v_lead_acid", 11.6)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      batteryChemistry === "12v_lead_acid"
                        ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm"
                        : "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="font-bold">12V AGM / Lead</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">11.6V Cutoff (50% DoD)</div>
                  </button>

                  <button
                    onClick={() => handleChemistryPreset("3s_li_ion", 10.8)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      batteryChemistry === "3s_li_ion"
                        ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm"
                        : "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="font-bold">3S Li-Ion 18650</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">10.8V (3.6V/Cell)</div>
                  </button>

                  <button
                    onClick={() => handleChemistryPreset("5v_direct", 4.75)}
                    className={`p-2.5 rounded-xl border text-left text-xs transition-all ${
                      batteryChemistry === "5v_direct"
                        ? "bg-amber-500/15 border-amber-500/50 text-amber-300 shadow-sm"
                        : "bg-slate-950/80 border-slate-800 text-slate-300 hover:bg-slate-800"
                    }`}
                  >
                    <div className="font-bold">5V DC Buck</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">4.75V USB-C Ingress</div>
                  </button>
                </div>
              </div>

              {/* Recovery Hysteresis Info */}
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 flex items-start space-x-3 text-xs text-slate-300">
                <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="text-slate-100 font-mono">Dynamic Solar Re-Engagement Hysteresis (+0.4V):</strong>
                  <p className="text-slate-400 text-[11px] mt-0.5">
                    When daylight solar charging brings bus voltage back up to{" "}
                    <strong className="text-emerald-400 font-mono">{(batteryThreshold + 0.4).toFixed(1)}V</strong>, the edge daemon automatically reactivates suspended non-essential cameras with zero manual intervention.
                  </p>
                </div>
              </div>
            </div>

            {/* Right: Live Battery Gauge & Real-Time Voltage Injector (5 cols) */}
            <div className="lg:col-span-5 bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6 flex flex-col justify-between">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
                    <Gauge className="w-5 h-5 text-amber-400" />
                    <span>Live Solar Voltage Sensor Simulator</span>
                  </h3>
                  <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                    I2C INA219 (0x40)
                  </span>
                </div>

                {/* Voltage Digital Display Gauge */}
                <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono text-slate-400">Current Measured Voltage:</span>
                    <span className={`text-2xl font-bold font-mono ${
                      batteryVoltage < batteryThreshold ? "text-amber-400 animate-pulse" : "text-emerald-400"
                    }`}>
                      {batteryVoltage.toFixed(2)} V
                    </span>
                  </div>

                  {/* Battery Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] font-mono text-slate-400">
                      <span>Reserve: {currentPercent}%</span>
                      <span>{batteryVoltage < batteryThreshold ? "⚡ Below Cutoff" : "✓ Optimal State"}</span>
                    </div>
                    <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden p-0.5">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          currentPercent < 25 
                            ? "bg-red-500" 
                            : currentPercent < 50 
                            ? "bg-amber-500" 
                            : "bg-emerald-500"
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, currentPercent))}%` }}
                      />
                    </div>
                  </div>

                  {/* Slider to inject test voltage */}
                  <div className="pt-2">
                    <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                      <span>Drag to test live edge cutoff:</span>
                      <span className="text-amber-400 font-bold">{batteryVoltage.toFixed(2)}V</span>
                    </div>
                    <input
                      type="range"
                      min="10.2"
                      max="13.2"
                      step="0.05"
                      value={batteryVoltage}
                      onChange={(e) => handleVoltageChange(parseFloat(e.target.value))}
                      className="w-full accent-amber-500 cursor-pointer"
                    />
                  </div>
                </div>

                {/* Quick Simulation Presets */}
                <div className="space-y-2">
                  <div className="text-xs font-mono text-slate-400">Quick Test Injection Presets:</div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => handleVoltageChange(12.8)}
                      className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-xs font-mono transition-colors"
                    >
                      <div className="text-emerald-400 font-bold">12.8V (95% Full)</div>
                      <div className="text-[10px] text-slate-400">Normal 4-Cam Mode</div>
                    </button>

                    <button
                      onClick={() => handleVoltageChange(12.2)}
                      className="p-2 rounded-lg bg-slate-950 hover:bg-slate-800 border border-slate-800 text-left text-xs font-mono transition-colors"
                    >
                      <div className="text-emerald-400 font-bold">12.2V (70% Nominal)</div>
                      <div className="text-[10px] text-slate-400">All Streams Active</div>
                    </button>

                    <button
                      onClick={() => handleVoltageChange(11.4)}
                      className="p-2 rounded-lg bg-amber-950/40 hover:bg-amber-950/70 border border-amber-500/40 text-left text-xs font-mono transition-colors"
                    >
                      <div className="text-amber-400 font-bold">11.4V (Low Voltage)</div>
                      <div className="text-[10px] text-amber-300">Trigger Load Shedding</div>
                    </button>

                    <button
                      onClick={() => handleVoltageChange(10.8)}
                      className="p-2 rounded-lg bg-red-950/40 hover:bg-red-950/70 border border-red-500/40 text-left text-xs font-mono transition-colors"
                    >
                      <div className="text-red-400 font-bold">10.8V (Critical)</div>
                      <div className="text-[10px] text-red-300">Perimeter Only</div>
                    </button>
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 font-mono bg-slate-950/60 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between">
                <span>Edge I2C Polling: Every 5s</span>
                <span className="text-emerald-400">Zero Cloud Latency</span>
              </div>
            </div>
          </div>

          {/* Camera Prioritization & Stream Shedding Matrix */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div>
                <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  <span>Property Zone Stream Prioritization & Protection Matrix</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Critical perimeter zones remain shielded from load shedding. Toggle protection per camera stream below.
                </p>
              </div>

              <div className="flex items-center space-x-2 text-xs font-mono">
                <span className="flex items-center space-x-1 text-emerald-400 bg-emerald-950/40 px-2 py-1 rounded border border-emerald-500/30">
                  <Shield className="w-3.5 h-3.5" />
                  <span>2 Perimeter Shielded</span>
                </span>
                <span className="flex items-center space-x-1 text-amber-400 bg-amber-950/40 px-2 py-1 rounded border border-amber-500/30">
                  <Zap className="w-3.5 h-3.5" />
                  <span>2 Auto-Sheddable</span>
                </span>
              </div>
            </div>

            {/* Cameras Table / Card Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              {defaultCameras.map((cam) => {
                const isPerimeter = cam.isEssential || cam.priority === "critical_perimeter";
                const isCurrentlyDisabled = isLoadSheddingActive && !isPerimeter;

                return (
                  <div
                    key={cam.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCurrentlyDisabled
                        ? "bg-slate-950/90 border-red-500/40 opacity-80"
                        : isPerimeter
                        ? "bg-slate-950 border-emerald-500/40 shadow-sm"
                        : "bg-slate-950 border-slate-800"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="text-xs font-mono text-slate-400">{cam.id.toUpperCase()}</span>
                          <h4 className="text-sm font-bold text-slate-100">{cam.name}</h4>
                        </div>
                        <div className="text-xs text-slate-400 font-mono">
                          {cam.location} • Draw: <strong className="text-slate-300">{cam.powerDrawWatts || 4.2}W</strong>
                        </div>
                      </div>

                      {/* Stream State Pill */}
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-mono font-bold uppercase flex items-center space-x-1 whitespace-nowrap ${
                        isCurrentlyDisabled
                          ? "bg-red-500/20 text-red-400 border border-red-500/40"
                          : isPerimeter
                          ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                          : "bg-slate-800 text-slate-300 border border-slate-700"
                      }`}>
                        {isCurrentlyDisabled ? (
                          <>
                            <VideoOff className="w-3 h-3 text-red-400" />
                            <span>STREAM SHEDDED</span>
                          </>
                        ) : isPerimeter ? (
                          <>
                            <Shield className="w-3 h-3 text-emerald-400" />
                            <span>PERIMETER ACTIVE</span>
                          </>
                        ) : (
                          <>
                            <Video className="w-3 h-3 text-emerald-400" />
                            <span>ACTIVE 30FPS</span>
                          </>
                        )}
                      </span>
                    </div>

                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs">
                      <div className="flex items-center space-x-2">
                        <span className="font-mono text-slate-400">Protection Tier:</span>
                        <span className={`font-mono font-bold text-[11px] ${
                          isPerimeter ? "text-emerald-400" : "text-slate-400"
                        }`}>
                          {isPerimeter ? "🛡️ CRITICAL PERIMETER" : "⚡ NON-ESSENTIAL (Sheddable)"}
                        </span>
                      </div>

                      {/* Toggle Protection Button */}
                      <button
                        onClick={() => onToggleCameraEssential && onToggleCameraEssential(cam.id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-mono transition-colors border ${
                          isPerimeter
                            ? "bg-emerald-950/60 text-emerald-300 border-emerald-500/40 hover:bg-emerald-900/60"
                            : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                        }`}
                      >
                        {isPerimeter ? "Shielded" : "Allow Shed"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: D3 SENSORS & HEALTH DASHBOARD                                 */}
      {/* ========================================================================= */}
      {activeSubView === "health" && (
        <SystemHealthDashboard
          batteryVoltage={batteryVoltage}
          batteryThreshold={batteryThreshold}
          batteryChemistry={batteryChemistry as any}
          onThresholdChange={(thresh) => {
            setBatteryThreshold(thresh);
            const newIsShedding = isPowerSaveEnabled && batteryVoltage < thresh;
            onUpdateConfig({
              batteryVoltageThreshold: thresh,
              powerSaveModeActive: newIsShedding
            });
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: INFERENCE TUNING & PYTHON DAEMON EXPORT                      */}
      {/* ========================================================================= */}
      {activeSubView === "settings" && (
        <div className="space-y-6">
          {/* Telemetry Metrics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>Hardware Node</span>
                <Cpu className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-base font-bold text-slate-100 font-mono">Raspberry Pi 5</div>
              <div className="text-[11px] text-emerald-400 font-mono">Hailo-8L NPU (13 TOPS)</div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>YOLOv8 Latency</span>
                <Zap className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-base font-bold text-slate-100 font-mono">{config.inferenceTimeMs} ms</div>
              <div className="text-[11px] text-slate-400 font-mono">35.7 FPS Throughput</div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>Model Weights</span>
                <HardDrive className="w-4 h-4 text-amber-400" />
              </div>
              <div className="text-base font-bold text-slate-100 font-mono">{config.activeModel}</div>
              <div className="text-[11px] text-slate-400 font-mono">6.2 MB (INT8 Quantized)</div>
            </div>

            <div className="bg-slate-900/90 p-4 rounded-xl border border-slate-800 space-y-1">
              <div className="text-xs text-slate-400 font-mono flex items-center justify-between">
                <span>Uptime & Sync</span>
                <Activity className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="text-base font-bold text-slate-100 font-mono">{config.uptimeHours.toFixed(1)} hrs</div>
              <div className="text-[11px] text-emerald-400 font-mono">0 Frame Drops</div>
            </div>
          </div>

          {/* Edge Filter & Threshold Tuning Controls */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
            <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>False-Positive & Night-Vision Precision Controls</span>
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Confidence Threshold */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold">Detection Confidence Threshold</span>
                  <span className="text-amber-400 font-bold">{(confidence * 100).toFixed(0)}%</span>
                </div>
                <input
                  type="range"
                  min="0.50"
                  max="0.95"
                  step="0.01"
                  value={confidence}
                  onChange={(e) => setConfidence(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Higher thresholds (≥75%) eliminate false positives from coiled garden hoses, ropes, and tree roots.
                </p>
              </div>

              {/* Consecutive Frame Filter */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold">Consecutive Frame Verification</span>
                  <span className="text-amber-400 font-bold">{consecutiveFrames} Frames</span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="6"
                  step="1"
                  value={consecutiveFrames}
                  onChange={(e) => setConsecutiveFrames(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Requires continuous object confirmation across N video frames to confirm biological serpentine motion.
                </p>
              </div>

              {/* IR Contrast Boost */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold">Night Vision IR Contrast Boost</span>
                  <span className="text-emerald-400 font-bold">{irContrast.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="1.0"
                  max="2.5"
                  step="0.1"
                  value={irContrast}
                  onChange={(e) => setIrContrast(parseFloat(e.target.value))}
                  className="w-full accent-emerald-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Enhances thermal contrast against cold stone patio flagstones for nocturnal snake detection.
                </p>
              </div>

              {/* Cooldown Timer */}
              <div className="space-y-2 bg-slate-950 p-4 rounded-xl border border-slate-800/80">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-slate-300 font-bold">Alert Cooldown Window</span>
                  <span className="text-amber-400 font-bold">{cooldown} Seconds</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="120"
                  step="5"
                  value={cooldown}
                  onChange={(e) => setCooldown(parseInt(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
                <p className="text-[11px] text-slate-400">
                  Prevents repeat mobile push notifications for the same tracked snake while alarm siren remains active.
                </p>
              </div>
            </div>
          </div>

          {/* Python Edge Inference Script Code Exporter */}
          <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Edge Python Inference Daemon (`kaybit_edge_detector.py`)</span>
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Includes multi-threaded RTSP ingestion and automated I2C battery voltage load-shedding governor.
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={handleCopyScript}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1 border border-slate-700"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? "Copied!" : "Copy Python Script"}</span>
                </button>

                <button
                  onClick={handleDownloadScript}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1 shadow-sm"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .py</span>
                </button>
              </div>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <div className="bg-slate-900/90 px-4 py-2 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                <span>kaybit_edge_detector.py</span>
                <span>Python 3.10+ • OpenCV • Ultralytics YOLOv8 • INA219 I2C Governor</span>
              </div>
              <pre className="p-4 text-xs font-mono text-amber-200/90 overflow-x-auto max-h-72 leading-relaxed scrollbar-thin">
                {PYTHON_EDGE_SCRIPT}
              </pre>
            </div>

            {/* Linux Daemon Systemd instructions */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono text-slate-300 font-bold">
                  Raspberry Pi Auto-Start Service (`/etc/systemd/system/kaybit.service`)
                </span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(systemdServiceCode);
                    setCopiedService(true);
                    setTimeout(() => setCopiedService(false), 2000);
                  }}
                  className="text-xs text-amber-400 hover:text-amber-300 font-mono flex items-center space-x-1"
                >
                  {copiedService ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedService ? "Copied Service" : "Copy Service Config"}</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-900 rounded-lg text-[11px] font-mono text-slate-300 overflow-x-auto">
                {systemdServiceCode}
              </pre>
              <div className="text-[11px] font-mono text-slate-400">
                To enable: <code className="text-amber-400">sudo systemctl enable --now kaybit.service</code>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
