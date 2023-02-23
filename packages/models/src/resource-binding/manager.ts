import { Transaction, Block, Header, Input, utils, Script } from '@ckb-lumos/base'
import { BI } from '@ckb-lumos/bi'
import { Actor, ActorMessage, ActorURI, MessagePayload } from '..'
import {
  TypeScriptHash,
  LockScriptHash,
  CellChangeData,
  ResourceBindingRegistry,
  ResourceBindingManagerMessage,
  CellChange,
} from './types'
import { outPointToOutPointString } from './utils'
import { Listener } from '@ckb-js/kuai-io'
import type { Subscription } from 'rxjs'
import { ChainSource } from '@ckb-js/kuai-io/lib/types'
import { OutPointString, UpdateStorageValue } from '../store'
import { CellChangeBuffer } from './cell-change-buffer'

export class Manager extends Actor<object, MessagePayload<ResourceBindingManagerMessage>> {
  #registry: Map<TypeScriptHash, Map<LockScriptHash, Map<ActorURI, ResourceBindingRegistry>>> = new Map()
  #registryOutPoint: Map<OutPointString, ResourceBindingRegistry> = new Map()
  #registryReverse: Map<ActorURI, [TypeScriptHash, LockScriptHash]> = new Map()
  #lastBlock: Block | undefined = undefined
  #tipBlockNumber = BI.from(0)
  #buffer: CellChangeBuffer = new CellChangeBuffer()

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
    let semaphore = 0
    return setInterval(async () => {
      semaphore++
      if (semaphore === 1) {
        if (this.#buffer.hasReadyStore()) {
          this.updateBuffer()
        }
        const nextBlockNumber = this.#lastBlock
          ? BI.from(this.#lastBlock.header.number).add(1)
          : BI.from(this.#tipBlockNumber)
        if (this.#tipBlockNumber.gt(0) && this.#tipBlockNumber.gte(nextBlockNumber)) {
          try {
            const block = await this._dataSource.getBlock(nextBlockNumber.toHexString())
            if (block) {
              this.updateStore(block)
            }
          } catch (e) {
            // ignore
          }
        }
      }

      semaphore--
    }, pollingInterval)
  }

  private updateBuffer() {
    const stores = this.#buffer.popAll()
    for (const changes of stores) {
      for (const [store, input, data] of changes) {
        this.updateCellChanges(store, input, data)
      }
    }
  }

  private updateCellChanges(store: ResourceBindingRegistry, input: Input[], data: CellChangeData[]) {
    const upgrade: UpdateStorageValue[] = []
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

  private updateStore(block: Block) {
    if (!this.#lastBlock || BI.from(block.header.number).gt(BI.from(this.#lastBlock.header.number))) {
      const changes = this.filterCellsAndMapChanges(block)
      for (const [store, input, data] of changes) {
        switch (store.status) {
          case 'initiated':
            this.updateCellChanges(store, input, data)
            break
          case 'registered':
          default:
            this.#buffer.push(store.uri, [store, input, data])
        }
      }
      this.#lastBlock = block
    }
  }

  private mapOutputs(tx: Transaction, block: Block): Map<OutPointString, CellChangeData> {
    const outputs = new Map<OutPointString, CellChangeData>()
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

  private filterCellsAndMapChanges(block: Block): CellChange[] {
    const changes: Map<ActorURI, CellChange> = new Map()
    let outputs = new Map<OutPointString, CellChangeData>()
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
      const registries = this.#registry.get(typeHash)?.get(utils.computeScriptHash(output[0].cellOutput.lock))
      registries?.forEach((registry) => {
        let change = changes.get(registry.uri)
        if (!change) {
          change = [registry, [], []]
        }
        change[2].push(output)
        changes.set(registry.uri, change)
      })
    }

    return Array.from(changes.values())
  }

  private async initiateStore(registry: ResourceBindingRegistry, lockScript: Script, typeScript?: Script) {
    const cells = await this._dataSource.getAllLiveCellsWithWitness(lockScript, typeScript)
    this.updateCellChanges(
      registry,
      [],
      cells.map((cell) => [
        {
          cellOutput: {
            capacity: cell.output.capacity,
            lock: cell.output.lock,
            type: cell.output.type,
          },
          data: cell.outputData,
          outPoint: cell.outPoint,
          blockNumber: cell.blockNumber,
        },
        cell.witness,
      ]),
    )
    this.#buffer.signalReady(registry.uri)
    registry.status = 'initiated'
  }

  handleCall = (_msg: ActorMessage<MessagePayload<ResourceBindingManagerMessage>>): void => {
    switch (_msg.payload?.value?.type) {
      case 'register': {
        const register = _msg.payload?.value?.register
        if (register) {
          this.register(register.lockScript, register.typeScript, register.uri, register.pattern)
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

  async register(lock: Script, type: Script | undefined, uri: ActorURI, pattern: string) {
    const lockHash = utils.computeScriptHash(lock)
    const typeHash = type ? utils.computeScriptHash(type) : 'null'
    if (!this.#registry.get(typeHash)) {
      this.#registry.set(typeHash, new Map())
    }
    let registries = this.#registry.get(typeHash)?.get(lockHash)
    if (!registries) {
      registries = new Map<ActorURI, ResourceBindingRegistry>()
    }
    const registry: ResourceBindingRegistry = { uri, pattern, status: 'registered' }
    registries.set(uri, registry)
    this.#registry.get(typeHash)?.set(lockHash, registries)
    this.#registryReverse.set(uri, [typeHash, lockHash])
    await this.initiateStore(registry, lock, type)
  }

  revoke(uri: ActorURI) {
    const registry = this.#registryReverse.get(uri)
    if (registry) {
      const [type, lock] = registry
      this.#registry.get(type)?.get(lock)?.delete(uri)
      this.#registryReverse.delete(uri)
    }
  }

  listen(pollingInterval = 1000): { subscription: Subscription; updator: NodeJS.Timer } {
    return { subscription: this._listener.on(this.onListenBlock), updator: this.update(pollingInterval) }
  }

  private sendMessage<T extends 'remove_cell' | 'update_cells'>(
    store: ResourceBindingRegistry,
    type: T,
    payload: T extends 'remove_cell' ? OutPointString[] : UpdateStorageValue[],
  ) {
    this.call(store.uri, {
      pattern: store.pattern,
      value: {
        type,
        value: payload,
      },
    })
  }

  get registry(): Map<TypeScriptHash, Map<LockScriptHash, Map<ActorURI, ResourceBindingRegistry>>> {
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
