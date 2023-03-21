import { ActorProvider } from '../../../'
import { CustomActorBase } from './base'

@ActorProvider({ name: 'child', path: '/parent/' }, true)
export class ChildActor extends CustomActorBase {}
