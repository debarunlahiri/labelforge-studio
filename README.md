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
│   └── User & settings management
├── Embedded SQLite Database
│   ├── Templates & versions
│   ├── Users, roles & permissions
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
| Password Hashing | bcryptjs |

## Getting Started

### Prerequisites

- Node.js >= 18
- npm >= 9

### Install

```bash
npm install
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
│   │   ├── seed.ts                 # Seed data (admin, roles, permissions)
│   │   └── repositories/          # Data access layer
│   │       ├── users.ts
│   │       ├── templates.ts
│   │       ├── templateVersions.ts
│   │       ├── printers.ts
│   │       ├── printJobs.ts
│   │       ├── auditLogs.ts
│   │       └── globalVariables.ts
│   └── ipc/
│       └── index.ts                # All IPC handlers
├── src/                             # React renderer app
│   ├── main.tsx                     # React entry
│   ├── App.tsx                      # Routes & auth guard
│   ├── index.css                    # Tailwind + custom properties
│   ├── types/index.ts              # TypeScript types (40+ interfaces)
│   ├── store/                       # Zustand stores
│   │   ├── authStore.ts
│   │   ├── templateStore.ts
│   │   ├── designerStore.ts
│   │   └── appStore.ts
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   └── Header.tsx
│   ├── pages/
│   │   ├── Login.tsx
│   │   ├── Dashboard.tsx
│   │   ├── TemplateLibrary.tsx
│   │   ├── TemplateDesigner.tsx
│   │   ├── PrintScreen.tsx
│   │   ├── PrintHistory.tsx
│   │   ├── PrinterStatus.tsx
│   │   ├── UserManagement.tsx
│   │   ├── Settings.tsx
│   │   ├── AuditLogs.tsx
│   │   └── GlobalVariables.tsx
│   └── designer/
│       ├── Toolbar.tsx
│       ├── PropertiesPanel.tsx
│       └── LayersPanel.tsx
├── vite.config.ts
├── package.json
└── tsconfig*.json
```

## Default Login

| Username | Password | Role |
|----------|----------|------|
| admin | admin | Super Admin |

The database is seeded on first launch with an admin user, default roles (Super Admin, Admin, Designer, Approver, Print Operator, Auditor), permissions, and global variables.

## Module Status

### Phase 1 - Foundation (Complete)

- [x] Electron app shell with secure context isolation
- [x] React + TypeScript + Vite setup
- [x] SQLite embedded database with migrations
- [x] Authentication (login/logout, session tracking)
- [x] Role-based access control
- [x] Template library (CRUD, search, filter, duplicate, archive)
- [x] Template designer canvas (Konva.js)
- [x] Label objects: Text, Barcode, QR Code, Shape, Line, Image, Date/Time, Counter
- [x] Properties panel for all object types
- [x] Layers panel with visibility/lock toggles
- [x] Template versioning (save, submit, approve, reject)
- [x] Print screen with printer/template selection
- [x] Print job history with cancel/retry
- [x] Printer registration and management
- [x] User management (CRUD, enable/disable)
- [x] Global variables management
- [x] Audit logging
- [x] Settings page (general, database, printing, security)

### Phase 2 - Data Sources (In Progress)

- [ ] CSV file import and mapping
- [ ] Excel file import and mapping
- [ ] SQLite database connector
- [ ] PostgreSQL database connector
- [ ] MySQL database connector
- [ ] Field mapping UI
- [ ] Print-time input fields
- [ ] Data preview

### Phase 3 - Advanced Designer

- [ ] Barcode rendering with bwip-js
- [ ] QR code rendering
- [ ] Undo/Redo system
- [ ] Multi-select and group/ungroup
- [ ] Align and distribute tools
- [ ] Guides and snap-to-object
- [ ] Copy/Paste keyboard shortcuts
- [ ] Ruler and measurement display

### Phase 4 - Printing

- [ ] Label preview rendering
- [ ] PDF export
- [ ] PNG export
- [ ] ZPL output generation
- [ ] EPL output generation
- [ ] TSPL output generation
- [ ] Batch printing from data source
- [ ] Local print agent (background service)

### Phase 5 - Advanced Features

- [ ] Template .lfx file export/import
- [ ] Formula engine
- [ ] RFID encoding adapter
- [ ] Template approval workflow UI
- [ ] Auto-save and recovery
- [ ] Template comparison/diff

### Phase 6 - Polish

- [ ] App icon and splash screen
- [ ] Auto-update mechanism
- [ ] Code-signed builds
- [ ] macOS and Windows installers
- [ ] Performance optimization for 10K+ record batches

## Database

The application uses **SQLite** embedded directly in the app. No external database server is required.

- Database file location: `~/Library/Application Support/labelforge-studio/labelforge.db` (macOS) or `%APPDATA%/labelforge-studio/labelforge.db` (Windows)
- All data is stored locally within the application
- Schema migrations run automatically on startup
- WAL mode for concurrent read/write performance

## Security

- `contextIsolation: true` - Renderer is isolated from Node.js
- `nodeIntegration: false` - No direct Node access in renderer
- `sandbox: false` - Required for better-sqlite3 native module
- Passwords are hashed with bcryptjs
- All database operations go through IPC (no direct DB access from renderer)
- Audit logging for all sensitive operations

## License

Proprietary - All rights reserved.