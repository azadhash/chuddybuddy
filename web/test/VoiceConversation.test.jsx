import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import VoiceConversation from '../src/components/VoiceConversation.jsx';

let recInstances;

function installSpeechGlobals() {
  recInstances = [];
  globalThis.SpeechRecognition = class {
    constructor() {
      this.start = vi.fn();
      this.stop = vi.fn();
      this.abort = vi.fn();
      recInstances.push(this);
    }
  };
  globalThis.speechSynthesis = {
    speak: vi.fn((u) => {
      globalThis.speechSynthesis._last = u;
    }),
    cancel: vi.fn(),
  };
  globalThis.SpeechSynthesisUtterance = class {
    constructor(text) {
      this.text = text;
    }
  };
}

function removeSpeechGlobals() {
  delete globalThis.SpeechRecognition;
  delete globalThis.speechSynthesis;
  delete globalThis.SpeechSynthesisUtterance;
}

// Simulate the user speaking a final phrase, then the recognizer ending the turn.
async function speakAndEnd(rec, transcript) {
  act(() => {
    rec.onresult({
      resultIndex: 0,
      results: [Object.assign([{ transcript }], { isFinal: true })],
    });
  });
  await act(async () => {
    rec.onend();
  });
}

describe('VoiceConversation', () => {
  afterEach(() => removeSpeechGlobals());

  it('degrades to a note (and no controls) when speech recognition is unsupported', () => {
    removeSpeechGlobals();
    render(<VoiceConversation onSend={vi.fn()} />);
    expect(screen.getByText(/needs a browser with speech recognition/i)).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('runs the listen → send → speak → listen loop hands-free', async () => {
    installSpeechGlobals();
    const onSend = vi.fn().mockResolvedValue('I hear that this is heavy.');
    render(<VoiceConversation onSend={onSend} />);

    await userEvent.click(screen.getByRole('button', { name: /start voice conversation/i }));
    expect(screen.getByRole('status')).toHaveTextContent(/listening/i);

    const rec = recInstances[0];
    expect(rec.start).toHaveBeenCalledTimes(1);

    await speakAndEnd(rec, 'I feel anxious about my exam');
    expect(onSend).toHaveBeenCalledWith('I feel anxious about my exam');

    // The reply is spoken aloud.
    await waitFor(() => expect(globalThis.speechSynthesis.speak).toHaveBeenCalledTimes(1));
    expect(globalThis.speechSynthesis._last.text).toBe('I hear that this is heavy.');
    expect(screen.getByRole('status')).toHaveTextContent(/anchor is speaking/i);

    // When Anchor finishes speaking, it listens again automatically.
    act(() => globalThis.speechSynthesis._last.onend());
    await waitFor(() => expect(rec.start).toHaveBeenCalledTimes(2));

    await userEvent.click(screen.getByRole('button', { name: /end voice conversation/i }));
    expect(rec.abort).toHaveBeenCalled();
  });

  it('surfaces a blocked-microphone error and stops', async () => {
    installSpeechGlobals();
    render(<VoiceConversation onSend={vi.fn()} />);

    await userEvent.click(screen.getByRole('button', { name: /start voice conversation/i }));
    act(() => recInstances[0].onerror({ error: 'not-allowed' }));

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent(/microphone access is blocked/i);
    expect(screen.getByRole('button', { name: /start voice conversation/i })).toBeInTheDocument();
  });
});
