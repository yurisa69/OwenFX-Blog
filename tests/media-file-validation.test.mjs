import test from 'node:test';
import assert from 'node:assert/strict';
import { validateFileSignature } from '../lib/media-file-validation.ts';

const samples = [
  ['image/jpeg', 'ffd8ffdb004300'],
  ['image/png', '89504e470d0a1a0a0000000d4948445200000001000000010806000000'],
  ['image/gif', '47494638396100'],
  ['image/webp', '524946460c0000005745425056503820'],
  ['image/avif', '00000010667479706176696600000000'],
  ['video/mp4', '000000106674797069736f6d00000000'],
  ['video/quicktime', '00000010667479707174202000000000'],
  ['video/webm', '1a45dfa39f4286810142f7810142f2810442f381084282847765626d'],
];

test('accepts matching signatures for every supported media MIME type', async () => {
  for (const [mime, hex] of samples) {
    const detected = await validateFileSignature(Buffer.from(hex, 'hex'), mime);
    assert.equal(detected.mime, mime);
  }
});

test('rejects mismatched MIME types and unrecognized file content', async () => {
  await assert.rejects(
    validateFileSignature(Buffer.from(samples[0][1], 'hex'), 'image/png'),
    /文件实际格式与声明的文件类型不匹配/,
  );
  await assert.rejects(
    validateFileSignature(Uint8Array.from([0x00, 0x01, 0x02, 0x03]), 'image/jpeg'),
    /文件实际格式与声明的文件类型不匹配/,
  );
});
