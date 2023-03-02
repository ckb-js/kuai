export class MvpResponse {
  code: string
  data: unknown

  constructor(code: string, data: unknown) {
    this.code = code
    this.data = data
  }

  static ok(data: unknown) {
    return new MvpResponse('200', data)
  }

  static err(data: unknown, code: string) {
    return new MvpResponse(code, data)
  }
}
