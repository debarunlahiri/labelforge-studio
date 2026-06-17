# LabelForge Studio

Cross-platform label designing, barcode designing, data-driven printing, and local print management software built with Electron, React, TypeScript, and SQLite.

## Architecture

```
LabelForge Studio
├── Desktop Designer App (Electron + React + TypeScript)
│   ├── Template designer (Konva.js canvas)
│   ├── Barcode designer (bwip-js)
│   ├── Data source configuration
│   ├── Print screen
│   └── Settings management
├── Embedded SQLite Database
│   ├── Templates & versions
│   ├── Print jobs & printer status
│   ├── Audit logs
│   └── Global variables
└── Local Print Agent (Phase 6)
```

## Technology Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron |
| UI Framework | React + TypeScript |
| Build Tool | Vite |
| Canvas Designer | React + Konva.js |
| State Management | Zustand |
| Routing | React Router v7 |
| Database | SQLite (better-sqlite3, embedded) |
| Styling | Tailwind CSS v4 |
| Barcode/QR | bwip-js |

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install

```bash
npm install
```

For repeatable installs from the committed lockfile, prefer:

```bash
npm ci
```

#### Company Proxy Install Issues

If install fails on a company network with `EINTEGRITY`, `integrity checksum failed`, or checksum mismatch errors, npm is usually receiving a corrupted or cached package tarball from the proxy/cache layer.

First check which npm registry and proxy settings are active:

```bash
npm config get registry
npm config get proxy
npm config get https-proxy
npm config list
```

If `proxy` or `https-proxy` prints `null`, npm is not using a proxy.

Then clear the local npm cache and reinstall from the lockfile:

```bash
npm cache clean --force
rm -rf node_modules
npm ci
```

If the error continues, configure npm to use your company proxy and registry. Replace the proxy URLs with your company values:

```bash
npm config set registry https://registry.npmjs.org/
npm config set proxy http://proxy.company.com:8080
npm config set https-proxy http://proxy.company.com:8080
npm config set fetch-retries 5
npm config set fetch-retry-mintimeout 20000
npm config set fetch-retry-maxtimeout 120000
```

Verify that the settings were saved:

```bash
npm config get proxy
npm config get https-proxy
```

If the proxy is set but `EINTEGRITY` still happens, capture the exact package that fails:

```bash
npm ci --verbose
```

Then try a fully clean reinstall:

```bash
npm cache clean --force
npm cache verify
rm -rf node_modules
npm ci --prefer-online
```

If it still fails on the same package, the company proxy or internal registry is likely serving a corrupted cached tarball. Ask the network/proxy team to purge that package tarball from the npm cache.

If your company uses an internal npm mirror such as Nexus, Artifactory, or Verdaccio, use that registry instead:

```bash
npm config set registry https://your-company-npm-registry.example.com/
```

If your company uses SSL inspection, ask IT for the company CA certificate and configure npm to trust it:

```bash
npm config set cafile /path/to/company-ca.pem
```

Only disable SSL verification if your company explicitly allows it:

```bash
npm config set strict-ssl false
```

If the install fails with certificate or TLS errors, run:

```bash
npm ping --verbose
```

Do not fix checksum errors by deleting `package-lock.json`. The lockfile protects the install from silently using different package contents. If only one package fails repeatedly, ask the network/proxy team to purge that package tarball from the internal npm cache.

#### Network URLs Used By Install And Packaging

For `npm ci` / `npm install`, this project fetches package tarballs from the URLs stored in `package-lock.json`. In the current lockfile, there are 527 package tarball URLs and they all use this host:

```text
https://registry.npmjs.org
```

To print the complete exact tarball URL list:

```bash
node -e "const fs=require('fs'); const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8')); const urls=[...new Set(Object.values(lock.packages||{}).map(p=>p.resolved).filter(Boolean))].sort(); console.log(urls.join('\n'))"
```

To save the complete exact tarball URL list to a file:

