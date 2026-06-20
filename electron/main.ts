import { fileURLToPath } from 'url'
import path from 'path'
import fs from 'fs'
import { app, BrowserWindow, dialog } from 'electron'
import { initDatabase, closeDatabase } from './database/db.js'
import { registerIpcHandlers } from './ipc/index.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

let mainWindow: BrowserWindow | null = null

function writeStartupLog(message: string, error?: unknown) {
  const details = error instanceof Error ? `${error.stack ?? error.message}` : String(error ?? '')
  const line = `[${new Date().toISOString()}] ${message}${details ? `\n${details}` : ''}\n`

  try {
    const logDir = app.getPath('userData')
    fs.mkdirSync(logDir, { recursive: true })
    fs.appendFileSync(path.join(logDir, 'startup.log'), line)
  } catch {
    // Logging must never prevent the application from starting.
  }

  console.error(line)
}

function createWindow() {
  let rendererReady = false
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1024,
    minHeight: 700,
    title: 'LabelForge Studio',
    icon: path.join(__dirname, '..', 'dist', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
    frame: true,
    show: false,
  })

  mainWindow.once('ready-to-show', () => {
    rendererReady = true
    mainWindow?.show()
  })

  mainWindow.webContents.on('did-finish-load', () => {
    rendererReady = true
    mainWindow?.show()
  })

  mainWindow.webContents.on('did-fail-load', (_event, errorCode, errorDescription, validatedURL) => {
    const message = `Renderer failed to load (${errorCode}): ${errorDescription}\n${validatedURL}`
    writeStartupLog(message)
    mainWindow?.show()
    dialog.showErrorBox('LabelForge Studio could not open', message)
  })

  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    const message = `Renderer process exited: ${details.reason} (exit code ${details.exitCode})`
    writeStartupLog(message)
    dialog.showErrorBox('LabelForge Studio stopped unexpectedly', message)
  })

  // Never leave users with an invisible process if ready-to-show is not emitted.
  setTimeout(() => {
    if (!rendererReady && mainWindow && !mainWindow.isDestroyed()) {
      writeStartupLog('Renderer startup timed out; showing the window for diagnostics.')
      mainWindow.show()
    }
  }, 10_000)

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL)
    mainWindow.webContents.openDevTools()
  } else {
    void mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html')).catch((error) => {
      writeStartupLog('Failed to load the application UI.', error)
      dialog.showErrorBox(
        'LabelForge Studio could not start',
        `The application UI could not be loaded.\n\n${error instanceof Error ? error.message : String(error)}`
      )
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

app.whenReady()
  .then(async () => {
    writeStartupLog(`Starting LabelForge Studio ${app.getVersion()} on ${process.platform} ${process.arch}.`)
    await initDatabase()
    registerIpcHandlers()
    createWindow()

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
      }
    })
  })
  .catch((error) => {
    writeStartupLog('Application startup failed.', error)
    dialog.showErrorBox(
      'LabelForge Studio could not start',
      `${error instanceof Error ? error.message : String(error)}\n\nA diagnostic log was written to:\n${path.join(app.getPath('userData'), 'startup.log')}`
    )
    app.quit()
  })

process.on('uncaughtException', (error) => {
  writeStartupLog('Uncaught main-process error.', error)
  dialog.showErrorBox('LabelForge Studio error', error.message)
})

process.on('unhandledRejection', (error) => {
  writeStartupLog('Unhandled main-process rejection.', error)
})

app.on('window-all-closed', () => {
  closeDatabase()
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('before-quit', () => {
  closeDatabase()
})
