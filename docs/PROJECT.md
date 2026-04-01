# Turner Studio — Project Documentation

> **Version:** 1.0.0
> **Stack:** Electron 37 · React 19 · TypeScript 5 · Vite · FFmpeg
> **Platform:** macOS · Windows · Linux

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Repository Structure](#2-repository-structure)
3. [Architecture Overview](#3-architecture-overview)
4. [Package Reference](#4-package-reference)
   - 4.1 [@turner/shared](#41-turnerShared)
   - 4.2 [@turner/contracts](#42-turnercontracts)
   - 4.3 [@turner/domain](#43-turnerdomain)
   - 4.4 [@turner/media-engine](#44-turnermedia-engine)
   - 4.5 [@turner/persistence](#45-turnerpersistence)
   - 4.6 [@turner/observability](#46-turnerobservability)
5. [Application: Desktop (Electron Main)](#5-application-desktop-electron-main)
   - 5.1 [Bootstrapping](#51-bootstrapping)
   - 5.2 [Window Creation](#52-window-creation)
   - 5.3 [IPC Handlers](#53-ipc-handlers)
   - 5.4 [Conversion Queue](#54-conversion-queue)
   - 5.5 [Preload / Context Bridge](#55-preload--context-bridge)
6. [Application: Renderer (React UI)](#6-application-renderer-react-ui)
   - 6.1 [Entry Point](#61-entry-point)
   - 6.2 [State Management](#62-state-management)
   - 6.3 [Component Tree](#63-component-tree)
   - 6.4 [Feature Modules](#64-feature-modules)
   - 6.5 [Styles & Design System](#65-styles--design-system)
7. [Data Flow & IPC Communication](#7-data-flow--ipc-communication)
   - 7.1 [Command Flow (Renderer → Main)](#71-command-flow-renderer--main)
   - 7.2 [Event Flow (Main → Renderer)](#72-event-flow-main--renderer)
   - 7.3 [Job Lifecycle](#73-job-lifecycle)
8. [Validation Layers](#8-validation-layers)
9. [Error Handling Strategy](#9-error-handling-strategy)
10. [Settings System](#10-settings-system)
11. [FFmpeg Integration](#11-ffmpeg-integration)
12. [Type System & Contracts](#12-type-system--contracts)
13. [Development Setup](#13-development-setup)
14. [Testing](#14-testing)
15. [Environment Variables](#15-environment-variables)
16. [Known Constraints & Limitations](#16-known-constraints--limitations)

---

## 1. Project Overview

**Turner Studio** is a native desktop application that converts `.webm` video files to `.mp4` using the H.264/AAC codec pipeline via FFmpeg. It is designed for fast, local, batch-capable conversion without any cloud dependency.

### Core Capabilities

| Capability | Detail |
|---|---|
| **Input format** | `.webm` (VP8, VP9, AV1 streams) |
| **Output format** | `.mp4` (H.264 video + AAC audio) |
| **Batch conversion** | Multiple files queued and processed sequentially |
| **Live progress** | Real-time percent, FPS, speed multiplier, ETA |
| **Job control** | Cancel individual jobs at any point |
| **Output naming** | Rename output file before conversion begins |
| **Completion alerts** | Native desktop notifications on success/failure |
| **Settings** | Output folder, quality (CRF), encoder speed, audio bitrate, keep-original, timeout |

### Technology Choices

| Layer | Choice | Reason |
|---|---|---|
| Desktop shell | Electron 37 | Cross-platform native APIs (file dialogs, notifications, shell) |
| UI framework | React 19 + Vite | Fast iterative development, component model |
| Language | TypeScript 5 (strict) | End-to-end type safety across IPC boundary |
| Build tool | Vite (renderer) + tsc (packages/desktop) | Fast HMR in dev, clean ESM output |
| Media engine | FFmpeg via ffmpeg-static | Battle-tested, no runtime dependency, bundled binary |
| Validation | Zod | Runtime schema validation at IPC entry points |
| State management | useReducer (React) | Predictable unidirectional data flow, no external library |

---

## 2. Repository Structure

Turner is an **npm workspaces monorepo**. All packages and apps share a single `node_modules` and a root `package.json`.

```
Turner/
├── apps/
│   ├── renderer/               # React UI (Vite, runs in Electron BrowserWindow)
│   │   ├── src/
│   │   │   ├── app/            # Root components, controller, bridge, styles
│   │   │   ├── features/       # dashboard, jobs, settings, shell
│   │   │   ├── state/          # Reducer, types, initial state
│   │   │   └── main.tsx        # React entry point
│   │   ├── vite.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── desktop/                # Electron main process
│       ├── src/
│       │   ├── main/           # App bootstrap, window, IPC registration
│       │   ├── queue/          # ConversionQueue, job preparation, helpers
│       │   ├── adapters/       # Shell operations, notifications
│       │   └── preload/        # Context bridge (bridge.cjs + index.ts)
│       ├── tsconfig.json
│       └── package.json
│
├── packages/
│   ├── shared/                 # Error types, Result<T>, constants
│   ├── contracts/              # IPC types, channel names, Zod schemas
│   ├── domain/                 # Business rules: validation, output paths, job creation
│   ├── media-engine/           # FFmpeg process management, progress parsing
│   ├── persistence/            # Settings JSON storage, migration, atomic writes
│   └── observability/          # Logger interface, timing utilities
│
├── tests/                      # Vitest integration tests
├── tsconfig.base.json          # Shared TypeScript compiler options
├── tsconfig.json               # Root TypeScript project (type-checking only)
├── vitest.config.ts            # Test runner configuration
└── package.json                # Root scripts, workspace declarations
```

### Workspace Graph

```
renderer  ──────────────────────────────────── contracts, shared
desktop   ──── contracts, domain, media-engine, persistence, observability, shared
contracts ──── shared
domain    ──── shared
media-engine ─ contracts, shared
persistence ── contracts, shared
observability ─ shared
shared    ──── (no internal deps)
```

> **Rule:** `shared` has no internal deps. Packages never depend on `apps/`. The renderer only depends on `contracts` and `shared` — it never imports from `desktop` or any backend-only package.

---

## 3. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Electron Process                      │
│                                                          │
│  ┌───────────────────────────────────────────────────┐  │
│  │              BrowserWindow (Renderer)              │  │
│  │                                                    │  │
│  │  React 19 UI                                       │  │
│  │  ├── useTurnerController (useReducer + IPC glue)   │  │
│  │  ├── AppWorkspaces (view router)                   │  │
│  │  ├── ConverterWorkspace / QueueWorkspace /         │  │
│  │  │   LibraryWorkspace / SettingsPanel              │  │
│  │  └── window.turner  ◄─── contextBridge             │  │
│  └───────────────────────────────────────────────────┘  │
│                       │   ▲                              │
│              IPC invoke│   │ IPC send (events)           │
│                       ▼   │                              │
│  ┌───────────────────────────────────────────────────┐  │
│  │                  Main Process                      │  │
│  │                                                    │  │
│  │  ipcMain.handle (ipc.ts)                          │  │
│  │  ├── ConversionQueue                              │  │
│  │  │   └── FfmpegMediaEngine                        │  │
│  │  │       └── spawn(ffmpeg, args) ──► FFmpeg proc  │  │
│  │  ├── JsonSettingsRepository                       │  │
│  │  └── Shell adapters (open, rename, pick)          │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

The **renderer** is a completely isolated React app. It communicates with the **main process** exclusively through the `window.turner` API exposed by the preload script. No Node.js APIs are available in the renderer.

---

## 4. Package Reference

### 4.1 `@turner/shared`

**Purpose:** Foundation layer. Contains types and utilities with zero external dependencies used by every other package.

| Export | Description |
|---|---|
| `AppError` | `{ code: AppErrorCode; message: string; details?: unknown; cause?: unknown }` |
| `AppErrorCode` | `'VALIDATION_ERROR' \| 'IO_ERROR' \| 'FFMPEG_ERROR' \| 'PERMISSION_ERROR' \| 'CANCELLED' \| 'UNKNOWN'` |
| `createAppError(code, message, opts?)` | Factory that builds a typed `AppError` |
| `Result<T>` | `Ok<T> \| Err` — Railway-oriented result type |
| `ok(value)` | Constructs `Ok<T>` |
| `err(appError)` | Constructs `Err` |
| `isOk(result)` | Type-narrowing predicate |
| `isErr(result)` | Type-narrowing predicate |
| `FILE_EXTENSIONS` | `{ WEBM: '.webm', MP4: '.mp4' }` |
| `CONVERSION_DEFAULTS` | CRF (23), preset ('medium'), audio bitrate ('128k'), codec names, process priority (nice value), timeouts |
| `CONVERSION_LIMITS` | CRF range (1–40), max batch size, debounce write delay |

**Design note:** `Result<T>` eliminates thrown exceptions in business logic. All domain functions return `Result<T>` and callers must handle the `Err` branch explicitly.

---

### 4.2 `@turner/contracts`

**Purpose:** Single source of truth for the IPC boundary. Defines every type, channel name, and Zod schema shared between renderer and desktop.

#### IPC Channel Names (`channels.ts`)

```typescript
IPC_COMMANDS = {
  CONVERTER_ENQUEUE:       'converter.enqueue',
  CONVERTER_CANCEL:        'converter.cancel',
  CONVERTER_SET_OUTPUT_NAME: 'converter.setOutputName',
  SETTINGS_GET:            'settings.get',
  SETTINGS_UPDATE:         'settings.update',
  SHELL_OPEN_FILE:         'shell.openFile',
  SHELL_SHOW_IN_FOLDER:    'shell.showInFolder',
  SHELL_RENAME_FILE:       'shell.renameFile',
  SHELL_PICK_WEBM_FILES:   'shell.pickWebmFiles',
  SHELL_PICK_OUTPUT_FOLDER:'shell.pickOutputFolder',
  SHELL_GET_FILE_SIZE:     'shell.getFileSize',
}

IPC_EVENTS = {
  CONVERTER_PROGRESS:       'converter.progress',
  CONVERTER_STATUS_CHANGED: 'converter.statusChanged',
}
```

#### Key Types (`types.ts`)

```typescript
type TurnerApi = {
  converter: {
    enqueue(request: ConvertRequest): Promise<string[]>;
    cancel(jobId: string): Promise<void>;
    onProgress(listener): Unsubscribe;
    onStatusChanged(listener): Unsubscribe;
  };
  settings: {
    get(): Promise<AppSettings>;
    update(patch: AppSettingsPatch): Promise<AppSettings>;
  };
  shell: {
    openFile(targetPath: string): Promise<void>;
    showInFolder(targetPath: string): Promise<void>;
    renameFile(targetPath: string, nextName: string): Promise<string>;
    pickWebmFiles(): Promise<string[]>;
    pickOutputFolder(): Promise<string | null>;
    getFileSize(filePath: string): Promise<number | null>;
  };
};

type AppSettings = {
  schemaVersion: number;
  outputDir?: string;
  crf: number;           // 1–40, default 23
  preset: Preset;        // 'ultrafast'|'veryfast'|'fast'|'medium'|'slow'
  audioBitrate: string;  // e.g. '128k'
  keepOriginal: boolean;
  notifyOnCompletion: boolean;
  timeoutMs: number;
};
```

#### Zod Schemas (`schemas.ts`)

All IPC inputs are validated with Zod on the main process before reaching business logic. Schemas include `convertRequestSchema`, `appSettingsPatchSchema`, `jobIdSchema`, `outputNameSchema`.

---

### 4.3 `@turner/domain`

**Purpose:** Pure business rules with no Electron or UI dependencies.

| Export | Signature | Description |
|---|---|---|
| `resolveConvertOptions` | `(partial) → Result<ConvertOptions>` | Fills defaults, validates CRF range and preset |
| `validateWebmInputPath` | `(path) → Result<string>` | Checks `.webm` extension |
| `dedupeInputPaths` | `(paths[]) → string[]` | Removes duplicate paths |
| `ensureDifferentInputAndOutput` | `(in, out) → Result<void>` | Guards against overwrite |
| `resolveOutputPath` | `({ inputPath, outputDir, outputFileBaseName, exists }) → Result<string>` | Generates safe output path, up to 10,000 collision retries |
| `createWaitingJob` | `(inputPath, outputPath) → ConvertJob` | Creates a `ConvertJob` with UUID, `waiting` status, timestamps |

**`resolveOutputPath` collision strategy:**
1. Try `<name>.mp4`
2. Try `<name> (1).mp4`, `<name> (2).mp4` … `<name> (9999).mp4`
3. If all taken → returns `IO_ERROR`

---

### 4.4 `@turner/media-engine`

**Purpose:** FFmpeg process lifecycle management — spawn, monitor progress, handle cancellation, timeout, and failure mapping.

#### `FfmpegMediaEngine`

Implements `MediaEngineRunner` interface:

```typescript
interface MediaEngineRunner {
  start(params: MediaEngineStartParams): Result<MediaEngineTask>;
}

interface MediaEngineTask {
  cancel(): void;
  done: Promise<Result<void>>;
}
```

**Spawn configuration:**
```
stdio: ['ignore', 'ignore', 'pipe']   // only stderr captured
```

**FFmpeg argument construction (`ffmpeg-command.ts`):**
```
-i <input.webm>
-c:v libx264
-preset <medium>
-crf <23>
-pix_fmt yuv420p
-c:a aac
-b:a <128k>
-movflags +faststart
-y
<output.mp4>
```

**Progress parsing (`progress.ts`):**
- Duration extracted from early stderr line: `Duration: HH:MM:SS.ms`
- Per-frame progress extracted from `time=HH:MM:SS.ms fps=N speed=Nx`
- Percent = `(parsedTime / totalDuration) * 100`

**Process priority:** Sets `nice` value (19 on Unix) to avoid starving UI thread during conversion.

**Failure mapping (`ffmpeg-errors.ts`):**

| Stderr pattern | AppErrorCode |
|---|---|
| `no space left on device` | `IO_ERROR` |
| `permission denied` | `PERMISSION_ERROR` |
| `stream map matches no streams` | `VALIDATION_ERROR` |
| Timeout (SIGKILL) | `FFMPEG_ERROR` (timed out) |
| User cancel (SIGTERM) | `CANCELLED` |
| exit code ≠ 0 | `FFMPEG_ERROR` |

---

### 4.5 `@turner/persistence`

**Purpose:** Read/write application settings to a JSON file on disk with durability guarantees.

#### `JsonSettingsRepository`

```typescript
class JsonSettingsRepository {
  constructor(filePath: string, debounceMs?: number) {}
  get(): Promise<Result<AppSettings>>;
  update(patch: AppSettingsPatch): Promise<Result<AppSettings>>;
  flush(): Promise<void>;  // Force immediate write (called on app quit)
}
```

**Behaviour:**
- **Cache-first:** `get()` returns cached value after first read
- **Debounced atomic writes:** Updates are buffered for 250 ms, then written to a temp file and renamed atomically (prevents corruption on crash)
- **Migration:** Reads old schema versions, applies `migrateSettings()` before returning
- **File location:** `app.getPath('userData')/settings.json`
  - macOS: `~/Library/Application Support/Turner Studio/settings.json`
  - Windows: `%APPDATA%\Turner Studio\settings.json`
  - Linux: `~/.config/Turner Studio/settings.json`

#### `migrateSettings`

Handles schema drift between versions:
- Renames `qualityCrf` → `crf` (v0 → v1)
- Returns `DEFAULT_APP_SETTINGS` if JSON is unparseable

---

### 4.6 `@turner/observability`

**Purpose:** Lightweight structured logging and timing utilities.

```typescript
interface Logger {
  debug(message: string, meta?: Record<string, unknown>): void;
  info(message: string, meta?: Record<string, unknown>): void;
  warn(message: string, meta?: Record<string, unknown>): void;
  error(message: string, meta?: Record<string, unknown>): void;
}
```

- `createLogger()` → returns a `Logger` that writes JSON to `console`
- `measureAsync<T>(fn)` → `{ value: T; durationMs: number }`
- `mapUnknownError(e)` → coerces any thrown value to an `AppError`

Log format example:
```json
{ "level": "info", "message": "Queued conversion jobs", "count": 3, "ids": ["abc", "def", "ghi"], "timestamp": "2026-04-01T10:23:45.123Z" }
```

---

## 5. Application: Desktop (Electron Main)

### 5.1 Bootstrapping

**Entry:** `apps/desktop/src/main/index.ts`

```
app.whenReady()
  └── bootstrap()
        ├── createMainWindow()          → BrowserWindow
        ├── new JsonSettingsRepository()
        ├── new ConversionQueue(new FfmpegMediaEngine(), logger)
        └── registerIpcHandlers({ window, queue, settingsRepository, logger })

app on 'before-quit'
  ├── conversionQueue.shutdown()       → cancels active + pending jobs
  └── settingsRepository.flush()      → forces immediate settings write

app on 'window-all-closed'
  └── app.quit()  (skipped on macOS — standard Cmd+Q behaviour)
```

Windows-specific: `app.setAppUserModelId('com.turner.studio')` is required for taskbar notifications and jump lists on Windows.

---

### 5.2 Window Creation

**File:** `apps/desktop/src/main/window.ts`

| Property | Value |
|---|---|
| Default size | 1200 × 840 px |
| Minimum size | 960 × 640 px |
| Background colour | `#0f1220` (prevents white flash on load) |
| Menu bar | Auto-hidden |
| Context isolation | `true` |
| Node integration | `false` |
| Sandbox | `false` (required for fs access in preload) |
| Preload | `dist/preload/bridge.cjs` |

**Dev mode:** Loads `http://127.0.0.1:5173` (Vite dev server) when `TURNER_RENDERER_URL` env var is set.
**Production:** Loads `apps/renderer/dist/index.html` from the filesystem.

---

### 5.3 IPC Handlers

**File:** `apps/desktop/src/main/ipc.ts`

All handlers follow the same pattern:
1. Parse + validate input with Zod
2. Call business logic (queue, repository, shell adapter)
3. On failure — serialize `AppError` as JSON string inside an `Error` and throw
4. On success — return value

| IPC Command | Handler Action |
|---|---|
| `converter.enqueue` | Validates `ConvertRequest`, merges settings, calls `queue.enqueue()` |
| `converter.cancel` | Validates jobId, calls `queue.cancel()` |
| `settings.get` | Calls `settingsRepository.get()` |
| `settings.update` | Validates patch, calls `settingsRepository.update()`, updates `notifyOnCompletion` cache |
| `shell.openFile` | Checks file access, calls `shell.openPath()` |
| `shell.showInFolder` | Checks file access, calls `shell.showItemInFolder()` |
| `shell.renameFile` | Sanitizes name, checks source/dest, calls `fs.rename()` |
| `shell.pickWebmFiles` | Opens `dialog.showOpenDialog` with webm filter |
| `shell.pickOutputFolder` | Opens `dialog.showOpenDialog` for directory |
| `shell.getFileSize` | Calls `fs.stat(filePath).size`, returns `null` on error |

**Error serialization:**
```typescript
const toIpcError = (error: AppError): Error =>
  new Error(JSON.stringify(error));
// Renderer receives this and calls JSON.parse() in bridge-error.ts
```

---

### 5.4 Conversion Queue

**File:** `apps/desktop/src/queue/conversion-queue.ts`

`ConversionQueue` is a serial FIFO queue. Only one job converts at a time; the rest wait.

#### State

| Field | Type | Description |
|---|---|---|
| `jobs` | `Map<string, ConvertJob>` | All jobs by ID |
| `pendingJobIds` | `string[]` | FIFO queue of waiting job IDs |
| `optionsByJobId` | `Map<string, ConvertOptions>` | Options frozen at enqueue time |
| `activeTask` | `ActiveTask \| undefined` | Currently running FFmpeg task |
| `lastEtaByJobId` | `Map<string, number>` | Smoothed ETA per job |

#### `pump()` — the conversion loop

```
pump()
  ├─ Guard: if activeTask exists OR queue empty → return
  ├─ Shift next jobId from pendingJobIds
  ├─ Set job.status = 'converting', emit statusChanged
  ├─ mediaEngine.start() → Result<MediaEngineTask>
  │   ├─ FAIL → set status = 'failed', emit, pump() again
  │   └─ OK  → set activeTask
  ├─ await task.done
  │   ├─ OK → status = 'done', cleanup original if keepOriginal=false
  │   └─ ERR → status = 'cancelled' or 'failed'
  ├─ activeTask = undefined
  └─ pump() (recurse for next job)
```

#### ETA smoothing (`queue-helpers.ts`)

ETA is calculated from wall-clock elapsed time and progress percent, with fallback to FFmpeg's own `speed=` value. A rolling average is applied to prevent jitter.

---

### 5.5 Preload / Context Bridge

**File:** `apps/desktop/src/preload/index.ts` (TypeScript source)
**Compiled to:** `apps/desktop/dist/preload/bridge.cjs` (CommonJS, required by Electron)

```typescript
contextBridge.exposeInMainWorld('turner', api);
```

The preload runs in a restricted context between the Node.js main process and the renderer. It:
- Has access to `ipcRenderer` (to call main-process handlers)
- Has **no** access to the DOM
- Exposes a strongly-typed `window.turner` object matching the `TurnerApi` interface

The TypeScript declaration for `window.turner` is in `apps/renderer/src/types/global.d.ts`:
```typescript
declare global {
  interface Window {
    turner?: TurnerApi;
  }
}
```

---

## 6. Application: Renderer (React UI)

### 6.1 Entry Point

`apps/renderer/src/main.tsx` — mounts `<App />` into `#root`.

### 6.2 State Management

**File:** `apps/renderer/src/state/`

State is managed with React's `useReducer`. There is no external state library.

#### `AppState`

```typescript
type AppState = {
  settings: AppSettings;
  loadingSettings: boolean;
  isSettingsOpen: boolean;
  isEnqueueing: boolean;
  jobsById: Record<string, UiJob>;
  jobOrder: string[];
  appError: string | undefined;
};
```

#### `UiJob` — the central domain object in the renderer

```typescript
type UiJob = {
  jobId: string;
  inputPath: string;
  outputPath?: string;
  preferredOutputName?: string;   // User-set base name before conversion
  fileSizeBytes?: number;         // Loaded asynchronously after enqueue
  status: 'waiting' | 'converting' | 'done' | 'failed' | 'cancelled';
  progressPercent: number;
  fps?: number;
  speedMultiplier?: number;
  etaSeconds?: number;
  startedAt?: number;
  endedAt?: number;
  error?: AppError;
};
```

#### Action Types

| Action | Payload | Effect |
|---|---|---|
| `settingsLoaded` | `AppSettings` | Initialise settings from disk (on boot) |
| `settingsUpdated` | `AppSettings` | Replace settings after save |
| `jobsQueued` | `Array<{jobId, inputPath}>` | Add new `waiting` UiJob entries |
| `progress` | `{jobId, percent, fps, speedMultiplier, etaSeconds}` | Update active job progress |
| `statusChanged` | `ConvertStatusChangedEvent` | Transition job status |
| `outputRenamed` | `{previousPath, nextPath}` | Update job after file rename |
| `setPreferredOutputName` | `{jobId, name}` | Set pre-conversion output name |
| `jobFileSizeLoaded` | `{jobId, sizeBytes}` | Populate file size |
| `setEnqueueing` | `boolean` | Disable drop zone during IPC call |
| `setAppError` | `string \| undefined` | Show/clear toast notification |

#### `useTurnerController`

**File:** `apps/renderer/src/app/useTurnerController.ts`

The single orchestration hook consumed by `<App />`. Responsibilities:

- Bootstraps settings on mount via `useTurnerBridge`
- Subscribes to IPC progress/status events
- Exposes all user-action handlers (enqueue, cancel, rename, settings save, etc.)
- Derives computed values: `activeJob`, `recentProcessed`, `completedJobs`, `sessionStats`

---

### 6.3 Component Tree

```
<App>
├── <AppSidebar>         — Icon sidebar (Converter / Queue / Library / Settings)
├── <AppTopbar>          — View title and subtitle
├── <div.view-scroll>
│   └── <AppWorkspaces>  — View router
│       ├── [converter]  <ConverterWorkspace>
│       │   ├── <DropZone>
│       │   ├── <SessionStatsCard>
│       │   ├── <ActiveProcessPanel>
│       │   ├── <RecentProcessedTable>
│       │   └── <QueuePanel>         ← inline rename for waiting jobs
│       ├── [queue]      <QueueWorkspace>
│       │   ├── stat cards (Total / Converting / Completed / Failed)
│       │   ├── <ActiveCard> (active/waiting jobs)
│       │   └── <PipelineTable>
│       ├── [library]    <LibraryWorkspace>
│       │   └── <LibraryCard> × N   ← filter chips, rename done files
│       └── [settings]   <SettingsPanel isWorkspace>
│           ├── <SectionTabs>        ← Output / Video / Audio / Timeout / Workflow
│           ├── <OutputSection>
│           ├── <VideoSection>
│           ├── <AudioSection>
│           ├── <TimeoutSection>
│           └── <WorkflowSection>
├── <AppStatusStrip>     — Bottom bar (Engine Ready / Queue / Completed / Failed)
└── <ToastList>          — Fixed bottom-right error toasts (auto-dismiss 6 s)
```

---

### 6.4 Feature Modules

#### `features/dashboard`

| File | Purpose |
|---|---|
| `selectors.ts` | `getSessionStats`, `getActiveJob`, `getRecentProcessed` — pure selectors over `UiJob[]` |
| `formatters.ts` | `formatPercent`, `formatEta`, `formatElapsed`, `formatRemaining`, `formatFps`, `statusLabel`, `shortName` |
| `eta.ts` | `deriveLiveEtaSeconds` — smoothed ETA from live job state |
| `ConverterWorkspace.tsx` | Drop zone + stats + active job + lower panel grid |
| `QueueWorkspace.tsx` | Queue monitor with stat cards and pipeline table |
| `LibraryWorkspace.tsx` | Card grid of completed/failed/cancelled jobs with filter chips |
| `ActiveProcessPanel.tsx` | Large progress card for the currently converting job |
| `QueuePanel.tsx` | Compact queue sidebar — hover-to-rename for `waiting` jobs |
| `PipelineTable.tsx` | Full table with filename, format badge, priority, size, status |
| `RecentProcessedTable.tsx` | History table for done/failed jobs with action buttons |
| `SessionStatsCard.tsx` | Session summary statistics (queued, converting, done, failed) |

#### `features/settings`

| File | Purpose |
|---|---|
| `SettingsPanel.tsx` | Container — modal mode OR workspace mode (`isWorkspace` prop) |
| `SectionTabs.tsx` | Horizontal tab nav for workspace mode |
| `SectionNav.tsx` | Vertical sidebar nav for modal mode |
| `sections/` | Individual setting sections (Output, Video, Audio, Timeout, Workflow) |
| `useSectionTracker.ts` | Track active section without scroll tracking |
| `constants.ts` | `SETTINGS_SECTIONS`, quality preset definitions, CRF mappings |
| `help.ts` | Dynamic help text based on current value |
| `types.ts` | `SettingsPanelProps`, `SettingsSectionId`, `QualityPresetId` |

#### `features/jobs`

| File | Purpose |
|---|---|
| `DropZone.tsx` | Drag-and-drop file input with `.webm` validation |
| `file-paths.ts` | `extractPathsFromFileList`, `fileNameFromPath` |

#### `features/shell`

| File | Purpose |
|---|---|
| `AppSidebar.tsx` | Icon navigation with active indicator and queue badge |
| `AppTopbar.tsx` | View title + subtitle header |
| `AppStatusStrip.tsx` | Status bar pills at bottom of main content |
| `Toast.tsx` | `<ToastList>` and `toFriendlyMessage()` — user-friendly error messages |
| `navigation.ts` | `SIDEBAR_ITEMS`, `TOPBAR_COPY`, `SidebarView` type |

---

### 6.5 Styles & Design System

All styles are custom CSS — no Tailwind or CSS-in-JS. Variables are declared in `01-base.css`.

| File | Contents |
|---|---|
| `01-base.css` | All CSS custom properties (design tokens), reset |
| `02-shell.css` | `app-shell`, sidebar, topbar, main area layout |
| `03-workspace.css` | Workspace grids (`converter-grid`, `lower-grid`) |
| `04-panels.css` | Panel cards, active job card, stats card |
| `05-tables.css` | Recent table, queue panel, pipeline table, inline edit input |
| `06-settings.css` | Settings panel (both modal and workspace modes) |
| `07-motion.css` | `panel-fade-in`, transitions |
| `08-responsive.css` | Media queries for narrow viewports |
| `09-status-strip.css` | Status bar at the bottom of the shell |

#### Key Design Tokens

```css
--primary:         #b7c4ff;   /* Periwinkle blue — active states, accents */
--surface:         #13151f;   /* Default surface */
--surface-low:     #0f1118;   /* Below-surface (sidebar, deep backgrounds) */
--surface-high:    #1b1e2d;   /* Raised surfaces (cards, panels) */
--surface-highest: #232638;   /* Topmost surfaces (inputs, badges) */
--surface-bright:  #2e3245;   /* Hover highlights, scrollbar thumbs */
--text:            #e8eaf6;   /* Primary text */
--text-dim:        #7b82a8;   /* Secondary / hint text */
--ok:              #4ade80;   /* Success green */
--error:           #ec7c8a;   /* Error red-pink */
--line-soft:       rgba(255, 255, 255, 0.07);  /* Subtle borders */
--font-body:       'Inter', system-ui, sans-serif;
--font-label:      'Inter', system-ui, sans-serif;
--font-mono:       'JetBrains Mono', 'Fira Code', monospace;
```

---

## 7. Data Flow & IPC Communication

### 7.1 Command Flow (Renderer → Main)

```
User drops files
    ↓
DropZone.tsx → onPathsSelected()
    ↓
useTurnerController.enqueue(paths)
    ↓
window.turner.converter.enqueue({ inputPaths: paths })
    ↓  [ipcRenderer.invoke('converter.enqueue', request)]
ipcMain.handle('converter.enqueue')
    ↓
convertRequestSchema.safeParse(request)      ← Zod validation
    ↓
settingsRepository.get()                     ← merge with settings
    ↓
queue.enqueue(paths, options)
    ↓
prepareJobsForEnqueue()                      ← domain validation
    ↓
ConversionQueue.pump()                       ← starts conversion
    ↓
[jobIds] returned to renderer
    ↓
dispatch({ type: 'jobsQueued', payload })
    ↓
fetchFileSize (background, silent on failure)
```

### 7.2 Event Flow (Main → Renderer)

```
FFmpeg stderr line parsed
    ↓
onProgress callback in queue.pump()
    ↓
events.emit('progress', progressEvent)
    ↓
ipc.ts → window.webContents.send('converter.progress', event)
    ↓
preload: ipcRenderer.on('converter.progress', wrapped)
    ↓
window.turner.converter.onProgress(listener)
    ↓
useTurnerBridge.ts: dispatch({ type: 'progress', payload })
    ↓
reducer updates UiJob.progressPercent, fps, etaSeconds
    ↓
React re-render → ActiveProcessPanel shows live progress
```

### 7.3 Job Lifecycle

```
            enqueue()
               │
           ┌───▼────┐
           │ waiting │  ← preferredOutputName can be set here
           └───┬─────┘
    queue.pump()│
           ┌───▼──────────┐
           │  converting   │  ← progress events stream in
           └───┬──────┬───┘
               │      │
    ┌──────────▼──┐ ┌──▼──────────┐
    │    done     │ │   failed    │
    └─────────────┘ └─────────────┘
               │
    ┌──────────▼──┐
    │  cancelled  │  ← can happen from waiting OR converting
    └─────────────┘
```

---

## 8. Validation Layers

Turner has four distinct validation layers, each with a different concern:

| Layer | Location | Validates |
|---|---|---|
| **Client (pre-IPC)** | `DropZone.tsx`, `useTurnerController.ts` | File extension is `.webm`, path is non-empty |
| **IPC boundary** | `ipc.ts` (Zod schemas) | Shape and types of every incoming payload |
| **Domain rules** | `packages/domain` | Business invariants (no duplicate paths, no input=output, valid CRF/preset) |
| **Filesystem** | `enqueue-preparation.ts` | File actually exists and is readable, size > 0 |

This layered approach means that even if the renderer sends malformed data, the main process rejects it before any business logic runs.

---

## 9. Error Handling Strategy

### Result Pattern

Business logic never throws. All functions that can fail return `Result<T>`:

```typescript
const result = await settingsRepository.get();
if (!result.ok) {
  // result.error is AppError — handle gracefully
  return;
}
// result.value is AppSettings — safe to use
```

### IPC Error Serialization

Electron's IPC cannot transfer arbitrary `Error` objects. Turner serializes errors as JSON strings:

```typescript
// Main process:
throw new Error(JSON.stringify(appError));

// Renderer (bridge-error.ts):
export const parseIpcError = (error: unknown): string => {
  try {
    const parsed = JSON.parse((error as Error).message);
    return parsed.message ?? String(error);
  } catch {
    return String(error);
  }
};
```

### User-Facing Error Messages

Raw IPC errors are mapped to friendly messages in `Toast.tsx`:

| Raw error content | Friendly message |
|---|---|
| `enoent` / `no such file` | File not found — it may have been moved or deleted. |
| `eacces` / `permission denied` | Permission denied. Check that the file is accessible. |
| `bridge` / `unavailable` | Turner engine is not responding. Try restarting the app. |
| `timeout` / `timed out` | Conversion timed out. Try increasing the timeout in Settings → Timeout. |

Toast notifications auto-dismiss after 6 seconds, or can be manually closed.

---

## 10. Settings System

### Persistence

Settings are stored in a JSON file at the platform user-data path:

| Platform | Path |
|---|---|
| macOS | `~/Library/Application Support/Turner Studio/settings.json` |
| Windows | `C:\Users\<user>\AppData\Roaming\Turner Studio\settings.json` |
| Linux | `~/.config/Turner Studio/settings.json` |

### Default Values

| Setting | Default | Allowed Range |
|---|---|---|
| `outputDir` | `undefined` (same as source) | Any valid directory path |
| `crf` | `23` | 1–40 (lower = better quality + larger file) |
| `preset` | `'medium'` | `ultrafast`, `veryfast`, `fast`, `medium`, `slow` |
| `audioBitrate` | `'128k'` | Any string matching `\d+k` |
| `keepOriginal` | `true` | Boolean |
| `notifyOnCompletion` | `true` | Boolean |
| `timeoutMs` | `1800000` (30 min) | Positive integer (ms) |
| `schemaVersion` | `1` | Integer — managed by migration |

### Quality Preset Mapping (UI)

The settings UI groups CRF values into named quality presets:

| UI Preset | CRF Value | Description |
|---|---|---|
| Archival | 18 | Near-lossless, large files |
| Balanced | 23 | Good quality, moderate size **(default)** |
| Compressed | 28 | Smaller files, visible compression |
| Custom | (slider) | Free CRF control |

---

## 11. FFmpeg Integration

### Binary

Turner uses `ffmpeg-static` (npm package) which bundles a platform-specific FFmpeg binary. No system FFmpeg is required.

```
packages/media-engine/node_modules/ffmpeg-static/
├── ffmpeg           (macOS/Linux)
└── ffmpeg.exe       (Windows)
```

### Complete Argument Sequence

```bash
ffmpeg \
  -i "input.webm" \
  -c:v libx264 \
  -preset medium \
  -crf 23 \
  -pix_fmt yuv420p \
  -c:a aac \
  -b:a 128k \
  -movflags +faststart \
  -y \
  "output.mp4"
```

| Flag | Purpose |
|---|---|
| `-c:v libx264` | H.264 video codec |
| `-preset medium` | Encoder speed vs. compression trade-off |
| `-crf 23` | Constant rate factor (quality) |
| `-pix_fmt yuv420p` | Maximum compatibility (QuickTime, browsers) |
| `-c:a aac` | AAC audio codec |
| `-b:a 128k` | Audio bitrate |
| `-movflags +faststart` | Moves MP4 index to file start (web streaming-compatible) |
| `-y` | Overwrite output without prompt (destination is always a fresh path from domain) |

### Progress Extraction

FFmpeg writes progress to stderr in a line like:
```
frame=  128 fps= 24 q=23.0 size=    1024kB time=00:00:05.33 bitrate=1572.9kbits/s speed=1.11x
```

`parseProgressLine()` extracts `time`, `fps`, and `speed` using regular expressions. Percent is computed as `parsedTime / totalDuration × 100`.

---

## 12. Type System & Contracts

### TypeScript Configuration

The root `tsconfig.base.json` enforces maximum strictness:

```jsonc
{
  "strict": true,
  "noUncheckedIndexedAccess": true,
  "exactOptionalPropertyTypes": true,
  "verbatimModuleSyntax": true
}
```

- `noUncheckedIndexedAccess` — array/record accesses return `T | undefined`, forcing null checks
- `exactOptionalPropertyTypes` — `{ foo?: string }` does NOT allow `{ foo: undefined }` explicitly
- `verbatimModuleSyntax` — all type-only imports must use `import type`

### Path Aliases

| Alias | Resolves to |
|---|---|
| `@/` | `apps/renderer/src/` |
| `@turner/shared` | `packages/shared/src/index.ts` |
| `@turner/contracts` | `packages/contracts/src/index.ts` |
| `@turner/domain` | `packages/domain/src/index.ts` |
| `@turner/media-engine` | `packages/media-engine/src/index.ts` |
| `@turner/persistence` | `packages/persistence/src/index.ts` |
| `@turner/observability` | `packages/observability/src/index.ts` |

---

## 13. Development Setup

### Prerequisites

| Tool | Version | Required |
|---|---|---|
| Node.js | ≥ 20 LTS | ✅ |
| npm | ≥ 10 | ✅ |
| Git | any | ✅ |
| Xcode Command Line Tools | latest | macOS only |
| Visual Studio Build Tools | 2019 or 2022 | Windows only |

### First-Time Setup

```bash
# Clone the repository
git clone <repo-url>
cd Turner

# Install all dependencies (root + all workspaces)
npm install
```

### Running in Development

```bash
npm run dev
```

This runs three things in parallel:

1. **Build packages** (`shared`, `contracts`, `domain`, `media-engine`, `persistence`, `observability`) — runs once at startup
2. **Renderer dev server** — Vite at `http://127.0.0.1:5173` with HMR
3. **Desktop** — waits for port 5173, then builds TypeScript and launches `electron dist/main/index.js`

> **Hot reload:** The renderer supports full HMR (changes to React components reload instantly). The desktop main process requires a restart after changes to main-process TypeScript.

### Building for Production

```bash
npm run build
```

Build order (sequential):
1. All six packages (`tsc`)
2. Renderer (`tsc --noEmit` + `vite build` → `apps/renderer/dist/`)
3. Desktop (`tsc` → `apps/desktop/dist/` + copy `bridge.cjs`)

### Type Checking

```bash
npm run typecheck    # Check entire monorepo (no emit)
```

### Running Tests

```bash
npm test             # Run all tests once (vitest run)
npm run test:watch   # Watch mode
```

Tests are in `tests/` and use Vitest with the same path alias configuration as the main project.

---

## 14. Testing

Tests are co-located in `tests/` at the monorepo root and focus on pure business-logic packages:

- **`@turner/domain`** — output path resolution, validation, deduplication
- **`@turner/shared`** — result helpers, error creation
- **`@turner/persistence`** — settings migration, atomic write behaviour
- **`@turner/media-engine`** — progress parsing, FFmpeg argument construction

### Test Runner

```
vitest.config.ts
├── include: "tests/**/*.test.ts"
├── coverage: v8 provider
└── resolve.alias: all @turner/* paths (same as source)
```

Run a specific package's tests:
```bash
npx vitest run tests/domain
```

---

## 15. Environment Variables

| Variable | Where Used | Description |
|---|---|---|
| `TURNER_RENDERER_URL` | `apps/desktop/src/main/window.ts` | If set, loads this URL instead of the built renderer. Set to `http://127.0.0.1:5173` in dev mode. |

No `.env` file is required. The only environment variable is injected by the `npm run dev:desktop` script via `cross-env`.

---

## 16. Known Constraints & Limitations

| Constraint | Detail |
|---|---|
| **Sequential conversion** | Jobs convert one at a time. Parallel conversion is not supported. |
| **Input format** | Only `.webm` input is accepted. Other video formats are rejected. |
| **Output format** | Only `.mp4` (H.264 + AAC) output. Codec options are not configurable through the UI beyond preset and CRF. |
| **No resume** | If the app is closed mid-conversion, the partial output file is left on disk. The job is not resumed on next launch. |
| **No job persistence** | The job list in the UI is in-memory only. Closing and reopening the app clears the history. |
| **FFmpeg binary size** | `ffmpeg-static` adds ~60–80 MB to the installation. |
| **Sandbox disabled** | `sandbox: false` is required on the Electron preload to enable Node.js APIs. Context isolation remains enabled for security. |
| **Single window** | Only one BrowserWindow is created. Multi-window is not supported. |
| **No auto-update** | There is no built-in auto-update mechanism. Updates must be distributed and installed manually. |
