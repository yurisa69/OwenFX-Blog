import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import postcss from 'postcss';
import createOwenFxCssScopePlugin from '../scripts/postcss-css-scope.cjs';

test('main stylesheet selectors and keyframes stay inside the main root', async () => {
  const input = ':root{--surface:#000}html[data-theme="light"] .card{color:#111}*,*::before{box-sizing:border-box}@keyframes fade-in{from{opacity:0}to{opacity:1}}@keyframes slide-in{from{transform:translateX(8px)}to{transform:translateX(0)}}.animate{animation:fade-in 1s ease, slide-in 2s ease;animation-name:fade-in, slide-in;font-family:ui-sans-serif, system-ui, sans-serif;transition:color .2s ease, background .2s ease}';
  const result = await postcss([createOwenFxCssScopePlugin()]).process(input, {
    from: '/repo/app/(site)/globals.css',
  });

  assert.match(result.css, /\.site-css-scope\s*\{--surface:#000\}/);
  assert.match(result.css, /\.site-css-scope\[data-theme="light"\]\s+\.card/);
  assert.match(result.css, /\.site-css-scope\s+\*/);
  assert.match(result.css, /@keyframes site-css-scope-fade-in/);
  assert.match(result.css, /@keyframes site-css-scope-slide-in/);
  assert.match(result.css, /animation:site-css-scope-fade-in 1s ease, site-css-scope-slide-in 2s ease/);
  assert.match(result.css, /animation-name:site-css-scope-fade-in, site-css-scope-slide-in/);
  assert.match(result.css, /font-family:ui-sans-serif, system-ui, sans-serif/);
  assert.match(result.css, /transition:color .2s ease, background .2s ease/);
  assert.doesNotMatch(result.css, /(^|[},])\s*(?:html|body|:root)/);
});

test('admin stylesheet selectors and keyframes stay inside the admin root', async () => {
  const input = '@property --admin-bg-primary{syntax:"<color>";inherits:true;initial-value:#000}html[data-admin-theme="light"] .admin-card{color:#111}@keyframes pulse{from{opacity:0}to{opacity:1}}.animate{animation:pulse 1s ease}';
  const result = await postcss([createOwenFxCssScopePlugin()]).process(input, {
    from: '/repo/app/(admin)/admin/admin.css',
  });

  assert.match(result.css, /\.admin-css-scope\[data-admin-theme="light"\]\s+\.admin-card/);
  assert.match(result.css, /@property --admin-bg-primary/);
  assert.match(result.css, /@keyframes admin-css-scope-pulse/);
  assert.match(result.css, /animation:admin-css-scope-pulse 1s ease/);
  assert.doesNotMatch(result.css, /(^|[},])\s*(?:html|body|:root)/);
});


test('admin registered custom properties use an isolated namespace', () => {
  const source = readFileSync(new URL('../app/(admin)/admin/admin.css', import.meta.url), 'utf8');
  const registrations = [...source.matchAll(/@property\s+(--[\w-]+)/g)].map((match) => match[1]);

  assert.ok(registrations.length > 0, 'admin theme color registrations should remain covered');
  assert.ok(registrations.every((name) => name.startsWith('--admin-')));
});
