import { request } from 'undici'
import { ActorURI, CallResponse, MessagePayload } from '../actor'
import { ParamsMissException as MethodMissException } from '../exceptions'
import { Store } from '../store'
import { PROTOCOL, Status } from '../utils'
import { REMOTE_CALL_PATTERN } from './interface'
import type { ChainStorage, GetState, StorageSchema } from '../store'
import type { ContractMethod, ContractMethodInterface, ContractPayload } from './interface'

export class Contract<
  StorageT extends ChainStorage,
  StructSchema extends StorageSchema<GetState<StorageT>> = Record<string, never>,
  Option = never,
> extends Store<StorageT, StructSchema, Option> {
  async run(to: ActorURI, payload: MessagePayload<ContractPayload>): Promise<CallResponse<MessagePayload>> {
    if (to.startsWith(PROTOCOL.LOCAL)) {
      // call local method
      return this.call(to, payload)
    }
    if (!payload || !payload.value?.method) throw new MethodMissException()
    // call remote service
    try {
      const res = await request(to, {
        method: 'POST',
        body: JSON.stringify({
          id: 0,
          jsonrpc: '2.0',
          method: payload.value?.method,
          params: payload.value.params,
        }),
        headers: {
          'content-type': 'application/json',
        },
      })
      return {
        status: Status.ok,
        message: {
          pattern: payload.pattern,
          value: res.body.json(),
        },
      }
    } catch (error) {
      return {
        status: Status.error,
        message: null,
      }
    }
  }

  // link others contracts methods, it may be a service
  link<T extends ContractMethodInterface>(
    contractAPIs: string[],
  ): Contract<StorageT> & {
    [P in keyof T]: (to: ActorURI, param: T[P]['params'], pattern?: string) => Promise<T[P]['result']>
  } {
    const attacthMethods: Record<ActorURI, PropertyDescriptor> = {}
    contractAPIs.forEach((name) => {
      attacthMethods[name] = {
        value: (to: ActorURI, p: ContractMethod['params'], pattern?: string) =>
          this.run(to, { pattern: pattern || REMOTE_CALL_PATTERN, value: { method: name, params: p } }),
        enumerable: true,
      }
    })
    Object.defineProperties(this, attacthMethods)
    return this as unknown as InstanceType<typeof Contract<StorageT>> & {
      [P in keyof T]: (to: ActorURI, param: T[P]['params'], pattern?: string) => Promise<T[P]['result']>
    }
  }
}
