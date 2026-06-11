import { describe, expect, it } from 'vitest';
import { OllamaServiceError } from './ollamaErrors';
import {
    parseFeedbackGenerationResult,
    parseQuestionGenerationResult,
} from './ollamaParsers';

describe('ollamaService parsers', () => {
    it('parses generated questions from JSON', () => {
        const result = parseQuestionGenerationResult(JSON.stringify({
            questions: [
                { prompt: 'What does this mean?', reason: 'Tests clarity.' },
                { prompt: 'Can you give an example?' },
            ],
            nextSteps: ['Answer each question.'],
        }));

        expect(result.questions).toHaveLength(2);
        expect(result.questions[0]).toEqual({
            id: 'question-1',
            prompt: 'What does this mean?',
            reason: 'Tests clarity.',
        });
        expect(result.nextSteps).toEqual(['Answer each question.']);
    });

    it('parses feedback from fenced JSON', () => {
        const result = parseFeedbackGenerationResult(`
\`\`\`json
{
  "feedback": {
    "clarity": "Clear overall.",
    "strengths": ["Good analogy"],
    "missingConcepts": ["Definition"],
    "simplificationTips": ["Use shorter sentences"],
    "nextSteps": ["Revise intro"]
  }
}
\`\`\`
        `);

        expect(result.feedback.clarity).toBe('Clear overall.');
        expect(result.feedback.strengths).toEqual(['Good analogy']);
        expect(result.feedback.nextSteps).toEqual(['Revise intro']);
    });

    it('throws a typed error for malformed question output', () => {
        expect(() => parseQuestionGenerationResult('not json')).toThrow(OllamaServiceError);
    });

    it('tolerates trailing commas in model JSON', () => {
        const result = parseQuestionGenerationResult(`{
            "questions": [
                { "prompt": "What does this mean?", },
            ],
            "nextSteps": ["Answer each question.",],
        }`);

        expect(result.questions).toHaveLength(1);
        expect(result.questions[0].prompt).toBe('What does this mean?');
        expect(result.nextSteps).toEqual(['Answer each question.']);
    });
});
