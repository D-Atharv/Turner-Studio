import { appSettingsSchema } from '@turner/contracts';
import { APP_SETTINGS_SCHEMA_VERSION, createAppError, err, ok, type Result } from '@turner/shared';
import type { AppSettings } from '@turner/contracts';
import { DEFAULT_APP_SETTINGS } from './defaults.js';

export const migrateSettings = (input: unknown): Result<AppSettings> => {
  if (!input || typeof input !== 'object') {
    return ok(DEFAULT_APP_SETTINGS);
  }

  const record = input as Record<string, unknown>;

  const normalized: Record<string, unknown> = {
    ...record,
    schemaVersion: APP_SETTINGS_SCHEMA_VERSION
  };

  if (record.qualityCrf && !record.crf) {
    normalized.crf = record.qualityCrf;
  }

  const parsed = appSettingsSchema.safeParse(normalized);

  if (!parsed.success) {
    return err(
      createAppError('VALIDATION_ERROR', 'Invalid persisted settings file', {
        details: parsed.error.flatten()
      })
    );
  }

  return ok(parsed.data);
};
