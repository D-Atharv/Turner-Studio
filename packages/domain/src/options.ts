import { convertOptionsSchema } from '@turner/contracts';
import { createAppError, err, ok, type Result } from '@turner/shared';
import type { ConvertOptions } from '@turner/contracts';

export const resolveConvertOptions = (
  options?: Partial<ConvertOptions>
): Result<ConvertOptions> => {
  const parsed = convertOptionsSchema.safeParse(options ?? {});

  if (!parsed.success) {
    return err(
      createAppError('VALIDATION_ERROR', 'Invalid conversion options', {
        details: parsed.error.flatten()
      })
    );
  }

  return ok(parsed.data);
};
