# KayBiT Snake Detector 🐍⚡
> **Multiplatform Edge AI Computer Vision & Real-Time Property Defense System**

KayBiT Snake Detector is an end-to-end security, wildlife safety, and edge AI monitoring solution engineered to detect snake intrusions on residential and commercial properties, distinguish them from garden hoses and ropes, track system power and telemetry, and deliver sub-3-second emergency warnings to cross-platform mobile and desktop devices.

---

## 🏛️ High-Level System Architecture

```
[ IP Camera / RTSP 1080p Stream (H.264 / ONVIF) ]
                      │
                      ▼
[ Edge Device: Raspberry Pi 5 + Hailo-8L NPU / Jetson Nano ]
  ├── Power & Telemetry: INA219 I2C Sensor (Voltage, Current, Wattage)
  ├── Preprocessing: 850nm IR CLAHE Adaptive Low-Light Filter
  ├── Inference: Ultralytics YOLOv8 Nano (yolov8n-snake.onnx / engine)
  └── Temporal Logic: 3-Frame Consecutive Confirmation Buffer
                      │
                 (Intrusion Detected!)
                      ▼
[ Cloud Backend & Multimodal Gemini AI Service ]
  ├── Sub-3s SLA Latency Verifier (<1.5s real-world edge-to-client)
  ├── Multimodal Herpetological Diagnosis (Species, Scalation, Venom Rating)
  ├── 24-Hour Temporal Activity Aggregation (Dawn/Dusk peak analytics)
  └── Low-Voltage App-Level Alert Dispatch
                      │
                      ▼
[ Cross-Platform Endpoints (Android APK, iOS, Windows, macOS, Web) ]
  ├── High-Priority Emergency Siren & Screen Strobe
  ├── App-Level Battery Low Warning Toast (Custom threshold + Mute)
  ├── Interactive 4-Zone Property Defense Geofence
  └── Actionable Herpetological Safety & First-Aid Protocols
```

---

## 🚀 Key Features & Subsystems

### 1. 24-Hour Temporal Alert Distribution Analytics
- Visualizes 24-hour alert frequency using **Recharts** to identify diurnal vs. nocturnal peak snake activity times (specifically dusk 18:00–22:00 and dawn 05:00–07:00).
- Highlights high-frequency intrusion windows with actionable perimeter warnings.

### 2. Edge Hardware Health & Telemetry Dashboard
- **Live System Metrics**: Monitors edge CPU utilization, NPU inference FPS, memory usage, and RTSP stream latency.
- **INA219 Power Monitoring**: Tracks solar battery voltage (V), load current (mA), and power consumption (W).
- **App-Level Low Battery Warning System**:
  - Automatically raises high-priority toast warnings when battery voltage drops below configurable thresholds (e.g., 11.8V).
  - Provides instant acoustic muting, real-time threshold adjustment sliders, and built-in diagnostic simulation tools.

### 3. Edge Computer Vision & False-Alarm Suppression
- **Ultralytics YOLOv8 Nano Model**: Trained on custom annotated snake datasets with infrared and scale-texture data augmentation.
- **Multi-Tier Filtering Pipeline**:
  - Confidence thresholding ($\ge 0.75$).
  - 3-frame consecutive temporal buffer (rejects fleeting shadows, hoses, and moving branches).
  - Multimodal Gemini verification for ambiguous targets.

### 4. Property Defense & Sensor Node Geofencing Map
- Interactive spatial map displaying 4 property zones (Front Porch, Garden Perimeter, Back Patio, Storage Shed).
- Zone threat attractant analysis (microclimate, prey presence, and automated strobe deterrent status).
- One-click sector intrusion simulation for testing emergency response workflows.

