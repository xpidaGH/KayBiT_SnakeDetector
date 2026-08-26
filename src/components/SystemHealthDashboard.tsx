import React, { useState, useEffect, useMemo, useRef } from "react";
import { 
  Cpu, 
  Thermometer, 
  Activity, 
  HardDrive, 
  Zap, 
  Fan, 
  ShieldAlert, 
  CheckCircle2, 
  AlertTriangle, 
  RefreshCw, 
  Sliders, 
  Terminal, 
  Play, 
  Pause, 
  Download, 
  Flame, 
  Gauge, 
  Radio, 
  Boxes,
  Maximize2,
  BatteryCharging,
  Battery,
  Sun,
  Layers,
  BellRing
} from "lucide-react";
import { D3Sparkline } from "./D3Sparkline";
import { Battery24hDegradationChart } from "./Battery24hDegradationChart";
import { NpuOverloadAlertBanner } from "./NpuOverloadAlertBanner";
import { NpuOverloadAlertSystem } from "./NpuOverloadAlertSystem";
import { TemporalAlertDistributionChart } from "./TemporalAlertDistributionChart";
import { BatteryWarningToast } from "./BatteryWarningToast";
import { 
  generateInitialTelemetryHistory, 
  computeSystemHealthSummary 
} from "../data";
import { 
  Pi5TelemetryPoint, 
  NpuAlertGovernorConfig, 
  NpuOverloadAlertIncident,
  PushNotificationRecord,
  DetectionAlert
} from "../types";
import { playTelemetryWarningAlert } from "../utils/audio";

interface SystemHealthDashboardProps {
  batteryVoltage?: number;
  batteryThreshold?: number;
  batteryChemistry?: "12v_lifepo4" | "12v_lead_acid" | "3s_li_ion" | "5v_direct";
  alerts?: DetectionAlert[];
  onThresholdChange?: (newThreshold: number) => void;
  onNavigateToNotifications?: () => void;
  onPushNotificationCreated?: (notif: PushNotificationRecord) => void;
  onSelectAlert?: (alert: DetectionAlert) => void;
}

