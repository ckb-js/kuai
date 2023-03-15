import { KUAI_ROUTE_METADATA_METHOD, KUAI_ROUTE_METADATA_PATH } from './metadata'
import 'reflect-metadata'

export function Get(path = '/'): MethodDecorator {
  return (target, key) => {
    defineRoute(target, key, 'GET', path)
  }
}

export function Post(path = '/'): MethodDecorator {
  return (target, key) => {
    defineRoute(target, key, 'POST', path)
  }
}

export function Put(path = '/'): MethodDecorator {
  return (target, key) => {
    defineRoute(target, key, 'PUT', path)
  }
}

export function Delete(path = '/'): MethodDecorator {
  return (target, key) => {
    defineRoute(target, key, 'DELETE', path)
  }
}

function defineRoute(target: object, key: string | symbol, method: string, path: string) {
  Reflect.defineMetadata(KUAI_ROUTE_METADATA_METHOD, method, target, key)
  Reflect.defineMetadata(KUAI_ROUTE_METADATA_PATH, path, target, key)
}
