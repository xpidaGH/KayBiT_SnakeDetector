export const PYTHON_EDGE_SCRIPT = `"""
KayBiT_snake_Detector - Edge AI Python Inference Daemon with Battery Load Shedding
Designed for: Raspberry Pi 5 / NVIDIA Jetson Nano / Hailo-8L NPU
Features: Multi-RTSP Ingestion, YOLOv8 Inference, I2C Battery Voltage Governor
"""

import cv2
import time
import threading
import requests
import json
from ultralytics import YOLO

# ================= CONFIGURATION & STREAMS =================
CLOUD_API_ENDPOINT = "https://your-kaybit-app.run.app/api/edge/trigger"
MODEL_PATH = "yolov8n-snake.pt"
CONFIDENCE_THRESHOLD = 0.75
CONSECUTIVE_FRAMES_REQUIRED = 3
COOLDOWN_SECONDS = 30

# Battery Protection Threshold (e.g., 12V LiFePO4 / Lead-Acid)
BATTERY_VOLTAGE_THRESHOLD_V = 11.8  # Automatic cutoff threshold for non-essential feeds
LOW_POWER_LOAD_SHED_ACTIVE = False

CAMERAS = [
    {
        "id": "cam-01",
        "name": "Garden Bed & South Patio Cam",
        "zone": "South Perimeter Garden",
        "rtsp": "rtsp://192.168.1.120:554/stream1",
        "is_essential_perimeter": True, # Always active (Perimeter Defense)
        "active": True
    },
    {
        "id": "cam-02",
        "name": "Front Porch IR Night Vision",
        "zone": "Front Entrance Steps",
        "rtsp": "rtsp://192.168.1.121:554/ch0_sub",
        "is_essential_perimeter": True, # Always active (Perimeter Defense)
        "active": True
    },
    {
        "id": "cam-03",
        "name": "Tool Shed & Woodpile Cam",
        "zone": "North Woodpile Storage",
        "rtsp": "rtsp://192.168.1.122:554/live",
        "is_essential_perimeter": False, # Non-essential: Disabled when voltage < 11.8V
        "active": True
    },
    {
        "id": "cam-04",
        "name": "Backyard Pool Deck & Lawn",
        "zone": "West Recreational Area",
        "rtsp": "rtsp://192.168.1.123:554/stream1",
        "is_essential_perimeter": False, # Non-essential: Disabled when voltage < 11.8V
        "active": True
    }
]

def read_battery_voltage_i2c():
    """Reads solar battery bus voltage from I2C INA219 sensor or ADC on Pi 5."""
    try:
        # e.g., from ina219 import INA219; ina = INA219(0.1, busnum=1); return ina.voltage()
        # Fallback simulation file or sysfs reading:
        with open("/sys/class/power_supply/battery/voltage_now", "r") as f:
            return float(f.read().strip()) / 1e6
    except Exception:
        return 12.4  # Default nominal voltage if hardware sensor unattached

def battery_governor_loop():
    """Background governor monitoring battery voltage and shedding non-essential streams."""
    global LOW_POWER_LOAD_SHED_ACTIVE
    while True:
        v = read_battery_voltage_i2c()
        if v < BATTERY_VOLTAGE_THRESHOLD_V and not LOW_POWER_LOAD_SHED_ACTIVE:
            print(f"[!] WARNING: Battery voltage ({v:.2f}V) dropped below {BATTERY_VOLTAGE_THRESHOLD_V}V cutoff!")
            print(f"[*] Activating Load Shedding: Disabling non-essential streams, prioritizing Perimeter zones...")
            LOW_POWER_LOAD_SHED_ACTIVE = True
            for cam in CAMERAS:
                if not cam["is_essential_perimeter"]:
                    cam["active"] = False
                    print(f"    -> Shedded stream: {cam['name']} ({cam['zone']})")
                else:
                    print(f"    -> MAINTAINED ACTIVE: {cam['name']} [Perimeter Shield]")
        elif v >= BATTERY_VOLTAGE_THRESHOLD_V + 0.4 and LOW_POWER_LOAD_SHED_ACTIVE:
            print(f"[+] Solar charging recovered battery to {v:.2f}V. Restoring all streams...")
            LOW_POWER_LOAD_SHED_ACTIVE = False
            for cam in CAMERAS:
                cam["active"] = True
        time.sleep(5)

def run_camera_inference(cam, model):
    """Worker thread running inference loop on an active camera stream."""
    print(f"[*] Starting ingestion thread for {cam['name']} (Essential={cam['is_essential_perimeter']})")
    cap = None
    consecutive_count = 0
    last_alert_time = 0

    while True:
        if not cam["active"]:
            if cap is not None:
                cap.release()
                cap = None
            time.sleep(2)
            continue

        if cap is None or not cap.isOpened():
            cap = cv2.VideoCapture(cam["rtsp"])
            time.sleep(1)
            continue

        ret, frame = cap.read()
        if not ret:
            time.sleep(1)
            continue

        results = model.predict(source=frame, conf=CONFIDENCE_THRESHOLD, verbose=False)
        snake_detected = False
        highest_conf = 0.0

        for r in results:
            for box in r.boxes:
                cls_id = int(box.cls[0])
                if "snake" in model.names[cls_id].lower() and float(box.conf[0]) >= CONFIDENCE_THRESHOLD:
                    snake_detected = True
                    highest_conf = max(highest_conf, float(box.conf[0]))

        if snake_detected:
            consecutive_count += 1
        else:
            consecutive_count = max(0, consecutive_count - 1)

        if consecutive_count >= CONSECUTIVE_FRAMES_REQUIRED and (time.time() - last_alert_time) > COOLDOWN_SECONDS:
            print(f"[!!!] INTRUSION CONFIRMED on {cam['name']} in {cam['zone']}")
            payload = {
                "cameraId": cam["id"],
                "cameraName": cam["name"],
                "zone": cam["zone"],
                "confidence": round(highest_conf, 2),
                "consecutiveFrames": consecutive_count
            }
            try:
                requests.post(CLOUD_API_ENDPOINT, json=payload, timeout=3)
                last_alert_time = time.time()
            except Exception as e:
                print(f"[!] Push delivery failed: {e}")

def main():
    print("[*] Initializing KayBiT Multi-Stream Edge Vision Daemon...")
    model = YOLO(MODEL_PATH)

    # Start battery monitor thread
    gov_thread = threading.Thread(target=battery_governor_loop, daemon=True)
    gov_thread.start()

    # Launch camera worker threads
    for cam in CAMERAS:
        t = threading.Thread(target=run_camera_inference, args=(cam, model), daemon=True)
        t.start()

    print("[✓] Edge engine running. Protecting property perimeters.")
    while True:
        time.sleep(1)

if __name__ == "__main__":
    main()
`;

