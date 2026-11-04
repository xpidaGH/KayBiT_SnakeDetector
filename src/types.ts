export type AlertStatus = "active" | "acknowledged" | "resolved" | "false_positive";
export type VenomRating = "Highly Venomous" | "Mildly Venomous" | "Non-Venomous" | "Unknown";

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
  label: string;
}

export interface SpeciesAnalysis {
  species: string;
  scientificName: string;
  venomStatus: string;
  dangerLevel: "CRITICAL" | "HIGH" | "MODERATE" | "LOW - BENEFICIAL" | "NONE - FALSE POSITIVE" | "NONE - FALSE ALARM";
  confidence: number;
  visualFeatures: string;
  behavioralNotes?: string;
  habitatContext?: string;
  safetyProtocol: string[];
  firstAidIfBitten?: string[];
  isFalsePositive: boolean;
  falsePositiveReasoning?: string;
}

export interface DetectionAlert {
  id: string;
  cameraId: string;
  cameraName: string;
  zone: string;
  timestamp: string;
  confidence: number;
  consecutiveFrames: number;
  imageUrl: string;
  isNightVision: boolean;
  speciesCandidate?: string;
  venomousRating?: VenomRating;
  status: AlertStatus;
  latencyMs: number;
  boundingBox: BoundingBox;
  aiAnalysis?: SpeciesAnalysis;
}

export interface CameraHealth {
  temperatureC?: number;
  cpuUsagePercent?: number;
  memoryUsagePercent?: number;
  codec?: string;
  signalQuality?: number;
  bitrateStability?: number;
  frameDropRate?: number;
  ipAddress?: string;
  powerDrawWatts?: number;
}

export interface CameraFeed {
  id: string;
  name: string;
  location: string;
  zoneId: string;
  rtspUrl: string;
  fps: number;
  resolution: string;
  isNightVision: boolean;
  status: "live" | "standby" | "alert" | "power_save_disabled";
  currentInferenceLatencyMs: number;
  lastDetection?: string;
  previewUrl: string;
  health?: CameraHealth;
  isEssential?: boolean;
  priority?: "critical_perimeter" | "high" | "standard" | "low";
  powerDrawWatts?: number;
}

export interface PropertyZone {
  id: string;
  name: string;
  type: "perimeter" | "entryway" | "garden" | "recreational" | "storage";
  riskScore: "HIGH" | "MEDIUM" | "LOW";
  cameraIds: string[];
  activeSensors: number;
  description: string;
  coordinates: { x: number; y: number };
  isPerimeterDefense?: boolean;
}

export type AppTheme = "editorial" | "technical" | "warm" | "dark" | "vibrant";

export interface QuietHoursSchedule {
  enabled: boolean;
  preset: "nocturnal_guard" | "battery_saver" | "always_active" | "custom";
  startTime: string; // e.g. "22:00"
  endTime: string;   // e.g. "06:00"
  activeDays: ("Mon" | "Tue" | "Wed" | "Thu" | "Fri" | "Sat" | "Sun")[];
  muteSoundAlarm: boolean;
  suppressFcmToNormal: boolean;
  reducedInferenceFps: number; // e.g. 5 fps during quiet hours
  exemptCriticalPerimeter: boolean; // keep perimeter cameras at full power
  currentScheduleStatus?: "active_monitoring" | "quiet_hours_standby" | "override_active";
}

export interface EdgeDeviceConfig {
  activeModel: string;
  confidenceThreshold: number;
  consecutiveFramesRequired: number;
  nightVisionEnhance: boolean;
  irContrastBoost: number;
  fcmEnabled: boolean;
  cooldownSeconds: number;
  soundAlarmEnabled: boolean;
  edgeDeviceId: string;
  edgeDeviceType: string;
  rtspFps: number;
  inferenceTimeMs: number;
  uptimeHours: number;
  battery_percentage?: number;
  solar_charging?: boolean;
  battery_voltage?: number;
  power_source?: "solar_battery" | "poe" | "mains_ac";
  lowBatteryPowerSaveEnabled?: boolean;
  batteryVoltageThreshold?: number;
  batteryChemistry?: "12v_lifepo4" | "12v_lead_acid" | "3s_li_ion" | "5v_direct";
  criticalZonesPrioritized?: string[];
  activeDisabledCameraIds?: string[];
  powerSaveModeActive?: boolean;
  quietHours?: QuietHoursSchedule;
}

