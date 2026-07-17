"use client";

import { useState } from "react";

export function SpeakButton({ text, className }: { text: string; className?: string }) {
  const [speaking, setSpeaking] = useState(false);

  function toggle() {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    window.speechSynthesis.cancel(); // stop anything else currently reading
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 1.02;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={speaking ? "Stop reading aloud" : "Read this turn aloud"}
      title={speaking ? "Stop" : "Listen"}
      className={
        className ??
        "shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full border border-rule text-ink-soft hover:text-ink hover:border-ink-soft transition-colors"
      }
    >
      {speaking ? <StopIcon /> : <SpeakerIcon />}
    </button>
  );
}

function SpeakerIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M15.54 8.46a5 5 0 0 1 0 7.07" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="4" y="4" width="16" height="16" rx="2" />
    </svg>
  );
}
