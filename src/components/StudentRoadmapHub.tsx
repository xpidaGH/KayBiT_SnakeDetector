import React, { useState } from "react";
import { 
  BookOpen, 
  CheckCircle2, 
  Code2, 
  Cpu, 
  Smartphone, 
  AlertTriangle, 
  ChevronRight,
  ShieldCheck,
  Server,
  Terminal,
  Clock,
  Sparkles
} from "lucide-react";
import { 
  ROADMAP_PHASES, 
  TECHNICAL_CHALLENGES, 
  RECOMMENDED_HARDWARE 
} from "../data";

export const StudentRoadmapHub: React.FC = () => {
  const [activePhase, setActivePhase] = useState<1 | 2 | 3>(1);
  const [activeChallenge, setActiveChallenge] = useState<"false_positives" | "night_vision" | "latency">("false_positives");

  const currentPhaseData = ROADMAP_PHASES.find(p => p.phase === activePhase) || ROADMAP_PHASES[0];
  const currentChallengeData = TECHNICAL_CHALLENGES.find(c => c.id === activeChallenge) || TECHNICAL_CHALLENGES[0];

  const phaseIcons = {
    1: Cpu,
    2: Code2,
    3: Smartphone
  };

  return (
    <div className="space-y-8 font-mono">
      {/* Header Banner */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">KayBiT Student Development & Engineering Roadmap</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Complete engineering blueprint from dataset curation and YOLOv8 training in Google Colab, to edge Python inference on Raspberry Pi 5, and cross-platform mobile app siren dispatch.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-amber-400 font-bold">
              YOLOv8 Nano • PyTorch • Flutter / React Native • Firebase
            </span>
          </div>
        </div>
      </div>

      {/* 3-Phase Navigation Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {ROADMAP_PHASES.map((phaseItem) => {
          const isActive = activePhase === phaseItem.phase;
          const IconComponent = phaseIcons[phaseItem.phase] || Cpu;

          return (
            <div
              key={phaseItem.phase}
              onClick={() => setActivePhase(phaseItem.phase)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isActive
                  ? "bg-slate-900 border-amber-500/80 ring-2 ring-amber-500/20 shadow-xl"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl ${
                  isActive ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs text-slate-500 font-bold">STEP 0{phaseItem.phase}</span>
              </div>
              <h3 className="font-bold text-slate-100 text-sm mt-3">{phaseItem.title}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{phaseItem.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Active Phase Deep Dive */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
        <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center space-x-2">
              <span className="px-2 py-0.5 bg-amber-500/20 text-amber-300 text-[10px] font-bold rounded border border-amber-500/40 uppercase">
                {currentPhaseData.badge}
              </span>
              <h3 className="text-lg font-bold text-slate-100">
                {currentPhaseData.title}
              </h3>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-3xl">
              {currentPhaseData.overview}
            </p>
          </div>
        </div>

        {/* Dynamic Step Deliverables Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {currentPhaseData.steps.map((step) => (
            <div key={step.stepNumber} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3 flex flex-col justify-between">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-amber-400 font-bold">Step {step.stepNumber}: {step.title}</span>
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {step.description}
                </p>
              </div>

              <div className="space-y-1.5 pt-2 border-t border-slate-800/80">
                <span className="text-[10px] uppercase font-bold text-slate-500">Key Deliverables:</span>
                <div className="flex flex-wrap gap-1.5">
                  {step.deliverables.map((item, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-900 text-slate-300 px-2 py-0.5 rounded border border-slate-800">
                      ✓ {item}
                    </span>
                  ))}
                </div>
              </div>

              {step.codeHighlight && (
                <div className="pt-2">
                  <pre className="p-2.5 bg-slate-900 rounded-lg text-[11px] font-mono text-amber-200/90 overflow-x-auto border border-slate-800">
                    {step.codeHighlight}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Technical Challenges Deep Dive */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
        <div>
          <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Key Engineering Challenges & Verified Edge Solutions</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Architectural solutions designed to eliminate false alarms, enable nocturnal infrared vision, and satisfy the sub-3s SLA.
          </p>
        </div>

        {/* Challenge selector tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {TECHNICAL_CHALLENGES.map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChallenge(c.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap cursor-pointer ${
                activeChallenge === c.id
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Active Challenge Display */}
        <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
            <h4 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
              <span className="text-amber-400">Solution:</span>
              <span>{currentChallengeData.title}</span>
            </h4>
            <span className="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-lg text-xs font-bold border border-emerald-500/30">
              {currentChallengeData.effectiveness}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
              <span className="font-bold text-red-400 uppercase tracking-wider text-[10px]">The Physical & CV Problem:</span>
              <p className="text-slate-300 leading-relaxed">
                {currentChallengeData.problem}
              </p>
            </div>

            <div className="space-y-2 bg-slate-900/60 p-3.5 rounded-xl border border-slate-800/80">
              <span className="font-bold text-emerald-400 uppercase tracking-wider text-[10px]">The Edge Solution:</span>
              <p className="text-slate-300 leading-relaxed">
                {currentChallengeData.solution}
              </p>
            </div>
          </div>

          {currentChallengeData.codeReference && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[10px] text-slate-400 uppercase font-bold flex items-center space-x-1">
                <Terminal className="w-3 h-3 text-amber-400" />
                <span>Reference Logic & Latency Budget:</span>
              </span>
              <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-cyan-300/90 overflow-x-auto border border-slate-800">
                {currentChallengeData.codeReference}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* Recommended Hardware Specification Table */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
              <Server className="w-4 h-4 text-amber-400" />
              <span>Recommended Hardware Bill of Materials (BOM)</span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Production edge compute, neural accelerator, camera sensor, and power governor specifications.
            </p>
          </div>
          <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
            Total Est. Hardware: ~$325
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {RECOMMENDED_HARDWARE.map((hw, idx) => (
            <div key={idx} className="p-3.5 bg-slate-950 rounded-xl border border-slate-800 flex flex-col justify-between space-y-2">
              <div>
                <div className="flex items-center justify-between text-[10px] text-slate-400 uppercase">
                  <span>{hw.component}</span>
                  <span className="text-emerald-400 font-bold">${hw.estimatedCostUSD}</span>
                </div>
                <h4 className="font-bold text-slate-100 text-xs mt-1">{hw.recommendedModel}</h4>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{hw.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

