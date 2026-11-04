# GitHub Actions CI/CD: Automated Multiplatform Build, Signing & Release Pipeline

This guide and workflow specification establishes a production-grade continuous integration and continuous deployment (CI/CD) matrix for the **KayBiT Snake Detector** multiplatform ecosystem.

The workflow compiles and securely signs cross-platform binaries across **Android, iOS, Windows, macOS, and Linux**, automatically publishes builds to **Apple TestFlight** and **Google Play Internal Testing**, generates release notes from git commits, and delivers real-time notifications to **Slack, Discord, and Email**.

---

## 1. Zero-Exposure Secret Encoding Guide (Bash vs. PowerShell)

> ⚠️ **CRITICAL SECURITY RULE**: Never commit raw `.keystore`, `.jks`, `.p12`, `.cer`, or `.mobileprovision` files into your repository. Convert them into Base64 strings and store them strictly in **GitHub Repository Secrets** (`Settings` > `Secrets and variables` > `Actions`).

### A. Android Keystore (`release.keystore`)

#### Step 1: Generate Keystore locally
```bash
keytool -genkey -v -keystore release.keystore -alias kaybit-key -keyalg RSA -keysize 2048 -validity 10000
```

#### Step 2: Convert to Base64 String
* **Bash (macOS / Linux)**:
  ```bash
  base64 -i release.keystore -o keystore_base64.txt
  # Or on standard Linux:
  base64 -w 0 release.keystore > keystore_base64.txt
  ```
* **PowerShell (Windows)**:
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes(".\release.keystore")) | Out-File -Encoding ascii keystore_base64.txt
  ```

Copy the single-line string inside `keystore_base64.txt` and save as `ANDROID_KEYSTORE_BASE64` in GitHub Secrets.

---

### B. Apple iOS Certificates & Provisioning Profile

#### Step 1: Export Distribution Certificate (`Certificates.p12`) from Keychain
Export your Apple Distribution Certificate as a password-protected `.p12` file.

#### Step 2: Convert `.p12` and `.mobileprovision` to Base64
* **Bash (macOS / Linux)**:
  ```bash
  base64 -i Certificates.p12 -o cert_base64.txt
  base64 -i KayBiT_AppStore.mobileprovision -o profile_base64.txt
  ```
* **PowerShell (Windows)**:
  ```powershell
  [Convert]::ToBase64String([IO.File]::ReadAllBytes(".\Certificates.p12")) | Out-File -Encoding ascii cert_base64.txt
  [Convert]::ToBase64String([IO.File]::ReadAllBytes(".\KayBiT_AppStore.mobileprovision")) | Out-File -Encoding ascii profile_base64.txt
  ```

Save the strings as `IOS_DIST_P12_BASE64` and `IOS_PROVISION_PROFILE_BASE64` in GitHub Secrets.

---

### C. In-Memory Runner Decoding Reference

During execution, the runner reconstructs these files exclusively in transient runner memory or temporary build paths:

* **Bash runner command**:
  ```bash
  echo "$ANDROID_KEYSTORE_BASE64" | base64 --decode > android/app/release.keystore
  ```
* **PowerShell runner command**:
  ```powershell
  [IO.File]::WriteAllBytes(".\release.keystore", [Convert]::FromBase64String($env:ANDROID_KEYSTORE_BASE64))
  ```

---

## 2. GitHub Secrets Reference Directory

Configure the following secrets in **GitHub > Repository Settings > Secrets and variables > Actions**:

| Secret Key | Description | Example / Format |
|---|---|---|
| `ANDROID_KEYSTORE_BASE64` | Base64-encoded Android release keystore | `MIIKPQIBAzCCCfcGCSqGSIb3DQE...` |
| `ANDROID_KEYSTORE_PASSWORD` | Master password for the keystore | `SuperSecurePassword123!` |
| `ANDROID_KEY_ALIAS` | Key alias specified during keytool creation | `kaybit-key` |
| `ANDROID_KEY_PASSWORD` | Password for the specific key alias | `SuperSecurePassword123!` |
| `GOOGLE_PLAY_SERVICE_ACCOUNT_JSON` | Google Play Console API service account JSON | `{"type": "service_account", ...}` |
| `IOS_DIST_P12_BASE64` | Base64-encoded Apple Distribution `.p12` | `MIIMgQIBAzCCC18GCSqGSIb3DQ...` |
| `IOS_P12_PASSWORD` | Export password for the `.p12` certificate | `AppleCertExportPassword2026` |
| `IOS_PROVISION_PROFILE_BASE64` | Base64-encoded `.mobileprovision` file | `MIIFvAYJKoZIhvcNAQcCoIIFrT...` |
| `APPLE_TEAM_ID` | 10-character Apple Developer Team ID | `ABC123XYZ4` |
| `APPLE_BUNDLE_ID` | Application Bundle Identifier | `com.kaybit.snakedetector` |
| `APPLE_PROVISION_PROFILE_NAME` | Name of the provisioning profile in Apple Portal | `KayBiT Snake Detector AppStore` |
| `APP_STORE_CONNECT_KEY_ID` | App Store Connect API Key ID | `2X9R4274K8` |
| `APP_STORE_CONNECT_ISSUER_ID` | App Store Connect Issuer UUID | `69a6de70-XXXX-XXXX-XXXX-XXXXXXXXXXXX` |
| `APP_STORE_CONNECT_API_KEY_BASE64` | Base64-encoded AuthKey_XXXXXX.p8 private key | `LS0tLS1CRUdJTiBQUklWQVRF...` |
| `SLACK_WEBHOOK_URL` | Incoming webhook URL for Slack channel | `https://hooks.slack.com/services/...` |
| `DISCORD_WEBHOOK_URL` | Discord channel webhook URL | `https://discord.com/api/webhooks/...` |

