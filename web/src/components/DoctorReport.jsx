import { useId, useMemo, useState } from 'react';
import { summarizeRange, dayKey } from '../lib/insights.js';
import { buildReportText } from '../lib/report.js';
import { triggerLabel, distortionLabel, emotionLabel } from '../lib/labels.js';

function todayKey() {
  return dayKey(new Date());
}

function shiftKey(key, deltaDays) {
  const d = new Date(`${key}T00:00:00`);
  d.setDate(d.getDate() + deltaDays);
  return dayKey(d);
}

function joinList(items, render) {
  return items.length ? items.map(render).join(', ') : 'none recorded';
}

// "Share with your doctor": pick a range of days and get a deterministic summary of
// the student's own history that they can copy, download, or print. No model call.
export default function DoctorReport({ messages, email }) {
  const [from, setFrom] = useState(() => shiftKey(todayKey(), -6));
  const [to, setTo] = useState(() => todayKey());
  const [copied, setCopied] = useState(false);

  const fromId = useId();
  const toId = useId();

  const report = useMemo(() => summarizeRange(messages, from, to), [messages, from, to]);

  function changeFrom(value) {
    setCopied(false);
    setFrom(value);
  }
  function changeTo(value) {
    setCopied(false);
    setTo(value);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(buildReportText(report, { email }));
      setCopied(true);
    } catch {
      setCopied(false);
    }
  }

  function download() {
    const blob = new Blob([buildReportText(report, { email })], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `anchor-summary-${from}_to_${to}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="doctor">
      <p className="analysis__muted">
        Pick a range of days and share a private summary of your check-ins with a doctor or
        counsellor. It is built only from your own messages — Anchor adds nothing.
      </p>

      <fieldset className="doctor__range">
        <legend>Date range</legend>
        <div className="field">
          <label htmlFor={fromId}>From</label>
          <input
            id={fromId}
            type="date"
            value={from}
            max={to}
            onChange={(e) => changeFrom(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor={toId}>To</label>
          <input
            id={toId}
            type="date"
            value={to}
            min={from}
            max={todayKey()}
            onChange={(e) => changeTo(e.target.value)}
          />
        </div>
      </fieldset>

      <section className="report" aria-label={`Wellness summary ${from} – ${to}`}>
        <h3 className="report__title">
          Summary · {from} to {to}
        </h3>

        {report.totalCheckins === 0 ? (
          <p className="analysis__muted">No check-ins in this range. Try widening the dates.</p>
        ) : (
          <>
            <dl className="stats">
              <div className="stat">
                <dt>Check-ins</dt>
                <dd>{report.totalCheckins}</dd>
              </div>
              <div className="stat">
                <dt>Active days</dt>
                <dd>{report.daysActive}</dd>
              </div>
              <div className="stat">
                <dt>Avg intensity</dt>
                <dd>{report.avgIntensity}/100</dd>
              </div>
              <div className="stat">
                <dt>Peak</dt>
                <dd>{report.peakIntensity}/100</dd>
              </div>
            </dl>

            <ul className="report__facts">
              <li>
                <strong>Most frequent emotions:</strong>{' '}
                {joinList(report.emotions, (e) => `${emotionLabel(e.emotion)} (${e.count})`)}
              </li>
              <li>
                <strong>Recurring triggers:</strong>{' '}
                {joinList(report.triggers, (t) => `${triggerLabel(t.category)} (${t.count})`)}
              </li>
              <li>
                <strong>Thinking patterns:</strong>{' '}
                {joinList(report.distortions, (d) => `${distortionLabel(d.type)} (${d.count})`)}
              </li>
              <li>
                <strong>Messages flagged for crisis support:</strong> {report.crisisCount}
              </li>
            </ul>

            <h4 className="report__subhead">Day by day</h4>
            <ul className="report__days">
              {report.days.map((day) => (
                <li key={day.key}>
                  <strong>{day.label}</strong> — {day.count} check-in{day.count === 1 ? '' : 's'},
                  avg {day.avgIntensity}/100, mostly {emotionLabel(day.dominantEmotion)}
                </li>
              ))}
            </ul>
          </>
        )}

        <p className="report__note">
          Anchor is an AI wellness companion, not a medical device. This is self-reported pattern
          data from the student’s own messages — not a diagnosis.
        </p>
      </section>

      <div className="report__controls">
        <button
          type="button"
          className="button"
          onClick={copy}
          disabled={report.totalCheckins === 0}
        >
          Copy summary
        </button>
        <button
          type="button"
          className="linkbutton"
          onClick={download}
          disabled={report.totalCheckins === 0}
        >
          Download .txt
        </button>
        <button type="button" className="linkbutton" onClick={() => window.print()}>
          Print
        </button>
        {copied && (
          <span className="status" role="status">
            Copied to clipboard
          </span>
        )}
      </div>
    </div>
  );
}
