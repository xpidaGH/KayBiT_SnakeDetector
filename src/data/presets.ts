import { CameraFeed } from "../types";

export interface TestPreset {
  id: string;
  name: string;
  category: "venomous" | "non_venomous" | "false_positive" | "night_vision";
  imageUrl: string;
  expectedSpecies: string;
  expectedConfidence: number;
  expectedVenom: "Highly Venomous" | "Non-Venomous" | "Mildly Venomous" | "Unknown";
  isNightVision: boolean;
  consecutiveFrames: number;
  isFalsePositive: boolean;
  description: string;
}

export const INITIAL_CAMERAS: CameraFeed[] = [
  {
    id: "cam-01",
    name: "Garden Bed & South Patio Cam",
    location: "South Perimeter Garden",
    zoneId: "zone-garden",
    rtspUrl: "rtsp://192.168.1.120:554/stream1",
    fps: 30,
    resolution: "1080p Full HD (Sony STARVIS 2)",
    isNightVision: false,
    status: "alert",
    currentInferenceLatencyMs: 24,
    lastDetection: "4 minutes ago",
    previewUrl: "https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=1200&q=80",
    isEssential: true,
    priority: "critical_perimeter",
    powerDrawWatts: 4.2,
    health: {
      temperatureC: 41.2,
      cpuUsagePercent: 32,
      memoryUsagePercent: 44,
      codec: "H.265 / HEVC",
      signalQuality: 98,
      bitrateStability: 96,
      frameDropRate: 0.00,
      ipAddress: "192.168.1.120",
      powerDrawWatts: 4.2
    }
  },
  {
    id: "cam-02",
    name: "Front Porch IR Night Vision",
    location: "Front Entrance Steps",
    zoneId: "zone-entry",
    rtspUrl: "rtsp://192.168.1.121:554/ch0_sub",
    fps: 25,
    resolution: "4K UHD Infrared (850nm IR LEDs)",
    isNightVision: true,
    status: "live",
    currentInferenceLatencyMs: 29,
    lastDetection: "1 hour ago (Suppressed)",
    previewUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=1200&q=80",
    isEssential: true,
    priority: "critical_perimeter",
    powerDrawWatts: 5.1,
    health: {
      temperatureC: 38.6,
      cpuUsagePercent: 28,
      memoryUsagePercent: 40,
      codec: "H.264 High Profile",
      signalQuality: 92,
      bitrateStability: 91,
      frameDropRate: 0.01,
      ipAddress: "192.168.1.121",
      powerDrawWatts: 5.1
    }
  },
  {
    id: "cam-03",
    name: "Tool Shed & Woodpile Cam",
    location: "North Woodpile Storage",
    zoneId: "zone-storage",
    rtspUrl: "rtsp://192.168.1.122:554/live",
    fps: 25,
    resolution: "1080p Starlight Cam",
    isNightVision: true,
    status: "standby",
    currentInferenceLatencyMs: 31,
    lastDetection: "28 minutes ago",
    previewUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=1200&q=80",
    isEssential: false,
    priority: "standard",
    powerDrawWatts: 3.4,
    health: {
      temperatureC: 44.0,
      cpuUsagePercent: 36,
      memoryUsagePercent: 48,
      codec: "H.265 / HEVC",
      signalQuality: 88,
      bitrateStability: 89,
      frameDropRate: 0.02,
      ipAddress: "192.168.1.122",
      powerDrawWatts: 3.4
    }
  },
  {
    id: "cam-04",
    name: "Backyard Pool Deck & Lawn",
    location: "West Recreational Area",
    zoneId: "zone-recreational",
    rtspUrl: "rtsp://192.168.1.123:554/stream1",
    fps: 30,
    resolution: "2K Wide Angle PTZ",
    isNightVision: false,
    status: "live",
    currentInferenceLatencyMs: 22,
    lastDetection: "Yesterday 16:40",
    previewUrl: "https://images.unsplash.com/photo-1509198397868-475647b2a1e5?auto=format&fit=crop&w=1200&q=80",
    isEssential: false,
    priority: "low",
    powerDrawWatts: 4.8,
    health: {
      temperatureC: 36.5,
      cpuUsagePercent: 22,
      memoryUsagePercent: 38,
      codec: "H.264 High Profile",
      signalQuality: 99,
      bitrateStability: 98,
      frameDropRate: 0.00,
      ipAddress: "192.168.1.123",
      powerDrawWatts: 4.8
    }
  }
];

export const INTRUSION_TEST_PRESETS: TestPreset[] = [
  {
    id: "copperhead",
    name: "Eastern Copperhead (Live Specimen)",
    category: "venomous",
    imageUrl: "https://images.unsplash.com/photo-1531386151447-fd76ad50012f?auto=format&fit=crop&w=800&q=80",
    expectedSpecies: "Eastern Copperhead (Agkistrodon contortrix)",
    expectedConfidence: 0.94,
    expectedVenom: "Highly Venomous",
    isNightVision: false,
    consecutiveFrames: 4,
    isFalsePositive: false,
    description: "Coiled in backyard garden mulch with characteristic hourglass pattern. High threat."
  },
  {
    id: "rat_snake",
    name: "Black Rat Snake (Harmless Rodent Hunter)",
    category: "non_venomous",
    imageUrl: "https://images.unsplash.com/photo-1548767797-d8c844163c4c?auto=format&fit=crop&w=800&q=80",
    expectedSpecies: "Black Rat Snake (Pantherophis obsoletus)",
    expectedConfidence: 0.89,
    expectedVenom: "Non-Venomous",
    isNightVision: false,
    consecutiveFrames: 3,
    isFalsePositive: false,
    description: "Climbing timber woodpile. Non-venomous beneficial constrictor."
  },
  {
    id: "garden_hose",
    name: "Coiled Green Garden Hose (False Alarm Test)",
    category: "false_positive",
    imageUrl: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?auto=format&fit=crop&w=800&q=80",
    expectedSpecies: "Garden Hose / Rubber Line (Suppressed)",
    expectedConfidence: 0.61,
    expectedVenom: "Non-Venomous",
    isNightVision: false,
    consecutiveFrames: 1,
    isFalsePositive: true,
    description: "Stationary rubber hose on patio. Edge consecutive-frame filter suppresses push notification."
  },
  {
    id: "ir_night_snake",
    name: "Nocturnal Pit Viper (850nm IR Stream)",
    category: "night_vision",
    imageUrl: "https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?auto=format&fit=crop&w=800&q=80",
    expectedSpecies: "Timber Rattlesnake (Crotalus horridus)",
    expectedConfidence: 0.92,
    expectedVenom: "Highly Venomous",
    isNightVision: true,
    consecutiveFrames: 5,
    isFalsePositive: false,
    description: "Captured by IR illuminator at 02:40 AM moving across front driveway."
  }
];
