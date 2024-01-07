import {
  ActorProvider,
  ActorReference,
  CellPattern,
  JSONStore,
  OutPointString,
  SchemaPattern,
  Sudt,
  Param,
  TypeFilter,
  UpdateStorageValue,
} from '@ckb-js/kuai-models'

@ActorProvider({ ref: { name: 'token', path: `/:typeArgs/` } })
@TypeFilter()
@Sudt()
export class TokenModel extends JSONStore<Record<string, never>> {
  constructor(
    @Param('typeArgs') typeArgs: string,
    _schemaOption?: void,
    params?: {
      states?: Record<OutPointString, never>
      chainData?: Record<OutPointString, UpdateStorageValue>
      cellPattern?: CellPattern
      schemaPattern?: SchemaPattern
    },
  ) {
    super(undefined, { ...params, ref: ActorReference.newWithFilter(TokenModel, `/${typeArgs}/`) })
    if (!this.typeScript) {
      throw new Error('type script is required')
    }
    this.registerResourceBinding()
  }
}
