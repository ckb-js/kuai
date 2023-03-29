export const addLeadingSlash = (path?: string): string =>
  path && typeof path === 'string' ? (path.charAt(0) !== '/' ? '/' + path : path) : ''

export const concatPaths = (a: string, b: string) =>
  addLeadingSlash(stripEndSlash(a)) + addLeadingSlash(stripEndSlash(b))

export const stripEndSlash = (path: string) => (path[path.length - 1] === '/' ? path.slice(0, path.length - 1) : path)
