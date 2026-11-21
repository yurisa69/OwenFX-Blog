import assert from 'node:assert/strict';
import test from 'node:test';
import { resolveAnalyticsSource } from '../lib/analytics.ts';

test('classifies missing referrer as direct traffic', () => {
  assert.deepEqual(resolveAnalyticsSource(null, 'https://owenfx.example/articles/a', null),
    { source_type: 'direct', source_name: null, referrer_host: null });
});
test('classifies search-engine referrers', () => {
  assert.deepEqual(resolveAnalyticsSource('https://www.google.com/search?q=owenfx', 'https://owenfx.example/', null),
    { source_type: 'search', source_name: null, referrer_host: 'google.com' });
});
test('classifies external referrers without storing their full URL', () => {
  assert.deepEqual(resolveAnalyticsSource('https://community.example/path?token=private', 'https://owenfx.example/', null),
    { source_type: 'referral', source_name: null, referrer_host: 'community.example' });
});
test('classifies same-host navigation as internal traffic', () => {
  assert.deepEqual(resolveAnalyticsSource('https://www.owenfx.example/articles/1', 'https://owenfx.example/software/a', null),
    { source_type: 'internal', source_name: null, referrer_host: 'owenfx.example' });
});
test('classifies and sanitizes campaign sources', () => {
  assert.deepEqual(resolveAnalyticsSource('https://newsletter.example/click', 'https://owenfx.example/', 'Email Newsletter !'),
    { source_type: 'campaign', source_name: 'EmailNewsletter', referrer_host: 'newsletter.example' });
});
test('ignores non-http referrer values', () => {
  assert.deepEqual(resolveAnalyticsSource('javascript:alert(1)', 'https://owenfx.example/', null),
    { source_type: 'direct', source_name: null, referrer_host: null });
});
