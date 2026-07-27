import { describe, expect, it } from "vitest";

import { DUMMY_PASSWORD_HASH, hashPassword, verifyPassword } from "@/lib/auth/password";

describe("password hashing", () => {
  it("verifies a correct password", async () => {
    const stored = await hashPassword("orchelio-demo");

    await expect(verifyPassword("orchelio-demo", stored)).resolves.toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const stored = await hashPassword("orchelio-demo");

    await expect(verifyPassword("orchelio-demo ", stored)).resolves.toBe(false);
    await expect(verifyPassword("Orchelio-Demo", stored)).resolves.toBe(false);
    await expect(verifyPassword("", stored)).resolves.toBe(false);
  });

  it("never stores the password itself", async () => {
    const stored = await hashPassword("orchelio-demo");

    expect(stored).not.toContain("orchelio-demo");
    expect(stored.startsWith("scrypt$")).toBe(true);
  });

  it("salts each hash, so identical passwords do not collide", async () => {
    const first = await hashPassword("orchelio-demo");
    const second = await hashPassword("orchelio-demo");

    expect(first).not.toBe(second);
    await expect(verifyPassword("orchelio-demo", first)).resolves.toBe(true);
    await expect(verifyPassword("orchelio-demo", second)).resolves.toBe(true);
  });

  it("refuses to hash an empty password", async () => {
    await expect(hashPassword("")).rejects.toThrow();
  });

  it("returns false for a malformed stored hash rather than throwing", async () => {
    for (const malformed of ["", "not-a-hash", "scrypt$abc", "bcrypt$1$2$3$4$5", "scrypt$x$y$z$a$b"]) {
      await expect(verifyPassword("orchelio-demo", malformed)).resolves.toBe(false);
    }
  });

  it("keeps the timing-defence dummy hash unusable", async () => {
    // Nothing may ever verify against it, or it would become a master password.
    for (const attempt of ["", "orchelio-demo", "password", "A"]) {
      await expect(verifyPassword(attempt, DUMMY_PASSWORD_HASH)).resolves.toBe(false);
    }
  });
});
