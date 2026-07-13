// Single switch point between the Phase 1 mock and the real backend.
// Set NEXT_PUBLIC_USE_MOCK=true to force the mock (e.g. demoing without a
// Qwen API key or a running backend). Defaults to the real API.
import * as mockApi from "./mockApi";
import * as realApi from "./api";

const useMock = process.env.NEXT_PUBLIC_USE_MOCK === "true";

export const runDebate = useMock ? mockApi.runDebate : realApi.runDebate;
export const addRole = useMock ? mockApi.addRole : realApi.addRole;
export const addCustomRole = useMock ? mockApi.addCustomRole : realApi.addCustomRole;
