import { ActorProvider } from '../../../'
import { CustomActorBase } from './base'

@ActorProvider({ ref: { name: 'parent' }, autoBind: true })
export class ParentActor extends CustomActorBase {}
