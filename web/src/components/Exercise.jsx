import { useId, useState } from 'react';
import ExercisePlayer from './ExercisePlayer.jsx';

// The evidence-matched exercise card: title, what it's for, the steps, why it
// works, and the research citation (the "receipt"). "Start guided exercise"
// launches an interactive, animated run-through (ExercisePlayer).
export default function Exercise({ intervention }) {
  const titleId = useId();
  const [playing, setPlaying] = useState(false);

  if (!intervention) return null;

  return (
    <article className="exercise" aria-labelledby={titleId}>
      <header className="exercise__header">
        <p className="exercise__eyebrow">
          <span aria-hidden="true">🧭 </span>Suggested for you
        </p>
        <h3 id={titleId} className="exercise__title">
          {intervention.title}
        </h3>
        <p className="exercise__meta">
          For: {intervention.forWhat} · about {intervention.durationMinutes} min
        </p>
      </header>

      {playing ? (
        <ExercisePlayer intervention={intervention} onClose={() => setPlaying(false)} />
      ) : (
        <>
          <ol className="exercise__steps">
            {intervention.steps.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>

          <div className="exercise__actions">
            <button type="button" className="button" onClick={() => setPlaying(true)}>
              <span aria-hidden="true">▶ </span>Start guided exercise
            </button>
          </div>

          <details className="exercise__why">
            <summary>Why this works</summary>
            <p>{intervention.whyItWorks}</p>
            <p className="exercise__citation">Evidence: {intervention.citation}</p>
          </details>
        </>
      )}
    </article>
  );
}