---

## 3. Dynamic `exportOptions.plist` Template

To ensure Team ID, Bundle ID, and Profile Name are never exposed in public repositories, maintain a template file `ios/App/exportOptions.plist.template` with placeholders, and substitute values dynamically during the GitHub Actions run:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>method</key>
    <string>app-store</string>
    <key>teamID</key>
    <string>${APPLE_TEAM_ID}</string>
    <key>signingStyle</key>
    <string>manual</string>
    <key>signingCertificate</key>
    <string>Apple Distribution</string>
    <key>provisioningProfiles</key>
    <dict>
        <key>${APPLE_BUNDLE_ID}</key>
        <string>${APPLE_PROVISION_PROFILE_NAME}</string>
    </dict>
    <key>stripSwiftSymbols</key>
    <true/>
    <key>compileBitcode</key>
    <false/>
    <key>destination</key>
    <string>export</string>
</dict>
</plist>
```

In the workflow step, substitute the environment variables via:
```bash
envsubst < ios/App/exportOptions.plist.template > ios/App/exportOptions.plist
```

---

## 4. Production Workflow Implementation: `.github/workflows/multiplatform-build-release.yml`

Create the following file in your repository at `.github/workflows/multiplatform-build-release.yml`:

```yaml
name: KayBiT Multiplatform Build, Sign & Release Pipeline

on:
  push:
    tags:
      - 'v*'
  workflow_dispatch:
    inputs:
      release_type:
        description: 'Release Channel'
        required: true
        default: 'internal_testing'
        type: choice
        options:
          - internal_testing
          - production

permissions:
  contents: write
  packages: write

env:
  NODE_VERSION: '20'
  JAVA_VERSION: '17'
  APP_NAME: 'KayBiT Snake Detector'
  PACKAGE_NAME: 'com.kaybit.snakedetector'
  # Continuous Build Integer using GitHub Run Number
  BUILD_NUMBER: ${{ github.run_number }}

