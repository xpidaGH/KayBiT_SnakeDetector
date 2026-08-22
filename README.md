# KayBiT Snake Detector 🐍⚡
> **Multiplatform Edge AI Computer Vision & Real-Time Intrusion Warning System**

KayBiT Snake Detector is an end-to-end security and wildlife safety solution engineered to detect snake intrusions on residential and commercial properties, distinguish them from garden hoses and ropes, and deliver sub-3-second emergency warnings to cross-platform mobile devices.

---

## 🏛️ High-Level System Architecture

```
[ IP Camera / RTSP 1080p Stream ]
               │
               ▼
[ Edge Device: Raspberry Pi 5 / NVIDIA Jetson Nano ]
  ├── Preprocessing: Grayscale / 850nm IR CLAHE Filter
  ├── Inference: Ultralytics YOLOv8 Nano (yolov8n-snake.pt)
  └── Temporal Logic: 3-Frame Consecutive Confirmation
               │
          (Snake Detected!)
               ▼
[ Cloud Backend Webhook & Gemini AI ]
  ├── Latency Tracker (Sub-3s SLA validation)
  ├── Multimodal Species & Venom Danger Diagnostic
  └── Cloud Storage Snapshot Evidence
               │
               ▼
[ Cross-Platform Mobile Endpoints (Flutter / React Native / PWA) ]
  ├── Firebase Cloud Messaging (FCM) High-Priority Wake-Up
  ├── High-Decibel Emergency Siren & Strobe UI
  └── Actionable Herpetological Safety Protocol
```

---

## 🚀 Key Features

1. **Sub-3-Second Notification Pipeline**: Optimized end-to-end payload delivery from edge inference (28ms) to mobile siren wake-up (~1.48s).
2. **False-Positive Suppression Filter**: Rejects coiled rubber garden hoses, ropes, and moving tree roots using confidence thresholds (≥0.75) and 3-frame temporal confirmation.
3. **Nocturnal Infrared (IR) Starlight Mode**: Supports 850nm black-and-white infrared camera streams for night-active pit vipers and colubrids.
4. **Gemini 3.7 Flash AI Species & Venom Risk Assessment**: Multimodal herpetological identification providing danger ratings, diagnostic visual markers, and emergency first-aid protocols.
5. **Interactive Edge Test Simulator**: Built-in test bench to simulate snake detections, test webcam streams, and evaluate false alarm filters.
6. **Web Audio High-Urgency Siren**: Native emergency frequency-modulated warble alarm to alert property occupants immediately.

---

## 🎓 Student Development Roadmap

### Phase 1: Train the Model
- **Dataset Collection**: Gather labeled snake images from Roboflow Universe and Kaggle.
- **IR Augmentation**: Convert 40% of images to black-and-white with simulated 850nm camera noise.
- **Training**: Train `yolov8n.pt` for 80 epochs in Google Colab with GPU acceleration.
- **Export**: Export weights to ONNX/TensorRT for Hailo-8L / Jetson Nano accelerators.

### Phase 2: Local Edge Inference Script
- Ingest camera streams via RTSP (`cv2.VideoCapture`).
- Run frame inference with Ultralytics YOLO.
- Enforce 3-frame consecutive confirmation buffer.
- Dispatch REST payload to `/api/edge/trigger`.

### Phase 3: Cross-Platform Mobile Client
- Build with Flutter or React Native.
- Integrate Firebase Cloud Messaging (`firebase_messaging`).
- Handle background wake-lock and full-screen emergency intent.

---

## 📱 Cross-Platform Mobile Packaging Guide

### 1. Flutter Build (Android & iOS)
```bash
# Fetch dependencies
flutter pub get

# Build Android Release APK
flutter build apk --release --split-per-abi

# Build iOS App Store Archive
flutter build ipa --release
```

### 2. React Native Build
```bash
# Install dependencies
npm install @react-native-firebase/app @react-native-firebase/messaging @notifee/react-native

# Run on Android
npx react-native run-android

# Run on iOS
cd ios && pod install && cd .. && npx react-native run-ios
```

### 3. Progressive Web App / Capacitor Packaging
```bash
npm run build
npx cap init "KayBiT Snake Detector" "com.kaybit.snakedetector" --web-dir dist
npx cap add android
npx cap add ios
npx cap sync
npx cap open android
```

---

## 🛡️ License
Apache-2.0 License. Designed for education, property safety, and edge AI engineering.
