// Pattern engine for the dashboard + journal. Pure functions over the user's real
// chat history (the same payload the chat view loads) — nothing is synthesized.
// Each user message is a "check-in"; the assistant turn that follows carries its
// analysis (emotion, intensity, triggers, distortion). We pair the two so the
// journal can show what was written alongside how it was read.

function toDate(value) {
  return value instanceof Date ? value : new Date(value);
}

// Local calendar-day key (YYYY-MM-DD) so entries group by the user's own day.
export function dayKey(value) {
  const d = toDate(value);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function dayLabel(value) {
  return toDate(value).toLocaleDateString(undefined, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

export function timeLabel(value) {
  return toDate(value).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
}

function mode(values) {
  const counts = new Map();
  let best = values[0] ?? 'neutral';
  let bestN = 0;
  for (const v of values) {
    const n = (counts.get(v) ?? 0) + 1;
    counts.set(v, n);
    if (n > bestN) {
      best = v;
      bestN = n;
    }
  }
  return best;
}

// One entry per user check-in, with the analysis from the assistant reply that
// answered it. Optimistic, not-yet-persisted messages (no createdAt) are skipped.
export function entriesFrom(messages = []) {
  const entries = [];
  for (let i = 0; i < messages.length; i++) {
    const m = messages[i];
    if (m.role !== 'user' || !m.createdAt) continue;

    let analysis = null;
    for (let j = i + 1; j < messages.length; j++) {
      if (messages[j].role === 'assistant') {
        analysis = messages[j];
        break;
      }
      if (messages[j].role === 'user') break;
    }

    entries.push({
      id: m.id,
      text: m.content,
      createdAt: m.createdAt,
      emotion: analysis?.emotion ?? 'neutral',
      intensity: analysis?.intensity ?? 0,
      triggers: analysis?.triggers ?? [],
      distortion: analysis?.distortion ?? null,
    });
  }
  return entries;
}

// Entries grouped into calendar days, most-recent day first (for the journal log).
export function journalDays(messages = []) {
  const byDay = new Map();
  for (const e of entriesFrom(messages)) {
    const key = dayKey(e.createdAt);
    if (!byDay.has(key)) {
      byDay.set(key, { key, label: dayLabel(e.createdAt), entries: [] });
    }
    byDay.get(key).entries.push(e);
  }

  const days = [...byDay.values()].map((d) => {
    const intensities = d.entries.map((e) => e.intensity);
    const avgIntensity = Math.round(intensities.reduce((a, b) => a + b, 0) / intensities.length);
    return { ...d, avgIntensity, dominantEmotion: mode(d.entries.map((e) => e.emotion)) };
  });

  days.sort((a, b) => b.key.localeCompare(a.key));
  return days;
}

// Same days, oldest-first, for plotting the mood trend left-to-right.
export function dailyMood(messages = []) {
  return journalDays(messages)
    .slice()
    .sort((a, b) => a.key.localeCompare(b.key))
    .map((d) => ({
      key: d.key,
      label: d.label,
      avgIntensity: d.avgIntensity,
      dominantEmotion: d.dominantEmotion,
      count: d.entries.length,
    }));
}

// Consecutive active days ending at the most recent check-in.
function currentStreak(keysDesc) {
  if (keysDesc.length === 0) return 0;
  let streak = 1;
  let prev = toDate(keysDesc[0]);
  for (let i = 1; i < keysDesc.length; i++) {
    const cur = toDate(keysDesc[i]);
    const diffDays = Math.round((prev - cur) / 86_400_000);
    if (diffDays === 1) {
      streak++;
      prev = cur;
    } else {
      break;
    }
  }
  return streak;
}

export function summary(messages = []) {
  const entries = entriesFrom(messages);
  const days = journalDays(messages); // most-recent first
  const total = entries.length;
  const avgIntensity = total ? Math.round(entries.reduce((a, e) => a + e.intensity, 0) / total) : 0;
  return {
    totalCheckins: total,
    daysActive: days.length,
    avgIntensity,
    streak: currentStreak(days.map((d) => d.key)),
  };
}

export function topDistortions(messages = []) {
  const counts = new Map();
  for (const e of entriesFrom(messages)) {
    const type = e.distortion?.type;
    if (!type || type === 'none') continue;
    counts.set(type, (counts.get(type) ?? 0) + 1);
  }
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([type, count]) => ({ type, count }));
}
