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
  GitBranch,
  Sparkles,
  Palette
} from "lucide-react";
import { KbtBrandLogo } from "./KbtBrandLogo";

export const CrossPlatformPackagingModal: React.FC = () => {
  const [selectedFramework, setSelectedFramework] = useState<"flutter" | "react_native" | "capacitor" | "tauri_desktop" | "cicd_automation" | "brand_icons">("capacitor");
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
            onClick={() => setSelectedFramework("brand_icons")}
            className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold whitespace-nowrap transition-all flex items-center space-x-1.5 ${
              selectedFramework === "brand_icons"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-slate-400 hover:text-white"
            }`}
          >
            <Apple className="w-3.5 h-3.5 text-lime-400" />
            <span>KBT App Icon & Window Bars</span>
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

        {/* ========================================================================= */}
        {/* BRAND ICON & WINDOW BARS SHOWCASE (PER KBT-INTEGRATION-GUIDE.TXT)        */}
        {/* ========================================================================= */}
        {selectedFramework === "brand_icons" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
              <div>
                <h3 className="font-bold text-slate-100 text-base flex items-center space-x-2">
                  <Apple className="w-5 h-5 text-lime-400" />
                  <span>KBT Brand Logo & Window Title Bar Integration</span>
                </h3>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  Responsive multiplatform asset layout conforming to kbt-integration-guide.txt
                </p>
              </div>

              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleCopy(`.mask-squircle {
  mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="black" d="M 0,50 C 0,4 4,0 50,0 C 96,0 100,4 100,50 C 100,96 96,100 50,100 C 4,100 0,96 0,50 Z"/></svg>');
  mask-size: 100% 100%;
  mask-repeat: no-repeat;
  -webkit-mask-image: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><path fill="black" d="M 0,50 C 0,4 4,0 50,0 C 96,0 100,4 100,50 C 100,96 96,100 50,100 C 4,100 0,96 0,50 Z"/></svg>');
  -webkit-mask-size: 100% 100%;
  -webkit-mask-repeat: no-repeat;
}`)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold px-3 py-1.5 rounded-lg text-xs transition-colors flex items-center space-x-1 border border-slate-700"
                >
                  {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedCode ? "Copied!" : "Copy Squircle CSS"}</span>
                </button>
              </div>
            </div>

            {/* 3 Native Target Mockups Grid */}
            <div className="space-y-4">
              <h4 className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
                Live Title Bar & App Bar Previews (Exact Sizing per Target)
              </h4>

              {/* 1. Desktop Window Title Bar (Windows 11 / macOS) */}
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-xl">
                {/* macOS Title Bar */}
                <div className="bg-slate-900 px-3.5 py-2 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <span className="w-3 h-3 rounded-full bg-red-500/80 inline-block border border-red-600/50" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80 inline-block border border-yellow-600/50" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80 inline-block border border-green-600/50" />
                  </div>
                  <KbtBrandLogo variant="desktop" size="sm" showLabel={true} />
                  <div className="text-[10px] font-mono text-slate-400 hidden sm:block">macOS Universal / Tauri v2</div>
                </div>

                {/* Windows 11 Title Bar */}
                <div className="bg-slate-900/90 px-3.5 py-1.5 border-b border-slate-800/80 flex items-center justify-between">
                  <KbtBrandLogo variant="desktop" size="sm" showLabel={true} />
                  <div className="flex items-center space-x-4 text-xs text-slate-400">
                    <span className="text-[10px] font-mono text-slate-400 hidden sm:inline">Windows 11 x64 Title Bar (20px Icon)</span>
                    <div className="flex items-center space-x-3 text-slate-400 pl-2">
                      <span className="hover:text-white cursor-pointer">─</span>
                      <span className="hover:text-white cursor-pointer">□</span>
                      <span className="hover:text-red-400 cursor-pointer">✕</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 text-xs font-mono text-slate-400 bg-slate-950/70 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                  <span><strong>Use Case 1:</strong> Desktop Window Header Icon (18px - 20px squircle mask in Tauri/Electron title bar)</span>
                  <span className="text-emerald-400 font-bold">`src-tauri/tauri.conf.json`</span>
                </div>
              </div>

              {/* 2. Mobile App Bar (iOS / Android) */}
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-xl max-w-lg mx-auto">
                <div className="bg-slate-900/90 px-4 py-1.5 flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800">
                  <span>9:41</span>
                  <div className="flex items-center space-x-1.5">
                    <span>5G</span>
                    <span>100%</span>
                  </div>
                </div>
                <div className="bg-slate-900 p-3.5 border-b border-slate-800 flex items-center justify-between">
                  <KbtBrandLogo variant="mobile" size="md" showLabel={true} />
                  <div className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold border border-emerald-500/30">
                    ARMED
                  </div>
                </div>
                <div className="p-3 text-xs font-mono text-slate-400 bg-slate-950/70">
                  <span><strong>Use Case 2:</strong> Mobile App Bar (36px squircle badge with subtle yellow glow)</span>
                </div>
              </div>

              {/* 3. Web Header Bar (Web Browsers / Web Apps) */}
              <div className="rounded-xl overflow-hidden border border-slate-700 bg-slate-950 shadow-xl">
                <div className="bg-slate-900/90 px-3.5 py-1.5 flex items-center space-x-2 border-b border-slate-800 text-[11px] font-mono text-slate-400">
                  <div className="flex items-center space-x-1">
                    <span className="text-slate-400">‹</span>
                    <span className="text-slate-400">›</span>
                    <span className="text-slate-400">↻</span>
                  </div>
                  <div className="flex-1 bg-slate-950 rounded px-2.5 py-0.5 text-slate-400 truncate text-[11px]">
                    https://snakedetector.kaybit.guard/monitor
                  </div>
                </div>
                <div className="bg-slate-900 p-3.5 flex items-center justify-between border-b border-slate-800">
                  <KbtBrandLogo variant="web" size="md" showLabel={true} />
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-mono text-slate-400 hidden sm:inline">Web Header Bar (32px)</span>
                    <span className="px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300 text-xs font-bold font-mono">
                      v2.4
                    </span>
                  </div>
                </div>
                <div className="p-3 text-xs font-mono text-slate-400 bg-slate-950/70">
                  <span><strong>Use Case 3:</strong> Web App Header Bar (32px responsive lockup with live pulse)</span>
                </div>
              </div>
            </div>

            {/* Asset Specifications & Tauri Command Table */}
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 space-y-3">
              <h4 className="text-xs font-bold text-slate-200 font-mono flex items-center space-x-2">
                <Boxes className="w-4 h-4 text-purple-400" />
                <span>Multiplatform Asset Bundling Specifications</span>
              </h4>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono text-slate-300">
                  <thead className="bg-slate-900 text-slate-400">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Target Platform</th>
                      <th className="p-2.5">Config Location</th>
                      <th className="p-2.5">Dimension Layout</th>
                      <th className="p-2.5 rounded-r-lg">Asset Format</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    <tr>
                      <td className="p-2.5 font-bold text-amber-400">Desktop (Tauri v2)</td>
                      <td className="p-2.5 text-slate-400">`src-tauri/tauri.conf.json`</td>
                      <td className="p-2.5">Up to 512x512</td>
                      <td className="p-2.5">`.ico` (Windows) / `.icns` (macOS)</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-emerald-400">Mobile Web App (Vite PWA)</td>
                      <td className="p-2.5 text-slate-400">`public/manifest.json`</td>
                      <td className="p-2.5">192x192 & 512x512</td>
                      <td className="p-2.5">Transparent `.png` + Squircle mask</td>
                    </tr>
                    <tr>
                      <td className="p-2.5 font-bold text-blue-400">Mobile Android Build</td>
                      <td className="p-2.5 text-slate-400">`android/app/src/main/res/`</td>
                      <td className="p-2.5">Adaptive Vectors (xxxhdpi)</td>
                      <td className="p-2.5">Foreground & Background `.png`</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Automatic CLI generator snippet */}
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5 pt-3">
                <span className="text-xs font-mono text-purple-400 font-bold block">
                  Automatic Multi-Size Generation Command (Tauri CLI):
                </span>
                <pre className="text-xs font-mono text-amber-300 bg-slate-950 p-2.5 rounded-lg overflow-x-auto">
                  npm run tauri icon ./public/assets/kbt-logo-transparent.png
                </pre>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

