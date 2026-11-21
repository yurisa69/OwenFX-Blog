import assert from 'node:assert/strict';
import test from 'node:test';
import {
  isExternalAnalyticsSource,
  normalizeAnalyticsSourceSnapshot,
  resolveAnalyticsSource,
} from '../lib/analytics.ts';

test('classifies missing referrer as direct traffic', () => {
  assert.deepEqual(resolveAnalyticsSource(null, 'https://owenfx.example/articles/a', null), {
    source_type: 'direct', source_name: null, referrer_host: null,
    utm_source: null, utm_medium: null, utm_campaign: null,
  });
});

test('classifies search-engine referrers', () => {
  assert.deepEqual(resolveAnalyticsSource('https://www.google.com/search?q=owenfx', 'https://owenfx.example/', null), {
    source_type: 'search', source_name: null, referrer_host: 'google.com',
    utm_source: null, utm_medium: null, utm_campaign: null,
  });
});

test('classifies external referrers without storing their full URL', () => {
  assert.deepEqual(resolveAnalyticsSource('https://community.example/path?token=private', 'https://owenfx.example/', null), {
    source_type: 'referral', source_name: null, referrer_host: 'community.example',
    utm_source: null, utm_medium: null, utm_campaign: null,
  });
});

test('classifies same-site client navigation as internal', () => {
  assert.deepEqual(resolveAnalyticsSource('https://www.owenfx.example/articles/1', 'https://owenfx.example/software/a', null), {
    source_type: 'internal', source_name: null, referrer_host: 'owenfx.example',
    utm_source: null, utm_medium: null, utm_campaign: null,
  });
});

test('classifies and preserves Chinese campaign parameters', () => {
  assert.deepEqual(resolveAnalyticsSource(null, 'https://owenfx.example/', '微信公众号', '社交媒体', '秋季活动'), {
    source_type: 'campaign', source_name: '微信公众号', referrer_host: null,
    utm_source: '微信公众号', utm_medium: '社交媒体', utm_campaign: '秋季活动',
  });
});

test('classifies campaign traffic even when only a campaign name is supplied', () => {
  const result = resolveAnalyticsSource(null, 'https://owenfx.example/', null, null, '秋季活动');
  assert.equal(result.source_type, 'campaign');
  assert.equal(result.source_name, '秋季活动');
  assert.equal(result.utm_campaign, '秋季活动');
});

test('ignores non-http referrer values', () => {
  assert.equal(resolveAnalyticsSource('javascript:alert(1)', 'https://owenfx.example/', null).source_type, 'direct');
});

test('does not mistake lookalike hosts for search engines', () => {
  assert.equal(resolveAnalyticsSource('https://google.com.attacker.example/', 'https://owenfx.example/', null).source_type, 'referral');
});

test('normalizes and validates attribution snapshots', () => {
  assert.deepEqual(normalizeAnalyticsSourceSnapshot({
    source_type: 'campaign', source_name: '  微信公众号  ', referrer_host: 'WWW.Example.COM.',
  }), {
    source_type: 'campaign', source_name: '微信公众号', referrer_host: 'example.com',
  });
  assert.equal(normalizeAnalyticsSourceSnapshot({ source_type: 'unknown', source_name: null, referrer_host: null }), null);
  assert.equal(normalizeAnalyticsSourceSnapshot({ source_type: 'referral', source_name: null, referrer_host: 'https://bad.example/path' })?.referrer_host, null);
});

test('only external acquisition categories update last-external attribution', () => {
  assert.equal(isExternalAnalyticsSource({ source_type: 'search', source_name: null, referrer_host: 'google.com' }), true);
  assert.equal(isExternalAnalyticsSource({ source_type: 'internal', source_name: null, referrer_host: 'owenfx.example' }), false);
  assert.equal(isExternalAnalyticsSource({ source_type: 'direct', source_name: null, referrer_host: null }), false);
});