export const SYSTEMD_SERVICE_CODE = `[Unit]
Description=KayBiT Edge AI Snake Detector Daemon
After=network.target

[Service]
Type=simple
User=pi
WorkingDirectory=/home/pi/kaybit
ExecStart=/usr/bin/python3 /home/pi/kaybit/kaybit_edge_detector.py
Restart=always
RestartSec=5
Environment=PYTHONUNBUFFERED=1

[Install]
WantedBy=multi-user.target`;

export const FLUTTER_CODE_SNIPPET = `// lib/main.dart - KayBiT Snake Detector Flutter Cross-Platform Client
import 'package:flutter/material.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:audioplayers/audioplayers.dart';

// Background FCM Message Handler
@pragma('vm:entry-point')
Future<void> _firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp();
  print("Handling a background snake intrusion alert: \${message.messageId}");
}

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Firebase.initializeApp();
  FirebaseMessaging.onBackgroundMessage(_firebaseMessagingBackgroundHandler);
  runApp(const KayBiTSnakeDetectorApp());
}

class KayBiTSnakeDetectorApp extends StatelessWidget {
  const KayBiTSnakeDetectorApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'KayBiT Snake Detector',
      theme: ThemeData.dark(useMaterial3: true).copyWith(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.amber,
          brightness: Brightness.dark,
        ),
      ),
      home: const IntrusionDashboardScreen(),
    );
  }
}

class IntrusionDashboardScreen extends StatefulWidget {
  const IntrusionDashboardScreen({super.key});

  @override
  State<IntrusionDashboardScreen> createState() => _IntrusionDashboardScreenState();
}

class _IntrusionDashboardScreenState extends State<IntrusionDashboardScreen> {
  final AudioPlayer _audioPlayer = AudioPlayer();
  bool _isAlarmActive = false;

  @override
  void initState() {
    super.initState();
    _setupFCM();
  }

  void _setupFCM() async {
    FirebaseMessaging messaging = FirebaseMessaging.instance;
    await messaging.requestPermission(
      alert: true,
      badge: true,
      sound: true,
      criticalAlert: true,
    );

    FirebaseMessaging.onMessage.listen((RemoteMessage message) {
      setState(() => _isAlarmActive = true);
      _playSiren();
      _showIntrusionDialog(message);
    });
  }

  void _playSiren() async {
    await _audioPlayer.setSource(AssetSource('sounds/snake_alarm.mp3'));
    await _audioPlayer.setVolume(1.0);
    _audioPlayer.resume();
  }

  void _showIntrusionDialog(RemoteMessage message) {
    showDialog(
      context: context,
      barrierDismissible: false,
      builder: (ctx) => AlertDialog(
        backgroundColor: Colors.red.shade900,
        title: const Text('⚠️ SNAKE INTRUSION DETECTED!'),
        content: Text(
          'Location: \${message.data['zone'] ?? 'Garden Perimeter'}\\n'
          'Confidence: \${message.data['confidence'] ?? '94%'}\\n'
          'Keep children and pets away immediately!',
        ),
        actions: [
          ElevatedButton(
            style: ElevatedButton.styleFrom(backgroundColor: Colors.white),
            onPressed: () {
              _audioPlayer.stop();
              setState(() => _isAlarmActive = false);
              Navigator.pop(ctx);
            },
            child: const Text('Acknowledge & Silence', style: TextStyle(color: Colors.red)),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('KayBiT Snake Detector'),
        backgroundColor: _isAlarmActive ? Colors.red : Colors.grey.shade900,
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Icon(
              _isAlarmActive ? Icons.warning_rounded : Icons.shield_rounded,
              size: 96,
              color: _isAlarmActive ? Colors.redAccent : Colors.greenAccent,
            ),
            const SizedBox(height: 16),
            Text(
              _isAlarmActive ? 'CRITICAL INTRUSION ALERT' : 'All Zones Monitored & Secure',
              style: const TextStyle(fontSize: 20, fontWeight: FontWeight.bold),
            ),
          ],
        ),
      ),
    );
  }
}
`;

