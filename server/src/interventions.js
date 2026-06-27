// Evidence-matched intervention catalog.
//
// The model classifies the entry and returns an intervention *id* (an enum); the
// server attaches the canonical, research-backed exercise here. This keeps the
// science accurate and out of the model's mouth — the steps and citations are
// fixed, reviewed content, not generated per request.
//
// Every exercise is a real, established protocol with a real citation. There is
// no placeholder content.

export const INTERVENTIONS = {
  thought_record: {
    id: 'thought_record',
    title: '7-column thought record',
    forWhat: 'Catastrophic or all-or-nothing thoughts about the exam',
    durationMinutes: 8,
    steps: [
      'Name the situation that set this off (e.g. "saw my mock rank").',
      'Write the automatic thought exactly as it appeared ("I\'ll never crack JEE").',
      'Name the emotion and rate its intensity 0–100%.',
      'List the evidence FOR the thought.',
      'List the evidence AGAINST it — and the realistic worst case, and whether you could cope.',
      'Write one balanced, more accurate thought.',
      'Re-rate the emotion. Notice the shift.',
    ],
    whyItWorks:
      'Cognitive restructuring targets the worry component of test anxiety — the part most tied to performance. Meta-analysis shows a medium effect on test anxiety.',
    citation: 'Ergene, T. (2003). School Psychology International, 24(3), 313–328.',
  },

  physiological_sigh: {
    id: 'physiological_sigh',
    title: 'Physiological sigh (30-second reset)',
    forWhat: 'Acute panic or a racing heart right now',
    durationMinutes: 1,
    steps: [
      'Inhale slowly through your nose.',
      'At the top, take a second short sip of air in through your nose.',
      'Exhale slowly and fully through your mouth, longer than the inhale.',
      'Repeat 1–3 times. Notice your heart rate settle.',
    ],
    whyItWorks:
      'A controlled trial found cyclic sighing produced the largest same-day mood improvement and the biggest drop in breathing rate among brief breathwork practices.',
    citation: 'Balban, Spiegel, Huberman et al. (2023). Cell Reports Medicine, 4(1), 100895.',
  },

  self_compassion_break: {
    id: 'self_compassion_break',
    title: 'Self-compassion break',
    forWhat: 'Harsh self-criticism after a setback',
    durationMinutes: 5,
    steps: [
      'Acknowledge it: "This is a moment of difficulty."',
      'Remember the common humanity: "Other students struggle and doubt themselves too. I am not alone in this."',
      'Offer yourself kindness — a hand on your chest, and the words "May I be kind to myself right now."',
      'Ask what you would say to a friend in this exact spot, and say it to yourself.',
    ],
    whyItWorks:
      'Self-compassion is linked to lower fear of failure and more mastery-focused motivation — the academically relevant path — rather than lowered standards.',
    citation: 'Neff, Hsieh & Dejitterat (2005). Self and Identity, 4, 263–287.',
  },

  if_then_plan: {
    id: 'if_then_plan',
    title: 'If-then plan (implementation intention)',
    forWhat: 'Procrastination or trouble starting study',
    durationMinutes: 3,
    steps: [
      'Pick one specific study goal for today.',
      'Choose the exact cue — a time and place ("if it is 8pm and I am at my desk").',
      'Write the plan: "If [cue], then I will [specific action] for 25 minutes."',
      'Name the likely obstacle (e.g. checking your phone) and a counter-plan: "If I reach for my phone, then I will put it in another room."',
    ],
    whyItWorks:
      'Pre-linking a situational cue to an action closes the intention–behaviour gap. A meta-analysis of 94 studies found a medium-to-large effect on goal attainment.',
    citation: 'Gollwitzer & Sheeran (2006). Advances in Experimental Social Psychology, 38, 69–119.',
  },

  worry_dump: {
    id: 'worry_dump',
    title: 'Pre-exam worry dump',
    forWhat: 'The hours or minutes before a test or mock',
    durationMinutes: 10,
    steps: [
      'Set a timer for 10 minutes.',
      'Write as openly as you can about your thoughts and feelings about the exam ahead. Hold nothing back.',
      'Spelling and grammar do not matter. No one will read this.',
      'When the timer ends, close it and begin.',
    ],
    whyItWorks:
      'Briefly offloading exam worries onto paper can free up working memory that anxiety otherwise consumes. Most helpful for high-anxiety students; treat it as low-risk, not guaranteed.',
    citation: 'Ramirez & Beilock (2011). Science, 331(6014), 211–213.',
  },
};

// The set of ids the model is allowed to choose from (used to build the schema enum).
export const INTERVENTION_IDS = Object.keys(INTERVENTIONS);

// Look up a canonical intervention by id; null if unknown.
export function getIntervention(id) {
  return INTERVENTIONS[id] ?? null;
}
