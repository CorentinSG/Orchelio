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
        refused.push(`${file.name} est en .${extension || "inconnu"}`);
        continue;
      }
      if (file.size > MAX_DOCUMENT_SIZE_BYTES) {
        refused.push(`${file.name} dépasse ${MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024} Mo`);
        continue;
      }
      accepted.push({ name: file.name, size: file.size, type: file.type });
    }

    setChosen((previous) => {
      // Named rather than silently dropped: a file that vanished without a
      // word is one somebody believes is on the matter.
      const room = MAX_FILES_AT_ONCE - previous.length;
      if (accepted.length > room) {
        refused.push(`${accepted.length - room} de plus que les ${MAX_FILES_AT_ONCE} autorisés à la fois`);
      }
      return [...previous, ...accepted.slice(0, Math.max(0, room))];
    });

    setProblem(
      refused.length === 0
        ? null
        : `Non ajouté${refused.length > 1 ? "s" : ""} — ${refused.join(" ; ")}. Orchelio accepte ${ALLOWED_DOCUMENT_EXTENSIONS.join(", ")}.`,
    );
  }

  return (
    <form method="post" action="/api/start" className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="clientName" className="block text-sm font-medium text-ink">
            Qui est le client ?
          </label>
          <p className="mt-0.5 text-sm text-ink-muted">
            {"Un nom fictif. Jamais une personne réelle — ceci est une démonstration."}
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
            De quoi s’agit-il ?
          </label>
          <p className="mt-0.5 text-sm text-ink-muted">
            {"Une ligne, dans vos propres mots. Vous pourrez la changer plus tard."}
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
          Quel type de dossier ?
        </label>
        <p className="mt-0.5 text-sm text-ink-muted">
          {"Seuls les types que ce cabinet a déclaré traiter sont proposés."}
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
          <p className="block text-sm font-medium text-ink">Qu’avez-vous au dossier ?</p>
          <p className="mt-0.5 text-sm text-ink-muted">
            {
              "Facultatif. Glissez-en plusieurs à la fois — Orchelio enregistre leur nom et rien d’autre, et vous pourrez dire plus tard ce qu’est chacun."
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
              Glissez des fichiers ici, ou{" "}
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                className="font-medium text-brand underline underline-offset-4"
              >
                choisissez-les
              </button>
              .
            </p>
            <p className="mt-1 text-xs text-ink-subtle">
              {ALLOWED_DOCUMENT_EXTENSIONS.join(", ")} · jusqu’à{" "}
              {MAX_DOCUMENT_SIZE_BYTES / 1024 / 1024} Mo chacun · {MAX_FILES_AT_ONCE} au plus à la
              fois · documents fictifs uniquement
            </p>

            <input
              ref={inputRef}
              type="file"
              multiple
              accept={ACCEPT}
              className="sr-only"
              aria-label="Choisir des documents"
              onChange={(event) => accept(event.target.files)}
            />

            {chosen.length > 0 ? (
              <ul className="mt-4 space-y-1 text-sm text-ink">
                {chosen.map((file, index) => (
                  <li key={`${file.name}-${index}`}>
                    {file.name}{" "}
                    <span className="text-ink-muted">
                      ({Math.max(1, Math.round(file.size / 1024))} Ko)
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
        Ouvrir le dossier
      </button>
    </form>
  );
}
