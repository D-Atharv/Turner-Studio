import fs from 'node:fs/promises';
import path from 'node:path';
import { appSettingsPatchSchema } from '@turner/contracts';
import { CONVERSION_LIMITS, createAppError, err, ok, type Result } from '@turner/shared';
import type { AppSettings, AppSettingsPatch } from '@turner/contracts';
import { DEFAULT_APP_SETTINGS } from './defaults.js';
import { migrateSettings } from './migrate.js';

export class JsonSettingsRepository {
  private cachedSettings: AppSettings | undefined;
  private writeTimer: NodeJS.Timeout | undefined;
  private pendingWritePromise: Promise<Result<void>> | undefined;

  constructor(
    private readonly filePath: string,
    private readonly debounceMs: number = CONVERSION_LIMITS.DEBOUNCE_WRITE_MS
  ) {}

  async get(): Promise<Result<AppSettings>> {
    if (this.cachedSettings) {
      return ok(this.cachedSettings);
    }

    try {
      const raw = await fs.readFile(this.filePath, 'utf8');
      const parsedJson: unknown = JSON.parse(raw);
      const migrated = migrateSettings(parsedJson);

      if (!migrated.ok) {
        this.cachedSettings = DEFAULT_APP_SETTINGS;
        return migrated;
      }

      this.cachedSettings = migrated.value;
      return ok(this.cachedSettings);
    } catch (error) {
      const nodeError = error as NodeJS.ErrnoException;

      if (nodeError.code === 'ENOENT') {
        this.cachedSettings = DEFAULT_APP_SETTINGS;
        return ok(this.cachedSettings);
      }

      return err(
        createAppError('IO_ERROR', 'Unable to read settings file', {
          cause: error
        })
      );
    }
  }

  async update(patch: AppSettingsPatch): Promise<Result<AppSettings>> {
    const currentResult = await this.get();
    if (!currentResult.ok) {
      return currentResult;
    }

    const parsedPatch = appSettingsPatchSchema.safeParse(patch);
    if (!parsedPatch.success) {
      return err(
        createAppError('VALIDATION_ERROR', 'Invalid settings patch', {
          details: parsedPatch.error.flatten()
        })
      );
    }

    const patchData = parsedPatch.data;

    const nextSettings: AppSettings = {
      ...currentResult.value,
      schemaVersion: DEFAULT_APP_SETTINGS.schemaVersion,
      crf: patchData.crf ?? currentResult.value.crf,
      preset: patchData.preset ?? currentResult.value.preset,
      audioBitrate: patchData.audioBitrate ?? currentResult.value.audioBitrate,
      keepOriginal: patchData.keepOriginal ?? currentResult.value.keepOriginal,
      notifyOnCompletion: patchData.notifyOnCompletion ?? currentResult.value.notifyOnCompletion,
      timeoutMs: patchData.timeoutMs ?? currentResult.value.timeoutMs
    };

    if (patchData.outputDir !== undefined) {
      nextSettings.outputDir = patchData.outputDir;
    } else if (currentResult.value.outputDir !== undefined) {
      nextSettings.outputDir = currentResult.value.outputDir;
    } else {
      delete nextSettings.outputDir;
    }

    this.cachedSettings = nextSettings;
    this.scheduleWrite(nextSettings);

    return ok(nextSettings);
  }

  async flush(): Promise<Result<void>> {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
      this.writeTimer = undefined;

      if (this.cachedSettings) {
        this.pendingWritePromise = this.writeAtomic(this.cachedSettings);
      }
    }

    if (!this.pendingWritePromise) {
      return ok(undefined);
    }

    return this.pendingWritePromise;
  }

  private scheduleWrite(nextSettings: AppSettings): void {
    if (this.writeTimer) {
      clearTimeout(this.writeTimer);
    }

    this.writeTimer = setTimeout(() => {
      this.pendingWritePromise = this.writeAtomic(nextSettings);
      this.writeTimer = undefined;
    }, this.debounceMs);
  }

  private async writeAtomic(nextSettings: AppSettings): Promise<Result<void>> {
    try {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });

      const tempPath = `${this.filePath}.tmp`;
      const payload = `${JSON.stringify(nextSettings, null, 2)}\n`;

      await fs.writeFile(tempPath, payload, 'utf8');
      await fs.rename(tempPath, this.filePath);

      return ok(undefined);
    } catch (error) {
      return err(
        createAppError('IO_ERROR', 'Unable to persist settings to disk', {
          cause: error
        })
      );
    }
  }
}
