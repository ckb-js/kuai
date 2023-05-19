export const isStringList = (value: unknown): value is Array<string> => {
  if (!Array.isArray(value)) {
    return false
  }
  if (value.some((v) => typeof v !== 'string')) {
    return false
  }
  return true
}

export const deepForIn = (
  value: unknown,
  continueDeepFor: (v: unknown, path: string[]) => boolean,
  prefixPaths: string[] = [],
) => {
  if (!continueDeepFor(value, prefixPaths) || value === undefined || value === null || typeof value === 'string') return
  const keys = Object.keys(value)
  for (let idx = 0; idx < keys.length; idx++) {
    const key = keys[idx]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const currentValue = (value as any)[key]
    deepForIn(currentValue, continueDeepFor, [...prefixPaths, key])
  }
}