### 5. Decoupled Modular Data Architecture (`/src/data/`)
- Centralized structured configuration files for clean maintainability:
  - `roadmapData.ts`: 3-phase curriculum, deliverables, and engineering challenges.
  - `packagingData.ts`: Native Android (Capacitor/Gradle), Windows/macOS (Tauri), Flutter, and GitHub Actions CI/CD workflows.
  - `propertyMapData.ts`: Monitored sectors, threat attractants, and spatial metadata.
  - `graphicData.ts`: Hardware architecture schematics and wiring pinouts.

---

## 🎓 Student Development Roadmap

### Phase 1: Train the YOLOv8 Model
1. **Dataset Collection**: Gather labeled images of pit vipers, colubrids, and elapids from Roboflow Universe and Kaggle.
2. **IR Data Augmentation**: Convert 40% of dataset samples to grayscale with simulated 850nm phosphor noise.
3. **Colab GPU Training**: Train `yolov8n.pt` for 80 epochs on T4 GPU:
   ```bash
   yolo detect train data=snake_dataset/data.yaml model=yolov8n.pt epochs=80 imgsz=640
   ```
4. **Edge Export**: Export to ONNX or TensorRT FP16 for Raspberry Pi 5 / Jetson Nano.

### Phase 2: Local Edge Inference & RTSP Pipeline
1. Ingest camera streams using OpenCV: `cv2.VideoCapture("rtsp://admin:pass@192.168.1.120:554/stream1")`.
2. Enforce 3-frame temporal confirmation buffer to eliminate false alarms.
3. Dispatch webhook payload to `/api/edge/trigger`.

### Phase 3: Cross-Platform Mobile & Desktop App
1. Package client application using Capacitor 6 (Android APK), Tauri v2 (Windows/macOS), or Flutter.
2. Configure high-priority push notifications and emergency sirens.
3. Display real-time bounding box snapshots and herpetological safety recommendations.

---

## 📱 Cross-Platform Multi-Target Packaging

| Platform | Framework / Tool | Output Artifact | Build Command |
|---|---|---|---|
| **Android** | Capacitor 6 / Gradle | `app-debug.apk` / `.aab` | `npx cap sync android && ./gradlew assembleDebug` |
| **Windows Desktop** | Tauri v2 (Rust + WebView2) | `.exe` / `.msi` | `npm run tauri build -- --target x86_64-pc-windows-msvc` |
| **macOS Desktop** | Tauri v2 (Rust + WebKit) | `.dmg` (Universal) | `npm run tauri build -- --target universal-apple-darwin` |
| **Cross-Platform Mobile** | Flutter (Dart) | Android APK / iOS IPA | `flutter build apk --release` |
| **CI/CD Automation** | GitHub Actions | Automated GitHub Releases | Automated on `git push tag v*` |

---

## 🛠️ Hardware Bill of Materials (BOM)

| Component | Recommended Model | Est. Cost | Purpose |
|---|---|---|---|
| **Edge Compute** | Raspberry Pi 5 (8GB RAM) | $80 | Hosts RTSP ingest & Python event broker |
| **Neural Accelerator** | Hailo-8L M.2 AI Hat (13 TOPS) | $70 | Real-time YOLOv8 inference (28ms latency) |
| **Night-Vision Camera** | Reolink RLC-810A / 4K IR PoE IP Cam | $95 | 850nm infrared nocturnal surveillance |
| **Power Telemetry** | Waveshare INA219 I2C Sensor Module | $10 | Measures 12V solar battery bus voltage |
| **Solar Power Rig** | 100W Solar Panel + 12V 20Ah LiFePO4 | $70 | Off-grid continuous perimeter power |

---

## 🛡️ Herpetological Safety Protocols
When a high-confidence snake detection is verified:
1. **Immediate Quarantine**: Keep pets and children indoors; do not step into unlit grass.
2. **Visual Identification**: Review the automated Gemini diagnostic card for species verification (e.g. Copperhead vs. harmless Garter Snake).
3. **Safe Evacuation & Relocation**: Contact qualified local wildlife removal services; avoid approaching or cornering the animal.

---

## 📄 License
Apache-2.0 License. Designed for education, property security, wildlife conservation, and edge AI engineering.