export const SystemHealthDashboard: React.FC<SystemHealthDashboardProps> = ({
  batteryVoltage = 12.6,
  batteryThreshold = 11.8,
  batteryChemistry = "12v_lifepo4",
  alerts = [],
  onThresholdChange,
  onNavigateToNotifications,
  onPushNotificationCreated,
  onSelectAlert
}) => {
  const [telemetryHistory, setTelemetryHistory] = useState<Pi5TelemetryPoint[]>(() => 
    generateInitialTelemetryHistory(30)
  );
  const [stressMode, setStressMode] = useState<"normal" | "inference_heavy" | "thermal_spike" | "eco_low_power">("normal");
  const [isLiveStreaming, setIsLiveStreaming] = useState<boolean>(true);
  const [pollingIntervalMs, setPollingIntervalMs] = useState<number>(2000);
  const [activeTab, setActiveTab] = useState<"overview" | "distribution" | "watchdog" | "battery" | "thermals" | "registers">("overview");

  // NPU Overload Watchdog & Alert System State
  const [governorConfig, setGovernorConfig] = useState<NpuAlertGovernorConfig>({
    thresholdPercent: 90,
    consecutiveCyclesRequired: 3,
    autoPushNotification: true,
    autoMitigate: false,
    audioAlarmEnabled: true
  });
  const [consecutiveOverloadCycles, setConsecutiveOverloadCycles] = useState<number>(0);
  const [activeIncident, setActiveIncident] = useState<NpuOverloadAlertIncident | null>(null);
  const [incidentHistory, setIncidentHistory] = useState<NpuOverloadAlertIncident[]>([]);
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);
  const [isSimulatingSpike, setIsSimulatingSpike] = useState<boolean>(false);
  const hasFiredForCurrentStreak = useRef<boolean>(false);

  // Battery Voltage Low Warning Toast State
  const [showBatteryLowToast, setShowBatteryLowToast] = useState<boolean>(false);
  const [simulatedBatteryVoltage, setSimulatedBatteryVoltage] = useState<number | null>(null);
  const effectiveBatteryVoltage = simulatedBatteryVoltage ?? batteryVoltage;
  const lastFiredBatteryVoltageRef = useRef<number | null>(null);

  // Monitor battery voltage vs threshold to trigger App-Level Warning Toast
  useEffect(() => {
    if (effectiveBatteryVoltage < batteryThreshold) {
      // If we haven't fired for this drop episode or voltage dropped even further (> 0.2V delta)
      if (
        lastFiredBatteryVoltageRef.current === null || 
        effectiveBatteryVoltage < lastFiredBatteryVoltageRef.current - 0.2
      ) {
        setShowBatteryLowToast(true);
        lastFiredBatteryVoltageRef.current = effectiveBatteryVoltage;
      }
    } else {
      // Voltage recovered above threshold
      lastFiredBatteryVoltageRef.current = null;
    }
  }, [effectiveBatteryVoltage, batteryThreshold]);

  // Helper to dispatch push notification
  const dispatchNpuPushNotification = async (load: number, cycles: number, temp: number, incidentId: string) => {
    try {
      const res = await fetch("/api/notifications/dispatch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: `🚨 Hailo-8L NPU Overload (${load.toFixed(0)}% Load)`,
          body: `Inference overload sustained for ${cycles} consecutive cycles. Core Temp: ${temp}°C. Risk of RTSP frame loss.`,
          priority: "high",
          channel: "system_telemetry",
          payload: {
            species: `Hailo-8L NPU (13 TOPS) • Incident ${incidentId}`,
            dangerLevel: "CRITICAL_OVERLOAD",
            zone: "Raspberry Pi 5 Core Bus",
            confidence: Math.min(0.99, load / 100),
            actionRequired: "Engage dynamic load shedding or throttle inference queue."
          }
        })
      });
      const data = await res.json();
      if (data.notification && onPushNotificationCreated) {
        onPushNotificationCreated(data.notification);
      }
    } catch (e) {
      console.warn("FCM Push notification error:", e);
    }
  };

  // Real-time telemetry generator loop
  useEffect(() => {
    if (!isLiveStreaming) return;

    const interval = setInterval(() => {
      setTelemetryHistory(prev => {
        const last = prev[prev.length - 1] || {
          timestamp: Date.now(),
          cpuTempC: 52.0,
          npuTempC: 48.0,
          cpuUsagePercent: 40.0,
          memoryUsedMB: 3450,
          memoryTotalMB: 8192,
          memoryUsagePercent: 42.1,
          npuLoadPercent: 45.0,
          pcieBandwidthMBs: 280,
          fanSpeedRpm: 2400,
          voltageV: 5.12,
          powerWatts: 6.2,
          throttledHex: "0x0"
        };

        const now = Date.now();
        const timeLabel = new Date(now).toLocaleTimeString([], { 
          hour: "2-digit", 
          minute: "2-digit", 
          second: "2-digit" 
        });

        // Parameters adjusted by stress mode
        let targetCpuTemp = 53.0;
        let targetNpuTemp = 49.0;
        let targetCpuUsage = 38.0;
        let targetMemoryMB = 3450;
        let targetNpuLoad = 44.0;
        let targetPcie = 290;
        let throttledCode = "0x0";

        if (stressMode === "inference_heavy") {
          targetCpuTemp = 64.5;
          targetNpuTemp = 61.0;
          targetCpuUsage = 76.0;
          targetMemoryMB = 4850;
          targetNpuLoad = 88.0;
          targetPcie = 520;
        } else if (stressMode === "thermal_spike") {
          targetCpuTemp = 83.2; // Soft limit 80°C + hard 82°C
          targetNpuTemp = 74.5;
          targetCpuUsage = 94.0;
          targetMemoryMB = 5890;
          targetNpuLoad = 96.0;
          targetPcie = 640;
          throttledCode = "0x20004"; // Throttling active + ARM freq capped
        } else if (stressMode === "eco_low_power") {
          targetCpuTemp = 41.5;
          targetNpuTemp = 38.0;
          targetCpuUsage = 18.0;
          targetMemoryMB = 2200;
          targetNpuLoad = 12.0;
          targetPcie = 95;
        }

        // Add smooth delta transition towards targets + natural jitter
        const lerp = (curr: number, target: number, speed: number) => curr + (target - curr) * speed;
        const newCpuTemp = parseFloat((lerp(last.cpuTempC, targetCpuTemp, 0.2) + (Math.random() * 0.8 - 0.4)).toFixed(1));
        const newNpuTemp = parseFloat((lerp(last.npuTempC, targetNpuTemp, 0.2) + (Math.random() * 0.6 - 0.3)).toFixed(1));
        const newCpuUsage = Math.max(5, Math.min(100, parseFloat((lerp(last.cpuUsagePercent, targetCpuUsage, 0.25) + (Math.random() * 4.0 - 2.0)).toFixed(1))));
        const newMemoryMB = Math.max(1024, Math.min(8000, Math.round(lerp(last.memoryUsedMB, targetMemoryMB, 0.15) + (Math.random() * 30 - 15))));
        const newNpuLoad = Math.max(0, Math.min(100, parseFloat((lerp(last.npuLoadPercent, targetNpuLoad, 0.3) + (Math.random() * 4.0 - 2.0)).toFixed(1))));
        const newPcie = Math.max(40, parseFloat((lerp(last.pcieBandwidthMBs, targetPcie, 0.25) + (Math.random() * 20 - 10)).toFixed(0)));

        // Active Cooler Fan curve calculation
        let fanRpm = 0;
        if (newCpuTemp >= 75) {
          fanRpm = Math.floor(6500 + (newCpuTemp - 75) * 200 + Math.random() * 100);
        } else if (newCpuTemp >= 67.5) {
          fanRpm = Math.floor(5000 + (newCpuTemp - 67.5) * 150 + Math.random() * 80);
        } else if (newCpuTemp >= 60) {
          fanRpm = Math.floor(3500 + (newCpuTemp - 60) * 120 + Math.random() * 60);
        } else if (newCpuTemp >= 50) {
          fanRpm = Math.floor(1800 + (newCpuTemp - 50) * 100 + Math.random() * 40);
        }

        const newPoint: Pi5TelemetryPoint = {
          timestamp: now,
          timeLabel,
          cpuTempC: newCpuTemp,
          npuTempC: newNpuTemp,
          cpuUsagePercent: newCpuUsage,
          memoryUsedMB: newMemoryMB,
          memoryTotalMB: 8192,
          memoryUsagePercent: parseFloat(((newMemoryMB / 8192) * 100).toFixed(1)),
          npuLoadPercent: newNpuLoad,
          pcieBandwidthMBs: newPcie,
          fanSpeedRpm: Math.min(8000, fanRpm),
          voltageV: parseFloat((5.12 + (Math.random() * 0.03 - 0.015)).toFixed(2)),
          powerWatts: parseFloat((4.5 + (newNpuLoad / 100) * 3.4 + (newCpuUsage / 100) * 2.3).toFixed(2)),
          throttledHex: throttledCode
        };

        // Automated NPU Overload Watchdog Check
        if (newNpuLoad >= governorConfig.thresholdPercent) {
          setConsecutiveOverloadCycles(prevStreak => {
            const nextStreak = prevStreak + 1;
            if (nextStreak >= governorConfig.consecutiveCyclesRequired) {
              if (!hasFiredForCurrentStreak.current) {
                hasFiredForCurrentStreak.current = true;
                setIsBannerDismissed(false);

                const incidentId = `NPU-${Date.now().toString().slice(-4)}`;
                const newIncident: NpuOverloadAlertIncident = {
                  id: incidentId,
                  timestamp: new Date().toLocaleTimeString(),
                  loadPercent: newNpuLoad,
                  consecutiveCycles: nextStreak,
                  npuTempC: newNpuTemp,
                  status: "active",
                  actionTaken: "Automated 3-Cycle Threshold Warning & FCM Broadcast"
                };

                setActiveIncident(newIncident);
                setIncidentHistory(hist => [newIncident, ...hist.slice(0, 19)]);

                if (governorConfig.audioAlarmEnabled) {
                  playTelemetryWarningAlert();
                }

                if (governorConfig.autoPushNotification) {
                  dispatchNpuPushNotification(newNpuLoad, nextStreak, newNpuTemp, incidentId);
                }

                if (governorConfig.autoMitigate) {
                  setTimeout(() => {
                    setStressMode("normal");
                  }, 1200);
                }
              } else {
                // Update active incident cycles count
                setActiveIncident(curr => curr ? {
                  ...curr,
                  consecutiveCycles: nextStreak,
                  loadPercent: Math.max(curr.loadPercent, newNpuLoad),
                  npuTempC: Math.max(curr.npuTempC, newNpuTemp)
                } : null);
              }
            }
            return nextStreak;
          });
        } else {
          // Load returned to safe levels
          setConsecutiveOverloadCycles(0);
          if (hasFiredForCurrentStreak.current) {
            hasFiredForCurrentStreak.current = false;
            setActiveIncident(curr => curr ? {
              ...curr,
              status: "mitigated",
              actionTaken: `Load normalized to ${newNpuLoad.toFixed(1)}%`
            } : null);
          }
        }

        const updated = [...prev.slice(1), newPoint];
        return updated;
      });
    }, pollingIntervalMs);

    return () => clearInterval(interval);
  }, [isLiveStreaming, pollingIntervalMs, stressMode, governorConfig]);

  const summary = useMemo(() => 
    computeSystemHealthSummary(telemetryHistory, stressMode),
    [telemetryHistory, stressMode]
  );

  const handleExportCsv = () => {
    const headers = "timestamp,timeLabel,cpuTempC,npuTempC,cpuUsagePercent,memoryUsedMB,npuLoadPercent,pcieBandwidthMBs,fanSpeedRpm,powerWatts,throttledHex\n";
    const rows = telemetryHistory.map(p => 
      `${p.timestamp},"${p.timeLabel}",${p.cpuTempC},${p.npuTempC},${p.cpuUsagePercent},${p.memoryUsedMB},${p.npuLoadPercent},${p.pcieBandwidthMBs},${p.fanSpeedRpm},${p.powerWatts},"${p.throttledHex}"`
    ).join("\n");

    const blob = new Blob([headers + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `kaybit_pi5_telemetry_${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Mitigation handler
  const handleMitigateLoad = () => {
    setStressMode("normal");
    setConsecutiveOverloadCycles(0);
    hasFiredForCurrentStreak.current = false;
    setActiveIncident(prev => prev ? { 
      ...prev, 
      status: "mitigated", 
      actionTaken: "Dynamic Load Shedding & Queue Throttle Applied" 
    } : null);

    setTelemetryHistory(prev => {
      const last = prev[prev.length - 1];
      return [
        ...prev.slice(1),
        {
          ...last,
          timestamp: Date.now(),
          timeLabel: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          npuLoadPercent: 44.0,
          npuTempC: 52.0,
          cpuUsagePercent: 36.0,
          powerWatts: 5.6
        }
      ];
    });
  };

  // Acknowledge alert handler
  const handleAcknowledgeAlert = () => {
    setActiveIncident(prev => prev ? {
      ...prev,
      status: "acknowledged",
      actionTaken: "Acknowledged by Operator"
    } : null);
    setIsBannerDismissed(true);
  };

  // Test simulation of 3-cycle overload
  const handleTriggerTestSimulation = () => {
    setIsSimulatingSpike(true);
    setStressMode("thermal_spike");
    
    // Inject 3 high-load telemetry points immediately
    const now = Date.now();
    setTelemetryHistory(prev => {
      const last = prev[prev.length - 1];
      const spikePoints: Pi5TelemetryPoint[] = [
        {
          ...last,
          timestamp: now - 4000,
          timeLabel: new Date(now - 4000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          npuLoadPercent: 92.4,
          npuTempC: 72.0,
          cpuTempC: 76.5,
          cpuUsagePercent: 88.0,
          powerWatts: 10.8
        },
        {
          ...last,
          timestamp: now - 2000,
          timeLabel: new Date(now - 2000).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          npuLoadPercent: 95.8,
          npuTempC: 74.2,
          cpuTempC: 79.1,
          cpuUsagePercent: 91.5,
          powerWatts: 11.6
        },
        {
          ...last,
          timestamp: now,
          timeLabel: new Date(now).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
          npuLoadPercent: 96.5,
          npuTempC: 75.8,
          cpuTempC: 81.4,
          cpuUsagePercent: 93.0,
          powerWatts: 12.2
        }
      ];
      return [...prev.slice(3), ...spikePoints];
    });

    setConsecutiveOverloadCycles(3);
    hasFiredForCurrentStreak.current = true;
    setIsBannerDismissed(false);

    const incidentId = `SIM-NPU-${Date.now().toString().slice(-4)}`;
    const simIncident: NpuOverloadAlertIncident = {
      id: incidentId,
      timestamp: new Date().toLocaleTimeString(),
      loadPercent: 96.5,
      consecutiveCycles: 3,
      npuTempC: 75.8,
      status: "active",
      actionTaken: "Simulated 3-Cycle NPU Overload (95%+) Test Triggered"
    };

    setActiveIncident(simIncident);
    setIncidentHistory(hist => [simIncident, ...hist.slice(0, 19)]);

    if (governorConfig.audioAlarmEnabled) {
      playTelemetryWarningAlert();
    }

    if (governorConfig.autoPushNotification) {
      dispatchNpuPushNotification(96.5, 3, 75.8, incidentId);
    }

    setTimeout(() => {
      setIsSimulatingSpike(false);
    }, 4000);
  };

  const isAlertTriggered = consecutiveOverloadCycles >= governorConfig.consecutiveCyclesRequired;
  const currentLatestPoint = telemetryHistory[telemetryHistory.length - 1] || {
    npuLoadPercent: 45.0,
    npuTempC: 48.0,
    cpuTempC: 52.0,
    pcieBandwidthMBs: 280
  };

  // Sparkline data mappings
  const cpuTempData = telemetryHistory.map(p => ({ timestamp: p.timestamp, value: p.cpuTempC, timeLabel: p.timeLabel }));
  const npuTempData = telemetryHistory.map(p => ({ timestamp: p.timestamp, value: p.npuTempC, timeLabel: p.timeLabel }));
  const cpuUsageData = telemetryHistory.map(p => ({ timestamp: p.timestamp, value: p.cpuUsagePercent, timeLabel: p.timeLabel }));
  const memoryUsageData = telemetryHistory.map(p => ({ timestamp: p.timestamp, value: p.memoryUsagePercent, timeLabel: p.timeLabel }));
  const npuLoadData = telemetryHistory.map(p => ({ timestamp: p.timestamp, value: p.npuLoadPercent, timeLabel: p.timeLabel }));
  const pcieBandwidthData = telemetryHistory.map(p => ({ timestamp: p.timestamp, value: p.pcieBandwidthMBs, timeLabel: p.timeLabel }));
  const fanRpmData = telemetryHistory.map(p => ({ timestamp: p.timestamp, value: p.fanSpeedRpm, timeLabel: p.timeLabel }));
  const powerData = telemetryHistory.map(p => ({ timestamp: p.timestamp, value: p.powerWatts, timeLabel: p.timeLabel }));

  return (
    <div className="space-y-6 font-mono relative">
      {/* 🚨 App-Level Warning Toast for Battery Voltage Drop Below Threshold */}
      {showBatteryLowToast && effectiveBatteryVoltage < batteryThreshold && (
        <BatteryWarningToast
          batteryVoltage={effectiveBatteryVoltage}
          batteryThreshold={batteryThreshold}
          batteryChemistry={batteryChemistry}
          onDismiss={() => setShowBatteryLowToast(false)}
          onAdjustThreshold={onThresholdChange}
          onViewBatteryDetails={() => setActiveTab("battery")}
        />
      )}

      {/* 🚨 Automated NPU Overload Top-Level Warning Banner (Triggers when sustained >= 3 cycles) */}
      {isAlertTriggered && !isBannerDismissed && (
        <NpuOverloadAlertBanner
          consecutiveCycles={consecutiveOverloadCycles}
          currentNpuLoad={currentLatestPoint.npuLoadPercent}
          currentNpuTemp={currentLatestPoint.npuTempC}
          thresholdPercent={governorConfig.thresholdPercent}
          activeIncident={activeIncident}
          onMitigateLoad={handleMitigateLoad}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onDismissBanner={() => setIsBannerDismissed(true)}
          onNavigateToNotifications={onNavigateToNotifications}
        />
      )}

      {/* Hero Header & Telemetry Control Bar */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 shadow-xl relative overflow-hidden backdrop-blur-md">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-lg font-bold text-slate-100">Raspberry Pi 5 & Hailo-8L System Health</h2>
                  <span className={`px-2 py-0.5 text-xs font-mono font-bold rounded border ${
                    isAlertTriggered
                      ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse"
                      : summary.thermalThrottlingActive 
                      ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse" 
                      : summary.cpuTempCurrentC >= 70 
                      ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                      : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  }`}>
                    {isAlertTriggered 
                      ? `🚨 NPU OVERLOAD (${consecutiveOverloadCycles} CYCLES)` 
                      : summary.thermalThrottlingActive 
                      ? "⚠️ THERMALLY THROTTLED (82°C+)" 
                      : summary.cpuTempCurrentC >= 70 
                      ? "⚡ ELEVATED THERMALS" 
                      : "✓ NOMINAL THERMAL ENVELOPE"}
                  </span>
                </div>
                <p className="text-xs text-slate-400 font-mono">
                  Broadcom BCM2712 Quad Cortex-A76 @ 2.4GHz • Hailo-8L M.2 AI HAT (13 TOPS) • Active PWM Cooling
                </p>
              </div>
            </div>
          </div>

          {/* Quick Action Controls */}
          <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto">
            {/* Live Stream Pause/Play */}
            <button
              onClick={() => setIsLiveStreaming(!isLiveStreaming)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center space-x-1.5 border transition-all cursor-pointer ${
                isLiveStreaming 
                  ? "bg-emerald-500/15 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/25" 
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {isLiveStreaming ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              <span>{isLiveStreaming ? "Streaming Live (2s)" : "Paused"}</span>
            </button>

            {/* Stress Simulator Selector */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => setStressMode("normal")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  stressMode === "normal" 
                    ? "bg-amber-500 text-slate-950 font-bold" 
                    : "text-slate-400 hover:text-white"
                }`}
                title="Normal 4-camera RTSP surveillance"
              >
                Normal
              </button>
              <button
                onClick={() => setStressMode("inference_heavy")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  stressMode === "inference_heavy" 
                    ? "bg-amber-500 text-slate-950 font-bold" 
                    : "text-slate-400 hover:text-white"
                }`}
                title="Heavy multi-object inference burst"
              >
                Heavy AI
              </button>
              <button
                onClick={() => setStressMode("thermal_spike")}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center space-x-1 cursor-pointer ${
                  stressMode === "thermal_spike" 
                    ? "bg-red-500 text-white font-bold animate-pulse" 
                    : "text-red-400 hover:text-red-300"
                }`}
                title="Simulate 82°C thermal throttling condition"
              >
                <Flame className="w-3 h-3" />
                <span>Thermal Spike</span>
              </button>
              <button
                onClick={() => setStressMode("eco_low_power")}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  stressMode === "eco_low_power" 
                    ? "bg-amber-500 text-slate-950 font-bold" 
                    : "text-slate-400 hover:text-white"
                }`}
                title="Low power solar battery conservation"
              >
                Eco Standby
              </button>
            </div>

            {/* Low Voltage Drop Simulator */}
            <div className="flex items-center space-x-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs font-mono">
              <button
                onClick={() => {
                  const dropVoltage = parseFloat((batteryThreshold - 0.45).toFixed(2));
                  setSimulatedBatteryVoltage(dropVoltage);
                  setShowBatteryLowToast(true);
                }}
                className={`px-2.5 py-1 rounded-md transition-colors flex items-center space-x-1 cursor-pointer ${
                  effectiveBatteryVoltage < batteryThreshold 
                    ? "bg-red-500/30 text-red-300 border border-red-500/50 font-bold animate-pulse" 
                    : "text-amber-400 hover:text-amber-300"
                }`}
                title={`Simulate battery voltage drop below ${batteryThreshold}V threshold`}
              >
                <Battery className="w-3 h-3" />
                <span>Simulate Low Volt</span>
              </button>
              {simulatedBatteryVoltage !== null && (
                <button
                  onClick={() => {
                    setSimulatedBatteryVoltage(null);
                    setShowBatteryLowToast(false);
                  }}
                  className="px-2 py-1 rounded-md text-slate-400 hover:text-white text-[10px] cursor-pointer"
                  title="Reset to live battery telemetry"
                >
                  Reset
                </button>
              )}
            </div>

            {/* Export CSV */}
            <button
              onClick={handleExportCsv}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors cursor-pointer"
              title="Download raw sensor history as CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export CSV</span>
            </button>
          </div>
        </div>

        {/* Quick Diagnostic Metrics Ribbon */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 mt-4 pt-4 border-t border-slate-800/80 font-mono">
          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase flex items-center space-x-1">
              <Thermometer className="w-3 h-3 text-red-400" />
              <span>CPU Core Temp</span>
            </div>
            <div className={`text-base font-bold ${summary.cpuTempCurrentC >= 80 ? "text-red-400" : summary.cpuTempCurrentC >= 65 ? "text-amber-400" : "text-emerald-400"}`}>
              {summary.cpuTempCurrentC}°C
            </div>
            <div className="text-[10px] text-slate-500">Peak: {summary.cpuTempPeakC}°C</div>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase flex items-center space-x-1">
              <Fan className="w-3 h-3 text-blue-400" />
              <span>Active Cooler Fan</span>
            </div>
            <div className="text-base font-bold text-blue-400">
              {summary.fanRpm} <span className="text-xs text-slate-400 font-normal">RPM</span>
            </div>
            <div className="text-[10px] text-slate-500">Duty: {summary.fanDutyPercent}% PWM</div>
          </div>

          <div className={`p-2.5 rounded-xl border ${
            isAlertTriggered 
              ? "bg-red-950/50 border-red-500/60 shadow-lg shadow-red-950/50 animate-pulse" 
              : "bg-slate-950/80 border-slate-800/80"
          }`}>
            <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <Cpu className="w-3 h-3 text-purple-400" />
                <span>Hailo-8L NPU</span>
              </div>
              {consecutiveOverloadCycles > 0 && (
                <span className="text-[9px] text-red-400 font-bold">{consecutiveOverloadCycles}/3 Cycles</span>
              )}
            </div>
            <div className={`text-base font-bold ${
              currentLatestPoint.npuLoadPercent >= 90 ? "text-red-400" : "text-purple-400"
            }`}>
              {currentLatestPoint.npuLoadPercent.toFixed(1)}% <span className="text-xs text-slate-400 font-normal">Load</span>
            </div>
            <div className="text-[10px] text-slate-500">{summary.npuTempC}°C • {summary.npuOpsPerSec} TOPS</div>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase flex items-center space-x-1">
              <HardDrive className="w-3 h-3 text-cyan-400" />
              <span>RAM Allocation</span>
            </div>
            <div className="text-base font-bold text-cyan-400">
              {summary.memoryPercent}%
            </div>
            <div className="text-[10px] text-slate-500">DMA CMA Pool: 512MB</div>
          </div>

          <div className={`p-2.5 rounded-xl border ${
            effectiveBatteryVoltage < batteryThreshold
              ? "bg-red-950/60 border-red-500/70 shadow-lg shadow-red-950/50 animate-pulse"
              : "bg-slate-950/80 border-slate-800/80"
          }`}>
            <div className="text-[10px] text-slate-400 uppercase flex items-center justify-between">
              <div className="flex items-center space-x-1">
                <BatteryCharging className={`w-3 h-3 ${effectiveBatteryVoltage < batteryThreshold ? "text-red-400" : "text-emerald-400"}`} />
                <span>Battery Bus Rail</span>
              </div>
              {effectiveBatteryVoltage < batteryThreshold && (
                <span className="text-[9px] text-red-400 font-bold">LOW VOLT</span>
              )}
            </div>
            <div className={`text-base font-bold ${
              effectiveBatteryVoltage < batteryThreshold ? "text-red-400" : "text-emerald-400"
            }`}>
              {effectiveBatteryVoltage.toFixed(2)}V
            </div>
            <div className="text-[10px] text-slate-500">Cutoff: {batteryThreshold.toFixed(1)}V</div>
          </div>

          <div className="p-2.5 bg-slate-950/80 rounded-xl border border-slate-800/80">
            <div className="text-[10px] text-slate-400 uppercase flex items-center space-x-1">
              <Zap className="w-3 h-3 text-amber-400" />
              <span>Power Delivery</span>
            </div>
            <div className="text-base font-bold text-amber-400">
              {summary.powerSupplyVoltageV}V <span className="text-xs text-slate-400 font-normal">({summary.currentDrawA}A)</span>
            </div>
            <div className="text-[10px] text-slate-500">5.1V Rail Stable</div>
          </div>

          <div className={`p-2.5 rounded-xl border ${
            isAlertTriggered 
              ? "bg-red-500/20 border-red-500/50 text-red-300" 
              : "bg-slate-950/80 border-slate-800/80 text-slate-300"
          }`}>
            <div className="text-[10px] text-slate-400 uppercase flex items-center space-x-1">
              <BellRing className="w-3 h-3 text-amber-400" />
              <span>NPU Alert Watchdog</span>
            </div>
            <div className="text-base font-bold">
              {isAlertTriggered ? "🚨 TRIGGERED" : consecutiveOverloadCycles > 0 ? `⚠️ ${consecutiveOverloadCycles}/3 Streak` : "✓ NOMINAL"}
            </div>
            <div className="text-[10px] text-slate-500">Auto Push & Sound</div>
          </div>
        </div>

        {/* Section Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-slate-800 text-xs font-mono">
          <span className="text-slate-400">View Section:</span>
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer ${
              activeTab === "overview"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            📊 Comprehensive Health View
          </button>
          <button
            onClick={() => setActiveTab("distribution")}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "distribution"
                ? "bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>📈 Temporal Alert Distribution (Recharts 24h)</span>
          </button>
          <button
            onClick={() => setActiveTab("watchdog")}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "watchdog"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold"
                : isAlertTriggered 
                ? "bg-red-500/15 text-red-300 border-red-500/30 animate-pulse font-bold"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            <span>🚨 NPU Overload Watchdog (3-Cycle Auto-Alert)</span>
            {isAlertTriggered && (
              <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
            )}
          </button>
          <button
            onClick={() => setActiveTab("battery")}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "battery"
                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            <BatteryCharging className="w-3.5 h-3.5" />
            <span>24h Battery Degradation & Solar (D3)</span>
          </button>
          <button
            onClick={() => setActiveTab("thermals")}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "thermals"
                ? "bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Real-Time Sensor Sparklines</span>
          </button>
          <button
            onClick={() => setActiveTab("registers")}
            className={`px-3 py-1.5 rounded-lg border transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeTab === "registers"
                ? "bg-purple-500/20 text-purple-300 border-purple-500/40 font-bold"
                : "bg-slate-950 text-slate-400 border-slate-800 hover:text-slate-200"
            }`}
          >
            <Terminal className="w-3.5 h-3.5" />
            <span>Registers & Linux Sysfs</span>
          </button>
        </div>
      </div>

      {/* Temporal Alert Distribution Chart (Recharts) */}
      {(activeTab === "overview" || activeTab === "distribution") && (
        <TemporalAlertDistributionChart
          alerts={alerts}
          onSelectAlert={onSelectAlert}
        />
      )}

      {/* NPU Overload Watchdog & Automation Alert Component */}
      {(activeTab === "overview" || activeTab === "watchdog") && (
        <NpuOverloadAlertSystem
          currentNpuLoad={currentLatestPoint.npuLoadPercent}
          currentNpuTemp={currentLatestPoint.npuTempC}
          currentCpuTemp={currentLatestPoint.cpuTempC}
          currentPcieMBs={currentLatestPoint.pcieBandwidthMBs}
          consecutiveCycles={consecutiveOverloadCycles}
          governorConfig={governorConfig}
          activeIncident={activeIncident}
          incidentHistory={incidentHistory}
          isSimulatingSpike={isSimulatingSpike}
          onUpdateGovernorConfig={(newCfg) => setGovernorConfig(prev => ({ ...prev, ...newCfg }))}
          onTriggerTestSimulation={handleTriggerTestSimulation}
          onMitigateLoad={handleMitigateLoad}
          onAcknowledgeAlert={handleAcknowledgeAlert}
          onNavigateToNotifications={onNavigateToNotifications}
        />
      )}

      {/* 24-Hour Battery Voltage Degradation Visualization Component */}
      {(activeTab === "overview" || activeTab === "battery") && (
        <Battery24hDegradationChart
          currentVoltage={effectiveBatteryVoltage}
          thresholdVoltage={batteryThreshold}
          initialChemistry={batteryChemistry}
          onThresholdChange={onThresholdChange}
        />
      )}

      {/* D3-Powered Real-Time Sparkline Grid */}
      {(activeTab === "overview" || activeTab === "thermals") && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-200 font-mono flex items-center space-x-2">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span>Raspberry Pi 5 Sensor Time-Series Visualizer (D3 Interpolated Sparklines)</span>
            </h3>
            <span className="text-xs font-mono text-slate-400">Live 30-sample sliding window</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* 1. CPU Core Thermal Sparkline */}
            <D3Sparkline
              data={cpuTempData}
              title="SoC CPU Temperature (°C)"
              color="#ef4444"
              fillColor="#ef4444"
              unit="°C"
              threshold={80}
              thresholdLabel="80°C Soft Limit"
              minDomain={30}
              maxDomain={90}
              dangerAbove={true}
            />

            {/* 2. Hailo-8L NPU Thermal Sparkline */}
            <D3Sparkline
              data={npuTempData}
              title="Hailo-8L NPU Core Temp (°C)"
              color="#a855f7"
              fillColor="#a855f7"
              unit="°C"
              threshold={75}
              thresholdLabel="75°C NPU Cap"
              minDomain={25}
              maxDomain={85}
              dangerAbove={true}
            />

            {/* 3. PWM Fan RPM Sparkline */}
            <D3Sparkline
              data={fanRpmData}
              title="Active Cooler Fan Speed (RPM)"
              color="#38bdf8"
              fillColor="#38bdf8"
              unit=" RPM"
              minDomain={0}
              maxDomain={8000}
              valueFormatter={(v) => `${Math.round(v)} RPM`}
            />

            {/* 4. Memory Usage % Sparkline */}
            <D3Sparkline
              data={memoryUsageData}
              title="LPDDR4X Memory Usage (%)"
              color="#f59e0b"
              fillColor="#f59e0b"
              unit="%"
              threshold={85}
              thresholdLabel="85% High RAM Alert"
              minDomain={0}
              maxDomain={100}
              dangerAbove={true}
              valueFormatter={(v) => `${v.toFixed(1)}% (${((v / 100) * 8192).toFixed(0)}MB)`}
            />

            {/* 5. NPU Compute Load Sparkline */}
            <D3Sparkline
              data={npuLoadData}
              title="Hailo-8L NPU Compute Load (%)"
              color="#ec4899"
              fillColor="#ec4899"
              unit="%"
              minDomain={0}
              maxDomain={100}
              valueFormatter={(v) => `${v.toFixed(1)}%`}
            />

            {/* 6. PCIe Gen 3 Throughput Sparkline */}
            <D3Sparkline
              data={pcieBandwidthData}
              title="PCIe Gen 3.0 x1 Bus (MB/s)"
              color="#06b6d4"
              fillColor="#06b6d4"
              unit=" MB/s"
              minDomain={0}
              maxDomain={800}
              valueFormatter={(v) => `${v.toFixed(0)} MB/s`}
            />
          </div>
        </div>
      )}

      {/* Deep-Dive Diagnostics & Hardware Throttling Register */}
      {(activeTab === "overview" || activeTab === "registers") && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Hardware Throttling Bitmask Decoder (vcgencmd get_throttled) */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <h4 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider">
                Thermal & Power Throttling Status
              </h4>
            </div>
            <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
              vcgencmd: {summary.vcgencmdThrottledRaw}
            </span>
          </div>

          <div className="space-y-2.5 text-xs font-mono">
            {/* Bit 0: Under-voltage */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-300">Under-voltage Detected (Bit 0)</span>
              <span className={`px-2 py-0.5 rounded font-bold ${summary.underVoltageDetected ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-emerald-500/10 text-emerald-400"}`}>
                {summary.underVoltageDetected ? "FAULT (Active)" : "OK (5.12V)"}
              </span>
            </div>

            {/* Bit 1: Arm Frequency Capped */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-300">ARM Frequency Capped (Bit 1)</span>
              <span className={`px-2 py-0.5 rounded font-bold ${summary.armFreqCapped ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-emerald-500/10 text-emerald-400"}`}>
                {summary.armFreqCapped ? "CAPPED (1.5GHz)" : "MAX (2.4GHz)"}
              </span>
            </div>

            {/* Bit 2: Currently Throttled */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-300">Currently Throttled (Bit 2)</span>
              <span className={`px-2 py-0.5 rounded font-bold ${summary.thermalThrottlingActive ? "bg-red-500/20 text-red-400 border-red-500/30 animate-pulse" : "bg-emerald-500/10 text-emerald-400"}`}>
                {summary.thermalThrottlingActive ? "ACTIVE THROTTLE" : "NONE (Full Speed)"}
              </span>
            </div>

            {/* Bit 3: Soft Temperature Limit */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-300">Soft Temp Limit Active (Bit 3)</span>
              <span className={`px-2 py-0.5 rounded font-bold ${summary.cpuTempCurrentC >= 80 ? "bg-amber-500/20 text-amber-400 border-amber-500/30" : "bg-emerald-500/10 text-emerald-400"}`}>
                {summary.cpuTempCurrentC >= 80 ? "TRIGGERED (80°C)" : "NORMAL (<80°C)"}
              </span>
            </div>

            {/* Historical Events Flag */}
            <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-950 border border-slate-800/80">
              <span className="text-slate-300">Throttling Since Boot (Bit 18)</span>
              <span className={`px-2 py-0.5 rounded font-bold ${summary.thermalThrottlingEverOccurred ? "bg-amber-500/20 text-amber-400" : "bg-slate-800 text-slate-400"}`}>
                {summary.thermalThrottlingEverOccurred ? "Recorded 1x Event" : "0 Events"}
              </span>
            </div>
          </div>
        </div>

        {/* Quad Cortex-A76 Per-Core Loads & Memory CMA */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center space-x-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              <h4 className="text-xs font-bold font-mono text-slate-100 uppercase tracking-wider">
                Quad-Core Cortex-A76 Loads
              </h4>
            </div>
            <span className="text-[11px] font-mono text-emerald-400">2.40 GHz</span>
          </div>

          <div className="space-y-3 font-mono text-xs">
            {summary.coreLoads.map((load, index) => (
              <div key={index} className="space-y-1">
                <div className="flex justify-between text-slate-300 text-[11px]">
                  <span>Core {index}</span>
                  <span className={load > 85 ? "text-red-400 font-bold" : load > 60 ? "text-amber-400" : "text-emerald-400"}>
                    {load}%
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                  <div 
                    className={`h-full transition-all duration-500 rounded-full ${
                      load > 85 ? "bg-red-500" : load > 60 ? "bg-amber-500" : "bg-emerald-500"
                    }`}
                    style={{ width: `${load}%` }}
                  />
                </div>
              </div>
            ))}

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-[11px]">
              <div className="flex justify-between text-slate-400">
                <span>CMA Buffer (Hailo-8L DMA):</span>
                <span className="text-cyan-400">{summary.cmaPoolAllocatedMB} MB Dedicated</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Linux Swap File:</span>
                <span className="text-slate-200">{summary.swapUsedMB} MB / {summary.swapTotalMB} MB</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>MicroSD Endurance Wear:</span>
                <span className="text-emerald-400">{summary.sdCardWearPercent}% (Optimal)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Terminal Hardware Commands */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col font-mono text-xs shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2 mb-2">
            <div className="flex items-center space-x-2 text-slate-400">
              <Terminal className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px]">Live Pi 5 Sysfs / vcgencmd Feed</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400">LIVE</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 text-[11px] leading-relaxed text-slate-300 select-text max-h-56">
            <div className="text-slate-500">$ vcgencmd measure_temp</div>
            <div className="text-amber-300">temp={summary.cpuTempCurrentC}'C</div>
            
            <div className="text-slate-500 pt-1">$ vcgencmd get_throttled</div>
            <div className={summary.thermalThrottlingActive ? "text-red-400 font-bold" : "text-emerald-400"}>
              throttled={summary.vcgencmdThrottledRaw} {summary.thermalThrottlingActive ? "[CRITICAL_THROTTLE]" : "[CLEAN]"}
            </div>

            <div className="text-slate-500 pt-1">$ hailortcli monitor --power</div>
            <div className={currentLatestPoint.npuLoadPercent >= 90 ? "text-red-400 font-bold" : "text-purple-300"}>
              Hailo-8L: {currentLatestPoint.npuLoadPercent.toFixed(1)}% compute | {currentLatestPoint.npuTempC}'C | {currentLatestPoint.pcieBandwidthMBs}MB/s PCIe
            </div>

            <div className="text-slate-500 pt-1">$ cat /sys/devices/platform/cooling_fan/hwmon/hwmon2/pwm1</div>
            <div className="text-blue-300">pwm_val={Math.round((summary.fanDutyPercent / 100) * 255)}/255 ({summary.fanRpm} RPM)</div>

            <div className="text-slate-500 pt-1">$ free -m</div>
            <div className="text-slate-400">
              Mem: 8192 total, {summary.memoryUsedMB} used, {8192 - summary.memoryUsedMB} free, 512 cma
            </div>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
