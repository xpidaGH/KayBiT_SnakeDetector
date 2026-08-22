import { 
  DetectionAlert, 
  EdgeDeviceConfig, 
  CameraFeed, 
  PropertyZone, 
  PushNotificationRecord,
  AlertStatus
} from "../types";

const DB_NAME = "KayBiT_PWA_OfflineDB";
const DB_VERSION = 1;

// Object Store names
const STORES = {
  ALERTS: "alerts_store",
  CONFIG: "camera_config_store",
  CAMERAS: "camera_feeds_store",
  ZONES: "property_zones_store",
  NOTIFICATIONS: "notifications_store",
  MUTATIONS: "offline_mutation_queue",
  META: "app_metadata"
};

export interface OfflineMutation {
  id?: number;
  timestamp: string;
  action: "UPDATE_ALERT_STATUS" | "DELETE_ALERT" | "UPDATE_EDGE_CONFIG" | "UPDATE_CAMERA" | "TRIGGER_DETECTION";
  endpoint: string;
  method: "POST" | "PATCH" | "DELETE" | "PUT";
  payload: any;
  retryCount: number;
}

export interface StorageStats {
  alertCount: number;
  hasCameraConfig: boolean;
  cameraCount: number;
  notificationCount: number;
  pendingMutationCount: number;
  lastSyncedTimestamp: string | null;
  storageEstimateMB?: number;
}

// Open IndexedDB instance
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined" || !window.indexedDB) {
      reject(new Error("IndexedDB is not supported on this device"));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      if (!db.objectStoreNames.contains(STORES.ALERTS)) {
        const alertStore = db.createObjectStore(STORES.ALERTS, { keyPath: "id" });
        alertStore.createIndex("timestamp", "timestamp", { unique: false });
        alertStore.createIndex("status", "status", { unique: false });
        alertStore.createIndex("cameraId", "cameraId", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.CONFIG)) {
        db.createObjectStore(STORES.CONFIG, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORES.CAMERAS)) {
        db.createObjectStore(STORES.CAMERAS, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORES.ZONES)) {
        db.createObjectStore(STORES.ZONES, { keyPath: "id" });
      }

      if (!db.objectStoreNames.contains(STORES.NOTIFICATIONS)) {
        const notifStore = db.createObjectStore(STORES.NOTIFICATIONS, { keyPath: "id" });
        notifStore.createIndex("timestamp", "timestamp", { unique: false });
      }

      if (!db.objectStoreNames.contains(STORES.MUTATIONS)) {
        db.createObjectStore(STORES.MUTATIONS, { keyPath: "id", autoIncrement: true });
      }

      if (!db.objectStoreNames.contains(STORES.META)) {
        db.createObjectStore(STORES.META, { keyPath: "key" });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// ==========================================
// 1. Historical Alerts Persistence
// ==========================================

export async function saveAlertsLocally(alerts: DetectionAlert[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORES.ALERTS, STORES.META], "readwrite");
    const store = tx.objectStore(STORES.ALERTS);

    for (const alert of alerts) {
      store.put(alert);
    }

    const metaStore = tx.objectStore(STORES.META);
    metaStore.put({ key: "last_alerts_sync", value: new Date().toISOString() });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    // Also fallback to localStorage for fast initial frame
    try {
      localStorage.setItem("kaybit_alerts_cache_count", String(alerts.length));
      localStorage.setItem("kaybit_last_sync", new Date().toISOString());
    } catch {}
  } catch (err) {
    console.warn("Failed to persist alerts in IndexedDB:", err);
  }
}

export async function getStoredAlerts(): Promise<DetectionAlert[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.ALERTS, "readonly");
    const store = tx.objectStore(STORES.ALERTS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const results = request.result as DetectionAlert[];
        // Sort descending by timestamp
        results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(results);
      };
      request.onerror = () => resolve([]);
    });
  } catch (err) {
    console.warn("Error reading stored alerts from IndexedDB:", err);
    return [];
  }
}

