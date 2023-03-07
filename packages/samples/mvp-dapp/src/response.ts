export class MvpResponse<T> {
  code: string
  data: T

  constructor(code: string, data: T) {
    this.code = code
    this.data = data
  }

  static ok<T>(data: T) {
    return new MvpResponse('200', data)
  }

  static err<T>(data: T, code: string) {
    return new MvpResponse(code, data)
  }
}
