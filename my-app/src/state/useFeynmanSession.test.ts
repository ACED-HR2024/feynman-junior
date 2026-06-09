import { act, renderHook } from '@testing-library/react';
import { useFeynmanSession } from './useFeynmanSession';
import { ollamaService } from '../services/ollamaService';

jest.mock('../services/ollamaService', () => ({
    ollamaService: {
        primeAudience: jest.fn(),
        generateQuestions: jest.fn(),
        generateFeedback: jest.fn(),
    },
    OllamaServiceError: class OllamaServiceError extends Error {
        code: string;

        constructor(code: string, message: string) {
            super(message);
            this.code = code;
        }
    },
}));

const mockedOllamaService = ollamaService as jest.Mocked<typeof ollamaService>;

describe('useFeynmanSession', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('selects an audience and advances to explanation after priming', async () => {
        mockedOllamaService.primeAudience.mockResolvedValue();
        const { result } = renderHook(() => useFeynmanSession());

        await act(async () => {
            await result.current.selectAudience('elementary');
        });

        expect(result.current.session.audience?.id).toBe('elementary');
        expect(result.current.session.stage).toBe('submitExplanation');
    });

    it('generates questions and moves to question review', async () => {
        mockedOllamaService.primeAudience.mockResolvedValue();
        mockedOllamaService.generateQuestions.mockResolvedValue({
            questions: [{ id: 'question-1', prompt: 'Why does this happen?' }],
            nextSteps: [],
        });

        const { result } = renderHook(() => useFeynmanSession());

        await act(async () => {
            await result.current.selectAudience('middle');
        });

        await act(async () => {
            await result.current.submitExplanation('Gravity', 'Gravity pulls objects together.');
        });

        expect(result.current.session.stage).toBe('reviewQuestions');
        expect(result.current.session.questions[0].prompt).toBe('Why does this happen?');
    });

    it('generates feedback from collected answers', async () => {
        mockedOllamaService.primeAudience.mockResolvedValue();
        mockedOllamaService.generateQuestions.mockResolvedValue({
            questions: [{ id: 'question-1', prompt: 'Why does this happen?' }],
            nextSteps: [],
        });
        mockedOllamaService.generateFeedback.mockResolvedValue({
            feedback: {
                clarity: 'Clear.',
                strengths: ['Concrete language'],
                missingConcepts: [],
                simplificationTips: [],
                nextSteps: ['Add an example'],
            },
        });

        const { result } = renderHook(() => useFeynmanSession());

        await act(async () => {
            await result.current.selectAudience('high');
        });

        await act(async () => {
            await result.current.submitExplanation('Gravity', 'Gravity pulls objects together.');
        });

        await act(async () => {
            await result.current.submitAnswers([{ questionId: 'question-1', answer: 'Mass bends spacetime.' }]);
        });

        expect(result.current.session.stage).toBe('reviewFeedback');
        expect(result.current.session.feedback?.clarity).toBe('Clear.');
    });
});
