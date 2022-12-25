import type { ActorMessage, MessagePayload } from '../actor'
import type { OutPointString, StoreMessage, StorePath } from './interface'
import type { JSONStorageOffChain } from './json-storage'
import type { GetState, StorageTemplate } from './chain-storage'
import { ChainStorage } from './chain-storage'
import { Actor } from '../actor'
import { JSONStorage } from './json-storage'
import { NonExistentException, NonStorageInstanceException } from '../exceptions'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GetData<T> = T extends { data: any } ? T['data'] : never
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GetWitness<T> = T extends { witness: any } ? T['witness'] : never

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class Store<StorageT extends ChainStorage, InnerType = any> extends Actor<
  StorageT,
  MessagePayload<StoreMessage<GetState<StorageT>>>
> {
  abstract cloneConfig(): Store<StorageT>

  scriptType: 'lock' | 'script'

  constructor(scriptType: 'lock' | 'script') {
    super()
    this.scriptType = scriptType
  }

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
    const store = this.cloneConfig()
    Object.keys(this.states).forEach((key) => {
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      store.states[key] = this.storageInstance!.clone(this.states[key]) as GetState<StorageT>
    })
    return store
  }

  get(key: OutPointString): GetState<StorageT>
  get(key: OutPointString, paths: ['data']): GetData<GetState<StorageT>>
  get(key: OutPointString, paths: ['witness']): GetWitness<GetState<StorageT>>
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
  set(key: OutPointString, value: GetData<GetState<StorageT>>, paths: ['data']): void
  set(key: OutPointString, value: GetWitness<GetState<StorageT>>, paths: ['witness']): void
  set(key: OutPointString, value: InnerType, paths: ['data' | 'witness', string, ...string[]]): void
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

export class JSONStore<T extends StorageTemplate<JSONStorageOffChain>> extends Store<
  JSONStorage<T>,
  JSONStorageOffChain
> {
  storageInstance = new JSONStorage<T>()

  cloneConfig(): JSONStore<T> {
    return new JSONStore<T>(this.scriptType)
  }
}
