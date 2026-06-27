import { journalDays, timeLabel } from '../lib/insights.js';
import { triggerLabel, emotionLabel } from '../lib/labels.js';

// The user's own words, grouped by day, each annotated with how Anchor read it
// (emotion + intensity + any triggers). This is the "see what I wrote and how I
// was feeling each day" view. Real entries only — empty until the user writes.
export default function Journal({ messages }) {
  const days = journalDays(messages);

  if (days.length === 0) {
    return (
      <p className="analysis__muted">
        Your journal is empty for now. Every message you send to Anchor is saved here so you can
        look back on how each day felt.
      </p>
    );
  }

  return (
    <div className="journal">
      {days.map((day) => (
        <section key={day.key} className="journal__day" aria-label={`Entries for ${day.label}`}>
          <div className="journal__dayhead">
            <h3 className="journal__date">{day.label}</h3>
            <span className="journal__avg">
              {emotionLabel(day.dominantEmotion)} · avg {day.avgIntensity}/100
            </span>
          </div>

          <ul className="journal__entries">
            {day.entries.map((entry) => (
              <li key={entry.id} className="journal__entry">
                <p className="journal__text">{entry.text}</p>
                <p className="journal__meta">
                  <span className="journal__badge">
                    {emotionLabel(entry.emotion)} · {entry.intensity}/100
                  </span>
                  {entry.triggers.length > 0 && (
                    <span className="journal__triggers">
                      {' '}
                      — {entry.triggers.map((t) => triggerLabel(t.category)).join(', ')}
                    </span>
                  )}
                  <span className="journal__time"> · {timeLabel(entry.createdAt)}</span>
                </p>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
