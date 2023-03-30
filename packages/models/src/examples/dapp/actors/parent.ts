import { ActorProvider } from '../../../'
import { CustomActorBase } from './base'

@ActorProvider({ ref: { name: 'parent' }, bindWhenBootstrap: true })
export class ParentActor extends CustomActorBase {}
