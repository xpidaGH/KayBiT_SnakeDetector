import React from "react";
import { 
  AlertTriangle, 
  Zap, 
  CheckCircle2, 
  BellRing, 
  Flame, 
  ChevronRight, 
  X, 
  Volume2, 
  VolumeX, 
  Smartphone,
  ShieldAlert
} from "lucide-react";
import { NpuOverloadAlertIncident } from "../types";

interface NpuOverloadAlertBannerProps {
  consecutiveCycles: number;
  currentNpuLoad: number;
  currentNpuTemp: number;
  thresholdPercent: number;
  activeIncident: NpuOverloadAlertIncident | null;
  onMitigateLoad: () => void;
  onAcknowledgeAlert: () => void;
  onDismissBanner: () => void;
  onNavigateToNotifications?: () => void;
}

export const NpuOverloadAlertBanner: React.FC<NpuOverloadAlertBannerProps> = ({
  consecutiveCycles,
  currentNpuLoad,
  currentNpuTemp,
  thresholdPercent,
  activeIncident,
  onMitigateLoad,
  onAcknowledgeAlert,
  onDismissBanner,
  onNavigateToNotifications
}) => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-red-950/90 via-slate-900/95 to-amber-950/90 border-2 border-red-500/70 rounded-2xl p-4.5 shadow-2xl shadow-red-950/60 backdrop-blur-md animate-pulse font-mono">
      {/* Background Accent Glow */}
      <div className="absolute -right-10 -bottom-10 w-48 h-48 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 relative z-10">
        {/* Left Icon & Information */}
        <div className="flex items-start space-x-3.5">
          <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-xl text-red-400 shrink-0 animate-bounce">
            <ShieldAlert className="w-6 h-6" />
          </div>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-2 py-0.5 bg-red-500 text-slate-950 font-bold text-xs rounded uppercase tracking-wider">
                Automated System Alert
              </span>
              <h3 className="text-sm sm:text-base font-bold text-red-200">
                Hailo-8L NPU Inference Overload Sustained (&gt;{thresholdPercent}% for {consecutiveCycles} Cycles)
              </h3>
            </div>

            <p className="text-xs text-slate-300">
              NPU compute load saturated at <strong className="text-red-400 font-bold">{currentNpuLoad.toFixed(1)}%</strong> for <strong className="text-amber-300 font-bold">{consecutiveCycles} consecutive sampling cycles</strong> (~{(consecutiveCycles * 2).toFixed(0)}s). Core Temp: <strong className="text-slate-100">{currentNpuTemp}°C</strong>. Push alert dispatched to patrol devices.
            </p>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 pt-0.5">
              <span>Incident ID: <strong className="text-purple-300">{activeIncident?.id || "NPU-AUTO-ALERT"}</strong></span>
              <span>FCM Push: <strong className="text-emerald-400">Delivered (High Priority)</strong></span>
              <span>Frame Latency: <strong className="text-amber-400">High Risk</strong></span>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2 w-full lg:w-auto shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-800/80">
          <button
            onClick={onMitigateLoad}
            className="px-3.5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs rounded-xl flex items-center space-x-1.5 shadow-lg shadow-emerald-950/40 transition-all cursor-pointer"
            title="Immediately throttle inference or drop background frames to bring NPU load below 50%"
          >
            <Zap className="w-4 h-4" />
            <span>⚡ Instant Dynamic Mitigation</span>
          </button>

          {onNavigateToNotifications && (
            <button
              onClick={onNavigateToNotifications}
              className="px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-blue-300 border border-blue-500/40 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5" />
              <span>FCM Push Log</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}

          <button
            onClick={onAcknowledgeAlert}
            className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-bold text-xs rounded-xl flex items-center space-x-1.5 transition-all cursor-pointer"
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>Acknowledge</span>
          </button>

          <button
            onClick={onDismissBanner}
            className="p-2 bg-slate-800/60 hover:bg-slate-700 text-slate-400 hover:text-slate-200 rounded-xl transition-colors cursor-pointer"
            title="Dismiss warning banner"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
