// @vitest-environment node

import { createServer, type Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";

import { DEMO_MATTERS } from "@/lib/demo/matters";
import { analyseMatter } from "@/lib/ai/analyst";
import { LocalAIProvider } from "@/lib/ai/local-provider";
import type { MatterAnalysisInput } from "@/lib/ai/types";

/**
 * Orchelio — the local model path, over a real socket.
 *
 * `tests/unit/local-provider.test.ts` stubs `fetch` and proves the decisions.
 * This one starts an HTTP server on 127.0.0.1 and proves the connection: that
 * the address the guard produced is one Node can actually reach, that the
 * request arrives shaped the way a model runner expects, and that a request
 * which never comes back is abandoned and reported as slow rather than absent.
 *
 * The last of those is why this file exists. Whether an aborted `fetch` surfaces
 * as `TimeoutError` directly or wrapped in a `TypeError`'s `cause` is a fact
 * about the runtime, and a stub cannot establish it — it can only repeat what
 * the person writing the stub believed.
 *
 * No model is involved. The server here answers in the shape an OpenAI-
 * compatible runner answers in, and nothing in this repository has been
 * measured against a real one.
 */

const NOW = new Date("2026-07-28T09:00:00Z");

let server: Server | undefined;

function matterInput(): MatterAnalysisInput {
  const matter = DEMO_MATTERS.find((candidate) => candidate.reference === "IMM-2026-002");
  if (!matter) throw new Error("The demonstration matter IMM-2026-002 has gone");

  return {
    reference: matter.reference,
    title: matter.title,
    practiceAreaKey: matter.practiceAreaKey,
    matterTypeKey: matter.matterTypeKey,
    status: matter.status,
    representationSide: matter.representationSide ?? null,
    fields: matter.fields,
    intake: matter.intake,
    documents: matter.documents.map((document) => ({
      filename: document.filename,
      category: document.category,
      receivedAt: new Date(NOW.getTime() - document.receivedDaysAgo * 86_400_000).toISOString(),
      verified: document.verified,
    })),
    enabledFeatures: [
      "document_summary",
      "entity_extraction",
      "timeline",
      "missing_documents",
      "inconsistency_detection",
      "consultation_questions",
    ],
    now: NOW,
  };
}

/** Starts a server on the loopback interface and returns its address. */
async function listening(
  handler: (request: { method: string; url: string; body: string }) => { status: number; body: string } | null,
): Promise<string> {
  server = createServer((request, response) => {
    const chunks: Buffer[] = [];
    request.on("data", (chunk: Buffer) => chunks.push(chunk));
    request.on("end", () => {
      const answer = handler({
        method: request.method ?? "",
        url: request.url ?? "",
        body: Buffer.concat(chunks).toString("utf8"),
      });
      // `null` means "never answer", which is how a model too big for the
      // machine behaves from the caller's side.
      if (!answer) return;
      response.writeHead(answer.status, { "content-type": "application/json" });
      response.end(answer.body);
    });
  });

  await new Promise<void>((resolve) => server?.listen(0, "127.0.0.1", resolve));
  const address = server.address();
  if (typeof address === "string" || address === null) throw new Error("No port was assigned");
  return `http://127.0.0.1:${address.port}`;
}

afterEach(async () => {
  await new Promise<void>((resolve) => {
    if (!server) return resolve();
    server.closeAllConnections?.();
    server.close(() => resolve());
  });
  server = undefined;
});

describe("a model server on this machine", () => {
  it("is reached at the address the guard produced, with the request a runner expects", async () => {
    const input = matterInput();
    const derived = analyseMatter(input);
    const seen: { method: string; url: string; body: string }[] = [];

    const url = await listening((request) => {
      seen.push(request);
      return {
        status: 200,
        body: JSON.stringify({
          choices: [{ message: { content: `${input.reference} — ${derived.summary}` } }],
          usage: { prompt_tokens: 300, completion_tokens: 60 },
        }),
      };
    });

    const { analysis, usage } = await new LocalAIProvider({ url, model: "test-model" }).analyseMatter(
      input,
    );

    expect(seen).toHaveLength(1);
    expect(seen[0]?.method).toBe("POST");
    expect(seen[0]?.url).toBe("/v1/chat/completions");

    const sent = JSON.parse(seen[0]?.body ?? "{}") as {
      model: string;
      stream: boolean;
      messages: { role: string; content: string }[];
    };
    expect(sent.model).toBe("test-model");
    expect(sent.stream).toBe(false);
    expect(sent.messages.map((message) => message.role)).toEqual(["system", "user"]);

    expect(analysis.summary).toContain(derived.summary);
    expect(usage).toEqual({ inputTokens: 300, outputTokens: 60, costCents: 0 });
  });

  it("makes one request for a whole analysis, and none for the review", async () => {
    const input = matterInput();
    const derived = analyseMatter(input);
    let requests = 0;

    const url = await listening(() => {
      requests += 1;
      return {
        status: 200,
        body: JSON.stringify({
          choices: [{ message: { content: `${input.reference} — ${derived.summary}` } }],
        }),
      };
    });

    const provider = new LocalAIProvider({ url, model: "test-model" });
    const { analysis } = await provider.analyseMatter(input);
    await provider.reviewAnalysis({ analysis, matter: input });

    expect(requests).toBe(1);
  });

  it("gives up on a server that never answers, and calls it slow rather than absent", async () => {
    // The two have different remedies — start the server, or the machine is too
    // small for the model somebody chose — so the analysis must not confuse them.
    const input = matterInput();
    const url = await listening(() => null);

    const { analysis } = await new LocalAIProvider({
      url,
      model: "test-model",
      timeoutMs: 300,
    }).analyseMatter(input);

    expect(analysis.summary).toBe(analyseMatter(input).summary);
    expect(analysis.warnings.join(" ")).toMatch(/did not answer within/);
    expect(analysis.warnings.join(" ")).not.toMatch(/could not be reached/);
  });

  it("keeps the analysis whole when the server answers with nonsense", async () => {
    const input = matterInput();
    const derived = analyseMatter(input);
    const url = await listening(() => ({ status: 200, body: "<html>not json</html>" }));

    const { analysis } = await new LocalAIProvider({ url, model: "test-model" }).analyseMatter(input);

    expect(analysis.summary).toBe(derived.summary);
    expect(analysis.contradictions).toEqual(derived.contradictions);
    expect(analysis.warnings.join(" ")).toMatch(/not readable/);
  });
});
