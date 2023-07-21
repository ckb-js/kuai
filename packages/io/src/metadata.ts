export const KUAI_ROUTE_CONTROLLER_PATH = 'kuai:route:controller:path'
export const KUAI_ROUTE_METADATA_METHOD = 'kuai:route:method'
export const KUAI_ROUTE_METADATA_PATH = 'kuai:route:path'
export const KUAI_ROUTE_ARGS_METADATA = 'kuai:route:route:arguments'

export enum RouteMethod {
  GET = 'GET',
  POST = 'POST',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  PUT = 'PUT',
}

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