export async function updateAlertStatusOffline(alertId: string, status: AlertStatus): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORES.ALERTS, STORES.MUTATIONS], "readwrite");
    const alertStore = tx.objectStore(STORES.ALERTS);
    
    const getReq = alertStore.get(alertId);
    getReq.onsuccess = () => {
      if (getReq.result) {
        const updated = { ...getReq.result, status };
        alertStore.put(updated);
      }
    };

    // Queue mutation for server sync
    const mutationStore = tx.objectStore(STORES.MUTATIONS);
    mutationStore.add({
      timestamp: new Date().toISOString(),
      action: "UPDATE_ALERT_STATUS",
      endpoint: `/api/alerts/${alertId}`,
      method: "PATCH",
      payload: { status },
      retryCount: 0
    });

    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Failed to update alert offline:", err);
  }
}

export async function deleteAlertOffline(alertId: string): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORES.ALERTS, STORES.MUTATIONS], "readwrite");
    const alertStore = tx.objectStore(STORES.ALERTS);
    alertStore.delete(alertId);

    const mutationStore = tx.objectStore(STORES.MUTATIONS);
    mutationStore.add({
      timestamp: new Date().toISOString(),
      action: "DELETE_ALERT",
      endpoint: `/api/alerts/${alertId}`,
      method: "DELETE",
      payload: null,
      retryCount: 0
    });

    return new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Failed to delete alert offline:", err);
  }
}

// ==========================================
// 2. Camera Configuration & Feeds Persistence
// ==========================================

export async function saveEdgeConfigLocally(config: EdgeDeviceConfig): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction([STORES.CONFIG, STORES.META], "readwrite");
    const store = tx.objectStore(STORES.CONFIG);
    store.put({ id: "edge_config", ...config });

    const metaStore = tx.objectStore(STORES.META);
    metaStore.put({ key: "last_config_sync", value: new Date().toISOString() });

    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });

    try {
      localStorage.setItem("kaybit_edge_config_backup", JSON.stringify(config));
    } catch {}
  } catch (err) {
    console.warn("Failed to persist edge config in IndexedDB:", err);
  }
}

export async function getStoredEdgeConfig(): Promise<EdgeDeviceConfig | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.CONFIG, "readonly");
    const store = tx.objectStore(STORES.CONFIG);
    const request = store.get("edge_config");

    return new Promise((resolve) => {
      request.onsuccess = () => {
        if (request.result) {
          const { id, ...config } = request.result;
          resolve(config as EdgeDeviceConfig);
        } else {
          // Fallback to localStorage backup
          const backup = localStorage.getItem("kaybit_edge_config_backup");
          if (backup) {
            try {
              resolve(JSON.parse(backup));
              return;
            } catch {}
          }
          resolve(null);
        }
      };
      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.warn("Error reading stored edge config:", err);
    return null;
  }
}

export async function updateEdgeConfigOffline(newConfig: Partial<EdgeDeviceConfig>): Promise<EdgeDeviceConfig> {
  const current = (await getStoredEdgeConfig()) || {
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
    battery_voltage: 12.6,
    batteryVoltageThreshold: 11.8,
    lowBatteryPowerSaveEnabled: true,
    powerSaveModeActive: false
  };

  const merged = { ...current, ...newConfig } as EdgeDeviceConfig;
  await saveEdgeConfigLocally(merged);

  // Queue mutation for server
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.MUTATIONS, "readwrite");
    const mutationStore = tx.objectStore(STORES.MUTATIONS);
    mutationStore.add({
      timestamp: new Date().toISOString(),
      action: "UPDATE_EDGE_CONFIG",
      endpoint: "/api/edge/config",
      method: "POST",
      payload: newConfig,
      retryCount: 0
    });
  } catch (e) {
    console.warn("Could not queue config mutation:", e);
  }

  return merged;
}

export async function saveCamerasLocally(cameras: CameraFeed[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.CAMERAS, "readwrite");
    const store = tx.objectStore(STORES.CAMERAS);
    for (const cam of cameras) {
      store.put(cam);
    }
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  } catch (err) {
    console.warn("Failed to persist cameras:", err);
  }
}

export async function getStoredCameras(): Promise<CameraFeed[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.CAMERAS, "readonly");
    const store = tx.objectStore(STORES.CAMERAS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result as CameraFeed[]);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function saveZonesLocally(zones: PropertyZone[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.ZONES, "readwrite");
    const store = tx.objectStore(STORES.ZONES);
    for (const z of zones) {
      store.put(z);
    }
  } catch (err) {
    console.warn("Failed to persist property zones:", err);
  }
}

export async function getStoredZones(): Promise<PropertyZone[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.ZONES, "readonly");
    const store = tx.objectStore(STORES.ZONES);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result as PropertyZone[]);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// ==========================================
