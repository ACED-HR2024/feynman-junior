import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [react()],
        define: {
            'process.env.REACT_APP_OLLAMA_BASE_URL': JSON.stringify(env.REACT_APP_OLLAMA_BASE_URL),
            'process.env.REACT_APP_OLLAMA_MODEL': JSON.stringify(env.REACT_APP_OLLAMA_MODEL),
            'process.env.REACT_APP_OLLAMA_TEMPERATURE': JSON.stringify(env.REACT_APP_OLLAMA_TEMPERATURE),
            'process.env.REACT_APP_OLLAMA_CACHE': JSON.stringify(env.REACT_APP_OLLAMA_CACHE),
            'process.env.REACT_APP_OLLAMA_TIMEOUT_MS': JSON.stringify(env.REACT_APP_OLLAMA_TIMEOUT_MS),
            'process.env.REACT_APP_TRANSCRIPTION_BASE_URL': JSON.stringify(env.REACT_APP_TRANSCRIPTION_BASE_URL),
            'process.env.REACT_APP_TRANSCRIPTION_MODEL': JSON.stringify(env.REACT_APP_TRANSCRIPTION_MODEL),
        },
        test: {
            environment: 'jsdom',
            globals: true,
            setupFiles: './src/setupTests.ts',
        },
    };
});
