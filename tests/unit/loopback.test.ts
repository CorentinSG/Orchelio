import { describe, expect, it } from "vitest";

import {
  LOOPBACK_PROMISE,
  NotLoopbackError,
  assertLoopback,
  isLoopback,
} from "@/lib/ai/loopback";

/**
 * Orchelio — the guard that lets a local model exist without a hole.
 *
 * This is the module the confidentiality check leans on, so the interesting
 * tests are all refusals. Anything this accepts by mistake is a socket the
 * product promised never to open.
 */

describe("what it accepts", () => {
  it("takes the address a local model server actually listens on", () => {
    expect(assertLoopback("http://127.0.0.1:11434").hostname).toBe("127.0.0.1");
  });

  it("takes the rest of 127.0.0.0/8, which is all loopback", () => {
    // Some setups bind a service to 127.0.0.2 to keep it off the default
    // address. That is still the machine talking to itself.
    for (const host of ["127.0.0.2", "127.1.2.3", "127.255.255.254"]) {
      expect(isLoopback(`http://${host}:8080`), host).toBe(true);
    }
  });

  it("takes IPv6 loopback in both the forms a URL carries it", () => {
    expect(isLoopback("http://[::1]:11434")).toBe(true);
    expect(isLoopback("http://[0:0:0:0:0:0:0:1]:11434")).toBe(true);
  });

  it("keeps the path, so a server behind a prefix still works", () => {
    expect(assertLoopback("http://127.0.0.1:11434/api/v1").pathname).toBe("/api/v1");
  });
});

describe("what it refuses, and why the refusal says so", () => {
  it("refuses every address that is not on this machine", () => {
    for (const url of [
      "https://api.anthropic.com",
      "http://192.168.1.10:11434",
      "http://10.0.0.5:11434",
      "http://172.16.0.1:11434",
      "http://0.0.0.0:11434",
      "http://128.0.0.1:11434",
      "http://126.255.255.255:11434",
    ]) {
      expect(isLoopback(url), url).toBe(false);
    }
  });

  it("refuses a private network address, which is not the same as this machine", () => {
    // The trap worth naming: 192.168.x.x feels local and is not. A request
    // there crosses a network and can be captured on it.
    expect(() => assertLoopback("http://192.168.1.10:11434")).toThrow(NotLoopbackError);
    expect(() => assertLoopback("http://192.168.1.10:11434")).toThrow(/not an address on this machine/i);
  });

  it("refuses localhost, and says what to write instead", () => {
    // A name is resolved by the machine, and /etc/hosts or a DNS server can
    // point it anywhere. The whole value of the check is not depending on the
    // machine's configuration being benign.
    expect(() => assertLoopback("http://localhost:11434")).toThrow(/is a name/i);
    expect(() => assertLoopback("http://localhost:11434")).toThrow(/127\.0\.0\.1/);
  });

  it("refuses a name that merely looks local", () => {
    for (const host of ["localhost.evil.com", "127.0.0.1.evil.com", "loopback"]) {
      expect(isLoopback(`http://${host}:11434`), host).toBe(false);
    }
  });

  it("refuses a scheme that is not a request to this machine", () => {
    for (const url of ["file:///etc/passwd", "ftp://127.0.0.1", "ws://127.0.0.1:11434"]) {
      expect(isLoopback(url), url).toBe(false);
    }
  });

  it("refuses nothing at all, rather than defaulting to something", () => {
    // A default would be an address nobody chose, and the point of the module
    // is that every address is chosen and checked.
    for (const value of ["", "   ", null, undefined]) {
      expect(isLoopback(value)).toBe(false);
    }
    expect(() => assertLoopback(undefined)).toThrow(/No address was given/i);
  });

  it("refuses something that is not an address at all", () => {
    for (const value of ["11434", "127.0.0.1:11434", "not a url"]) {
      // Note the second one: a bare host and port is not a URL, and guessing a
      // scheme for it would be the module inventing part of the answer.
      expect(isLoopback(value), value).toBe(false);
    }
  });

  it("refuses credentials smuggled into the address", () => {
    // `http://127.0.0.1@evil.com/` parses with hostname evil.com — the part
    // before the @ is a username. A check reading the string left to right
    // would be fooled; parsing first is what stops it.
    expect(isLoopback("http://127.0.0.1@evil.com/")).toBe(false);
  });
});

describe("what the firm is told", () => {
  it("says where the material goes, in words a client could be given", () => {
    expect(LOOPBACK_PROMISE).toMatch(/never reaches a network card/i);
    expect(LOOPBACK_PROMISE).toMatch(/no material reaches a third party/i);
  });

  it("says the promise is checked rather than given", () => {
    // The sentence a lawyer repeats to a client has to be the one that is
    // true: not "we only call localhost" but "there is no path to anywhere
    // else, and the build fails if that stops being so".
    expect(LOOPBACK_PROMISE).toMatch(/build fails/i);
  });
});
