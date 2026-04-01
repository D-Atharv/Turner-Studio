import { z } from 'zod';
import { APP_SETTINGS_SCHEMA_VERSION, CONVERSION_DEFAULTS, CONVERSION_LIMITS } from '@turner/shared';
import { PRESET_VALUES } from './types.js';

const presetSchema = z.enum(PRESET_VALUES);

export const convertOptionsSchema = z.object({
  outputDir: z.string().trim().min(1).optional(),
  crf: z.int().min(CONVERSION_LIMITS.CRF_MIN).max(CONVERSION_LIMITS.CRF_MAX).default(CONVERSION_DEFAULTS.CRF),
  preset: presetSchema.default(CONVERSION_DEFAULTS.PRESET),
  audioBitrate: z.string().regex(/^\d+k$/, 'Audio bitrate must look like 128k').default(CONVERSION_DEFAULTS.AUDIO_BITRATE),
  keepOriginal: z.boolean().default(CONVERSION_DEFAULTS.KEEP_ORIGINAL),
  timeoutMs: z.int().min(5_000).max(60 * 60 * 1000).default(CONVERSION_DEFAULTS.CONVERSION_TIMEOUT_MS)
});

export const convertRequestSchema = z.object({
  inputPaths: z.array(z.string().trim().min(1)).min(1).max(CONVERSION_LIMITS.MAX_BATCH_SIZE),
  options: convertOptionsSchema.partial().optional()
});

export const appSettingsSchema = z.object({
  schemaVersion: z.int().default(APP_SETTINGS_SCHEMA_VERSION),
  outputDir: z.string().trim().min(1).optional(),
  crf: z.int().min(CONVERSION_LIMITS.CRF_MIN).max(CONVERSION_LIMITS.CRF_MAX).default(CONVERSION_DEFAULTS.CRF),
  preset: presetSchema.default(CONVERSION_DEFAULTS.PRESET),
  audioBitrate: z.string().regex(/^\d+k$/, 'Audio bitrate must look like 128k').default(CONVERSION_DEFAULTS.AUDIO_BITRATE),
  keepOriginal: z.boolean().default(CONVERSION_DEFAULTS.KEEP_ORIGINAL),
  notifyOnCompletion: z.boolean().default(CONVERSION_DEFAULTS.NOTIFY_ON_COMPLETION),
  timeoutMs: z.int().min(5_000).max(60 * 60 * 1000).default(CONVERSION_DEFAULTS.CONVERSION_TIMEOUT_MS)
});

export const appSettingsPatchSchema = appSettingsSchema.omit({ schemaVersion: true }).partial();

export const jobIdSchema = z.string().trim().min(1);
export const outputNameSchema = z.string().trim().min(1).max(180);

export type ConvertOptionsInput = z.input<typeof convertOptionsSchema>;
export type ConvertOptionsOutput = z.output<typeof convertOptionsSchema>;
export type ConvertRequestInput = z.input<typeof convertRequestSchema>;
export type ConvertRequestOutput = z.output<typeof convertRequestSchema>;
export type AppSettingsInput = z.input<typeof appSettingsSchema>;
export type AppSettingsOutput = z.output<typeof appSettingsSchema>;
export type AppSettingsPatchInput = z.input<typeof appSettingsPatchSchema>;
export type AppSettingsPatchOutput = z.output<typeof appSettingsPatchSchema>;
