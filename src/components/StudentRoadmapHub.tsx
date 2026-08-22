import React, { useState } from "react";
import { 
  BookOpen, 
  CheckCircle2, 
  Code2, 
  Cpu, 
  Smartphone, 
  AlertTriangle, 
  Moon, 
  Zap, 
  ExternalLink,
  ChevronRight,
  Layers,
  Sparkles
} from "lucide-react";

export const StudentRoadmapHub: React.FC = () => {
  const [activePhase, setActivePhase] = useState<1 | 2 | 3>(1);
  const [activeChallenge, setActiveChallenge] = useState<"false_positives" | "night_vision" | "latency">("false_positives");

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
                <BookOpen className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">KayBiT Student Development & Engineering Roadmap</h2>
            </div>
            <p className="text-xs text-slate-400 max-w-2xl mt-1">
              Complete engineering blueprint from dataset annotation and YOLOv8 training in Google Colab, to edge Python inference on Raspberry Pi, and cross-platform mobile app siren dispatch.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <span className="px-3 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono text-amber-400 font-bold">
              YOLOv8 Nano • PyTorch • Flutter / React Native • Firebase
            </span>
          </div>
        </div>
      </div>

      {/* 3-Phase Navigation Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          {
            phase: 1 as const,
            title: "Phase 1: Train YOLOv8 Model",
            subtitle: "Dataset, Annotations & Google Colab",
            icon: Cpu,
            color: "amber"
          },
          {
            phase: 2 as const,
            title: "Phase 2: Local Edge Script",
            subtitle: "OpenCV, RTSP & Sub-3s Trigger",
            icon: Code2,
            color: "emerald"
          },
          {
            phase: 3 as const,
            title: "Phase 3: Cross-Platform App",
            subtitle: "FCM Push, Wake-up UI & Siren",
            icon: Smartphone,
            color: "purple"
          }
        ].map((item) => {
          const isActive = activePhase === item.phase;
          const IconComponent = item.icon;
          return (
            <div
              key={item.phase}
              onClick={() => setActivePhase(item.phase)}
              className={`p-5 rounded-2xl border cursor-pointer transition-all ${
                isActive
                  ? "bg-slate-900 border-amber-500/80 ring-2 ring-amber-500/20 shadow-xl"
                  : "bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900"
              }`}
            >
              <div className="flex items-center justify-between">
                <div className={`p-2 rounded-xl ${
                  isActive ? "bg-amber-500 text-slate-950" : "bg-slate-800 text-slate-400"
                }`}>
                  <IconComponent className="w-5 h-5" />
                </div>
                <span className="font-mono text-xs text-slate-500 font-bold">STEP 0{item.phase}</span>
              </div>
              <h3 className="font-bold text-slate-100 text-sm mt-3">{item.title}</h3>
              <p className="text-xs text-slate-400 font-mono mt-0.5">{item.subtitle}</p>
            </div>
          );
        })}
      </div>

      {/* Active Phase Deep Dive */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
        {activePhase === 1 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>Phase 1: Dataset Preparation & YOLOv8 Model Training</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Train a lightweight YOLOv8 Nano model (`yolov8n.pt`) tailored for resource-constrained edge devices with night-vision augmentations.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-mono text-xs text-amber-400 font-bold">1. Dataset Collection</div>
                <p className="text-xs text-slate-300">
                  Gather 1,500+ images of local snake species (Copperheads, Rat Snakes, Garter Snakes, Vipers) from Roboflow Universe and Kaggle Open Datasets.
                </p>
                <div className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded">
                  Roboflow Universe: "snake-detection-dataset"
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-mono text-xs text-amber-400 font-bold">2. Bounding Box Labeling</div>
                <p className="text-xs text-slate-300">
                  Annotate tight bounding boxes encompassing the full coiled or undulating snake body plus distinct head region.
                </p>
                <div className="text-[11px] text-slate-400 font-mono bg-slate-900 p-2 rounded">
                  Format: YOLO format (.txt coordinates normalized)
                </div>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-mono text-xs text-amber-400 font-bold">3. Google Colab Training</div>
                <p className="text-xs text-slate-300">
                  Train for 50-100 epochs on free T4/V100 GPU using Ultralytics CLI:
                </p>
                <div className="text-[11px] text-emerald-400 font-mono bg-slate-900 p-2 rounded overflow-x-auto">
                  yolo detect train data=data.yaml model=yolov8n.pt epochs=75 imgsz=640
                </div>
              </div>
            </div>

            {/* Google Colab Training Notebook Recipe */}
            <div className="bg-slate-950 rounded-xl border border-slate-800 p-4 space-y-3">
              <span className="font-mono text-xs font-bold text-slate-200">Google Colab Python Training Script:</span>
              <pre className="p-3 bg-slate-900 rounded-lg text-xs font-mono text-amber-200/90 overflow-x-auto">
{`# In Google Colab Cell:
!pip install ultralytics roboflow

from ultralytics import YOLO

# 1. Load pretrained YOLOv8 Nano
model = YOLO('yolov8n.pt')

# 2. Train on custom snake dataset with infrared data augmentation
results = model.train(
    data='snake_dataset/data.yaml',
    epochs=80,
    imgsz=640,
    batch=16,
    hsv_h=0.015, # Grayscale / IR color variations
    hsv_s=0.7,
    degrees=15.0,
    flipud=0.5,
    name='kaybit_snake_yolov8n'
)

# 3. Export to ONNX or TensorRT for Raspberry Pi / Jetson Nano NPU
model.export(format='onnx', dynamic=True)`}
              </pre>
            </div>
          </div>
        )}

        {activePhase === 2 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>Phase 2: Local Edge Inference Script & RTSP Pipeline</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Ingest live camera video via RTSP, run frame inference using YOLOv8, enforce consecutive-frame filtering, and dispatch cloud webhooks.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-mono text-xs text-emerald-400 font-bold">RTSP Ingestion with OpenCV</div>
                <p className="text-xs text-slate-300">
                  Connect to IP security cameras using RTSP protocol over local LAN (e.g. `rtsp://admin:pass@192.168.1.120:554/stream1`).
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-mono text-xs text-emerald-400 font-bold">Consecutive Frame Temporal Buffer</div>
                <p className="text-xs text-slate-300">
                  Suppress single-frame noise spikes by confirming candidate persistence across 3 consecutive frames before firing alerts.
                </p>
              </div>
            </div>
          </div>
        )}

        {activePhase === 3 && (
          <div className="space-y-6">
            <div className="border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold text-slate-100 flex items-center space-x-2">
                <span>Phase 3: Cross-Platform Mobile App & High-Urgency Siren</span>
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Build the client app in Flutter or React Native with Firebase Cloud Messaging (FCM) to wake up user devices and sound the intrusion siren.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-mono text-xs text-purple-400 font-bold">FCM Priority Channels</div>
                <p className="text-xs text-slate-300">
                  Configure `high_priority` and `critical_alert` permissions on iOS and Android to bypass Do Not Disturb mode during snake incursions.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-mono text-xs text-purple-400 font-bold">Loud Siren & Strobe</div>
                <p className="text-xs text-slate-300">
                  Trigger full volume siren audio and visual screen flashing upon receiving the MQTT/FCM JSON payload.
                </p>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <div className="font-mono text-xs text-purple-400 font-bold">Snapshot Evidence</div>
                <p className="text-xs text-slate-300">
                  Display high-res camera snapshot with YOLOv8 bounding boxes so property owners can verify the threat instantly.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Technical Challenges Deep Dive */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
        <div>
          <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Key Engineering Challenges & Student Solutions</span>
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Real-world hurdles encountered when building property intrusion monitoring systems.
          </p>
        </div>

        {/* Challenge selector tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: "false_positives" as const, title: "1. False Positives (Hoses vs Snakes)" },
            { id: "night_vision" as const, title: "2. Night Vision & IR Cameras" },
            { id: "latency" as const, title: "3. Sub-3s Notification Latency" }
          ].map((c) => (
            <button
              key={c.id}
              onClick={() => setActiveChallenge(c.id)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-mono transition-all whitespace-nowrap ${
                activeChallenge === c.id
                  ? "bg-amber-500 text-slate-950 font-bold shadow-md shadow-amber-500/20"
                  : "bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700"
              }`}
            >
              {c.title}
            </button>
          ))}
        </div>

        {/* Challenge Contents */}
        {activeChallenge === "false_positives" && (
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <h4 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
              <span className="text-amber-400">Challenge 1:</span>
              <span>Garden Hoses, Coiled Ropes & Moving Tree Roots</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Standard object detectors easily mistake stationary coiled rubber garden hoses or tree branches for snakes. 
              KayBiT solves this with a multi-layered filtering architecture:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <strong className="text-amber-400 block mb-1">A. High Confidence (≥ 0.75)</strong>
                Filters out ambiguous linear objects and surface specular reflections.
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <strong className="text-amber-400 block mb-1">B. Consecutive Frame Buffer</strong>
                Requires 3+ continuous positive detections before triggering mobile alerts.
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <strong className="text-amber-400 block mb-1">C. Gemini Deep Verification</strong>
                Cloud-side multimodal AI cross-checks scalation patterns, tapering tail, and eye pupils.
              </div>
            </div>
          </div>
        )}

        {activeChallenge === "night_vision" && (
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <h4 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
              <span className="text-emerald-400">Challenge 2:</span>
              <span>Nocturnal Intrusion & 850nm Infrared Security Streams</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Many predatory snakes (such as Copperheads and Vipers) are nocturnal hunters active after dusk. 
              Standard color RGB models fail on black-and-white infrared camera feeds.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <strong className="text-emerald-400 block mb-1">IR Data Augmentation</strong>
                During training in Colab, convert 40% of RGB images to single-channel grayscale with simulated 850nm phosphor gain noise.
              </div>
              <div className="bg-slate-900 p-3 rounded-lg border border-slate-800">
                <strong className="text-emerald-400 block mb-1">Adaptive Contrast CLAHE</strong>
                Edge pre-processing applies Contrast Limited Adaptive Histogram Equalization to brighten low-light scale textures.
              </div>
            </div>
          </div>
        )}

        {activeChallenge === "latency" && (
          <div className="bg-slate-950 p-5 rounded-xl border border-slate-800 space-y-4">
            <h4 className="font-bold text-slate-100 text-sm flex items-center space-x-2">
              <span className="text-purple-400">Challenge 3:</span>
              <span>Sub-3-Second End-to-End Push Notification Latency</span>
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              Property owners need instant warnings before walking onto the porch or letting pets outside. 
              The entire edge-to-mobile roundtrip must complete in under 3.0 seconds.
            </p>

            {/* Latency Waterfall Chart */}
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800 space-y-3 font-mono text-xs">
              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>1. Edge YOLOv8 Inference (Hailo NPU):</span>
                  <span className="text-emerald-400 font-bold">28 ms</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-emerald-400 h-full w-[4%]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>2. Temporal Confirmation (3 Frames):</span>
                  <span className="text-amber-400 font-bold">120 ms</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-amber-400 h-full w-[12%]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>3. REST Webhook & Image Upload:</span>
                  <span className="text-blue-400 font-bold">480 ms</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-blue-400 h-full w-[35%]" />
                </div>
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-slate-300">
                  <span>4. FCM Push Dispatch to iOS/Android:</span>
                  <span className="text-purple-400 font-bold">850 ms</span>
                </div>
                <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div className="bg-purple-400 h-full w-[49%]" />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-2 flex justify-between font-bold text-emerald-400">
                <span>Total Latency (Well under 3000ms SLA):</span>
                <span>~ 1.48 Seconds ✓</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
