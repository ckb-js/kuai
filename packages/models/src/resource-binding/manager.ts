import { Block, Header, Input, utils, Script } from '@ckb-lumos/base'
import { BI } from '@ckb-lumos/bi'
import { Actor, ActorMessage, ActorProvider, ActorURI, MessagePayload } from '..'
import {
  TypeScriptHash,
  LockScriptHash,
  CellChangeData,
  ResourceBindingRegistry,
  ResourceBindingManagerMessage,
  CellChange,
  RegisterMessage,
} from './types'
import { outPointToOutPointString } from './utils'
import { Listener } from '@ckb-js/kuai-io'
import type { Subscription } from 'rxjs'
import { ChainSource } from '@ckb-js/kuai-io/lib/types'
import { OutPointString, UpdateStorageValue } from '../store'
import { CellChangeBuffer } from './cell-change-buffer'

type Registry = Map<ActorURI, ResourceBindingRegistry>

class ScriptRegistry {
  #singleRegistry: Map<LockScriptHash | TypeScriptHash, Registry> = new Map()
  #unionRegistry: Map<LockScriptHash, Map<TypeScriptHash, Registry>> = new Map()
  #registryReverse: Map<ActorURI, [LockScriptHash | undefined, TypeScriptHash | undefined]> = new Map()

  getRegistry(lockHash?: LockScriptHash, typeHash?: TypeScriptHash) {
    if (lockHash && typeHash) {
      return this.#unionRegistry.get(lockHash)?.get(typeHash)
    }
    if (lockHash) {
      return this.#singleRegistry.get(lockHash)
    }
    if (typeHash) {
      return this.#singleRegistry.get(typeHash)
    }
  }

  getRegistryByUri(uri: ActorURI) {
    return this.#registryReverse.get(uri)
  }

  setActorRegistry(
    uri: ActorURI,
    register: ResourceBindingRegistry,
    lockHash?: LockScriptHash,
    typeHash?: TypeScriptHash,
  ) {
    if (lockHash && typeHash) {
      if (!this.#unionRegistry.has(lockHash)) {
        this.#unionRegistry.set(lockHash, new Map([[typeHash, new Map([[uri, register]])]]))
      } else if (!this.#unionRegistry.get(lockHash)?.get(typeHash)) {
        this.#unionRegistry.get(lockHash)?.set(typeHash, new Map([[uri, register]]))
      } else {
        this.#unionRegistry.get(lockHash)?.get(typeHash)?.set(uri, register)
      }
      this.#registryReverse.set(uri, [lockHash, typeHash])
      return
    }
    const hash = lockHash ?? typeHash
    if (hash) {
      if (this.#singleRegistry.has(hash)) {
        this.#singleRegistry.get(hash)?.set(uri, register)
      } else {
        this.#singleRegistry.set(hash, new Map([[uri, register]]))
      }
      return
    }
  }

  removeRegistry(lockHash?: LockScriptHash, typeHash?: TypeScriptHash) {
    if (lockHash && typeHash) {
      return this.#unionRegistry.get(lockHash)?.delete(typeHash)
    }
    if (lockHash) {
      return this.#singleRegistry.delete(lockHash)
    }
    if (typeHash) {
      return this.#singleRegistry.delete(typeHash)
    }
  }

  removeActorURI(uri: ActorURI) {
    if (!this.#registryReverse.has(uri)) return
    const [lockHash, typeHash] = this.#registryReverse.get(uri)!
    this.#registryReverse.delete(uri)
    if (lockHash && typeHash) {
      this.#unionRegistry.get(lockHash)?.get(typeHash)?.delete(uri)
      return
    }
    if (lockHash) {
      this.#singleRegistry.get(lockHash)?.delete(uri)
      return
    }
    if (typeHash) {
      this.#singleRegistry.get(typeHash)?.delete(uri)
      return
    }
  }
}
@ActorProvider({ ref: { name: 'manager' }, autoBind: true })
export class Manager extends Actor<object, MessagePayload<ResourceBindingManagerMessage>> {
  #registry: ScriptRegistry = new ScriptRegistry()
  #registryOutPoint: Map<OutPointString, Registry> = new Map()
  #lastBlock: Block | undefined = undefined
  #tipBlockNumber = BI.from(0)
  #buffer: CellChangeBuffer = new CellChangeBuffer()

