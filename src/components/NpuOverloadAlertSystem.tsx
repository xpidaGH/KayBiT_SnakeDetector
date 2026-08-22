import React, { useState } from "react";
import { 
  Cpu, 
  ShieldAlert, 
  AlertTriangle, 
  BellRing, 
  CheckCircle2, 
  Volume2, 
  VolumeX, 
  Zap, 
  Flame, 
  RefreshCw, 
  Sliders, 
  Clock, 
  ExternalLink,
  ChevronRight,
  Sparkles,
  ShieldCheck,
  Smartphone,
  Gauge
} from "lucide-react";
import { NpuAlertGovernorConfig, NpuOverloadAlertIncident } from "../types";

interface NpuOverloadAlertSystemProps {
  currentNpuLoad: number;
  currentNpuTemp: number;
  currentCpuTemp: number;
  currentPcieMBs: number;
  consecutiveCycles: number;
  governorConfig: NpuAlertGovernorConfig;
  activeIncident: NpuOverloadAlertIncident | null;
  incidentHistory: NpuOverloadAlertIncident[];
  isSimulatingSpike: boolean;
  onUpdateGovernorConfig: (config: Partial<NpuAlertGovernorConfig>) => void;
  onTriggerTestSimulation: () => void;
  onMitigateLoad: () => void;
  onAcknowledgeAlert: () => void;
  onNavigateToNotifications?: () => void;
}

