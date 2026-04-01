# Turner Studio — Deployment Guide

> **Version:** 1.0.0
> **Platforms:** macOS · Windows · Linux
> **Packager:** electron-builder (recommended) or manual distribution

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Build Pipeline](#2-build-pipeline)
3. [Packaging with electron-builder](#3-packaging-with-electron-builder)
   - 3.1 [Install electron-builder](#31-install-electron-builder)
   - 3.2 [Configuration File](#32-configuration-file)
   - 3.3 [Build Commands](#33-build-commands)
4. [Platform-Specific Notes](#4-platform-specific-notes)
   - 4.1 [macOS](#41-macos)
   - 4.2 [Windows](#42-windows)
   - 4.3 [Linux](#43-linux)
5. [Code Signing](#5-code-signing)
   - 5.1 [macOS Signing & Notarization](#51-macos-signing--notarization)
   - 5.2 [Windows Code Signing](#52-windows-code-signing)
6. [FFmpeg Binary Handling](#6-ffmpeg-binary-handling)
7. [Settings File Location](#7-settings-file-location)
8. [Environment Variables Reference](#8-environment-variables-reference)
9. [Distribution Checklist](#9-distribution-checklist)
10. [Manual Distribution (No electron-builder)](#10-manual-distribution-no-electron-builder)
11. [Troubleshooting Builds](#11-troubleshooting-builds)

---

## 1. Prerequisites

### All Platforms

| Requirement | Minimum Version | Notes |
|---|---|---|
| Node.js | 20 LTS | Use nvm or fnm for version management |
| npm | 10 | Ships with Node 20 |
| Git | any | For cloning |
| Disk space | ~2 GB | For `node_modules`, build outputs, and packaged app |

### macOS

| Requirement | Notes |
|---|---|
| macOS 11 (Big Sur) or later | Required to build universal binaries |
| Xcode Command Line Tools | `xcode-select --install` |
| Apple Developer Account | Required for code signing and notarization |
| Developer ID Application certificate | Install in Keychain |

### Windows

| Requirement | Notes |
|---|---|
| Windows 10 or later | 64-bit only |
| Visual Studio Build Tools 2019 or 2022 | Required for native Node.js modules |
| Python 3 | Required for node-gyp |
| Code signing certificate (EV or OV) | Optional but strongly recommended |

> **Quick Windows setup:**
> ```cmd
> npm install --global windows-build-tools
> ```

### Linux

| Requirement | Notes |
|---|---|
| Ubuntu 20.04+ / Debian 11+ (or equivalent) | For `.deb` builds |
| RPM-based distro (Fedora, RHEL) | For `.rpm` builds |
| `fakeroot`, `dpkg-dev` | Needed for `.deb` packaging |
| `rpm-build` | Needed for `.rpm` packaging |
| `snapcraft` CLI | Needed for Snap packaging |
| `flatpak-builder` | Needed for Flatpak packaging |

---

## 2. Build Pipeline

Before packaging, the entire project must be compiled. The build order is **strictly sequential** because packages have dependencies on each other.

### Full Production Build

```bash
# From the repo root:
npm install           # Install all workspace dependencies
npm run build         # Build all packages + renderer + desktop
```

### What `npm run build` does

```
Step 1 — Build shared packages (in dependency order):
  packages/shared         → tsc → packages/shared/dist/
  packages/contracts      → tsc → packages/contracts/dist/
  packages/domain         → tsc → packages/domain/dist/
  packages/media-engine   → tsc → packages/media-engine/dist/
  packages/persistence    → tsc → packages/persistence/dist/
  packages/observability  → tsc → packages/observability/dist/

Step 2 — Build renderer:
  apps/renderer   → tsc --noEmit (type-check) + vite build → apps/renderer/dist/

Step 3 — Build desktop:
  apps/desktop    → tsc → apps/desktop/dist/
                         + copy src/preload/bridge.cjs → dist/preload/bridge.cjs
```

### Verify the Build

After `npm run build`, confirm these directories exist and are non-empty:

```
apps/renderer/dist/
├── index.html
├── assets/
│   ├── index-<hash>.js
│   └── index-<hash>.css

apps/desktop/dist/
├── main/
│   ├── index.js
│   ├── ipc.js
│   └── window.js
├── queue/
├── adapters/
└── preload/
    └── bridge.cjs        ← must exist
```

### Type Check (Optional but Recommended)

```bash
npm run typecheck
```

This checks the entire monorepo without emitting any files. Fix all TypeScript errors before proceeding to packaging.

---

## 3. Packaging with electron-builder

`electron-builder` is the recommended tool for creating distributable installers. It handles:
- Bundling the Electron runtime
- Including `node_modules` for the main process
- Platform-specific installer formats (`.dmg`, `.exe`, `.AppImage`, etc.)
- Code signing and notarization

### 3.1 Install electron-builder

```bash
npm install --save-dev electron-builder
```

Or install globally:
```bash
npm install --global electron-builder
```

### 3.2 Configuration File

Create `apps/desktop/electron-builder.yml` (or add `"build"` key to `apps/desktop/package.json`):

```yaml
# apps/desktop/electron-builder.yml

appId: com.turner.studio
productName: Turner Studio
copyright: Copyright © 2026 Turner Studio

# Point to the compiled main entry
files:
  - dist/**/*
  - node_modules/**/*
  - "!node_modules/.cache"
  - "!node_modules/**/{test,tests,__tests__,example,examples}/**"

# Include the pre-built renderer
extraResources:
  - from: "../renderer/dist"
    to: "renderer/dist"
    filter:
      - "**/*"

# Where electron-builder writes output installers
directories:
  output: "../../dist-release"
  buildResources: "build-assets"

# ─── macOS ──────────────────────────────────────────────
mac:
  category: public.app-category.video
  icon: build-assets/icon.icns
  target:
    - target: dmg
      arch: [x64, arm64]
    - target: zip
      arch: [x64, arm64]
  hardenedRuntime: true
  gatekeeperAssess: false
  entitlements: build-assets/entitlements.mac.plist
  entitlementsInherit: build-assets/entitlements.mac.plist
  notarize: false   # Set to true after configuring notarization credentials

dmg:
  title: "Turner Studio ${version}"
  contents:
    - x: 130
      y: 220
    - x: 410
      y: 220
      type: link
      path: /Applications

# ─── Windows ────────────────────────────────────────────
win:
  icon: build-assets/icon.ico
  target:
    - target: nsis
      arch: [x64]
    - target: portable
      arch: [x64]
  publisherName: Turner Studio
  verifyUpdateCodeSignature: false

nsis:
  oneClick: false
  allowToChangeInstallationDirectory: true
  installerIcon: build-assets/icon.ico
  uninstallerIcon: build-assets/icon.ico
  installerHeaderIcon: build-assets/icon.ico
  createDesktopShortcut: true
  createStartMenuShortcut: true
  shortcutName: Turner Studio

# ─── Linux ──────────────────────────────────────────────
linux:
  icon: build-assets/icon.png
  category: Video
  target:
    - target: AppImage
      arch: [x64]
    - target: deb
      arch: [x64]
    - target: rpm
      arch: [x64]
  maintainer: support@turnerstudio.app
  description: Convert WebM video files to MP4

deb:
  depends:
    - libnotify4
    - libxtst6
    - libnss3

# ─── Publish (optional — for GitHub Releases) ───────────
# publish:
#   provider: github
#   owner: your-github-username
#   repo: turner
```

### Build Assets Required

Create `apps/desktop/build-assets/` and add:

| File | Size | Format |
|---|---|---|
| `icon.icns` | 512×512 (macOS) | ICNS icon bundle |
| `icon.ico` | 256×256 (Windows) | ICO with multiple sizes |
| `icon.png` | 512×512 (Linux) | PNG |
| `entitlements.mac.plist` | — | macOS entitlements |

**Minimum `entitlements.mac.plist`:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
  <key>com.apple.security.cs.allow-jit</key>
  <true/>
  <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
  <true/>
  <key>com.apple.security.cs.disable-library-validation</key>
  <true/>
</dict>
</plist>
```

> **Note:** These entitlements are required for Electron's V8 JIT to function under macOS Hardened Runtime.

### 3.3 Build Commands

Add to `apps/desktop/package.json`:
```json
{
  "scripts": {
    "pack": "electron-builder --dir",
    "dist": "electron-builder",
    "dist:mac": "electron-builder --mac",
    "dist:win": "electron-builder --win",
    "dist:linux": "electron-builder --linux"
  }
}
```

Or add to root `package.json`:
```json
{
  "scripts": {
    "release": "npm run build && npm --prefix apps/desktop run dist",
    "release:mac": "npm run build && npm --prefix apps/desktop run dist:mac",
    "release:win": "npm run build && npm --prefix apps/desktop run dist:win",
    "release:linux": "npm run build && npm --prefix apps/desktop run dist:linux"
  }
}
```

**Full release flow:**
```bash
# macOS installer (.dmg)
npm run release:mac

# Windows installer (.exe via NSIS)
npm run release:win

# Linux installers (.AppImage + .deb + .rpm)
npm run release:linux
```

Output goes to `dist-release/`:
```
dist-release/
├── Turner Studio-1.0.0.dmg                   (macOS)
├── Turner Studio-1.0.0-arm64.dmg             (macOS Apple Silicon)
├── Turner Studio Setup 1.0.0.exe             (Windows NSIS installer)
├── Turner Studio 1.0.0.exe                   (Windows portable)
├── Turner Studio-1.0.0.AppImage              (Linux universal)
├── turner-studio_1.0.0_amd64.deb             (Debian/Ubuntu)
└── turner-studio-1.0.0.x86_64.rpm            (Fedora/RHEL)
```

---

## 4. Platform-Specific Notes

### 4.1 macOS

**Architectures:**
- **Intel (x64):** Standard Mac apps
- **Apple Silicon (arm64):** Runs natively on M-series chips
- **Universal binary:** Set `arch: [x64, arm64]` in electron-builder config. Produces a single `.dmg` that runs natively on both architectures (~2× file size).

**To build for Apple Silicon on Intel Mac:**
```bash
arch -arm64 npm run release:mac
```

**Minimum macOS version:** Electron 37 requires macOS 11 (Big Sur) or later for the packaged app.

**Gatekeeper:** Without code signing, users see "unidentified developer" warning. They must right-click → Open to bypass it. Code signing and notarization eliminates this.

---

### 4.2 Windows

**Architecture:** 64-bit (x64) only. 32-bit Windows is not supported.

**NSIS Installer Options (configured in `electron-builder.yml`):**
- `oneClick: false` → shows install wizard (recommended for first-time installs)
- `allowToChangeInstallationDirectory: true` → user can choose install path

**Windows Defender SmartScreen:** Without an EV certificate, Windows displays a SmartScreen warning on first run. An Extended Validation (EV) code signing certificate eliminates this immediately. An OV (Organisation Validation) certificate reduces warnings after the app builds reputation.

**Cross-compilation:** Building Windows installers from macOS requires Wine and `mono` (for NSIS). Alternatively, use a Windows CI runner.

```bash
# macOS → Windows (requires Wine):
brew install --cask wine-stable
npm run release:win
```

---

### 4.3 Linux

**AppImage** (recommended for distribution):
- Self-contained, runs on any modern Linux distro
- No installation required — mark as executable and run
- `chmod +x "Turner Studio-1.0.0.AppImage" && ./"Turner Studio-1.0.0.AppImage"`

**Debian/Ubuntu (`.deb`):**
```bash
sudo dpkg -i turner-studio_1.0.0_amd64.deb
```

**Fedora/RHEL (`.rpm`):**
```bash
sudo rpm -i turner-studio-1.0.0.x86_64.rpm
# or
sudo dnf install turner-studio-1.0.0.x86_64.rpm
```

**Desktop notifications on Linux:** Requires `libnotify`. Install if missing:
```bash
sudo apt install libnotify-bin       # Debian/Ubuntu
sudo dnf install libnotify           # Fedora
```

---

## 5. Code Signing

### 5.1 macOS Signing & Notarization

#### Step 1: Obtain a Certificate

1. Enroll in the [Apple Developer Program](https://developer.apple.com/programs/) ($99/year)
2. Go to Certificates, Identifiers & Profiles → Certificates
3. Create a **Developer ID Application** certificate
4. Download and install in your Keychain

#### Step 2: Configure electron-builder

```yaml
# electron-builder.yml
mac:
  identity: "Developer ID Application: Your Name (TEAM_ID)"
  hardenedRuntime: true
  notarize: true
```

Set environment variables (never commit these):
```bash
export APPLE_ID="your@apple.id"
export APPLE_APP_SPECIFIC_PASSWORD="xxxx-xxxx-xxxx-xxxx"
export APPLE_TEAM_ID="YOURTEAMID"
```

Or use a `.env` file at the root (add to `.gitignore`):
```
APPLE_ID=your@apple.id
APPLE_APP_SPECIFIC_PASSWORD=xxxx-xxxx-xxxx-xxxx
APPLE_TEAM_ID=YOURTEAMID
```

#### Step 3: Build & Notarize

```bash
npm run release:mac
```

electron-builder handles:
1. Code signing with your Developer ID certificate
2. Uploading to Apple's notarization service
3. Stapling the notarization ticket to the `.dmg`

Notarization typically takes 1–5 minutes.

#### Verify Notarization

```bash
spctl --assess --verbose "Turner Studio.app"
# → Turner Studio.app: accepted (source=Notarized Developer ID)

xcrun stapler validate "Turner Studio-1.0.0.dmg"
# → The staple and validate action worked!
```

---

### 5.2 Windows Code Signing

#### Option A: EV Certificate (recommended)

EV certificates eliminate SmartScreen warnings immediately.

1. Obtain EV certificate from a trusted CA (DigiCert, Sectigo, GlobalSign)
2. Store the `.pfx` file securely
3. Configure electron-builder:

```yaml
# electron-builder.yml
win:
  certificateFile: path/to/certificate.pfx
  certificatePassword: ${env.CSC_KEY_PASSWORD}
```

```bash
export CSC_KEY_PASSWORD="your-pfx-password"
npm run release:win
```

#### Option B: Azure Trusted Signing (cloud HSM)

```bash
npm install --save-dev @electron/windows-sign
```

Refer to [Microsoft's Azure Trusted Signing docs](https://learn.microsoft.com/en-us/azure/trusted-signing/).

#### Verify Windows Signature

```powershell
Get-AuthenticodeSignature "Turner Studio Setup 1.0.0.exe" | Select-Object Status, SignerCertificate
```

---

## 6. FFmpeg Binary Handling

Turner uses `ffmpeg-static` which bundles a pre-compiled FFmpeg binary. No system FFmpeg is required.

### Binary Location (after npm install)

```
packages/media-engine/node_modules/ffmpeg-static/
├── ffmpeg          (macOS/Linux, ~60 MB)
└── ffmpeg.exe      (Windows, ~80 MB)
```

### electron-builder Inclusion

The FFmpeg binary is inside `node_modules` and is automatically included when electron-builder copies `node_modules/**/*`. **No extra configuration is needed.**

### macOS Notarization & FFmpeg

The bundled FFmpeg binary must be signed and notarized along with the app. electron-builder handles this automatically when using the `Developer ID Application` identity with hardened runtime.

If notarization fails with "binary not signed":
```yaml
# electron-builder.yml
afterSign: scripts/notarize.js   # Custom notarization hook if needed
```

### Verifying FFmpeg is Bundled

After building, inspect the app package:

```bash
# macOS
ls "dist-release/mac-arm64/Turner Studio.app/Contents/Resources/app/node_modules/ffmpeg-static/"

# Windows (after NSIS install)
ls "C:\Users\<user>\AppData\Local\Programs\Turner Studio\resources\app\node_modules\ffmpeg-static\"
```

---

## 7. Settings File Location

At runtime, Turner stores user settings in the Electron user-data directory:

| Platform | Path |
|---|---|
| macOS | `~/Library/Application Support/Turner Studio/settings.json` |
| Windows | `%APPDATA%\Turner Studio\settings.json` |
| Linux | `~/.config/Turner Studio/settings.json` |

### Settings Migration

Settings are automatically migrated on first launch when the schema version changes. The migration is handled by `packages/persistence/src/migrate.ts`.

If settings become corrupted, delete the file — Turner will recreate it with defaults on next launch:

```bash
# macOS
rm ~/Library/Application\ Support/Turner\ Studio/settings.json

# Windows (PowerShell)
Remove-Item "$env:APPDATA\Turner Studio\settings.json"

# Linux
rm ~/.config/Turner\ Studio/settings.json
```

---

## 8. Environment Variables Reference

| Variable | Used In | Value in Dev | Value in Production |
|---|---|---|---|
| `TURNER_RENDERER_URL` | `apps/desktop/src/main/window.ts` | `http://127.0.0.1:5173` | Not set (loads from file) |
| `APPLE_ID` | electron-builder (macOS notarization) | Not required | Apple ID email |
| `APPLE_APP_SPECIFIC_PASSWORD` | electron-builder (macOS notarization) | Not required | App-specific password |
| `APPLE_TEAM_ID` | electron-builder (macOS notarization) | Not required | 10-character team ID |
| `CSC_KEY_PASSWORD` | electron-builder (Windows signing) | Not required | PFX certificate password |
| `CSC_LINK` | electron-builder (Windows signing) | Not required | Path to `.pfx` file |

> **Security:** Never commit signing credentials. Use CI environment secrets or a `.env` file that is listed in `.gitignore`.

---

## 9. Distribution Checklist

Use this checklist before each release:

### Pre-Build

- [ ] All TypeScript errors resolved (`npm run typecheck`)
- [ ] All tests pass (`npm test`)
- [ ] Version bumped in root `package.json` and `apps/desktop/package.json`
- [ ] `CHANGELOG` updated (if maintained)
- [ ] Signing certificates are valid and not expiring within 30 days
- [ ] Build assets present: `icon.icns`, `icon.ico`, `icon.png`, `entitlements.mac.plist`

### Build

- [ ] `npm install` run on clean checkout
- [ ] `npm run build` completes without errors
- [ ] `apps/renderer/dist/index.html` exists
- [ ] `apps/desktop/dist/preload/bridge.cjs` exists
- [ ] electron-builder config file is correct

### macOS

- [ ] `.dmg` opens correctly (double-click to mount)
- [ ] App launches without Gatekeeper warning
- [ ] `spctl --assess` passes for the `.app` bundle
- [ ] Drag-to-Applications works in the DMG
- [ ] FFmpeg conversion works on a test file
- [ ] Settings persist across app restarts
- [ ] Desktop notifications appear on conversion complete

### Windows

- [ ] NSIS installer runs without SmartScreen warning (EV cert)
- [ ] App appears in Programs and Features / Apps & Features
- [ ] Desktop shortcut created
- [ ] App launches from Start Menu
- [ ] FFmpeg conversion works on a test file
- [ ] Settings persist at `%APPDATA%\Turner Studio\settings.json`

### Linux

- [ ] AppImage runs after `chmod +x`
- [ ] `.deb` installs via `dpkg -i`
- [ ] App appears in application menu
- [ ] FFmpeg conversion works on a test file
- [ ] Desktop notifications work (libnotify)

---

## 10. Manual Distribution (No electron-builder)

If electron-builder is not used, you can manually distribute the app using Electron's built-in packaging tools or ship a directory bundle.

### Step 1: Build Everything

```bash
npm run build
```

### Step 2: Prepare the App Directory

Create a directory with the following structure:

```
turner-app/
├── package.json          ← apps/desktop/package.json (only "main" and "dependencies")
├── dist/                 ← copy of apps/desktop/dist/
│   ├── main/
│   │   └── index.js
│   ├── queue/
│   ├── adapters/
│   └── preload/
│       └── bridge.cjs    ← required
└── node_modules/         ← production deps only (no devDependencies)
    ├── electron/
    ├── ffmpeg-static/
    └── @turner/          ← linked packages (or copied)
```

**Install production deps only:**
```bash
cd apps/desktop
npm install --production
```

### Step 3: Place the Renderer

electron-builder normally puts the renderer in `resources/`. For manual distribution, set the correct path in `window.ts`:

```typescript
// apps/desktop/src/main/window.ts
const rendererIndexPath = path.resolve(__dirname, '../../../renderer/dist/index.html');
```

Copy `apps/renderer/dist/` to the correct relative path from `dist/main/`.

### Step 4: Launch with Electron

```bash
npx electron turner-app/dist/main/index.js
```

For distribution, use `@electron/packager` to wrap this into a native app:

```bash
npm install --save-dev @electron/packager

npx electron-packager turner-app "Turner Studio" \
  --platform=darwin \
  --arch=arm64 \
  --out=release \
  --icon=build-assets/icon.icns \
  --overwrite
```

---

## 11. Troubleshooting Builds

### `apps/renderer/dist/index.html` not found

**Symptom:** App launches to a blank white screen in production.

**Fix:** Run `npm run build:renderer` before packaging. Verify the file exists at `apps/renderer/dist/index.html`.

---

### `bridge.cjs` not found / preload error

**Symptom:** Console error: `Unable to load preload script: .../bridge.cjs`

**Fix:** The `build:desktop` step must copy `bridge.cjs` to `dist/preload/`. The copy command is in `apps/desktop/package.json`:
```json
"build": "tsc -p tsconfig.json && node -e \"const fs=require('fs');...\""
```

Check `apps/desktop/dist/preload/bridge.cjs` exists after build.

---

### `window.turner is undefined` toast on app launch

**Symptom:** The renderer shows a toast: "Turner engine is not responding."

**Causes:**
1. Preload script failed to load (see above)
2. Context isolation was accidentally set to `false`
3. Running renderer outside Electron (e.g., in a regular browser)

**Fix:** Check DevTools Console for `Uncaught Error` or `Failed to execute 'exposeInMainWorld'` messages. Verify `bridge.cjs` is a valid CommonJS file.

---

### FFmpeg binary missing / not executable

**Symptom:** Conversion fails immediately with "FFmpeg binary is not available."

**Fix:**
```bash
# Check the binary exists
ls node_modules/ffmpeg-static/

# macOS/Linux — ensure it's executable
chmod +x node_modules/ffmpeg-static/ffmpeg

# Verify it runs
./node_modules/ffmpeg-static/ffmpeg -version
```

On macOS, if the binary is quarantined:
```bash
xattr -d com.apple.quarantine node_modules/ffmpeg-static/ffmpeg
```

---

### TypeScript build errors after adding a dependency

**Symptom:** `tsc` fails with "Cannot find module '@turner/...'".

**Fix:** The packages must be built in order before the apps:
```bash
npm run build:packages   # build all packages first
npm run build:renderer
npm run build:desktop
```

---

### electron-builder: "Application entry file does not exist"

**Symptom:** `Error: Application entry file "dist/main/index.js" does not exist`

**Fix:** `npm run build:desktop` must run before electron-builder. Check `apps/desktop/dist/main/index.js` exists.

---

### macOS Notarization timeout

**Symptom:** `Error: Notarization failed — Timeout`

**Fix:** Apple's notarization service can be slow. Try again. If it persists, check [Apple's system status](https://developer.apple.com/system-status/).

---

### Windows NSIS: "The installer you are trying to use is corrupt or incomplete"

**Symptom:** Windows shows error when running the installer.

**Fix:** Re-download the installer (the download may have been corrupted). If building — ensure the build machine has enough disk space for the full installer.

---

### Linux AppImage: "Permission denied" on launch

**Symptom:** AppImage won't launch.

**Fix:**
```bash
chmod +x "Turner Studio-1.0.0.AppImage"
./"Turner Studio-1.0.0.AppImage"
```

---

### Large installer size

**Symptom:** Installer is 200+ MB.

**Cause:** `node_modules` contains development dependencies.

**Fix:** Add exclusions to electron-builder config:
```yaml
files:
  - dist/**/*
  - node_modules/**/*
  - "!node_modules/.cache/**"
  - "!node_modules/**/{test,tests,__tests__}/**"
  - "!node_modules/**/*.{md,ts,map}"
  - "!node_modules/**/README*"
```

Also consider running `npm install --production` before packaging.
