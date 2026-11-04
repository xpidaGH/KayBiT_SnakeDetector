import React from "react";
import { X, Check, Sparkles, BookOpen, Terminal, Heart, Moon, Zap, Palette } from "lucide-react";
import { AppTheme } from "../types";

export interface ThemeOption {
  id: AppTheme;
  title: string;
  tagline: string;
  description: string;
  icon: React.ReactNode;
  fontBadge: string;
  previewBg: string;
  previewCard: string;
  previewBorder: string;
  previewText: string;
  previewAccent: string;
  isLightMode?: boolean;
}

export const THEME_OPTIONS: ThemeOption[] = [
  {
    id: "editorial",
    title: "1. Editorial & Refined",
    tagline: "Serif fonts, generous whitespace, clean light background",
    description: "Publishing and magazine aesthetic with bespoke serif typography, high-contrast ink headings, and delicate cream margins.",
    icon: <BookOpen className="w-5 h-5 text-amber-700" />,
    fontBadge: "Serif (Playfair / Source Serif)",
    previewBg: "#fcfbf9",
    previewCard: "#ffffff",
    previewBorder: "#e5dfd5",
    previewText: "#1c1917",
    previewAccent: "#b45309",
    isLightMode: true
  },
  {
    id: "technical",
    title: "2. Technical & Systematic",
    tagline: "Monospace fonts, high-density, visible grid borders",
    description: "Cybernetic mission-control console with tabular monospace numerals, blueprint cyan accents, and visible structural grid lines.",
    icon: <Terminal className="w-5 h-5 text-cyan-400" />,
    fontBadge: "Monospace (JetBrains Mono / SF Mono)",
    previewBg: "#050b14",
    previewCard: "#0a1324",
    previewBorder: "#162f55",
    previewText: "#e0f2fe",
    previewAccent: "#00f0ff",
    isLightMode: false
  },
  {
    id: "warm",
    title: "3. Warm & Approachable",
    tagline: "Pastel cards, rounded pill buttons, soft corners",
    description: "Friendly tactile palette featuring terracotta accents, gentle pastel card surfaces, and pill-shaped touch controls.",
    icon: <Heart className="w-5 h-5 text-rose-500" />,
    fontBadge: "Rounded Sans (Plus Jakarta Sans)",
    previewBg: "#faf5ee",
    previewCard: "#ffffff",
    previewBorder: "#eedcc9",
    previewText: "#2d3142",
    previewAccent: "#e07a5f",
    isLightMode: true
  },
  {
    id: "dark",
    title: "4. Elegant Dark",
    tagline: "Sleek dark mode with tailored high-contrast accents",
    description: "Low-glare deep obsidian canvas with emerald defense status rings, subtle glass layers, and optimal night-monitoring contrast.",
    icon: <Moon className="w-5 h-5 text-emerald-400" />,
    fontBadge: "Geometric Sans (Inter / System)",
    previewBg: "#030712",
    previewCard: "#0b1120",
    previewBorder: "#1e293b",
    previewText: "#f8fafc",
    previewAccent: "#10b981",
    isLightMode: false
  },
  {
    id: "vibrant",
    title: "5. Vibrant Palette",
    tagline: "High-energy, bold color schemes",
    description: "Electric cyberpunk styling with hyper-luminous amber/yellow and violet gradients for high-visibility perimeter alarms.",
    icon: <Zap className="w-5 h-5 text-amber-400" />,
    fontBadge: "Modern Display (Outfit / Urbanist)",
    previewBg: "#0a0418",
    previewCard: "#14092b",
    previewBorder: "#3b1a77",
    previewText: "#fdf4ff",
    previewAccent: "#facc15",
    isLightMode: false
  }
];

interface ThemeSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: AppTheme;
  onSelectTheme: (theme: AppTheme) => void;
}

export const ThemeSettingsModal: React.FC<ThemeSettingsModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme
}) => {
  if (!isOpen) return null;

  const handleSelect = (theme: AppTheme) => {
    onSelectTheme(theme);
    // Instant close on selection per user brief:
    // "When a user selects a theme, dynamically update the app's CSS variables instantly, close the modal, and save their choice to localStorage"
    onClose();
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div 
        className="relative w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                <span>UI Theme Variations</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-lime-500/20 text-lime-300 font-semibold border border-lime-500/30">
                  Instant Preview
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Choose from 5 curated styles. Updates backgrounds, typography, borders, and accents instantly.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Theme Grid */}
        <div className="p-6 overflow-y-auto space-y-3.5 divide-y divide-slate-800/50">
          {THEME_OPTIONS.map((theme) => {
            const isSelected = currentTheme === theme.id;
            return (
              <div
                key={theme.id}
                onClick={() => handleSelect(theme.id)}
                className={`pt-3.5 first:pt-0 group relative p-4 rounded-xl border transition-all cursor-pointer flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                  isSelected
                    ? "bg-slate-800/90 border-amber-400/80 shadow-lg ring-1 ring-amber-400/50"
                    : "bg-slate-950/60 border-slate-800 hover:border-slate-700 hover:bg-slate-800/40"
                }`}
              >
                <div className="flex items-start space-x-3.5">
                  <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 mt-0.5 group-hover:scale-105 transition-transform">
                    {theme.icon}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-bold text-sm text-slate-100">{theme.title}</h3>
                      {isSelected && (
                        <span className="flex items-center space-x-1 text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-bold">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>ACTIVE</span>
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-amber-300/90 font-medium">{theme.tagline}</p>
                    <p className="text-[11px] text-slate-400 leading-relaxed max-w-md">
                      {theme.description}
                    </p>
                    <div className="pt-1">
                      <span className="text-[10px] font-mono text-slate-400 px-1.5 py-0.5 rounded bg-slate-800/80 border border-slate-700/50">
                        {theme.fontBadge}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Theme Palette Swatch Preview */}
                <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2.5 shrink-0">
                  <div 
                    className="w-24 h-12 rounded-lg border p-1.5 flex flex-col justify-between shadow-inner"
                    style={{ 
                      backgroundColor: theme.previewBg, 
                      borderColor: theme.previewBorder 
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div 
                        className="w-3 h-3 rounded-sm" 
                        style={{ backgroundColor: theme.previewAccent }}
                      />
                      <span 
                        className="text-[9px] font-bold font-mono"
                        style={{ color: theme.previewText }}
                      >
                        Aa
                      </span>
                    </div>
                    <div 
                      className="w-full h-3 rounded text-[8px] flex items-center justify-center font-bold"
                      style={{ 
                        backgroundColor: theme.previewCard, 
                        color: theme.previewText,
                        borderColor: theme.previewBorder,
                        borderWidth: "1px"
                      }}
                    >
                      Card
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleSelect(theme.id);
                    }}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      isSelected
                        ? "bg-amber-500 text-slate-950 shadow"
                        : "bg-slate-800 text-slate-300 hover:bg-slate-700 group-hover:text-white"
                    }`}
                  >
                    {isSelected ? "Selected" : "Apply Theme"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-3.5 border-t border-slate-800 bg-slate-950/70 text-xs text-slate-400">
          <span>Selection is saved automatically to localStorage.</span>
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold rounded-lg text-xs transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
