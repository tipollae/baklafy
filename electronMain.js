const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');

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

ipcMain.handle('dialog:openDirectory', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory'] //restrict to folder inputs
  });

  if (canceled) {
    return null;
  } else {
    return filePaths[0];
  }
});