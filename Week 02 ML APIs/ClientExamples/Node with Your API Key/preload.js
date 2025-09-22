import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('replicateAPI', {
    generate: (payload) => ipcRenderer.invoke('generate', payload)
});


