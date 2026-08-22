import React, { useState, useRef, useEffect } from "react";
import { CameraFeed, DetectionAlert } from "../types";
import { 
  Camera, 
  Moon, 
  Sun, 
  Maximize2, 
  Volume2, 
  ShieldAlert, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle,
  Radio,
  Sliders,
  Sparkles,
  Video,
  VideoOff,
  BatteryLow,
  Zap,
  ShieldCheck,
  Power
} from "lucide-react";
import { playSnakeIntrusionAlarm, playAcknowledgeBeep } from "../utils/audio";

interface LiveMonitorProps {
  cameras: CameraFeed[];
  selectedCamera: CameraFeed;
  onSelectCamera: (cam: CameraFeed) => void;
  onTriggerSimulatedDetection: (cam: CameraFeed, isNightVision: boolean) => void;
  activeAlerts: DetectionAlert[];
  isNightVisionGlobal: boolean;
  onOpenAnalysis: (alert: DetectionAlert) => void;
  onSwitchToEdge?: () => void;
  onOverridePowerSave?: (cameraId: string) => void;
}

export const LiveMonitor: React.FC<LiveMonitorProps> = ({
  cameras,
  selectedCamera,
  onSelectCamera,
  onTriggerSimulatedDetection,
  activeAlerts,
  isNightVisionGlobal,
  onOpenAnalysis,
  onSwitchToEdge,
  onOverridePowerSave
}) => {
  const [isNightModeLocal, setIsNightModeLocal] = useState<boolean>(selectedCamera.isNightVision);
  const [consecutiveCount, setConsecutiveCount] = useState<number>(0);
  const [isSimulatingInference, setIsSimulatingInference] = useState<boolean>(true);
  const [webcamActive, setWebcamActive] = useState<boolean>(false);
  const [fps, setFps] = useState<number>(28);
  const [latency, setLatency] = useState<number>(selectedCamera.currentInferenceLatencyMs);
  const [temporaryOverride, setTemporaryOverride] = useState<boolean>(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Sync with global night vision toggle
  useEffect(() => {
    setIsNightModeLocal(isNightVisionGlobal || selectedCamera.isNightVision);
    setTemporaryOverride(false);
  }, [isNightVisionGlobal, selectedCamera]);

  // Handle webcam stream
  const toggleWebcam = async () => {
    if (webcamActive) {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      setWebcamActive(false);
    } else {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { width: 1280, height: 720 } });
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
        setWebcamActive(true);
      } catch (err) {
        console.warn("Unable to access webcam:", err);
        alert("Webcam permission was not granted or camera is busy. Using RTSP camera stream simulation instead.");
      }
    }
  };

  // Simulated jitter for FPS and latency
  useEffect(() => {
    const interval = setInterval(() => {
      setFps(Math.floor(26 + Math.random() * 4));
      setLatency(Math.floor(selectedCamera.currentInferenceLatencyMs + (Math.random() * 6 - 3)));
    }, 1800);
    return () => clearInterval(interval);
  }, [selectedCamera]);

  const isPowerSaveDisabled = selectedCamera.status === "power_save_disabled" && !temporaryOverride;
  const activeAlertForCamera = activeAlerts.find(a => a.cameraId === selectedCamera.id && a.status === "active");

  const handleManualTrigger = () => {
    playSnakeIntrusionAlarm(3.5);
    setConsecutiveCount(3);
    onTriggerSimulatedDetection(selectedCamera, isNightModeLocal);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Camera Selector & Status */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur">
        <div className="flex items-center space-x-3">
          <div className={`p-2.5 rounded-lg border ${
            activeAlertForCamera 
              ? "bg-red-950/60 border-red-500/50 text-red-400 animate-pulse"
              : isPowerSaveDisabled
              ? "bg-amber-950/60 border-amber-500/40 text-amber-400"
              : "bg-slate-800 border-slate-700 text-slate-300"
          }`}>
            {isPowerSaveDisabled ? <BatteryLow className="w-5 h-5" /> : <Camera className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h2 className="font-semibold text-slate-100">{selectedCamera.name}</h2>
              <span className={`px-2 py-0.5 text-[10px] rounded-full font-mono font-bold uppercase ${
                activeAlertForCamera
                  ? "bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse"
                  : isPowerSaveDisabled
                  ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                  : selectedCamera.status === "live"
                  ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                  : "bg-slate-700 text-slate-300"
              }`}>
                {activeAlertForCamera 
                  ? "CRITICAL INTRUSION" 
                  : isPowerSaveDisabled 
                  ? "⚡ LOW-VOLTAGE SHEDDED" 
                  : selectedCamera.isEssential 
                  ? "🛡️ PERIMETER PROTECTED" 
                  : selectedCamera.status}
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              {selectedCamera.location} • {selectedCamera.resolution} • Draw: {selectedCamera.powerDrawWatts || 4.2}W
            </p>
          </div>
        </div>

        {/* Camera Selector Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {cameras.map((cam) => {
            const hasAlert = activeAlerts.some(a => a.cameraId === cam.id && a.status === "active");
            const isShed = cam.status === "power_save_disabled";
            const isPerimeter = cam.isEssential || cam.priority === "critical_perimeter";

            return (
              <button
                key={cam.id}
                onClick={() => {
                  playAcknowledgeBeep();
                  onSelectCamera(cam);
                  setIsNightModeLocal(cam.isNightVision || isNightVisionGlobal);
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 whitespace-nowrap ${
                  selectedCamera.id === cam.id
                    ? "bg-amber-500 text-slate-950 font-bold shadow-lg shadow-amber-500/20"
                    : isShed
                    ? "bg-amber-950/30 text-amber-300 hover:bg-amber-950/60 border border-amber-500/30"
                    : "bg-slate-800/90 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
                }`}
              >
                {hasAlert ? (
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-ping" />
                ) : isShed ? (
                  <Zap className="w-2.5 h-2.5 text-amber-400" />
                ) : isPerimeter ? (
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                )}
                <span>{cam.name.split(" ")[0]}</span>
                {isShed && <span className="text-[9px] opacity-75">(Shed)</span>}
              </button>
            );
          })}

          <button
            onClick={toggleWebcam}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center space-x-1.5 whitespace-nowrap ${
              webcamActive
                ? "bg-purple-600 text-white font-bold animate-pulse"
                : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>{webcamActive ? "Webcam ON" : "Use Webcam"}</span>
          </button>
        </div>
      </div>

      {/* Main Video & Detection Canvas */}
      <div className="relative rounded-2xl overflow-hidden bg-slate-950 border border-slate-800 shadow-2xl group">
        {/* Stream Visual Display */}
        <div className="relative aspect-video w-full bg-slate-950 flex items-center justify-center overflow-hidden">
          {webcamActive ? (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover transition-all ${
                isNightModeLocal ? "filter grayscale contrast-150 brightness-90" : ""
              }`}
            />
          ) : (
            <img
              src={selectedCamera.previewUrl}
              alt={selectedCamera.name}
              className={`w-full h-full object-cover transition-all duration-300 ${
                isPowerSaveDisabled
                  ? "filter grayscale brightness-25 blur-sm"
                  : isNightModeLocal
                  ? "filter grayscale contrast-150 brightness-95 invert-[0.05]"
                  : ""
              }`}
            />
          )}

          {/* Power Saving Load-Shedding Full Screen Overlay */}
          {isPowerSaveDisabled && (
            <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-md flex flex-col items-center justify-center p-6 text-center z-20">
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 mb-3 animate-pulse">
                <BatteryLow className="w-10 h-10" />
              </div>
              <div className="inline-block px-2.5 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold uppercase mb-2">
                ⚡ Stream Paused — Solar Battery Conservation Mode
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-slate-100 max-w-md">
                {selectedCamera.name} is Temporarily Suspended
              </h3>
              <p className="text-xs text-slate-300 max-w-lg mt-2 leading-relaxed">
                Solar battery bus voltage has dropped below the safety threshold. Non-essential video feeds are automatically paused by the Edge Governor so critical perimeter cameras (South Perimeter Garden & Front Entrance) maintain 100% active NPU inference.
              </p>

              <div className="flex flex-wrap items-center justify-center gap-3 mt-5">
                <button
                  onClick={() => {
                    setTemporaryOverride(true);
                    if (onOverridePowerSave) onOverridePowerSave(selectedCamera.id);
                  }}
                  className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all shadow-md flex items-center space-x-1.5 cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5" />
                  <span>Temporary 60s Stream Override</span>
                </button>

                {onSwitchToEdge && (
                  <button
                    onClick={onSwitchToEdge}
                    className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-4 py-2 rounded-xl text-xs transition-all border border-slate-700 flex items-center space-x-1.5 cursor-pointer"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Adjust Voltage Cutoff in Edge Manager</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* IR Night Vision Overlay Graticule */}
          {isNightModeLocal && !isPowerSaveDisabled && (
            <div className="absolute inset-0 pointer-events-none bg-emerald-950/15 mix-blend-color-dodge">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,30,10,0.6)_100%)]" />
              <div className="absolute top-4 left-4 font-mono text-[10px] text-emerald-400 bg-black/60 px-2 py-1 rounded border border-emerald-500/30 flex items-center space-x-1">
                <Moon className="w-3 h-3 text-emerald-400" />
                <span>IR ILLUMINATOR 850nm ON • STARLIGHT GAIN +12dB</span>
              </div>
            </div>
          )}

          {/* Simulated Active Snake Bounding Box Overlay */}
          {activeAlertForCamera && !isPowerSaveDisabled && (
            <div
              className="absolute border-2 border-red-500 bg-red-500/20 rounded-md transition-all shadow-[0_0_20px_rgba(239,68,68,0.6)] animate-pulse"
              style={{
                left: `${activeAlertForCamera.boundingBox.x}%`,
                top: `${activeAlertForCamera.boundingBox.y}%`,
                width: `${activeAlertForCamera.boundingBox.width}%`,
                height: `${activeAlertForCamera.boundingBox.height}%`
              }}
            >
              {/* Corner crosshairs */}
              <div className="absolute -top-1.5 -left-1.5 w-3 h-3 border-t-2 border-l-2 border-amber-300" />
              <div className="absolute -top-1.5 -right-1.5 w-3 h-3 border-t-2 border-r-2 border-amber-300" />
              <div className="absolute -bottom-1.5 -left-1.5 w-3 h-3 border-b-2 border-l-2 border-amber-300" />
              <div className="absolute -bottom-1.5 -right-1.5 w-3 h-3 border-b-2 border-r-2 border-amber-300" />

              {/* Tag Header */}
              <div className="absolute -top-7 left-0 bg-red-600 text-white font-mono text-[11px] font-bold px-2 py-0.5 rounded shadow flex items-center space-x-1 whitespace-nowrap">
                <AlertTriangle className="w-3 h-3" />
                <span>{activeAlertForCamera.speciesCandidate || "SNAKE INTRUSION"} ({(activeAlertForCamera.confidence * 100).toFixed(0)}%)</span>
              </div>

              {/* Bounding Box Info Footer */}
              <div className="absolute -bottom-6 right-0 bg-black/80 text-amber-300 font-mono text-[10px] px-1.5 py-0.2 rounded border border-amber-500/30">
                Frames: {activeAlertForCamera.consecutiveFrames} • Latency: {activeAlertForCamera.latencyMs}ms
              </div>
            </div>
          )}

          {/* OSD Telemetry Header Bar */}
          {!isPowerSaveDisabled && (
            <div className="absolute top-3 left-3 right-3 flex items-center justify-between pointer-events-none">
              <div className="flex items-center space-x-2 font-mono text-xs">
                <span className="flex items-center space-x-1 bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md text-emerald-400 border border-emerald-500/30">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span>LIVE RTSP</span>
                </span>
                <span className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md text-slate-300 border border-slate-700">
                  {fps} FPS
                </span>
                <span className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md text-slate-300 border border-slate-700">
                  {latency}ms INFERENCE
                </span>
              </div>

              <div className="flex items-center space-x-2 font-mono text-xs">
                <span className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md text-amber-400 border border-amber-500/30">
                  YOLOv8 Nano (Hailo NPU)
                </span>
                <span className="bg-black/75 backdrop-blur-md px-2.5 py-1 rounded-md text-slate-300 border border-slate-700">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>
          )}

          {/* Bottom Live Controls Overlay */}
          {!isPowerSaveDisabled && (
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between bg-slate-900/85 backdrop-blur-md p-3 rounded-xl border border-slate-800">
              {/* Consecutive Frames Confirmation Gauge */}
              <div className="flex items-center space-x-3">
                <div className="text-xs">
                  <div className="text-slate-400 text-[11px] font-mono">Consecutive-Frame Filter</div>
                  <div className="flex items-center space-x-1 mt-0.5">
                    {[1, 2, 3].map((frameIdx) => {
                      const isFilled = activeAlertForCamera 
                        ? frameIdx <= activeAlertForCamera.consecutiveFrames 
                        : frameIdx <= consecutiveCount;
                      return (
                        <div
                          key={frameIdx}
                          className={`w-6 h-2 rounded-full transition-all ${
                            isFilled
                              ? "bg-red-500 shadow-sm shadow-red-500"
                              : "bg-slate-700"
                          }`}
                        />
                      );
                    })}
                    <span className="text-[11px] font-mono font-bold text-slate-200 ml-1">
                      {activeAlertForCamera ? `${activeAlertForCamera.consecutiveFrames}/3 (TRIGGERED)` : `${consecutiveCount}/3 Frames`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Actions & Night Vision Toggle */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setIsNightModeLocal(!isNightModeLocal)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-mono transition-colors flex items-center space-x-1.5 border ${
                    isNightModeLocal
                      ? "bg-emerald-950/80 border-emerald-500/50 text-emerald-400"
                      : "bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
                  }`}
                >
                  {isNightModeLocal ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                  <span>{isNightModeLocal ? "IR Night Active" : "Daylight"}</span>
                </button>

                <button
                  onClick={handleManualTrigger}
                  className="bg-red-600 hover:bg-red-700 text-white font-bold px-3.5 py-1.5 rounded-lg text-xs shadow-lg shadow-red-600/30 flex items-center space-x-1.5 transition-all cursor-pointer"
                >
                  <ShieldAlert className="w-3.5 h-3.5" />
                  <span>Simulate Snake Detection</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Real-time Telemetry & Intrusion Alert Banner if Active */}
      {activeAlertForCamera && (
        <div className="bg-red-950/70 border-2 border-red-500/70 rounded-xl p-4 shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4 animate-in fade-in duration-300">
          <div className="flex items-start space-x-3">
            <div className="p-2 bg-red-600 rounded-lg text-white shadow-lg shadow-red-600/40">
              <AlertTriangle className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xs font-mono bg-red-500 text-white px-2 py-0.5 rounded font-bold">
                  SNAKE INTRUSION DETECTED
                </span>
                <span className="text-xs font-mono text-red-200">
                  Latency: {activeAlertForCamera.latencyMs}ms (Sub-3s SLA Passed)
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                {activeAlertForCamera.speciesCandidate || "Venomous Snake Candidate"} in {activeAlertForCamera.zone}
              </h3>
              <p className="text-xs text-red-200 mt-0.5">
                Confidence: {(activeAlertForCamera.confidence * 100).toFixed(0)}% • Consecutive Frames: {activeAlertForCamera.consecutiveFrames} • Siren Active
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2 self-end md:self-center">
            <button
              onClick={() => onOpenAnalysis(activeAlertForCamera)}
              className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1 shadow-md cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Species & Danger Analysis</span>
            </button>
          </div>
        </div>
      )}

      {/* Grid of Other Connected Security Feeds */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-300 flex items-center space-x-1.5">
            <Activity className="w-4 h-4 text-amber-400" />
            <span>All Property Sensor & Camera Streams</span>
          </h3>
          <span className="text-xs font-mono text-slate-400">
            {cameras.length} Feeds Online • 1 Edge Node
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {cameras.map((cam) => {
            const hasAlert = activeAlerts.some(a => a.cameraId === cam.id && a.status === "active");
            const isShed = cam.status === "power_save_disabled";
            const isPerimeter = cam.isEssential || cam.priority === "critical_perimeter";

            return (
              <div
                key={cam.id}
                onClick={() => {
                  playAcknowledgeBeep();
                  onSelectCamera(cam);
                }}
                className={`group cursor-pointer rounded-xl overflow-hidden border transition-all ${
                  selectedCamera.id === cam.id
                    ? "border-amber-500/80 bg-slate-900 shadow-md ring-2 ring-amber-500/20"
                    : isShed
                    ? "border-amber-500/30 bg-slate-950 opacity-75 hover:opacity-100"
                    : "border-slate-800 bg-slate-900/60 hover:border-slate-700"
                }`}
              >
                <div className="relative aspect-video bg-slate-950 overflow-hidden">
                  <img
                    src={cam.previewUrl}
                    alt={cam.name}
                    className={`w-full h-full object-cover transition-transform group-hover:scale-105 duration-300 ${
                      isShed ? "filter grayscale brightness-40" : cam.isNightVision ? "filter grayscale contrast-125" : ""
                    }`}
                  />
                  {hasAlert && (
                    <div className="absolute inset-0 bg-red-600/30 border-2 border-red-500 flex items-center justify-center">
                      <span className="bg-red-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow">
                        INTRUSION
                      </span>
                    </div>
                  )}
                  {isShed && (
                    <div className="absolute inset-0 bg-slate-950/70 flex flex-col items-center justify-center text-center p-1">
                      <Zap className="w-4 h-4 text-amber-400 mb-0.5" />
                      <span className="text-[9px] font-mono font-bold text-amber-300 uppercase">LOAD SHEDDED</span>
                    </div>
                  )}
                  <div className="absolute top-1.5 left-1.5 bg-black/75 px-1.5 py-0.5 rounded text-[10px] font-mono text-slate-300">
                    {isShed ? "PAUSED" : `${cam.fps} FPS`}
                  </div>
                  {isPerimeter && !isShed && (
                    <div className="absolute top-1.5 right-1.5 bg-emerald-950/80 border border-emerald-500/40 px-1 py-0.5 rounded text-[9px] font-mono text-emerald-300 flex items-center space-x-0.5">
                      <ShieldCheck className="w-2.5 h-2.5 text-emerald-400" />
                      <span>SHIELD</span>
                    </div>
                  )}
                </div>

                <div className="p-2.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200 truncate">{cam.name}</span>
                    <span className={`w-2 h-2 rounded-full ${hasAlert ? "bg-red-500 animate-ping" : isShed ? "bg-amber-400" : "bg-emerald-400"}`} />
                  </div>
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5 truncate flex items-center justify-between">
                    <span>{cam.location}</span>
                    <span className={isPerimeter ? "text-emerald-400 font-bold" : "text-slate-400"}>
                      {isPerimeter ? "🛡️ Essential" : "⚡ Sheddable"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