```bash
node -e "const fs=require('fs'); const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8')); const urls=[...new Set(Object.values(lock.packages||{}).map(p=>p.resolved).filter(Boolean))].sort(); fs.writeFileSync('npm-fetch-urls.txt', urls.join('\n') + '\n')"
```

For Electron install and package builds, allow these additional download locations unless your company mirrors them internally:

```text
https://github.com/electron/electron/releases/download/
https://github.com/electron-userland/electron-builder-binaries/releases/download/
```

Typical Electron binary URLs for this project's configured Electron version:

```text
https://github.com/electron/electron/releases/download/v42.4.0/electron-v42.4.0-darwin-arm64.zip
https://github.com/electron/electron/releases/download/v42.4.0/electron-v42.4.0-win32-x64.zip
https://github.com/electron/electron/releases/download/v42.4.0/SHASUMS256.txt
```

If GitHub downloads are blocked, use an internal mirror and configure:

```bash
npm config set electron_mirror https://your-company-artifact-mirror.example.com/electron/
export ELECTRON_MIRROR=https://your-company-artifact-mirror.example.com/electron/
```

#### Manual Browser Download Offline Setup

If the company proxy blocks npm but you can download files manually in a browser, use this process.

1. Save the complete npm tarball URL list:

```bash
node -e "const fs=require('fs'); const lock=JSON.parse(fs.readFileSync('package-lock.json','utf8')); const urls=[...new Set(Object.values(lock.packages||{}).map(p=>p.resolved).filter(Boolean))].sort(); fs.writeFileSync('npm-fetch-urls.txt', urls.join('\n') + '\n')"
```

2. Open each URL from `npm-fetch-urls.txt` in the browser and download the `.tgz` files into a local folder, for example:

```text
offline-cache/npm-tarballs/
```

3. Add the downloaded tarballs to the local npm cache:

```bash
for file in offline-cache/npm-tarballs/*.tgz; do npm cache add "$file"; done
```

4. Install from the local npm cache:

```bash
rm -rf node_modules
npm ci --offline
```

If `npm ci --offline` says a package is missing from the cache, download that missing `.tgz`, run `npm cache add` for it, then run `npm ci --offline` again.

For Electron desktop package builds, also download the Electron runtime zip files manually if GitHub is blocked.

Download these files for this project:

```text
https://github.com/electron/electron/releases/download/v42.4.0/electron-v42.4.0-darwin-arm64.zip
https://github.com/electron/electron/releases/download/v42.4.0/electron-v42.4.0-win32-x64.zip
https://github.com/electron/electron/releases/download/v42.4.0/SHASUMS256.txt
```

Put the downloaded files into the Electron cache.

macOS:

```text
~/Library/Caches/electron/
```

Windows:

```text
%LOCALAPPDATA%\electron\Cache
```

For electron-builder helper binaries, download any missing files named in the build error from:

```text
https://github.com/electron-userland/electron-builder-binaries/releases/download/
```

Then place them under the electron-builder cache.

macOS:

```text
~/Library/Caches/electron-builder/
```

Windows:

```text
%LOCALAPPDATA%\electron-builder\Cache
```

After the caches are populated, run:

```bash
npm ci --offline
npm run build
npm run electron:build
```

For Windows `.exe` output:

```bash
npm run electron:build:win
```

### Development

```bash
npm run dev
```

This starts Vite dev server with Electron. The app opens automatically.

### Build

```bash
npm run build
```

This creates the production app bundles only:

- Renderer bundle: `dist/`
- Electron main/preload bundle: `dist-electron/`

This command does not create installable desktop packages. Use the Electron package commands below for `.app`, `.zip`, and `.exe` outputs.

### Desktop Packages

Package build commands:

| Output | Command |
|--------|---------|
| Production bundles only | `npm run build` |
| Current platform desktop package | `npm run electron:build` |
| macOS ZIP using local Electron runtime | `npm run electron:build:offline` |
| Windows `.exe` installer and portable app | `npm run electron:build:win` |

Build the Electron desktop package for the current platform:

```bash
npm run electron:build
```

On macOS, this produces:

- App bundle: `dist/mac-arm64/LabelForge Studio.app`
- ZIP package: `dist/LabelForge Studio-1.0.0-arm64-mac.zip`

