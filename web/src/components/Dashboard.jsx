import { summary, dailyMood, topDistortions } from '../lib/insights.js';
import { distortionLabel, emotionLabel } from '../lib/labels.js';

// At-a-glance view of the user's real history: a few headline numbers, how their
// emotional intensity has moved day by day, and the thinking patterns that recur.
// Shows a genuine empty state until there are check-ins — nothing is seeded.
export default function Dashboard({ messages }) {
  const stats = summary(messages);

  if (stats.totalCheckins === 0) {
    return (
      <p className="analysis__muted">
        Your dashboard will fill in as you check in. Once you have a few entries you’ll see your
        mood over time, your active streak, and the thinking patterns that come up most.
      </p>
    );
  }

  const mood = dailyMood(messages);
  const distortions = topDistortions(messages);
  const maxDistortion = distortions.length ? distortions[0].count : 0;

  return (
    <div className="dashboard">
      <dl className="stats">
        <Stat label="Check-ins" value={stats.totalCheckins} />
        <Stat label="Days active" value={stats.daysActive} />
        <Stat label="Day streak" value={stats.streak} />
        <Stat label="Avg intensity" value={`${stats.avgIntensity}/100`} />
      </dl>

      <h3 className="timeline__subhead">How you’ve been feeling, day by day</h3>
      <ol className="mood" aria-label="Average emotional intensity per day, oldest to newest">
        {mood.map((day) => (
          <li key={day.key} className="mood__col">
            <span className="mood__track" aria-hidden="true">
              <span className="mood__fill" style={{ height: `${Math.max(6, day.avgIntensity)}%` }} />
            </span>
            <span
              className="mood__day"
              role="img"
              aria-label={`${day.label}: ${emotionLabel(day.dominantEmotion)}, average intensity ${day.avgIntensity} out of 100, ${day.count} ${day.count === 1 ? 'check-in' : 'check-ins'}`}
            >
              {day.label}
            </span>
          </li>
        ))}
      </ol>

      <h3 className="timeline__subhead">Common thinking patterns</h3>
      {distortions.length > 0 ? (
        <ul className="bars">
          {distortions.map(({ type, count }) => (
            <li key={type} className="bars__row">
              <span className="bars__label">{distortionLabel(type)}</span>
              <span className="bars__track" aria-hidden="true">
                <span className="bars__fill" style={{ width: `${(count / maxDistortion) * 100}%` }} />
              </span>
              <span className="bars__count">
                {count} {count === 1 ? 'time' : 'times'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="analysis__muted">
          No recurring thinking patterns yet — Anchor only names one when it clearly fits.
        </p>
      )}
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd>{value}</dd>
    </div>
  );
}
