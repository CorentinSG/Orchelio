/**
 * Orchelio — the only kind of address the product may open a socket to.
 *
 * ## Why this module exists
 *
 * `npm run confidentiality:check` enforces that nothing in `src/` can make an
 * outbound request, against an allow-list that is **empty**. That is the
 * strongest promise this product makes, and it is the reason a firm can be told
 * "nothing leaves" without being asked to take anybody's word for it.
 *
 * A model running on the firm's own machine breaks that check without breaking
 * the promise. A request to 127.0.0.1 never reaches a network card. But a
 * static check cannot tell `fetch("http://127.0.0.1:11434")` from
 * `fetch("https://api.example.com")` by looking at the call — both are
 * `fetch(`. So the allow-list would have to be widened on trust, and an
 * allow-list widened on trust is a hole with a comment beside it.
 *
 * This module is what makes the distinction checkable instead. A module allowed
 * to reach a local model must obtain its address through `assertLoopback`,
 * which **cannot return anything that is not a loopback address**, and the
 * confidentiality check verifies the call is there. The guarantee moves from
 * "we promise we only call localhost" to "there is no code path by which a
 * different address could be reached".
 *
 * ## Why a hostname is refused, including `localhost`
 *
 * `localhost` is a name, and a name is resolved by the machine. An entry in
 * `/etc/hosts`, a DNS search domain or a captive network can point it
 * somewhere else, and nothing in this process would notice. The whole value of
 * the check is that it does not depend on the machine's configuration being
 * benign, so only a literal loopback address is accepted — and the refusal says
 * what to write instead, because "localhost is refused" without "use 127.0.0.1"
 * is a puzzle rather than an instruction.
 *
 * Pure and synchronous on purpose: no DNS, no socket, no clock. It answers from
 * the string alone, which is what makes it testable and what makes its refusal
 * impossible to race.
 */

export class NotLoopbackError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotLoopbackError";
  }
}

/** IPv6 loopback, in the forms a URL may carry it. */
const IPV6_LOOPBACK = new Set(["[::1]", "[0:0:0:0:0:0:0:1]"]);

/**
 * Whether this host part is a literal loopback address.
 *
 * The whole of 127.0.0.0/8 is loopback, not only 127.0.0.1 — some setups bind
 * a service to 127.0.0.2 to keep it off the default address.
 */
function isLoopbackHost(host: string): boolean {
  if (IPV6_LOOPBACK.has(host.toLowerCase())) return true;

  const parts = host.split(".");
  if (parts.length !== 4) return false;

  const octets = parts.map((part) => (/^\d{1,3}$/.test(part) ? Number(part) : Number.NaN));
  if (octets.some((octet) => !Number.isInteger(octet) || octet < 0 || octet > 255)) return false;

  return octets[0] === 127;
}

/**
 * The address of a service on this machine, or an error.
 *
 * Never returns a URL that is not loopback, and never returns a URL whose
 * scheme could carry the request off the machine. Callers hold the result; they
 * do not build one themselves.
 */
export function assertLoopback(value: string | null | undefined): URL {
  const raw = (value ?? "").trim();
  if (raw === "") {
    throw new NotLoopbackError(
      "No address was given for the local model. Set it to something like http://127.0.0.1:11434.",
    );
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new NotLoopbackError(
      `"${raw}" is not an address. It should look like http://127.0.0.1:11434.`,
    );
  }

  // `file:` reaches the disk and every other scheme reaches a network. Only
  // plain HTTP to this machine is a request that provably stays on it.
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new NotLoopbackError(
      `"${url.protocol}" is not a scheme Orchelio will open. Use http:// to an address on this machine.`,
    );
  }

  if (!isLoopbackHost(url.hostname)) {
    const named = /^[a-z]/i.test(url.hostname);
    throw new NotLoopbackError(
      named
        ? `"${url.hostname}" is a name, and a name is resolved by this machine — an entry in /etc/hosts or a DNS server could point it anywhere. Write the address itself: 127.0.0.1.`
        : `"${url.hostname}" is not an address on this machine. Orchelio only opens a connection to 127.0.0.1, so that nothing can leave it.`,
    );
  }

  return url;
}

/** Whether a stored address would be accepted, without throwing. */
export function isLoopback(value: string | null | undefined): boolean {
  try {
    assertLoopback(value);
    return true;
  } catch {
    return false;
  }
}

/**
 * What a firm is told about where its material goes.
 *
 * Shown on the confidentiality register beside the local-model row, and worded
 * for somebody who will be asked by a client where their file went.
 */
export const LOOPBACK_PROMISE =
  "The model runs on this machine. Orchelio connects to 127.0.0.1, which is the machine talking to itself — the request never reaches a network card, and no material reaches a third party. Orchelio will not open a connection to any other address; the address it uses is checked before the connection is made, and the build fails if that check is removed.";
