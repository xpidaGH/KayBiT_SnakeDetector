import React from "react";
import { 
  ShieldCheck, 
  BookOpen, 
  Radio, 
  Zap, 
  Cpu, 
  BellRing, 
  Sparkles, 
  Play, 
  ExternalLink,
  ChevronRight,
  HelpCircle,
  Smartphone
} from "lucide-react";

interface SplashScreenProps {
  onOpenUserGuide: () => void;
  onOpenSimulator: () => void;
  onSelectTab: (tab: "monitor" | "alerts" | "zones" | "edge" | "health" | "notifications" | "roadmap" | "packaging") => void;
  activeTab: string;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onOpenUserGuide,
  onOpenSimulator,
  onSelectTab,
  activeTab
}) => {
  return (
    <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-950 rounded-2xl border border-slate-800 p-6 shadow-xl relative overflow-hidden">
      {/* Background Decorative Accent */}
      <div className="absolute right-0 top-0 w-96 h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-amber-500/10 via-transparent to-transparent pointer-events-none" />
      
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 relative z-10">
        <div className="space-y-3 max-w-2xl">
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-mono font-bold flex items-center space-x-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>YOLOv8 Edge AI Online</span>
            </span>

            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700 text-slate-300 text-xs font-mono">
              ⚡ Sub-3s Push Notification SLA
            </span>

            <span className="px-2.5 py-1 rounded-md bg-purple-950/60 border border-purple-800 text-purple-300 text-xs font-mono">
              Gemini 3.7 Flash Species AI
            </span>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 tracking-tight">
            KayBiT Edge AI Snake Intrusion & Warning System
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Real-time ophidian perimeter surveillance with 25–30 FPS RTSP cameras, edge temporal undulation filtering to reject garden hoses, and instant emergency siren broadcasts.
          </p>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
            <div className="p-2 bg-slate-950/80 border border-slate-800/80 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Inference Latency</div>
              <div className="text-sm font-bold text-amber-400 font-mono">24–28 ms</div>
            </div>

            <div className="p-2 bg-slate-950/80 border border-slate-800/80 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase font-mono">FCM Transit</div>
              <div className="text-sm font-bold text-blue-400 font-mono">0.82 s avg</div>
            </div>

            <div className="p-2 bg-slate-950/80 border border-slate-800/80 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase font-mono">SLA Pass Rate</div>
              <div className="text-sm font-bold text-emerald-400 font-mono">100.0%</div>
            </div>

            <div className="p-2 bg-slate-950/80 border border-slate-800/80 rounded-lg">
              <div className="text-[10px] text-slate-400 uppercase font-mono">Temporal Filter</div>
              <div className="text-sm font-bold text-purple-400 font-mono">3-Frame Lock</div>
            </div>
          </div>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex flex-col sm:flex-row lg:flex-col gap-2.5 w-full lg:w-auto shrink-0">
          <button
            onClick={onOpenUserGuide}
            className="px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs sm:text-sm shadow-lg shadow-amber-500/20 flex items-center justify-center space-x-2 transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <BookOpen className="w-4 h-4" />
            <span>Open User Guide (USER_GUIDE.md)</span>
          </button>

          <button
            onClick={onOpenSimulator}
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-100 border border-slate-700 font-bold text-xs flex items-center justify-center space-x-2 transition-colors cursor-pointer"
          >
            <Radio className="w-4 h-4 text-red-400" />
            <span>Test Snake Intrusion Simulator</span>
          </button>

          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => onSelectTab("health")}
              className="px-2.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center space-x-1 transition-colors cursor-pointer"
            >
              <Cpu className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">Pi 5 Health</span>
            </button>

            <button
              onClick={() => onSelectTab("roadmap")}
              className="px-2.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center space-x-1 transition-colors cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-400" />
              <span className="truncate">Roadmap</span>
            </button>

            <button
              onClick={() => onSelectTab("packaging")}
              className="px-2.5 py-2 rounded-lg bg-slate-950 hover:bg-slate-900 border border-slate-800 text-slate-300 text-xs font-medium flex items-center justify-center space-x-1 transition-colors cursor-pointer"
            >
              <Smartphone className="w-3.5 h-3.5 text-purple-400" />
              <span className="truncate">Packaging</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
