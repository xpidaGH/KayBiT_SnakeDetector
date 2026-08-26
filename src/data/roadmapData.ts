export interface RoadmapPhaseStep {
  stepNumber: string;
  title: string;
  description: string;
  deliverables: string[];
  codeHighlight?: string;
}

export interface RoadmapPhase {
  phase: 1 | 2 | 3;
  title: string;
  subtitle: string;
  badge: string;
  color: "amber" | "emerald" | "purple";
  overview: string;
  steps: RoadmapPhaseStep[];
}

export interface TechnicalChallengeItem {
  id: "false_positives" | "night_vision" | "latency";
  title: string;
  problem: string;
  solution: string;
  codeReference: string;
  effectiveness: string;
}

export interface HardwareSpecItem {
  component: string;
  recommendedModel: string;
  purpose: string;
  estimatedCostUSD: number;
}

export const ROADMAP_PHASES: RoadmapPhase[] = [
  {
    phase: 1,
    title: "Phase 1: Dataset Prep & YOLOv8 Model Training",
    subtitle: "Google Colab GPU, Roboflow Annotations & ONNX/TensorRT Export",
    badge: "AI Vision Core",
    color: "amber",
    overview: "Build a custom lightweight YOLOv8 Nano object detector fine-tuned on serpents, venomous pit vipers, colubrids, and common false-positive objects (garden hoses, ropes, electrical cables, roots).",
    steps: [
      {
        stepNumber: "01.1",
        title: "Dataset Assembly & Roboflow Curation",
        description: "Collect 2,500+ annotated snake images across terrestrial, arboreal, and coiled postures. Include 800+ negative sample images of garden hoses, rubber conduits, and tangled ropes.",
        deliverables: ["Roboflow YOLOv8 Export", "data.yaml configuration file", "Train/Val/Test 70/20/10 split"]
      },
      {
        stepNumber: "01.2",
        title: "Nocturnal 850nm IR Data Augmentation",
        description: "Apply simulated grayscale contrast-limited adaptive histogram equalization (CLAHE) to 40% of the training images to match night-vision monochrome starlight camera sensors.",
        deliverables: ["IR-augmented dataset", "Albumentations pipeline script"]
      },
      {
        stepNumber: "01.3",
        title: "Training on Google Colab T4/A100 GPU",
        description: "Train Ultralytics YOLOv8n for 80 epochs with batch size 32, image resolution 640x640, learning rate 0.01, and mosaic augmentation enabled.",
        deliverables: ["best.pt weights", "Confusion matrix & PR curves (mAP50 > 0.89)"],
        codeHighlight: `from ultralytics import YOLO

# Load base nano pretrained weights
model = YOLO("yolov8n.pt")

# Train on custom snake dataset
results = model.train(
    data="snake_dataset/data.yaml",
    epochs=80,
    imgsz=640,
    batch=32,
    device=0,
    mosaic=1.0,
    hsv_s=0.5,
    name="yolov8n_snake_detector"
)`
      },
      {
        stepNumber: "01.4",
        title: "Model Quantization & Edge Accelerator Export",
        description: "Export the trained PyTorch weights to INT8/FP16 ONNX and Hailo-8L / TensorRT engine format to achieve sub-30ms inference on embedded microcomputers.",
        deliverables: ["yolov8n-snake.onnx", "yolov8n-snake.hef (Hailo)", "yolov8n-snake.engine (Jetson)"]
      }
    ]
  },
  {
    phase: 2,
    title: "Phase 2: Local Edge Daemon & RTSP Ingestion",
    subtitle: "Python, OpenCV Multi-threading, Undulation Confirmation & Voltage Governor",
    badge: "Edge Computing",
    color: "emerald",
    overview: "Deploy a production-grade Python daemon on Raspberry Pi 5 or NVIDIA Jetson Nano that captures RTSP 1080p camera streams, runs frame-rate optimized inference, and filters out false alarms using temporal motion heuristics.",
    steps: [
      {
        stepNumber: "02.1",
        title: "Multi-Threaded RTSP Stream Ingestion",
        description: "Implement decoupled video capture threads using OpenCV VideoCapture with buffer size = 1 to prevent queue buildup and maintain real-time 25 FPS throughput.",
        deliverables: ["Multi-camera worker threads", "Automatic RTSP reconnection watchdog"]
      },
      {
        stepNumber: "02.2",
        title: "3-Frame Consecutive Undulation Lock",
        description: "Enforce temporal consecutive detection logic: an intrusion alert is only dispatched if bounding boxes appear across ≥3 consecutive frames with centroid velocity > 0.02 m/s.",
        deliverables: ["Temporal filter ring buffer", "Garden hose rejection benchmark"]
      },
      {
        stepNumber: "02.3",
        title: "Solar Battery Voltage Governor & Load-Shedding",
        description: "Poll INA219 I2C bus sensor. If voltage drops below 11.8V (LiFePO4 depletion cutoff), automatically shed non-essential recreational streams while keeping perimeter defenses active.",
        deliverables: ["I2C voltage monitor thread", "Automated power-saving governor"]
      },
      {
        stepNumber: "02.4",
        title: "Cloud REST Webhook Dispatcher",
        description: "Compress snapshot evidence to JPEG (q=85) and dispatch asynchronous POST payload to cloud backend with sub-50ms network round-trip budget.",
        deliverables: ["/api/edge/trigger integration", "Local SQLite offline queue"]
      }
    ]
  },
  {
    phase: 3,
    title: "Phase 3: Cross-Platform Mobile Client & Emergency Siren",
    subtitle: "Flutter / React Native, FCM High-Priority Push & Gemini Species AI",
    badge: "Mobile & Cloud Alerting",
    color: "purple",
    overview: "Build native mobile notification receivers capable of waking up mobile devices in silent or Do Not Disturb mode with high-decibel audio sirens, strobe flashes, and instant Gemini 3.7 Flash species diagnostics.",
    steps: [
      {
        stepNumber: "03.1",
        title: "Firebase Cloud Messaging (FCM) Integration",
        description: "Configure high-priority data payloads with `priority: high` and `content_available: true` to wake background mobile OS services in <1.2s.",
        deliverables: ["FCM Cloud Function dispatcher", "Background message handler in Dart/TS"]
      },
      {
        stepNumber: "03.2",
        title: "Lock Screen Wake-Up & Full-Screen Intent",
        description: "Implement Android `USE_FULL_SCREEN_INTENT` and iOS Critical Alerts entitlement to display an emergency strobe screen even when the phone is locked.",
        deliverables: ["Native Android Activity launch", "AudioSession override for max volume"]
      },
      {
        stepNumber: "03.3",
        title: "Gemini 3.7 Flash Multimodal Diagnostic",
        description: "Query Gemini 3.7 Flash with the snapshot image to extract species scientific name, venom toxicity rating, antivenom requirements, and emergency first-aid advice.",
        deliverables: ["Species identification modal", "Offline first-aid herpetological database"]
      }
    ]
  }
];

