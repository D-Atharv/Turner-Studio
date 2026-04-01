import { getAllAcceptedExtensions } from '@turner/shared';

type FileWithPath = File & { path?: string };

export type ExtractionResult = {
  acceptedPaths: string[];
  rejectedCount: number;
};

const getFileExt = (filePath: string): string =>
  filePath.toLowerCase().slice(filePath.lastIndexOf('.'));

export const isAcceptedVideoPath = (
  candidatePath: string,
  acceptedExtensions?: readonly string[]
): boolean => {
  const exts = acceptedExtensions ?? getAllAcceptedExtensions();
  return exts.includes(getFileExt(candidatePath));
};

/**
 * Extract valid paths from a FileList, filtering by the provided accepted
 * extensions. When no extensions are supplied, all known video extensions
 * are accepted (global fallback).
 */
export const extractPathsFromFileList = (
  files: FileList | null,
  acceptedExtensions?: readonly string[]
): ExtractionResult => {
  if (!files) return { acceptedPaths: [], rejectedCount: 0 };

  const accepted = acceptedExtensions ?? getAllAcceptedExtensions();
  const acceptedPaths: string[] = [];
  let rejectedCount = 0;

  for (const file of Array.from(files)) {
    const resolvedPath = (file as FileWithPath).path?.trim() ?? '';
    if (resolvedPath.length > 0 && accepted.includes(getFileExt(resolvedPath))) {
      acceptedPaths.push(resolvedPath);
    } else {
      rejectedCount += 1;
    }
  }

  return { acceptedPaths, rejectedCount };
};

export const fileNameFromPath = (candidatePath: string): string => {
  const normalized = candidatePath.replace(/\\/g, '/');
  const fragments  = normalized.split('/');
  return fragments[fragments.length - 1] ?? candidatePath;
};

/** Returns the extension label without the dot, upper-cased. ".webm" → "WEBM" */
export const fileExtLabel = (filePath: string): string => {
  const name = fileNameFromPath(filePath);
  const dot  = name.lastIndexOf('.');
  return dot === -1 ? '?' : name.slice(dot + 1).toUpperCase();
};
