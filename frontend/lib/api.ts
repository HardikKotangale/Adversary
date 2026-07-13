import {
  AddRoleEvent,
  DebateEvent,
  DebateHandle,
  PersonaMeta,
  RoundEntry,
} from "./types";

const BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4000";

async function streamSSE<E>(
  url: string,
  body: unknown,
  onEvent: (event: E) => void,
  signal: AbortSignal
): Promise<void> {
  let res: Response;
  try {
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal,
    });
  } catch (err) {
    if ((err as Error).name === "AbortError") return;
    onEvent({ type: "error", message: "Could not reach the panel server." } as E);
    return;
  }

  if (!res.body) {
    onEvent({ type: "error", message: "No response stream from server." } as E);
    return;
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    let message = text;
    try {
      message = JSON.parse(text).error ?? text;
    } catch {
      // not JSON, use raw text
    }
    onEvent({ type: "error", message: message || `Request failed (${res.status})` } as E);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const chunks = buffer.split("\n\n");
    buffer = chunks.pop() ?? "";

    for (const chunk of chunks) {
      const dataLine = chunk.split("\n").find((line) => line.startsWith("data:"));
      if (!dataLine) continue;
      const jsonStr = dataLine.slice(5).trim();
      try {
        onEvent(JSON.parse(jsonStr) as E);
      } catch {
        // ignore malformed chunk
      }
    }
  }
}

export function runDebate(pitch: string, onEvent: (e: DebateEvent) => void): DebateHandle {
  const controller = new AbortController();
  streamSSE<DebateEvent>(`${BASE_URL}/api/debate`, { pitch }, onEvent, controller.signal).catch(
    (err) => {
      if ((err as Error).name !== "AbortError") {
        onEvent({ type: "error", message: (err as Error).message });
      }
    }
  );
  return { cancel: () => controller.abort() };
}

export function addRole(
  debateId: string,
  role: PersonaMeta,
  _context: { pitch: string; round1: RoundEntry[] },
  onEvent: (e: AddRoleEvent) => void
): DebateHandle {
  const controller = new AbortController();
  streamSSE<AddRoleEvent>(
    `${BASE_URL}/api/debate/${debateId}/add-role`,
    { roleId: role.id },
    onEvent,
    controller.signal
  ).catch((err) => {
    if ((err as Error).name !== "AbortError") {
      onEvent({ type: "error", message: (err as Error).message });
    }
  });
  return { cancel: () => controller.abort() };
}

export function addCustomRole(
  debateId: string,
  input: { roleName: string; description: string },
  _context: { pitch: string; round1: RoundEntry[] },
  onEvent: (e: AddRoleEvent) => void
): DebateHandle {
  const controller = new AbortController();
  streamSSE<AddRoleEvent>(
    `${BASE_URL}/api/debate/${debateId}/add-role`,
    { customRoleName: input.roleName, customDescription: input.description },
    onEvent,
    controller.signal
  ).catch((err) => {
    if ((err as Error).name !== "AbortError") {
      onEvent({ type: "error", message: (err as Error).message });
    }
  });
  return { cancel: () => controller.abort() };
}
