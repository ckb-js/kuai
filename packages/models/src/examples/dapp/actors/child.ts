import { ActorProvider } from '../../../'
import { CustomActorBase } from './base'

@ActorProvider({ ref: { name: 'child', path: '/parent/' }, bindWhenBootstrap: true })
export class ChildActor extends CustomActorBase {}
