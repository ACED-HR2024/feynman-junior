import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import AnswerStage from './AnswerStage';
import ExplanationStage from './ExplanationStage';
import { Audience, GeneratedQuestion } from '../../types/session';

const audience: Audience = {
    id: 'middle',
    label: 'Middle school kids',
    description: 'Students ready for basic abstractions.',
    promptGuidance: 'Use plain language.',
};

const questions: GeneratedQuestion[] = [
    { id: 'question-1', prompt: 'Why does it work?' },
    { id: 'question-2', prompt: 'Can you give an example?' },
];

class MediaRecorderStub {
    static isTypeSupported = () => true;

    state = 'inactive';

    start = vi.fn();

    stop = vi.fn();
}

beforeEach(() => {
    vi.stubGlobal('MediaRecorder', MediaRecorderStub);
    Object.defineProperty(navigator, 'mediaDevices', {
        configurable: true,
        value: { getUserMedia: vi.fn() },
    });
});

describe('voice-first stages', () => {
    it('renders a voice recorder per question with an editable transcript', () => {
        render(
            <AnswerStage
                questions={questions}
                onSubmit={vi.fn()}
                onBack={vi.fn()}
            />,
        );

        expect(screen.getAllByRole('button', { name: 'Record Answer' })).toHaveLength(2);
        expect(screen.getAllByPlaceholderText(/Your spoken answer appears here/)).toHaveLength(2);
    });

    it('submits typed transcript edits as answers', async () => {
        const user = userEvent.setup();
        const onSubmit = vi.fn();

        render(
            <AnswerStage
                questions={questions}
                onSubmit={onSubmit}
                onBack={vi.fn()}
            />,
        );

        await user.type(screen.getByLabelText('Why does it work?'), 'Because of gravity.');
        await user.click(screen.getByRole('button', { name: 'Get Feedback' }));

        expect(onSubmit).toHaveBeenCalledWith([
            { questionId: 'question-1', answer: 'Because of gravity.' },
            { questionId: 'question-2', answer: '' },
        ]);
    });

    it('keeps Generate Questions disabled until a transcript exists', async () => {
        const user = userEvent.setup();

        render(
            <ExplanationStage
                audience={audience}
                onSubmit={vi.fn()}
                onChangeAudience={vi.fn()}
            />,
        );

        expect(screen.getByRole('button', { name: 'Record Explanation' })).toBeInTheDocument();

        const generate = screen.getByRole('button', { name: 'Generate Questions' });
        expect(generate).toBeDisabled();

        await user.type(screen.getByLabelText(/Transcript/), 'Gravity pulls things down.');
        expect(generate).toBeEnabled();
    });
});
