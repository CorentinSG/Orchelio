import { NotFoundNotice } from "@/components/not-found-notice";

export const metadata = { title: "Page not found" };

/** 404, outside the workspace. Generic on purpose — see `NotFoundNotice`. */
export default function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="flex min-h-dvh items-center justify-center px-4 py-16">
      <NotFoundNotice />
    </main>
  );
}
