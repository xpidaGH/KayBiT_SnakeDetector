import React, { useState, useEffect } from "react";
import { EdgeDeviceConfig, CameraFeed, PropertyZone, QuietHoursSchedule } from "../types";
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
  ArrowRight,
  Moon,
  Sun,
  VolumeX,
  BellOff,
  Calendar,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  SlidersHorizontal
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
  const [activeSubView, setActiveSubView] = useState<"power" | "health" | "settings" | "schedule">("power");
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

  // Quiet Hours & AI Monitoring Schedule State
  const [scheduleEnabled, setScheduleEnabled] = useState<boolean>(config.quietHours?.enabled ?? true);
  const [schedulePreset, setSchedulePreset] = useState<"nocturnal_guard" | "battery_saver" | "always_active" | "custom">(
    config.quietHours?.preset ?? "nocturnal_guard"
  );
  const [quietStartTime, setQuietStartTime] = useState<string>(config.quietHours?.startTime ?? "08:00");
  const [quietEndTime, setQuietEndTime] = useState<string>(config.quietHours?.endTime ?? "18:00");
  const [activeDays, setActiveDays] = useState<("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[]>(
    config.quietHours?.activeDays ?? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
  );
  const [muteSoundAlarm, setMuteSoundAlarm] = useState<boolean>(config.quietHours?.muteSoundAlarm ?? true);
  const [suppressFcmToNormal, setSuppressFcmToNormal] = useState<boolean>(config.quietHours?.suppressFcmToNormal ?? true);
  const [reducedFps, setReducedFps] = useState<number>(config.quietHours?.reducedInferenceFps ?? 5);
  const [exemptCriticalPerimeter, setExemptCriticalPerimeter] = useState<boolean>(
    config.quietHours?.exemptCriticalPerimeter ?? true
  );
  const [manualOverrideMode, setManualOverrideMode] = useState<"none" | "force_alert" | "force_quiet">("none");
  const [scheduleSavedToast, setScheduleSavedToast] = useState<boolean>(false);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("14:30");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, "0");
      const m = String(now.getMinutes()).padStart(2, "0");
      setCurrentTimeStr(`${h}:${m}`);
    };
    updateTime();
    const timer = setInterval(updateTime, 30000);
    return () => clearInterval(timer);
  }, []);

  // Compute effective quiet hours window based on preset
  const getEffectiveInterval = () => {
    if (schedulePreset === "nocturnal_guard") {
      // Quiet daytime 08:00 to 18:00 (active dusk/night 18:00 to 08:00)
      return { start: "08:00", end: "18:00" };
    }
    if (schedulePreset === "battery_saver") {
      // Quiet peak midday heat & solar recharge 10:00 to 16:00
      return { start: "10:00", end: "16:00" };
    }
    if (schedulePreset === "always_active") {
      return { start: "00:00", end: "00:00" };
    }
    return { start: quietStartTime, end: quietEndTime };
  };

  const effectiveWindow = getEffectiveInterval();

  // Determine if device is currently in quiet hours
  const checkIsQuietNow = () => {
    if (manualOverrideMode === "force_alert") return false;
    if (manualOverrideMode === "force_quiet") return true;
    if (!scheduleEnabled || schedulePreset === "always_active") return false;

    const [curH, curM] = currentTimeStr.split(":").map(Number);
    const [stH, stM] = effectiveWindow.start.split(":").map(Number);
    const [enH, enM] = effectiveWindow.end.split(":").map(Number);

    const curTotal = curH * 60 + curM;
    const stTotal = stH * 60 + stM;
    const enTotal = enH * 60 + enM;

    if (stTotal <= enTotal) {
      return curTotal >= stTotal && curTotal < enTotal;
    } else {
      // Overnight quiet period
      return curTotal >= stTotal || curTotal < enTotal;
    }
  };

  const isQuietHoursActiveNow = checkIsQuietNow();

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

  const handleSaveSchedule = () => {
    const quietSchedule: QuietHoursSchedule = {
      enabled: scheduleEnabled,
      preset: schedulePreset,
      startTime: effectiveWindow.start,
      endTime: effectiveWindow.end,
      activeDays,
      muteSoundAlarm,
      suppressFcmToNormal,
      reducedInferenceFps: reducedFps,
      exemptCriticalPerimeter,
      currentScheduleStatus: isQuietHoursActiveNow ? "quiet_hours_standby" : "active_monitoring"
    };

    onUpdateConfig({
      quietHours: quietSchedule
    });

    setScheduleSavedToast(true);
    setTimeout(() => setScheduleSavedToast(false), 2500);
  };

  const handleApplyPreset = (preset: "nocturnal_guard" | "battery_saver" | "always_active" | "custom") => {
    setSchedulePreset(preset);
    if (preset === "always_active") {
      setScheduleEnabled(false);
    } else {
      setScheduleEnabled(true);
      if (preset === "nocturnal_guard") {
        setQuietStartTime("08:00");
        setQuietEndTime("18:00");
        setReducedFps(5);
        setMuteSoundAlarm(true);
        setExemptCriticalPerimeter(true);
      } else if (preset === "battery_saver") {
        setQuietStartTime("10:00");
        setQuietEndTime("16:00");
        setReducedFps(3);
        setMuteSoundAlarm(true);
        setExemptCriticalPerimeter(true);
      }
    }
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

        <div className="flex flex-wrap items-center gap-2">
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
              onClick={() => setActiveSubView("schedule")}
              className={`px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition-all font-bold ${
                activeSubView === "schedule"
                  ? "bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Quiet Hours & Schedule</span>
              {isQuietHoursActiveNow ? (
                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" title="Quiet Hours Active" />
              ) : (
                <span className="w-2 h-2 rounded-full bg-emerald-400" title="Active Monitoring" />
              )}
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

          {activeSubView === "schedule" && (
            <button
              onClick={handleSaveSchedule}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3.5 py-2 rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center space-x-1.5 shrink-0"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Save & Apply Schedule</span>
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

      {/* ========================================================================= */}
      {/* SUB-VIEW 4: AI MONITORING SCHEDULE & QUIET HOURS (BATTERY & FALSE ALARMS) */}
      {/* ========================================================================= */}
      {activeSubView === "schedule" && (
        <div className="space-y-6">
          {/* Main Status & Active Window Banner */}
          <div className={`p-5 rounded-2xl border transition-all ${
            isQuietHoursActiveNow
              ? "bg-gradient-to-r from-indigo-950/80 via-slate-900 to-indigo-950/80 border-indigo-500/50 shadow-lg shadow-indigo-500/10"
              : "bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-900 border-emerald-500/40 shadow-lg shadow-emerald-500/10"
          }`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start space-x-3.5">
                <div className={`p-3 rounded-xl border mt-0.5 ${
                  isQuietHoursActiveNow
                    ? "bg-indigo-500/20 border-indigo-500/40 text-indigo-400"
                    : "bg-emerald-500/20 border-emerald-500/40 text-emerald-400"
                }`}>
                  {isQuietHoursActiveNow ? <Moon className="w-6 h-6 animate-pulse" /> : <Sun className="w-6 h-6" />}
                </div>
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded uppercase ${
                      isQuietHoursActiveNow
                        ? "bg-indigo-500 text-white"
                        : "bg-emerald-500 text-slate-950 font-bold"
                    }`}>
                      {isQuietHoursActiveNow ? "🌙 Quiet Hours Active (Standby Mode)" : "⚡ Active AI Surveillance Armed"}
                    </span>
                    <span className="text-xs font-mono text-slate-400">
                      Edge Clock: <strong className="text-slate-200">{currentTimeStr}</strong> • Window: <strong className="text-amber-400">{effectiveWindow.start} - {effectiveWindow.end}</strong>
                    </span>
                    {manualOverrideMode !== "none" && (
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/40">
                        Manual Override Active
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300">
                    {isQuietHoursActiveNow
                      ? `Quiet hours are active. Local sirens are muted and edge camera inference is throttled to ${reducedFps} FPS to conserve solar battery and prevent false alarms.`
                      : `Full-frequency AI monitoring is active at 30 FPS. High-priority mobile notifications and local emergency sirens are armed.`}
                  </p>
                </div>
              </div>

              {/* Temporary Manual Overrides */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  onClick={() => setManualOverrideMode(manualOverrideMode === "force_alert" ? "none" : "force_alert")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                    manualOverrideMode === "force_alert"
                      ? "bg-emerald-500 text-slate-950 border-emerald-400 shadow"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                  title="Force full 30 FPS inference & siren alarms right now regardless of schedule"
                >
                  ⚡ Force High Alert
                </button>

                <button
                  onClick={() => setManualOverrideMode(manualOverrideMode === "force_quiet" ? "none" : "force_quiet")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                    manualOverrideMode === "force_quiet"
                      ? "bg-indigo-500 text-white border-indigo-400 shadow"
                      : "bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700"
                  }`}
                  title="Temporarily mute sirens and downsample FPS for 30 minutes"
                >
                  🌙 Instant Quiet (30m)
                </button>

                {manualOverrideMode !== "none" && (
                  <button
                    onClick={() => setManualOverrideMode("none")}
                    className="px-2.5 py-1.5 rounded-lg text-xs font-mono text-slate-400 hover:text-white bg-slate-900 border border-slate-800"
                  >
                    Reset Auto
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Schedule Presets Selection */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-200 flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>Monitoring Schedule Presets</span>
              </h3>
              <span className="text-xs text-slate-400 font-mono">
                Select an engineered profile or customize hours
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
              {/* Preset 1: Nocturnal Guard */}
              <div
                onClick={() => handleApplyPreset("nocturnal_guard")}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  schedulePreset === "nocturnal_guard"
                    ? "bg-slate-800/90 border-amber-400 ring-1 ring-amber-400/40 shadow-lg"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-100 flex items-center space-x-1.5">
                      <Moon className="w-3.5 h-3.5 text-indigo-400" />
                      <span>Nocturnal Guard</span>
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Recommended
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Surveillance active dusk to dawn (18:00 - 08:00) targeting pit vipers. Quiet daytime standby (08:00 - 18:00) avoids lawnmower and pet false alarms.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-emerald-400 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                  Quiet: 08:00 - 18:00 • Active: 18:00 - 08:00
                </div>
              </div>

              {/* Preset 2: Battery Saver */}
              <div
                onClick={() => handleApplyPreset("battery_saver")}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  schedulePreset === "battery_saver"
                    ? "bg-slate-800/90 border-amber-400 ring-1 ring-amber-400/40 shadow-lg"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-100 flex items-center space-x-1.5">
                      <SunMedium className="w-3.5 h-3.5 text-amber-400" />
                      <span>Battery Saver (Solar Peak)</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Downsamples during midday sun peak (10:00 - 16:00) when snakes shelter underground. Prioritizes maximum solar battery top-up.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-amber-400 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                  Quiet: 10:00 - 16:00 • High Alert: 16:00 - 10:00
                </div>
              </div>

              {/* Preset 3: 24/7 Continuous */}
              <div
                onClick={() => handleApplyPreset("always_active")}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  schedulePreset === "always_active"
                    ? "bg-slate-800/90 border-amber-400 ring-1 ring-amber-400/40 shadow-lg"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-100 flex items-center space-x-1.5">
                      <Shield className="w-3.5 h-3.5 text-emerald-400" />
                      <span>24/7 Continuous Alert</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    Zero quiet hours. Constant full-framerate (30 FPS) computer vision and immediate siren broadcast 24 hours a day, 7 days a week.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-cyan-400 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                  Continuous 24/7 • Full 30 FPS Stream
                </div>
              </div>

              {/* Preset 4: Custom Interval */}
              <div
                onClick={() => handleApplyPreset("custom")}
                className={`p-4 rounded-xl border transition-all cursor-pointer flex flex-col justify-between space-y-3 ${
                  schedulePreset === "custom"
                    ? "bg-slate-800/90 border-amber-400 ring-1 ring-amber-400/40 shadow-lg"
                    : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                }`}
              >
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold font-mono text-slate-100 flex items-center space-x-1.5">
                      <SlidersHorizontal className="w-3.5 h-3.5 text-amber-400" />
                      <span>Custom Schedule</span>
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed">
                    User-defined start and end quiet hours with flexible day-of-week filters for individual property routines.
                  </p>
                </div>
                <div className="text-[10px] font-mono text-slate-300 bg-slate-950 p-2 rounded-lg border border-slate-800/80">
                  Configurable Interval & Day Selection
                </div>
              </div>
            </div>
          </div>

          {/* 24-Hour Day/Night Visualizer Timeline */}
          <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="font-bold text-slate-200">24-Hour AI Surveillance & Quiet Hours Distribution</span>
              <span className="text-slate-400">Current Edge Hour: <strong className="text-amber-400">{currentTimeStr}</strong></span>
            </div>

            <div className="relative pt-3 pb-4">
              {/* Hour scale bar */}
              <div className="h-6 w-full rounded-lg overflow-hidden flex shadow-inner border border-slate-800">
                {Array.from({ length: 24 }).map((_, h) => {
                  const hourFormatted = String(h).padStart(2, "0") + ":00";
                  // Check if this hour is quiet
                  const [stH] = effectiveWindow.start.split(":").map(Number);
                  const [enH] = effectiveWindow.end.split(":").map(Number);
                  let isHourQuiet = false;
                  if (scheduleEnabled && schedulePreset !== "always_active") {
                    if (stH <= enH) {
                      isHourQuiet = h >= stH && h < enH;
                    } else {
                      isHourQuiet = h >= stH || h < enH;
                    }
                  }
                  const isCurrentHour = Number(currentTimeStr.split(":")[0]) === h;

                  return (
                    <div
                      key={h}
                      className={`flex-1 h-full transition-colors relative group ${
                        isHourQuiet
                          ? "bg-indigo-900/80 hover:bg-indigo-800"
                          : "bg-emerald-600/70 hover:bg-emerald-500"
                      } ${isCurrentHour ? "ring-2 ring-amber-400 z-10" : ""}`}
                      title={`${hourFormatted} - ${isHourQuiet ? "Quiet Hours (Standby)" : "Active AI Surveillance"}`}
                    >
                      {isCurrentHour && (
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Ticks and Labels */}
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-2 px-1">
                <span>00:00 (Midnight)</span>
                <span>06:00 (Dawn)</span>
                <span>12:00 (Noon)</span>
                <span>18:00 (Dusk)</span>
                <span>24:00</span>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-4 text-xs font-mono pt-1 border-t border-slate-800/80">
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-emerald-600" />
                <span className="text-slate-300">Active High-Priority AI Surveillance (30 FPS)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-3 h-3 rounded bg-indigo-900 border border-indigo-700" />
                <span className="text-slate-300">Quiet Hours Standby ({reducedFps} FPS, Siren Muted)</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 ring-2 ring-amber-500/50" />
                <span className="text-amber-300">Current Edge Clock Time</span>
              </div>
            </div>
          </div>

          {/* Detailed Custom Settings & Policy Toggles */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Box: Time Pickers & Active Days */}
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Quiet Hours Interval & Days</span>
                </h4>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={scheduleEnabled}
                    onChange={(e) => setScheduleEnabled(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-amber-500"></div>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400">Quiet Hours Start</label>
                  <input
                    type="time"
                    disabled={!scheduleEnabled || schedulePreset !== "custom"}
                    value={schedulePreset === "custom" ? quietStartTime : effectiveWindow.start}
                    onChange={(e) => {
                      setQuietStartTime(e.target.value);
                      setSchedulePreset("custom");
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm font-mono text-slate-100 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">Enters low-power standby</span>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-mono text-slate-400">Quiet Hours End</label>
                  <input
                    type="time"
                    disabled={!scheduleEnabled || schedulePreset !== "custom"}
                    value={schedulePreset === "custom" ? quietEndTime : effectiveWindow.end}
                    onChange={(e) => {
                      setQuietEndTime(e.target.value);
                      setSchedulePreset("custom");
                    }}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm font-mono text-slate-100 focus:border-amber-500 focus:outline-none disabled:opacity-50"
                  />
                  <span className="text-[10px] text-slate-400 font-mono">Resumes 30 FPS high-alert</span>
                </div>
              </div>

              {/* Day of Week Selector */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-mono text-slate-400 block">Enforce Schedule on Days</label>
                <div className="flex flex-wrap gap-1.5">
                  {(["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const).map((day) => {
                    const isDayActive = activeDays.includes(day);
                    return (
                      <button
                        key={day}
                        onClick={() => {
                          if (isDayActive) {
                            if (activeDays.length > 1) {
                              setActiveDays(activeDays.filter(d => d !== day));
                            }
                          } else {
                            setActiveDays([...activeDays, day]);
                          }
                        }}
                        className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold transition-all border ${
                          isDayActive
                            ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                            : "bg-slate-950 text-slate-400 border-slate-800 hover:border-slate-700"
                        }`}
                      >
                        {day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Right Box: Defense & Energy Policies */}
            <div className="bg-slate-900/90 p-5 rounded-2xl border border-slate-800 space-y-4">
              <h4 className="font-bold text-sm text-slate-100 flex items-center space-x-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>Quiet Hours Defense Policies</span>
              </h4>

              <div className="space-y-3">
                {/* Policy 1: Mute Siren */}
                <div 
                  onClick={() => setMuteSoundAlarm(!muteSoundAlarm)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
                      <VolumeX className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Mute Emergency Warble Siren</div>
                      <div className="text-[11px] text-slate-400">Silently record intruder snapshots without sounding the 95dB alarm</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={muteSoundAlarm}
                    onChange={() => {}}
                    className="accent-amber-500 w-4 h-4"
                  />
                </div>

                {/* Policy 2: Downgrade FCM Notifications */}
                <div 
                  onClick={() => setSuppressFcmToNormal(!suppressFcmToNormal)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-amber-400">
                      <BellOff className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Silent Mobile Push Notifications</div>
                      <div className="text-[11px] text-slate-400">Send quiet background telemetry without vibrating or waking mobile screens</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={suppressFcmToNormal}
                    onChange={() => {}}
                    className="accent-amber-500 w-4 h-4"
                  />
                </div>

                {/* Policy 3: Keep Critical Perimeter Cameras Active */}
                <div 
                  onClick={() => setExemptCriticalPerimeter(!exemptCriticalPerimeter)}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800/80 cursor-pointer hover:border-slate-700"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-slate-800 text-emerald-400">
                      <ShieldCheck className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-200">Exempt Critical Perimeter Cameras</div>
                      <div className="text-[11px] text-slate-400">Maintain 30 FPS surveillance on high-risk boundary fences during quiet hours</div>
                    </div>
                  </div>
                  <input
                    type="checkbox"
                    checked={exemptCriticalPerimeter}
                    onChange={() => {}}
                    className="accent-emerald-500 w-4 h-4"
                  />
                </div>

                {/* Policy 4: Reduced Inference Rate Slider */}
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-300 font-bold">Throttled Framerate (Quiet Standby)</span>
                    <span className="text-amber-400 font-bold">{reducedFps} FPS (saves ~62% NPU power)</span>
                  </div>
                  <input
                    type="range"
                    min="1"
                    max="15"
                    step="1"
                    value={reducedFps}
                    onChange={(e) => setReducedFps(parseInt(e.target.value))}
                    className="w-full accent-amber-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Conservation Analytics & Save Action Card */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-amber-950/30 p-5 rounded-2xl border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-xs font-mono">
              <div>
                <span className="text-slate-400 block">Est. Daily Energy Saved</span>
                <strong className="text-emerald-400 text-sm font-bold">~18.4 Wh / Day</strong>
              </div>
              <div>
                <span className="text-slate-400 block">Solar Runtime Extension</span>
                <strong className="text-amber-400 text-sm font-bold">+5.8 Hours</strong>
              </div>
              <div>
                <span className="text-slate-400 block">False Alarm Suppression</span>
                <strong className="text-cyan-400 text-sm font-bold">94% Daylight Rejection</strong>
              </div>
            </div>

            <div className="flex items-center space-x-3 shrink-0">
              {scheduleSavedToast && (
                <span className="text-xs font-mono text-emerald-400 flex items-center space-x-1 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Schedule Applied!</span>
                </span>
              )}
              <button
                onClick={handleSaveSchedule}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md shadow-amber-500/20 flex items-center space-x-1.5 cursor-pointer"
              >
                <Check className="w-4 h-4" />
                <span>Save Schedule to Edge Daemon</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

