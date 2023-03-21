import { Actor, ActorMessage, MessagePayload, ActorProvider } from '@ckb-js/kuai-models';

interface HelloMessage {
  type: 'hello';
  hello: {
    name: string;
  };
}

export type AppMessage = HelloMessage;

@ActorProvider({ name: 'app' }, true)
export class CustomActor extends Actor<object, MessagePayload<AppMessage>> {
  handleCall = (_msg: ActorMessage<MessagePayload<AppMessage>>): void => {
    switch (_msg.payload?.value?.type) {
      case 'hello': {
        const name = _msg.payload?.value?.hello.name;
        this.hello(name);
        break;
      }
      default:
        break;
    }
  };

  hello = (name?: string) => {
    if (name) {
      return `hello ${name}`;
    }

    return `hello world`;
  };
}
