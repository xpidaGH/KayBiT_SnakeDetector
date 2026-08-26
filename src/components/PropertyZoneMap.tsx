import React, { useState } from "react";
import { PropertyZone, CameraFeed, DetectionAlert } from "../types";
import { 
  Shield, 
  MapPin, 
  Camera, 
  AlertTriangle, 
  CheckCircle, 
  Layers, 
  Sliders, 
  Radio, 
  Zap, 
  Info 
} from "lucide-react";
import { playSnakeIntrusionAlarm } from "../utils/audio";
import { 
  PROPERTY_MAP_METADATA, 
  ZONE_THREAT_ATTRACTANTS, 
  STATUS_LEGEND_ITEMS 
} from "../data";

interface PropertyZoneMapProps {
  zones: PropertyZone[];
  cameras: CameraFeed[];
  activeAlerts: DetectionAlert[];
  onTriggerZoneIntrusion: (zone: PropertyZone) => void;
}

export const PropertyZoneMap: React.FC<PropertyZoneMapProps> = ({
  zones,
  cameras,
  activeAlerts,
  onTriggerZoneIntrusion
}) => {
  const [selectedZone, setSelectedZone] = useState<PropertyZone>(zones[0]);
  const [isPerimeterArmed, setIsPerimeterArmed] = useState<boolean>(true);

  const currentAttractants = ZONE_THREAT_ATTRACTANTS[selectedZone.id] || {
    title: "Snake Attractant Analysis",
    points: [
      "Micro-climate: Damp mulch & low stone gaps",
      "Prey presence: Rodent trails detected along perimeter fence",
      "Deterrent: Strobe lighting & ultrasonic pulses active on alert"
    ]
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-100">Property Defense & Sensor Node Geofencing</h2>
            <span className="px-2 py-0.5 text-xs bg-amber-500/20 text-amber-300 font-mono font-bold rounded border border-amber-500/30">
              {zones.length} Monitored Sectors
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Spatial monitoring map linking IP cameras, edge vision zones, and automated strobe deterrents.
          </p>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsPerimeterArmed(!isPerimeterArmed)}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center space-x-1.5 border cursor-pointer ${
              isPerimeterArmed
                ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-400"
                : "bg-red-950/80 border-red-500/50 text-red-400"
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>{isPerimeterArmed ? "PERIMETER ARMED" : "PERIMETER DISARMED"}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Interactive Property Map (Left 2 cols) */}
        <div className="lg:col-span-2 bg-slate-950 rounded-2xl border border-slate-800 p-6 relative overflow-hidden shadow-2xl min-h-[420px] flex flex-col justify-between">
          {/* Map Grid Background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:40px_40px] opacity-25 pointer-events-none" />

          {/* Central Property House Outline */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-36 bg-slate-900/90 border-2 border-dashed border-slate-700/80 rounded-xl flex flex-col items-center justify-center p-3 text-center pointer-events-none shadow-inner">
            <span className="font-mono text-xs font-bold text-slate-300">{PROPERTY_MAP_METADATA.interiorZoneLabel}</span>
            <span className="text-[10px] text-emerald-400 font-mono mt-1">{PROPERTY_MAP_METADATA.interiorStatus}</span>
          </div>

          {/* Zone Hotspots / Pins */}
          <div className="relative w-full h-80">
            {zones.map((zone) => {
              const hasAlert = activeAlerts.some(a => a.zone === zone.name && a.status === "active");
              const isSelected = selectedZone.id === zone.id;

              return (
                <div
                  key={zone.id}
                  onClick={() => setSelectedZone(zone)}
                  style={{
                    left: `${zone.coordinates.x}%`,
                    top: `${zone.coordinates.y}%`
                  }}
                  className="absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer group z-10"
                >
                  {/* Outer Pulsing Radar Rings if Alert */}
                  {hasAlert && (
                    <div className="absolute -inset-4 rounded-full bg-red-500/30 animate-ping pointer-events-none" />
                  )}

                  {/* Node Marker */}
                  <div className={`p-3 rounded-2xl border transition-all duration-300 flex items-center space-x-2 shadow-xl ${
                    hasAlert
                      ? "bg-red-600 text-white border-red-400 scale-110 animate-bounce"
                      : isSelected
                      ? "bg-amber-500 text-slate-950 font-bold border-amber-300 scale-105"
                      : "bg-slate-900/90 text-slate-200 border-slate-700 hover:border-amber-500/50 hover:bg-slate-800"
                  }`}>
                    {hasAlert ? (
                      <AlertTriangle className="w-4 h-4" />
                    ) : (
                      <MapPin className="w-4 h-4 text-amber-400 group-hover:text-white" />
                    )}
                    <div className="text-left font-mono">
                      <div className="text-xs font-bold whitespace-nowrap">{zone.name}</div>
                      <div className="text-[9px] opacity-80">{zone.activeSensors} Node Sensors</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Map Footer OSD */}
          <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-slate-400 bg-slate-900/80 p-3 rounded-xl border border-slate-800/80">
            <div className="flex items-center space-x-3">
              {STATUS_LEGEND_ITEMS.map((item, idx) => (
                <span key={idx} className="flex items-center space-x-1">
                  <span className={`w-2.5 h-2.5 rounded-full inline-block ${item.colorClass}`} />
                  <span>{item.label}</span>
                </span>
              ))}
            </div>
            <span>{PROPERTY_MAP_METADATA.scaleLabel}</span>
          </div>
        </div>

        {/* Zone Details Sidebar (Right 1 col) */}
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-5 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">{selectedZone.name}</h3>
                <span className="text-xs font-mono text-amber-400 capitalize">{selectedZone.type} Zone</span>
              </div>

              <span className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold ${
                selectedZone.riskScore === "HIGH"
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : selectedZone.riskScore === "MEDIUM"
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
              }`}>
                {selectedZone.riskScore} RISK
              </span>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed">
              {selectedZone.description}
            </p>

            {/* Linked Cameras in this zone */}
            <div className="space-y-2">
              <span className="text-xs font-mono text-slate-400 uppercase tracking-wider font-bold">
                Assigned RTSP Security Cameras:
              </span>
              <div className="space-y-1.5">
                {cameras
                  .filter((c) => selectedZone.cameraIds.includes(c.id))
                  .map((cam) => (
                    <div key={cam.id} className="flex items-center justify-between bg-slate-950 p-2.5 rounded-lg border border-slate-800 text-xs font-mono">
                      <div className="flex items-center space-x-2">
                        <Camera className="w-3.5 h-3.5 text-amber-400" />
                        <span className="text-slate-200 font-semibold">{cam.name}</span>
                      </div>
                      <span className="text-emerald-400">{cam.fps} FPS</span>
                    </div>
                  ))}
              </div>
            </div>

            {/* Zone Environmental Threat Factor */}
            <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 space-y-1.5 text-xs">
              <span className="font-mono text-slate-400 font-bold">{currentAttractants.title}:</span>
              <ul className="list-disc list-inside text-slate-300 space-y-1 text-[11px]">
                {currentAttractants.points.map((pt, idx) => (
                  <li key={idx}>{pt}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Trigger Alert in this Zone Button */}
          <button
            onClick={() => {
              playSnakeIntrusionAlarm(3.5);
              onTriggerZoneIntrusion(selectedZone);
            }}
            className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-red-600/30 transition-all flex items-center justify-center space-x-2 cursor-pointer"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Simulate Snake Incursion in {selectedZone.name}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

