import { Actor, ActorMessage, MessagePayload } from "../actor";
import { OutPointString, StatePath, StoreMessage } from "./interface";
import { ChainStorage } from "./chain-storage";

type GetState<T> = T extends ChainStorage<infer State> ? State : never

export class Store<Storage extends ChainStorage> extends Actor<Storage, MessagePayload<StoreMessage<GetState<Storage>>>> {
  protected states: Record<OutPointString, GetState<Storage>> = {}

  //@ts-ignore TODO should init
  protected storageInstance: Storage

  // sync from tx or database
  private addState(addStates: Record<OutPointString, GetState<Storage>>) {
    this.states = {
      ...this.states,
      ...addStates
    }
  }

  private removeState(keys: OutPointString[]) {
    keys.forEach(key => {
      delete this.states[key]
    })
  }

  private getAndValidTargetKey(path: Required<StatePath>, ignoreLast?: boolean) {
    const keys = path.path.split('.')
    if (keys[0] !== 'data' && keys[0] !== 'witness') {
      throw Error(`The first path should be data or witness`)
    }
    let result = this.states[path.key]?.[keys[0]]
    for (let i = 1; i < (ignoreLast ? keys.length - 1 : keys.length); i++) {
      result = result?.[keys[i]]
    }
    if (result === undefined || result === null) {
      throw Error(`The path is not exist in state`)
    }
    return result
  }

  handleCall = (_msg: ActorMessage<MessagePayload<StoreMessage<GetState<Storage>>>>): void => {
    switch (_msg.payload?.value?.type) {
      case 'add_state':
        if (_msg.payload?.value?.add) {
          this.addState(_msg.payload.value.add)
        }
        break;
      case 'remove_state':
        if (_msg.payload?.value?.remove) {
          this.removeState(_msg.payload.value.remove)
        }
        break;
      default:
        break;
    }
  }

  clone() {
    const store = new Store()
    Object.keys(this.states).forEach(key => {
      store.states[key] = this.storageInstance.clone(this.states[key])
    })
    return store
  }

  get(path: StatePath) {
    if (path.path) {
      return this.getAndValidTargetKey(path as Required<StatePath>)
    }
    return this.states[path.key]
  }

  set(path: StatePath, value: any) {
    if (path.path) {
      const target = this.getAndValidTargetKey(path as Required<StatePath>, true)
      const lastKey = path.path.split('.').at(-1)
      target[lastKey!] = value
    }
    this.states[path.key] = value
  }

  remove(path: StatePath) {
    if (path.path) {
      const target = this.getAndValidTargetKey(path as Required<StatePath>, true)
      const lastKey = path.path.split('.')[-1]
      delete target[lastKey]
    }
    delete this.states[path.key]
  }
}