import type { AppError } from './errors';
export type Ok<T> = {
    ok: true;
    value: T;
};
export type Err = {
    ok: false;
    error: AppError;
};
export type Result<T> = Ok<T> | Err;
export declare const ok: <T>(value: T) => Ok<T>;
export declare const err: (error: AppError) => Err;
export declare const isOk: <T>(result: Result<T>) => result is Ok<T>;
export declare const isErr: <T>(result: Result<T>) => result is Err;
//# sourceMappingURL=result.d.ts.map