/**
 * electron-builder configuration for Turner Studio
 *
 * This file is CommonJS (.cjs) because electron-builder loads it with require().
 * The apps/desktop package itself is ESM ("type": "module"), so we keep this
 * config in a separate .cjs file to avoid the ESM/CJS conflict.
 *
 * HOW PACKAGING WORKS:
 * 1. electron-builder reads this config.
 * 2. It collects everything listed in `files` (compiled main process + node_modules).
 * 3. It copies apps/renderer/dist/ → Resources/renderer/ via `extraResources`.
 * 4. It wraps all of this with the Electron runtime.
 * 5. It produces a platform-native installer (.dmg on Mac, .exe on Windows).
 *
 * SIGNING:
 * - macOS: reads CSC_LINK (base64 .p12) + CSC_KEY_PASSWORD from env.
 *          After signing, runs the afterSign hook to notarize with Apple.
 * - Windows: reads WIN_CSC_LINK + WIN_CSC_KEY_PASSWORD from env.
 *            Without these, it will produce an unsigned build with a SmartScreen warning.
 *
 * AUTO-UPDATE:
 * - The `publish` block tells electron-updater where to find new versions.
 * - electron-builder uploads latest-mac.yml / latest.yml to the GitHub Release.
 * - Your app calls autoUpdater.checkForUpdatesAndNotify() on launch.
 */

/** @type {import('electron-builder').Configuration} */
const config = {
  appId: 'com.turner.studio',
  productName: 'Turner Studio',
  copyright: 'Copyright © 2026 Turner Studio',

  // ── Output ──────────────────────────────────────────────────────────────────
  // Where the finished installers are written.
  // `buildResources` is where electron-builder looks for icons and other assets.
  directories: {
    output: 'release',
    buildResources: 'assets'
  },

  // ── What gets bundled ────────────────────────────────────────────────────────
  // `files` describes what to include from the apps/desktop directory.
  // node_modules here includes ffmpeg-static (the FFmpeg binary), electron-updater, etc.
  // We exclude test files, changelogs, and source maps to keep the bundle lean.
  files: [
    'dist/**/*',          // compiled main process + preload
    'node_modules/**/*',  // everything including ffmpeg-static
    '!node_modules/*/{CHANGELOG.md,README.md,readme.md,CHANGES,changelog.md}',
    '!node_modules/*/{test,__tests__,tests,powered-test,example,examples,fixtures}',
    '!node_modules/.cache',
    '!node_modules/.bin',
    '!**/*.map',          // strip source maps from production bundle
    '!**/*.ts'            // strip TypeScript source files
  ],

  // ── Renderer (extraResources) ─────────────────────────────────────────────────
  // The renderer is a Vite-built SPA. It is NOT in apps/desktop/node_modules.
  // `extraResources` copies it from apps/renderer/dist/ into the packaged app's
  // Resources/ folder, where window.ts reads it via process.resourcesPath.
  //
  // On macOS: Turner Studio.app/Contents/Resources/renderer/index.html
  // On Windows: resources/renderer/index.html (next to the .exe)
  extraResources: [
    {
      from: '../../apps/renderer/dist',  // relative to apps/desktop/
      to: 'renderer',                    // → Resources/renderer/
      filter: ['**/*']
    }
  ],

  // ── macOS ─────────────────────────────────────────────────────────────────────
  mac: {
    category: 'public.app-category.video',
    icon: 'assets/icon.icns',            // must be .icns format
    hardenedRuntime: true,               // required for notarization
    gatekeeperAssess: false,             // electron-builder handles this
    entitlements: 'assets/entitlements.mac.plist',
    entitlementsInherit: 'assets/entitlements.mac.plist',
    // Build for both Apple Silicon and Intel in one go
    target: [
      { target: 'dmg', arch: ['arm64', 'x64'] },
      { target: 'zip', arch: ['arm64', 'x64'] }  // zip is needed for auto-updater
    ]
  },

  // DMG window appearance (the drag-to-Applications installer window)
  dmg: {
    title: 'Turner Studio ${version}',
    icon: 'assets/icon.icns',
    iconSize: 80,
    contents: [
      { x: 130, y: 220 },                               // app icon position
      { x: 410, y: 220, type: 'link', path: '/Applications' }  // Applications shortcut
    ],
    window: { width: 540, height: 380 }
  },

  // ── Windows ──────────────────────────────────────────────────────────────────
  win: {
    icon: 'assets/icon.ico',             // must be .ico format
    target: [
      { target: 'nsis', arch: ['x64'] } // NSIS = classic Windows installer
    ],
    // These are read from env vars, set as GitHub Actions secrets.
    // If not set, electron-builder will build unsigned (warns but doesn't fail).
    certificateFile: process.env.WIN_CSC_LINK,
    certificatePassword: process.env.WIN_CSC_KEY_PASSWORD
  },

  // NSIS installer options (the Windows Setup wizard)
  nsis: {
    oneClick: false,                          // show installer wizard, don't silently install
    allowToChangeInstallationDirectory: true, // let user pick install path
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'Turner Studio',
    installerIcon: 'assets/icon.ico',
    uninstallerIcon: 'assets/icon.ico',
    installerHeader: 'assets/icon.ico',
    license: null                             // set to 'assets/LICENSE.txt' if you have one
  },

  // ── Linux ─────────────────────────────────────────────────────────────────────
  linux: {
    icon: 'assets/icon.png',
    category: 'Video',
    target: ['AppImage', 'deb']
  },

  // ── Auto-update publish target ────────────────────────────────────────────────
  // electron-builder uploads these files to a GitHub Release:
  //   - Turner Studio-{version}-arm64.dmg
  //   - Turner Studio-{version}-arm64-mac.zip
  //   - Turner Studio-{version}-x64.dmg
  //   - Turner Studio-{version}-x64-mac.zip
  //   - latest-mac.yml        ← electron-updater reads this to detect new versions
  //   - Turner Studio Setup {version}.exe
  //   - latest.yml            ← electron-updater reads this on Windows
  //
  // Replace owner/repo with your actual GitHub details.
  publish: {
    provider: 'github',
    owner: 'YOUR_GITHUB_USERNAME',   // ← replace this
    repo: 'turner',                  // ← replace this with your repo name
    releaseType: 'release'
  },

  // ── Notarization hook (macOS only) ────────────────────────────────────────────
  // This runs AFTER the app is signed but BEFORE the DMG is created.
  // It submits the .app to Apple's notarization service.
  // The actual implementation is in scripts/notarize.cjs.
  // Remove this line if you don't have Apple Developer credentials yet.
  afterSign: 'scripts/notarize.cjs'
};

module.exports = config;
