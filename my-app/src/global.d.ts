declare module '*.css';

import type { FeynmanDesktopApi } from './desktop/api';

declare global {
    interface Window {
        feynman?: FeynmanDesktopApi;
    }
}
