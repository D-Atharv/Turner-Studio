import type { AppError } from './errors.js';

export type Ok<T> = { ok: true; value: T };
export type Err = { ok: false; error: AppError };

export type Result<T> = Ok<T> | Err;

export const ok = <T>(value: T): Ok<T> => ({ ok: true, value });

export const err = (error: AppError): Err => ({ ok: false, error });

export const isOk = <T>(result: Result<T>): result is Ok<T> => result.ok;

export const isErr = <T>(result: Result<T>): result is Err => !result.ok;
