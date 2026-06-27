import { triggerLabel, distortionLabel } from '../lib/labels.js';

// Compact "what I noticed" line under an assistant reply: detected triggers and
// the thought distortion. Meaning is carried by text + glyph, never colour alone.
export default function InsightChips({ triggers = [], distortion }) {
  const hasDistortion = distortion && distortion.type !== 'none';
  if (triggers.length === 0 && !hasDistortion) return null;

  return (
    <div className="insight">
      {triggers.length > 0 && (
        <ul className="chips chips--sm">
          {triggers.map((t, i) => (
            <li key={i} className="chip">
              <span aria-hidden="true">📍 </span>
              {t.label}
              <span className="chip__category"> · {triggerLabel(t.category)}</span>
            </li>
          ))}
        </ul>
      )}
      {hasDistortion && (
        <p className="insight__distortion">
          <span aria-hidden="true">🔎 </span>
          <strong>Thinking pattern:</strong> {distortionLabel(distortion.type)}
          {distortion.quote ? <> — “{distortion.quote}”</> : null}
        </p>
      )}
    </div>
  );
}
