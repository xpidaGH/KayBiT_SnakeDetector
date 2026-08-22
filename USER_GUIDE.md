# KayBiT Edge AI Snake Detector & Sub-3s Warning System
## Comprehensive User & Engineering Guide (v1.2-edge)

Welcome to the **KayBiT Snake Detector** system manual. This guide outlines everything required to deploy, calibrate, and operate the edge AI visual detection network for venomous and non-venomous ophidian perimeter defense.

---

## 1. System Architecture & Overview

The KayBiT architecture combines on-premises edge computer vision with cloud species diagnostics and instant push notifications:

```
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
```

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
- **Telemetry Interface**: Python edge script reads battery state-of-charge (SoC) via serial bus or ADC and transmits `battery_percentage` with hourly telemetry pings.

### 2.3 IP Surveillance Cameras
- **Image Sensor**: Sony STARVIS 2 / Low-Light Starlight CMOS (0.001 Lux sensitivity).
- **IR Illumination**: 850nm / 940nm Infrared Array with Smart IR-Cut filter.
- **Resolution**: 1080p Full HD @ 30 FPS or 4K UHD @ 25 FPS.
- **Protocol**: RTSP (Real Time Streaming Protocol) over H.264/H.265.

---

## 3. Edge Python Daemon Setup

### 3.1 Dependencies Installation
Run the following commands on your Raspberry Pi or Jetson terminal:

```bash
# Update system packages
sudo apt update && sudo apt install -y python3-pip python3-opencv ffmpeg

# Install Python dependencies
pip3 install ultralytics opencv-python requests numpy hailo-platform
```

### 3.2 Running the Edge Detection Script
Place `kaybit_edge_detector.py` in `/home/pi/kaybit/` and execute:

```bash
python3 /home/pi/kaybit/kaybit_edge_detector.py
```

### 3.3 Installing Systemd Auto-Start Service
To ensure the detector runs 24/7 and restarts automatically upon reboot:

```ini
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
```

Enable and activate the daemon:
```bash
sudo systemctl daemon-reload
sudo systemctl enable kaybit-edge.service
sudo systemctl start kaybit-edge.service
```

---

## 4. Key Operating Features

### 4.1 Sub-3s Push Notification SLA
The system measures latency at three crucial milestones:
1. **Edge Inference & Filter**: ~100ms – 160ms (Hailo NPU YOLOv8 execution and temporal frame validation).
2. **Google FCM Transport**: ~600ms – 1100ms (High-priority push payload routing).
3. **Client App Wake-up**: ~200ms – 400ms (Screen display, sound playback, and banner render).
- **Total Guaranteed SLA**: `< 3000ms` from physical snake movement in front of camera to smartphone siren.

### 4.2 False Alarm Suppression (Garden Hose & Shadow Rejection)
- **Consecutive Frame Threshold**: Requires `3` to `5` sequential detections before raising an alarm.
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
| High false positives on garden hose | Consecutive frame count too low | Increase `Consecutive Frames Required` to 4 or 5 in Edge Device Manager. |
| Inference latency exceeds 60ms | Running on CPU instead of NPU | Verify Hailo-8L / Coral driver is bound to YOLOv8 inference pipeline. |
| Battery percentage dropping rapidly | Insufficient solar panel wattage | Angle solar panel southward at 35° tilt or upgrade to 30W panel. |
| Push notification delayed (> 3s) | Battery saving mode on mobile OS | Add KayBiT app to Android/iOS "Unrestricted Background Activity" whitelist. |

---

*KayBiT Systems • Edge AI Vision for Life Safety • Built for Researchers, Students & Homeowners*
