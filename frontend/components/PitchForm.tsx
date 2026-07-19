"use client";

import { useCallback, useState } from "react";
import { useVoiceInput } from "@/lib/useVoiceInput";

const MIN_LENGTH = 40;

export function PitchForm({
  value,
  onChange,
  onSubmit,
  disabled,
}: {
  value: string;
  onChange: (pitch: string) => void;
  onSubmit: (pitch: string) => void;
  disabled: boolean;
}) {
  const [touched, setTouched] = useState(false);
  const [isVoicePaused, setIsVoicePaused] = useState(false);
  const handleTranscriptChange = useCallback((text: string) => onChange(text), [onChange]);
  const voice = useVoiceInput(handleTranscriptChange);

  const tooShort = value.trim().length < MIN_LENGTH;
  const showError = touched && tooShort;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setTouched(true);
    if (tooShort || disabled) return;
    onSubmit(value.trim());
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <label
          htmlFor="pitch"
          className="font-mono text-xs uppercase tracking-wider text-ink-soft font-semibold"
        >
          Exhibit A: Your Pitch Idea
        </label>
        {voice.isSupported && (
          <div className="flex items-center gap-2">
            {!voice.isListening && !isVoicePaused ? (
              <button
                type="button"
                onClick={() => {
                  voice.start(value);
                  setIsVoicePaused(false);
                }}
                disabled={disabled}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[10px] uppercase tracking-wider border border-rule text-ink-soft hover:border-ink hover:text-ink bg-paper-raised/40 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <MicIcon />
                Speak Pitch
              </button>
            ) : (
              <>
                {voice.isListening ? (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-wider text-danger bg-vc-soft border border-danger/30 font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-danger inline-block animate-ping" />
                    Recording
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full font-mono text-[9px] uppercase tracking-wider text-ink-soft bg-paper-raised/40 border border-rule font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-ink-soft inline-block" />
                    Paused
                  </span>
                )}
                
                {voice.isListening ? (
                  <button
                    type="button"
                    onClick={() => {
                      voice.stop();
                      setIsVoicePaused(true);
                    }}
                    title="Pause Recording"
                    className="p-2 rounded-full border border-rule text-ink hover:bg-paper-raised/60 hover:scale-105 active:scale-95 transition-all font-bold flex items-center justify-center"
                  >
                    <PauseIcon />
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      voice.start(value);
                      setIsVoicePaused(false);
                    }}
                    title="Resume Recording"
                    className="p-2 rounded-full border border-rule text-ink hover:bg-paper-raised/60 hover:scale-105 active:scale-95 transition-all font-bold flex items-center justify-center"
                  >
                    <PlayIcon />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    voice.stop();
                    setIsVoicePaused(false);
                  }}
                  title="Stop Recording"
                  className="p-2 rounded-full border border-rule text-ink hover:bg-paper-raised/60 hover:scale-105 active:scale-95 transition-all font-bold flex items-center justify-center"
                >
                  <StopIcon />
                </button>
              </>
            )}
          </div>
        )}
      </div>
      
      <textarea
        id="pitch"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onBlur={() => setTouched(true)}
        disabled={disabled}
        rows={5}
        placeholder="Describe your project, product, or startup idea here..."
        className={`w-full resize-none rounded-xl border bg-paper-raised/35 px-5 py-4 text-base sm:text-lg leading-relaxed text-ink placeholder:text-ink-soft/40 focus:outline-none focus:border-customer/60 focus:ring-1 focus:ring-customer/60 disabled:opacity-60 disabled:cursor-not-allowed transition-all ${
          voice.isListening ? "border-danger" : "border-rule"
        }`}
      />
      
      <div className="flex items-center justify-between min-h-5">
        <p
          className={`font-mono text-xs ${
            voice.error
              ? "text-danger"
              : showError
              ? "text-danger"
              : "text-ink-soft/70"
          }`}
        >
          {voice.error
            ? voice.error
            : showError
            ? `Minimum ${MIN_LENGTH} characters required to invoke the panel.`
            : "Be descriptive to receive high-quality adversarial critiques."}
        </p>
        <span className="font-mono text-sm text-ink-soft opacity-60 tabular-nums">
          {value.trim().length} chars
        </span>
      </div>

      <button
        type="submit"
        disabled={disabled}
        className="w-full sm:w-auto px-8 py-4 rounded-xl bg-mediator hover:brightness-110 text-paper font-mono text-sm uppercase tracking-wider shadow-lg shadow-mediator/25 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
      >
        {disabled ? "Panel Analyzing Pitch…" : "Convene Adversarial Panel →"}
      </button>
    </form>
  );
}

function MicIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <rect x="9" y="2" width="6" height="12" rx="3" />
      <path d="M5 10a7 7 0 0 0 14 0" />
      <line x1="12" y1="19" x2="12" y2="22" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <polygon points="5 3 19 12 5 21 5 3" />
    </svg>
  );
}

function PauseIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="5" y="3" width="4" height="18" />
      <rect x="15" y="3" width="4" height="18" />
    </svg>
  );
}

function StopIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <rect x="4" y="4" width="16" height="16" />
    </svg>
  );
}
