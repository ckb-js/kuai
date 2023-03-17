import { ActorRef, ConstructorFunction } from './interface'

type NodeType = 'fixed' | 'param'

interface Node {
  children: Node[]
  type: NodeType
  part: string
  pattern: string
}

export interface Router {
  roots: Node[]
  modules: Map<string, ConstructorFunction>

  insert: (ref: ActorRef, module: ConstructorFunction) => void

  matchFirst: (ref: ActorRef) => ConstructorFunction | undefined

  matchAll: (ref: ActorRef) => ConstructorFunction[]
}
