const ASCII = (bytes: Uint8Array, start: number, length: number) =>
  String.fromCharCode(...bytes.subarray(start, start + length));

function hasBytes(bytes: Uint8Array, expected: number[], offset = 0) {
  return expected.every((value, index) => bytes[offset + index] === value);
}

function detectMediaMime(bytes: Uint8Array): string | null {
  if (hasBytes(bytes, [0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (hasBytes(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';

  const signature = ASCII(bytes, 0, 6);
  if (signature === 'GIF87a' || signature === 'GIF89a') return 'image/gif';

  if (ASCII(bytes, 0, 4) === 'RIFF' && ASCII(bytes, 8, 4) === 'WEBP') return 'image/webp';

  if (ASCII(bytes, 4, 4) === 'ftyp') {
    const brands = Array.from({ length: Math.min(16, Math.floor((bytes.length - 8) / 4)) }, (_, index) =>
      ASCII(bytes, 8 + index * 4, 4),
    );
    if (brands.includes('avif') || brands.includes('avis')) return 'image/avif';
    if (brands.includes('qt  ')) return 'video/quicktime';
    const mp4Brands = new Set([
      'isom', 'iso2', 'iso3', 'iso4', 'iso5', 'iso6', 'mp41', 'mp42',
      'avc1', 'M4V ', 'MSNV', 'dash', 'cmfc', 'cmfs', '3gp4', '3gp5', '3g2a',
    ]);
    if (brands.some(brand => mp4Brands.has(brand))) return 'video/mp4';
    return null;
  }

  if (hasBytes(bytes, [0x1a, 0x45, 0xdf, 0xa3])) {
    const header = ASCII(bytes, 0, Math.min(bytes.length, 4101));
    if (header.includes('webm')) return 'video/webm';
  }

  return null;
}


export async function validateFileSignature(bytes: Uint8Array, declaredContentType: string) {
  const declaredType = declaredContentType.trim().toLowerCase().split(';', 1)[0];
  const detectedType = detectMediaMime(bytes);
  if (!detectedType || detectedType !== declaredType) {
    throw new Error('文件实际格式与声明的文件类型不匹配');
  }
  return { mime: detectedType };
}
