import type { Response } from "express";

export function startSSE(res: Response): void {
  res.writeHead(200, {
    "Content-Type": "text/event-stream",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
    "X-Accel-Buffering": "no",
  });
}

export function sendEvent(res: Response, event: unknown): void {
  res.write(`data: ${JSON.stringify(event)}\n\n`);
}
