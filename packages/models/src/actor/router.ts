import { ActorRef, ConstructorFunction } from './interface'

type NodeType = 'fixed' | 'param'

class Node {
  #children: Node[] = []

  constructor(private _type: NodeType = 'fixed', private _part = '', private _pattern = '/') {}

  #insert = (paths: string[], parent: Node) => {
    const path = paths.shift()
    let node = parent.#children.find((child) => {
      if (path?.startsWith(':')) {
        return child._type == 'param'
      } else {
        return child._type == 'fixed' && child._part == path
      }
    })

    if (!node) {
      node = new Node(path?.startsWith(':') ? 'param' : 'fixed', path, `${parent._pattern}/${path}`)
      parent.#children.push(node)
    }

    if (paths.length > 0) {
      this.#insert(paths, node)
    }
  }

  insert = (paths: string[]) => {
    this.#insert(paths, this)
  }
}

export class Router {
  #root = new Node()
  #modules = new Map<string, ConstructorFunction>()

  addPath = (ref: ActorRef, module: ConstructorFunction) => {
    this.#root.insert(ref.uri.split('/'))
    this.#modules.set(ref.uri, module)
  }

  matchFirst = (ref: ActorRef): ConstructorFunction | undefined =>
    this.#modules.get(this.#root.matchPattern(ref.uri.split('/')))
}