Build a macOS ZIP without downloading the Electron runtime:

```bash
npm run electron:build:offline
```

This uses the Electron runtime already installed at `node_modules/electron/dist`.

Build Windows `.exe` packages:

```bash
npm run electron:build:win
```

The Windows build produces:

- NSIS installer: `dist/LabelForge Studio Setup 1.0.0.exe`
- Portable executable: `dist/LabelForge Studio 1.0.0.exe`
- Unpacked app executable: `dist/win-unpacked/LabelForge Studio.exe`

For best results, run the Windows build on a Windows machine. Cross-building Windows installers from macOS can require Wine.

#### Offline Windows Build

A Windows `.exe` needs the Windows Electron binary, not the macOS runtime in `node_modules/electron/dist`. On a restricted company network, prepare one of these before running `npm run electron:build:win`:

1. Pre-populate the electron-builder cache with `electron-v42.4.0-win32-x64.zip`.
2. Configure npm/proxy access so electron-builder can download Electron from GitHub.
3. Use an internal artifact mirror and set `ELECTRON_MIRROR` to that mirror URL.

Typical electron-builder cache locations:

- macOS: `~/Library/Caches/electron-builder`
- Windows: `%LOCALAPPDATA%\electron-builder\Cache`

### Lint

```bash
npm run lint
```

## Project Structure

```
labelforge-studio/
├── electron/                        # Electron main process
│   ├── main.ts                      # Main process entry
│   ├── preload.ts                   # Preload script (contextBridge API)
│   ├── database/
│   │   ├── db.ts                    # SQLite initialization (embedded)
│   │   ├── migrations.ts           # Schema migrations
│   │   ├── seed.ts                 # Seed data (global variables and settings)
│   │   └── repositories/          # Data access layer
│   │       ├── templates.ts
│   │       ├── templateVersions.ts
│   │       ├── printers.ts
│   │       ├── printJobs.ts
│   │       ├── auditLogs.ts
│   │       └── globalVariables.ts
│   ├── preprocessing/
│   │   ├── dataSourceEngine.ts      # CSV/JSON/SQLite parsing, field extraction
│   │   └── formulaEngine.ts        # Safe expression parser (math, string, date, conditional)
│   ├── printing/
│   │   └── labelRenderer.ts        # Server-side rendering (ZPL/EPL/TSPL stubs)
│   └── ipc/
│       └── index.ts                # All IPC handlers
├── src/                             # React renderer app
│   ├── main.tsx                     # React entry
│   ├── App.tsx                      # Routes (lazy-loaded pages)
│   ├── index.css                    # Tailwind + custom properties
│   ├── types/index.ts              # TypeScript types (20+ interfaces)
│   ├── store/                       # Zustand stores
│   │   ├── templateStore.ts        # Template CRUD & versions
│   │   ├── designerStore.ts        # Objects, undo/redo, clipboard, multi-select
│   │   └── appStore.ts             # UI state
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── pages/
│   │   ├── Dashboard.tsx           # Stats, recent templates, quick actions
│   │   ├── TemplateLibrary.tsx      # Search, filter, export/import
│   │   ├── TemplateDesigner.tsx     # Full designer with rulers, grid, zoom
│   │   ├── PrintScreen.tsx         # Print workflow with print-time input
│   │   ├── PrintPreview.tsx        # PDF/PNG/ZPL export
│   │   ├── PrintHistory.tsx        # Job history with auto-refresh
│   │   ├── TemplateVersions.tsx     # Version history with diff comparison
│   │   ├── PrintTimeInput.tsx       # Dynamic form for print-time fields
│   │   ├── PrinterStatus.tsx
│   │   ├── Settings.tsx
│   │   ├── AuditLogs.tsx
│   │   └── GlobalVariables.tsx
│   ├── designer/
│   │   ├── Toolbar.tsx              # Undo/redo, align, zoom, grid, data source
│   │   ├── PropertiesPanel.tsx      # Object property editor
│   │   ├── LayersPanel.tsx          # Layer list with drag reorder
│   │   ├── BarcodeRenderer.tsx      # bwip-js Konva barcode rendering
│   │   ├── DataSourcePanel.tsx       # 12-type data source config
│   │   ├── AlignTools.tsx           # Alignment action buttons
│   │   └── Ruler.tsx                # Konva ruler component (H/V)
│   ├── hooks/
│   │   └── useKeyboardShortcuts.ts  # Ctrl+Z, Ctrl+Shift+Z, Ctrl+S, Del, Ctrl+C/V/X/D, Ctrl+A
│   └── utils/
│       └── labelRenderer.ts         # Canvas/PNG/PDF/ZPL rendering utilities
├── vite.config.ts
├── package.json
└── tsconfig*.json
```

