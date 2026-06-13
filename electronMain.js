const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { buffer } = require('stream/consumers');

const createWindow = () => {
  const win = new BrowserWindow({
    width: 550,
    height: 500,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.loadFile('public/index.html')
}

app.whenReady().then(() => {
  createWindow()
})

ipcMain.handle('file:saveToAppData', async (event, { fileName, fileData }) => {
  try {
    const localLibraryDir = path.join(app.getPath('userData'), 'downloads');
    await fs.promises.mkdir(localLibraryDir, {recursive: true});

    const targetPath = path.join(localLibraryDir, fileName);
    await fs.promises.writeFile(targetPath, Buffer.from(fileData));

    console.log("Saved transferred file")
    return {success: true, path: targetPath}
  } catch (err) {
    console.error('Failed to save transferred file')
    return {success: false, error: err.message}
  }
})

ipcMain.handle('file:updatePlaylist', async (event, playlistName, metadata) => {
  try {
    const appDataDir = app.getPath('userData');
    const realLocalPath = path.join(appDataDir, 'downloads', metadata.fileName);
    metadata.filePath = realLocalPath

    console.log('Metadata and playlistname received: ', playlistName, metadata);
  } catch (err) {
    console.log(err);
  }
})