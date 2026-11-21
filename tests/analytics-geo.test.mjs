import assert from 'node:assert/strict';
import test from 'node:test';
import { maskAnalyticsIp, normalizeAnalyticsCity, normalizeAnalyticsCountryCode, normalizeAnalyticsCountryRegion } from '../lib/analytics-geo.ts';
test('masks IPv4 addresses to a /24-style prefix', () => assert.equal(maskAnalyticsIp('203.0.113.42'), '203.0.113.xxx'));
test('masks compressed IPv6 addresses to a /48 prefix', () => assert.equal(maskAnalyticsIp('2001:db8:abcd:1234::1'), '2001:db8:abcd::/48'));
test('masks IPv4-mapped IPv6 addresses without retaining host bits', () => assert.equal(maskAnalyticsIp('::ffff:192.0.2.25'), '0:0:0::/48'));
test('rejects invalid IP addresses', () => {
  assert.equal(maskAnalyticsIp('203.0.113.999'), null);
  assert.equal(maskAnalyticsIp('not-an-ip'), null);
  assert.equal(maskAnalyticsIp(null), null);
});
test('decodes and sanitizes Vercel city headers', () => {
  assert.equal(normalizeAnalyticsCity('S%C3%A3o%20Paulo'), 'São Paulo');
  assert.equal(normalizeAnalyticsCity('  New%20York  '), 'New York');
  assert.equal(normalizeAnalyticsCity(''), null);
});
test('validates country and region codes', () => {
  assert.equal(normalizeAnalyticsCountryCode('us'), 'US');
  assert.equal(normalizeAnalyticsCountryCode('USA'), null);
  assert.equal(normalizeAnalyticsCountryRegion('ny'), 'NY');
  assert.equal(normalizeAnalyticsCountryRegion('New York'), null);
});
