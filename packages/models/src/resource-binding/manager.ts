import { Transaction, Block, Header, Input, HexString, utils, Cell } from '@ckb-lumos/base'
import { BI } from '@ckb-lumos/bi'
import { Actor, ActorMessage, ActorURI, MessagePayload } from '..'
import { TypeScriptHash, LockScriptHash } from './types'
import { ResourceBindingRegistry, ResourceBindingManagerMessage } from './interface'
import { outPointToOutPointString } from './utils'
import { Listener } from '@ckb-js/kuai-io'
import type { Subscription } from 'rxjs'
import { ChainSource } from '@ckb-js/kuai-io/lib/types'
import { OutPointString } from '../store'

export class Manager extends Actor<object, MessagePayload<ResourceBindingManagerMessage>> {
  #registry: Map<TypeScriptHash, Map<LockScriptHash, ResourceBindingRegistry>> = new Map()
  #registryOutPoint: Map<OutPointString, ResourceBindingRegistry> = new Map()
  #registryReverse: Map<ActorURI, [TypeScriptHash, LockScriptHash]> = new Map()
  #lastBlock: Block | undefined = undefined
  #tipBlockNumber = BI.from(0)

  constructor(private _listener: Listener<Header>, private _dataSource: ChainSource) {
    super()
  }

  onListenBlock = (blockHeader: Header) => {
    const currentBlockNumber = BI.from(blockHeader.number)
    if (currentBlockNumber.gt(this.tipBlockNumber)) {
      this.tipBlockNumber = currentBlockNumber
    }
  }

  private update(pollingInterval = 1000) {
    return setInterval(async () => {
      if (this.#tipBlockNumber.gt(0) && this.#tipBlockNumber.gt(BI.from(this.#lastBlock?.header.number ?? 0))) {
        this.updateStore(await this._dataSource.getBlock(this.#tipBlockNumber.toHexString()))
      }
    }, pollingInterval)
  }

  private updateStore(block: Block) {
    if (!this.#lastBlock || BI.from(block.header.number).gt(BI.from(this.#lastBlock.header.number))) {
      const changes = this.filterCells(block)
      for (const [store, input, data] of changes) {
        const upgrade: { witness: HexString; cell: Cell }[] = []
        for (const [cell, witness] of data) {
          upgrade.push({ witness, cell })
          if (cell.outPoint) {
            this.#registryOutPoint.set(outPointToOutPointString(cell.outPoint), store)
          }
        }

        if (upgrade.length > 0) {
          this.sendMessage(store, 'update_cells', upgrade)
        }

        if (input.length > 0) {
          this.sendMessage(
            store,
            'remove_cell',
            input.map((v) => outPointToOutPointString(v.previousOutput)),
          )
        }
      }
      this.#lastBlock = block
    }
  }

  private mapOutputs(tx: Transaction, block: Block): Map<OutPointString, [Cell, string]> {
    const outputs = new Map<OutPointString, [Cell, string]>()
    if (tx.hash) {
      for (const outputIndex in tx.outputs) {
        const outPoint = {
          txHash: tx.hash,
          index: BI.from(outputIndex).toHexString(),
        }
        outputs.set(outPointToOutPointString(outPoint), [
          {
            cellOutput: tx.outputs[outputIndex],
            data: tx.outputsData[outputIndex],
            outPoint,
            blockHash: block.header.hash,
            blockNumber: block.header.number,
          },
          tx.witnesses[outputIndex],
        ])
      }
    }

    return outputs
  }

  private filterCells(block: Block): [ResourceBindingRegistry, Input[], [Cell, string][]][] {
    const changes: Map<ActorURI, [ResourceBindingRegistry, Input[], [Cell, string][]]> = new Map()
    let outputs = new Map<OutPointString, [Cell, string]>()
    for (const tx of block.transactions) {
      outputs = new Map([...outputs, ...this.mapOutputs(tx, block)])
      for (const input of tx.inputs) {
        const outPointString = outPointToOutPointString(input.previousOutput)
        if (outputs.has(outPointString)) {
          outputs.delete(outPointString)
        } else {
          const registry = this.#registryOutPoint.get(outPointString)
          if (registry) {
            let change = changes.get(registry.uri)
            if (!change) {
              change = [registry, [], []]
            }
            change[1].push(input)
            changes.set(registry.uri, change)
            this.#registryOutPoint.delete(outPointString)
          } else {
            // To be ignored
            // For an input cell, if the current block doesn't output it, it must be output by a former block.
            // If it isn't registered by any Stores, then it certainly belongs to any other applications.
            // So this input cell could be ignored.
          }
        }
      }
    }

    for (const output of outputs.values()) {
      const typeHash = output[0].cellOutput.type ? utils.computeScriptHash(output[0].cellOutput.type) : 'null'
      const registry = this.#registry.get(typeHash)?.get(utils.computeScriptHash(output[0].cellOutput.lock))
      if (registry) {
        let change = changes.get(registry.uri)
        if (!change) {
          change = [registry, [], []]
        }
        change[2].push(output)
        changes.set(registry.uri, change)
      }
    }

    return Array.from(changes.values())
  }

  handleCall = (_msg: ActorMessage<MessagePayload<ResourceBindingManagerMessage>>): void => {
    switch (_msg.payload?.value?.type) {
      case 'register': {
        const register = _msg.payload?.value?.register
        if (register) {
          this.register(register.lockScriptHash, register.typeScriptHash, register.uri, register.pattern)
        }
        break
      }
      case 'revoke': {
        const revoke = _msg.payload?.value?.revoke
        if (revoke) {
          this.revoke(revoke.uri)
        }
        break
      }
      default:
        break
    }
  }

  async register(lock: LockScriptHash, type: TypeScriptHash, uri: ActorURI, pattern: string) {
    if (!this.#registry.get(type)) {
      this.#registry.set(type, new Map())
    }
    this.#registry.get(type)?.set(lock, { uri, pattern })
    this.#registryReverse.set(uri, [type, lock])
  }

  revoke(uri: ActorURI) {
    const registry = this.#registryReverse.get(uri)
    if (registry) {
      const [type, lock] = registry
      this.#registry.get(type)?.delete(lock)
      this.#registryReverse.delete(uri)
    }
  }

  listen(pollingInterval = 1000): { subscription: Subscription; updator: NodeJS.Timer } {
    return { subscription: this._listener.on(this.onListenBlock), updator: this.update(pollingInterval) }
  }

  private sendMessage<T extends 'remove_cell' | 'update_cells'>(
    store: ResourceBindingRegistry,
    type: T,
    payload: T extends 'remove_cell' ? OutPointString[] : { cell: Cell; witness: HexString }[],
  ) {
    this.call(store.uri, {
      pattern: store.pattern,
      value: {
        type,
        value: payload,
      },
    })
  }

  get registry(): Map<TypeScriptHash, Map<LockScriptHash, ResourceBindingRegistry>> {
    return this.#registry
  }

  get registryOutPoint(): Map<OutPointString, ResourceBindingRegistry> {
    return this.#registryOutPoint
  }

  get registryReverse(): Map<ActorURI, [TypeScriptHash, LockScriptHash]> {
    return this.#registryReverse
  }

  get lastBlock(): Block | undefined {
    return this.#lastBlock
  }

  set tipBlockNumber(blockNumber: BI) {
    this.#tipBlockNumber = blockNumber
  }

  get tipBlockNumber(): BI {
    return this.#tipBlockNumber
  }
}
