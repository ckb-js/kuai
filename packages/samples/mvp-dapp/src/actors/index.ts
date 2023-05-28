/**
 * @module src/actors
 * @description
 * This module works as the entry of all actor models in the application.
 * It loads all actor models in directory into the registry for automatic initialization.
 * It also exports the registry instance so that other modules can use it.
 */

import { Registry } from '@ckb-js/kuai-models'

const appRegistry = new Registry()
appRegistry.load(__dirname)

export { appRegistry }
export { OmnilockModel } from './omnilock.model'
export { RecordModel } from './record.model'
