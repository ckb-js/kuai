import { request } from 'undici'
import { ActorURI, CallResponse, MessagePayload } from '../actor'
import { ParamsMissException } from '../exceptions'
import { ChainStorage, Store } from '../store'
import { PROTOCOL, Status } from '../utils'
import type { ContractMethodInterface, Params } from './interface'

export class Contract<StorageT extends ChainStorage> extends Store<StorageT> {
  async run(to: ActorURI, payload: MessagePayload<Params>, method?: string): Promise<CallResponse<MessagePayload>> {
    if (to.startsWith(PROTOCOL.LOCAL)) {
      // call local method
      return this.call(to, payload)
    }
    if (!payload || !method) throw new ParamsMissException()
    // call remote service
    try {
      const res = await request(to, {
        method: 'POST',
        body: JSON.stringify({
          id: 0,
          jsonrpc: '2.0',
          method,
          params: payload.value,
        }),
        headers: {
          'content-type': 'application/json',
        },
      })
      return {
        status: Status.ok,
        message: {
          symbol: payload.symbol,
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
    [P in keyof T]: (to: ActorURI, param: T[P]['params']) => Promise<T[P]['result']>
  } {
    const attacthMethods: Record<ActorURI, PropertyDescriptor> = {}
    contractAPIs.forEach((name) => {
      attacthMethods[name] = {
        value: (to: ActorURI, p: MessagePayload<Params>) => this.run(to, p, name),
        enumerable: true,
      }
    })
    Object.defineProperties(this, attacthMethods)
    return this as unknown as InstanceType<typeof Contract<StorageT>> & {
      [P in keyof T]: (to: ActorURI, param: T[P]['params']) => Promise<T[P]['result']>
    }
  }
}
