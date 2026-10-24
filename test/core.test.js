import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseAllowHeader, STANDARD_METHODS } from '../src/core.js';

test('single method returns a one-element Set', () => {
  const result = parseAllowHeader('GET');
  assert.deepStrictEqual(result, new Set(['GET']));
});

test('multiple methods are all included', () => {
  const result = parseAllowHeader('GET, POST, PUT');
  assert.deepStrictEqual(result, new Set(['GET', 'POST', 'PUT']));
});

test('method tokens are case-insensitive and canonicalized', () => {
  const result = parseAllowHeader('get, Post, pUt');
  assert.deepStrictEqual(result, new Set(['GET', 'POST', 'PUT']));
});

test('leading and trailing whitespace around the whole header is ignored', () => {
  const result = parseAllowHeader('   GET, POST   ');
  assert.deepStrictEqual(result, new Set(['GET', 'POST']));
});

test('optional whitespace around each comma is ignored', () => {
  const result = parseAllowHeader('GET   ,    POST');
  assert.deepStrictEqual(result, new Set(['GET', 'POST']));
});

test('blank header returns an empty Set', () => {
  assert.deepStrictEqual(parseAllowHeader(''), new Set());
});

test('whitespace-only header returns an empty Set', () => {
  assert.deepStrictEqual(parseAllowHeader('   \t  '), new Set());
});

test('duplicates are collapsed into a single Set entry', () => {
  const result = parseAllowHeader('GET, GET, get');
  assert.deepStrictEqual(result, new Set(['GET']));
});

test('all standard registry methods are accepted when listed together', () => {
  const all = STANDARD_METHODS.join(', ');
  const result = parseAllowHeader(all);
  assert.deepStrictEqual(result, new Set(STANDARD_METHODS));
});

test('every non-standard token throws an Error', () => {
  for (const bad of ['BREW', 'PATCHES', 'XYZZY', 'get-foo']) {
    assert.throws(
      () => parseAllowHeader(bad),
      /^Error: Unrecognized HTTP method in Allow header:/,
      `expected throw for ${bad}`,
    );
  }
});

test('a single bad token among good ones throws', () => {
  assert.throws(
    () => parseAllowHeader('GET, FOO, POST'),
    /^Error: Unrecognized HTTP method in Allow header: "FOO"$/,
  );
});

test('a non-string header value throws TypeError', () => {
  for (const bad of [null, undefined, 42, {}, [], true]) {
    assert.throws(
      () => parseAllowHeader(bad),
      /^TypeError: Allow header must be a string, got/,
      `expected TypeError for ${String(bad)}`,
    );
  }
});

test('an empty token between commas throws because it is not a registered method', () => {
  assert.throws(
    () => parseAllowHeader('GET,,POST'),
    /^Error: Unrecognized HTTP method in Allow header: ""$/,
  );
});