export interface PushNotificationRecord {
  id: string;
  alertId?: string;
  recipientToken: string;
  recipientDevice: string;
  title: string;
  body: string;
  priority: "high" | "normal";
  channel: "snake_critical_alerts" | "system_telemetry";
  status: "delivered" | "sent" | "acknowledged" | "failed";
  timestamp: string;
  deliveredAt?: string;
  edgeInferenceLatencyMs: number;
  fcmNetworkLatencyMs: number;
  clientRenderLatencyMs: number;
  totalLatencyMs: number; // Sum of pipeline (Edge + FCM + Client)
  slaCompliant: boolean; // Total < 3000ms SLA
  payload: {
    species?: string;
    dangerLevel?: string;
    zone?: string;
    confidence?: number;
    imageUrl?: string;
    actionRequired?: string;
  };
}

export interface SystemMetrics {
  status: string;
  edgeDevice: EdgeDeviceConfig;
  activeAlertsCount: number;
  totalDetections: number;
  averageLatencyMs: number;
  cloudSyncTime: string;
  fcmStatus: string;
  geminiStatus: string;
  battery_percentage?: number;
}

export interface Pi5TelemetryPoint {
  timestamp: number;
  timeLabel: string;
  cpuTempC: number;
  npuTempC: number;
  cpuUsagePercent: number;
  memoryUsedMB: number;
  memoryTotalMB: number;
  memoryUsagePercent: number;
  npuLoadPercent: number;
  pcieBandwidthMBs: number;
  fanSpeedRpm: number;
  voltageV: number;
  powerWatts: number;
  throttledHex: string;
}

export interface Pi5SystemHealthSummary {
  cpuTempCurrentC: number;
  cpuTempPeakC: number;
  cpuTempAvgC: number;
  thermalThrottlingActive: boolean;
  thermalThrottlingEverOccurred: boolean;
  underVoltageDetected: boolean;
  armFreqCapped: boolean;
  fanRpm: number;
  fanDutyPercent: number;
  memoryUsedMB: number;
  memoryTotalMB: number;
  memoryPercent: number;
  swapUsedMB: number;
  swapTotalMB: number;
  cmaPoolAllocatedMB: number;
  npuLoadPercent: number;
  npuTempC: number;
  npuOpsPerSec: number;
  pcieBandwidthMBs: number;
  pcieLinkGen: number;
  powerSupplyVoltageV: number;
  currentDrawA: number;
  sdCardWearPercent: number;
  coreLoads: [number, number, number, number];
  uptimeSeconds: number;
  vcgencmdThrottledRaw: string;
}

export interface NpuOverloadAlertIncident {
  id: string;
  timestamp: string;
  loadPercent: number;
  consecutiveCycles: number;
  npuTempC: number;
  status: "active" | "mitigated" | "acknowledged";
  actionTaken?: string;
  pushNotificationId?: string;
}

export interface NpuAlertGovernorConfig {
  thresholdPercent: number;
  consecutiveCyclesRequired: number;
  autoPushNotification: boolean;
  autoMitigate: boolean;
  audioAlarmEnabled: boolean;
}

export type BatteryPhase = 
  | "solar_bulk_charge" 
  | "solar_float" 
  | "sunset_drain" 
  | "night_plateau" 
  | "pre_dawn_critical" 
  | "dawn_ramp";

export interface Battery24hPoint {
  timestamp: number;
  timeLabel: string;
  hourOffset: number; // -24 to 0 (hours from current time)
  voltageV: number;
  unprotectedVoltageV?: number; // Simulated voltage without load shedding
  agedPackVoltageV?: number; // Simulated voltage with degraded pack (70% SOH, higher internal impedance)
  socPercent: number;
  solarWatts: number;
  loadWatts: number;
  netCurrentA: number;
  phase: BatteryPhase;
  isLoadShedding: boolean;
  isNight: boolean;
  internalResistanceSagV: number;
  cellTemperatureC: number;
}

export interface BatteryDegradationSummary {
  peakVoltageV: number;
  minVoltageV: number;
  voltageDeltaV: number;
  avgVoltageV: number;
  currentVoltageV: number;
  currentSocPercent: number;
  deepestDodPercent: number;
  hoursBelowThreshold: number;
  loadSheddingHours: number;
  energyConsumedWh: number;
  energyGeneratedWh: number;
  netEnergyWh: number;
  estimatedSohPercent: number;
  cycleFadeRatePercent: number;
  energyPreservedWh: number;
  additionalRuntimeHours: number;
  averageInternalResistanceMOhms: number;
}
