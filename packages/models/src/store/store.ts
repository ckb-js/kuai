import type { ActorMessage, MessagePayload } from '../actor'
import type {
  OutPointString,
  StoreMessage,
  StorePath,
  StorageSchema,
  StorageLocation,
  GetStorageStruct,
  GetFullStorageStruct,
  ScriptSchema,
  OmitByValue,
  GetStorageOption,
} from './interface'
import type { JSONStorageOffChain } from './json-storage'
import type { GetState } from './chain-storage'
import { ChainStorage } from './chain-storage'
import { Actor } from '../actor'
import { JSONStorage } from './json-storage'
import { NonExistentException, NonStorageInstanceException } from '../exceptions'

type GetKeyType<T, K extends keyof T> = T & { _add: never } extends { [P in K]: T[P] } ? T[K] : never

export class Store<
  StorageT extends ChainStorage,
  StructSchema extends StorageSchema<GetState<StorageT>>,
  Option = never,
> extends Actor<GetStorageStruct<StructSchema>, MessagePayload<StoreMessage<GetStorageStruct<StructSchema>>>> {
  protected states: Record<OutPointString, GetStorageStruct<StructSchema>>

  protected options?: Option

  protected schemaOption?: GetStorageOption<StructSchema>

  constructor(
    params?: GetStorageOption<StructSchema> extends never
      ? {
          states?: Record<OutPointString, GetStorageStruct<StructSchema>>
          options?: Option
        }
      : {
          states?: Record<OutPointString, GetStorageStruct<StructSchema>>
          options?: Option
          schemaOption: GetStorageOption<StructSchema>
        },
  ) {
    super()
    this.states = params?.states || {}
    this.options = params?.options
    if (params && 'schemaOption' in params) {
      this.schemaOption = params?.schemaOption
    }
  }

  private addState(addStates: Record<OutPointString, GetStorageStruct<StructSchema>>) {
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

  handleCall = (_msg: ActorMessage<MessagePayload<StoreMessage<GetStorageStruct<StructSchema>>>>): void => {
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

  assetStorage(storage: StorageT | undefined) {
    if (!storage) throw new NonStorageInstanceException()
  }

  cloneScript<T extends 'lock' | 'type'>(scriptValue: unknown, type: T): GetFullStorageStruct<StructSchema>[T] {
    if (typeof scriptValue !== 'object' || scriptValue === null) throw new Error()
    const res = {} as GetFullStorageStruct<StructSchema>[T]
    if ('args' in scriptValue) {
      this.assetStorage(this.getStorage([type, 'args']))
      res['args'] = this.getStorage([type, 'args'])?.clone(scriptValue.args)
    }
    if ('codeHash' in scriptValue) {
      this.assetStorage(this.getStorage([type, 'codeHash']))
      res['codeHash'] = this.getStorage([type, 'codeHash'])?.clone(scriptValue.codeHash)
    }
    if ('hashType' in scriptValue) {
      this.assetStorage(this.getStorage([type, 'hashType']))
      res['hashType'] = this.getStorage([type, 'hashType'])?.clone(scriptValue.hashType)
    }
    return res
  }

  clone(): Store<StorageT, StructSchema> {
    const states: Record<OutPointString, GetFullStorageStruct<StructSchema>> = {}
    Object.keys(this.states).forEach((key) => {
      const currentStateInKey = this.states[key]
      states[key] = (states[key] || {}) as GetFullStorageStruct<StructSchema>
      if ('data' in currentStateInKey && currentStateInKey.data !== undefined) {
        this.assetStorage(this.getStorage('data'))
        states[key].data = this.getStorage('data')?.clone(currentStateInKey.data)
      }
      if ('witness' in currentStateInKey && currentStateInKey.witness !== undefined) {
        this.assetStorage(this.getStorage('witness'))
        states[key].witness = this.getStorage('witness')?.clone(currentStateInKey.witness)
      }
      if ('lock' in currentStateInKey && (currentStateInKey.lock ?? false) !== false) {
        states[key].lock = this.cloneScript<'lock'>(currentStateInKey.lock, 'lock')
      }
      if ('type' in currentStateInKey && (currentStateInKey.type ?? false) !== false) {
        states[key].type = this.cloneScript<'type'>(currentStateInKey.type, 'type')
      }
    })
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return new (<any>this.constructor)({ states, options: this.options, schemaOption: this.schemaOption })
  }

  get(key: OutPointString): GetStorageStruct<StructSchema>
  get(key: OutPointString, paths: ['data']): GetFullStorageStruct<StructSchema>['data']
  get(key: OutPointString, paths: ['witness']): GetFullStorageStruct<StructSchema>['witness']
  get(key: OutPointString, paths: ['lock', 'args']): GetKeyType<GetFullStorageStruct<StructSchema>['lock'], 'args'>
  get(
    key: OutPointString,
    paths: ['lock', 'codeHash'],
  ): GetKeyType<GetFullStorageStruct<StructSchema>['lock'], 'codeHash'>
  get(
    key: OutPointString,
    paths: ['lock', 'hashType'],
  ): GetKeyType<GetFullStorageStruct<StructSchema>['lock'], 'hashType'>
  get(key: OutPointString, paths: ['type', 'args']): GetKeyType<GetFullStorageStruct<StructSchema>['type'], 'args'>
  get(
    key: OutPointString,
    paths: ['type', 'codeHash'],
  ): GetKeyType<GetFullStorageStruct<StructSchema>['type'], 'codeHash'>
  get(
    key: OutPointString,
    paths: ['type', 'hashType'],
  ): GetKeyType<GetFullStorageStruct<StructSchema>['type'], 'hashType'>
  get(key: OutPointString, paths: ['data' | 'witness', ...string[]]): unknown
  get(key: OutPointString, paths: ['type' | 'lock', keyof ScriptSchema, ...string[]]): unknown
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

  set(key: OutPointString, value: GetStorageStruct<StructSchema>): void
  set(key: OutPointString, value: GetFullStorageStruct<StructSchema>['data'], paths: ['data']): void
  set(key: OutPointString, value: GetFullStorageStruct<StructSchema>['witness'], paths: ['witness']): void
  set(
    key: OutPointString,
    value: GetKeyType<GetFullStorageStruct<StructSchema>['lock'], 'args'>,
    paths: ['lock', 'args'],
  ): void
  set(
    key: OutPointString,
    value: GetKeyType<GetFullStorageStruct<StructSchema>['lock'], 'codeHash'>,
    paths: ['lock', 'codeHash'],
  ): void
  set(
    key: OutPointString,
    value: GetKeyType<GetFullStorageStruct<StructSchema>['lock'], 'hashType'>,
    paths: ['lock', 'hashType'],
  ): void
  set(
    key: OutPointString,
    value: GetKeyType<GetFullStorageStruct<StructSchema>['type'], 'args'>,
    paths: ['type', 'args'],
  ): void
  set(
    key: OutPointString,
    value: GetKeyType<GetFullStorageStruct<StructSchema>['type'], 'codeHash'>,
    paths: ['type', 'codeHash'],
  ): void
  set(
    key: OutPointString,
    value: GetKeyType<GetFullStorageStruct<StructSchema>['type'], 'hashType'>,
    paths: ['type', 'hashType'],
  ): void
  set(key: OutPointString, value: GetState<StorageT>, paths: ['data' | 'witness', ...string[]]): void
  set(key: OutPointString, value: GetState<StorageT>, paths: ['type' | 'lock', keyof ScriptSchema, ...string[]]): void
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

type GetStorageStructByTemplate<T extends StorageSchema> = OmitByValue<{
  data: IsUnknownOrNever<T['data']> extends true ? never : T['data']
  witness: IsUnknownOrNever<T['witness']> extends true ? never : T['witness']
  lock: IsUnknownOrNever<T['lock']> extends true ? never : T['lock']
  type: IsUnknownOrNever<T['type']> extends true ? never : T['type']
}>

export class JSONStore<R extends StorageSchema<JSONStorageOffChain>> extends Store<
  JSONStorage<JSONStorageOffChain>,
  GetStorageStructByTemplate<R>
> {
  getStorage(_storeKey: StorageLocation): JSONStorage<JSONStorageOffChain> {
    return new JSONStorage()
  }
}
