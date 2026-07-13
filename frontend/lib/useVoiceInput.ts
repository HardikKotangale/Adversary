"use client";

import { useCallback, useRef, useState, useSyncExternalStore } from "react";
import { getSpeechRecognitionCtor, MinimalSpeechRecognition } from "./speechRecognition";

function joinWithSpace(base: string, addition: string): string {
  if (!base) return addition;
  if (!addition) return base;
  return /\s$/.test(base) ? base + addition : `${base} ${addition}`;
}

const noopSubscribe = () => () => {};
const getSupportSnapshot = () => getSpeechRecognitionCtor() !== null;
const getServerSupportSnapshot = () => false;

export function useVoiceInput(onTranscriptChange: (fullText: string) => void) {
  // useSyncExternalStore (not useState+useEffect) so the server-rendered
  // markup (no mic button) matches the client's first paint, then updates
  // to the real capability without a hydration mismatch.
  const isSupported = useSyncExternalStore(
    noopSubscribe,
    getSupportSnapshot,
    getServerSupportSnapshot
  );
  const [isListening, setIsListening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<MinimalSpeechRecognition | null>(null);
  const baseValueRef = useRef("");
  const finalTranscriptRef = useRef("");

  const stop = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const start = useCallback(
    (currentValue: string) => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) return;

      setError(null);
      baseValueRef.current = currentValue;
      finalTranscriptRef.current = "";

      const recognition = new Ctor();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onresult = (event) => {
        let interim = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          const transcript = result[0]?.transcript ?? "";
          if (result.isFinal) {
            finalTranscriptRef.current = joinWithSpace(finalTranscriptRef.current, transcript);
          } else {
            interim += transcript;
          }
        }
        const combined = joinWithSpace(
          joinWithSpace(baseValueRef.current, finalTranscriptRef.current),
          interim
        );
        onTranscriptChange(combined);
      };

      recognition.onerror = (event) => {
        setError(
          event.error === "not-allowed"
            ? "Microphone access was denied."
            : "Voice input failed — try again or type instead."
        );
        setIsListening(false);
      };

      recognition.onend = () => setIsListening(false);

      recognition.start();
      recognitionRef.current = recognition;
      setIsListening(true);
    },
    [onTranscriptChange]
  );

  return { isSupported, isListening, error, start, stop };
}
