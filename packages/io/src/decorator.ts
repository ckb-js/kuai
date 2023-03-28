import {
  KUAI_ROUTE_METADATA_METHOD,
  KUAI_ROUTE_METADATA_PATH,
  KUAI_ROUTE_ARGS_METADATA,
  RouteParamtypes,
} from './metadata'
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

export type ParamData = string | number
export interface RouteParamMetadata {
  index: number
  paramtype: RouteParamtypes
  data?: ParamData
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function assignMetadata<TArgs = any>(args: TArgs, paramtype: RouteParamtypes, index: number, data?: ParamData) {
  return {
    ...args,
    [`${paramtype}:${index}`]: {
      index,
      paramtype,
      data,
    },
  }
}

function createRouteParamDecorator(paramtype: RouteParamtypes) {
  return (data?: ParamData): ParameterDecorator =>
    (target, key, index) => {
      const args = Reflect.getMetadata(KUAI_ROUTE_ARGS_METADATA, target, key) || {}
      Reflect.defineMetadata(
        KUAI_ROUTE_ARGS_METADATA,
        assignMetadata<Record<number, RouteParamMetadata>>(args, paramtype, index, data),
        target,
        key,
      )
    }
}

export function Query(property?: string): ParameterDecorator {
  return createRouteParamDecorator(RouteParamtypes.QUERY)(property)
}

export function Body(property?: string): ParameterDecorator {
  return createRouteParamDecorator(RouteParamtypes.BODY)(property)
}

export function Param(property?: string): ParameterDecorator {
  return createRouteParamDecorator(RouteParamtypes.PARAM)(property)
}

export const Headers: (property?: string) => ParameterDecorator = createRouteParamDecorator(RouteParamtypes.HEADERS)

function defineRoute(target: object, key: string | symbol, method: string, path: string) {
  Reflect.defineMetadata(KUAI_ROUTE_METADATA_METHOD, method, target, key)
  Reflect.defineMetadata(KUAI_ROUTE_METADATA_PATH, path, target, key)
}
