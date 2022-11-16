export const isUndefined = (v: unknown): v is undefined => typeof v === 'undefined';
export const isNil = (v: unknown): v is null | undefined => isUndefined(v) || v === null;
export const isSymbol = (v: unknown): v is symbol => typeof v === 'symbol';
export const isString = (v: unknown): v is string => typeof v === 'string';
