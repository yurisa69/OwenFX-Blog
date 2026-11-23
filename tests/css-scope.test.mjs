import assert from 'node:assert/strict';
import test from 'node:test';
import postcss from 'postcss';
import createOwenFxCssScopePlugin from '../scripts/postcss-css-scope.cjs';

test('main stylesheet selectors and keyframes stay inside the main root', async () => {
  const input = ':root{--surface:#000}html[data-theme="light"] .card{color:#111}*,*::before{box-sizing:border-box}@keyframes fade-in{from{opacity:0}to{opacity:1}}.animate{animation:fade-in 1s ease}';
  const result = await postcss([createOwenFxCssScopePlugin()]).process(input, {
    from: '/repo/app/(site)/globals.css',
  });

  assert.match(result.css, /\.site-css-scope\s*\{--surface:#000\}/);
  assert.match(result.css, /\.site-css-scope\[data-theme="light"\]\s+\.card/);
  assert.match(result.css, /\.site-css-scope\s+\*/);
  assert.match(result.css, /@keyframes site-css-scope-fade-in/);
  assert.match(result.css, /animation:site-css-scope-fade-in 1s ease/);
  assert.doesNotMatch(result.css, /(^|[},])\s*(?:html|body|:root)/);
});

test('admin stylesheet selectors and keyframes stay inside the admin root', async () => {
  const input = 'html[data-admin-theme="light"] .admin-card{color:#111}@keyframes pulse{from{opacity:0}to{opacity:1}}.animate{animation:pulse 1s ease}';
  const result = await postcss([createOwenFxCssScopePlugin()]).process(input, {
    from: '/repo/app/(admin)/admin/admin.css',
  });

  assert.match(result.css, /\.admin-css-scope\[data-admin-theme="light"\]\s+\.admin-card/);
  assert.match(result.css, /@keyframes admin-css-scope-pulse/);
  assert.match(result.css, /animation:admin-css-scope-pulse 1s ease/);
  assert.doesNotMatch(result.css, /(^|[},])\s*(?:html|body|:root)/);
});
