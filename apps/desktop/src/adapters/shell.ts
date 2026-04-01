import fs from 'node:fs/promises';
import fsSync from 'node:fs';
import path from 'node:path';
import { shell } from 'electron';
import { createAppError, err, ok, type Result } from '@turner/shared';

export const openFile = async (targetPath: string): Promise<Result<void>> => {
  const normalized = targetPath.trim();
  if (normalized.length === 0) {
    return err(createAppError('VALIDATION_ERROR', 'Cannot open file because the output path is missing'));
  }

  try {
    await fs.access(normalized, fsSync.constants.R_OK);
    const status = await shell.openPath(normalized);
    if (status.length > 0) {
      return err(createAppError('IO_ERROR', 'Failed to open file', { details: { status, targetPath: normalized } }));
    }

    return ok(undefined);
  } catch (error) {
    return err(createAppError('IO_ERROR', 'Failed to open file', { cause: error, details: { targetPath: normalized } }));
  }
};

export const showInFolder = async (targetPath: string): Promise<Result<void>> => {
  const normalized = targetPath.trim();
  if (normalized.length === 0) {
    return err(createAppError('VALIDATION_ERROR', 'Cannot reveal file because the output path is missing'));
  }

  try {
    await fs.access(normalized, fsSync.constants.R_OK);
    shell.showItemInFolder(normalized);
    return ok(undefined);
  } catch (error) {
    return err(
      createAppError('IO_ERROR', 'Failed to reveal file in folder', { cause: error, details: { targetPath: normalized } })
    );
  }
};

const sanitizeRequestedName = (nextName: string): string => {
  const trimmed = nextName.trim().replace(/\.mp4$/i, '');
  return trimmed.replace(/[\\/:"*?<>|]/g, '').trim();
};

export const renameFile = async (targetPath: string, nextName: string): Promise<Result<string>> => {
  const normalized = targetPath.trim();
  if (normalized.length === 0) {
    return err(createAppError('VALIDATION_ERROR', 'Cannot rename file because the output path is missing'));
  }

  const safeName = sanitizeRequestedName(nextName);
  if (safeName.length === 0) {
    return err(createAppError('VALIDATION_ERROR', 'Please provide a valid file name'));
  }

  const parsed = path.parse(normalized);
  const nextPath = path.join(parsed.dir, `${safeName}.mp4`);
  if (nextPath === normalized) {
    return ok(normalized);
  }

  try {
    await fs.access(normalized, fsSync.constants.R_OK | fsSync.constants.W_OK);
  } catch {
    return err(createAppError('IO_ERROR', 'Cannot access file to rename', { details: { targetPath: normalized } }));
  }

  try {
    await fs.access(nextPath, fsSync.constants.F_OK);
    return err(createAppError('IO_ERROR', 'A file with this name already exists', { details: { nextPath } }));
  } catch {
    // Destination path does not exist.
  }

  try {
    await fs.rename(normalized, nextPath);
    return ok(nextPath);
  } catch (error) {
    return err(createAppError('IO_ERROR', 'Failed to rename file', { cause: error, details: { targetPath: normalized, nextPath } }));
  }
};
