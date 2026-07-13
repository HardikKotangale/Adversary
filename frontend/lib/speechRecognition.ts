// Minimal typing for the Web Speech API (not in the standard DOM lib yet).
// Supported in Chrome, Edge, Safari; not in Firefox — callers must feature-detect.

export interface MinimalSpeechRecognitionAlternative {
  transcript: string;
}

export interface MinimalSpeechRecognitionResult {
  isFinal: boolean;
  length: number;
  [index: number]: MinimalSpeechRecognitionAlternative;
}

export interface MinimalSpeechRecognitionResultList {
  length: number;
  [index: number]: MinimalSpeechRecognitionResult;
}

export interface MinimalSpeechRecognitionEvent {
  resultIndex: number;
  results: MinimalSpeechRecognitionResultList;
}

export interface MinimalSpeechRecognitionErrorEvent {
  error: string;
}

export interface MinimalSpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start(): void;
  stop(): void;
  onresult: ((event: MinimalSpeechRecognitionEvent) => void) | null;
  onerror: ((event: MinimalSpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}

type SpeechRecognitionCtor = new () => MinimalSpeechRecognition;

export function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}
