'use strict'

const { app, protocol, BrowserWindow, ipcMain, dialog } = require('electron')
const { createProtocol } = require('vue-cli-plugin-electron-builder/lib')
const installExtension = require('electron-devtools-installer').default
const { VUEJS3_DEVTOOLS } = require('electron-devtools-installer')
const fs = require('fs')
const path = require('path')

const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'app', privileges: { secure: true, standard: true } }
])

async function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {

      // Use pluginOptions.nodeIntegration, leave this alone
      // See nklayman.github.io/vue-cli-plugin-electron-builder/guide/security.html#node-integration for more info
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  if (process.env.WEBPACK_DEV_SERVER_URL) {
    // Load the url of the dev server if in development mode
    await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL)
    if (!process.env.IS_TEST) win.webContents.openDevTools()
  } else {
    createProtocol('app')
    // Load the index.html when not in development
    win.loadURL('app://./index.html')
  }
}

// Quit when all windows are closed.
app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', async () => {
  if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
    try {
      await installExtension(VUEJS3_DEVTOOLS)
    } catch (e) {
      console.error('Vue Devtools failed to install:', e.toString())
    }
  }
  createWindow()
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
  if (process.platform === 'win32') {
    process.on('message', (data) => {
      if (data === 'graceful-exit') {
        app.quit()
      }
    })
  } else {
    process.on('SIGTERM', () => {
      app.quit()
    })
  }
}

// 添加 IPC 处理程序
ipcMain.handle('open-directory', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (!result.canceled) {
      const dirPath = result.filePaths[0]
      const files = fs.readdirSync(dirPath).map(fileName => {
        const filePath = path.join(dirPath, fileName)
        const stats = fs.statSync(filePath)
        return {
          name: fileName,
          isDirectory: stats.isDirectory(),
          size: stats.isDirectory() ? '-' : stats.size
        }
      })

      return {
        success: true,
        path: dirPath,
        files: files
      }
    }

    return {
      success: false,
      error: 'User cancelled'
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
})

// 添加新的 IPC 处理程序
ipcMain.handle('read-directory', async (event, dirPath) => {
  try {
    const files = fs.readdirSync(dirPath).map(fileName => {
      const filePath = path.join(dirPath, fileName)
      const stats = fs.statSync(filePath)
      return {
        name: fileName,
        isDirectory: stats.isDirectory(),
        size: stats.isDirectory() ? '-' : stats.size,
        path: filePath
      }
    })

    return {
      success: true,
      path: dirPath,
      files: files
    }
  } catch (err) {
    return {
      success: false,
      error: err.message
    }
  }
})