## Offline Access

LabelForge Studio runs as an offline desktop application with no sign-in, registration, users, roles, or permissions. The app opens directly into the workspace and all features are available locally.

## Module Status

### Phase 1 - Foundation (Complete)

- [x] Electron app shell with secure context isolation
- [x] React + TypeScript + Vite setup
- [x] SQLite embedded database with migrations
- [x] Offline desktop access with no sign-in or registration
- [x] Template library (CRUD, search, filter, duplicate, archive)
- [x] Template designer canvas (Konva.js)
- [x] Label objects: Text, Barcode, QR Code, Shape, Line, Image, Date/Time, Counter, RFID
- [x] Barcode & QR rendering with bwip-js (no more placeholders)
- [x] Properties panel for all object types
- [x] Layers panel with visibility/lock toggles and move up/down reorder
- [x] Template versioning (save, submit, approve, reject)
- [x] Version comparison/diff with color-coded changes
- [x] Print screen with printer/template selection
- [x] Print-time input modal for dynamic fields
- [x] Print preview with PDF/PNG/ZPL export navigation
- [x] Print job history with cancel/retry and 10s auto-refresh
- [x] Printer registration and management
- [x] Global variables management
- [x] Audit logging
- [x] Settings page (general, database, printing)

### Phase 2 - Data Sources (In Progress)

- [x] Data source panel UI (12 types: Static, CSV, Excel, SQLite, PostgreSQL, MySQL, SQL Server, JSON, Print-time Input, Counter, Global Variable, Formula)
- [x] CSV file import and parsing
- [x] JSON file import and parsing
- [x] SQLite database connector
- [x] Formula engine (string concat, arithmetic, dates, if/else, string functions)
- [x] Print-time input fields
- [ ] Excel file import and mapping
- [ ] PostgreSQL database connector
- [ ] MySQL database connector
- [ ] SQL Server database connector
- [ ] Field mapping UI (bind data fields to designer objects)
- [ ] Data source preview (load and browse records from connectors)
- [ ] Batch printing from data source

### Phase 3 - Advanced Designer (In Progress)

- [x] Barcode rendering with bwip-js (Code128, EAN-13, Code39, etc.)
- [x] QR code rendering
- [x] Undo/Redo system with full history
- [x] Multi-select (Shift+Click) and Select All (Ctrl+A)
- [x] Copy/Paste/Cut keyboard shortcuts (Ctrl+C/V/X)
- [x] Duplicate object (Ctrl+D)
- [x] Align and distribute tools
- [x] Ruler display (horizontal + vertical, Konva-based)
- [x] Grid and snap-to-grid
- [ ] Group/Ungroup selected objects
- [ ] Snap-to-object guides
- [ ] Image upload via file picker (IPC to native dialog)
- [ ] Object rotation handle in canvas

### Phase 4 - Printing (In Progress)

- [x] Label preview rendering
- [x] PDF export
- [x] PNG export
- [x] ZPL output generation (stub)
- [x] EPL output generation (stub)
- [x] TSPL output generation (stub)
- [ ] Full ZPL/EPL/TSPL implementation
- [ ] Batch printing from data source
- [ ] Local print agent (.NET Worker Service)

### Phase 5 - Advanced Features (In Progress)

