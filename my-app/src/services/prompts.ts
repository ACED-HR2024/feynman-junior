import { Audience, AudienceId, LearningSession, UserAnswer } from '../types/session';

export const AUDIENCES: Audience[] = [
    {
        id: 'elementary',
        label: 'Elementary school kids',
        description: 'Young learners who need concrete examples and simple language.',
        promptGuidance: 'Use very simple words, everyday analogies, and curious why/how questions.',
    },
    {
        id: 'middle',
        label: 'Middle school kids',
        description: 'Students ready for basic abstractions and step-by-step reasoning.',
        promptGuidance: 'Use plain language, ask for examples, and probe missing cause-and-effect links.',
    },
    {
        id: 'high',
        label: 'High school kids',
        description: 'Learners who can handle more detail but still need clear scaffolding.',
        promptGuidance: 'Ask about definitions, assumptions, examples, and how the pieces connect.',
    },
    {
        id: 'undergraduate',
        label: 'Undergraduate students',
        description: 'College learners who can handle technical vocabulary with explanation.',
        promptGuidance: 'Ask about mechanisms, trade-offs, evidence, and common misconceptions.',
    },
    {
        id: 'graduate',
        label: 'Graduate students',
        description: 'Advanced learners who expect nuance and precise reasoning.',
        promptGuidance: 'Ask rigorous questions about edge cases, limitations, and deeper implications.',
    },
    {
        id: 'professionals',
        label: 'Professionals',
        description: 'Practitioners who care about application, constraints, and decisions.',
        promptGuidance: 'Ask practical questions about use cases, risks, implementation, and impact.',
    },
];

export const getAudienceById = (audienceId: AudienceId): Audience => {
    const audience = AUDIENCES.find((option) => option.id === audienceId);

    if (!audience) {
        throw new Error(`Unknown audience: ${audienceId}`);
    }

    return audience;
};

export const buildPrimePrompt = (audience: Audience): string => (
    `You are ${audience.label}. ${audience.promptGuidance} ` +
    'You are helping a learner practice the Feynman Technique. ' +
    'After reading their explanation, ask questions that reveal what is unclear.'
);

export const buildQuestionPrompt = (audience: Audience, topic: string, explanation: string): string => `
You are ${audience.label}. ${audience.promptGuidance}

The learner is practicing the Feynman Technique.

Topic: ${topic || 'Not specified'}

Learner explanation:
${explanation}

Return only valid JSON with this shape:
{
  "questions": [
    {
      "prompt": "A clear audience-specific question",
      "reason": "What this question tests"
    }
  ],
  "nextSteps": ["A short next action for the learner"]
}

Generate exactly 4 questions. Do not include markdown fences or extra text.
`;

export const buildFeedbackPrompt = (
    session: LearningSession,
    answers: UserAnswer[],
): string => `
You are reviewing a Feynman Technique practice session for ${session.audience?.label}.

Topic: ${session.topic || 'Not specified'}

Original explanation:
${session.explanation}

Questions and answers:
${session.questions.map((question) => {
    const answer = answers.find((item) => item.questionId === question.id)?.answer || 'No answer provided.';
    return `Question: ${question.prompt}\nAnswer: ${answer}`;
}).join('\n\n')}

Return only valid JSON with this shape:
{
  "feedback": {
    "clarity": "Brief overall clarity assessment",
    "strengths": ["What the learner explained well"],
    "missingConcepts": ["Concepts or assumptions that need work"],
    "simplificationTips": ["Ways to simplify the explanation"],
    "nextSteps": ["Concrete next actions"]
  }
}

Do not include markdown fences or extra text.
`;
