import { ActorProvider } from '../../../'
import { CustomActorBase } from './base'

@ActorProvider({ name: 'child', path: '/parent/' })
export class ChildActor extends CustomActorBase {}
