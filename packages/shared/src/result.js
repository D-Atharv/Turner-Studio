export const ok = (value) => ({ ok: true, value });
export const err = (error) => ({ ok: false, error });
export const isOk = (result) => result.ok;
export const isErr = (result) => !result.ok;
//# sourceMappingURL=result.js.map