import 'dotenv/config';
import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Replicate from 'replicate';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow = null;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            contextIsolation: true,
            preload: path.join(__dirname, 'preload.cjs')
        }
    });

    mainWindow.loadFile(path.join(__dirname, 'public', 'index.html'));

    // Open DevTools for easier debugging
    mainWindow.webContents.openDevTools({ mode: 'detach' });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.whenReady().then(() => {
    createWindow();
    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

ipcMain.handle('generate', async (_event, payload) => {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    if (!apiToken) {
        return { error: 'Missing REPLICATE_API_TOKEN in .env' };
    }

    const replicate = new Replicate({ auth: apiToken, apiToken });

    const prompt = (payload?.prompt || '').toString();
    if (!prompt) return { error: 'prompt is required' };
    const model = (payload?.model || process.env.REPLICATE_MODEL || 'black-forest-labs/flux-dev').toString();

    try {
        const output = await replicate.run(model, { input: { prompt } });
        const urls = Array.isArray(output)
            ? output
            : (typeof output === 'string'
                ? [output]
                : (output && output.output
                    ? (Array.isArray(output.output) ? output.output : [output.output])
                    : []));
        return { output: urls };
    } catch (err) {
        const message = err?.message || 'Unknown error';
        console.error('Replicate error:', message);
        return { error: message };
    }
});

// Generic bridge to allow window.replicate.run(model, { input }) from the renderer
ipcMain.handle('replicate.run', async (_event, { model, options }) => {
    const apiToken = process.env.REPLICATE_API_TOKEN;
    const replicate = new Replicate({ auth: apiToken, apiToken });
    try {
        const result = await replicate.run(model, options);
        return result;
    } catch (err) {
        return { error: err?.message || String(err) };
    }
});


