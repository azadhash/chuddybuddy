// Human-readable display names for the enum values the API returns. Each pairs
// a label with a short text glyph so meaning is never carried by colour alone.

export const TRIGGER_LABELS = {
  peer_comparison: 'Peer comparison',
  parental_pressure: 'Family pressure',
  time_pressure: 'Time pressure',
  self_doubt: 'Self-doubt',
  performance: 'Performance worry',
  sleep_fatigue: 'Sleep / fatigue',
  future_uncertainty: 'Future uncertainty',
  other: 'Other',
};

export const DISTORTION_LABELS = {
  none: 'None detected',
  catastrophizing: 'Catastrophizing',
  all_or_nothing: 'All-or-nothing thinking',
  overgeneralization: 'Overgeneralization',
  mind_reading: 'Mind reading',
  fortune_telling: 'Fortune telling',
  labeling: 'Labeling',
};

export function triggerLabel(category) {
  return TRIGGER_LABELS[category] ?? 'Other';
}

export function distortionLabel(type) {
  return DISTORTION_LABELS[type] ?? type;
}

// Emotions arrive as free-form lowercase words (e.g. "anxious"); title-case for display.
export function emotionLabel(emotion) {
  if (!emotion) return 'Neutral';
  return emotion.charAt(0).toUpperCase() + emotion.slice(1);
}
