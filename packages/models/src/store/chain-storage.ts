// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class ChainStorage<T = any> {
  abstract serialize(data: T): Uint8Array
  abstract deserialize(data: Uint8Array): T
  clone(data: T): T {
    return this.deserialize(this.serialize(data))
  }
}

export type GetState<T> = T extends ChainStorage<infer State> ? State : never
