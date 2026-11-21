import { isIP } from 'node:net';
export function normalizeAnalyticsCountryCode(value: string | null): string | null {
  const normalized = value?.trim().toUpperCase() || '';
  return /^[A-Z]{2}$/u.test(normalized) ? normalized : null;
}
export function normalizeAnalyticsCountryRegion(value: string | null): string | null {
  const normalized = value?.trim().toUpperCase() || '';
  return /^[A-Z0-9]{1,3}$/u.test(normalized) ? normalized : null;
}
export function normalizeAnalyticsCity(value: string | null): string | null {
  if (!value) return null;
  let decoded = value;
  try { decoded = decodeURIComponent(value); } catch { /* Keep malformed input for safe sanitization. */ }
  const normalized = decoded.normalize('NFKC').replace(/[\u0000-\u001f\u007f]/gu, '').replace(/\s+/gu, ' ').trim().slice(0, 80);
  return normalized || null;
}
function expandIpv6(value: string): string[] | null {
  let address = value.toLowerCase();
  if (address.includes('.')) {
    const separator = address.lastIndexOf(':');
    const octets = address.slice(separator + 1).split('.').map(Number);
    if (octets.length !== 4 || octets.some(part => !Number.isInteger(part) || part < 0 || part > 255)) return null;
    const high = ((octets[0] << 8) | octets[1]).toString(16);
    const low = ((octets[2] << 8) | octets[3]).toString(16);
    address = address.slice(0, separator + 1) + high + ':' + low;
  }
  const halves = address.split('::');
  if (halves.length > 2) return null;
  const left = halves[0] ? halves[0].split(':') : [];
  const right = halves.length === 2 && halves[1] ? halves[1].split(':') : [];
  const missing = 8 - left.length - right.length;
  if (missing < 0 || (halves.length === 1 && missing !== 0) || (halves.length === 2 && missing < 1)) return null;
  const groups = [...left, ...Array(missing).fill('0'), ...right];
  if (groups.length !== 8 || groups.some(group => !/^[0-9a-f]{1,4}$/u.test(group))) return null;
  return groups;
}
/** Store only an IPv4 /24 or IPv6 /48 network prefix, never the full address. */
export function maskAnalyticsIp(value: string | null): string | null {
  const address = value?.trim().replace(/^\[|\]$/gu, '') || '';
  const version = isIP(address);
  if (version === 4) {
    const octets = address.split('.');
    return octets.length === 4 ? octets.slice(0, 3).join('.') + '.xxx' : null;
  }
  if (version === 6) {
    const groups = expandIpv6(address);
    if (!groups) return null;
    return groups.slice(0, 3).map(group => Number.parseInt(group, 16).toString(16)).join(':') + '::/48';
  }
  return null;
}
