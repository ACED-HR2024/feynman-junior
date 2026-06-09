# Feynman Junior App

This directory contains the React and TypeScript app for Feynman Junior. See
the root [`README.md`](../README.md) for the full project overview, setup
requirements, architecture notes, limitations, and v2 roadmap.

## Available Scripts

Run these commands from this directory.

### `npm start`

Runs the app in development mode. Open
[http://localhost:3000](http://localhost:3000) to view it in the browser.

The page reloads when files change, and lint errors appear in the console.

### `npm test`

Launches the Create React App test runner in interactive watch mode.

For a one-time test run:

```sh
npm test -- --watchAll=false
```

### `npm run build`

Builds the app for production to the `build` folder.

### `npm run eject`

This is a one-way operation. Avoid ejecting unless the project intentionally
moves away from Create React App.

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
