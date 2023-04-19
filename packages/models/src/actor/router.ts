import type { Route } from '@ckb-js/kuai-io/lib/types'
import { createRoute, matchPath } from '@ckb-js/kuai-io'
import type { ActorRef, ConstructorFunction } from './interface'
import { ActorReference } from './actor-reference'
import { ProviderKey } from '../utils'

export class Router {
  #routes: Route[] = []
  #modules = new Map<string, ConstructorFunction>()

  addPath = (ref: ActorRef, module: ConstructorFunction) => {
    const path = `${ref.path}${ref.name.toString()}`
    if (
      this.#routes.find((route) => {
        route.regexp.test(path)
      })
    ) {
      throw new Error(`Route already exists`)
    }

    const route = createRoute({ path })
    this.#routes.push(route)
    this.#modules.set(path, module)

    Reflect.defineMetadata(ProviderKey.ActorRoute, route, module)
  }

  matchFirst = (ref: ActorReference): { module: ConstructorFunction | undefined; parsedRef: ActorReference } => {
    const path = `${ref.path}${ref.name.toString()}`
    const route = this.#routes.find((route) => matchPath(path, route))
    if (!route) {
      return { module: undefined, parsedRef: ref }
    }

    const parsedRef = ref.clone()
    parsedRef.matchParams(route)
    return { module: this.#modules.get(route.path), parsedRef }
  }
}
