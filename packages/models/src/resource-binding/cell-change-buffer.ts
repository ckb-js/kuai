import type { Input } from '@ckb-lumos/base'
import type { ActorURI } from '../actor'
import type { CellChangeData, ResourceBindingRegistry } from './types'

export class CellChangeBuffer {
  #buffer: Map<ActorURI, [ResourceBindingRegistry, Input[], CellChangeData[]][]> = new Map()
  #readyList: Array<ActorURI> = []

  hasReadyStore(): boolean {
    return this.#readyList.length > 0
  }

  push(uri: ActorURI, data: [ResourceBindingRegistry, Input[], CellChangeData[]]) {
    let buffer = this.#buffer.get(uri)
    if (!buffer) {
      buffer = []
    }
    buffer.push(data)
    this.#buffer.set(uri, buffer)
  }

  pop(): [ResourceBindingRegistry, Input[], CellChangeData[]][] | undefined {
    const uri = this.#readyList.pop()
    if (uri) {
      const changes = this.#buffer.get(uri)
      this.#buffer.delete(uri)
      return changes
    }
  }

  popAll(): [ResourceBindingRegistry, Input[], CellChangeData[]][][] {
    let length = this.#readyList.length
    const res: [ResourceBindingRegistry, Input[], CellChangeData[]][][] = []
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

  get buffer(): Map<ActorURI, [ResourceBindingRegistry, Input[], CellChangeData[]][]> {
    return this.#buffer
  }

  get readyList(): Array<ActorURI> {
    return this.#readyList
  }
}
