import React, { useState } from "react";

export interface KbtBrandLogoProps {
  variant?: "web" | "desktop" | "mobile" | "icon_only" | "showcase";
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  showLabel?: boolean;
  subtitle?: string;
}

export const KbtBrandLogo: React.FC<KbtBrandLogoProps> = ({
  variant = "web",
  className = "",
  size = "md",
  showLabel = true,
  subtitle = "Edge AI Vision + Cloud Warning"
}) => {
  const [imageError, setImageError] = useState(false);

  // Dimension mapping based on target use case from kbt-integration-guide.txt
  const sizeClasses = {
    sm: "w-5 h-5",     // Desktop title bar standard icon (18-20px)
    md: "w-8 h-8",     // Web header bar standard (32px)
    lg: "w-10 h-10",   // Mobile app bar standard (36-40px)
    xl: "w-16 h-16"    // High-resolution showcase / splash
  }[size];

  // Specific dimension override for variants if size wasn't explicitly changed
  const effectiveSize = variant === "desktop" 
    ? "w-5 h-5" 
    : variant === "mobile" 
      ? "w-9 h-9" 
      : variant === "showcase" 
        ? "w-16 h-16" 
        : sizeClasses;

  const logoGraphic = (
    <div
      className={`relative ${effectiveSize} bg-gradient-to-br from-zinc-900 via-slate-950 to-black p-0.5 mask-squircle flex items-center justify-center border border-yellow-400/30 shadow-[0_0_12px_rgba(163,230,53,0.35)] shrink-0 overflow-hidden ${className}`}
      title="KayBiT Tech-Styled Cyber Spider Logo"
    >
      {!imageError ? (
        <img
          src="/assets/kbt-logo-transparent.png"
          alt="KayBiT Tech Spider Logo"
          onError={() => setImageError(true)}
          className="w-full h-full object-cover filter drop-shadow-[0_0_8px_rgba(163,230,53,0.6)] hover:scale-105 transition-transform"
          referrerPolicy="no-referrer"
        />
      ) : (
        /* Styled SVG fallback with cyber spider geometry */
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full p-1 text-lime-400 drop-shadow-[0_0_8px_rgba(163,230,53,0.6)]"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
        >
          <path d="M50 30 L50 70 M30 45 L70 45 M35 55 L65 55 M50 20 L35 38 L20 30 M50 20 L65 38 L80 30 M35 60 L18 70 M65 60 L82 70 M35 70 L25 88 M65 70 L75 88" strokeLinecap="round" strokeLinejoin="round" />
          <polygon points="50,32 58,45 50,68 42,45" fill="#facc15" fillOpacity="0.3" stroke="#a3e635" strokeWidth="2.5" />
          <circle cx="47" cy="40" r="1.5" fill="#a3e635" />
          <circle cx="53" cy="40" r="1.5" fill="#a3e635" />
        </svg>
      )}
    </div>
  );

  if (variant === "icon_only") {
    return logoGraphic;
  }

  // 1. Desktop (Windows/macOS) Title Bar layout
  if (variant === "desktop") {
    return (
      <div className="flex items-center space-x-2 select-none">
        {logoGraphic}
        {showLabel && (
          <div className="flex items-center space-x-1.5">
            <span className="font-semibold text-xs text-slate-200 tracking-tight font-sans">KayBiT Snake Detector</span>
            <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-lime-500/10 text-lime-400 border border-lime-500/20">
              Desktop v2.4
            </span>
          </div>
        )}
      </div>
    );
  }

  // 2. Mobile App Bar (iOS/Android) layout
  if (variant === "mobile") {
    return (
      <div className="flex items-center space-x-2.5">
        {logoGraphic}
        {showLabel && (
          <div>
            <div className="flex items-center space-x-1.5">
              <span className="font-bold text-sm text-slate-100 tracking-tight">KayBiT Mobile</span>
              <span className="text-[10px] uppercase font-mono px-1 rounded bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                Live Edge
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono">28ms Detection SLA</p>
          </div>
        )}
      </div>
    );
  }

  // 3. Web Header Bar (Web Browsers / Web Apps) - Default
  return (
    <div className="flex items-center space-x-3 select-none">
      {logoGraphic}
      {showLabel && (
        <div>
          <div className="flex items-center space-x-2">
            <span className="font-bold text-lg text-slate-100 tracking-tight">KayBiT</span>
            <span className="text-xs uppercase font-mono px-1.5 py-0.5 rounded bg-lime-500/20 text-lime-300 font-semibold border border-lime-500/30 flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-lime-400 animate-pulse"></span>
              <span>Snake Detector</span>
            </span>
          </div>
          {subtitle && (
            <p className="text-[11px] text-slate-400 font-mono hidden sm:block">
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
