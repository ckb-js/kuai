import { ActorProvider } from '../../../'
import { CustomActorBase } from './base'

@ActorProvider({ name: 'child', path: '/parent/' })
export class ParentActor extends CustomActorBase {}
