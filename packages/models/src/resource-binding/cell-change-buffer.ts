import type { ActorURI } from '../actor'
import type { CellChange } from './types'

export class CellChangeBuffer {
  #buffer: Map<ActorURI, CellChange[]> = new Map()
  #readyList: Array<ActorURI> = []

  hasReadyStore(): boolean {
    return this.#readyList.length > 0
  }

  push(uri: ActorURI, data: CellChange) {
    let buffer = this.#buffer.get(uri)
    if (!buffer) {
      buffer = []
    }
    buffer.push(data)
    this.#buffer.set(uri, buffer)
  }

  pop(): CellChange[] | undefined {
    const uri = this.#readyList.pop()
    if (uri) {
      const changes = this.#buffer.get(uri)
      this.#buffer.delete(uri)
      return changes
    }
  }

  popAll(): CellChange[][] {
    let length = this.#readyList.length
    const res: CellChange[][] = []
    while (length-- > 0) {
      const data = this.pop()
      if (data) {
        res.push(data)
      }
    }

    return res
  }

  signalReady(uri: ActorURI) {
    this.#readyList.push(uri)
  }

  get buffer(): Map<ActorURI, CellChange[]> {
    return this.#buffer
  }

  get readyList(): Array<ActorURI> {
    return this.#readyList
  }
}
