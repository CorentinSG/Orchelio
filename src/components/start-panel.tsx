"use client";

import { useRef, useState } from "react";

import { MAX_FILES_AT_ONCE } from "@/lib/start/guided";
import { ALLOWED_DOCUMENT_EXTENSIONS, MAX_DOCUMENT_SIZE_BYTES } from "@/lib/constants";

/**
 * Orchelio — the one form that opens a matter.
 *
 * Four answers, and three of them are things the person already knows without
 * looking anything up: who the client is, what it is about, and which kind of
 * matter it is. The fourth is dragging in whatever files they have.
 *
 * Several files at once, and **no category asked for any of them**. Classifying
 * a document before reading it is exactly the step that makes the long route
 * feel like data entry, and a wrong category is worse than none — the
 * missing-documents check would then believe something is on file that is not.
 * They land as unsorted and the matter's documents tab is where a person says
 * what they are.
 *
 * As on the upload panel, the file itself is never posted. The browser reads
 * the name, type and size and sends those as text; there is no code path here
 * that could send the bytes.
 */

const ACCEPT = ALLOWED_DOCUMENT_EXTENSIONS.map((extension) => `.${extension}`).join(",");

type Chosen = { name: string; size: number; type: string };

function extensionOf(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function StartPanel({
  matterTypes,
  canAddDocuments,
}: {
  matterTypes: readonly { key: string; label: string }[];
  canAddDocuments: boolean;
}) {
  const [chosen, setChosen] = useState<Chosen[]>([]);
  const [problem, setProblem] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function accept(files: FileList | null) {
    if (!files || files.length === 0) return;

    const accepted: Chosen[] = [];
    const refused: string[] = [];

    for (const file of Array.from(files)) {
      const extension = extensionOf(file.name);
      if (!(ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(extension)) {
        refused.push(`${file.name} is .${extension || "unknown"}`);
        continue;
      }
      if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
        refused.push(`${file.name} is over ${MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024} MB`);
        continue;
      }
      accepted.push({ name: file.name, size: file.size, type: file.type });
    }

    setChosen((previous) => {
      // Named rather than silently dropped: a file that vanished without a
      // word is one somebody believes is on the matter.
      const room = MAX_FILES_AT_ONCE - previous.length;
      if (accepted.length > room) {
        refused.push(`${accepted.length - room} more than the ${MAX_FILES_AT_ONCE} allowed at once`);
      }
      return [...previous, ...accepted.slice(0, Math.max(0, room))];
    });

    setProblem(
      refused.length === 0
        ? null
        : `Not added — ${refused.join("; ")}. Orchelio accepts ${ALLOWED_DOCUMENT_EXTENSIONS.join(", ")}.`,
    );
  }

  return (
    <form method="post" action="/api/start" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-ink">
            Who is the client?
          </label>
          <p className="mt-0.5 text-sm text-ink-muted">
            {"A fictional name. Never a real person — this is a demonstration."}
          </p>
          <input
            id="clientName"
            name="clientName"
            required
            maxLength={120}
            autoComplete="off"
            className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-ink">
            What is it about?
          </label>
          <p className="mt-0.5 text-sm text-ink-muted">
            {"One line, in your own words. You can change it later."}
          </p>
          <input
            id="title"
            name="title"
            required
            maxLength={200}
            autoComplete="off"
            className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
          />
        </div>
      </div>

      <div>
        <label htmlFor="matterTypeKey" className="block text-sm font-medium text-ink">
          Which kind of matter?
        </label>
        <p className="mt-0.5 text-sm text-ink-muted">
          {"Only the kinds this firm said it handles are offered."}
        </p>
        <select
          id="matterTypeKey"
          name="matterTypeKey"
          required
          className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink sm:max-w-md"
        >
          {matterTypes.map((type) => (
            <option key={type.key} value={type.key}>
              {type.label}
            </option>
          ))}
        </select>
      </div>

      {canAddDocuments ? (
        <div>
          <p className="block text-sm font-medium text-ink">What do you have on file?</p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {
              "Optional. Drag several in at once — Orchelio records their names and nothing else, and you can say what each one is later."
            }
          </p>

          {chosen.map((file, index) => (
            <div key={`${file.name}-${index}`}>
              <input type="hidden" name="filename" value={file.name} />
              <input type="hidden" name="sizeBytes" value={file.size} />
              <input type="hidden" name="mimeType" value={file.type} />
            </div>
          ))}

          <div
            onDragOver={(event) => {
              event.preventDefault();
              setDragging(true);
            }}
            onDragLeave={() => setDragging(false)}
            onDrop={(event) => {
              event.preventDefault();
              setDragging(false);
              accept(event.dataTransfer.files);
            }}
            className={`mt-2 rounded-card border-2 border-dashed px-6 py-8 text-center ${
              dragging ? "border-brand bg-brand-soft" : "border-line bg-surface-muted"
            }`}
          >
            <p className="text-sm text-ink">
              Drag files here, or{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-medium text-brand underline underline-offset-4"
              >
                choose them
              </button>
              .
            </p>
            <p className="mt-1 text-xs text-ink-subtle">
              {ALLOWED_DOCUMENT_EXTENSIONS.join(", ")} · up to{" "}
              {MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024} MB each · at most {MAX_FILES_AT_ONCE} at once ·
              fictional documents only
            </p>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="sr-only"
              aria-label="Choose documents"
              onChange={(event) => accept(event.target.files)}
            />

            {chosen.length > 0 ? (
              <ul className="mt-4 space-y-1 text-sm text-ink">
                {chosen.map((file, index) => (
                  <li key={`${file.name}-${index}`}>
                    {file.name}{" "}
                    <span className="text-ink-muted">
                      ({Math.max(1, Math.round(file.size / 1024))} KB)
                    </span>
                  </li>
                ))}
              </ul>
            ) : null}

            {problem ? (
              <p role="alert" className="mt-4 text-sm font-medium text-danger">
                {problem}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <button
        type="submit"
        className="rounded-md bg-brand px-5 py-2.5 text-sm font-medium text-brand-ink hover:bg-brand-strong"
      >
        Open the matter
      </button>
    </form>
  );
}
