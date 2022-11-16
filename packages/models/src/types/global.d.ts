import type { MessageQueue } from '../actor';

declare global {
  /* eslint-disable no-var */
  var mq: MessageQueue | undefined;
}
