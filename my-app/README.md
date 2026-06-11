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

The app talks to two local services, both configurable from the in-app Setup
screen (and persisted to the Electron `userData` directory):

1. **Ollama** (required) at `http://localhost:11434` with the `phi4-mini`
   model by default. The Setup screen can download the model with progress.

   ```sh
   ollama serve
   ```

2. **Voice transcription** (recommended) — any OpenAI-compatible
   speech-to-text server (`POST /v1/audio/transcriptions`) at
   `http://localhost:8000` by default, such as Speaches,
   faster-whisper-server, or LM Studio with a Whisper model.

Environment variable overrides:

```sh
REACT_APP_OLLAMA_BASE_URL=http://localhost:11434
REACT_APP_OLLAMA_MODEL=phi4-mini
REACT_APP_OLLAMA_TEMPERATURE=0.3
REACT_APP_OLLAMA_CACHE=true
REACT_APP_TRANSCRIPTION_BASE_URL=http://localhost:8000
REACT_APP_TRANSCRIPTION_MODEL=whisper-1
```

Ollama configuration lives in [`src/config/ollama.ts`](src/config/ollama.ts),
transcription configuration in
[`src/config/transcription.ts`](src/config/transcription.ts), and the typed
service boundaries in [`src/services`](src/services).