export const NpuOverloadAlertSystem: React.FC<NpuOverloadAlertSystemProps> = ({
  currentNpuLoad,
  currentNpuTemp,
  currentCpuTemp,
  currentPcieMBs,
  consecutiveCycles,
  governorConfig,
  activeIncident,
  incidentHistory,
  isSimulatingSpike,
  onUpdateGovernorConfig,
  onTriggerTestSimulation,
  onMitigateLoad,
  onAcknowledgeAlert,
  onNavigateToNotifications
}) => {
  const isOverThreshold = currentNpuLoad >= governorConfig.thresholdPercent;
  const isTriggered = consecutiveCycles >= governorConfig.consecutiveCyclesRequired;
  const [activeSubTab, setActiveSubTab] = useState<"governor" | "history">("governor");

  // Visual cycle steps
  const requiredCycles = governorConfig.consecutiveCyclesRequired;
  const cycleSteps = Array.from({ length: requiredCycles }, (_, i) => i + 1);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-5 space-y-6 backdrop-blur-md shadow-xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-xl border ${
            isTriggered 
              ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse" 
              : isOverThreshold 
              ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
              : "bg-purple-500/10 text-purple-400 border-purple-500/30"
          }`}>
            <ShieldAlert className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h3 className="text-base font-bold text-slate-100">Hailo-8L NPU Overload Watchdog & Automated Alert</h3>
              <span className={`px-2 py-0.5 text-[11px] font-mono font-bold rounded border ${
                isTriggered 
                  ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse" 
                  : isOverThreshold 
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/40" 
                  : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
              }`}>
                {isTriggered 
                  ? "🚨 ALERT ACTIVE (3+ CYCLES)" 
                  : isOverThreshold 
                  ? `⚠️ OVERLOAD ACCUMULATING (${consecutiveCycles}/${requiredCycles})` 
                  : "✓ NOMINAL INFERENCE"}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono">
              Monitors M.2 NPU 13 TOPS core load • Triggers FCM push & audio alarm if sustained &gt;{governorConfig.thresholdPercent}% for {requiredCycles} consecutive sampling cycles
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={onTriggerTestSimulation}
            disabled={isSimulatingSpike}
            className={`px-3 py-1.5 rounded-xl border text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
              isSimulatingSpike 
                ? "bg-red-500/30 text-red-300 border-red-500/50 animate-pulse" 
                : "bg-amber-500/15 text-amber-300 border-amber-500/30 hover:bg-amber-500/25"
            }`}
            title="Simulate 3 consecutive high-load inference cycles to test the automated alert"
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isSimulatingSpike ? "Simulating Overload..." : "Simulate 3-Cycle Overload (95%)"}</span>
          </button>

          {isTriggered && (
            <button
              onClick={onMitigateLoad}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Mitigate Load</span>
            </button>
          )}
        </div>
      </div>

      {/* Real-Time 3-Cycle Progression Meter */}
      <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-300 font-bold flex items-center space-x-1.5">
            <Gauge className="w-3.5 h-3.5 text-purple-400" />
            <span>Sustained Overload Cycle Progress (&gt;{governorConfig.thresholdPercent}% Threshold)</span>
          </span>
          <span className="text-slate-400">
            Current: <strong className={isOverThreshold ? "text-red-400" : "text-emerald-400"}>{currentNpuLoad.toFixed(1)}% Load</strong>
          </span>
        </div>

        {/* Step Progression Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {cycleSteps.map((cycleNum) => {
            const isCompleted = consecutiveCycles >= cycleNum;
            const isCurrent = isOverThreshold && consecutiveCycles === cycleNum - 1;
            const isAlertStep = cycleNum === requiredCycles;

            return (
              <div 
                key={cycleNum}
                className={`p-3 rounded-xl border transition-all ${
                  isCompleted 
                    ? isAlertStep 
                      ? "bg-red-950/40 border-red-500/60 shadow-lg shadow-red-950/50" 
                      : "bg-amber-950/30 border-amber-500/50"
                    : isCurrent 
                    ? "bg-slate-900 border-slate-700 animate-pulse" 
                    : "bg-slate-900/60 border-slate-800 opacity-60"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-mono font-bold text-slate-300">
                    Cycle {cycleNum} of {requiredCycles}
                  </span>
                  {isCompleted ? (
                    isAlertStep ? (
                      <span className="flex items-center space-x-1 text-[11px] font-mono font-bold text-red-400">
                        <AlertTriangle className="w-3.5 h-3.5 animate-bounce" />
                        <span>DISPATCHED</span>
                      </span>
                    ) : (
                      <span className="flex items-center space-x-1 text-[11px] font-mono font-bold text-amber-400">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>OVERLOAD</span>
                      </span>
                    )
                  ) : (
                    <span className="text-[10px] font-mono text-slate-500">PENDING</span>
                  )}
                </div>

                <div className="mt-2 text-[11px] font-mono text-slate-400">
                  {cycleNum === 1 && "Initial threshold breach detected"}
                  {cycleNum === 2 && "Sustained high compute drain verified"}
                  {cycleNum === requiredCycles && "Automated Push & Sound Alert Trigger"}
                </div>

                {/* Progress Bar within card */}
                <div className="w-full bg-slate-800 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isCompleted 
                        ? isAlertStep ? "bg-red-500" : "bg-amber-400" 
                        : "bg-slate-700"
                    }`}
                    style={{ width: isCompleted ? "100%" : "0%" }}
                  />
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Status Bar */}
        <div className="flex flex-wrap items-center justify-between pt-1 text-xs font-mono text-slate-400 border-t border-slate-800/60 gap-2">
          <div className="flex items-center space-x-3">
            <span>Core Temp: <strong className="text-slate-200">{currentNpuTemp}°C</strong></span>
            <span>CPU Temp: <strong className="text-slate-200">{currentCpuTemp}°C</strong></span>
            <span>PCIe Bus: <strong className="text-slate-200">{currentPcieMBs} MB/s</strong></span>
          </div>
          <div>
            {isTriggered ? (
              <span className="text-red-400 font-bold flex items-center space-x-1">
                <BellRing className="w-3 h-3 animate-pulse" />
                <span>Sustained Overload Active ({consecutiveCycles} cycles)</span>
              </span>
            ) : (
              <span className="text-slate-400">
                Auto-alert fires at <strong className="text-amber-400">{requiredCycles} consecutive cycles</strong>
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setActiveSubTab("governor")}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer ${
              activeSubTab === "governor"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            ⚙️ Watchdog Governor & Thresholds
          </button>
          <button
            onClick={() => setActiveSubTab("history")}
            className={`px-3 py-1 rounded-lg text-xs font-mono transition-all cursor-pointer flex items-center space-x-1.5 ${
              activeSubTab === "history"
                ? "bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            <Clock className="w-3 h-3" />
            <span>Incident Log History ({incidentHistory.length})</span>
          </button>
        </div>

        {onNavigateToNotifications && (
          <button
            onClick={onNavigateToNotifications}
            className="text-xs font-mono text-blue-400 hover:text-blue-300 flex items-center space-x-1 transition-colors cursor-pointer"
          >
            <Smartphone className="w-3 h-3" />
            <span>View FCM Push Delivery Logs</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Sub-Tab 1: Governor Controls */}
      {activeSubTab === "governor" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 font-mono">
          {/* Threshold Sliders */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-4">
            <h4 className="text-xs font-bold text-slate-200 uppercase flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-purple-400" />
              <span>Trigger Threshold Limits</span>
            </h4>

            {/* Load Threshold */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">NPU Load Trigger Threshold:</span>
                <span className="text-amber-400 font-bold">{governorConfig.thresholdPercent}%</span>
              </div>
              <input 
                type="range"
                min="75"
                max="98"
                step="1"
                value={governorConfig.thresholdPercent}
                onChange={(e) => onUpdateGovernorConfig({ thresholdPercent: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>75% (Sensitive)</span>
                <span>90% (Nominal SLA)</span>
                <span>98% (Critical Only)</span>
              </div>
            </div>

            {/* Consecutive Cycles Required */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-400">Consecutive Overload Cycles:</span>
                <span className="text-purple-400 font-bold">{governorConfig.consecutiveCyclesRequired} Cycles (~{governorConfig.consecutiveCyclesRequired * 2}s)</span>
              </div>
              <input 
                type="range"
                min="2"
                max="8"
                step="1"
                value={governorConfig.consecutiveCyclesRequired}
                onChange={(e) => onUpdateGovernorConfig({ consecutiveCyclesRequired: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500"
              />
              <div className="flex justify-between text-[10px] text-slate-500">
                <span>2 Cycles (Fast)</span>
                <span>3 Cycles (Recommended)</span>
                <span>8 Cycles (High Inertia)</span>
              </div>
            </div>
          </div>

          {/* Action Automation Switches */}
          <div className="p-4 bg-slate-950/70 rounded-xl border border-slate-800 space-y-3">
            <h4 className="text-xs font-bold text-slate-200 uppercase flex items-center space-x-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-400" />
              <span>Automated Dispatch & Mitigation Actions</span>
            </h4>

            {/* Push Notification Toggle */}
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:bg-slate-900/80 transition-colors">
              <div className="flex items-center space-x-2.5">
                <BellRing className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="text-xs font-bold text-slate-200">FCM Push Notification Dispatch</div>
                  <div className="text-[10px] text-slate-400">Broadcasts instant push to mobile patrol & dashboard</div>
                </div>
              </div>
              <input 
                type="checkbox"
                checked={governorConfig.autoPushNotification}
                onChange={(e) => onUpdateGovernorConfig({ autoPushNotification: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-blue-500 focus:ring-0 w-4 h-4 cursor-pointer"
              />
            </label>

            {/* Audio Alarm Toggle */}
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:bg-slate-900/80 transition-colors">
              <div className="flex items-center space-x-2.5">
                <Volume2 className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Web Audio Alert Beep</div>
                  <div className="text-[10px] text-slate-400">Synthesizes dual-tone warning buzzer on trigger</div>
                </div>
              </div>
              <input 
                type="checkbox"
                checked={governorConfig.audioAlarmEnabled}
                onChange={(e) => onUpdateGovernorConfig({ audioAlarmEnabled: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-amber-500 focus:ring-0 w-4 h-4 cursor-pointer"
              />
            </label>

            {/* Auto Mitigate Toggle */}
            <label className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 cursor-pointer hover:bg-slate-900/80 transition-colors">
              <div className="flex items-center space-x-2.5">
                <Zap className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-bold text-slate-200">Automated Dynamic Frame Throttle</div>
                  <div className="text-[10px] text-slate-400">Auto-drops non-essential FPS to stabilize thermals</div>
                </div>
              </div>
              <input 
                type="checkbox"
                checked={governorConfig.autoMitigate}
                onChange={(e) => onUpdateGovernorConfig({ autoMitigate: e.target.checked })}
                className="rounded bg-slate-800 border-slate-700 text-emerald-500 focus:ring-0 w-4 h-4 cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

      {/* Sub-Tab 2: Overload Incident History */}
      {activeSubTab === "history" && (
        <div className="space-y-3 font-mono">
          {incidentHistory.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-slate-800 text-slate-400 text-xs">
              <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2 opacity-80" />
              <div className="font-bold text-slate-300">No NPU Overload Incidents Recorded</div>
              <div className="text-slate-500 text-[11px] mt-1">
                Hailo-8L inference load has remained safely within thermal and compute boundaries.
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Incident ID</th>
                    <th className="p-3">Time</th>
                    <th className="p-3">Peak Load</th>
                    <th className="p-3">Cycles Sustained</th>
                    <th className="p-3">Core Temp</th>
                    <th className="p-3">Status</th>
                    <th className="p-3">Mitigation / Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-950/40">
                  {incidentHistory.map((incident) => (
                    <tr key={incident.id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="p-3 font-bold text-purple-300">{incident.id}</td>
                      <td className="p-3 text-slate-400">{incident.timestamp}</td>
                      <td className="p-3 font-bold text-red-400">{incident.loadPercent.toFixed(1)}%</td>
                      <td className="p-3 text-slate-300">{incident.consecutiveCycles} Cycles</td>
                      <td className="p-3 text-slate-300">{incident.npuTempC}°C</td>
                      <td className="p-3">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          incident.status === "active" 
                            ? "bg-red-500/20 text-red-400 border-red-500/40 animate-pulse" 
                            : incident.status === "mitigated" 
                            ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30" 
                            : "bg-blue-500/20 text-blue-400 border-blue-500/30"
                        }`}>
                          {incident.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="p-3 text-slate-400 text-[11px]">{incident.actionTaken || "FCM Broadcast Dispatched"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
