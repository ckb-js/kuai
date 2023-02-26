export const isStringList = (value: unknown): value is Array<string> => {
  if (!Array.isArray(value)) {
    return false
  }
  if (value.some((v) => typeof v !== 'string')) {
    return false
  }
  return true
}
