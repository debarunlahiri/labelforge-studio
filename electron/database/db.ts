import initSqlJs from 'sql.js'
import type { Database as SqlJsDatabase } from 'sql.js'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { app } from 'electron'
import { runMigrations } from './migrations'
import { seedDatabase } from './seed'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let db: SqlJsDatabase | null = null
let dbPath: string = ''
let saveTimer: ReturnType<typeof setTimeout> | null = null

export function getDatabase(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.')
  }
  return db
}

async function loadWasmBinary(): Promise<Uint8Array> {
  const appPath = app.getAppPath()
  const isDev = !!process.env.VITE_DEV_SERVER_URL

  const candidates = isDev
    ? [
        path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
        path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
      ]
    : [
        path.join(appPath, 'sql-wasm.wasm'),
        path.join(appPath, 'dist-electron', 'sql-wasm.wasm'),
        path.join(__dirname, 'sql-wasm.wasm'),
        path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
        path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm'),
      ]

  for (const candidate of candidates) {
    try {
      if (fs.existsSync(candidate)) {
        console.log(`[DB] Loading WASM from: ${candidate}`)
        const buffer = fs.readFileSync(candidate)
        return new Uint8Array(buffer)
      }
    } catch (e) {
      console.log(`[DB] Failed to check WASM path ${candidate}:`, e)
    }
  }

  throw new Error(
    'sql-wasm.wasm not found. Searched:\n' + candidates.join('\n')
  )
}

export async function initDatabase(): Promise<SqlJsDatabase> {
  if (db) return db

  console.log('[DB] Initializing database...')
  const userDataPath = app.getPath('userData')
  dbPath = path.join(userDataPath, 'labelforge.db')
  console.log(`[DB] Database path: ${dbPath}`)

  try {
    const wasmBinary = await loadWasmBinary()
    console.log(`[DB] WASM binary loaded (${wasmBinary.length} bytes)`)

    const SQL = await initSqlJs({ wasmBinary })
    console.log('[DB] sql.js initialized')

    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath)
      db = new SQL.Database(buffer)
      console.log('[DB] Loaded existing database')
    } else {
      db = new SQL.Database()
      console.log('[DB] Created new database')
    }

    db.run('PRAGMA foreign_keys = ON')
    db.run('PRAGMA busy_timeout = 5000')

    runMigrations(db)
    seedDatabase(db)
    saveToDisk()

    console.log('[DB] Database initialized successfully')
    return db
  } catch (error) {
    console.error('[DB] Failed to initialize database:', error)
    throw error
  }
}

export function saveToDisk(): void {
  if (!db || !dbPath) return
  try {
    const data = db.export()
    const buffer = Buffer.from(data)
    fs.writeFileSync(dbPath, buffer)
  } catch (e) {
    console.error('Failed to save database to disk:', e)
  }
}

export function scheduleSave(): void {
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(() => {
    saveToDisk()
    saveTimer = null
  }, 1000)
}

export function closeDatabase(): void {
  if (db) {
    saveToDisk()
    db.close()
    db = null
    console.log('[DB] Database closed')
  }
}
