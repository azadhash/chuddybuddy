// Voice seam — browser Web Speech API only (no extra provider or key).
//
// Two directions: speech-to-text so the user can talk to Anchor, and
// text-to-speech so Anchor talks back. Everything is feature-detected, so on a
// browser without support the callers degrade to the typed composer.
//
// The `win` parameter (default `globalThis`) keeps these pure and unit-testable:
// tests inject a fake `SpeechRecognition` / `speechSynthesis`.

function recognitionCtor(win) {
  return win?.SpeechRecognition || win?.webkitSpeechRecognition || null;
}

export function isSpeechInputSupported(win = globalThis) {
  return Boolean(recognitionCtor(win));
}

export function isSpeechOutputSupported(win = globalThis) {
  return Boolean(win && 'speechSynthesis' in win && typeof win.SpeechSynthesisUtterance === 'function');
}

// Wrap a SpeechRecognition instance. Returns a small handle, or null if the
// browser has no recognition. One result/end pair per spoken turn
// (continuous = false), with interim results for a live transcript.
export function createRecognizer({ onResult, onError, onEnd, lang = 'en-US', win = globalThis } = {}) {
  const Ctor = recognitionCtor(win);
  if (!Ctor) return null;

  const recognition = new Ctor();
  recognition.lang = lang;
  recognition.interimResults = true;
  recognition.continuous = false;
  recognition.maxAlternatives = 1;

  recognition.onresult = (event) => {
    let interim = '';
    let final = '';
    for (let i = event.resultIndex; i < event.results.length; i++) {
      const result = event.results[i];
      if (result.isFinal) final += result[0].transcript;
      else interim += result[0].transcript;
    }
    onResult?.({ interim, final });
  };
  recognition.onerror = (event) => onError?.(event?.error || 'error');
  recognition.onend = () => onEnd?.();

  return {
    // start()/stop()/abort() can throw if called in the wrong state (e.g. start
    // while already running); swallow so callers stay simple.
    start() {
      try {
        recognition.start();
      } catch {
        /* already started */
      }
    },
    stop() {
      try {
        recognition.stop();
      } catch {
        /* already stopped */
      }
    },
    abort() {
      try {
        recognition.abort();
      } catch {
        /* nothing to abort */
      }
    },
  };
}

// Speak `text` aloud. Cancels anything in progress first so replies never
// overlap. Returns a cancel function; always resolves via onEnd (even when
// unsupported) so a conversation loop can advance.
export function speak(text, { onStart, onEnd, onError, lang = 'en-US', win = globalThis } = {}) {
  if (!isSpeechOutputSupported(win) || !text) {
    onEnd?.();
    return () => {};
  }
  const synth = win.speechSynthesis;
  const utterance = new win.SpeechSynthesisUtterance(text);
  utterance.lang = lang;
  utterance.onstart = () => onStart?.();
  utterance.onend = () => onEnd?.();
  utterance.onerror = () => {
    onError?.();
    onEnd?.();
  };
  synth.cancel();
  synth.speak(utterance);
  return () => synth.cancel();
}

export function cancelSpeech(win = globalThis) {
  if (isSpeechOutputSupported(win)) win.speechSynthesis.cancel();
}

// A human-readable line for the recognition error codes we surface.
export function speechErrorMessage(code) {
  switch (code) {
    case 'not-allowed':
    case 'service-not-allowed':
      return 'Microphone access is blocked. Allow it in your browser to talk to Anchor.';
    case 'audio-capture':
      return 'No microphone was found. Check your device and try again.';
    case 'network':
      return 'Speech recognition lost the network. Check your connection and try again.';
    default:
      return 'Something interrupted the microphone. Tap to start again.';
  }
}
