/**
 * Orchelio — the firm scope.
 *
 * Every data-access function in `src/lib/data` takes one of these as its first
 * argument. Making the firm a required parameter rather than an ambient value
 * means a caller cannot forget it: the code does not compile.
 *
 * The scope is always derived from the caller's verified membership — never
 * from a URL, a form field or a header. `src/lib/auth/firm-context.ts` is the
 * only place that produces one.
 */

export type FirmScope = {
  readonly firmId: string;
};

/** Narrows an arbitrary value to a usable scope, for boundaries that lose types. */
export function isFirmScope(value: unknown): value is FirmScope {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { firmId?: unknown }).firmId === "string" &&
    (value as { firmId: string }).firmId.length > 0
  );
}
