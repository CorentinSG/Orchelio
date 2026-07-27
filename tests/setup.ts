import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

// React Testing Library keeps rendered trees in the document between tests
// unless they are explicitly torn down.
afterEach(() => {
  cleanup();
});
