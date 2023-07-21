import type { ActorURI } from '../actor'
import type { CellChange } from './types'

export class CellChangeBuffer {
  #bufferMap: Map<ActorURI, CellChange[]> = new Map()
  #readyList: Array<ActorURI> = []

  hasReadyStore(): boolean {
    return this.#readyList.length > 0
  }

  push(uri: ActorURI, data: CellChange) {
    const buffer = this.#bufferMap.get(uri) ?? []
    buffer.push(data)
    this.#bufferMap.set(uri, buffer)
  }

  pop(): CellChange[] | undefined {
    const uri = this.#readyList.shift()
    if (uri) {
      const changes = this.#bufferMap.get(uri)
      this.#bufferMap.delete(uri)
      return changes
    }
  }

  popAll(): CellChange[][] {
    const length = this.#readyList.length
    const res: CellChange[][] = []
    this.#readyList.slice(0, length).forEach(() => {
      const data = this.pop()
      if (data) {
        res.push(data)
      }
    })

    return res
  }

  signalReady(uri: ActorURI) {
    this.#readyList.push(uri)
  }

  get bufferMap(): Map<ActorURI, CellChange[]> {
    return this.#bufferMap
  }

  get readyList(): Array<ActorURI> {
    return this.#readyList
  }
}
