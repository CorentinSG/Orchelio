import { NotFoundNotice } from "@/components/not-found-notice";

export const metadata = { title: "Page not found" };

/**
 * 404 inside the workspace.
 *
 * Exists so the root boundary does not render here. The shell already provides
 * the `<main>` landmark and the wordmark, and the root version brings both —
 * which gave the page two "main" regions, one nested inside the other.
 *
 * It is also the better screen: somebody who followed a stale link keeps their
 * sidebar and their firm, rather than being dropped onto a page that looks
 * signed out.
 */
export default function WorkspaceNotFound() {
  return <NotFoundNotice withWordmark={false} />;
}
