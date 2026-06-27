import { describe, it, expect, vi } from 'vitest';
import {
  isSpeechInputSupported,
  isSpeechOutputSupported,
  createRecognizer,
  speak,
  cancelSpeech,
  speechErrorMessage,
} from '../src/lib/voice.js';

// A controllable fake SpeechRecognition: each instance records itself so the
// test can fire its event handlers.
function fakeRecognitionEnv() {
  const instances = [];
  class FakeRecognition {
    constructor() {
      this.start = vi.fn();
      this.stop = vi.fn();
      this.abort = vi.fn();
      instances.push(this);
    }
  }
  return { SpeechRecognition: FakeRecognition, _instances: instances };
}

// A fake speechSynthesis that keeps the last utterance so the test can drive it.
function fakeSynthEnv() {
  const win = {
    speechSynthesis: { speak: vi.fn((u) => (win._last = u)), cancel: vi.fn() },
    SpeechSynthesisUtterance: class {
      constructor(text) {
        this.text = text;
      }
    },
  };
  return win;
}

describe('voice feature detection', () => {
  it('reports no input/output support on a bare environment', () => {
    expect(isSpeechInputSupported({})).toBe(false);
    expect(isSpeechOutputSupported({})).toBe(false);
  });

  it('detects input support via the prefixed constructor too', () => {
    expect(isSpeechInputSupported({ webkitSpeechRecognition: class {} })).toBe(true);
  });

  it('detects output support', () => {
    expect(isSpeechOutputSupported(fakeSynthEnv())).toBe(true);
  });
});

describe('createRecognizer', () => {
  it('returns null when recognition is unsupported', () => {
    expect(createRecognizer({ win: {} })).toBe(null);
  });

  it('splits interim and final transcripts and forwards them', () => {
    const env = fakeRecognitionEnv();
    const onResult = vi.fn();
    const rec = createRecognizer({ win: env, onResult });
    const instance = env._instances[0];

    instance.onresult({
      resultIndex: 0,
      results: [Object.assign([{ transcript: 'I feel stuck' }], { isFinal: true })],
    });
    expect(onResult).toHaveBeenCalledWith({ interim: '', final: 'I feel stuck' });

    instance.onresult({
      resultIndex: 0,
      results: [Object.assign([{ transcript: 'thinking' }], { isFinal: false })],
    });
    expect(onResult).toHaveBeenLastCalledWith({ interim: 'thinking', final: '' });

    rec.start();
    expect(instance.start).toHaveBeenCalled();
  });

  it('maps error events and end through the callbacks', () => {
    const env = fakeRecognitionEnv();
    const onError = vi.fn();
    const onEnd = vi.fn();
    createRecognizer({ win: env, onError, onEnd });
    const instance = env._instances[0];

    instance.onerror({ error: 'not-allowed' });
    expect(onError).toHaveBeenCalledWith('not-allowed');
    instance.onend();
    expect(onEnd).toHaveBeenCalled();
  });
});

describe('speak', () => {
  it('cancels then speaks, and resolves via onEnd', () => {
    const win = fakeSynthEnv();
    const onEnd = vi.fn();
    speak('You sound exhausted.', { win, onEnd });

    expect(win.speechSynthesis.cancel).toHaveBeenCalled();
    expect(win.speechSynthesis.speak).toHaveBeenCalledTimes(1);
    expect(win._last.text).toBe('You sound exhausted.');

    win._last.onend();
    expect(onEnd).toHaveBeenCalled();
  });

  it('calls onEnd immediately and does not speak when unsupported or empty', () => {
    const onEnd = vi.fn();
    expect(speak('hi', { win: {}, onEnd })).toBeTypeOf('function');
    expect(onEnd).toHaveBeenCalledTimes(1);

    const win = fakeSynthEnv();
    speak('', { win, onEnd });
    expect(win.speechSynthesis.speak).not.toHaveBeenCalled();
  });
});

describe('cancelSpeech', () => {
  it('cancels when supported and is a no-op otherwise', () => {
    const win = fakeSynthEnv();
    cancelSpeech(win);
    expect(win.speechSynthesis.cancel).toHaveBeenCalled();
    expect(() => cancelSpeech({})).not.toThrow();
  });
});

describe('speechErrorMessage', () => {
  it('explains blocked microphone permission', () => {
    expect(speechErrorMessage('not-allowed')).toMatch(/blocked/i);
  });

  it('falls back to a generic, actionable message', () => {
    expect(speechErrorMessage('weird-code')).toMatch(/tap to start/i);
  });
});
