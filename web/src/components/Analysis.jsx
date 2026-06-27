import Exercise from './Exercise.jsx';
import { triggerLabel, distortionLabel } from '../lib/labels.js';

// The "reads between the lines" result: an empathetic reflection, the detected
// triggers and thought distortion (each conveyed with text + glyph, never colour
// alone), and the matched exercise. Rendered inside a labelled landmark by the
// parent; this component owns the heading hierarchy below the section title.

export default function Analysis({ analysis }) {
  if (!analysis) return null;
  const { reflection, primaryEmotion, intensity, triggers, distortion, intervention } = analysis;
  const hasDistortion = distortion && distortion.type !== 'none';

  return (
    <div className="analysis">
      <p className="analysis__reflection">{reflection}</p>

      <dl className="analysis__readout">
        <div className="analysis__stat">
          <dt>Main feeling</dt>
          <dd>{primaryEmotion}</dd>
        </div>
        <div className="analysis__stat">
          <dt>Intensity</dt>
          <dd>
            <span className="meter" role="img" aria-label={`Intensity ${intensity} out of 100`}>
              <span className="meter__fill" style={{ width: `${intensity}%` }} aria-hidden="true" />
            </span>
            <span className="analysis__intensity-value">{intensity}/100</span>
          </dd>
        </div>
      </dl>

      <h3 className="analysis__subhead">What seems to be driving it</h3>
      {triggers.length > 0 ? (
        <ul className="chips">
          {triggers.map((t, i) => (
            <li key={i} className="chip">
              <span aria-hidden="true">📍 </span>
              {t.label}
              <span className="chip__category"> · {triggerLabel(t.category)}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="analysis__muted">No specific trigger stood out in this entry.</p>
      )}

      {hasDistortion && (
        <p className="analysis__distortion">
          <span aria-hidden="true">🔎 </span>
          <strong>Thinking pattern:</strong> {distortionLabel(distortion.type)}
          {distortion.quote ? <> — “{distortion.quote}”</> : null}
        </p>
      )}

      <Exercise intervention={intervention} />
    </div>
  );
}