- [x] Template .lfx.json file export/import
- [x] Formula engine
- [x] RFID object type stub in designer
- [x] Template approval workflow UI (Draft → Submitted → Approved/Rejected)
- [x] Auto-save every 30 seconds in designer
- [x] Template comparison/diff view in version history
- [x] Print-time input modal with validation
- [ ] RFID encoding adapter (full implementation)
- [ ] Template status badges in Dashboard

### Phase 6 - Polish (Not Started)

- [x] Code-splitting (lazy-loaded routes, main chunk: 234KB)
- [x] macOS offline ZIP packaging (electron-builder)
- [x] Windows EXE packaging configuration (NSIS + portable)
- [ ] App icon and splash screen
- [ ] Auto-update mechanism
- [ ] Code-signed builds
- [ ] Signed macOS and Windows installers
- [ ] Performance optimization for 10K+ record batches

## Designer Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Ctrl+Z | Undo |
| Ctrl+Shift+Z | Redo |
| Ctrl+S | Save |
| Delete | Delete selected object |
| Ctrl+A | Select all objects |
| Ctrl+C | Copy selected object |
| Ctrl+V | Paste copied object |
| Ctrl+X | Cut selected object |
| Ctrl+D | Duplicate selected object |
| Ctrl+= | Zoom in |
| Ctrl+- | Zoom out |

## Designer Object Types

| Type | Description | Rendered |
|------|-------------|----------|
| Text | Rich text with font, size, color, alignment | Yes (Konva Text) |
| Barcode | Code128, EAN-13, Code39, UPC-A, etc. | Yes (bwip-js) |
| QR Code | QR codes with error correction levels | Yes (bwip-js) |
| Shape | Rectangle, circle, ellipse, triangle, diamond | Yes (Konva Rect) |
| Line | Lines with arrow endpoints | Yes (Konva Line) |
| Image | Embedded or linked images | Placeholder |
| Date/Time | Date/time with format strings and offset | Yes (format display) |
| Counter | Incrementing counter with padding, prefix/suffix | Yes (monospace display) |
| RFID | RFID encoding placeholder | Yes (stub label) |

## Data Source Types

| Type | Status |
|------|--------|
| Static Value | Configured |
| CSV File | Parsing implemented |
| Excel File | UI configured, parsing pending |
| SQLite Database | Parsing implemented |
| PostgreSQL | UI configured, connector pending |
| MySQL | UI configured, connector pending |
| SQL Server | UI configured, connector pending |
| JSON File | Parsing implemented |
| Print-time Input | UI + modal implemented |
| Counter | Auto-increment per print job |
| Global Variable | References system variables |
| Formula | Engine implemented (math, string, date, conditional) |

## Database

The application uses **SQLite** embedded directly in the app. No external database server is required.

- Database file location: `~/Library/Application Support/labelforge-studio/labelforge.db` (macOS) or `%APPDATA%/labelforge-studio/labelforge.db` (Windows)
- All data is stored locally within the application
- Schema migrations run automatically on startup
- WAL mode for concurrent read/write performance

## Security

- `contextIsolation: true` — Renderer is isolated from Node.js
- `nodeIntegration: false` — No direct Node access in renderer
- `sandbox: false` — Required for better-sqlite3 native module
- All database operations go through IPC (no direct DB access from renderer)
- Audit logging for all sensitive operations

## Build Output

After `npm run build`, the project produces:

- `dist/` — Renderer bundle (code-split, lazy-loaded pages)
- `dist-electron/main.js` — Electron main process (~65KB)
- `dist-electron/preload.js` — Preload context bridge (~3KB)
- Main chunk: ~235KB (down from 1610KB pre code-splitting)
- Designer chunk: ~986KB (Konva.js + bwip-js)

After desktop package builds, electron-builder writes packages to `dist/`:

- macOS offline ZIP: `dist/LabelForge Studio-1.0.0-arm64-mac.zip`
- Windows installer: `dist/LabelForge Studio Setup 1.0.0.exe`
- Windows portable app: `dist/LabelForge Studio 1.0.0.exe`

## License

Proprietary — All rights reserved.
