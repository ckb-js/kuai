import { Block, Header, Output, Input, HexString, utils, OutPoint } from '@ckb-lumos/base'
import { BI } from '@ckb-lumos/bi'
import { Actor, ActorMessage, ActorURI, MessagePayload } from '..'
import { TypescriptHash, LockscriptHash } from './types'
import { ResourceBindingRegistry, ResourceBindingManagerMessage } from './interface'
import { outpointToOutPointString } from './utils'
import { Listener } from '@kuai/io'
import { OutPointString } from '..'
import type { Subscription } from 'rxjs'
import { ChainSource } from '@kuai/io/lib/types'

export class Manager extends Actor<object, MessagePayload<ResourceBindingManagerMessage>> {
  #registry: Map<TypescriptHash, Map<LockscriptHash, ResourceBindingRegistry>> = new Map()
  #registryOutpoint: Map<OutPointString, ResourceBindingRegistry> = new Map()
  #registryReverse: Map<ActorURI, [TypescriptHash, LockscriptHash]> = new Map()
  #lastBlock: Block | undefined = undefined
  #topBlockNumber = BI.from(0)

  constructor(private _listener: Listener<Header>, private _dataSource: ChainSource) {
    super()
  }

  onListenBlock = (blockHeader: Header) => {
    const currentBlockNumber = BI.from(blockHeader.number)
    if (currentBlockNumber.gt(this.topBlockNumber)) {
      this.topBlockNumber = currentBlockNumber
    }
  }

  private update(pollingInterval = 1000) {
    return setInterval(async () => {
      if (this.#topBlockNumber.gt(0) && this.#topBlockNumber.gt(BI.from(this.#lastBlock?.header.number ?? 0))) {
        this.updateStore(await this._dataSource.getBlock(this.#topBlockNumber.toHexString()))
      }
    }, pollingInterval)
  }

  private updateStore(block: Block) {
    if (!this.#lastBlock || BI.from(block.header.number).gt(BI.from(this.#lastBlock.header.number))) {
      for (const tx of block.transactions) {
        for (const input of tx.inputs) {
          this.removeFromInput(input)
        }
        for (const outputIndex in tx.outputs) {
          if (tx.hash) {
            this.AddFromOutput(
              tx.outputs[outputIndex],
              {
                /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
                txHash: tx.hash!,
                index: outputIndex,
              },
              tx.outputsData[outputIndex],
              tx.witnesses[outputIndex],
              block,
            )
          }
        }
      }
      this.#lastBlock = block
    }
  }

  handleCall = (_msg: ActorMessage<MessagePayload<ResourceBindingManagerMessage>>): void => {
    switch (_msg.payload?.value?.type) {
      case 'register': {
        const register = _msg.payload?.value?.register
        if (register) {
          this.register(register.lockscriptHash, register.typescriptHash, register.uri, register.pattern)
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

  async register(lock: LockscriptHash, type: TypescriptHash, uri: ActorURI, pattern: string) {
    if (!this.#registry.get(type)) {
      this.#registry.set(type, new Map())
    }
    this.#registry.get(type)?.set(lock, { uri, pattern })
    this.#registryReverse.set(uri, [type, lock])
  }

  revoke(uri: ActorURI) {
    if (this.#registryReverse.has(uri)) {
      /* eslint-disable-next-line @typescript-eslint/no-non-null-assertion */
      const [type, lock] = this.#registryReverse.get(uri)!
      this.#registry.get(type)?.delete(lock)
      this.#registryReverse.delete(uri)
    }
  }

  listen(pollingInterval = 1000): { subscription: Subscription; updator: NodeJS.Timer } {
    return { subscription: this._listener.on(this.onListenBlock), updator: this.update(pollingInterval) }
  }

  private removeFromInput(input: Input) {
    const outpoint = outpointToOutPointString(input.previousOutput)
    const store = this.#registryOutpoint.get(outpoint)
    if (store) {
      this.call(store.uri, {
        pattern: store.pattern,
        value: {
          type: 'remove_state',
          remove: outpoint,
        },
      })
    }
    this.#registryOutpoint.delete(outpoint)
  }

  private AddFromOutput(output: Output, outpoint: OutPoint, data: HexString, witness: HexString, block: Block) {
    const typeHash = output.type ? utils.computeScriptHash(output.type) : 'null'
    const store = this.#registry.get(typeHash)?.get(utils.computeScriptHash(output.lock))
    if (store) {
      this.call(store.uri, {
        pattern: store.pattern,
        value: {
          type: 'update_cell',
          update: {
            witness: witness,
            cell: {
              cellOutput: output,
              data: data,
              outPoint: outpoint,
              blockHash: block.header.hash,
              blockNumber: block.header.number,
            },
          },
        },
      })
      this.registryOutpoint.set(outpointToOutPointString(outpoint), { uri: store.uri, pattern: store.pattern })
    }
  }

  get registry(): Map<TypescriptHash, Map<LockscriptHash, ResourceBindingRegistry>> {
    return this.#registry
  }

  get registryOutpoint(): Map<OutPointString, ResourceBindingRegistry> {
    return this.#registryOutpoint
  }

  get registryReverse(): Map<ActorURI, [TypescriptHash, LockscriptHash]> {
    return this.#registryReverse
  }

  get lastBlock(): Block | undefined {
    return this.#lastBlock
  }

  set topBlockNumber(blockNumber: BI) {
    this.#topBlockNumber = blockNumber
  }

  get topBlockNumber(): BI {
    return this.#topBlockNumber
  }
}
