import { cwd } from 'node:process'
import { resolve } from 'node:path'
import { Actor, ActorReference, Registry } from '../../'
import { Step } from './actors/base'

/**
 * initialize the registry, should be done by the framework
 */
const registry = new Registry()
registry.load(resolve(cwd(), 'src', 'examples', 'dapp'))

/**
 * initialize the message queue, should be done by the framekwork
 */

const parent = registry.find(ActorReference.fromURI('local://parent'))
const child = registry.find(ActorReference.fromURI('local://parent/child'))

if (!parent || !child) {
  throw new Error()
}

Actor.call(child.ref.uri, parent.ref, { pattern: Step.One })
