import path from 'node:path'

export class Path {
  constructor(private _path: string) {}

  get path(): string {
    if (path.isAbsolute(this._path)) {
      return this._path
    } else {
      return path.resolve(process.cwd(), this._path)
    }
  }

  toJSON = () => {
    return this._path
  }
}
