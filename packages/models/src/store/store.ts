import type { ActorMessage, MessagePayload } from '../actor'
import type { OutPointString, StoreMessage, StorePath, GetStorageStruct, StorageLocation } from './interface'
import type { JSONStorageOffChain } from './json-storage'
import type { GetState } from './chain-storage'
import { ChainStorage } from './chain-storage'
import { Actor } from '../actor'
import { JSONStorage } from './json-storage'
import { NonExistentException, NonStorageInstanceException } from '../exceptions'

export class Store<
  StorageT extends ChainStorage,
  StorageStruct extends GetStorageStruct<GetState<StorageT>>,
  Option = never,
> extends Actor<StorageStruct, MessagePayload<StoreMessage<StorageStruct>>> {
  constructor(params?: { states?: Record<OutPointString, StorageStruct>; options?: Option }) {
    super()
    this.states = params?.states || {}
    if (params?.options) {
      this.options = params?.options
    }
  }

  protected states: Record<OutPointString, StorageStruct>

  private addState(addStates: Record<OutPointString, StorageStruct>) {
    this.states = {
      ...this.states,
      ...addStates,
    }
  }

  private removeState(keys: OutPointString[]) {
    keys.forEach((key) => {
      delete this.states[key]
    })
  }

  private getAndValidTargetKey(key: OutPointString, paths: StorePath, ignoreLast?: boolean) {
    if (ignoreLast && paths.length === 1) return this.states[key]
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let result: any = (this.states[key] as any)?.[paths[0]]
    for (let i = 1; i < (ignoreLast ? paths.length - 1 : paths.length); i++) {
      result = result?.[paths[i]]
    }
    if (result === undefined || result === null) {
      throw new NonExistentException(paths.join('.'))
    }
    return result
  }

  handleCall = (_msg: ActorMessage<MessagePayload<StoreMessage<StorageStruct>>>): void => {
    switch (_msg.payload?.value?.type) {
      case 'add_state':
        if (_msg.payload?.value?.add) {
          this.addState(_msg.payload.value.add)
        }
        break
      case 'remove_state':
        if (_msg.payload?.value?.remove) {
          this.removeState(_msg.payload.value.remove)
        }
        break
      default:
        break
    }
  }

  getStorage(_storeKey: StorageLocation): StorageT | undefined {
    return undefined
  }

  options?: Option

  assetStorage(storage: StorageT | undefined) {
    if (!storage) throw new NonStorageInstanceException()
  }

  clone(): Store<StorageT, StorageStruct> {
    const states: Record<OutPointString, StorageStruct> = {}
    Object.keys(this.states).forEach((key) => {
      const currentStateInKey = this.states[key]
      if ('data' in currentStateInKey && currentStateInKey.data !== undefined) {
        this.assetStorage(this.getStorage('data'))
        states[key] = (states[key] || {}) as StorageStruct
        states[key].data = this.getStorage('data')?.clone(currentStateInKey.data)
      }
      if ('witness' in currentStateInKey && currentStateInKey.witness !== undefined) {
        this.assetStorage(this.getStorage('witness'))
        states[key] = (states[key] || {}) as StorageStruct
        states[key].witness = this.getStorage('witness')?.clone(currentStateInKey.witness)
      }
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (<any>this.constructor)({ states, options: this.options })
  }

  get(key: OutPointString): StorageStruct
  get(key: OutPointString, paths: ['data']): StorageStruct['data']
  get(key: OutPointString, paths: ['witness']): StorageStruct['witness']
  get(key: OutPointString, paths: [StorePath[0], string, ...string[]]): unknown
  get(key: OutPointString, paths?: StorePath) {
    try {
      if (paths) {
        return this.getAndValidTargetKey(key, paths)
      }
      return this.states[key]
    } catch (error) {
      return
    }
  }

  set(key: OutPointString, value: StorageStruct): void
  set(key: OutPointString, value: StorageStruct['data'], paths: ['data']): void
  set(key: OutPointString, value: StorageStruct['witness'], paths: ['witness']): void
  set(key: OutPointString, value: GetState<StorageT>, paths: [StorePath[0], string, ...string[]]): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: OutPointString, value: any, paths?: StorePath) {
    if (paths) {
      const target = this.getAndValidTargetKey(key, paths, true)
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      const lastKey = paths.at(-1)!
      target[lastKey] = value
      return
    }
    this.states[key] = value
  }

  remove(key: OutPointString) {
    delete this.states[key]
  }
}

type IsUnknownOrNever<T> = T extends never ? true : unknown extends T ? (0 extends 1 & T ? false : true) : false

type GetStorageStructByTemplate<T extends GetStorageStruct> = IsUnknownOrNever<T['data']> extends true
  ? IsUnknownOrNever<T['witness']> extends true
    ? never
    : { witness: T['witness'] }
  : IsUnknownOrNever<T['witness']> extends true
  ? { data: T['data'] }
  : { data: T['data']; witness: T['witness'] }

export class JSONStore<R extends GetStorageStruct<JSONStorageOffChain>> extends Store<
  JSONStorage<JSONStorageOffChain>,
  GetStorageStructByTemplate<R>
> {
  getStorage(_storeKey: StorageLocation): JSONStorage<JSONStorageOffChain> {
    return new JSONStorage()
  }
}
