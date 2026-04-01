import { describe, expect, it } from 'vitest';
import { resolveOutputPath } from '@turner/domain';

describe('output path resolver', () => {
  it('adds numeric suffix when base output path already exists', () => {
    const existing = new Set(['/video/output.mp4']);

    const result = resolveOutputPath({
      inputPath: '/video/input.webm',
      outputDir: '/video',
      exists: (candidate) => existing.has(candidate)
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('/video/input.mp4');
    }
  });

  it('increments suffix when name collisions happen', () => {
    const existing = new Set(['/video/input.mp4', '/video/input (1).mp4']);

    const result = resolveOutputPath({
      inputPath: '/video/input.webm',
      outputDir: '/video',
      exists: (candidate) => existing.has(candidate)
    });

    expect(result.ok).toBe(true);

    if (result.ok) {
      expect(result.value).toBe('/video/input (2).mp4');
    }
  });
});
