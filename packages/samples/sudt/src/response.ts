/**
 * @module src/response
 * @description
 * This module defines the response format of the application.
 * It is used to wrap the response data and return to the client.
 */

export class SudtResponse<T> {
  code: string;
  data: T;

  constructor(code: string, data: T) {
    this.code = code;
    this.data = data;
  }

  static ok<T>(data: T) {
    return new SudtResponse('200', data);
  }

  static err<T>(data: T, code: string) {
    return new SudtResponse(code, data);
  }
}
