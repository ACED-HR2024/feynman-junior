# Voice Response Plan

Feynman Junior already supports browser speech recognition as a convenience for
entering explanations. The next voice milestone is stricter: learners should
answer generated questions verbally, then receive feedback on the transcribed
answers.

## Goals

- Require or strongly encourage spoken answers during the question stage.
- Transcribe answers into the existing `UserAnswer` shape before feedback
  generation.
- Keep the current typed answer flow as an accessibility fallback.
- Preserve local-first behavior when possible.

## Recommended Direction

Use a dedicated transcription boundary instead of coupling Whisper directly to
workflow state. A future implementation can expose a small service interface:

```ts
interface TranscriptionService {
    transcribe(audio: Blob): Promise<string>;
}
```

That boundary lets the app start with browser speech recognition, then swap in
local Whisper options such as `whisper.cpp`, `faster-whisper`, or an Ollama-side
speech model if the deployment target supports it.

## Product Flow

1. The learner reviews generated questions.
2. Each answer card records audio for one question.
3. The transcription service converts audio to text.
4. The learner can review or retry the transcript.
5. The existing feedback prompt receives the transcribed answers.

## Open Questions

- Should verbal answers be required, or should typing remain equally prominent?
- Should transcription run fully in-browser, through a local helper service, or
  through a hosted API?
- Do we store raw audio, transcripts only, or neither after feedback is
  generated?
- How should the UI handle long pauses, partial transcripts, and retry states?
