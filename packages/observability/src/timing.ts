export type AsyncOperation<T> = () => Promise<T>;

export type TimedResult<T> = {
  value: T;
  durationMs: number;
};

export const measureAsync = async <T>(operation: AsyncOperation<T>): Promise<TimedResult<T>> => {
  const started = performance.now();
  const value = await operation();
  const ended = performance.now();

  return {
    value,
    durationMs: Math.round((ended - started) * 100) / 100
  };
};
