import React from "react";
import { Shield, AlertTriangle, Moon, Sun, BellRing, VolumeX, Cpu, BookOpen, Smartphone, Radio, Activity, Battery, BatteryCharging, BatteryWarning, Zap } from "lucide-react";
import { SystemMetrics } from "../types";

interface NavbarProps {
  metrics: SystemMetrics | null;
  isNightVisionGlobal: boolean;
  onToggleNightVision: () => void;
  isContinuousSirenOn: boolean;
  onToggleSiren: () => void;
  activeTab: "monitor" | "alerts" | "zones" | "edge" | "health" | "notifications" | "roadmap" | "packaging";
  onSelectTab: (tab: "monitor" | "alerts" | "zones" | "edge" | "health" | "notifications" | "roadmap" | "packaging") => void;
  onOpenSimulator: () => void;
  onOpenUserGuide: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  metrics,
  isNightVisionGlobal,
  onToggleNightVision,
  isContinuousSirenOn,
  onToggleSiren,
  activeTab,
  onSelectTab,
  onOpenSimulator,
  onOpenUserGuide
}) => {
  const activeAlertCount = metrics?.activeAlertsCount || 0;
  const batteryVoltage = metrics?.edgeDevice?.battery_voltage ?? 12.6;
  const isLoadSheddingActive = metrics?.edgeDevice?.powerSaveModeActive ?? false;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-40 shadow-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onSelectTab("monitor")}>
            <div className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Shield className="w-5 h-5" />
              {activeAlertCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-3.5 w-3.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3.5 w-3.5 bg-red-500"></span>
                </span>
              )}
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg text-slate-100 tracking-tight">KayBiT</span>
                <span className="text-xs uppercase font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Snake Detector
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
                Edge AI Vision + Cloud Multiplatform Warning
              </p>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center space-x-1">
            <button
              onClick={() => onSelectTab("monitor")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "monitor"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <Radio className="w-3.5 h-3.5" />
                <span>Live Feed</span>
              </span>
            </button>

            <button
              onClick={() => onSelectTab("alerts")}
              className={`relative px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "alerts"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Alerts</span>
                {activeAlertCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-500 text-white font-bold animate-pulse">
                    {activeAlertCount}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => onSelectTab("zones")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "zones"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <Shield className="w-3.5 h-3.5" />
                <span>Property Zones</span>
              </span>
            </button>

            <button
              onClick={() => onSelectTab("edge")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "edge"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <Cpu className="w-3.5 h-3.5" />
                <span>Edge Engine</span>
              </span>
            </button>

            <button
              onClick={() => onSelectTab("health")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "health"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <Activity className="w-3.5 h-3.5" />
                <span>System Health</span>
              </span>
            </button>

            <button
              onClick={() => onSelectTab("notifications")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "notifications"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <BellRing className="w-3.5 h-3.5" />
                <span>FCM Push Logs</span>
              </span>
            </button>

            <button
              onClick={() => onSelectTab("roadmap")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "roadmap"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <BookOpen className="w-3.5 h-3.5" />
                <span>Roadmap</span>
              </span>
            </button>

            <button
              onClick={() => onSelectTab("packaging")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                activeTab === "packaging"
                  ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                  : "text-slate-300 hover:text-white hover:bg-slate-800"
              }`}
            >
              <span className="flex items-center space-x-1.5">
                <Smartphone className="w-3.5 h-3.5" />
                <span>Packaging</span>
              </span>
            </button>
          </nav>

          {/* Quick Actions */}
          <div className="flex items-center space-x-2">
            {/* Battery Status Quick Link */}
            <button
              onClick={() => onSelectTab("edge")}
              title="View Edge Battery Governor & Load Shedding"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold flex items-center space-x-1.5 transition-all cursor-pointer ${
                isLoadSheddingActive
                  ? "bg-amber-500/20 text-amber-300 border-amber-500/50 animate-pulse"
                  : "bg-slate-800 border-slate-700 text-emerald-400 hover:bg-slate-700"
              }`}
            >
              {isLoadSheddingActive ? (
                <>
                  <BatteryWarning className="w-3.5 h-3.5 text-amber-400" />
                  <span>{batteryVoltage.toFixed(1)}V (SHED)</span>
                </>
              ) : (
                <>
                  <BatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">{batteryVoltage.toFixed(1)}V</span>
                </>
              )}
            </button>

            {/* User Guide Button */}
            <button
              onClick={onOpenUserGuide}
              title="Open User Guide (USER_GUIDE.md)"
              className="px-2.5 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">User Guide</span>
            </button>

            {/* Night Vision IR Toggle */}
            <button
              onClick={onToggleNightVision}
              title={isNightVisionGlobal ? "Switch to Daylight Mode" : "Switch to Night Vision IR (850nm)"}
              className={`p-2 rounded-lg border text-xs transition-colors ${
                isNightVisionGlobal
                  ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-400"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {isNightVisionGlobal ? (
                <span className="flex items-center space-x-1 font-mono text-[11px]">
                  <Moon className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="hidden sm:inline">IR NIGHT</span>
                </span>
              ) : (
                <span className="flex items-center space-x-1 font-mono text-[11px]">
                  <Sun className="w-3.5 h-3.5 text-amber-400" />
                  <span className="hidden sm:inline">DAYLIGHT</span>
                </span>
              )}
            </button>

            {/* Continuous Emergency Siren Toggle */}
            <button
              onClick={onToggleSiren}
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
                isContinuousSirenOn
                  ? "bg-red-600 text-white border-red-400 animate-pulse shadow-lg shadow-red-600/30"
                  : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
              }`}
            >
              {isContinuousSirenOn ? (
                <>
                  <BellRing className="w-3.5 h-3.5 animate-bounce" />
                  <span>SIREN ACTIVE</span>
                </>
              ) : (
                <>
                  <VolumeX className="w-3.5 h-3.5 text-slate-400" />
                  <span className="hidden sm:inline">Test Siren</span>
                </>
              )}
            </button>

            {/* Test Simulator Button */}
            <button
              onClick={onOpenSimulator}
              className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs shadow-md transition-all flex items-center space-x-1"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Simulate Detection</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation Row */}
        <div className="flex md:hidden items-center justify-between py-2 border-t border-slate-800/80 overflow-x-auto space-x-1 scrollbar-none">
          <button
            onClick={() => onSelectTab("monitor")}
            className={`px-2.5 py-1 rounded text-xs whitespace-nowrap ${
              activeTab === "monitor" ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-slate-400"
            }`}
          >
            Live Feed
          </button>
          <button
            onClick={() => onSelectTab("alerts")}
            className={`px-2.5 py-1 rounded text-xs whitespace-nowrap ${
              activeTab === "alerts" ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-slate-400"
            }`}
          >
            Alerts ({activeAlertCount})
          </button>
          <button
            onClick={() => onSelectTab("zones")}
            className={`px-2.5 py-1 rounded text-xs whitespace-nowrap ${
              activeTab === "zones" ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-slate-400"
            }`}
          >
            Zones
          </button>
          <button
            onClick={() => onSelectTab("edge")}
            className={`px-2.5 py-1 rounded text-xs whitespace-nowrap ${
              activeTab === "edge" ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-slate-400"
            }`}
          >
            Edge AI
          </button>
          <button
            onClick={() => onSelectTab("health")}
            className={`px-2.5 py-1 rounded text-xs whitespace-nowrap ${
              activeTab === "health" ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-slate-400"
            }`}
          >
            Pi 5 Health
          </button>
          <button
            onClick={() => onSelectTab("roadmap")}
            className={`px-2.5 py-1 rounded text-xs whitespace-nowrap ${
              activeTab === "roadmap" ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-slate-400"
            }`}
          >
            Roadmap
          </button>
          <button
            onClick={() => onSelectTab("packaging")}
            className={`px-2.5 py-1 rounded text-xs whitespace-nowrap ${
              activeTab === "packaging" ? "bg-amber-500/20 text-amber-300 font-semibold" : "text-slate-400"
            }`}
          >
            Mobile Setup
          </button>
          <button
            onClick={onOpenUserGuide}
            className="px-2.5 py-1 rounded text-xs whitespace-nowrap bg-amber-500/15 text-amber-400 font-semibold border border-amber-500/30"
          >
            User Guide
          </button>
        </div>
      </div>
    </header>
  );
};
