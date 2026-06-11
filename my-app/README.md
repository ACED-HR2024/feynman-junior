# Feynman Junior App

This directory contains the React and TypeScript app for Feynman Junior. See
the root [`README.md`](../README.md) for the full project overview, setup
requirements, architecture notes, limitations, and v2 roadmap.

## Available Scripts

Run these commands from this directory.

### `npm start`

Runs the Electron app in development mode with Vite-powered renderer reloads.

### `npm run web`

Runs only the React renderer in a browser for quick UI iteration.

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

## Local Ollama Requirement

The app expects Ollama to be running at `http://localhost:11434` with the
`phi4-mini` model available by default:

```sh
ollama pull phi4-mini
ollama serve
```

These defaults can be overridden with Create React App environment variables:

```sh
REACT_APP_OLLAMA_BASE_URL=http://localhost:11434
REACT_APP_OLLAMA_MODEL=phi4-mini
REACT_APP_OLLAMA_TEMPERATURE=0.3
REACT_APP_OLLAMA_CACHE=true
```

Ollama configuration lives in [`src/config/ollama.ts`](src/config/ollama.ts),
and the typed service boundary lives in
[`src/services/ollamaService.ts`](src/services/ollamaService.ts).