  constructor(
    private _listener: Listener<Header>,
    private _dataSource: ChainSource,
  ) {
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

  private updateCellChanges(
    registry: ResourceBindingRegistry,
    inputList: Input[],
    cellChangeDataList: CellChangeData[],
  ) {
    if (cellChangeDataList.length > 0) {
      const upgrade = [...cellChangeDataList.values()].map(([cell, witness]) => ({ cell, witness }))
      upgrade.forEach(({ cell }) => {
        if (!cell.outPoint) return
        const outPointStr = outPointToOutPointString(cell.outPoint)
        const registryMap = this.#registryOutPoint.get(outPointStr) ?? new Map()
        registryMap.set(registry.uri, registry)
        this.#registryOutPoint.set(outPointStr, registryMap)
      })
      this.sendMessage(registry, 'update_cells', upgrade)
    }

    if (inputList.length > 0) {
      inputList.forEach((input) => this.#registryOutPoint.delete(outPointToOutPointString(input.previousOutput)))
      this.sendMessage(
        registry,
        'remove_cells',
        inputList.map((v) => outPointToOutPointString(v.previousOutput)),
      )
    }
  }

  private updateStore(block: Block) {
    if (!this.#lastBlock || BI.from(block.header.number).gt(BI.from(this.#lastBlock.header.number))) {
      const changes = this.filterCellsAndMapChanges(block)
      changes.forEach(([registry, inputList, cellChangeDataList]) => {
        switch (registry.status) {
          case 'initiated': {
            this.updateCellChanges(registry, inputList, cellChangeDataList)
            break
          }
          case 'registered':
          default: {
            this.#buffer.push(registry.uri, [registry, inputList, cellChangeDataList])
          }
        }
      })
      this.#lastBlock = block
    }
  }

  private filterCellsAndMapChanges(block: Block): CellChange[] {
    const newOutputs = new Map<string, CellChangeData>()
    const newInputs = new Map<string, Input>()

    block.transactions.forEach(({ hash, inputs, outputs, outputsData, witnesses }) => {
      if (!hash) return
      /**
       * add every input
       */
      inputs.forEach((input) => newInputs.set(outPointToOutPointString(input.previousOutput), input))

      /**
       * add every output
       */
      outputs.forEach((output, index) =>
        newOutputs.set(outPointToOutPointString({ txHash: hash, index: `0x${index.toString(16)}` }), [
          {
            cellOutput: output,
            data: outputsData[index],
            outPoint: {
              txHash: hash,
              index: `0x${index.toString(16)}`,
            },
            blockHash: block.header.hash,
            blockNumber: block.header.number,
          },
          witnesses[index],
        ]),
      )
    })
    /**
     * remove inputs and outputs if they are matched in the block
     */
    ;[...newInputs.keys()].forEach((outPoint) => {
      if (newOutputs.has(outPoint)) {
        newOutputs.delete(outPoint)
        newInputs.delete(outPoint)
      }
    })

    const changes = new Map<ActorURI, CellChange>()
    ;[...newOutputs.entries()].forEach(([outPoint, cellChangeData]) => {
      const { lock, type } = cellChangeData[0].cellOutput
      const lockHash = lock ? utils.computeScriptHash(lock) : undefined
      const typeHash = type ? utils.computeScriptHash(type) : undefined
      const registries = this.#registry.getRegistry(lockHash, typeHash)

      // regsitry is empty
      if (!registries) return
      ;[...registries.values()].forEach((registry) => {
        const change = changes.get(registry.uri) ?? [registry, [], []]
        change[2].push(cellChangeData)
        const registryMap = this.#registryOutPoint.get(outPoint) ?? new Map()
        registryMap.set(registry.uri, registry)
        changes.set(registry.uri, change)
      })
    })
    ;[...newInputs.entries()].forEach(([outPoint, input]) => {
      const registryMap = this.#registryOutPoint.get(outPoint)
      registryMap?.forEach((registry) => {
        const change = changes.get(registry.uri) ?? [registry, [], []]
        change[1].push(input)
        changes.set(registry.uri, change)
      })
    })

    return [...changes.values()]
  }

  private async initiateStore(registry: ResourceBindingRegistry, lockScript?: Script, typeScript?: Script) {
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
          this.register(register)
        }
        break
      }
      case 'revoke': {
        const revoke = _msg.payload?.value?.revoke
        if (revoke) {
          this.#registry.removeActorURI(revoke.uri)
        }
        break
      }
      default:
        break
    }
  }

  async register(registerInfo: RegisterMessage['register']) {
    const { lockScript, typeScript, uri, pattern } = registerInfo
    const lockHash = lockScript ? utils.computeScriptHash(lockScript) : undefined
    const typeHash = typeScript ? utils.computeScriptHash(typeScript) : undefined
    const registry: ResourceBindingRegistry = { uri, pattern, status: 'registered' }
    this.#registry.setActorRegistry(uri, registry, lockHash, typeHash)
    await this.initiateStore(registry, lockScript, typeScript)
  }

  listen(pollingInterval = 1000): { subscription: Subscription; updator: NodeJS.Timer } {
    return { subscription: this._listener.on(this.onListenBlock), updator: this.update(pollingInterval) }
  }

  private sendMessage<T extends 'remove_cells' | 'update_cells'>(
    registry: ResourceBindingRegistry,
    type: T,
    payload: T extends 'remove_cells' ? OutPointString[] : UpdateStorageValue[],
  ) {
    this.call(registry.uri, {
      pattern: type,
      value: payload,
    })
  }

  get registry(): ScriptRegistry {
    return this.#registry
  }

  get registryOutPoint(): Map<OutPointString, Registry> {
    return this.#registryOutPoint
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
