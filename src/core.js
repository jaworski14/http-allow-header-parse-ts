/*
 * Method registry as per the IANA HTTP Method Registry snapshot
 * (https://www.iana.org/assignments/http-methods/http-methods.xhtml).
 * We hardcode the standard set rather than fetching at runtime because
 * the library must work with zero network access. If a future RFC
 * registers a new method, this array is the single place to update.
 */
export const STANDARD_METHODS = Object.freeze([
  'ACL',
  'BASELINE-CONTROL',
  'BIND',
  'CHECKIN',
  'CHECKOUT',
  'CONNECT',
  'COPY',
  'DELETE',
  'GET',
  'HEAD',
  'LABEL',
  'LINK',
  'LOCK',
  'MERGE',
  'MKACTIVITY',
  'MKCALENDAR',
  'MKCOL',
  'MKREDIRECTREF',
  'MKWORKSPACE',
  'MOVE',
  'OPTIONS',
  'PATCH',
  'POST',
  'PROPFIND',
  'PROPPATCH',
  'PUT',
  'REBIND',
  'REPORT',
  'SEARCH',
  'SUBSCRIBE',
  'UNBIND',
  'UNCHECKOUT',
  'UNLINK',
  'UNLOCK',
  'UNSUBSCRIBE',
  'UPDATE',
  'UPDATEREDIRECTREF',
  'VERSION-CONTROL',
]);

/**
 * Case-insensitive membership test against the standard method registry.
 * Tokens are compared case-insensitively per RFC 9110 §5.5, but the
 * canonical (registered) casing is what we store in the result Set.
 */
function findCanonical(token) {
  const upper = token.toUpperCase();
  for (const m of STANDARD_METHODS) {
    if (m === upper) return m;
  }
  return null;
}

/**
 * Parse an HTTP Allow header value into the set of standard methods it lists.
 *
 * The Allow header (RFC 9110 §18.3) lists permitted methods as a
 * comma-separated list. RFC 9110 §5.5 permits optional whitespace (OWS)
 * around the list and its separators. Method tokens are case-insensitive.
 *
 * Design decision: we reject any token that is not in the IANA registry and
 * throw, rather than silently dropping it. A silent drop would hide server
 * misconfiguration from the caller; a thrown error makes the contract
 * explicit and debuggable.
 *
 * @param {string} header - raw Allow header value
 * @returns {Set<string>} canonical-cased method names; empty if header is blank/whitespace-only
 * @throws {TypeError} if header is not a string
 * @throws {Error} if any token is not a registered method
 */
export function parseAllowHeader(header) {
  if (typeof header !== 'string') {
    throw new TypeError(`Allow header must be a string, got ${typeof header}`);
  }

  // trim() handles leading/trailing OWS; a blank header yields an empty Set,
  // which is the honest representation of "no methods advertised".
  const trimmed = header.trim();
  const result = new Set();

  if (trimmed === '') {
    return result;
  }

  const tokens = trimmed.split(',');
  for (let i = 0; i < tokens.length; i++) {
    // Per-token trim covers OWS on both sides of each comma.
    const token = tokens[i].trim();
    const canonical = findCanonical(token);
    if (canonical === null) {
      // Rejecting unregistered tokens keeps the caller from acting on a
      // method the server cannot actually support.
      throw new Error(`Unrecognized HTTP method in Allow header: ${JSON.stringify(token)}`);
    }
    result.add(canonical);
  }

  return result;
}
