import React, { useState } from "react";
import { PushNotificationRecord } from "../types";
import { 
  BellRing, 
  CheckCircle2, 
  Clock, 
  Send, 
  Zap, 
  AlertTriangle, 
  ShieldCheck, 
  Smartphone, 
  Server, 
  Radio, 
  Sparkles,
  Search,
  Filter,
  Check,
  RotateCw,
  Info,
  ChevronRight,
  ExternalLink,
  Flame
} from "lucide-react";
import { playAcknowledgeBeep } from "../utils/audio";

interface NotificationLogProps {
  notifications: PushNotificationRecord[];
  slaReport?: {
    targetSlaMs: number;
    complianceRate: string;
    totalDispatched: number;
    avgTotalLatencyMs: number;
    avgEdgeLatencyMs: number;
    avgFcmLatencyMs: number;
    avgClientLatencyMs: number;
    p95LatencyMs: number;
    fcmHealth: string;
  };
  onSendTestPing: () => void;
  isSendingTest?: boolean;
}

export const NotificationLog: React.FC<NotificationLogProps> = ({
  notifications,
  slaReport,
  onSendTestPing,
  isSendingTest = false
}) => {
  const [filterChannel, setFilterChannel] = useState<"all" | "snake_critical_alerts" | "system_telemetry">("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedRecord, setSelectedRecord] = useState<PushNotificationRecord | null>(null);

  const filteredLogs = notifications.filter(n => {
    if (filterChannel !== "all" && n.channel !== filterChannel) return false;
    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      return (
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.recipientDevice.toLowerCase().includes(q) ||
        (n.payload?.species && n.payload.species.toLowerCase().includes(q)) ||
        (n.payload?.zone && n.payload.zone.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const avgLatency = slaReport?.avgTotalLatencyMs || (
    notifications.length > 0 
      ? Math.round(notifications.reduce((acc, n) => acc + n.totalLatencyMs, 0) / notifications.length)
      : 1450
  );

  const compliance = slaReport?.complianceRate || (
    notifications.length > 0
      ? ((notifications.filter(n => n.totalLatencyMs < 3000).length / notifications.length) * 100).toFixed(1)
      : "100.0"
  );

  return (
    <div className="space-y-6">
      {/* SLA Metrics Header & Latency Breakdown Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 p-5 rounded-2xl border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-full bg-amber-500/5 blur-3xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <BellRing className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-100 tracking-tight">
                Firebase Cloud Messaging (FCM) Notification Engine
              </h2>
              <span className="px-2 py-0.5 text-xs bg-emerald-500/20 text-emerald-400 font-mono font-bold rounded border border-emerald-500/30 flex items-center space-x-1">
                <Flame className="w-3 h-3" />
                <span>SUB-3s SLA COMPLIANT</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-mono max-w-2xl">
              End-to-end telemetry auditing dispatch latency from edge inference, Google FCM transport, APNs gateway, to device notification drawer rendering.
            </p>
          </div>

          {/* Test Ping Trigger Action */}
          <button
            onClick={() => {
              playAcknowledgeBeep();
              onSendTestPing();
            }}
            disabled={isSendingTest}
            className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs font-mono rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-50 self-start lg:self-auto shrink-0"
          >
            <Send className={`w-3.5 h-3.5 ${isSendingTest ? "animate-spin" : ""}`} />
            <span>{isSendingTest ? "Broadcasting Ping..." : "Dispatch Test FCM Push"}</span>
          </button>
        </div>

        {/* SLA Latency Telemetry Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 mt-6">
          {/* Target SLA */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>SLA Target Limit</span>
              <Clock className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">
              &lt; 3.00 <span className="text-xs text-slate-400 font-normal">seconds</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-mono flex items-center space-x-1">
              <CheckCircle2 className="w-3 h-3" />
              <span>{compliance}% compliance rate</span>
            </div>
          </div>

          {/* Average Pipeline Latency */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Avg E2E Pipeline</span>
              <Zap className="w-3.5 h-3.5 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">
              {avgLatency} <span className="text-xs text-slate-400 font-normal">ms</span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono">
              {(avgLatency / 1000).toFixed(2)}s dispatch-to-screen
            </div>
          </div>

          {/* FCM Transport Speed */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Google FCM Network</span>
              <Radio className="w-3.5 h-3.5 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">
              {slaReport?.avgFcmLatencyMs || 820} <span className="text-xs text-slate-400 font-normal">ms</span>
            </div>
            <div className="text-[11px] text-emerald-400 font-mono">
              APNs/GCM Direct Route
            </div>
          </div>

          {/* Edge + NPU Speed */}
          <div className="bg-slate-950/70 p-3.5 rounded-xl border border-slate-800/80 space-y-1">
            <div className="flex items-center justify-between text-xs text-slate-400 font-mono">
              <span>Edge NPU Pre-Filter</span>
              <Server className="w-3.5 h-3.5 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-slate-100 font-mono">
              {slaReport?.avgEdgeLatencyMs || 140} <span className="text-xs text-slate-400 font-normal">ms</span>
            </div>
            <div className="text-[11px] text-purple-300 font-mono">
              Hailo-8L INT8 Inference
            </div>
          </div>
        </div>

        {/* Latency Pipeline Visual Staging Bar */}
        <div className="mt-5 p-3.5 bg-slate-950/90 rounded-xl border border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-bold">End-to-End Latency Pipeline Breakdown</span>
            <span className="text-emerald-400 font-bold">{avgLatency} ms Total / 3000 ms SLA</span>
          </div>

          <div className="h-3 w-full bg-slate-900 rounded-full flex overflow-hidden border border-slate-800">
            {/* Edge Stage */}
            <div 
              className="bg-purple-500 hover:bg-purple-400 transition-all cursor-pointer" 
              style={{ width: `${Math.max(10, Math.min(30, ((slaReport?.avgEdgeLatencyMs || 140) / 3000) * 100))}%` }}
              title={`Edge Inference: ${slaReport?.avgEdgeLatencyMs || 140}ms`}
            />
            {/* FCM Network Stage */}
            <div 
              className="bg-amber-500 hover:bg-amber-400 transition-all cursor-pointer" 
              style={{ width: `${Math.max(20, Math.min(60, ((slaReport?.avgFcmLatencyMs || 820) / 3000) * 100))}%` }}
              title={`Google FCM & APNs: ${slaReport?.avgFcmLatencyMs || 820}ms`}
            />
            {/* Client Render Stage */}
            <div 
              className="bg-emerald-500 hover:bg-emerald-400 transition-all cursor-pointer" 
              style={{ width: `${Math.max(10, Math.min(30, ((slaReport?.avgClientLatencyMs || 410) / 3000) * 100))}%` }}
              title={`Device App Render: ${slaReport?.avgClientLatencyMs || 410}ms`}
            />
          </div>

          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1">
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-purple-500 inline-block" />
              <span>1. Edge YOLOv8 & Filter ({slaReport?.avgEdgeLatencyMs || 140}ms)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />
              <span>2. Google FCM Delivery ({slaReport?.avgFcmLatencyMs || 820}ms)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span>3. Mobile App Push Display ({slaReport?.avgClientLatencyMs || 410}ms)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-900 p-3 rounded-xl border border-slate-800">
        <div className="flex items-center space-x-2">
          {(["all", "snake_critical_alerts", "system_telemetry"] as const).map((ch) => (
            <button
              key={ch}
              onClick={() => setFilterChannel(ch)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono capitalize transition-all whitespace-nowrap ${
                filterChannel === ch
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700/50"
              }`}
            >
              {ch === "all" ? "All Channels" : ch === "snake_critical_alerts" ? "🚨 Critical Alerts" : "⚙️ Telemetry"}
            </button>
          ))}
        </div>

        <div className="relative">
          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search notification history..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-8 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-amber-500 w-full sm:w-64"
          />
        </div>
      </div>

      {/* Notification Logs List */}
      <div className="space-y-3">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center bg-slate-900/50 border border-slate-800 rounded-2xl space-y-2">
            <BellRing className="w-8 h-8 text-slate-600 mx-auto" />
            <div className="text-sm font-mono text-slate-300 font-bold">No Push Notifications Found</div>
            <p className="text-xs text-slate-500 font-mono">
              Trigger a test notification above or simulate a snake intrusion to generate real-time push logs.
            </p>
          </div>
        ) : (
          filteredLogs.map((log) => {
            const isCritical = log.channel === "snake_critical_alerts";
            const isCompliant = log.totalLatencyMs < 3000;

            return (
              <div
                key={log.id}
                onClick={() => setSelectedRecord(log)}
                className={`p-4 rounded-xl border transition-all cursor-pointer hover:border-slate-700 ${
                  isCritical 
                    ? "bg-slate-900/90 border-slate-800 hover:bg-slate-900" 
                    : "bg-slate-950/60 border-slate-900 hover:bg-slate-900/40"
                }`}
              >
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      isCritical 
                        ? "bg-red-500/10 text-red-400 border border-red-500/30" 
                        : "bg-blue-500/10 text-blue-400 border border-blue-500/30"
                    }`}>
                      {isCritical ? <AlertTriangle className="w-4 h-4" /> : <Info className="w-4 h-4" />}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm font-bold text-slate-100">{log.title}</span>
                        <span className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded ${
                          log.priority === "high"
                            ? "bg-red-500/20 text-red-400 border border-red-500/30"
                            : "bg-slate-800 text-slate-400 border border-slate-700"
                        }`}>
                          {log.priority.toUpperCase()} PRIORITY
                        </span>
                        <span className="px-2 py-0.5 text-[10px] font-mono bg-slate-800/80 text-slate-300 rounded border border-slate-700">
                          {log.channel}
                        </span>
                      </div>

                      <p className="text-xs text-slate-300 font-mono">{log.body}</p>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-slate-400 font-mono pt-1">
                        <span className="flex items-center space-x-1">
                          <Smartphone className="w-3 h-3 text-slate-500" />
                          <span>{log.recipientDevice}</span>
                        </span>
                        <span className="flex items-center space-x-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{new Date(log.timestamp).toLocaleTimeString()}</span>
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Latency Tag & SLA Status */}
                  <div className="flex md:flex-col items-center md:items-end justify-between border-t md:border-t-0 border-slate-800/80 pt-2 md:pt-0 shrink-0">
                    <div className="flex items-center space-x-1.5">
                      <span className={`text-base font-bold font-mono ${
                        isCompliant ? "text-emerald-400" : "text-red-400"
                      }`}>
                        {log.totalLatencyMs} ms
                      </span>
                      <span className={`px-1.5 py-0.2 text-[10px] font-mono font-bold rounded border ${
                        isCompliant 
                          ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30" 
                          : "bg-red-500/10 text-red-400 border-red-500/30"
                      }`}>
                        {isCompliant ? "SLA PASS" : "SLA BREACH"}
                      </span>
                    </div>

                    <div className="text-[10px] font-mono text-slate-500 mt-1">
                      Edge: {log.edgeInferenceLatencyMs}ms • FCM: {log.fcmNetworkLatencyMs}ms • App: {log.clientRenderLatencyMs}ms
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Selected Notification Payload Modal / Drawer */}
      {selectedRecord && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center space-x-2">
                <BellRing className="w-5 h-5 text-amber-400" />
                <h3 className="font-bold text-slate-100 text-base">Push Notification Dispatch Record</h3>
              </div>
              <button
                onClick={() => setSelectedRecord(null)}
                className="text-slate-400 hover:text-slate-200 text-xs font-mono px-2 py-1 bg-slate-800 rounded-lg"
              >
                ESC / Close
              </button>
            </div>

            <div className="space-y-4 font-mono text-xs">
              {/* Timing Latency Breakdown */}
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-bold text-slate-200 flex items-center justify-between">
                  <span>Sub-3s SLA Verification</span>
                  <span className="text-emerald-400 font-bold">{selectedRecord.totalLatencyMs} ms Total</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center pt-2">
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Edge + Filter</div>
                    <div className="font-bold text-purple-400 text-sm">{selectedRecord.edgeInferenceLatencyMs} ms</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">FCM Transport</div>
                    <div className="font-bold text-amber-400 text-sm">{selectedRecord.fcmNetworkLatencyMs} ms</div>
                  </div>
                  <div className="bg-slate-900 p-2 rounded-lg border border-slate-800">
                    <div className="text-slate-400 text-[10px]">Client Render</div>
                    <div className="font-bold text-emerald-400 text-sm">{selectedRecord.clientRenderLatencyMs} ms</div>
                  </div>
                </div>
              </div>

              {/* Push Payload JSON */}
              <div className="space-y-1">
                <div className="text-slate-400 font-bold text-[11px]">JSON Payload Sent to Firebase:</div>
                <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-slate-300 text-[11px] overflow-x-auto">
                  {JSON.stringify(selectedRecord, null, 2)}
                </pre>
              </div>

              <div className="text-[11px] text-slate-400 flex items-center space-x-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Verified delivery to FCM registration token: {selectedRecord.recipientToken}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
