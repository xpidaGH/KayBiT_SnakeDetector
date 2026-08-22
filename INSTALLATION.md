# Native Multi-Platform Packaging & Distribution Guide
## KayBiT Edge AI Snake Detector (Android, iOS/PWA, Windows, macOS)

This document provides an end-to-end blueprint for turning the KayBiT Vite + React TypeScript codebase into installable native applications across **Android (.apk/.aab)**, **iOS / Progressive Web App (PWA)**, **Windows (.exe/.msi)**, and **macOS (.dmg)** with automated CI/CD builds and download distribution links.

---

## 1. Tooling Selection & Architecture Recommendation

| Platform | Recommended Tool | Rationale | Binary Outputs |
|---|---|---|---|
| **Android** | **Capacitor 6** | Direct native Android WebView bridge, full Firebase Cloud Messaging (FCM) push support, native high-priority background audio/vibration, zero boilerplate. | `.apk` (Sideload / Direct download), `.aab` (Google Play Store) |
| **iOS / Web** | **PWA + Capacitor iOS** | PWA enables 1-click web install ("Add to Home Screen") without $99/yr Apple Developer fee; Capacitor iOS provides native APNs background wakeup. | Web PWA + `.ipa` / Xcode project |
| **Windows Desktop** | **Tauri v2** (or Electron) | Ultra-lightweight (~8MB vs Electron's 120MB), native WebView2 engine, low RAM footprint on surveillance monitoring PCs, auto-updater. | `.exe` (NSIS Installer), `.msi` |
| **macOS Desktop** | **Tauri v2** | Rust backend wrapping WKWebView, native Apple Silicon (M1/M2/M3/M4) & Intel universal binaries. | `.dmg`, `.app` |

---

## 2. Project Restructuring & Adaptations

To ensure your Vite + React TypeScript codebase compiles cleanly across both browser and native containers:

### 2.1 File Paths and Base URL
In `vite.config.ts`, set `base: './'` (relative paths) so that Capacitor and Tauri can resolve local bundled assets without relying on root `/` domain web servers:

```typescript
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL for Capacitor & Tauri local asset loading
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
  server: {
    host: '0.0.0.0',
    port: 3000,
  }
});
```

### 2.2 Offline Resilience & Dynamic API Fallbacks
Mobile and desktop clients can lose internet connectivity. Implement a base URL resolver that points to your deployed backend while falling back gracefully:

```typescript
// src/utils/apiConfig.ts
export const getApiBaseUrl = (): string => {
  // If running inside native Capacitor / Tauri or deployed elsewhere
  if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
    return 'https://your-kaybit-backend.run.app';
  }
  return import.meta.env.VITE_API_URL || '';
};
```

---

## 3. Concrete Configuration Files

### 3.1 Mobile Packaging: `capacitor.config.ts`

Install Capacitor dependencies:
```bash
npm install @capacitor/core @capacitor/cli @capacitor/android @capacitor/ios @capacitor/push-notifications @capacitor/local-notifications
npx cap init "KayBiT Snake Detector" "com.kaybit.snakedetector" --web-dir "dist"
```

Configuration file:
```typescript
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.kaybit.snakedetector',
  appName: 'KayBiT Snake Detector',
  webDir: 'dist',
  server: {
    androidScheme: 'https',
    cleartext: true, // Allows local RTSP/HTTP LAN testing
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
```

---

### 3.2 Desktop Packaging: `src-tauri/tauri.conf.json`

Initialize Tauri in your repository:
```bash
npm install -D @tauri-apps/cli
npx tauri init
```

Configuration file:
```json
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
    "allowlist": {
      "all": false,
      "http": {
        "all": true,
        "request": true,
        "scope": ["https://*/*", "http://*/*"]
      },
      "notification": {
        "all": true
      },
      "shell": {
        "all": false,
        "open": true
      }
    },
    "bundle": {
      "active": true,
      "category": "Utility",
      "copyright": "KayBiT AI Systems",
      "deb": {
        "depends": []
      },
      "externalBin": [],
      "icon": [
        "icons/32x32.png",
        "icons/128x128.png",
        "icons/128x128@2x.png",
        "icons/icon.icns",
        "icons/icon.ico"
      ],
      "identifier": "com.kaybit.snakedetector.desktop",
      "longDescription": "KayBiT Edge AI Vision Snake Detection & Real-time Emergency Siren System",
      "macOS": {
        "frameworks": [],
        "minimumSystemVersion": "10.15",
        "signingIdentity": null
      },
      "resources": [],
      "shortDescription": "Edge AI Snake Intrusion Detector",
      "targets": "all",
      "windows": {
        "certificateThumbprint": null,
        "digestAlgorithm": "sha256",
        "timestampServer": "",
        "wix": {
          "language": "en-US"
        }
      }
    },
    "security": {
      "csp": null
    },
    "windows": [
      {
        "fullscreen": false,
        "height": 900,
        "resizable": true,
        "title": "KayBiT Edge AI Snake Detector",
        "width": 1440,
        "minWidth": 1024,
        "minHeight": 700
      }
    ]
  }
}
```

---

### 3.3 Web PWA: `manifest.json`

Place `public/manifest.json`:
```json
{
  "short_name": "KayBiT Snake",
  "name": "KayBiT Edge AI Snake Detector",
  "icons": [
    {
      "src": "/icons/icon-192.png",
      "type": "image/png",
      "sizes": "192x192",
      "purpose": "any maskable"
    },
    {
      "src": "/icons/icon-512.png",
      "type": "image/png",
      "sizes": "512x512",
      "purpose": "any maskable"
    }
  ],
  "start_url": "/",
  "background_color": "#020617",
  "theme_color": "#f59e0b",
  "display": "standalone",
  "orientation": "portrait-primary",
  "categories": ["security", "utilities", "education"]
}
```

---

## 4. Build Automation: GitHub Actions CI/CD (`.github/workflows/build-all.yml`)

Create `.github/workflows/build-all.yml` in your repository. Whenever you push a Git tag (e.g. `v1.2.0`) or push to `main`, GitHub automatically builds the Android `.apk`, Windows `.exe`, and macOS `.dmg`:

```yaml
name: Build Native Cross-Platform Binaries

on:
  push:
    tags:
      - 'v*'
    branches:
      - main
  workflow_dispatch:

jobs:
  # 1. Build Android APK
  build-android:
    name: Build Android APK
    runs-on: ubuntu-latest
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Setup Java JDK 17
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: '17'

      - name: Setup Android SDK
        uses: android-actions/setup-android@v3

      - name: Install NPM Dependencies
        run: npm ci

      - name: Build Web Assets
        run: npm run build

      - name: Sync Capacitor Android
        run: |
          npx cap add android || true
          npx cap sync android

      - name: Build Android Debug APK
        working-directory: android
        run: ./gradlew assembleDebug --stacktrace

      - name: Upload Android APK Artifact
        uses: actions/upload-artifact@v4
        with:
          name: KayBiT-Android-APK
          path: android/app/build/outputs/apk/debug/app-debug.apk

  # 2. Build Desktop Binaries (Windows & macOS via Tauri)
  build-desktop:
    name: Build Desktop (${{ matrix.platform }})
    strategy:
      fail-fast: false
      matrix:
        include:
          - platform: 'windows-latest'
            output: 'src-tauri/target/release/bundle/nsis/*.exe'
            name: 'KayBiT-Windows-Setup.exe'
          - platform: 'macos-latest'
            output: 'src-tauri/target/release/bundle/dmg/*.dmg'
            name: 'KayBiT-macOS-Installer.dmg'

    runs-on: ${{ matrix.platform }}
    steps:
      - name: Checkout Code
        uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install Rust Stable
        uses: dtolnay/rust-toolchain@stable

      - name: Install NPM Dependencies
        run: npm ci

      - name: Build Tauri Desktop Package
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        with:
          tagName: v__VERSION__
          releaseName: 'KayBiT v__VERSION__'
          releaseBody: 'Direct download binaries for Windows, macOS, and Android.'
          releaseDraft: false
          prerelease: false

  # 3. Create GitHub Release with Direct Download Links
  publish-release:
    name: Publish Public Direct Download Release
    needs: [build-android, build-desktop]
    runs-on: ubuntu-latest
    if: startsWith(github.ref, 'refs/tags/v')
    steps:
      - name: Download Android Artifact
        uses: actions/download-artifact@v4
        with:
          name: KayBiT-Android-APK
          path: release-assets/

      - name: Rename Android Asset
        run: mv release-assets/app-debug.apk release-assets/KayBiT-SnakeDetector-Android.apk

      - name: Upload to GitHub Release
        uses: softprops/action-gh-release@v2
        with:
          files: release-assets/*
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

---

## 5. Hosting & Direct Distribution Architecture

To provide high-speed, direct download links on your websites for students without hitting bandwidth limits or broken URLs:

### 5.1 Option A: GitHub Releases CDN (Recommended & 100% Free)
GitHub Releases provides free worldwide CDN hosting for binaries up to 2GB per asset:

- **Permanent Latest Android APK URL**:
  `https://github.com/<your-username>/<your-repo>/releases/latest/download/KayBiT-SnakeDetector-Android.apk`
- **Permanent Latest Windows .EXE URL**:
  `https://github.com/<your-username>/<your-repo>/releases/latest/download/KayBiT-Windows-Setup.exe`
- **Permanent Latest macOS .DMG URL**:
  `https://github.com/<your-username>/<your-repo>/releases/latest/download/KayBiT-macOS-Installer.dmg`

### 5.2 Option B: S3 / Cloudflare R2 / Vercel Storage Structure
If distributing from custom S3/R2 object storage:

```
s3://kaybit-app-distribution/
  ├── v1.2.0/
  │    ├── KayBiT-Android-v1.2.0.apk
  │    ├── KayBiT-Windows-v1.2.0.exe
  │    └── KayBiT-macOS-v1.2.0.dmg
  ├── latest/
  │    ├── KayBiT-Android-Latest.apk
  │    ├── KayBiT-Windows-Latest.exe
  │    ├── KayBiT-macOS-Latest.dmg
  │    └── version.json
```

The `version.json` structure for client auto-updates:
```json
{
  "version": "1.2.0",
  "releaseDate": "2026-08-21",
  "minRequiredVersion": "1.0.0",
  "changelog": "Hailo-8L NPU acceleration, sub-3s FCM push SLA, solar battery monitor.",
  "downloads": {
    "android": "https://downloads.kaybit.com/latest/KayBiT-Android-Latest.apk",
    "windows": "https://downloads.kaybit.com/latest/KayBiT-Windows-Latest.exe",
    "macos": "https://downloads.kaybit.com/latest/KayBiT-macOS-Latest.dmg"
  }
}
```

---

## 6. Website Download Button Integration

Embed these download buttons on your landing page or student portal:

```html
<!-- Student Portal Download Grid -->
<div class="download-grid">
  <!-- Android APK -->
  <a href="https://github.com/YOUR_USER/YOUR_REPO/releases/latest/download/KayBiT-SnakeDetector-Android.apk" class="btn btn-android">
    <svg>...</svg> Download Android APK (Direct)
  </a>

  <!-- Windows EXE -->
  <a href="https://github.com/YOUR_USER/YOUR_REPO/releases/latest/download/KayBiT-Windows-Setup.exe" class="btn btn-windows">
    <svg>...</svg> Download Windows (.exe Installer)
  </a>

  <!-- macOS DMG -->
  <a href="https://github.com/YOUR_USER/YOUR_REPO/releases/latest/download/KayBiT-macOS-Installer.dmg" class="btn btn-apple">
    <svg>...</svg> Download macOS (.dmg Universal)
  </a>

  <!-- iOS PWA Instruction -->
  <button onclick="showPwaPrompt()" class="btn btn-pwa">
    <svg>...</svg> Install Web PWA (iOS / Safari)
  </button>
</div>
```

---

## 7. Verification & Testing Checklist

- [ ] **Android**: Transferred `.apk` to phone, enabled "Install unknown apps", confirmed background FCM notification sound.
- [ ] **Windows**: Ran `.exe`, verified SmartScreen signature / bypass, tested live RTSP streams in WebView2.
- [ ] **macOS**: Dragged `.app` into `/Applications`, tested on both Apple Silicon and Intel Macs.
- [ ] **iOS / PWA**: Navigated to site in Safari, tapped Share -> **Add to Home Screen**, verified full-screen display.