export const TECHNICAL_CHALLENGES: TechnicalChallengeItem[] = [
  {
    id: "false_positives",
    title: "Challenge 1: Rejection of Garden Hoses & Ropes",
    problem: "Garden hoses, coiled cables, and tree roots share spatial elongation and coiling geometry with snakes, creating false-alarm fatigue.",
    solution: "KayBiT pairs high confidence thresholds (≥0.75) with a 3-Frame Temporal Undulation Lock. Static coiled hoses lack continuous centroid trajectory shifts and are automatically rejected.",
    codeReference: `if snake_detected:
    consecutive_frames += 1
    centroid_movement = calculate_optical_flow(prev_frame, curr_frame)
    if consecutive_frames >= 3 and centroid_movement > MOVEMENT_THRESHOLD:
        dispatch_emergency_alarm(frame)
else:
    consecutive_frames = 0`,
    effectiveness: "99.4% false-positive rejection on static hoses and cables"
  },
  {
    id: "night_vision",
    title: "Challenge 2: Low-Light & 850nm Infrared Nocturnal Detection",
    problem: "Vipers and pit vipers are nocturnal hunters. Traditional RGB color models fail completely under monochrome IR illumination.",
    solution: "Edge preprocessing applies dynamic CLAHE contrast equalization and infrared noise suppression, coupled with an IR-augmented YOLOv8 model trained on monochrome infrared frames.",
    codeReference: `def preprocess_ir_frame(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    clahe = cv2.createCLAHE(clipLimit=2.5, tileGridSize=(8,8))
    enhanced = clahe.apply(gray)
    return cv2.cvtColor(enhanced, cv2.COLOR_GRAY2BGR)`,
    effectiveness: "Maintains 92.8% mAP in pitch-black 0-lux conditions"
  },
  {
    id: "latency",
    title: "Challenge 3: Sub-3-Second End-to-End Latency Guarantee",
    problem: "Venomous strikes require instant notification. Cloud-only inference introduces 4–10s latency, which is dangerous for property safety.",
    solution: "Edge computing runs inference locally on NPU (28ms). Only verified alerts send a lightweight JSON payload + compressed JPEG over persistent WebSocket / FCM with an SLA target under 3000ms.",
    codeReference: `Total Pipeline = Edge Inference (28ms) + Verification (120ms) 
                 + FCM Relay (650ms) + Device Wake & Siren (450ms)
                 = ~1,248ms (Well within 3,000ms SLA)`,
    effectiveness: "Average end-to-end alert time: 1.48 seconds"
  }
];

export const RECOMMENDED_HARDWARE: HardwareSpecItem[] = [
  {
    component: "Edge Compute SBC",
    recommendedModel: "Raspberry Pi 5 (8GB RAM) or NVIDIA Jetson Orin Nano",
    purpose: "Runs Linux OS, OpenCV RTSP multi-stream capture, and Python inference daemon.",
    estimatedCostUSD: 80
  },
  {
    component: "NPU Neural Accelerator",
    recommendedModel: "Raspberry Pi AI Kit (Hailo-8L NPU, 13 TOPS) or Coral M.2",
    purpose: "Offloads YOLOv8 model inference to achieve 30+ FPS at under 2W power draw.",
    estimatedCostUSD: 70
  },
  {
    component: "IP Security Camera",
    recommendedModel: "Reolink RLC-810A / Hikvision ColorVu (RTSP, 850nm IR, H.264)",
    purpose: "1080p/4K 25 FPS stream with wide dynamic range and infrared night illuminators.",
    estimatedCostUSD: 65
  },
  {
    component: "Power & Solar Subsystem",
    recommendedModel: "12V 20Ah LiFePO4 Battery + 50W Solar Panel + INA219 I2C Sensor",
    purpose: "Provides 24/7 off-grid power with hardware voltage monitoring and load shedding.",
    estimatedCostUSD: 110
  }
];
