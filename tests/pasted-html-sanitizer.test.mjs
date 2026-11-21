import test from 'node:test';
import assert from 'node:assert/strict';
import { isSafePastedUrl } from '../lib/pasted-html-sanitizer.ts';

test('allows safe web, relative and mailto URLs', () => {
  assert.equal(isSafePastedUrl('https://example.com'), true);
  assert.equal(isSafePastedUrl('/images/example.png', true), true);
  assert.equal(isSafePastedUrl('#section'), true);
  assert.equal(isSafePastedUrl('mailto:user@example.com'), true);
});

test('rejects executable and data URL schemes', () => {
  assert.equal(isSafePastedUrl('javascript:alert(1)'), false);
  assert.equal(isSafePastedUrl('data:text/html,evil', true), false);
  assert.equal(isSafePastedUrl('vbscript:msgbox(1)'), false);
  assert.equal(isSafePastedUrl('https:\\\\example.com'), false);
});
