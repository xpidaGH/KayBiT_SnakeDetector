export const TAURI_CONFIG_SNIPPET = `{
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
      "icon": ["icons/icon.ico", "icons/icon.icns"],
      "targets": "all",
      "windows": { "certificateThumbprint": null },
      "macOS": { "minimumSystemVersion": "10.15" }
    },
    "windows": [
      {
        "title": "KayBiT Edge AI Snake Detector",
        "width": 1440,
        "height": 900,
        "resizable": true
      }
    ]
  }
}`;

export const CAPACITOR_CONFIG_SNIPPET = `// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kaybit.snakedetector',
  appName: 'KayBiT Snake Detector',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true, // Enables local RTSP streaming on LAN
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
    webContentsDebuggingEnabled: true,
  }
};

export default config;`;

export const GITHUB_ACTIONS_YAML = `name: Build Native Cross-Platform Binaries (Android, Windows, macOS)

on:
  push:
    tags:
      - 'v*'
    branches:
      - main
  workflow_dispatch:

jobs:
  # 1. Android APK Build
  build-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - uses: actions/setup-java@v4
        with: { distribution: 'zulu', java-version: '17' }
      - uses: android-actions/setup-android@v3
      - run: npm ci && npm run build
      - run: npx cap add android || true && npx cap sync android
      - working-directory: android
        run: ./gradlew assembleDebug --stacktrace
      - uses: actions/upload-artifact@v4
        with:
          name: KayBiT-Android-APK
          path: android/app/build/outputs/apk/debug/app-debug.apk

  # 2. Desktop Windows (.exe) & macOS (.dmg) Build
  build-desktop:
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'windows-latest'
          - platform: 'macos-latest'
    runs-on: \${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'npm' }
      - uses: dtolnay/rust-toolchain@stable
      - run: npm ci
      - uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: \${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v__VERSION__
          releaseName: 'KayBiT v__VERSION__'
          releaseDraft: false
          prerelease: false`;

export interface PackagingPlatformInfo {
  id: "flutter" | "react_native" | "capacitor" | "tauri_desktop" | "cicd_automation";
  name: string;
  badge: string;
  description: string;
  prerequisites: string[];
  buildSteps: { command: string; explanation: string }[];
}

export const PACKAGING_PLATFORMS: PackagingPlatformInfo[] = [
  {
    id: "capacitor",
    name: "Capacitor Mobile (Android APK & iOS)",
    badge: "Fastest Direct Build",
    description: "Wrap this exact React TypeScript frontend into an installable native Android APK or iOS Xcode project with hardware sound and notification hooks.",
    prerequisites: ["Node.js 18+", "Android Studio / SDK build-tools", "Xcode (for iOS)"],
    buildSteps: [
      { command: "npm run build", explanation: "Compiles the web application to /dist directory" },
      { command: "npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios", explanation: "Installs Capacitor native runtime bridge" },
      { command: "npx cap init \"KayBiT Snake Detector\" \"com.kaybit.snakedetector\" --web-dir dist", explanation: "Initializes Capacitor configuration" },
      { command: "npx cap add android && npx cap sync", explanation: "Generates native Gradle project in /android folder" },
      { command: "npx cap open android", explanation: "Opens Android Studio to run or build signed release APK" }
    ]
  },
  {
    id: "tauri_desktop",
    name: "Tauri Desktop (.EXE & .DMG)",
    badge: "Ultra-Lightweight Desktop",
    description: "Package the dashboard as a native Windows (.exe) or macOS (.dmg) desktop security monitor with minimal RAM footprint (~35MB) powered by Rust.",
    prerequisites: ["Rust & Cargo", "C++ Build Tools (Windows) / Xcode CLI (macOS)"],
    buildSteps: [
      { command: "npm install -D @tauri-apps/cli", explanation: "Installs Tauri build CLI" },
      { command: "npx tauri init", explanation: "Creates src-tauri Rust runner directory" },
      { command: "npx tauri build", explanation: "Compiles native desktop binary into src-tauri/target/release" }
    ]
  },
  {
    id: "flutter",
    name: "Flutter Mobile Engine (Dart)",
    badge: "Native Performance",
    description: "Native Dart client featuring background wake-locks, audio session ducking overrides, and Firebase Cloud Messaging high-priority notification listeners.",
    prerequisites: ["Flutter SDK 3.x", "Android Studio / Xcode", "Firebase CLI"],
    buildSteps: [
      { command: "flutter pub get", explanation: "Fetches Flutter packages (firebase_messaging, audioplayers)" },
      { command: "flutter build apk --release --split-per-abi", explanation: "Builds optimized release APKs for ARM64 devices" },
      { command: "flutter build ipa --release", explanation: "Generates iOS production archive for TestFlight" }
    ]
  },
  {
    id: "react_native",
    name: "React Native Framework",
    badge: "Component Parity",
    description: "React Native application using Notifee and React Native Firebase for full-screen emergency intent wake-up notifications on Android.",
    prerequisites: ["Node.js", "JDK 17", "Android Studio SDK"],
    buildSteps: [
      { command: "npm install @react-native-firebase/app @react-native-firebase/messaging @notifee/react-native", explanation: "Installs native notification SDKs" },
      { command: "npx react-native run-android --mode=release", explanation: "Compiles and installs release APK directly on connected phone" }
    ]
  },
  {
    id: "cicd_automation",
    name: "GitHub Actions CI/CD Pipeline",
    badge: "Automated Releases",
    description: "Zero-touch continuous integration workflow that automatically builds Android APKs and Desktop installers on every git tag or main branch push.",
    prerequisites: ["GitHub Repository with Actions enabled"],
    buildSteps: [
      { command: "mkdir -p .github/workflows", explanation: "Creates workflow definition directory" },
      { command: "touch .github/workflows/build-cross-platform.yml", explanation: "Adds multi-platform build workflow" }
    ]
  }
];
