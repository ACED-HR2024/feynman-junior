# Feynman Junior App

This directory contains the React, TypeScript, and Electron app for Feynman
Junior. See the root [`README.md`](../README.md) for the full project
overview, setup requirements, architecture notes, limitations, and roadmap.

## Available Scripts

Run these commands from this directory.

### `npm start`

Runs the Electron app in development mode with Vite-powered renderer reloads.

### `npm run web`

Runs only the React renderer in a browser for quick UI iteration. Desktop-only
features (persisted config, model download progress over IPC, main-process
transcription) fall back to direct `fetch` calls against the local services.

### `npm test`

Runs the Vitest suite once.

For watch mode:

```sh
npm run test:watch
```

### `npm run build`

Builds the Electron main, preload, and renderer bundles into `out`.

### `npm run package`

Assembles a local packaged Electron app directory in `release`.

## Local AI Services

The app needs only **one** external service:

1. **Ollama** (required) at `http://localhost:11434` with the `phi4-mini`
   model by default. The in-app Setup screen can download the model with
   progress, and the choice is persisted to the Electron `userData` directory.

   ```sh
   ollama serve
   ```

**Voice transcription runs entirely on-device** in the renderer via
[MoonshineJS](https://dev.moonshine.ai/) — there is no second server to install
or run. The `tiny` speech model downloads once from Moonshine's CDN on your
first recording, then works offline. Typing into the transcript remains
available as a fallback.

Environment variable overrides:

```sh
REACT_APP_OLLAMA_BASE_URL=http://localhost:11434
REACT_APP_OLLAMA_MODEL=phi4-mini
REACT_APP_OLLAMA_TEMPERATURE=0.3
REACT_APP_OLLAMA_CACHE=true
REACT_APP_OLLAMA_TIMEOUT_MS=120000
```

Ollama configuration lives in [`src/config/ollama.ts`](src/config/ollama.ts),
on-device transcription in
[`src/services/voiceTranscriber.ts`](src/services/voiceTranscriber.ts), and the
typed service boundaries in [`src/services`](src/services).
