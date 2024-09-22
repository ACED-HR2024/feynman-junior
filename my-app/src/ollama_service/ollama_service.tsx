import { BaseMessage, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOllama } from "@langchain/ollama";


class OllamaService {
    private ollama: ChatOllama;
    constructor() {
        this.ollama = new ChatOllama({
            baseUrl: 'http://localhost:11434',
            model: 'phi3',
            temperature: 1,
            cache: true,
        })
    }
    
    async primeOllama(primePrompt: string): Promise<void> {
        try {
            const systemMessage = new SystemMessage(primePrompt);
            await this.ollama.invoke([systemMessage]);
            console.log('Ollama primed with system prompt');
          } catch (error) {
            console.error('Error priming Ollama:', error);
            throw error;
          }
    }

    async sendMessage(message: string): Promise<string> {
        try {
            const realMessage = new HumanMessage(message);
            const response = await this.ollama.invoke([realMessage]);
            return response.content as string;
        } catch (error) {
            console.error('Error trying to send a message', error);
            throw error;
        }
    }

}


export const ollamaService = new OllamaService();