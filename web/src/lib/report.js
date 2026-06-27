import { triggerLabel, distortionLabel, emotionLabel } from './labels.js';

// Turn a summarizeRange() report into a plain-text summary the student can copy,
// download, or print to share with a doctor or counsellor. Deterministic and
// self-contained — it carries its own context and a clear non-diagnostic note.

function list(items, render) {
  if (!items.length) return 'none recorded';
  return items.map(render).join(', ');
}

export function buildReportText(report, { email } = {}) {
  const lines = [];
  lines.push('ANCHOR — WELLNESS SUMMARY');
  lines.push(`Period: ${report.fromKey} to ${report.toKey}`);
  if (email) lines.push(`Account: ${email}`);
  lines.push('Prepared by the student to share with a doctor or counsellor.');
  lines.push('');

  if (report.totalCheckins === 0) {
    lines.push('No check-ins were recorded in this period.');
    lines.push('');
  } else {
    lines.push(`Check-ins: ${report.totalCheckins} across ${report.daysActive} active day(s)`);
    lines.push(
      `Average intensity: ${report.avgIntensity}/100` +
        (report.peakDayLabel
          ? ` (peak ${report.peakIntensity}/100 on ${report.peakDayLabel})`
          : ''),
    );
    lines.push(
      `Most frequent emotions: ${list(report.emotions, (e) => `${emotionLabel(e.emotion)} (${e.count})`)}`,
    );
    lines.push(
      `Recurring triggers: ${list(report.triggers, (t) => `${triggerLabel(t.category)} (${t.count})`)}`,
    );
    lines.push(
      `Thinking patterns: ${list(report.distortions, (d) => `${distortionLabel(d.type)} (${d.count})`)}`,
    );
    lines.push(`Messages flagged for crisis support: ${report.crisisCount}`);
    lines.push('');

    lines.push('Day by day:');
    for (const day of report.days) {
      lines.push(
        `- ${day.label}: ${day.count} check-in(s), avg ${day.avgIntensity}/100, mostly ${emotionLabel(day.dominantEmotion)}`,
      );
    }
    lines.push('');
  }

  lines.push(
    'Note: Anchor is an AI wellness companion, not a medical device. The above is self-reported',
  );
  lines.push('pattern data captured from the student’s own messages — it is not a diagnosis.');
  return lines.join('\n');
}
