const { contextBridge, ipcRenderer } = require('electron');

// Legacy API used earlier
contextBridge.exposeInMainWorld('replicateAPI', {
    generate: (payload) => ipcRenderer.invoke('generate', payload)
});

// Thin bridge to mimic Replicate.run usage from the renderer
contextBridge.exposeInMainWorld('replicate', {
    run: (model, options) => ipcRenderer.invoke('replicate.run', { model, options })
});


