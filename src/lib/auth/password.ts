import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

/**
 * Orchelio — password hashing.
 *
 * scrypt from the Node.js standard library: memory-hard, no dependency, and
 * available everywhere the application runs. Passwords are never stored, never
 * logged and never returned from any query.
 *
 * The stored value is self-describing —
 *
 *     scrypt$N$r$p$<salt base64url>$<hash base64url>
 *
 * so the cost parameters can be raised later without invalidating existing
 * hashes: an old hash still verifies with the parameters it was created with.
 */

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

const COST_N = 16384;
const BLOCK_SIZE_R = 8;
const PARALLELISM_P = 1;
const KEY_LENGTH = 32;
const SALT_LENGTH = 16;

// scrypt needs roughly 128 * N * r bytes; Node's default cap is lower than that
// for N = 16384, so the limit is raised explicitly with headroom.
const MAX_MEMORY = 64 * 1024 * 1024;

function encode(buffer: Buffer): string {
  return buffer.toString("base64url");
}

export async function hashPassword(password: string): Promise<string> {
  if (password.length === 0) {
    throw new Error("Refusing to hash an empty password.");
  }

  const salt = randomBytes(SALT_LENGTH);
  const derived = await scryptAsync(password, salt, KEY_LENGTH, {
    N: COST_N,
    r: BLOCK_SIZE_R,
    p: PARALLELISM_P,
    maxmem: MAX_MEMORY,
  });

  return `scrypt$${COST_N}$${BLOCK_SIZE_R}$${PARALLELISM_P}$${encode(salt)}$${encode(derived)}`;
}

/**
 * Verifies a password against a stored hash.
 *
 * Returns false rather than throwing on a malformed hash: a corrupted record
 * must not become a way to distinguish "no such user" from "bad password".
 * The comparison is constant-time.
 */
export async function verifyPassword(password: string, stored: string): Promise<boolean> {
  const parts = stored.split("$");
  if (parts.length !== 6 || parts[0] !== "scrypt") {
    return false;
  }

  const [, rawN, rawR, rawP, rawSalt, rawHash] = parts;
  const N = Number(rawN);
  const r = Number(rawR);
  const p = Number(rawP);

  if (!Number.isInteger(N) || !Number.isInteger(r) || !Number.isInteger(p)) {
    return false;
  }

  let expected: Buffer;
  let actual: Buffer;
  try {
    expected = Buffer.from(rawHash ?? "", "base64url");
    actual = await scryptAsync(password, Buffer.from(rawSalt ?? "", "base64url"), expected.length, {
      N,
      r,
      p,
      maxmem: MAX_MEMORY,
    });
  } catch {
    return false;
  }

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

/**
 * A hash of a value nobody will ever submit.
 *
 * Used to spend the same work verifying a password for an email that does not
 * exist as for one that does, so response timing does not reveal which demo
 * accounts are real.
 */
export const DUMMY_PASSWORD_HASH =
  "scrypt$16384$8$1$AAAAAAAAAAAAAAAAAAAAAA$AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA";
