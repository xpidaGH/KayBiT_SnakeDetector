export interface GuideSection {
  id: string;
  title: string;
  category: "architecture" | "hardware" | "edge_python" | "features" | "zones" | "troubleshooting";
  content: string;
}

export const USER_GUIDE_MD = `# KayBiT Edge AI Snake Detector & Sub-3s Warning System
## Comprehensive User & Engineering Guide (v1.2-edge)

Welcome to the **KayBiT Snake Detector** system manual. This guide outlines everything required to deploy, calibrate, and operate the edge AI visual detection network for venomous and non-venomous ophidian perimeter defense.

---

## 1. System Architecture & Overview

The KayBiT architecture combines on-premises edge computer vision with cloud species diagnostics and instant push notifications:

\`\`\`
[ RTSP IP Cameras / IR Starlight ]
               │
               ▼ (25-30 FPS RTSP Stream)
[ Raspberry Pi 5 + Hailo-8L NPU (13 TOPS) ]
   ├─ YOLOv8 Nano INT8 Quantized Inference (28ms)
   ├─ 3-Frame Temporal Undulation Filter (False Positive Rejection)
   └─ Sub-3s SLA Payload Dispatcher
               │
               ▼ (HTTPS REST / JSON)
[ KayBiT Cloud Gateway & Gemini 3.7 Flash ]
   ├─ Morphological & Herpetological Species AI Diagnosis
   ├─ Hemotoxin / Neurotoxin Danger Level Classification
   └─ First-Aid & Perimeter Evacuation Protocol Generation
               │
               ▼ (High-Priority Direct Channel)
[ Google Firebase Cloud Messaging (FCM) & APNs ]
               │
               ▼ (< 1.5s Total Pipeline Transit)
[ Homeowner & First Responder Cross-Platform Apps (iOS/Android) ]
   ├─ Full-Screen Wakeup Intent & Screen Turn-On
   ├─ 85dB High-Pitch Siren Actuation
   └─ Live Snapshot, Bounding Box & Standoff Safety Checklist
\`\`\`

---

## 2. Hardware Requirements & Recommended Bill of Materials (BOM)

### 2.1 Edge AI Compute Node
- **Primary Single Board Computer (SBC)**: Raspberry Pi 5 (8GB RAM) or NVIDIA Jetson Nano / Orin Nano (8GB).
- **Neural Processing Accelerator**: Hailo-8L M.2 NPU HAT (13 TOPS) or Google Coral USB Accelerator.
- **Storage**: High-Endurance 64GB MicroSD (A2 V30 Class) or M.2 NVMe PCIe SSD.
- **Power**: 27W Official USB-C PD power supply or 12V-to-5V 5A DC-DC buck converter for solar deployment.

### 2.2 Solar / Battery Remote Station (Off-Grid Perimeter Node)
- **Solar PV Panel**: 18W – 50W 18V Monocrystalline Panel.
- **Charge Controller**: 10A MPPT Solar Charge Controller with RS485/UART telemetry.
- **Battery Bank**: 12V 100Ah LiFePO4 Battery with integrated Battery Management System (BMS).
- **Telemetry Interface**: Python edge script reads battery state-of-charge (SoC) via serial bus or ADC and transmits \`battery_percentage\` with hourly telemetry pings.

### 2.3 IP Surveillance Cameras
- **Image Sensor**: Sony STARVIS 2 / Low-Light Starlight CMOS (0.001 Lux sensitivity).
- **IR Illumination**: 850nm / 940nm Infrared Array with Smart IR-Cut filter.
- **Resolution**: 1080p Full HD @ 30 FPS or 4K UHD @ 25 FPS.
- **Protocol**: RTSP (Real Time Streaming Protocol) over H.264/H.265.

---

## 3. Edge Python Daemon Setup

### 3.1 Dependencies Installation
Run the following commands on your Raspberry Pi or Jetson terminal:

\`\`\`bash
# Update system packages
sudo apt update && sudo apt install -y python3-pip python3-opencv ffmpeg

# Install Python dependencies
pip3 install ultralytics opencv-python requests numpy hailo-platform
\`\`\`

### 3.2 Running the Edge Detection Script
Place \`kaybit_edge_detector.py\` in \`/home/pi/kaybit/\` and execute:

\`\`\`bash
python3 /home/pi/kaybit/kaybit_edge_detector.py
\`\`\`

### 3.3 Installing Systemd Auto-Start Service
To ensure the detector runs 24/7 and restarts automatically upon reboot:

\`\`\`ini
# /etc/systemd/system/kaybit-edge.service
[Unit]
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
WantedBy=multi-user.target
\`\`\`

Enable and activate the daemon:
\`\`\`bash
sudo systemctl daemon-reload
sudo systemctl enable kaybit-edge.service
sudo systemctl start kaybit-edge.service
\`\`\`

---

## 4. Key Operating Features

### 4.1 Sub-3s Push Notification SLA
The system measures latency at three crucial milestones:
1. **Edge Inference & Filter**: ~100ms – 160ms (Hailo NPU YOLOv8 execution and temporal frame validation).
2. **Google FCM Transport**: ~600ms – 1100ms (High-priority push payload routing).
3. **Client App Wake-up**: ~200ms – 400ms (Screen display, sound playback, and banner render).
- **Total Guaranteed SLA**: \`< 3000ms\` from physical snake movement in front of camera to smartphone siren.

### 4.2 False Alarm Suppression (Garden Hose & Shadow Rejection)
- **Consecutive Frame Threshold**: Requires \`3\` to \`5\` sequential detections before raising an alarm.
- **Optical Flow Serpentine Analysis**: Evaluates lateral undulation vectors to distinguish living reptiles from static garden hoses, ropes, and irrigation pipes.
- **Cooldown Window**: 30-second deduplication prevents continuous notification flooding while a detected snake remains in the camera's field of view.

### 4.3 IR Night Vision Contrast Boost
- Enhances low-light infrared video frames with histogram equalization and adaptive Gamma correction (1.4x default).
- Unmasks camouflaged nocturnal pit vipers (e.g. Copperheads, Cottonmouths, Rattlesnakes) against wet grass and dark soil.

### 4.4 Gemini 3.7 Flash Species Diagnostics
When an intrusion is captured:
- Edge node sends high-resolution crops directly to Gemini 3.7 Flash.
- Evaluates dorsal scale patterns, head shape (triangular vs oval), heat-sensing loreal pits, and eye pupils.
- Outputs danger level, venom classification, and emergency evacuation guidelines.

### 4.5 Data Export (CSV / JSON)
- Download historical detection logs from the **Alerts Feed** tab.
- Formats include all YOLO confidence scores, bounding boxes, latencies, IR flags, and species classifications for herpetological research.

---

## 5. Property Defense & Zone Geofencing

1. **South Perimeter Garden**: High-risk mulch beds and stone retaining walls. Equipped with automated strobe deterrent linkage.
2. **Front Porch & Entryway**: Zero false-positive zone with brick steps and high foot traffic.
3. **North Woodpile & Tool Shed**: High-risk timber storage area frequented by climbing colubrids and vipers.
4. **West Pool Deck & Lawn**: Open recreational zone with clear line-of-sight cameras.

---

## 6. Troubleshooting & Diagnostics

| Symptom | Probable Cause | Corrective Action |
|---|---|---|
| RTSP stream drops frequently | Wi-Fi signal degradation at edge node | Switch to Power-over-Ethernet (PoE) or install directional 5GHz Wi-Fi extender. |
| High false positives on garden hose | Consecutive frame count too low | Increase \`Consecutive Frames Required\` to 4 or 5 in Edge Device Manager. |
| Inference latency exceeds 60ms | Running on CPU instead of NPU | Verify Hailo-8L / Coral driver is bound to YOLOv8 inference pipeline. |
| Battery percentage dropping rapidly | Insufficient solar panel wattage | Angle solar panel southward at 35° tilt or upgrade to 30W panel. |
| Push notification delayed (> 3s) | Battery saving mode on mobile OS | Add KayBiT app to Android/iOS "Unrestricted Background Activity" whitelist. |
`;

