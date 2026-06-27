import { useEffect, useRef, useState } from 'react';
import {
  isSpeechInputSupported,
  isSpeechOutputSupported,
  createRecognizer,
  speak,
  cancelSpeech,
  speechErrorMessage,
} from '../lib/voice.js';

// How many silent listens in a row before we stop and wait for the user, so an
// empty room doesn't spin the microphone forever.
const MAX_SILENT_TURNS = 3;

const PHASE_LABEL = {
  listening: "Listening… talk to Anchor, then pause when you're done.",
  thinking: 'Anchor is thinking…',
  speaking: 'Anchor is speaking…',
};

// Hands-free voice conversation. The loop is: listen → transcribe → send →
// speak the reply → listen again, until the user ends it. `onSend(text)` must
// return the assistant's reply text (App.handleSend does). Speech runs entirely
// in the browser (Web Speech API); with no support, this renders a short note
// and the typed composer below remains the way to talk.
export default function VoiceConversation({ onSend }) {
  const supported = isSpeechInputSupported();
  const canSpeak = isSpeechOutputSupported();

  const [active, setActive] = useState(false);
  const [phase, setPhase] = useState('idle'); // 'listening' | 'thinking' | 'speaking'
  const [heard, setHeard] = useState('');
  const [error, setError] = useState('');

  // Refs hold the values the recognizer callbacks read, so those long-lived
  // closures never see stale state.
  const recognizerRef = useRef(null);
  const activeRef = useRef(false);
  const heardRef = useRef('');
  const silentTurnsRef = useRef(0);

  // Tear everything down on unmount.
  useEffect(
    () => () => {
      activeRef.current = false;
      recognizerRef.current?.abort();
      cancelSpeech();
    },
    [],
  );

  function listen() {
    heardRef.current = '';
    setHeard('');
    setPhase('listening');
    recognizerRef.current?.start();
  }

  function stop() {
    activeRef.current = false;
    setActive(false);
    setPhase('idle');
    setHeard('');
    recognizerRef.current?.abort();
    cancelSpeech();
  }

  function start() {
    setError('');
    silentTurnsRef.current = 0;
    activeRef.current = true;
    setActive(true);
    recognizerRef.current = createRecognizer({
      onResult: ({ interim, final }) => {
        heardRef.current = final || interim;
        setHeard(heardRef.current);
      },
      onError: (code) => {
        // no-speech / aborted are part of normal turn-taking; onEnd handles them.
        if (code === 'no-speech' || code === 'aborted') return;
        setError(speechErrorMessage(code));
        stop();
      },
      onEnd: handleTurnEnd,
    });
    listen();
  }

  async function handleTurnEnd() {
    if (!activeRef.current) return;
    const text = heardRef.current.trim();
    heardRef.current = '';

    if (!text) {
      silentTurnsRef.current += 1;
      if (silentTurnsRef.current >= MAX_SILENT_TURNS) {
        setError("I didn't catch anything. Tap to start the conversation again.");
        stop();
        return;
      }
      listen();
      return;
    }

    silentTurnsRef.current = 0;
    setPhase('thinking');
    setHeard(text);
    try {
      const reply = await onSend(text);
      if (!activeRef.current) return;
      setPhase('speaking');
      speak(reply, {
        onEnd: () => {
          if (activeRef.current) listen();
        },
      });
    } catch (err) {
      if (!activeRef.current) return;
      setError(err?.message || 'Something went wrong. Tap to start again.');
      stop();
    }
  }

  if (!supported) {
    return (
      <p className="voice voice--unsupported">
        <span aria-hidden="true">🎙️ </span>
        Voice conversation needs a browser with speech recognition (try Chrome or Edge). You can
        still talk to Anchor by typing below.
      </p>
    );
  }

  return (
    <div className="voice">
      <div className="voice__row">
        <button
          type="button"
          className={`button voice__toggle ${active ? 'voice__toggle--on' : ''}`}
          onClick={active ? stop : start}
          aria-pressed={active}
        >
          <span aria-hidden="true">{active ? '■ ' : '🎙️ '}</span>
          {active ? 'End voice conversation' : 'Start voice conversation'}
        </button>
        {active && phase === 'listening' && <span className="voice__pulse" aria-hidden="true" />}
      </div>

      <p className="voice__status" role="status" aria-live="polite">
        {active ? PHASE_LABEL[phase] : 'Tap to have a spoken conversation with Anchor.'}
        {!canSpeak && active && ' (Replies appear as text — this browser can’t speak them.)'}
      </p>

      {active && heard && (
        <p className="voice__heard">
          <span className="voice__heard-label">You:</span> {heard}
        </p>
      )}

      {error && (
        <p className="alert" role="alert">
          <span aria-hidden="true">⚠ </span>
          {error}
        </p>
      )}
    </div>
  );
}
