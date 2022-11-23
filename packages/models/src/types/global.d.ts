import type { MessageQueue } from '../actor';

declare global {
  /* eslint-disable-next-line no-var */
  var mq: MessageQueue | undefined;
}
