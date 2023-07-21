import { ActorProvider } from '../../../'
import { CustomActorBase } from './base'

@ActorProvider({ ref: { name: 'child', path: '/parent/' }, autoBind: true })
export class ChildActor extends CustomActorBase {}