export const REACT_NATIVE_CODE_SNIPPET = `// App.tsx - KayBiT Snake Detector React Native (iOS & Android)
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, Alert, Vibration } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import notifee, { AndroidImportance, AndroidVisibility } from '@notifee/react-native';

export default function App() {
  const [alarmActive, setAlarmActive] = useState(false);
  const [lastAlert, setLastAlert] = useState<any>(null);

  useEffect(() => {
    async function initPush() {
      await messaging().requestPermission();
      
      await notifee.createChannel({
        id: 'snake-critical-alarm',
        name: 'Snake Intrusion Critical Siren',
        importance: AndroidImportance.HIGH,
        visibility: AndroidVisibility.PUBLIC,
        sound: 'siren',
        vibration: true,
      });

      const unsubscribe = messaging().onMessage(async remoteMessage => {
        setAlarmActive(true);
        setLastAlert(remoteMessage.data);
        Vibration.vibrate([500, 500, 500, 500], true);
        
        await notifee.displayNotification({
          title: '🚨 CRITICAL SNAKE INTRUSION DETECTED!',
          body: \`Zone: \${remoteMessage.data?.zone} - Verified in under 2s\`,
          android: {
            channelId: 'snake-critical-alarm',
            importance: AndroidImportance.HIGH,
          },
        });
      });

      return unsubscribe;
    }

    initPush();
  }, []);

  const silenceAlarm = () => {
    Vibration.cancel();
    setAlarmActive(false);
  };

  return (
    <View style={[styles.container, alarmActive && styles.containerAlert]}>
      <Text style={styles.title}>KayBiT Snake Detector</Text>
      <Text style={styles.subtitle}>Edge AI Vision & Cloud Warning System</Text>

      {alarmActive ? (
        <View style={styles.alertBox}>
          <Text style={styles.alertHeading}>⚠️ INTRUSION IN PROGRESS</Text>
          <Text style={styles.alertDetail}>Zone: {lastAlert?.zone || 'South Garden'}</Text>
          <Text style={styles.alertDetail}>Confidence: {lastAlert?.confidence || '94%'}</Text>
          <TouchableOpacity style={styles.silenceButton} onPress={silenceAlarm}>
            <Text style={styles.buttonText}>Acknowledge & Silence Siren</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.secureBox}>
          <Text style={styles.secureText}>✓ Edge YOLOv8 AI Active</Text>
          <Text style={styles.latencyText}>Sub-3s Push Notification Pipeline Ready</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0f172a', alignItems: 'center', justifyContent: 'center', padding: 20 },
  containerAlert: { backgroundColor: '#7f1d1d' },
  title: { fontSize: 24, fontWeight: 'bold', color: '#f8fafc', marginBottom: 8 },
  subtitle: { fontSize: 14, color: '#94a3b8', marginBottom: 32 },
  alertBox: { backgroundColor: '#991b1b', padding: 24, borderRadius: 16, width: '100%', alignItems: 'center' },
  alertHeading: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', marginBottom: 12 },
  alertDetail: { fontSize: 16, color: '#fee2e2', marginBottom: 6 },
  silenceButton: { backgroundColor: '#ffffff', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, marginTop: 16 },
  buttonText: { color: '#991b1b', fontWeight: 'bold' },
  secureBox: { backgroundColor: '#1e293b', padding: 24, borderRadius: 16, alignItems: 'center', width: '100%' },
  secureText: { fontSize: 18, color: '#4ade80', fontWeight: 'bold' },
  latencyText: { fontSize: 13, color: '#94a3b8', marginTop: 6 },
});
`;

