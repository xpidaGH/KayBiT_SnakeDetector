/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  DetectionAlert, 
  CameraFeed, 
  PropertyZone, 
  EdgeDeviceConfig, 
  SystemMetrics,
  AlertStatus
} from "./types";
import { INITIAL_CAMERAS, PROPERTY_ZONES } from "./data/mockData";
import { Navbar } from "./components/Navbar";
import { LiveMonitor } from "./components/LiveMonitor";
import { AlertsFeed } from "./components/AlertsFeed";
import { PropertyZoneMap } from "./components/PropertyZoneMap";
import { EdgeDeviceManager } from "./components/EdgeDeviceManager";
import { NotificationLog } from "./components/NotificationLog";
import { StudentRoadmapHub } from "./components/StudentRoadmapHub";
import { CrossPlatformPackagingModal } from "./components/CrossPlatformPackagingModal";
import { SystemHealthDashboard } from "./components/SystemHealthDashboard";
import { SpeciesAnalysisModal } from "./components/SpeciesAnalysisModal";
import { SimulatorModal } from "./components/SimulatorModal";
import { UserGuideModal } from "./components/UserGuideModal";
import { SplashScreen } from "./components/SplashScreen";
import { 
  playSnakeIntrusionAlarm, 
  startContinuousSiren, 
  stopContinuousSiren, 
  playAcknowledgeBeep 
} from "./utils/audio";
import { AlertTriangle, BellRing, VolumeX, Shield, Radio, Sparkles } from "lucide-react";
import { PushNotificationRecord } from "./types";

