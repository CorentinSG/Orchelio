import { beforeEach, describe, expect, it } from "vitest";

import { consumeAttempt, resetAllAttempts, resetAttempts } from "@/lib/auth/rate-limit";

describe("sign-in throttling", () => {
  beforeEach(() => {
    resetAllAttempts();
  });

  it("allows the first ten attempts and refuses the eleventh", () => {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      expect(consumeAttempt("someone@demo.local").allowed).toBe(true);
    }
    expect(consumeAttempt("someone@demo.local").allowed).toBe(false);
  });

  it("counts each address separately", () => {
    for (let attempt = 1; attempt <= 11; attempt += 1) {
      consumeAttempt("first@demo.local");
    }

    expect(consumeAttempt("first@demo.local").allowed).toBe(false);
    expect(consumeAttempt("second@demo.local").allowed).toBe(true);
  });

  it("treats an address case-insensitively, so casing cannot reset the counter", () => {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      consumeAttempt("someone@demo.local");
    }

    expect(consumeAttempt("SOMEONE@Demo.Local").allowed).toBe(false);
    expect(consumeAttempt("  someone@demo.local  ").allowed).toBe(false);
  });

  it("clears the counter after a successful sign-in", () => {
    for (let attempt = 1; attempt <= 10; attempt += 1) {
      consumeAttempt("someone@demo.local");
    }
    resetAttempts("someone@demo.local");

    expect(consumeAttempt("someone@demo.local").allowed).toBe(true);
  });

  it("opens a fresh window once the previous one has expired", () => {
    const start = 1_000_000;
    for (let attempt = 1; attempt <= 11; attempt += 1) {
      consumeAttempt("someone@demo.local", start);
    }
    expect(consumeAttempt("someone@demo.local", start).allowed).toBe(false);

    const afterWindow = start + 15 * 60 * 1000 + 1;
    expect(consumeAttempt("someone@demo.local", afterWindow).allowed).toBe(true);
  });
});
