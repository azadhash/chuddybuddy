// Voice seam — placeholder for the NEXT feature (browser Web Speech API:
// speech-to-text for journaling, text-to-speech for guided exercises).
//
// Intentionally inert in this build so the core ships first. The voice feature
// fills these in (feature-detecting `window.SpeechRecognition` /
// `window.speechSynthesis`) without changing any component that imports them.

export function isSpeechInputSupported() {
  return false;
}

export function isSpeechOutputSupported() {
  return false;
}