jobs:
  # =========================================================================
  # JOB 1: MATRIX BUILD & SIGNING (macOS, Windows, Ubuntu)
  # =========================================================================
  build-matrix:
    name: Build & Package (${{ matrix.platform }})
    runs-on: ${{ matrix.os }}
    strategy:
      fail-fast: false
      matrix:
        include:
          # Runner 1: macOS Latest -> iOS .ipa + macOS Universal .dmg
          - os: macos-latest
            platform: macos-ios
            target_desc: 'iOS IPA & macOS Universal DMG'

          # Runner 2: Windows Latest -> Windows .exe & .msi (Tauri)
          - os: windows-latest
            platform: windows
            target_desc: 'Windows x64 Installer (.msi / .exe)'

          # Runner 3: Ubuntu Latest -> Android (.apk / .aab) + Linux (.AppImage / .deb)
          - os: ubuntu-latest
            platform: android-linux
            target_desc: 'Android AAB/APK & Linux AppImage'

    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: ⚙️ Setup Node.js Runtime
        uses: actions/setup-node@v4
        with:
          node-version: ${{ env.NODE_VERSION }}
          cache: 'npm'

      - name: 📦 Install Web App Dependencies
        run: npm ci

      # ---------------------------------------------------------------------
      # PLATFORM SPECIFIC: MACOS & IOS (macos-latest)
      # ---------------------------------------------------------------------
      - name: 🍏 [iOS] Setup Xcode Version
        if: matrix.platform == 'macos-ios'
        uses: maxim-lobachevsky/setup-xcode@v1
        with:
          xcode-version: '15.4'

      - name: 🔐 [iOS] Import Distribution Certificate & Profile
        if: matrix.platform == 'macos-ios'
        uses: apple-actions/import-codesign-certs@v2
        with:
          p12-file-base64: ${{ secrets.IOS_DIST_P12_BASE64 }}
          p12-password: ${{ secrets.IOS_P12_PASSWORD }}

      - name: 📄 [iOS] Install Provisioning Profile & Configure exportOptions
        if: matrix.platform == 'macos-ios'
        env:
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          APPLE_BUNDLE_ID: ${{ secrets.APPLE_BUNDLE_ID }}
          APPLE_PROVISION_PROFILE_NAME: ${{ secrets.APPLE_PROVISION_PROFILE_NAME }}
        run: |
          mkdir -p ~/Library/MobileDevice/Provisioning\ Profiles
          echo "${{ secrets.IOS_PROVISION_PROFILE_BASE64 }}" | base64 --decode > ~/Library/MobileDevice/Provisioning\ Profiles/profile.mobileprovision
          
          # Inject secrets into exportOptions.plist safely
          sed -e "s/\${APPLE_TEAM_ID}/$APPLE_TEAM_ID/g" \
              -e "s/\${APPLE_BUNDLE_ID}/$APPLE_BUNDLE_ID/g" \
              -e "s/\${APPLE_PROVISION_PROFILE_NAME}/$APPLE_PROVISION_PROFILE_NAME/g" \
              ios/App/exportOptions.plist.template > ios/App/exportOptions.plist

      - name: 🔨 [iOS] Build Web App & Capacitor Sync
        if: matrix.platform == 'macos-ios'
        run: |
          npm run build
          npx cap sync ios

      - name: 📱 [iOS] Archive & Export Signed .ipa
        if: matrix.platform == 'macos-ios'
        run: |
          xcodebuild archive \
            -workspace ios/App/App.xcworkspace \
            -scheme App \
            -configuration Release \
            -archivePath build/KayBiT.xcarchive \
            CURRENT_PROJECT_VERSION=${{ env.BUILD_NUMBER }}
            
          xcodebuild -exportArchive \
            -archivePath build/KayBiT.xcarchive \
            -exportOptionsPlist ios/App/exportOptions.plist \
            -exportPath build/iOS_Export

      - name: 🦀 [macOS] Setup Rust Toolchain & Build Tauri Universal DMG
        if: matrix.platform == 'macos-ios'
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: x86_64-apple-darwin,aarch64-apple-darwin

      - name: 🖥️ [macOS] Compile Dual-Architecture Universal .dmg
        if: matrix.platform == 'macos-ios'
        run: |
          npm run tauri build -- --target universal-apple-darwin
        env:
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_KEY }}

      # ---------------------------------------------------------------------
      # PLATFORM SPECIFIC: WINDOWS (windows-latest)
      # ---------------------------------------------------------------------
      - name: 🦀 [Windows] Setup Rust Toolchain
        if: matrix.platform == 'windows'
        uses: dtolnay/rust-toolchain@stable

      - name: 🪟 [Windows] Install WiX Toolset & NSIS
        if: matrix.platform == 'windows'
        shell: powershell
        run: |
          choco install wixtoolset nsis -y

      - name: 🖥️ [Windows] Compile Tauri x64 .msi & .exe
        if: matrix.platform == 'windows'
        shell: powershell
        run: |
          npm run build
          npm run tauri build -- --target x86_64-pc-windows-msvc
        env:
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_KEY }}

      # ---------------------------------------------------------------------
      # PLATFORM SPECIFIC: ANDROID & LINUX (ubuntu-latest)
      # ---------------------------------------------------------------------
      - name: ☕ [Android] Setup JDK 17
        if: matrix.platform == 'android-linux'
        uses: actions/setup-java@v4
        with:
          distribution: 'zulu'
          java-version: ${{ env.JAVA_VERSION }}
          cache: 'gradle'

      - name: 🤖 [Android] Setup Android SDK & NDK
        if: matrix.platform == 'android-linux'
        uses: android-actions/setup-android@v3

      - name: 🐧 [Linux] Install System Dependencies & PipeWire Audio
        if: matrix.platform == 'android-linux'
        run: |
          sudo apt-get update
          sudo apt-get install -y libwebkit2gtk-4.1-dev build-essential curl wget \
            file libxdo-dev libssl-dev libayatana-appindicator3-dev librsvg2-dev \
            libpipewire-0.3-dev libasound2-dev

      - name: 🔑 [Android] Decode Release Keystore in Memory
        if: matrix.platform == 'android-linux'
        run: |
          echo "${{ secrets.ANDROID_KEYSTORE_BASE64 }}" | base64 --decode > android/app/release.keystore

      - name: 📱 [Android] Build & Sign Release Bundle (.aab) and APK
        if: matrix.platform == 'android-linux'
        run: |
          npm run build
          npx cap sync android
          cd android
          ./gradlew bundleRelease assembleRelease \
            -PversionCode=${{ env.BUILD_NUMBER }} \
            -Pandroid.injected.signing.store.file=release.keystore \
            -Pandroid.injected.signing.store.password="${{ secrets.ANDROID_KEYSTORE_PASSWORD }}" \
            -Pandroid.injected.signing.key.alias="${{ secrets.ANDROID_KEY_ALIAS }}" \
            -Pandroid.injected.signing.key.password="${{ secrets.ANDROID_KEY_PASSWORD }}"

      - name: 🐧 [Linux] Compile Signed .AppImage & .deb (Tauri)
        if: matrix.platform == 'android-linux'
        run: |
          npm run tauri build

      # ---------------------------------------------------------------------
      # ARTIFACT PRESERVATION STEP
      # ---------------------------------------------------------------------
      - name: 📤 Upload Build Artifacts
        uses: actions/upload-artifact@v4
        with:
          name: artifacts-${{ matrix.platform }}
          path: |
            build/iOS_Export/*.ipa
            src-tauri/target/universal-apple-darwin/release/bundle/dmg/*.dmg
            src-tauri/target/x86_64-pc-windows-msvc/release/bundle/msi/*.msi
            src-tauri/target/x86_64-pc-windows-msvc/release/bundle/nsis/*.exe
            android/app/build/outputs/bundle/release/*.aab
            android/app/build/outputs/apk/release/*.apk
            src-tauri/target/release/bundle/appimage/*.AppImage
            src-tauri/target/release/bundle/deb/*.deb
          if-no-files-found: warn

  # =========================================================================
  # JOB 2: STORE DEPLOYMENT (TestFlight & Google Play Internal Testing)
  # =========================================================================
  store-deployment:
    name: Auto-Publish to Stores (TestFlight & Google Play)
    needs: build-matrix
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Download Android & iOS Artifacts
        uses: actions/download-artifact@v4
        with:
          pattern: artifacts-*
          merge-multiple: true

      - name: 🚀 [Apple TestFlight] Upload Signed .ipa
        if: env.HAS_APPLE_SECRETS == 'true'
        uses: apple-actions/upload-testflight-build@v1
        with:
          app-path: ./*.ipa
          issuer-id: ${{ secrets.APP_STORE_CONNECT_ISSUER_ID }}
          api-key-id: ${{ secrets.APP_STORE_CONNECT_KEY_ID }}
          api-private-key: ${{ secrets.APP_STORE_CONNECT_API_KEY_BASE64 }}
        env:
          HAS_APPLE_SECRETS: ${{ secrets.APP_STORE_CONNECT_KEY_ID != '' }}

      - name: 🚀 [Google Play] Upload Signed .aab to Internal Testing Track
        if: env.HAS_GOOGLE_SECRETS == 'true'
        uses: r0adkll/upload-google-play@v1
        with:
          serviceAccountJsonPlainText: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON }}
          packageName: ${{ env.PACKAGE_NAME }}
          releaseFiles: ./*.aab
          track: internal
          status: completed
        env:
          HAS_GOOGLE_SECRETS: ${{ secrets.GOOGLE_PLAY_SERVICE_ACCOUNT_JSON != '' }}

  # =========================================================================
  # JOB 3: DESKTOP GITHUB RELEASE & AUTOMATED CHANGELOG GENERATOR
  # =========================================================================
  github-release:
    name: Desktop GitHub Release & Changelog
    needs: build-matrix
    if: startsWith(github.ref, 'refs/tags/v')
    runs-on: ubuntu-latest
    steps:
      - name: 📥 Checkout Repository
        uses: actions/checkout@v4
        with:
          fetch-depth: 0

      - name: 📥 Download All Compiled Desktop & Mobile Binaries
        uses: actions/download-artifact@v4
        with:
          pattern: artifacts-*
          merge-multiple: true
          path: release-assets

      - name: 📝 Generate Automated Commit Changelog
        id: changelog
        run: |
          PREV_TAG=$(git describe --tags --abbrev=0 HEAD^ 2>/dev/null || echo "")
          if [ -z "$PREV_TAG" ]; then
            COMMITS=$(git log --pretty=format:"- %s (%h)" -n 25)
          else
            COMMITS=$(git log ${PREV_TAG}..HEAD --pretty=format:"- %s (%h)")
          fi
          
          echo "CHANGELOG<<EOF" >> $GITHUB_OUTPUT
          echo "### 🚀 What's Changed in Build #${{ env.BUILD_NUMBER }}" >> $GITHUB_OUTPUT
          echo "" >> $GITHUB_OUTPUT
          echo "$COMMITS" >> $GITHUB_OUTPUT
          echo "" >> $GITHUB_OUTPUT
          echo "### 📦 Multiplatform Assets" >> $GITHUB_OUTPUT
          echo "- **Windows**: .msi (WiX) and .exe (NSIS)" >> $GITHUB_OUTPUT
          echo "- **macOS**: Universal Binary .dmg (Apple Silicon & Intel)" >> $GITHUB_OUTPUT
          echo "- **Linux**: .AppImage with PipeWire Audio Support" >> $GITHUB_OUTPUT
          echo "- **Android**: .apk (Direct Install) & .aab (Google Play)" >> $GITHUB_OUTPUT
          echo "- **iOS**: .ipa (TestFlight / App Store Archive)" >> $GITHUB_OUTPUT
          echo "EOF" >> $GITHUB_OUTPUT

      - name: 🏷️ Publish GitHub Release with Signed Binaries
        uses: softprops/action-gh-release@v2
        with:
          body: ${{ steps.changelog.outputs.CHANGELOG }}
          draft: false
          prerelease: false
          files: |
            release-assets/*.msi
            release-assets/*.dmg
            release-assets/*.AppImage
            release-assets/*.apk
            release-assets/*.aab

  # =========================================================================
  # JOB 4: TEAM NOTIFICATIONS (Slack, Discord, Email)
  # =========================================================================
  notify-team:
    name: Send Build Notifications
    needs: [build-matrix, store-deployment, github-release]
    if: always()
    runs-on: ubuntu-latest
    steps:
      - name: 📣 Notify Discord Channel
        if: env.HAS_DISCORD == 'true'
        run: |
          STATUS="${{ needs.build-matrix.result == 'success' && '✅ SUCCESS' || '❌ FAILED' }}"
          COLOR="${{ needs.build-matrix.result == 'success' && 3066993 || 15158332 }}"
          curl -H "Content-Type: application/json" -X POST \
            -d "{\"embeds\": [{\"title\": \"KayBiT Build #${{ env.BUILD_NUMBER }} - ${STATUS}\", \"description\": \"Multiplatform CI/CD completed for branch \`${{ github.ref_name }}\`.\", \"color\": ${COLOR}, \"fields\": [{\"name\": \"Trigger\", \"value\": \"${{ github.actor }}\", \"inline\": true}, {\"name\": \"Commit\", \"value\": \"${{ github.sha }}\", \"inline\": true}]}]}" \
            "${{ secrets.DISCORD_WEBHOOK_URL }}"
        env:
          HAS_DISCORD: ${{ secrets.DISCORD_WEBHOOK_URL != '' }}

      - name: 💬 Notify Slack Channel
        if: env.HAS_SLACK == 'true'
        uses: rtCamp/action-slack-notify@v2
        env:
          SLACK_WEBHOOK: ${{ secrets.SLACK_WEBHOOK_URL }}
          SLACK_TITLE: "KayBiT Build #${{ env.BUILD_NUMBER }}: ${{ needs.build-matrix.result }}"
          SLACK_MESSAGE: "Multiplatform artifacts compiled and distributed to TestFlight & Google Play."
          SLACK_COLOR: ${{ needs.build-matrix.result == 'success' && 'good' || 'danger' }}
          HAS_SLACK: ${{ secrets.SLACK_WEBHOOK_URL != '' }}
```

---

## 5. Verification & Testing Instructions

1. Push a tag to test the entire release workflow:
   ```bash
   git tag v2.4.0
   git push origin v2.4.0
   ```
2. Monitor real-time logs under your GitHub repository's **Actions** tab.
3. Once completed:
   - Check **Apple TestFlight** for the newly processed iOS build.
   - Check **Google Play Console > Internal Testing** for the newly deployed `.aab`.
   - Visit **GitHub Releases** to download the compiled `.msi`, `.dmg`, and `.AppImage` desktop installers alongside the auto-generated changelog.
