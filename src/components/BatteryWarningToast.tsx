import React, { useEffect, useState } from "react";
import { 
  BatteryWarning, 
  AlertTriangle, 
  X, 
  ChevronRight, 
  ShieldAlert, 
  Zap, 
  Volume2, 
  VolumeX, 
  RotateCcw,
  Sliders
} from "lucide-react";
import { playTelemetryWarningAlert } from "../utils/audio";

export interface AppLevelWarningToastProps {
  id?: string;
  title?: string;
  message?: string;
  batteryVoltage: number;
  batteryThreshold: number;
  batteryChemistry?: "12v_lifepo4" | "12v_lead_acid" | "3s_li_ion" | "5v_direct";
  onDismiss: () => void;
  onAdjustThreshold?: (newThreshold: number) => void;
  onViewBatteryDetails?: () => void;
  autoDismissTimeoutMs?: number;
  enableAudioWarning?: boolean;
}

export const BatteryWarningToast: React.FC<AppLevelWarningToastProps> = ({
  id = "battery-low-toast",
  title = "App-Level Warning: Battery Voltage Critical",
  message,
  batteryVoltage,
  batteryThreshold,
  batteryChemistry = "12v_lifepo4",
  onDismiss,
  onAdjustThreshold,
  onViewBatteryDetails,
  autoDismissTimeoutMs = 12000,
  enableAudioWarning = true
}) => {
  const [progress, setProgress] = useState(100);
  const [isMuted, setIsMuted] = useState(!enableAudioWarning);
  const [isExpanded, setIsExpanded] = useState(false);

  const voltageSagDelta = parseFloat((batteryThreshold - batteryVoltage).toFixed(2));
  const isCriticalDrop = voltageSagDelta >= 0.5;

  const chemistryLabelMap: Record<string, string> = {
    "12v_lifepo4": "12V 4S LiFePO4",
    "12v_lead_acid": "12V AGM Lead Acid",
    "3s_li_ion": "11.1V 3S Li-Ion",
    "5v_direct": "5V Direct Rail"
  };

  useEffect(() => {
    if (enableAudioWarning && !isMuted) {
      playTelemetryWarningAlert();
    }
  }, []);

  useEffect(() => {
    if (autoDismissTimeoutMs <= 0) return;
    const intervalTime = 100;
    const step = 100 / (autoDismissTimeoutMs / intervalTime);

    const timer = setInterval(() => {
      setProgress((prev) => {
        if (prev <= 0) {
          clearInterval(timer);
          onDismiss();
          return 0;
        }
        return prev - step;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [autoDismissTimeoutMs, onDismiss]);

  const defaultMessage = `Battery bus rail has dropped to ${batteryVoltage.toFixed(2)}V, below the defined system cutoff threshold of ${batteryThreshold.toFixed(2)}V (Δ -${Math.max(0.01, voltageSagDelta).toFixed(2)}V). Automated load-shedding is recommended to protect edge perimeter detection.`;

  return (
    <aside
      id={id}
      aria-label="Battery low voltage notification"
      aria-live="assertive"
      className="fixed top-20 right-4 z-50 max-w-md w-full sm:w-[420px] bg-slate-950/95 border-2 border-red-500/80 rounded-2xl shadow-2xl shadow-red-950/80 backdrop-blur-md overflow-hidden transition-all duration-300 animate-in fade-in slide-in-from-top-4"
    >
      {/* Visual pulse glow header line */}
      <div className="h-1.5 w-full bg-slate-800 relative overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-red-500 via-amber-400 to-red-600 transition-all duration-100 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-4 space-y-3 font-mono">
        {/* Top Header Badge & Controls */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center space-x-2">
            <div className="relative flex items-center justify-center p-2 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400">
              <BatteryWarning className="w-5 h-5 animate-pulse" />
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-red-500/20 text-red-300 border border-red-500/40">
                  App-Level Warning
                </span>
                <span className="text-[10px] text-slate-400">
                  Health Context
                </span>
              </div>
              <h4 className="text-xs sm:text-sm font-bold text-slate-100 mt-0.5 tracking-tight">
                {title}
              </h4>
            </div>
          </div>

          <div className="flex items-center space-x-1 shrink-0">
            <button
              onClick={() => {
                if (isMuted) {
                  playTelemetryWarningAlert();
                }
                setIsMuted(!isMuted);
              }}
              aria-label={isMuted ? "Unmute warning tone" : "Mute warning tone"}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 rounded-lg border border-slate-800 transition-colors"
              title={isMuted ? "Unmute alert" : "Mute alert"}
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5 text-amber-400" />}
            </button>
            <button
              onClick={onDismiss}
              aria-label="Dismiss battery warning toast"
              className="p-1.5 text-slate-400 hover:text-red-300 bg-slate-900 hover:bg-red-950/40 rounded-lg border border-slate-800 hover:border-red-500/30 transition-colors cursor-pointer"
              title="Dismiss warning"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Message body */}
        <p className="text-xs text-slate-300 leading-relaxed">
          {message || defaultMessage}
        </p>

        {/* Voltage Metrics Comparison Pill */}
        <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-900/90 rounded-xl border border-slate-800/90 text-center">
          <div className="p-1">
            <div className="text-[9px] text-slate-400 uppercase">Current Bus</div>
            <div className="text-sm font-bold text-red-400 flex items-center justify-center space-x-1 mt-0.5">
              <span>{batteryVoltage.toFixed(2)}V</span>
            </div>
          </div>
          <div className="p-1 border-x border-slate-800">
            <div className="text-[9px] text-slate-400 uppercase">Cutoff Limit</div>
            <div className="text-sm font-bold text-amber-300 mt-0.5">
              {batteryThreshold.toFixed(2)}V
            </div>
          </div>
          <div className="p-1">
            <div className="text-[9px] text-slate-400 uppercase">Pack Type</div>
            <div className="text-[11px] font-bold text-slate-200 mt-1 truncate" title={chemistryLabelMap[batteryChemistry] || batteryChemistry}>
              {chemistryLabelMap[batteryChemistry]?.split(" ")[1] || "Pack"}
            </div>
          </div>
        </div>

        {/* Expandable Technical Actions */}
        {isExpanded && (
          <div className="p-3 bg-slate-900/60 rounded-xl border border-slate-800/80 space-y-2 text-xs text-slate-300 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-1.5">
              <span>Under-Voltage Sag:</span>
              <span className="text-red-400 font-bold">-{Math.max(0.01, voltageSagDelta).toFixed(2)}V Below Threshold</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 border-b border-slate-800/80 pb-1.5">
              <span>Pack Severity:</span>
              <span className={isCriticalDrop ? "text-red-400 font-bold" : "text-amber-400 font-bold"}>
                {isCriticalDrop ? "CRITICAL (Depletion Risk)" : "WARNING (Sag Detected)"}
              </span>
            </div>

            {onAdjustThreshold && (
              <div className="pt-1.5 space-y-1.5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Quick Lower Threshold:</span>
                  <span className="text-cyan-400 font-bold">{(batteryVoltage - 0.2).toFixed(1)}V</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      const newThresh = parseFloat((batteryVoltage - 0.2).toFixed(1));
                      onAdjustThreshold(newThresh);
                    }}
                    className="flex-1 px-2.5 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 rounded-lg text-[10px] font-bold text-center cursor-pointer transition-colors"
                  >
                    Adjust Threshold to {(batteryVoltage - 0.2).toFixed(1)}V
                  </button>
                  <button
                    onClick={() => onAdjustThreshold(11.8)}
                    className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 rounded-lg text-[10px] text-center cursor-pointer transition-colors"
                  >
                    Reset (11.8V)
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between gap-2 pt-1">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="text-[11px] text-slate-400 hover:text-slate-200 flex items-center space-x-1 cursor-pointer transition-colors"
          >
            <Sliders className="w-3 h-3 text-amber-400" />
            <span>{isExpanded ? "Hide Details" : "Quick Actions"}</span>
          </button>

          <div className="flex items-center space-x-2">
            {onViewBatteryDetails && (
              <button
                onClick={() => {
                  onViewBatteryDetails();
                  onDismiss();
                }}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold border border-slate-700 hover:border-slate-600 flex items-center space-x-1 cursor-pointer transition-all"
              >
                <span>Battery Tab</span>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </button>
            )}
            <button
              onClick={onDismiss}
              className="px-3 py-1.5 bg-red-600/90 hover:bg-red-500 text-white rounded-lg text-xs font-bold shadow-md shadow-red-950/40 cursor-pointer transition-all"
            >
              Acknowledge
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
};
