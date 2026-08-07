"use client";

import { useRef, useState } from "react";

import { Card } from "@/components/ui";
import type { DocumentCategory } from "@/lib/matters/documents";
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  MAX_DOCUMENT_SIZE_BYTES,
} from "@/lib/constants";

/**
 * Orchelio — simulated document upload.
 *
 * Drag a file in, or choose one. Its name, type and size are read in the
 * browser and posted as text; **the file itself is never uploaded**, never
 * stored and never read. That is the specification's rule, and doing it this
 * way makes the rule structural rather than a promise: there is no code path
 * that could send the bytes.
 *
 * The checks here — allowed extension, size limit — are a courtesy that tells
 * the user immediately. The server repeats both, because this copy runs in a
 * browser the user controls.
 */

const ACCEPT = ALLOWED_DOCUMENT_EXTENSIONS.map((extension) => `.${extension}`).join(",");

type Chosen = { name: string; size: number; type: string };

function extensionOf(filename: string): string {
  return filename.split(".").pop()?.toLowerCase() ?? "";
}

export function UploadPanel({
  matterId,
  categories,
}: {
  matterId: string;
  categories: readonly DocumentCategory[];
}) {
  const [chosen, setChosen] = useState<Chosen | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function accept(file: File | undefined) {
    if (!file) return;

    const extension = extensionOf(file.name);
    if (!(ALLOWED_DOCUMENT_EXTENSIONS as readonly string[]).includes(extension)) {
      setChosen(null);
      setProblem(
        `Orchelio accepte ${ALLOWED_DOCUMENT_EXTENSIONS.join(", ")}. Ce fichier est en .${extension || "inconnu"}.`,
      );
      return;
    }
    if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
      setChosen(null);
      setProblem(
        `Ce fichier fait ${(file.size / 1024 / 1024).toFixed(1)} Mo. La limite est de ${MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024} Mo.`,
      );
      return;
    }

    setProblem(null);
    setChosen({ name: file.name, size: file.size, type: file.type });
  }

  return (
    <Card
      title="Ajouter un document"
      description="Simulé : le fichier est resté sur votre ordinateur. Seuls son nom, son type et sa taille sont enregistrés."
    >
      <form method="post" action="/api/documents" className="space-y-4">
        <input type="hidden" name="matterId" value={matterId} />
        <input type="hidden" name="filename" value={chosen?.name ?? ""} />
        <input type="hidden" name="sizeBytes" value={chosen?.size ?? 0} />
        <input type="hidden" name="mimeType" value={chosen?.type ?? ""} />

        <div
          onDragOver={(event) => {
            event.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => {
            event.preventDefault();
            setDragging(false);
            accept(event.dataTransfer.files[0]);
          }}
          className={`rounded-card border-2 border-dashed px-6 py-8 text-center ${
            dragging ? "border-brand bg-brand-soft" : "border-line bg-surface-muted"
          }`}
        >
          <p className="text-sm text-ink">
            Glissez un fichier ici, ou{" "}
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className="font-medium text-brand underline underline-offset-4"
            >
              choisissez-en un
            </button>
            .
          </p>
          <p className="mt-1 text-xs text-ink-subtle">
            {ALLOWED_DOCUMENT_EXTENSIONS.join(", ")} · jusqu’à{" "}
            {MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024} Mo · documents fictifs uniquement
          </p>

          <input
            ref={inputRef}
            type="file"
            accept={ACCEPT}
            className="sr-only"
            aria-label="Choisir un document"
            onChange={(event) => accept(event.target.files?.[0])}
          />

          {chosen ? (
            <p className="mt-4 text-sm font-medium text-ink">
              {chosen.name}{" "}
              <span className="font-normal text-ink-muted">
                ({Math.max(1, Math.round(chosen.size / 1024))} Ko)
              </span>
            </p>
          ) : null}

          {problem ? (
            <p role="alert" className="mt-4 text-sm font-medium text-danger">
              {problem}
            </p>
          ) : null}
        </div>

        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-56 flex-1">
            <label htmlFor="category" className="block text-sm font-medium text-ink">
              De quel type de document s’agit-il ?
            </label>
            <select
              id="category"
              name="category"
              required
              className="mt-1.5 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink"
            >
              {categories.map((category) => (
                <option key={category.key} value={category.key}>
                  {category.label}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={!chosen}
            className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-brand-ink hover:bg-brand-strong disabled:opacity-50"
          >
            Ajouter le document
          </button>
        </div>
      </form>
    </Card>
  );
}
