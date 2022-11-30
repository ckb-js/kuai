import { cwd } from 'node:process'
import { resolve } from 'node:path'
import { Actor, MessageQueue, Registry } from '../../'
import { Step } from './actors/base'

declare global {
  /* eslint-disable-next-line no-var */
  var mq: MessageQueue | undefined
}

/**
 * initialize the registry, should be done by the framework
 */
const registry = new Registry()
registry.load(resolve(cwd(), 'src', 'examples', 'dapp'))

/**
 * initialize the message queue, should be done by the framekwork
 */
globalThis.mq = new MessageQueue(registry)
globalThis.mq.start()

const parent = registry.find('local://parent')
const child = registry.find('local://parent/child')

if (!parent || !child) {
  throw new Error()
}

Actor.call(child.ref.uri, parent.ref, { symbol: Step.One })
