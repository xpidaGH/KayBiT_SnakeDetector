import React, { useState } from "react";
import { 
  FLUTTER_CODE_SNIPPET, 
  REACT_NATIVE_CODE_SNIPPET,
  ANDROID_MANIFEST_XML,
  FLUTTER_PUBSPEC_YAML,
  INSTALLATION_GUIDE_MD,
  TAURI_CONFIG_SNIPPET,
  CAPACITOR_CONFIG_SNIPPET,
  GITHUB_ACTIONS_YAML
} from "../data";
import { 
  Smartphone, 
  Code2, 
  Copy, 
  Check, 
  Download, 
  Layers, 
  Terminal, 
  FileCode, 
  ExternalLink,
  ShieldAlert,
  Monitor,
  Apple,
  Globe,
  Boxes,
  Cpu,
  GitBranch
} from "lucide-react";

export const CrossPlatformPackagingModal: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState<"flutter" | "react_native" | "capacitor" | "tauri_desktop" | "cicd_automation">("capacitor");
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleDownloadInstallationGuide = () => {
    const blob = new Blob([INSTALLATION_GUIDE_MD], { type: "text/markdown;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "INSTALLATION.md";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const flutterManifestXml = ANDROID_MANIFEST_XML;
  const flutterPubspecYaml = FLUTTER_PUBSPEC_YAML;
  const tauriConfigSnippet = TAURI_CONFIG_SNIPPET;
  const capacitorConfigSnippet = CAPACITOR_CONFIG_SNIPPET;
  const githubActionsYaml = GITHUB_ACTIONS_YAML;


  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-slate-900/80 p-6 rounded-2xl border border-slate-800 backdrop-blur">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-purple-500/10 border border-purple-500/30 rounded-xl text-purple-400">
                <Boxes className="w-5 h-5" />
              </span>
              <h2 className="text-xl font-bold text-slate-100">Native Multi-Platform Packaging & Distribution Hub</h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Turn this Vite + React TypeScript app into installable native binaries for Android (.apk), Windows (.exe), macOS (.dmg), and iOS (PWA) with automated CI/CD builds.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadInstallationGuide}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center space-x-2 transition-all shadow-md shadow-amber-500/20"
            >
              <Download className="w-4 h-4" />
              <span>Export INSTALLATION.md</span>
            </button>
          </div>
        </div>

        {/* Framework & Tool Switcher */}
        <div className="flex items-center space-x-2 bg-slate-950 p-1 rounded-xl border border-slate-800 mt-5 overflow-x-auto">
          <button
            onClick={() => setSelectedFramework("capacitor")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              selectedFramework === "capacitor"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Android (Capacitor APK/AAB)</span>
          </button>
          <button
            onClick={() => setSelectedFramework("tauri_desktop")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              selectedFramework === "tauri_desktop"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Monitor className="w-3.5 h-3.5" />
            <span>Windows & Mac (Tauri .exe/.dmg)</span>
          </button>
          <button
            onClick={() => setSelectedFramework("cicd_automation")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              selectedFramework === "cicd_automation"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>CI/CD Automation (GitHub Actions)</span>
          </button>
          <button
            onClick={() => setSelectedFramework("flutter")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              selectedFramework === "flutter"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Smartphone className="w-3.5 h-3.5" />
            <span>Flutter (Dart)</span>
          </button>
          <button
            onClick={() => setSelectedFramework("react_native")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              selectedFramework === "react_native"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>React Native</span>
          </button>
        </div>
      </div>

      {/* Code Viewer & Setup Guide */}
      <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6 space-y-6">
        {selectedFramework === "capacitor" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Android & iOS Mobile Packaging (Capacitor 6)</h3>
                <p className="text-xs text-slate-400 font-mono">Direct Web-to-Native container with full FCM push, background audio siren & wake-lock</p>
              </div>
              <button
                onClick={() => handleCopy(capacitorConfigSnippet)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1 border border-slate-700"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copied!" : "Copy capacitor.config.ts"}</span>
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <pre className="p-4 text-xs font-mono text-amber-300/90 overflow-x-auto leading-relaxed">
                {capacitorConfigSnippet}
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400 font-mono">Step-by-Step Android APK Build Commands:</span>
              <div className="space-y-1 font-mono text-xs text-slate-300 bg-slate-900 p-3 rounded-lg">
                <div># 1. Install Capacitor packages:</div>
                <div className="text-amber-400">npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/push-notifications</div>
                <div className="pt-2"># 2. Add Android platform project:</div>
                <div className="text-amber-400">npx cap add android</div>
                <div className="pt-2"># 3. Build React distribution bundle & sync:</div>
                <div className="text-amber-400">npm run build && npx cap sync android</div>
                <div className="pt-2"># 4. Generate direct standalone debug .APK:</div>
                <div className="text-amber-400">cd android && ./gradlew assembleDebug</div>
                <div className="text-slate-500 text-[11px] pt-1">Output binary: android/app/build/outputs/apk/debug/app-debug.apk</div>
              </div>
            </div>
          </div>
        )}

        {selectedFramework === "tauri_desktop" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Windows (.exe / .msi) & macOS (.dmg) Desktop (Tauri v2)</h3>
                <p className="text-xs text-slate-400 font-mono">Ultra-lightweight ~8MB desktop binary utilizing OS native WebView2 / WebKit</p>
              </div>
              <button
                onClick={() => handleCopy(tauriConfigSnippet)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1 border border-slate-700"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copied!" : "Copy tauri.conf.json"}</span>
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <pre className="p-4 text-xs font-mono text-cyan-300/90 overflow-x-auto leading-relaxed">
                {tauriConfigSnippet}
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-cyan-400 font-mono">Desktop Compilation Commands:</span>
              <div className="space-y-1 font-mono text-xs text-slate-300 bg-slate-900 p-3 rounded-lg">
                <div># 1. Install Tauri CLI:</div>
                <div className="text-amber-400">npm install -D @tauri-apps/cli</div>
                <div className="pt-2"># 2. Compile Windows .exe installer:</div>
                <div className="text-amber-400">npm run tauri build -- --target x86_64-pc-windows-msvc</div>
                <div className="pt-2"># 3. Compile macOS .dmg universal binary (Apple Silicon + Intel):</div>
                <div className="text-amber-400">npm run tauri build -- --target universal-apple-darwin</div>
              </div>
            </div>
          </div>
        )}

        {selectedFramework === "cicd_automation" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Automated GitHub Actions CI/CD (`.github/workflows/build-all.yml`)</h3>
                <p className="text-xs text-slate-400 font-mono">Builds .apk, .exe, and .dmg automatically and publishes direct download release assets</p>
              </div>
              <button
                onClick={() => handleCopy(githubActionsYaml)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1 border border-slate-700"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copied!" : "Copy Workflow YAML"}</span>
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <pre className="p-4 text-xs font-mono text-emerald-300/90 overflow-x-auto max-h-72 leading-relaxed">
                {githubActionsYaml}
              </pre>
            </div>

            {/* Hosting and Distribution links */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs font-mono text-emerald-400 font-bold mb-1">Android Direct Link</div>
                <div className="text-[11px] font-mono text-slate-400 break-all bg-slate-900 p-2 rounded">
                  https://github.com/USER/REPO/releases/latest/download/KayBiT-Android.apk
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs font-mono text-blue-400 font-bold mb-1">Windows Direct Link</div>
                <div className="text-[11px] font-mono text-slate-400 break-all bg-slate-900 p-2 rounded">
                  https://github.com/USER/REPO/releases/latest/download/KayBiT-Windows.exe
                </div>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <div className="text-xs font-mono text-purple-400 font-bold mb-1">macOS Direct Link</div>
                <div className="text-[11px] font-mono text-slate-400 break-all bg-slate-900 p-2 rounded">
                  https://github.com/USER/REPO/releases/latest/download/KayBiT-macOS.dmg
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedFramework === "flutter" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">Flutter Mobile Client (`lib/main.dart`)</h3>
                <p className="text-xs text-slate-400 font-mono">Single codebase compiling natively to Android APK & iOS App Store</p>
              </div>
              <button
                onClick={() => handleCopy(FLUTTER_CODE_SNIPPET)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1 border border-slate-700"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copied!" : "Copy Flutter Code"}</span>
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <pre className="p-4 text-xs font-mono text-purple-200/90 overflow-x-auto max-h-72 leading-relaxed">
                {FLUTTER_CODE_SNIPPET}
              </pre>
            </div>

            {/* Android Manifest Permissions */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-300 font-mono">
                  Android Wake-Lock & Full-Screen Siren Intent (`AndroidManifest.xml`)
                </span>
                <button
                  onClick={() => handleCopy(flutterManifestXml)}
                  className="text-xs text-purple-400 hover:text-purple-300 font-mono flex items-center space-x-1"
                >
                  <Copy className="w-3 h-3" />
                  <span>Copy Manifest</span>
                </button>
              </div>
              <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto">
                {flutterManifestXml}
              </pre>
            </div>

            {/* Build Commands */}
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-emerald-400 font-mono">Build & Package Commands:</span>
              <div className="space-y-1 font-mono text-xs text-slate-300 bg-slate-900 p-3 rounded-lg">
                <div># 1. Fetch dependencies:</div>
                <div className="text-amber-400">flutter pub get</div>
                <div className="pt-2"># 2. Build Android Release APK:</div>
                <div className="text-amber-400">flutter build apk --release --split-per-abi</div>
                <div className="pt-2"># 3. Build iOS Archive:</div>
                <div className="text-amber-400">flutter build ipa --release</div>
              </div>
            </div>
          </div>
        )}

        {selectedFramework === "react_native" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base">React Native Client (`App.tsx`)</h3>
                <p className="text-xs text-slate-400 font-mono">TypeScript + @react-native-firebase + Notifee background audio triggers</p>
              </div>
              <button
                onClick={() => handleCopy(REACT_NATIVE_CODE_SNIPPET)}
                className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1 border border-slate-700"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copiedCode ? "Copied!" : "Copy React Native Code"}</span>
              </button>
            </div>

            <div className="relative rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
              <pre className="p-4 text-xs font-mono text-blue-200/90 overflow-x-auto max-h-72 leading-relaxed">
                {REACT_NATIVE_CODE_SNIPPET}
              </pre>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <span className="text-xs font-bold text-blue-400 font-mono">Installation & Build Commands:</span>
              <div className="space-y-1 font-mono text-xs text-slate-300 bg-slate-900 p-3 rounded-lg">
                <div>npm install @react-native-firebase/app @react-native-firebase/messaging @notifee/react-native</div>
                <div className="pt-2"># Run on Android:</div>
                <div className="text-amber-400">npx react-native run-android</div>
                <div className="pt-2"># Run on iOS:</div>
                <div className="text-amber-400">cd ios && pod install && cd .. && npx react-native run-ios</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

