import { FILE_EXTENSIONS } from '@turner/shared';

type FileWithPath = File & { path?: string };

export type ExtractionResult = {
  acceptedPaths: string[];
  rejectedCount: number;
};

const isWebmPath = (candidatePath: string): boolean =>
  candidatePath.toLowerCase().endsWith(FILE_EXTENSIONS.WEBM);

export const extractPathsFromFileList = (files: FileList | null): ExtractionResult => {
  if (!files) {
    return { acceptedPaths: [], rejectedCount: 0 };
  }

  const acceptedPaths: string[] = [];
  let rejectedCount = 0;

  for (const file of Array.from(files)) {
    const fileWithPath = file as FileWithPath;
    const resolvedPath = fileWithPath.path?.trim() ?? '';

    if (resolvedPath.length > 0 && isWebmPath(resolvedPath)) {
      acceptedPaths.push(resolvedPath);
      continue;
    }

    rejectedCount += 1;
  }

  return { acceptedPaths, rejectedCount };
};

export const fileNameFromPath = (candidatePath: string): string => {
  const normalized = candidatePath.replace(/\\/g, '/');
  const fragments = normalized.split('/');
  return fragments[fragments.length - 1] || candidatePath;
};
