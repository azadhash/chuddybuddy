// Verified India mental-health helplines, surfaced whenever crisis language is
// detected and always available in the UI regardless of detection.
//
// VERIFY BEFORE SHIPPING: helpline numbers change. Re-check each against its
// official source (telemanas.mohfw.gov.in, PIB, the foundation's own site)
// before any public deployment, and periodically thereafter.

export const HELPLINES = [
  {
    name: 'Tele-MANAS',
    org: 'Government of India · 24×7 · 20+ languages',
    number: '14416',
    alt: '1-800-891-4416',
    url: 'https://telemanas.mohfw.gov.in/',
  },
  {
    name: 'KIRAN',
    org: 'Government of India · 24×7 · 13 languages',
    number: '1800-599-0019',
    url: 'https://pib.gov.in/',
  },
  {
    name: 'Vandrevala Foundation',
    org: '24×7 · call & WhatsApp',
    number: '+91 9999 666 555',
    url: 'https://www.vandrevalafoundation.com/',
  },
  {
    name: 'AASRA',
    org: '24×7',
    number: '+91-22-2754 6669',
    url: 'http://www.aasra.info/',
  },
  {
    name: 'iCall (TISS)',
    org: 'Mon–Sat',
    number: '9152987821',
    url: 'https://icallhelpline.org/',
  },
];
