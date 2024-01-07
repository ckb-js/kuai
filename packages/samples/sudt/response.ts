export class SudtResponse<T> {
  constructor(
    private code: string,
    private data: T,
  ) {}

  static ok<T>(data: T) {
    return new SudtResponse<T>('200', data)
  }

  static err<T>(code: string, data: T) {
    return new SudtResponse<T>(code, data)
  }
}