export const GUIDE_CHAPTERS: GuideSection[] = [
  {
    id: "architecture",
    title: "1. System Architecture & Latency SLA",
    category: "architecture",
    content: "The KayBiT architecture combines on-premises edge computer vision (Hailo-8L + YOLOv8) with Gemini 3.7 Flash cloud species diagnostics and sub-3s FCM emergency siren broadcast."
  },
  {
    id: "hardware",
    title: "2. Hardware Bill of Materials & Off-Grid Solar Setup",
    category: "hardware",
    content: "Recommended hardware configurations including Raspberry Pi 5, Hailo-8L M.2 HAT, 12V LiFePO4 battery monitoring with MPPT solar ingress, and Sony STARVIS 2 Starlight IR RTSP cameras."
  },
  {
    id: "edge_python",
    title: "3. Edge Python Daemon & Systemd Daemon Installation",
    category: "edge_python",
    content: "Step-by-step terminal instructions for installing dependencies, downloading kaybit_edge_detector.py, configuring RTSP credentials, and enabling auto-start systemd daemons."
  },
  {
    id: "features",
    title: "4. False Alarm Suppression & Night Vision Tuning",
    category: "features",
    content: "Tuning the consecutive-frame temporal confirmation filter to reject garden hoses, configuring IR contrast boost (1.4x), and reviewing automated CSV/JSON dataset exports."
  },
  {
    id: "zones",
    title: "5. Property Defense & Sensor Geofencing",
    category: "zones",
    content: "Managing 4 distinct defense sectors (South Garden, Front Porch, Tool Shed, Pool Deck) and synchronizing automated visual strobe alarms with camera motion alerts."
  },
  {
    id: "troubleshooting",
    title: "6. Troubleshooting Matrix & Common FAQs",
    category: "troubleshooting",
    content: "Comprehensive resolution steps for RTSP stream dropouts, NPU driver bindings, battery state-of-charge degradation, and mobile OS background wake-up permissions."
  },
  {
    id: "installation",
    title: "7. Native Packaging & Direct Distribution (INSTALLATION.md)",
    category: "architecture",
    content: "Complete step-by-step guide for wrapping into Android APK/AAB (Capacitor), Windows .exe & macOS .dmg (Tauri), iOS PWA, and GitHub Actions CI/CD direct downloads."
  }
];

