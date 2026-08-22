import React, { useState } from "react";
import { 
  X, 
  BookOpen, 
  Search, 
  Copy, 
  Check, 
  Download, 
  ExternalLink, 
  Cpu, 
  Shield, 
  Code2, 
  Sliders, 
  AlertTriangle, 
  Terminal,
  Layers,
  BatteryCharging,
  Radio,
  FileText,
  ChevronRight
} from "lucide-react";
import { USER_GUIDE_MD, GUIDE_CHAPTERS, GuideSection } from "../data";

interface UserGuideModalProps {
  onClose: () => void;
}

export const UserGuideModal: React.FC<UserGuideModalProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [selectedSection, setSelectedSection] = useState<string>("all");
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCodeId(id);
    setTimeout(() => setCopiedCodeId(null), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([USER_GUIDE_MD], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "USER_GUIDE.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredChapters = GUIDE_CHAPTERS.filter(ch => 
    ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    ch.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-slate-900 border border-slate-700/80 rounded-2xl w-full max-w-5xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-slate-950/90 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h2 className="text-lg font-bold text-slate-100">KayBiT Snake Detector User & Engineering Guide</h2>
                <span className="px-2 py-0.5 text-[11px] font-mono font-bold bg-amber-500/20 text-amber-300 rounded border border-amber-500/30">
                  USER_GUIDE.md • v1.2
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Official operating manual, edge installation commands, sub-3s SLA calibration, and hardware BOM
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownload}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-mono font-bold flex items-center space-x-1.5 transition-colors"
              title="Download raw USER_GUIDE.md"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export .MD</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Search & Navigation Bar */}
        <div className="px-6 py-3 bg-slate-900/90 border-b border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search user guide topics, RTSP, Python, SLA..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-200 focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center space-x-1 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
            <button
              onClick={() => setSelectedSection("all")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSection === "all"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              All Sections
            </button>
            <button
              onClick={() => setSelectedSection("arch")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSection === "arch"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Architecture & SLA
            </button>
            <button
              onClick={() => setSelectedSection("hardware")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSection === "hardware"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Hardware BOM
            </button>
            <button
              onClick={() => setSelectedSection("daemon")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSection === "daemon"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Edge Daemon
            </button>
            <button
              onClick={() => setSelectedSection("trouble")}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                selectedSection === "trouble"
                  ? "bg-amber-500 text-slate-950 font-bold"
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              }`}
            >
              Troubleshooting
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-8 divide-y divide-slate-800/80">
          {/* Quick Summary Cards */}
          {(selectedSection === "all" || selectedSection === "arch") && (
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  <span>1. System Architecture & Sub-3s SLA Pipeline</span>
                </h3>
                <span className="text-xs font-mono text-emerald-400 font-bold">100% Edge-to-Push Verified</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-amber-400 font-mono text-xs font-bold">
                    <span className="flex items-center space-x-1">
                      <Cpu className="w-3.5 h-3.5" />
                      <span>Stage 1: Edge Vision</span>
                    </span>
                    <span>100–160 ms</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Raspberry Pi 5 with Hailo-8L NPU executes YOLOv8 INT8 quantization and temporal 3-frame undulation filter.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-blue-400 font-mono text-xs font-bold">
                    <span className="flex items-center space-x-1">
                      <Radio className="w-3.5 h-3.5" />
                      <span>Stage 2: FCM Transit</span>
                    </span>
                    <span>600–1100 ms</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    High-priority Firebase Cloud Messaging payload routes through APNs/GCM servers directly to client devices.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between text-purple-400 font-mono text-xs font-bold">
                    <span className="flex items-center space-x-1">
                      <Shield className="w-3.5 h-3.5" />
                      <span>Stage 3: Full Wake-up</span>
                    </span>
                    <span>200–400 ms</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    Native Android/iOS background handler turns on display, renders zone overlay, and plays continuous 85dB siren.
                  </p>
                </div>
              </div>

              {/* ASCII Diagram Card */}
              <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl font-mono text-xs text-slate-300 space-y-2">
                <div className="flex items-center justify-between text-slate-400 border-b border-slate-800 pb-2">
                  <span>Data Flow Diagram</span>
                  <button
                    onClick={() => handleCopy(`[RTSP IP Cameras] -> [Raspberry Pi 5 + Hailo-8L] -> [Cloud Gateway & Gemini 3.7 Flash] -> [Firebase FCM] -> [iOS / Android App Siren]`, "diagram")}
                    className="text-[11px] text-amber-400 hover:text-amber-300 flex items-center space-x-1"
                  >
                    {copiedCodeId === "diagram" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>Copy Flow</span>
                  </button>
                </div>
                <pre className="text-emerald-400/90 overflow-x-auto py-2 leading-relaxed">
{`[ RTSP IP Cameras / IR Starlight ]
               │
               ▼ (25-30 FPS RTSP Stream)
[ Raspberry Pi 5 + Hailo-8L NPU (13 TOPS) ]
   ├─ YOLOv8 Nano INT8 Quantized Inference (28ms)
   ├─ 3-Frame Temporal Undulation Filter (Garden Hose Rejection)
   └─ Sub-3s SLA Payload Dispatcher
               │
               ▼ (HTTPS REST / JSON)
[ KayBiT Cloud Gateway & Gemini 3.7 Flash ]
   ├─ Morphological Species AI Diagnostic
   └─ Emergency Evacuation Guidelines
               │
               ▼ (High-Priority Direct Channel)
[ Google Firebase Cloud Messaging (FCM) & APNs ]
               │
               ▼ (< 1.5s Total Pipeline Transit)
[ Homeowner & First Responder Cross-Platform Apps (iOS/Android) ]
   ├─ Full-Screen Wakeup Intent & Screen Turn-On
   └─ 85dB High-Pitch Siren Actuation`}
                </pre>
              </div>
            </div>
          )}

          {/* Hardware BOM & Solar Setup */}
          {(selectedSection === "all" || selectedSection === "hardware") && (
            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  <span>2. Hardware Bill of Materials (BOM) & Solar Remote Station</span>
                </h3>
                <span className="text-xs font-mono text-slate-400">Off-Grid Ready</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <h4 className="font-bold text-amber-400 text-xs font-mono flex items-center space-x-1.5">
                    <Cpu className="w-4 h-4" />
                    <span>Edge Computer & NPU Accelerator</span>
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li className="flex items-start space-x-2">
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <span><strong>SBC:</strong> Raspberry Pi 5 (8GB RAM) or NVIDIA Jetson Nano / Orin Nano.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <span><strong>NPU:</strong> Hailo-8L M.2 AI HAT (13 TOPS) for INT8 quantized inference.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <span><strong>Storage:</strong> 64GB High Endurance MicroSD (A2 V30 Class).</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <ChevronRight className="w-3.5 h-3.5 text-amber-400 mt-0.5 shrink-0" />
                      <span><strong>Cameras:</strong> Sony STARVIS 2 Starlight Sensor with 850nm IR illumination.</span>
                    </li>
                  </ul>
                </div>

                <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl space-y-3">
                  <h4 className="font-bold text-emerald-400 text-xs font-mono flex items-center space-x-1.5">
                    <BatteryCharging className="w-4 h-4" />
                    <span>Perimeter Solar & MPPT Power Station</span>
                  </h4>
                  <ul className="text-xs text-slate-300 space-y-2">
                    <li className="flex items-start space-x-2">
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span><strong>Solar PV:</strong> 18W – 50W 18V Monocrystalline Panel mounted southward.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span><strong>Charge Controller:</strong> 10A MPPT with UART/RS485 state-of-charge telemetry.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span><strong>Battery Bank:</strong> 12V 100Ah LiFePO4 with built-in low-temp BMS cutoff.</span>
                    </li>
                    <li className="flex items-start space-x-2">
                      <ChevronRight className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                      <span><strong>Telemetry:</strong> Live battery percentage broadcasted in system health logs.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Edge Python Daemon & Installation Commands */}
          {(selectedSection === "all" || selectedSection === "daemon") && (
            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-blue-400" />
                  <span>3. Edge Python Daemon & 24/7 Auto-Start Setup</span>
                </h3>
                <button
                  onClick={() => handleCopy(`sudo apt update && sudo apt install -y python3-pip python3-opencv ffmpeg\npip3 install ultralytics opencv-python requests numpy hailo-platform`, "install_cmd")}
                  className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-amber-400 text-xs font-mono flex items-center space-x-1"
                >
                  {copiedCodeId === "install_cmd" ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                  <span>Copy Shell Script</span>
                </button>
              </div>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono">
                  <Terminal className="w-4 h-4 text-amber-400" />
                  <span>Step 1: Install Edge Dependencies on Raspberry Pi 5 / Jetson</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg font-mono text-xs text-amber-300 overflow-x-auto">
                  <code>
                    sudo apt update && sudo apt install -y python3-pip python3-opencv ffmpeg<br />
                    pip3 install ultralytics opencv-python requests numpy hailo-platform
                  </code>
                </div>

                <div className="flex items-center space-x-2 text-slate-400 text-xs font-mono pt-2">
                  <FileText className="w-4 h-4 text-emerald-400" />
                  <span>Step 2: Auto-Start Systemd Unit (/etc/systemd/system/kaybit-edge.service)</span>
                </div>
                <div className="p-3 bg-slate-900 rounded-lg font-mono text-xs text-slate-300 overflow-x-auto">
                  <code>
                    [Unit]<br />
                    Description=KayBiT Edge AI Snake Detector Daemon<br />
                    After=network.target<br /><br />
                    [Service]<br />
                    Type=simple<br />
                    User=pi<br />
                    WorkingDirectory=/home/pi/kaybit<br />
                    ExecStart=/usr/bin/python3 /home/pi/kaybit/kaybit_edge_detector.py<br />
                    Restart=always<br />
                    RestartSec=5<br /><br />
                    [Install]<br />
                    WantedBy=multi-user.target
                  </code>
                </div>
              </div>
            </div>
          )}

          {/* Troubleshooting Matrix */}
          {(selectedSection === "all" || selectedSection === "trouble") && (
            <div className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-100 flex items-center space-x-2">
                  <span className="w-2 h-2 rounded-full bg-red-400" />
                  <span>4. Field Diagnostics & Troubleshooting Matrix</span>
                </h3>
              </div>

              <div className="overflow-x-auto rounded-xl border border-slate-800">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <tr>
                      <th className="p-3">Symptom</th>
                      <th className="p-3">Probable Cause</th>
                      <th className="p-3">Recommended Remediation</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 bg-slate-900/60 text-slate-300">
                    <tr>
                      <td className="p-3 font-bold text-amber-400">RTSP Stream Drops</td>
                      <td className="p-3">2.4GHz Wi-Fi packet loss</td>
                      <td className="p-3 text-slate-200">Switch to wired PoE Ethernet or install 5GHz directional antenna.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-amber-400">Garden Hose False Positive</td>
                      <td className="p-3">Consecutive frames set to 1</td>
                      <td className="p-3 text-slate-200">Increase "Consecutive Frames Required" to 3 or 4 in Edge Device Manager.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-amber-400">Inference Latency &gt; 50ms</td>
                      <td className="p-3">Software CPU fallback</td>
                      <td className="p-3 text-slate-200">Verify Hailo-8L / Coral driver is actively loaded in ultralytics predict.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-amber-400">Battery SoC Drops Rapidly</td>
                      <td className="p-3">Insufficient solar angle</td>
                      <td className="p-3 text-slate-200">Re-orient panel southward at 35° tilt or upgrade to 30W solar panel.</td>
                    </tr>
                    <tr>
                      <td className="p-3 font-bold text-amber-400">Notification Delayed &gt; 3s</td>
                      <td className="p-3">Mobile OS Battery Saver</td>
                      <td className="p-3 text-slate-200">Add KayBiT client to iOS/Android "Unrestricted Background" whitelist.</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-950 border-t border-slate-800 flex items-center justify-between">
          <div className="flex items-center space-x-2 text-xs font-mono text-slate-500">
            <span>KayBiT System Manual v1.2</span>
            <span>•</span>
            <span className="text-emerald-400">Sub-3s SLA Certified</span>
          </div>

          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-lg transition-colors"
          >
            Done Reading
          </button>
        </div>
      </div>
    </div>
  );
};
