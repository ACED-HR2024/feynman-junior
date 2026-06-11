import { resolve } from 'path';
import { defineConfig, externalizeDepsPlugin } from 'electron-vite';
import react from '@vitejs/plugin-react';
import { loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        main: {
            plugins: [externalizeDepsPlugin()],
            build: {
                rollupOptions: {
                    input: {
                        index: resolve(__dirname, 'electron/main.ts'),
                    },
                },
            },
        },
        preload: {
            plugins: [externalizeDepsPlugin()],
            build: {
                rollupOptions: {
                    input: {
                        index: resolve(__dirname, 'electron/preload.ts'),
                    },
                },
            },
        },
        renderer: {
            root: '.',
            plugins: [react()],
            define: {
                'process.env.REACT_APP_OLLAMA_BASE_URL': JSON.stringify(env.REACT_APP_OLLAMA_BASE_URL),
                'process.env.REACT_APP_OLLAMA_MODEL': JSON.stringify(env.REACT_APP_OLLAMA_MODEL),
                'process.env.REACT_APP_OLLAMA_TEMPERATURE': JSON.stringify(env.REACT_APP_OLLAMA_TEMPERATURE),
                'process.env.REACT_APP_OLLAMA_CACHE': JSON.stringify(env.REACT_APP_OLLAMA_CACHE),
            },
            build: {
                rollupOptions: {
                    input: {
                        index: resolve(__dirname, 'index.html'),
                    },
                },
            },
        },
    };
});
