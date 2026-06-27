// Renders the evidence-matched exercise: title, what it's for, ordered steps,
// why it works, and the research citation (the "receipt" that makes it feel
// clinically serious rather than a vibes chatbot). TTS playback is the next
// feature and will attach to this card.

export default function Exercise({ intervention }) {
  if (!intervention) return null;

  return (
    <article className="exercise" aria-labelledby="exercise-title">
      <header className="exercise__header">
        <p className="exercise__eyebrow">
          <span aria-hidden="true">🧭 </span>Suggested for you
        </p>
        <h3 id="exercise-title" className="exercise__title">
          {intervention.title}
        </h3>
        <p className="exercise__meta">
          For: {intervention.forWhat} · about {intervention.durationMinutes} min
        </p>
      </header>

      <ol className="exercise__steps">
        {intervention.steps.map((step, i) => (
          <li key={i}>{step}</li>
        ))}
      </ol>

      <details className="exercise__why">
        <summary>Why this works</summary>
        <p>{intervention.whyItWorks}</p>
        <p className="exercise__citation">Evidence: {intervention.citation}</p>
      </details>
    </article>
  );
}