export const INSTALLATION_GUIDE_MD = `# Native Multi-Platform Packaging & Distribution Guide
## KayBiT Edge AI Snake Detector (Android, iOS/PWA, Windows, macOS)

This document provides an end-to-end blueprint for turning the KayBiT Vite + React TypeScript codebase into installable native applications across Android (.apk/.aab), iOS / Progressive Web App (PWA), Windows (.exe/.msi), and macOS (.dmg) with automated CI/CD builds and download distribution links.

---

## 1. Tooling Selection & Architecture Recommendation

| Platform | Recommended Tool | Rationale | Binary Outputs |
|---|---|---|---|
| Android | Capacitor 6 | Direct native Android WebView bridge, full Firebase Cloud Messaging (FCM) push support, native high-priority background audio/vibration. | .apk (Sideload / Direct download), .aab (Google Play) |
| iOS / Web | PWA + Capacitor iOS | PWA enables 1-click web install without $99/yr Apple Developer fee; Capacitor iOS provides native APNs background wakeup. | Web PWA + .ipa / Xcode project |
| Windows Desktop | Tauri v2 (or Electron) | Ultra-lightweight (~8MB vs Electron's 120MB), native WebView2 engine, low RAM footprint on surveillance monitoring PCs. | .exe (NSIS Installer), .msi |
| macOS Desktop | Tauri v2 | Rust backend wrapping WKWebView, native Apple Silicon (M1/M2/M3/M4) & Intel universal binaries. | .dmg, .app |

---

## 2. Project Restructuring & Adaptations

In \`vite.config.ts\`, set \`base: './'\` (relative paths) so that Capacitor and Tauri can resolve local bundled assets without relying on root \`/\` domain web servers:

\`\`\`typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL for Capacitor & Tauri local asset loading
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  }
});
\`\`\`

---

## 3. Concrete Configuration Files

### 3.1 Mobile Packaging: \`capacitor.config.ts\`

\`\`\`typescript
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kaybit.snakedetector',
  appName: 'KayBiT Snake Detector',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    LocalNotifications: {
      smallIcon: 'ic_stat_snake',
      iconColor: '#f59e0b',
      sound: 'snake_alarm.wav',
    },
  },
  android: {
    allowMixedContent: true,
    captureInput: true,
    webContentsDebuggingEnabled: true,
  }
};

export default config;
\`\`\`

### 3.2 Desktop Packaging: \`src-tauri/tauri.conf.json\`

\`\`\`json
{
  "$schema": "https://raw.githubusercontent.com/tauri-apps/tauri/dev/tooling/cli/schema.json",
  "build": {
    "beforeDevCommand": "npm run dev",
    "beforeBuildCommand": "npm run build",
    "devPath": "http://localhost:3000",
    "distDir": "../dist"
  },
  "package": {
    "productName": "KayBiT Snake Detector",
    "version": "1.2.0"
  },
  "tauri": {
    "bundle": {
      "active": true,
      "category": "Utility",
      "identifier": "com.kaybit.snakedetector.desktop",
      "targets": "all"
    }
  }
}
\`\`\`

---

## 4. Build Automation: GitHub Actions CI/CD (\`.github/workflows/build-all.yml\`)

Builds Android \`.apk\`, Windows \`.exe\`, and macOS \`.dmg\` automatically upon push to repository or new release tag:

\`\`\`yaml
name: Build Native Cross-Platform Binaries

on:
  push:
    tags:
      - 'v*'
    branches:
      - main
  workflow_dispatch:

jobs:
  build-android:
    name: Build Android APK
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'
      - uses: android-actions/setup-android@v3
      - run: npm ci && npm run build
      - run: npx cap add android || true && npx cap sync android
      - working-directory: android
        run: ./gradlew assembleDebug --stacktrace
      - uses: actions/upload-artifact@v4
        with:
          name: KayBiT-Android-APK
          path: android/app/build/outputs/apk/debug/app-debug.apk

  build-desktop:
    name: Build Desktop (\${{ matrix.platform }})
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'windows-latest'
            output: 'src-tauri/target/release/bundle/nsis/*.exe'
          - platform: 'macos-latest'
            output: 'src-tauri/target/release/bundle/dmg/*.dmg'
    runs-on: \${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'
      - uses: dtolnay/rust-toolchain@stable
      - run: npm ci
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v__VERSION__
          releaseName: 'KayBiT v__VERSION__'
          releaseDraft: false
          prerelease: false
\`\`\`

---

## 5. Hosting & Direct Download Links

GitHub Releases CDN provides free global distribution:
- Android APK: \`https://github.com/<USER>/<REPO>/releases/latest/download/KayBiT-SnakeDetector-Android.apk\`
- Windows EXE: \`https://github.com/<USER>/<REPO>/releases/latest/download/KayBiT-Windows-Setup.exe\`
- macOS DMG: \`https://github.com/<USER>/<REPO>/releases/latest/download/KayBiT-macOS-Installer.dmg\`
`;

