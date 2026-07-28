import "server-only";

import { requestScoped } from "@/lib/cache";

/**
 * Orchelio — the instant a request began.
 *
 * Memoised for the request, so every date on a page is measured from the same
 * moment. Without it, a list rendered across a second boundary can say "in 12
 * days" on one row and "in 13 days" on another for the same date — a small
 * inconsistency that looks like a bug in a product about dates.
 *
 * It also keeps `new Date()` out of the components themselves, which is what
 * the React compiler's purity rule is asking for: a component that reads the
 * clock renders differently each time it is called with the same props.
 */
export const requestNow = requestScoped((): Date => new Date());