export default function App() {
  const [activeTab, setActiveTab] = useState<"monitor" | "alerts" | "zones" | "edge" | "health" | "notifications" | "roadmap" | "packaging">("monitor");
  const [cameras, setCameras] = useState<CameraFeed[]>(INITIAL_CAMERAS);
  const [selectedCamera, setSelectedCamera] = useState<CameraFeed>(INITIAL_CAMERAS[0]);
  const [zones] = useState<PropertyZone[]>(PROPERTY_ZONES);
  const [alerts, setAlerts] = useState<DetectionAlert[]>([]);
  const [notifications, setNotifications] = useState<PushNotificationRecord[]>([]);
  const [slaReport, setSlaReport] = useState<any>(null);
  const [isSendingTestPing, setIsSendingTestPing] = useState<boolean>(false);
  const [metrics, setMetrics] = useState<SystemMetrics | null>(null);
  const [isNightVisionGlobal, setIsNightVisionGlobal] = useState<boolean>(false);
  const [isContinuousSirenOn, setIsContinuousSirenOn] = useState<boolean>(false);
  const [selectedAlertForAnalysis, setSelectedAlertForAnalysis] = useState<DetectionAlert | null>(null);
  const [isSimulatorOpen, setIsSimulatorOpen] = useState<boolean>(false);
  const [isUserGuideOpen, setIsUserGuideOpen] = useState<boolean>(false);

  // Fetch initial alerts, status, and FCM notifications
  useEffect(() => {
    fetchStatus();
    fetchAlerts();
    fetchNotifications();
    const interval = setInterval(() => {
      fetchStatus();
      fetchAlerts();
      fetchNotifications();
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  const fetchStatus = async () => {
    try {
      const res = await fetch("/api/status");
      const data = await res.json();
      setMetrics(data);
    } catch (e) {
      console.warn("Status fetch error:", e);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await fetch("/api/alerts");
      const data = await res.json();
      setAlerts(data);
    } catch (e) {
      console.warn("Alerts fetch error:", e);
    }
  };

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications");
      const data = await res.json();
      if (data.notifications) {
        setNotifications(data.notifications);
        setSlaReport(data.slaReport);
      }
    } catch (e) {
      console.warn("Notifications fetch error:", e);
    }
  };

  const handleSendTestPing = async () => {
    try {
      setIsSendingTestPing(true);
      const res = await fetch("/api/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priority: "high", channel: "snake_critical_alerts" })
      });
      const data = await res.json();
      if (data.notification) {
        setNotifications(prev => [data.notification, ...prev]);
        fetchNotifications();
      }
    } catch (e) {
      console.warn("Test ping error:", e);
    } finally {
      setIsSendingTestPing(false);
    }
  };

  const handleToggleSiren = () => {
    if (isContinuousSirenOn) {
      stopContinuousSiren();
      setIsContinuousSirenOn(false);
    } else {
      startContinuousSiren();
      setIsContinuousSirenOn(true);
    }
  };

  const handleUpdateAlertStatus = async (alertId: string, status: AlertStatus) => {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      });
      fetchAlerts();
      fetchStatus();
    } catch (e) {
      console.warn("Update status error:", e);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}`, { method: "DELETE" });
      fetchAlerts();
      fetchStatus();
    } catch (e) {
      console.warn("Delete alert error:", e);
    }
  };

  const handleUpdateEdgeConfig = async (newConfig: Partial<EdgeDeviceConfig>) => {
    try {
      await fetch("/api/edge/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newConfig)
      });
      fetchStatus();
    } catch (e) {
      console.warn("Update config error:", e);
    }
  };

  const handleTriggerSimulatedDetection = async (cam: CameraFeed, isNight: boolean) => {
    try {
      const res = await fetch("/api/edge/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cameraId: cam.id,
          cameraName: cam.name,
          zone: cam.location,
          confidence: 0.94,
          consecutiveFrames: 4,
          isNightVision: isNight,
          speciesCandidate: isNight ? "Timber Rattlesnake (IR Starlight)" : "Eastern Copperhead (Live Specimen)",
          venomousRating: "Highly Venomous"
        })
      });
      const data = await res.json();
      if (data.alert) {
        fetchAlerts();
        fetchStatus();
      }
    } catch (e) {
      console.warn("Trigger simulated error:", e);
    }
  };

  const handleTriggerZoneIntrusion = async (zone: PropertyZone) => {
    const cam = cameras.find(c => zone.cameraIds.includes(c.id)) || cameras[0];
    handleTriggerSimulatedDetection(cam, isNightVisionGlobal);
  };

  const handleToggleCameraEssential = (cameraId: string) => {
    setCameras(prev => prev.map(c => {
      if (c.id === cameraId) {
        const nextEssential = !c.isEssential;
        return {
          ...c,
          isEssential: nextEssential,
          priority: nextEssential ? ("critical_perimeter" as const) : ("standard" as const)
        };
      }
      return c;
    }));
  };

  // Derive dynamic camera statuses based on power save mode and essential flag
  const isPowerSaveActive = metrics?.edgeDevice?.powerSaveModeActive ?? false;
  const effectiveCameras = cameras.map(cam => {
    const isPerimeter = cam.isEssential || cam.priority === "critical_perimeter";
    if (isPowerSaveActive && !isPerimeter) {
      return { ...cam, status: "power_save_disabled" as const };
    }
    return cam;
  });

  const activeAlerts = alerts.filter(a => a.status === "active");

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-amber-500 selection:text-slate-950 flex flex-col">
      {/* Top Strobe / Warning Banner if Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="bg-red-600 text-white px-4 py-2 text-xs font-mono font-bold flex items-center justify-between shadow-lg shadow-red-600/30 animate-pulse sticky top-0 z-50">
          <div className="flex items-center space-x-2">
            <BellRing className="w-4 h-4 animate-bounce" />
            <span>⚠️ CRITICAL SNAKE INTRUSION ALERT: {activeAlerts[0].zone} — Keep children & pets clear!</span>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => {
                playAcknowledgeBeep();
                handleUpdateAlertStatus(activeAlerts[0].id, "acknowledged");
              }}
              className="bg-white text-red-700 hover:bg-red-50 px-2.5 py-1 rounded text-xs font-bold transition-colors cursor-pointer"
            >
              Silence Siren
            </button>
            <button
              onClick={() => setSelectedAlertForAnalysis(activeAlerts[0])}
              className="bg-red-800 hover:bg-red-900 text-white px-2.5 py-1 rounded text-xs font-bold transition-colors hidden sm:inline-block cursor-pointer"
            >
              Species AI
            </button>
          </div>
        </div>
      )}

      {/* Main Navigation Header */}
      <Navbar
        metrics={metrics}
        isNightVisionGlobal={isNightVisionGlobal}
        onToggleNightVision={() => setIsNightVisionGlobal(!isNightVisionGlobal)}
        isContinuousSirenOn={isContinuousSirenOn}
        onToggleSiren={handleToggleSiren}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenSimulator={() => setIsSimulatorOpen(true)}
        onOpenUserGuide={() => setIsUserGuideOpen(true)}
      />

      {/* Main Content Body */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full space-y-6">
        {/* Quick-Start Splash Banner */}
        <SplashScreen
          onOpenUserGuide={() => setIsUserGuideOpen(true)}
          onOpenSimulator={() => setIsSimulatorOpen(true)}
          onSelectTab={setActiveTab}
          activeTab={activeTab}
        />

        {activeTab === "monitor" && (
          <LiveMonitor
            cameras={effectiveCameras}
            selectedCamera={effectiveCameras.find(c => c.id === selectedCamera.id) || effectiveCameras[0]}
            onSelectCamera={setSelectedCamera}
            onTriggerSimulatedDetection={handleTriggerSimulatedDetection}
            activeAlerts={activeAlerts}
            isNightVisionGlobal={isNightVisionGlobal}
            onOpenAnalysis={setSelectedAlertForAnalysis}
            onSwitchToEdge={() => setActiveTab("edge")}
          />
        )}

        {activeTab === "alerts" && (
          <AlertsFeed
            alerts={alerts}
            onUpdateStatus={handleUpdateAlertStatus}
            onDeleteAlert={handleDeleteAlert}
            onOpenAnalysis={setSelectedAlertForAnalysis}
            onVerifyFalsePositive={(alert) => setIsSimulatorOpen(true)}
          />
        )}

        {activeTab === "zones" && (
          <PropertyZoneMap
            zones={zones}
            cameras={effectiveCameras}
            activeAlerts={activeAlerts}
            onTriggerZoneIntrusion={handleTriggerZoneIntrusion}
          />
        )}

        {activeTab === "edge" && (
          <EdgeDeviceManager
            config={metrics?.edgeDevice || {
              activeModel: "yolov8n-snake.pt",
              confidenceThreshold: 0.75,
              consecutiveFramesRequired: 3,
              nightVisionEnhance: true,
              irContrastBoost: 1.4,
              fcmEnabled: true,
              cooldownSeconds: 45,
              soundAlarmEnabled: true,
              edgeDeviceId: "RPI5-EDGE-ZONE-01",
              edgeDeviceType: "Raspberry Pi 5 (8GB) + Hailo-8L NPU",
              rtspFps: 25,
              inferenceTimeMs: 28,
              uptimeHours: 342.8,
              battery_voltage: 12.6,
              batteryVoltageThreshold: 11.8,
              lowBatteryPowerSaveEnabled: true,
              powerSaveModeActive: false
            }}
            onUpdateConfig={handleUpdateEdgeConfig}
            cameras={effectiveCameras}
            zones={zones}
            onToggleCameraEssential={handleToggleCameraEssential}
            onSelectTab={setActiveTab}
          />
        )}

        {activeTab === "health" && (
          <SystemHealthDashboard
            batteryVoltage={metrics?.edgeDevice?.battery_voltage || 12.6}
            batteryThreshold={metrics?.edgeDevice?.batteryVoltageThreshold || 11.8}
            batteryChemistry={metrics?.edgeDevice?.batteryChemistry || "12v_lifepo4"}
            alerts={alerts}
            onThresholdChange={(thresh) => handleUpdateEdgeConfig({ batteryVoltageThreshold: thresh })}
            onNavigateToNotifications={() => setActiveTab("notifications")}
            onPushNotificationCreated={(notif) => setNotifications(prev => [notif, ...prev])}
            onSelectAlert={(alert) => setSelectedAlertForAnalysis(alert)}
          />
        )}

        {activeTab === "notifications" && (
          <NotificationLog
            notifications={notifications}
            slaReport={slaReport}
            onSendTestPing={handleSendTestPing}
            isSendingTest={isSendingTestPing}
          />
        )}

        {activeTab === "roadmap" && (
          <StudentRoadmapHub />
        )}

        {activeTab === "packaging" && (
          <CrossPlatformPackagingModal />
        )}
      </main>

      {/* Modals */}
      {isUserGuideOpen && (
        <UserGuideModal
          onClose={() => setIsUserGuideOpen(false)}
        />
      )}

      {selectedAlertForAnalysis && (
        <SpeciesAnalysisModal
          alert={selectedAlertForAnalysis}
          onClose={() => setSelectedAlertForAnalysis(null)}
        />
      )}

      {isSimulatorOpen && (
        <SimulatorModal
          cameras={cameras}
          onClose={() => setIsSimulatorOpen(false)}
          onAlertCreated={(newAlert) => {
            fetchAlerts();
            fetchStatus();
          }}
        />
      )}

      {/* Footer */}
      <footer className="bg-slate-900/60 border-t border-slate-800/80 py-4 mt-12 text-center text-xs font-mono text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>KayBiT Snake Detector • Edge AI YOLOv8 + Gemini 3.7 Flash</span>
          <div className="flex items-center space-x-3 text-slate-400">
            <span>Raspberry Pi 5 / Jetson Nano Ready</span>
            <span>•</span>
            <span>Sub-3s Push SLA</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
