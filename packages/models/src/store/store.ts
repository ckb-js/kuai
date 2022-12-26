import type { ActorMessage, MessagePayload } from '../actor'
import type { OutPointString, StoreMessage, StorePath } from './interface'
import type { JSONStorageOffChain } from './json-storage'
import type { GetState } from './chain-storage'
import { ChainStorage } from './chain-storage'
import { Actor } from '../actor'
import { JSONStorage } from './json-storage'
import { NonExistentException, NonStorageInstanceException } from '../exceptions'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GetData<T> = T extends { data: any } ? T['data'] : never
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GetWitness<T> = T extends { witness: any } ? T['witness'] : never

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Data<T = any> = { data: T }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Witness<T = any> = { witness: T }
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type GetStorageStruct<T = any> = Data<T> | Witness<T> | (Data<T> & Witness<T>)

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export abstract class Store<
  StorageT extends ChainStorage,
  StorageStruct extends GetStorageStruct<GetState<StorageT>>,
> extends Actor<StorageStruct, MessagePayload<StoreMessage<StorageStruct>>> {
  abstract cloneConfig(): Store<StorageT, StorageStruct>

  scriptType: 'lock' | 'script'

  constructor(scriptType: 'lock' | 'script') {
    super()
    this.scriptType = scriptType
  }

  protected states: Record<OutPointString, StorageStruct> = {}

  storageInstance: StorageT | undefined

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

  clone(): Store<StorageT, StorageStruct> {
    if (!this.storageInstance) throw new NonStorageInstanceException()
    const store = this.cloneConfig()
    Object.keys(this.states).forEach((key) => {
      const currentStateInKey = this.states[key]
      if ('data' in currentStateInKey && 'witness' in currentStateInKey) {
        store.states[key] = {
          data: this.storageInstance!.clone(currentStateInKey.data),
          witness: this.storageInstance!.clone(currentStateInKey.witness),
        } as StorageStruct
      } else if ('data' in currentStateInKey) {
        store.states[key] = {
          data: this.storageInstance!.clone(currentStateInKey.data),
        } as StorageStruct
      } else if ('witness' in currentStateInKey) {
        store.states[key] = {
          witness: this.storageInstance!.clone(currentStateInKey.witness),
        } as StorageStruct
      }
    })
    return store
  }

  get(key: OutPointString): StorageStruct
  get(key: OutPointString, paths: ['data']): GetData<StorageStruct>
  get(key: OutPointString, paths: ['witness']): GetWitness<StorageStruct>
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

  set(key: OutPointString, value: StorageStruct): void
  set(key: OutPointString, value: GetData<StorageStruct>, paths: ['data']): void
  set(key: OutPointString, value: GetWitness<StorageStruct>, paths: ['witness']): void
  set(key: OutPointString, value: GetState<StorageT>, paths: ['data' | 'witness', string, ...string[]]): void
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

export class JSONStore<R extends GetStorageStruct<JSONStorageOffChain>> extends Store<
  JSONStorage<JSONStorageOffChain>,
  R
> {
  storageInstance = new JSONStorage<R>()

  cloneConfig(): JSONStore<R> {
    return new JSONStore<R>(this.scriptType)
  }
}
