import { SessionErrorCode } from '../types/session';

export class OllamaServiceError extends Error {
    code: SessionErrorCode;

    constructor(code: SessionErrorCode, message: string) {
        super(message);
        this.name = 'OllamaServiceError';
        this.code = code;
    }
}
