import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";

class OllamaService {
    private ollama: ChatOllama;
    private systemMessage: SystemMessage | null = null;

    constructor() {
        this.ollama = new ChatOllama({
            baseUrl: 'http://localhost:11434',
            model: 'phi3',
            temperature: 1,
            cache: true,
        });
    }

    async primeOllama(primePrompt: string): Promise<void> {
        try {
            this.systemMessage = new SystemMessage(primePrompt);
            await this.ollama.invoke([this.systemMessage]);
            console.log('Ollama primed with system prompt');
        } catch (error) {
            console.error('Error priming Ollama:', error);
            this.systemMessage = null;
            throw error;
        }
    }

    async sendMessage(message: string): Promise<string> {
        if (!this.systemMessage) {
            throw new Error('Ollama has not been primed. Please prime Ollama before sending messages.');
        }

        try {
            const humanMessage = new HumanMessage(message);
            const response = await this.ollama.invoke([this.systemMessage, humanMessage]);
            return response.content as string;
        } catch (error) {
            console.error('Error trying to send a message', error);
            throw error;
        }
    }

    isPrimed(): boolean {
        return this.systemMessage !== null;
    }
}

export const ollamaService = new OllamaService();