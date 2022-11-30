// TODO: https://github.com/ckb-js/kuai/issues/3
import { ActorURI, MessagePayload } from "../actor";
import Store from "../store/store";

enum MethodResponseStatus {
  Failed = 0,
  Success
}

interface ContractMethodResponse {
  status: MethodResponseStatus
  reason?: any
  data?: any
}

type MethodType = 'call' | 'cast'

interface ContractMethodInterface {
  [key: ActorURI]: {
    payload: MessagePayload
    result?: ContractMethodResponse
  }
}

export interface State {}

export default class Contract extends Store {

  update(oldState: State): State {
    return {}
  }

  run(to: ActorURI, type: 'call' | 'cast', payload: MessagePayload, timeout?: number): Promise<ContractMethodResponse> | void {
    let promise
    switch (type) {
      case 'call':
        promise = this.call(to, payload, timeout)
        break
      case 'cast':
        promise = this.cast(to, payload, timeout)
      default:
        break;
    }
    if (promise) {
      promise.then(res => ({
        status: MethodResponseStatus.Success,
        data: res
      }))
      .catch(err => ({
        status: MethodResponseStatus.Failed,
        reason: err.message ?? err.toString()
      }))
    }
  }

  // link others contracts methods, it may be a service
  link<T extends ContractMethodInterface>(contractAPIs: {
    [P in keyof T]: MethodType
  }) {
    const attacthMethods: Record<ActorURI, PropertyDescriptor> = {}
    Object.keys(contractAPIs).forEach((to: keyof T) => {
      attacthMethods[to as string] = {
        value: (p: any) => this.run(to as string, contractAPIs[to], p),
        enumerable: true
      }
    })
    Object.defineProperties(this, attacthMethods)
    return this as unknown as InstanceType<typeof Contract> & {
      [P in keyof T]: (param: T[P]['payload']) => Promise<T[P]['result']>
    }
  }
}

const contract = new Contract()
type BitMethodInterface = {
  'transfter': {
    payload: {
      symbol: symbol
      value: {
        domain: string
      }
    }
    result: ContractMethodResponse
  }
}

const a = contract.link<BitMethodInterface>({
  transfter: 'call'
})
a.transfter({
  symbol: Symbol('c'),
  value: {
    domain: 'aaaa'
  }
})