// 3. Push Notifications Persistence
// ==========================================

export async function saveNotificationsLocally(notifs: PushNotificationRecord[]): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.NOTIFICATIONS, "readwrite");
    const store = tx.objectStore(STORES.NOTIFICATIONS);
    for (const n of notifs) {
      store.put(n);
    }
  } catch (err) {
    console.warn("Failed to persist notifications:", err);
  }
}

export async function getStoredNotifications(): Promise<PushNotificationRecord[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.NOTIFICATIONS, "readonly");
    const store = tx.objectStore(STORES.NOTIFICATIONS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => {
        const results = request.result as PushNotificationRecord[];
        results.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        resolve(results);
      };
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

// ==========================================
// 4. Offline Mutation Queue & Background Sync
// ==========================================

export async function getPendingMutations(): Promise<OfflineMutation[]> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORES.MUTATIONS, "readonly");
    const store = tx.objectStore(STORES.MUTATIONS);
    const request = store.getAll();

    return new Promise((resolve) => {
      request.onsuccess = () => resolve(request.result as OfflineMutation[]);
      request.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

export async function syncPendingMutations(
  onProgress?: (processed: number, total: number) => void
): Promise<{ success: boolean; syncedCount: number; errors: number }> {
  try {
    const mutations = await getPendingMutations();
    if (mutations.length === 0) {
      return { success: true, syncedCount: 0, errors: 0 };
    }

    let syncedCount = 0;
    let errors = 0;

    const db = await openDB();

    for (let i = 0; i < mutations.length; i++) {
      const item = mutations[i];
      try {
        const options: RequestInit = {
          method: item.method,
          headers: { "Content-Type": "application/json" }
        };
        if (item.payload && item.method !== "GET") {
          options.body = JSON.stringify(item.payload);
        }

        const response = await fetch(item.endpoint, options);
        if (response.ok) {
          syncedCount++;
          // Remove processed mutation from queue
          const tx = db.transaction(STORES.MUTATIONS, "readwrite");
          tx.objectStore(STORES.MUTATIONS).delete(item.id!);
          await new Promise<void>((res) => { tx.oncomplete = () => res(); });
        } else {
          errors++;
        }
      } catch {
        errors++;
      }

      if (onProgress) {
        onProgress(i + 1, mutations.length);
      }
    }

    return { success: errors === 0, syncedCount, errors };
  } catch (err) {
    console.warn("Sync mutations failed:", err);
    return { success: false, syncedCount: 0, errors: 1 };
  }
}

// ==========================================
// 5. Diagnostics & Storage Statistics
// ==========================================

export async function getOfflineStorageStats(): Promise<StorageStats> {
  try {
    const alerts = await getStoredAlerts();
    const config = await getStoredEdgeConfig();
    const cameras = await getStoredCameras();
    const notifications = await getStoredNotifications();
    const mutations = await getPendingMutations();

    let storageEstimateMB: number | undefined = undefined;
    if (navigator.storage && navigator.storage.estimate) {
      const estimate = await navigator.storage.estimate();
      if (estimate.usage) {
        storageEstimateMB = parseFloat((estimate.usage / (1024 * 1024)).toFixed(2));
      }
    }

    return {
      alertCount: alerts.length,
      hasCameraConfig: !!config,
      cameraCount: cameras.length,
      notificationCount: notifications.length,
      pendingMutationCount: mutations.length,
      lastSyncedTimestamp: localStorage.getItem("kaybit_last_sync") || null,
      storageEstimateMB
    };
  } catch {
    return {
      alertCount: 0,
      hasCameraConfig: false,
      cameraCount: 0,
      notificationCount: 0,
      pendingMutationCount: 0,
      lastSyncedTimestamp: null
    };
  }
}

export async function clearOfflineStorage(): Promise<void> {
  try {
    const db = await openDB();
    const storeNames = [STORES.ALERTS, STORES.CONFIG, STORES.CAMERAS, STORES.ZONES, STORES.NOTIFICATIONS, STORES.MUTATIONS];
    const tx = db.transaction(storeNames, "readwrite");
    for (const name of storeNames) {
      tx.objectStore(name).clear();
    }
    await new Promise<void>((res) => { tx.oncomplete = () => res(); });
  } catch (err) {
    console.warn("Failed to clear offline storage:", err);
  }
}
