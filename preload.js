const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    saveToAppData: (fileInfo) => ipcRenderer.invoke('file:saveToAppData', fileInfo),
    updatePlaylist: (playlistName, metadata) => 
        ipcRenderer.invoke('file:updatePlaylist', playlistName, metadata),
});