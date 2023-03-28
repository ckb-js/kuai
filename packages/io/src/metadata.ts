export const KUAI_ROUTE_CONTROLLER = 'kuai:route:controller'
export const KUAI_ROUTE_METADATA_METHOD = 'kuai:route:method'
export const KUAI_ROUTE_METADATA_PATH = 'kuai:route:path'
export const KUAI_ROUTE_ARGS_METADATA = 'kuai:route:route:arguments'

export enum RouteParamtypes {
  REQUEST,
  RESPONSE,
  NEXT,
  BODY,
  QUERY,
  PARAM,
  HEADERS,
  SESSION,
  FILE,
  FILES,
  HOST,
  IP,
}
