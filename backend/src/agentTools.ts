import type { ChatCompletionTool } from "openai/resources/chat/completions";

export const AGENT_TOOLS: ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "calculate",
      description:
        "Evaluate a basic arithmetic expression to verify a claimed number (margins, CAC payback, unit economics, percentages, etc.) instead of estimating it in your head. Supports + - * / and parentheses.",
      parameters: {
        type: "object",
        properties: {
          expression: {
            type: "string",
            description: "e.g. \"(450 - 300) / 450 * 100\"",
          },
        },
        required: ["expression"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_pitch",
      description:
        "Search the original pitch text for a keyword or phrase so you can quote it exactly instead of paraphrasing from memory.",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "keyword or short phrase to look for" },
        },
        required: ["query"],
      },
    },
  },
];

/** Tiny recursive-descent parser for +,-,*,/,(),numbers — no eval(). */
function safeCalculate(expression: string): string {
  const tokens = expression.match(/\d+\.?\d*|[()+\-*/]/g);
  if (!tokens) return "Error: could not parse expression.";
  let pos = 0;

  function peek(): string | undefined {
    return tokens![pos];
  }
  function next(): string {
    return tokens![pos++];
  }
  function parseExpr(): number {
    let value = parseTerm();
    while (peek() === "+" || peek() === "-") {
      const op = next();
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
    }
    return value;
  }
  function parseTerm(): number {
    let value = parseFactor();
    while (peek() === "*" || peek() === "/") {
      const op = next();
      const rhs = parseFactor();
      value = op === "*" ? value * rhs : value / rhs;
    }
    return value;
  }
  function parseFactor(): number {
    if (peek() === "-") {
      next();
      return -parseFactor();
    }
    if (peek() === "(") {
      next();
      const value = parseExpr();
      if (peek() === ")") next();
      return value;
    }
    const tok = next();
    const n = Number(tok);
    if (Number.isNaN(n)) throw new Error(`unexpected token "${tok}"`);
    return n;
  }

  try {
    const result = parseExpr();
    if (pos !== tokens.length || !Number.isFinite(result)) {
      return "Error: invalid or incomplete expression.";
    }
    return String(Math.round(result * 10000) / 10000);
  } catch (err) {
    return `Error: ${err instanceof Error ? err.message : "invalid expression"}`;
  }
}

function searchPitch(pitch: string, query: string): string {
  const idx = pitch.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return `No match for "${query}" in the pitch text.`;
  const start = Math.max(0, idx - 40);
  const end = Math.min(pitch.length, idx + query.length + 40);
  return `...${pitch.slice(start, end)}...`;
}

export function executeAgentTool(
  name: string,
  args: Record<string, unknown>,
  pitch: string
): string {
  if (name === "calculate") {
    return safeCalculate(String(args.expression ?? ""));
  }
  if (name === "search_pitch") {
    return searchPitch(pitch, String(args.query ?? ""));
  }
  return `Unknown tool: ${name}`;
}
