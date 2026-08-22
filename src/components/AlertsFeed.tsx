import React, { useState } from "react";
import { DetectionAlert, AlertStatus } from "../types";
import { 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  ShieldAlert, 
  Sparkles, 
  Moon, 
  Trash2, 
  Check, 
  XCircle, 
  Eye, 
  Filter,
  Zap,
  Info,
  Download,
  FileSpreadsheet,
  FileCode
} from "lucide-react";
import { playAcknowledgeBeep } from "../utils/audio";

interface AlertsFeedProps {
  alerts: DetectionAlert[];
  onUpdateStatus: (alertId: string, status: AlertStatus) => void;
  onDeleteAlert: (alertId: string) => void;
  onOpenAnalysis: (alert: DetectionAlert) => void;
  onVerifyFalsePositive: (alert: DetectionAlert) => void;
}

export const AlertsFeed: React.FC<AlertsFeedProps> = ({
  alerts,
  onUpdateStatus,
  onDeleteAlert,
  onOpenAnalysis,
  onVerifyFalsePositive
}) => {
  const [filter, setFilter] = useState<"all" | "active" | "acknowledged" | "resolved" | "false_positive">("all");
  const [selectedSnapshot, setSelectedSnapshot] = useState<DetectionAlert | null>(null);
  const [exportNotice, setExportNotice] = useState<string | null>(null);

  const filteredAlerts = alerts.filter(a => {
    if (filter === "all") return true;
    return a.status === filter;
  });

  const activeCount = alerts.filter(a => a.status === "active").length;

  const handleExportCSV = () => {
    playAcknowledgeBeep();
    const dataToExport = filteredAlerts.length > 0 ? filteredAlerts : alerts;

    const headers = [
      "Alert ID",
      "Timestamp",
      "Camera ID",
      "Camera Name",
      "Zone",
      "Species Candidate",
      "Venom Rating",
      "YOLOv8 Confidence",
      "Consecutive Frames",
      "Latency (ms)",
      "Night Vision",
      "Status",
      "Bounding Box X (%)",
      "Bounding Box Y (%)",
      "Bounding Box W (%)",
      "Bounding Box H (%)",
      "AI Species Diagnosis",
      "AI Scientific Name",
      "AI Danger Level"
    ];

    const escapeCsv = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const rows = dataToExport.map(a => [
      escapeCsv(a.id),
      escapeCsv(a.timestamp),
      escapeCsv(a.cameraId),
      escapeCsv(a.cameraName),
      escapeCsv(a.zone),
      escapeCsv(a.speciesCandidate || "Unknown"),
      escapeCsv(a.venomousRating || "Unknown"),
      escapeCsv(a.confidence.toFixed(4)),
      escapeCsv(a.consecutiveFrames),
      escapeCsv(a.latencyMs),
      escapeCsv(a.isNightVision ? "Yes" : "No"),
      escapeCsv(a.status),
      escapeCsv(a.boundingBox?.x ?? ""),
      escapeCsv(a.boundingBox?.y ?? ""),
      escapeCsv(a.boundingBox?.width ?? ""),
      escapeCsv(a.boundingBox?.height ?? ""),
      escapeCsv(a.aiAnalysis?.species || ""),
      escapeCsv(a.aiAnalysis?.scientificName || ""),
      escapeCsv(a.aiAnalysis?.dangerLevel || "")
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(r => r.join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `kaybit_snake_alerts_${new Date().toISOString().split("T")[0]}.csv`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(`Exported ${dataToExport.length} detection records to CSV (${filename})`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  const handleExportJSON = () => {
    playAcknowledgeBeep();
    const dataToExport = filteredAlerts.length > 0 ? filteredAlerts : alerts;
    const jsonPayload = {
      exportMetadata: {
        application: "KayBiT Edge AI Snake Detector",
        exportedAt: new Date().toISOString(),
        totalRecords: dataToExport.length,
        filterApplied: filter,
        slaTargetMs: 3000
      },
      alerts: dataToExport
    };

    const blob = new Blob([JSON.stringify(jsonPayload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    const filename = `kaybit_snake_alerts_${new Date().toISOString().split("T")[0]}.json`;
    link.setAttribute("href", url);
    link.setAttribute("download", filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(`Exported ${dataToExport.length} detection records to JSON (${filename})`);
    setTimeout(() => setExportNotice(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header & Latency SLA Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-4 rounded-xl border border-slate-800 backdrop-blur">
        <div>
          <div className="flex items-center space-x-2">
            <h2 className="text-lg font-bold text-slate-100">Snake Intrusion Alerts & Push History</h2>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 text-xs bg-red-500 text-white rounded-full font-bold font-mono animate-pulse">
                {activeCount} ACTIVE
              </span>
            )}
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Real-time edge detections with low-latency snapshot verification and FCM notification delivery.
          </p>
        </div>

        {/* Latency SLA badge */}
        <div className="flex items-center space-x-3 bg-slate-950 px-3.5 py-2 rounded-lg border border-slate-800 text-xs font-mono">
          <div className="flex items-center space-x-1.5 text-amber-400">
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Target SLA: &lt; 3.0s</span>
          </div>
          <span className="text-slate-600">|</span>
          <span className="text-emerald-400 font-bold">Avg Delivery: 1.48s</span>
        </div>
      </div>

      {/* Filter Tabs and Export Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Filter Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-1 scrollbar-none">
          {(["all", "active", "acknowledged", "resolved", "false_positive"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all whitespace-nowrap ${
                filter === f
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "bg-slate-800/80 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
              }`}
            >
              {f.replace("_", " ")} ({alerts.filter(a => f === "all" ? true : a.status === f).length})
            </button>
          ))}
        </div>

        {/* Data Export Action Buttons */}
        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportCSV}
            title="Download detection dataset as CSV spreadsheet"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>
          
          <button
            onClick={handleExportJSON}
            title="Download full detection objects as JSON payload"
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 rounded-lg text-xs font-mono flex items-center space-x-1.5 transition-all shadow-sm active:scale-95"
          >
            <FileCode className="w-3.5 h-3.5 text-amber-400" />
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* Export Notification Banner */}
      {exportNotice && (
        <div className="p-3 bg-emerald-950/70 border border-emerald-500/40 rounded-xl text-emerald-300 text-xs font-mono flex items-center space-x-2 animate-in fade-in slide-in-from-top-1 duration-200 shadow-lg">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{exportNotice}</span>
        </div>
      )}

      {/* Alerts Grid / List */}
      {filteredAlerts.length === 0 ? (
        <div className="text-center py-12 bg-slate-900/40 rounded-xl border border-slate-800">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-slate-200">No alerts in this category</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            All property perimeter zones are secure. Edge AI YOLOv8 model is scanning RTSP feeds.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredAlerts.map((alert) => {
            const isActive = alert.status === "active";
            const isFalsePos = alert.status === "false_positive";

            return (
              <div
                key={alert.id}
                className={`rounded-xl border transition-all overflow-hidden flex flex-col justify-between ${
                  isActive
                    ? "bg-red-950/40 border-red-500/70 shadow-lg shadow-red-950/50 ring-1 ring-red-500/30"
                    : isFalsePos
                    ? "bg-slate-900/50 border-slate-800 opacity-75"
                    : "bg-slate-900/80 border-slate-800 hover:border-slate-700"
                }`}
              >
                {/* Alert Card Header */}
                <div className="p-4 border-b border-slate-800/80">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center space-x-2">
                      <div className={`p-1.5 rounded-lg ${
                        isActive
                          ? "bg-red-500 text-white"
                          : isFalsePos
                          ? "bg-slate-800 text-slate-400"
                          : "bg-amber-500/20 text-amber-400 border border-amber-500/30"
                      }`}>
                        {isActive ? <ShieldAlert className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                      </div>
                      <div>
                        <h4 className="font-semibold text-sm text-slate-100">{alert.zone}</h4>
                        <p className="text-xs text-slate-400 font-mono">{alert.cameraName}</p>
                      </div>
                    </div>

                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      isActive
                        ? "bg-red-500 text-white animate-pulse"
                        : alert.status === "acknowledged"
                        ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                        : alert.status === "resolved"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                        : "bg-slate-800 text-slate-400"
                    }`}>
                      {alert.status.replace("_", " ")}
                    </span>
                  </div>

                  {/* Badges row */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-3">
                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono flex items-center space-x-1">
                      <Clock className="w-3 h-3 text-slate-400" />
                      <span>{new Date(alert.timestamp).toLocaleTimeString()}</span>
                    </span>

                    <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded text-[11px] font-mono font-semibold">
                      Conf: {(alert.confidence * 100).toFixed(0)}%
                    </span>

                    <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px] font-mono">
                      {alert.consecutiveFrames} Frames
                    </span>

                    <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-mono flex items-center space-x-0.5">
                      <Zap className="w-3 h-3 text-emerald-400" />
                      <span>{(alert.latencyMs / 1000).toFixed(2)}s Latency</span>
                    </span>

                    {alert.isNightVision && (
                      <span className="bg-emerald-950/80 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded text-[11px] font-mono flex items-center space-x-1">
                        <Moon className="w-3 h-3 text-emerald-400" />
                        <span>IR Night</span>
                      </span>
                    )}

                    {alert.venomousRating && (
                      <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold ${
                        alert.venomousRating === "Highly Venomous"
                          ? "bg-red-500/20 text-red-300 border border-red-500/40"
                          : alert.venomousRating === "Non-Venomous"
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                          : "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      }`}>
                        {alert.venomousRating}
                      </span>
                    )}
                  </div>
                </div>

                {/* Snapshot Image Preview with Bounding Box */}
                <div className="relative aspect-video bg-slate-950 overflow-hidden cursor-pointer group" onClick={() => setSelectedSnapshot(alert)}>
                  <img
                    src={alert.imageUrl}
                    alt={alert.zone}
                    className={`w-full h-full object-cover transition-transform group-hover:scale-105 duration-300 ${
                      alert.isNightVision ? "filter grayscale contrast-125" : ""
                    }`}
                  />
                  
                  {/* Bounding Box Visual Overlay */}
                  <div
                    className="absolute border-2 border-red-500 bg-red-500/20 rounded shadow-md pointer-events-none"
                    style={{
                      left: `${alert.boundingBox.x}%`,
                      top: `${alert.boundingBox.y}%`,
                      width: `${alert.boundingBox.width}%`,
                      height: `${alert.boundingBox.height}%`
                    }}
                  >
                    <span className="absolute -top-5 left-0 bg-red-600 text-white font-mono text-[9px] font-bold px-1.5 py-0.2 rounded">
                      {alert.boundingBox.label}
                    </span>
                  </div>

                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="bg-black/80 text-white text-xs font-mono px-3 py-1.5 rounded-lg border border-slate-700 flex items-center space-x-1.5">
                      <Eye className="w-3.5 h-3.5 text-amber-400" />
                      <span>Expand Snapshot & Analysis</span>
                    </span>
                  </div>
                </div>

                {/* Species Candidate & Action Toolbar */}
                <div className="p-3.5 bg-slate-950/60 border-t border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Identified Candidate:</span>
                    <span className="font-semibold text-slate-200">{alert.speciesCandidate || "Ophidian Specimen"}</span>
                  </div>

                  {/* Actions Buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => onOpenAnalysis(alert)}
                      className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1 shadow-sm"
                    >
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Gemini AI Species</span>
                    </button>

                    <button
                      onClick={() => onVerifyFalsePositive(alert)}
                      className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center justify-center space-x-1 border border-slate-700"
                    >
                      <Info className="w-3.5 h-3.5 text-slate-400" />
                      <span>Hose / False Filter</span>
                    </button>
                  </div>

                  {/* Status update row */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/60 text-xs">
                    {isActive ? (
                      <button
                        onClick={() => {
                          playAcknowledgeBeep();
                          onUpdateStatus(alert.id, "acknowledged");
                        }}
                        className="text-amber-400 hover:text-amber-300 font-mono flex items-center space-x-1 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        <span>Acknowledge Siren</span>
                      </button>
                    ) : alert.status !== "resolved" ? (
                      <button
                        onClick={() => {
                          playAcknowledgeBeep();
                          onUpdateStatus(alert.id, "resolved");
                        }}
                        className="text-emerald-400 hover:text-emerald-300 font-mono flex items-center space-x-1 transition-colors"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Mark Resolved</span>
                      </button>
                    ) : (
                      <span className="text-emerald-400 font-mono text-[11px] flex items-center space-x-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Resolved & Cleared</span>
                      </span>
                    )}

                    <button
                      onClick={() => onDeleteAlert(alert.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                      title="Delete alert record"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Snapshot Modal */}
      {selectedSnapshot && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-3xl w-full overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-slate-100">{selectedSnapshot.zone} — Snapshot Evidence</h3>
                <p className="text-xs text-slate-400 font-mono">{selectedSnapshot.cameraName} • {new Date(selectedSnapshot.timestamp).toLocaleString()}</p>
              </div>
              <button
                onClick={() => setSelectedSnapshot(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="relative aspect-video bg-slate-950">
              <img
                src={selectedSnapshot.imageUrl}
                alt="Intrusion snapshot"
                className="w-full h-full object-cover"
              />
              <div
                className="absolute border-2 border-red-500 bg-red-500/20 rounded shadow-md"
                style={{
                  left: `${selectedSnapshot.boundingBox.x}%`,
                  top: `${selectedSnapshot.boundingBox.y}%`,
                  width: `${selectedSnapshot.boundingBox.width}%`,
                  height: `${selectedSnapshot.boundingBox.height}%`
                }}
              >
                <span className="absolute -top-6 left-0 bg-red-600 text-white font-mono text-[10px] font-bold px-2 py-0.5 rounded shadow">
                  {selectedSnapshot.boundingBox.label}
                </span>
              </div>
            </div>

            <div className="p-4 bg-slate-950 flex items-center justify-between">
              <div className="text-xs font-mono text-slate-300 space-x-3">
                <span>Confidence: <strong>{(selectedSnapshot.confidence * 100).toFixed(0)}%</strong></span>
                <span>Consecutive: <strong>{selectedSnapshot.consecutiveFrames} Frames</strong></span>
                <span>Latency: <strong>{selectedSnapshot.latencyMs}ms</strong></span>
              </div>
              <button
                onClick={() => {
                  const alertToAnalyze = selectedSnapshot;
                  setSelectedSnapshot(null);
                  onOpenAnalysis(alertToAnalyze);
                }}
                className="bg-amber-500 hover:bg-amber-600 text-slate-950 font-bold px-4 py-2 rounded-lg text-xs transition-colors flex items-center space-x-1.5"
              >
                <Sparkles className="w-4 h-4" />
                <span>Run Gemini AI Deep Diagnostics</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
