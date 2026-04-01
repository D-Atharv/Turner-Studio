import fsSync from 'node:fs';
import type { ConvertJob, ConvertOptions } from '@turner/contracts';
import {
  dedupeInputPaths,
  createWaitingJob,
  resolveOutputPath,
  resolveConvertOptions,
  validateVideoInputPath
} from '@turner/domain';
import { createAppError, err, ok, getOutputExtension, type Result } from '@turner/shared';
import { validateInputFile } from './queue-helpers.js';

type PrepareJobsParams = {
  inputPaths: string[];
  baseOptions: Partial<ConvertOptions>;
};

type PreparedJobs = {
  jobs: ConvertJob[];
  options: ConvertOptions;
};

export const prepareJobsForEnqueue = async ({
  inputPaths,
  baseOptions
}: PrepareJobsParams): Promise<Result<PreparedJobs>> => {
  const optionsResult = resolveConvertOptions(baseOptions);
  if (!optionsResult.ok) {
    return optionsResult;
  }

  const normalizedInputPaths = dedupeInputPaths(inputPaths);
  if (normalizedInputPaths.length === 0) {
    return err(createAppError('VALIDATION_ERROR', 'No valid input files were provided'));
  }

  const jobs: ConvertJob[] = [];

  for (const inputPathCandidate of normalizedInputPaths) {
    const inputValidation = validateVideoInputPath(inputPathCandidate);
    if (!inputValidation.ok) {
      return inputValidation;
    }

    const fileValidation = await validateInputFile(inputValidation.value);
    if (!fileValidation.ok) {
      return fileValidation;
    }

    const outputPathResult = resolveOutputPath({
      inputPath: inputValidation.value,
      outputDir: optionsResult.value.outputDir,
      outputExtension: getOutputExtension(optionsResult.value.profileId),
      exists: fsSync.existsSync
    });

    if (!outputPathResult.ok) {
      return outputPathResult;
    }

    jobs.push(createWaitingJob(inputValidation.value, outputPathResult.value));
  }

  return ok({ jobs, options: optionsResult.value });
};
