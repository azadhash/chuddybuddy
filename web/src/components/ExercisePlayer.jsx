import { useEffect, useMemo, useRef, useState } from 'react';

// The guided, interactive run-through of an exercise. Breathing protocols (those
// with a `breathing` spec) get an animated orb + countdown; everything else gets
// a focused, one-step-at-a-time walk-through. All content is the reviewed
// intervention data — nothing is generated here.
export default function ExercisePlayer({ intervention, onClose }) {
  if (intervention.breathing) {
    return <BreathingPlayer spec={intervention.breathing} onClose={onClose} />;
  }
  return <StepPlayer steps={intervention.steps} onClose={onClose} />;
}

function BreathingPlayer({ spec, onClose }) {
  // Flatten cycles × phases into one timeline so progression is a single index.
  const timeline = useMemo(() => {
    const out = [];
    for (let c = 1; c <= spec.cycles; c++) {
      for (const phase of spec.phases) out.push({ ...phase, cycle: c });
    }
    return out;
  }, [spec]);

  // Position is one atomic state ({ index, secondsLeft }) so the timer can both
  // count down and advance to the next phase in a single update.
  const [pos, setPos] = useState({ index: 0, secondsLeft: timeline[0].seconds });
  const [running, setRunning] = useState(true);
  const regionRef = useRef(null);

  const done = pos.index >= timeline.length;
  const phase = done ? null : timeline[pos.index];

  useEffect(() => {
    regionRef.current?.focus?.();
  }, []);

  // One-second tick: decrement, and roll over to the next phase when it elapses.
  useEffect(() => {
    if (!running || done) return undefined;
    const id = setInterval(() => {
      setPos((prev) => {
        if (prev.secondsLeft > 1) return { ...prev, secondsLeft: prev.secondsLeft - 1 };
        const nextIndex = prev.index + 1;
        return {
          index: nextIndex,
          secondsLeft: nextIndex < timeline.length ? timeline[nextIndex].seconds : 0,
        };
      });
    }, 1000);
    return () => clearInterval(id);
  }, [running, done, timeline]);

  if (done) {
    return (
      <CompletionPanel
        message="Well done. Notice how your body feels now compared to a minute ago."
        onRestart={() => {
          setPos({ index: 0, secondsLeft: timeline[0].seconds });
          setRunning(true);
        }}
        onClose={onClose}
      />
    );
  }

  return (
    <div
      className="player breath"
      role="group"
      aria-label="Guided breathing exercise"
      tabIndex={-1}
      ref={regionRef}
    >
      <div className="breath__stage">
        <span
          className="breath__orb"
          aria-hidden="true"
          style={{ transform: `scale(${phase.scale})`, transitionDuration: `${phase.seconds}s` }}
        >
          <span className="breath__count">{pos.secondsLeft}</span>
        </span>
      </div>

      <p className="breath__phase" aria-live="polite">
        {phase.label}
      </p>
      <p className="breath__cycle">
        Cycle {phase.cycle} of {spec.cycles}
      </p>

      <div className="player__controls">
        <button type="button" className="button" onClick={() => setRunning((r) => !r)}>
          {running ? 'Pause' : 'Resume'}
        </button>
        <button type="button" className="linkbutton" onClick={onClose}>
          Stop
        </button>
      </div>
    </div>
  );
}

function StepPlayer({ steps, onClose }) {
  const [index, setIndex] = useState(0);
  const regionRef = useRef(null);
  const done = index >= steps.length;

  useEffect(() => {
    regionRef.current?.focus?.();
  }, []);

  if (done) {
    return (
      <CompletionPanel
        message={`Nicely done — you worked through all ${steps.length} steps.`}
        onRestart={() => setIndex(0)}
        onClose={onClose}
      />
    );
  }

  const isLast = index === steps.length - 1;

  return (
    <div className="player" role="group" aria-label="Guided exercise" tabIndex={-1} ref={regionRef}>
      <p className="player__progress">
        Step {index + 1} of {steps.length}
      </p>
      <p className="player__step" aria-live="polite">
        {steps[index]}
      </p>

      <div className="player__dots" aria-hidden="true">
        {steps.map((_, k) => (
          <span key={k} className={`dot ${k <= index ? 'dot--on' : ''}`} />
        ))}
      </div>

      <div className="player__controls">
        <button
          type="button"
          className="linkbutton"
          onClick={() => setIndex((n) => Math.max(0, n - 1))}
          disabled={index === 0}
        >
          Back
        </button>
        <button type="button" className="button" onClick={() => setIndex((n) => n + 1)}>
          {isLast ? 'Finish' : 'Next'}
        </button>
        <button type="button" className="linkbutton" onClick={onClose}>
          Stop
        </button>
      </div>
    </div>
  );
}

function CompletionPanel({ message, onRestart, onClose }) {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus?.();
  }, []);
  return (
    <div className="player player__done" role="status" tabIndex={-1} ref={ref}>
      <p className="player__check" aria-hidden="true">
        ✓
      </p>
      <p className="player__donemsg">{message}</p>
      <div className="player__controls">
        <button type="button" className="button" onClick={onRestart}>
          Go again
        </button>
        <button type="button" className="linkbutton" onClick={onClose}>
          Close
        </button>
      </div>
    </div>
  );
}
