import {
  KUAI_ROUTE_METADATA_METHOD,
  KUAI_ROUTE_METADATA_PATH,
  KUAI_ROUTE_ARGS_METADATA,
  KUAI_ROUTE_CONTROLLER_PATH,
  RouteParamtypes,
  RouteMethod,
} from './metadata'
import 'reflect-metadata'

function createRouteMethodDecorator(method: RouteMethod) {
  return (path = '/'): MethodDecorator =>
    (target, key) => {
      Reflect.defineMetadata(KUAI_ROUTE_METADATA_METHOD, method, target, key)
      Reflect.defineMetadata(KUAI_ROUTE_METADATA_PATH, path, target, key)
    }
}

export type ParamData = string | number
export interface RouteParamMetadata {
  index: number
  paramtype: RouteParamtypes
  data?: ParamData
}

export function assignMetadata<TArgs = Record<number, RouteParamtypes>>(
  args: TArgs,
  paramtype: RouteParamtypes,
  index: number,
  data?: ParamData,
) {
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

export type ControllerOptions = {
  prefix?: string
}

export function Controller(prefixOrOptions?: string | ControllerOptions): ClassDecorator {
  const path = (() => {
    if (typeof prefixOrOptions === 'string') {
      return prefixOrOptions
    }

    if (typeof prefixOrOptions === 'object') {
      return prefixOrOptions.prefix || '/'
    }

    return '/'
  })()

  return (target: object) => {
    Reflect.defineMetadata(KUAI_ROUTE_CONTROLLER_PATH, path, target)
  }
}

export function Get(path = '/'): MethodDecorator {
  return createRouteMethodDecorator(RouteMethod.GET)(path)
}

export function Post(path = '/'): MethodDecorator {
  return createRouteMethodDecorator(RouteMethod.POST)(path)
}

export function Patch(path = '/'): MethodDecorator {
  return createRouteMethodDecorator(RouteMethod.PATCH)(path)
}

export function Put(path = '/'): MethodDecorator {
  return createRouteMethodDecorator(RouteMethod.PUT)(path)
}

export function Delete(path = '/'): MethodDecorator {
  return createRouteMethodDecorator(RouteMethod.DELETE)(path)
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
