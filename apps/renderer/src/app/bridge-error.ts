export const parseIpcError = (error: unknown): string => {
  if (!(error instanceof Error)) {
    return 'Unexpected application error';
  }

  try {
    const parsed = JSON.parse(error.message) as { message?: string };
    return parsed.message ?? error.message;
  } catch {
    return error.message;
  }
};
