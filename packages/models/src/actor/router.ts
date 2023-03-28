import { ActorRef, ConstructorFunction } from './interface'

type NodeType = 'static' | 'dynamic'

class Node {
  #children: Node[] = []

  constructor(private _type: NodeType = 'static', private _part = '', private _pattern = '') {}

  #insert = (paths: string[], parent: Node) => {
    const path = paths.shift()
    let node = parent.#children.find((child) => {
      if (path?.startsWith(':')) {
        return child._type == 'dynamic'
      } else {
        return child._type == 'static' && child._part == path
      }
    })

    if (!node) {
      node = path?.startsWith(':')
        ? new Node('dynamic', ':', `${parent._pattern}/:`)
        : new Node('static', path, `${parent._pattern}/${path}`)
      parent.#children.push(node)
    }

    if (paths.length > 0) {
      this.#insert(paths, node)
    }
  }

  insert = (paths: string[]) => {
    this.#insert(
      paths.filter((path) => path != ''),
      this,
    )
  }

  #matchPattern = (paths: string[], parent: Node): string | undefined => {
    const path = paths.shift()

    let wiled: Node | undefined = undefined
    let node = parent.#children.find((child) => {
      if (child._part.startsWith(':')) {
        wiled = child
      }

      if (path == child._part) {
        return true
      }
    })
    node = node ?? wiled

    if (!node) return undefined

    if (paths.length == 0) {
      return node?._pattern
    }

    return this.#matchPattern(paths, node)
  }

  matchPattern = (paths: string[]) =>
    this.#matchPattern(
      paths.filter((path) => path != ''),
      this,
    )
}

export class Router {
  #root = new Node()
  #modules = new Map<string, ConstructorFunction>()

  addPath = (ref: ActorRef, module: ConstructorFunction) => {
    const paths = `${ref.path}${ref.name.toString()}`.split('/')
    this.#root.insert(paths)
    const pattern = this.#root.matchPattern(paths)
    if (pattern) {
      this.#modules.set(pattern, module)
    }
  }

  matchFirst = (ref: ActorRef): ConstructorFunction | undefined => {
    return this.#modules.get(this.#root.matchPattern(`${ref.path}${ref.name.toString()}`.split('/')) ?? '')
  }
}
