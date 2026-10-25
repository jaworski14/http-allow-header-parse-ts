# http-allow-header-parse-ts

Parses an HTTP `Allow` header value into a `Set` of permitted methods, validating each token against the IANA HTTP method registry.

## Usage

```js
import { parseAllowHeader } from 'http-allow-header-parse-ts';

const allowed = parseAllowHeader('GET, POST, PUT');
// => Set { 'GET', 'POST', 'PUT' }

allowed.has('POST'); // true

parseAllowHeader('   get, post  ');
// => Set { 'GET', 'POST' }
```

## Why this exists

A server advertises its supported methods via the `Allow` header. Callers usually want a membership test, not a raw comma-separated string. This library gives you that membership primitive as a `Set`, with method names normalized to their canonical (registered) casing so `has('get')` and `has('GET')` both work.

The trade-off: tokens not in the IANA registry throw an `Error` rather than being silently dropped. A silent drop would hide server misconfiguration; a loud throw makes the contract explicit and the failure debuggable.

## Edge case to know

An entirely blank or whitespace-only header returns an empty `Set` — the honest representation of "no methods advertised." An empty token between two commas (e.g. `GET,,POST`) is *not* treated as blank; it is treated as an unrecognized method and throws, because the empty string is not in the registry.
