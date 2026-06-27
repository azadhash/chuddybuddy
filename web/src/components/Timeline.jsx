import { triggerLabel } from '../lib/labels.js';

// Pattern engine over the user's real entries. Surfaces what a scalar tracker
// cannot: which triggers recur, and how intensity is trending over time. Shows a
// genuine empty state until there is real data — nothing is seeded.

function categoryFrequency(entries) {
  const counts = new Map();
  for (const entry of entries) {
    // Count each category once per entry so frequency means "in N entries".
    const seen = new Set((entry.triggers ?? []).map((t) => t.category));
    for (const cat of seen) {
      counts.set(cat, (counts.get(cat) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]);
}

function recurrence(entries) {
  const window = entries.slice(-5);
  const freq = categoryFrequency(window);
  if (freq.length === 0) return null;
  const [category, count] = freq[0];
  if (count < 3) return null; // only call out a genuine, repeating pattern
  return { category, count, of: window.length };
}

export default function Timeline({ entries }) {
  if (!entries || entries.length === 0) {
    return (
      <div className="timeline timeline--empty">
        <p className="analysis__muted">
          Your patterns will appear here once you have written a few entries. Anchor will start to
          notice what tends to set off your stress, and how your intensity is trending.
        </p>
      </div>
    );
  }

  const freq = categoryFrequency(entries);
  const maxFreq = freq.length ? freq[0][1] : 0;
  const recent = entries.slice(-10);
  const callout = recurrence(entries);

  return (
    <div className="timeline">
      {callout && (
        <p className="timeline__callout">
          <span aria-hidden="true">🔁 </span>
          <strong>{triggerLabel(callout.category)}</strong> came up in {callout.count} of your last{' '}
          {callout.of} entries — it may be a recurring trigger worth examining.
        </p>
      )}

      <h3 className="timeline__subhead">Most frequent triggers</h3>
      {freq.length > 0 ? (
        <ul className="bars">
          {freq.map(([cat, count]) => (
            <li key={cat} className="bars__row">
              <span className="bars__label">{triggerLabel(cat)}</span>
              <span className="bars__track" aria-hidden="true">
                <span className="bars__fill" style={{ width: `${(count / maxFreq) * 100}%` }} />
              </span>
              <span className="bars__count">
                {count} {count === 1 ? 'entry' : 'entries'}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="analysis__muted">No clear triggers logged yet.</p>
      )}

      <h3 className="timeline__subhead">Recent intensity</h3>
      <ol
        className="trend"
        aria-label="Emotional intensity of your recent entries, oldest to newest"
      >
        {recent.map((entry) => (
          <li key={entry.id} className="trend__bar-wrap">
            <span
              className="trend__bar"
              style={{ height: `${Math.max(6, entry.intensity)}%` }}
              role="img"
              aria-label={`${entry.primaryEmotion}, intensity ${entry.intensity} out of 100`}
            />
          </li>
        ))}
      </ol>
    </div>
  );
}
