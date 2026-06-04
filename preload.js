const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    selectFolder: () => ipcRenderer.invoke('dialog:openDirectory'),
    saveToAppData: (fileInfo) => ipcRenderer.invoke('file:saveToAppData', fileInfo)
});