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

  win.loadFile('public/createAccount/index.html')
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
    //set metadata filepath for reference
    metadata.filePath = realLocalPath

    //Get playlist directory and find JSON file. Create baklafy/playlists if not existent
    const localPlaylistDir = path.join(app.getPath('userData'), 'playlists');
    const playlistFilePath = path.join(localPlaylistDir, `${playlistName}.json`)

    await fs.promises.mkdir(localPlaylistDir, {recursive: true});
    let playlistData = {};

    if (fs.existsSync(playlistFilePath)) {
      const fileContent = await fs.promises.readFile(playlistFilePath, 'utf8');

      if (fileContent.trim()) {
        playlistData = JSON.parse(fileContent);
      }
    }

    // prevent duplicate downloads
    playlistData[metadata.id] = {
        title: metadata.title,
        author: metadata.uploader,
        date: metadata.date,
        thumbnail: metadata.thumbnail,
        filePath: metadata.filePath
    };  

    await fs.promises.writeFile(playlistFilePath, JSON.stringify(playlistData, null, 2), 'utf8');
    return { success: true, message: 'Playlist updated successfully' };

 } catch (err) {
    console.log(err);
    return { success: false, error: err.message };
  }
})