import { EdgeDeviceConfig, PropertyZone } from "../types";

export const DEFAULT_EDGE_CONFIG: EdgeDeviceConfig = {
  activeModel: "yolov8n-snake-v2.pt",
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
  battery_percentage: 88,
  solar_charging: true,
  battery_voltage: 12.6,
  power_source: "solar_battery",
  lowBatteryPowerSaveEnabled: true,
  batteryVoltageThreshold: 11.8,
  batteryChemistry: "12v_lifepo4",
  criticalZonesPrioritized: ["zone-garden", "zone-entry"],
  activeDisabledCameraIds: [],
  powerSaveModeActive: false
};

export const DEFAULT_SLA_TARGET_MS = 3000;

export const DEFAULT_PROPERTY_ZONES: PropertyZone[] = [
  {
    id: "zone-garden",
    name: "South Perimeter Garden",
    type: "garden",
    riskScore: "HIGH",
    cameraIds: ["cam-01"],
    activeSensors: 3,
    description: "Mulch borders, dense ornamental grasses, and stone retaining walls. High rodent transit corridor.",
    coordinates: { x: 70, y: 65 },
    isPerimeterDefense: true
  },
  {
    id: "zone-entry",
    name: "Front Porch & Walkway",
    type: "entryway",
    riskScore: "MEDIUM",
    cameraIds: ["cam-02"],
    activeSensors: 2,
    description: "Brick steps and potted plants. High human foot traffic zone requiring zero false-positive tolerance.",
    coordinates: { x: 30, y: 35 },
    isPerimeterDefense: true
  },
  {
    id: "zone-storage",
    name: "North Woodpile & Tool Shed",
    type: "storage",
    riskScore: "HIGH",
    cameraIds: ["cam-03"],
    activeSensors: 2,
    description: "Dry timber piles, shaded equipment floor. Prime nesting and brumation habitat for colubrids and vipers.",
    coordinates: { x: 25, y: 75 },
    isPerimeterDefense: false
  },
  {
    id: "zone-recreational",
    name: "West Pool Deck & Lawn",
    type: "recreational",
    riskScore: "LOW",
    cameraIds: ["cam-04"],
    activeSensors: 4,
    description: "Open paved flagstones and mowed turf. Clear sightlines with automated strobe deterrent linkage.",
    coordinates: { x: 75, y: 25 },
    isPerimeterDefense: false
  }
];