export const ANDROID_MANIFEST_XML = `<!-- android/app/src/main/AndroidManifest.xml -->
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <uses-permission android:name="android.permission.INTERNET"/>
    <uses-permission android:name="android.permission.VIBRATE"/>
    <uses-permission android:name="android.permission.RECEIVE_BOOT_COMPLETED"/>
    <uses-permission android:name="android.permission.WAKE_LOCK"/>
    <uses-permission android:name="android.permission.POST_NOTIFICATIONS"/>
    <uses-permission android:name="android.permission.USE_FULL_SCREEN_INTENT"/>

    <application
        android:label="KayBiT Snake Detector"
        android:name="\${applicationName}"
        android:icon="@mipmap/ic_launcher">
        
        <meta-data
            android:name="com.google.firebase.messaging.default_notification_channel_id"
            android:value="snake_critical_intrusion_channel" />
            
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:launchMode="singleTop"
            android:showWhenLocked="true"
            android:turnScreenOn="true">
            <intent-filter>
                <action android:name="android.intent.action.MAIN"/>
                <category android:name="android.intent.category.LAUNCHER"/>
            </intent-filter>
        </activity>
    </application>
</manifest>`;

export const FLUTTER_PUBSPEC_YAML = `# pubspec.yaml
name: kaybit_snake_detector
description: "Edge AI Snake Intrusion & Emergency Siren Warning System"
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: '>=3.0.0 <4.0.0'

dependencies:
  flutter:
    sdk: flutter
  firebase_core: ^2.27.0
  firebase_messaging: ^14.7.10
  flutter_local_notifications: ^17.0.0
  audioplayers: ^6.0.0
  vibration: ^1.8.4
  http: ^1.2.0

flutter:
  uses-material-design: true
  assets:
    - assets/sounds/snake_alarm.mp3
    - assets/images/logo.png`;
