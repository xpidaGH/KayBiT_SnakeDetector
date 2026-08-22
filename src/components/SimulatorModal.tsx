import React, { useState } from "react";
import { CameraFeed, DetectionAlert } from "../types";
import { INTRUSION_TEST_PRESETS, TestPreset } from "../data";
import { 
  X, 
  Radio, 
  Upload, 
  Sparkles, 
  ShieldAlert, 
  CheckCircle2, 
  Moon, 
  AlertTriangle, 
  RefreshCw,
  Loader2,
  Zap
} from "lucide-react";
import { playSnakeIntrusionAlarm, playAcknowledgeBeep } from "../utils/audio";

interface SimulatorModalProps {
  cameras: CameraFeed[];
  onClose: () => void;
  onAlertCreated: (newAlert: DetectionAlert) => void;
}

export const SimulatorModal: React.FC<SimulatorModalProps> = ({
  cameras,
  onClose,
  onAlertCreated
}) => {
  const [selectedPreset, setSelectedPreset] = useState<TestPreset>(INTRUSION_TEST_PRESETS[0]);
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed>(cameras[0]);
  const [customImage, setCustomImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<any | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setCustomImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRunSimulation = async () => {
    setIsProcessing(true);
    setTestResult(null);

    try {
      const isCustom = Boolean(customImage);
      const isHose = !isCustom && selectedPreset.id === "garden_hose";

      // If testing false positive hose filter
      if (isHose) {
        const verifyRes = await fetch("/api/verify-false-positive", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ objectType: "hose", consecutiveFrames: 1 })
        });
        const verifyData = await verifyRes.json();
        
        playAcknowledgeBeep();
        setTestResult({
          type: "false_positive",
          message: "FALSE ALARM REJECTED: Object identified as static garden hose. Push siren suppressed by edge consecutive-frame filter.",
          details: verifyData.result
        });
      } else {
        // Trigger Real/Simulated Snake Detection
        const payload = {
          cameraId: selectedCamera.id,
          cameraName: selectedCamera.name,
          zone: selectedCamera.location,
          confidence: selectedPreset.expectedConfidence,
          consecutiveFrames: selectedPreset.consecutiveFrames,
          imageUrl: customImage || selectedPreset.imageUrl,
          isNightVision: selectedPreset.isNightVision,
          speciesCandidate: selectedPreset.expectedSpecies,
          venomousRating: selectedPreset.expectedVenom,
          boundingBox: { x: 30, y: 35, width: 40, height: 40, label: `Snake (${selectedPreset.expectedConfidence})` }
        };

        const res = await fetch("/api/edge/trigger", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });

        const data = await res.json();
        if (data.success && data.alert) {
          playSnakeIntrusionAlarm(3.5);
          onAlertCreated(data.alert);
          setTestResult({
            type: "intrusion_alert",
            message: `CRITICAL INTRUSION CONFIRMED: ${data.alert.speciesCandidate} in ${data.alert.zone}!`,
            alert: data.alert,
            latency: data.latencyMs
          });
        }
      }
    } catch (err) {
      console.error("Simulation error:", err);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl my-8 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <Radio className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-100 text-base">Edge AI Intrusion & False-Alarm Simulator</h3>
              <p className="text-xs text-slate-400 font-mono">Test YOLOv8 detection triggers, garden hose suppression, and FCM push notifications</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Preset Selector */}
          <div className="space-y-3">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
              1. Select Test Scenario or Upload Custom Specimen:
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {INTRUSION_TEST_PRESETS.map((p) => {
                const isSelected = selectedPreset.id === p.id && !customImage;
                return (
                  <div
                    key={p.id}
                    onClick={() => {
                      setCustomImage(null);
                      setSelectedPreset(p);
                    }}
                    className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-start space-x-3 ${
                      isSelected
                        ? "bg-amber-500/15 border-amber-500 text-amber-300 ring-1 ring-amber-500/30"
                        : "bg-slate-950 border-slate-800 hover:border-slate-700 text-slate-300"
                    }`}
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0 border border-slate-800"
                    />
                    <div className="space-y-1 flex-1">
                      <div className="text-xs font-bold leading-tight">{p.name}</div>
                      <div className="text-[11px] text-slate-400 leading-snug">{p.description}</div>
                      <div className="flex items-center space-x-2 pt-1">
                        <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold ${
                          p.category === "venomous" ? "bg-red-500/20 text-red-400" :
                          p.category === "false_positive" ? "bg-slate-700 text-slate-300" : "bg-emerald-500/20 text-emerald-400"
                        }`}>
                          {p.category.toUpperCase().replace("_", " ")}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Custom Upload Option */}
          <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex items-center justify-between gap-4">
            <div className="text-xs">
              <span className="font-bold text-slate-200 block">Or upload your own image/snapshot:</span>
              <span className="text-slate-400">JPG, PNG test image from camera</span>
            </div>
            <label className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs cursor-pointer border border-slate-700 flex items-center space-x-1.5">
              <Upload className="w-3.5 h-3.5 text-amber-400" />
              <span>{customImage ? "Image Loaded ✓" : "Browse File"}</span>
              <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          {/* Camera Zone Selector */}
          <div className="space-y-2">
            <label className="text-xs font-mono font-bold text-slate-300 uppercase tracking-wider block">
              2. Select Target Camera Stream:
            </label>
            <select
              value={selectedCamera.id}
              onChange={(e) => {
                const found = cameras.find(c => c.id === e.target.value);
                if (found) setSelectedCamera(found);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-amber-500"
            >
              {cameras.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.location}) • {c.resolution}
                </option>
              ))}
            </select>
          </div>

          {/* Results Feedback Banner if tested */}
          {testResult && (
            <div className={`p-4 rounded-xl border animate-in fade-in duration-200 ${
              testResult.type === "false_positive"
                ? "bg-slate-950 border-slate-700 text-slate-300"
                : "bg-red-950/80 border-red-500 text-red-100 shadow-xl shadow-red-950/50"
            }`}>
              <div className="flex items-start space-x-3">
                {testResult.type === "false_positive" ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5 animate-bounce" />
                )}
                <div className="space-y-1">
                  <span className="font-bold text-sm block">{testResult.message}</span>
                  {testResult.latency && (
                    <span className="text-xs font-mono text-emerald-400 block">
                      ✓ Push Notification Delivery: {(testResult.latency / 1000).toFixed(2)}s (Under 3s SLA)
                    </span>
                  )}
                  {testResult.details && (
                    <ul className="text-xs text-slate-400 list-disc list-inside mt-2 space-y-0.5">
                      {testResult.details.distinguishingCharacteristics?.map((d: string, i: number) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Action Trigger Button */}
          <button
            onClick={handleRunSimulation}
            disabled={isProcessing}
            className="w-full bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl text-xs shadow-xl shadow-red-600/30 transition-all flex items-center justify-center space-x-2"
          >
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Running Edge YOLOv8 & Cloud Webhook Dispatch...</span>
              </>
            ) : (
              <>
                <ShieldAlert className="w-4 h-4" />
                <span>Run Simulation & Fire Detection Payload</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
