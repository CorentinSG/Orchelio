import { OrchelioWordmark } from "@/components/brand";

/** Loading screen. Carries the Orchelio identity, as required by the specification. */
export default function Loading() {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4">
      <div className="flex flex-col items-center gap-3 text-center">
        <OrchelioWordmark size="lg" />
        <p className="text-sm text-ink-muted" role="status">
          Loading…
        </p>
      </div>
    </div>
  );
}
