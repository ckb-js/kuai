import { Actor, ActorMessage, MessagePayload, ActorProvider } from '@ckb-js/kuai-models'

export const StorageMessagePattern: Record<string, string> = {
  Fetch: 'fetch',
  Set: 'set',
}

interface FetchMessage {
  type: 'fetch'
  fetch: {
    path: string
  }
}

interface SetMessage {
  type: 'set'
  set: {
    path: string
    value: object
  }
}

export type StorageMessage = FetchMessage | SetMessage

@ActorProvider({ name: 'storage' })
export class CustomStorageActor extends Actor<object, MessagePayload<StorageMessage>> {
  handleCall = (_msg: ActorMessage<MessagePayload<StorageMessage>>): void => {
    switch (_msg.payload?.value?.type) {
      case 'fetch': {
        const path = _msg.payload?.value?.fetch.path
        if (path) {
          this.fetch(path)
        }
        break
      }
      case 'set': {
        const set = _msg.payload?.value?.set
        if (set) {
          this.set(set.path, set.value)
        }
        break
      }
      default:
        break
    }
  }

  fetch = (path: string) => {
    return {
      value: 'KuaiMvp',
      path,
    }
  }

  set = (path: string, value: object) => {
    // todo: just for mock
    return {
      value,
      path,
    }
  }
}
