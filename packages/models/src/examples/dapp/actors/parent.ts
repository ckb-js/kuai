import { ActorProvider } from '../../../'
import { CustomActorBase } from './base'

@ActorProvider({ name: 'parent' }, true)
export class ParentActor extends CustomActorBase {}
