import { ActorProvider } from '../../../'
import { CustomActorBase } from './base'

@ActorProvider({ name: 'parent' })
export class ParentActor extends CustomActorBase {}
