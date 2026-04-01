import { describe, expect, it } from 'vitest';
import { appSettingsPatchSchema, convertRequestSchema } from '@turner/contracts';

describe('contracts validation', () => {
  it('rejects malformed convert request payload', () => {
    const result = convertRequestSchema.safeParse({
      inputPaths: [],
      options: { crf: 60 }
    });

    expect(result.success).toBe(false);
  });

  it('accepts valid settings patch', () => {
    const result = appSettingsPatchSchema.safeParse({
      outputDir: '/tmp/output',
      crf: 20,
      preset: 'slow',
      audioBitrate: '192k',
      keepOriginal: false,
      timeoutMs: 120_000
    });

    expect(result.success).toBe(true);
  });
});
