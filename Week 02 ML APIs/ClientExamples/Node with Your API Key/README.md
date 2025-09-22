# Node with Your API Key (GUI)

This is a desktop app built with Electron that calls the Replicate Node SDK and shows a minimal GUI. It auto-generates on load and displays the image on a canvas (no prompt input or file saving).

## Setup

1. Inside this folder, install dependencies:

```bash
npm install
```

2. Create a `.env` with your Replicate token:

```bash
# .env
REPLICATE_API_TOKEN=your_replicate_api_token_here
REPLICATE_MODEL=black-forest-labs/flux-dev
```

> Note: `.env` is git-ignored.

## Run (Desktop)

```bash
npm start
```

The Electron window will open. Type a prompt and click Generate.

## Project structure

- `main.js` – Electron main process (creates window, calls Replicate)
- `preload.cjs` – Safe bridge exposing `window.replicateAPI.generate()`
- `public/index.html` – UI with prompt input + canvas; click Generate to run

## CLI (optional)

You can also use the CLI script to download outputs to `outputs/`:

```bash
npm run cli -- --prompt "A student trying to learn how use a machine learning API"
```


