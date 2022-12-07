import type { ActorMessage, MessagePayload } from '../actor'
import type { OutPointString, StoreMessage, StorePath } from './interface'
import type { JSONStorageOffChain } from './json-storage'
import type { StorageOffChain, GetState } from './chain-storage'
import { ChainStorage } from './chain-storage'
import { Actor } from '../actor'
import { JSONStorage } from './json-storage'
import { NonExistentException, NonStorageInstanceException } from '../exceptions'

type UnknownAsNever<T> = unknown extends T ? (0 extends 1 & T ? T : never) : T

export class Store<StorageT extends ChainStorage> extends Actor<
  StorageT,
  MessagePayload<StoreMessage<GetState<StorageT>>>
> {
  protected states: Record<OutPointString, GetState<StorageT>> = {}

  storageInstance: StorageT | undefined

  private addState(addStates: Record<OutPointString, GetState<StorageT>>) {
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
    let result = this.states[key]?.[paths[0]]
    for (let i = 1; i < (ignoreLast ? paths.length - 1 : paths.length); i++) {
      result = result?.[paths[i]]
    }
    if (result === undefined || result === null) {
      throw new NonExistentException(paths.join('.'))
    }
    return result
  }

  handleCall = (_msg: ActorMessage<MessagePayload<StoreMessage<GetState<StorageT>>>>): void => {
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

  clone(): Store<StorageT> {
    if (!this.storageInstance) throw new NonStorageInstanceException()
    const store = new Store<StorageT>()
    Object.keys(this.states).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      store.states[key] = this.storageInstance!.clone(this.states[key]) as GetState<StorageT>
    })
    return store
  }

  get(key: OutPointString): GetState<StorageT>
  get(key: OutPointString, paths: ['data']): UnknownAsNever<GetState<StorageT>['data']>
  get(key: OutPointString, paths: ['witness']): UnknownAsNever<GetState<StorageT>['witness']>
  get(key: OutPointString, paths: ['data' | 'witness', string, ...string[]]): unknown
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

  set(key: OutPointString, value: GetState<StorageT>): void
  set(key: OutPointString, value: UnknownAsNever<GetState<StorageT>['data']>, paths: ['data']): void
  set(key: OutPointString, value: UnknownAsNever<GetState<StorageT>['witness']>, paths: ['witness']): void
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  set(key: OutPointString, value: any, paths: ['data' | 'witness', string, ...string[]]): void
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

export class JSONStore<T extends StorageOffChain<JSONStorageOffChain>> extends Store<JSONStorage<T>> {
  storageInstance = new JSONStorage<T>()
}
