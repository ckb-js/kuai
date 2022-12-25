import { molecule, number, bytes } from '@ckb-lumos/codec'
import { BI } from '@ckb-lumos/bi'
import { ChainStorage } from './chain-storage'
import type { StorageType, StorageTemplate } from './chain-storage'
import { NoExpectedDataException } from '../exceptions'
import { BytesCodec, FixedBytesCodec } from '@ckb-lumos/codec/lib/base'

/**
 * Comm types define
 */
type Tuple<T, N extends number, R extends T[] = []> = R['length'] extends N ? R : Tuple<T, N, [T, ...R]>
/** slice tuple types */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SliceType<T extends any[]> = T extends [infer _, ...infer Left] ? Left : never
type ExpandToRecord<T extends number | string> = T extends T ? Record<T, T> : never
/** If the type is union type, return never, or return it */
type ExcludeUnionType<T extends number | string> = ExpandToRecord<T> extends Record<T, T> ? T : never
/** Valid is a const number */
type IsConstNumber<N extends number> = [1] extends [N] ? ([N] extends [1] ? N : never) : ExcludeUnionType<N>

/**
 * Basic types define
 */
type MoleculeFixedBasicTypeArr = ['Uint8', 'Uint16', 'Uint32', 'Uint64', 'Uint128', 'Uint256', 'Uint512']
type MoleculeFixedBasicType = MoleculeFixedBasicTypeArr[number]

type MoleculeDynBasicTypeArr = ['string']
type MoleculeDynBasicType = MoleculeDynBasicTypeArr[number]

type IsOneType<
  T extends MoleculeFixedBasicType | MoleculeDynBasicType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Left extends any[] = [...MoleculeFixedBasicTypeArr, ...MoleculeDynBasicTypeArr],
> = Left[0] extends never ? never : [T] extends [Left[0]] ? Left[0] : IsOneType<T, SliceType<Left>>

type GetOneType<
  T extends MoleculeFixedBasicType | MoleculeDynBasicType,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Left extends any[] = [...MoleculeFixedBasicTypeArr, ...MoleculeDynBasicTypeArr],
> = IsOneType<T, Left> extends never ? never : T

type GetFixedOffChainType<T extends MoleculeFixedBasicType> = T extends 'Uint8' | 'Uint16' | 'Uint32' ? number : BI
type GetBasicOffChainType<T extends MoleculeFixedBasicType | MoleculeDynBasicType> = IsOneType<T> extends never
  ? never
  : T extends MoleculeFixedBasicType
  ? GetFixedOffChainType<T>
  : T extends MoleculeDynBasicType
  ? string
  : never
/**
 * types template parameter
 */

type ArrayParamType = MoleculeFixedBasicType | StructParam | ArrayParam
type ArrayParam = { _type: 'array'; _params: [ArrayParamType, number] }
type ArrayResult = MoleculeFixedBasicType[] | StructResult[] | ArrayResult[]

type StructValueType = MoleculeFixedBasicType | ArrayParam | StructParam
type StructParam = { _type: 'struct'; _params: Record<string, StructValueType> }
type StructResult = { molecule: 'struct'; type: Record<string, MoleculeFixedBasicType | StructResult | ArrayResult> }

type VecParamType = MoleculeFixedBasicType | MoleculeDynBasicType | StructParam | ArrayParam | TableParam
type VecParam = { _type: 'vec'; _params: VecParamType }
type VecResult = {
  molecule: 'vec'
  type: MoleculeFixedBasicType | MoleculeDynBasicType | ArrayResult | StructResult | VecResult | TableResult
}

type TableValueType = MoleculeFixedBasicType | ArrayParam | StructParam | VecParam | TableParam
type TableParam = { _type: 'table'; _params: Record<string, TableValueType> }
type TableResult = { molecule: 'table'; type: Record<string, ArrayResult | StructResult | VecResult | TableResult> }

/**
 * Array type define
 */

type GetArrayType<T extends ArrayParam> = IsConstNumber<T['_params'][1]> extends never
  ? never
  : T['_params'][0] extends ArrayParam
  ? Tuple<GetArrayType<T['_params'][0]>, T['_params'][1]>
  : T['_params'][0] extends StructParam
  ? Tuple<GetStructType<T['_params'][0]>, T['_params'][1]>
  : T['_params'][0] extends MoleculeFixedBasicType
  ? IsOneType<T['_params'][0]> extends never
    ? never
    : Tuple<T['_params'][0], T['_params'][1]>
  : never

type GetArrayOffChainType<T extends ArrayResult> = Tuple<
  T[number] extends MoleculeFixedBasicType
    ? GetBasicOffChainType<T[number]>
    : T[number] extends ArrayResult
    ? GetArrayOffChainType<T[number]>
    : T[number] extends StructResult
    ? GetStructOffChainType<T[number]>
    : never,
  T['length']
>

/**
 * Struct type define
 */

type GetStructType<T extends StructParam> = {
  molecule: 'struct'
  type: {
    [P in keyof T['_params']]: T['_params'][P] extends MoleculeFixedBasicType
      ? T['_params'][P]
      : T['_params'][P] extends ArrayParam
      ? GetArrayType<T['_params'][P]>
      : T['_params'][P] extends StructParam
      ? GetStructType<T['_params'][P]>
      : never
  }
}

type GetStructOffChainType<T extends StructResult> = {
  [P in keyof T['type']]: T['type'][P] extends MoleculeFixedBasicType
    ? GetBasicOffChainType<T['type'][P]>
    : T['type'][P] extends StructResult
    ? GetStructOffChainType<T['type'][P]>
    : T['type'][P] extends ArrayResult
    ? GetArrayOffChainType<T['type'][P]>
    : never
}

/**
 * vec type define
 */

type GetVectorType<T extends VecParam> = {
  molecule: 'vec'
  type: T['_params'] extends MoleculeFixedBasicType | MoleculeDynBasicType
    ? T
    : T['_params'] extends StructParam
    ? GetStructType<T['_params']>
    : T['_params'] extends ArrayParam
    ? GetArrayType<T['_params']>
    : T['_params'] extends TableParam
    ? GetTableType<T['_params']>
    : never
}

type GetVecOffChainType<T extends VecResult> = T['type'] extends MoleculeFixedBasicType | MoleculeDynBasicType
  ? GetBasicOffChainType<T['type']>
  : T['type'] extends ArrayResult
  ? GetArrayOffChainType<T['type']>
  : T['type'] extends StructResult
  ? GetStructOffChainType<T['type']>
  : T['type'] extends VecResult
  ? GetVecOffChainType<T['type']>
  : T['type'] extends TableResult
  ? GetTableOffChainType<T['type']>
  : never
/**
 * table type define
 */

type GetTableType<T extends TableParam> = {
  molecule: 'table'
  type: {
    [P in keyof T['_params']]: T['_params'][P] extends MoleculeFixedBasicType | MoleculeDynBasicType
      ? T['_params'][P]
      : T['_params'][P] extends ArrayParam
      ? GetArrayType<T['_params'][P]>
      : T['_params'][P] extends StructParam
      ? GetStructType<T['_params'][P]>
      : T['_params'][P] extends VecParam
      ? GetVectorType<T['_params'][P]>
      : T['_params'][P] extends TableParam
      ? GetTableType<T['_params'][P]>
      : never
  }
}

type GetTableOffChainType<T extends TableResult> = {
  [P in keyof T['type']]: T['type'][P] extends MoleculeFixedBasicType
    ? MoleculeFixedBasicType
    : T['type'][P] extends StructResult
    ? GetStructOffChainType<T['type'][P]>
    : T['type'][P] extends ArrayResult
    ? GetArrayOffChainType<T['type'][P]>
    : T['type'][P] extends TableResult
    ? GetTableOffChainType<T['type'][P]>
    : never
}

type AllMoleculeParams =
  | MoleculeFixedBasicType
  | MoleculeDynBasicType
  | ArrayParam
  | StructParam
  | VecParam
  | TableParam
  | never
export type MoleculeStorageType<T extends AllMoleculeParams = never> = T extends
  | MoleculeFixedBasicType
  | MoleculeDynBasicType
  ? GetOneType<T>
  : T extends ArrayParam
  ? GetArrayType<T>
  : T extends StructParam
  ? GetStructType<T>
  : T extends VecParam
  ? GetVectorType<T>
  : T extends TableParam
  ? GetTableType<T>
  : never
type AllMoleculeResult =
  | MoleculeFixedBasicType
  | MoleculeDynBasicType
  | ArrayResult
  | StructResult
  | VecResult
  | TableResult
  | never
type MoleculeStorageOffChain<T extends AllMoleculeResult> = T extends MoleculeFixedBasicType | MoleculeDynBasicType
  ? GetBasicOffChainType<T>
  : T extends ArrayResult
  ? GetArrayOffChainType<T>
  : T extends StructResult
  ? GetStructOffChainType<T>
  : T extends VecResult
  ? GetVecOffChainType<T>
  : T extends TableResult
  ? GetTableOffChainType<T>
  : never

type GetMoleculeStorageType<T extends StorageTemplate<AllMoleculeParams>> = T extends {
  data: AllMoleculeParams
  witness: AllMoleculeParams
}
  ? { data: MoleculeStorageType<T['data']>; witness: MoleculeStorageType<T['witness']> }
  : T extends { data: AllMoleculeParams }
  ? { data: MoleculeStorageType<T['data']> }
  : T extends { witness: AllMoleculeParams }
  ? { witness: MoleculeStorageType<T['witness']> }
  : never
type GetMoleculeStorageOffChain<T extends StorageTemplate<AllMoleculeResult>> = T extends {
  data: AllMoleculeResult
  witness: AllMoleculeResult
}
  ? { data: MoleculeStorageOffChain<T['data']>; witness: MoleculeStorageOffChain<T['witness']> }
  : T extends { data: AllMoleculeResult }
  ? { data: MoleculeStorageOffChain<T['data']> }
  : T extends { witness: AllMoleculeResult }
  ? { witness: MoleculeStorageOffChain<T['witness']> }
  : never

export const UTF8String = molecule.byteVecOf<string>({
  pack: (str) => Uint8Array.from(Buffer.from(str, 'utf8')),
  unpack: (buf) => Buffer.from(bytes.bytify(buf)).toString('utf8'),
})

export class MoleculeStorage<T extends StorageTemplate<AllMoleculeParams>> extends ChainStorage<
  GetMoleculeStorageOffChain<GetMoleculeStorageType<T>>
> {
  dataCodec?: BytesCodec
  witnessCodec?: BytesCodec

  constructor(moleculeType: GetMoleculeStorageType<T>) {
    super()
    if ('data' in moleculeType) {
      this.dataCodec = this.getCodec(moleculeType.data)
    }
    if ('witness' in moleculeType) {
      this.witnessCodec = this.getCodec(moleculeType.witness)
    }
  }

  private getFixedCodec(moleculeType: MoleculeFixedBasicType | ArrayResult | StructResult): FixedBytesCodec {
    if (typeof moleculeType === 'string') {
      switch (moleculeType) {
        case 'Uint8':
          return number.Uint8
        case 'Uint16':
          return number.Uint16
        case 'Uint32':
          return number.Uint32
        case 'Uint64':
          return number.Uint64
        case 'Uint128':
          return number.Uint128
        case 'Uint256':
          return number.Uint256
        case 'Uint512':
          return number.Uint512
        default:
          throw new Error('no molecule for type')
      }
    }
    if (Array.isArray(moleculeType)) {
      return molecule.array(this.getFixedCodec(moleculeType[0]), moleculeType.length)
    }
    const keys = Object.keys(moleculeType.type)
    const structParams: Record<string, FixedBytesCodec> = {}
    for (let i = 0; i < keys.length; i++) {
      structParams[keys[i]] = this.getFixedCodec(moleculeType.type[keys[i]])
    }
    return molecule.struct(structParams, keys)
  }

  private getCodec(moleculeType: AllMoleculeResult): BytesCodec {
    if (typeof moleculeType === 'string') {
      if (moleculeType === 'string') return UTF8String
      return this.getFixedCodec(moleculeType)
    }
    if (Array.isArray(moleculeType) || moleculeType.molecule === 'struct') {
      return this.getFixedCodec(moleculeType)
    }
    if (moleculeType.molecule === 'vec') {
      return molecule.vector(this.getCodec(moleculeType.type))
    }
    const keys = Object.keys(moleculeType.type)
    const structParams: Record<string, BytesCodec> = {}
    for (let i = 0; i < keys.length; i++) {
      structParams[keys[i]] = this.getCodec(moleculeType.type[keys[i]])
    }
    return molecule.table(structParams, keys)
  }

  serialize(
    data: StorageType<GetMoleculeStorageOffChain<GetMoleculeStorageType<T>>>['offChain'],
  ): StorageType<GetMoleculeStorageOffChain<GetMoleculeStorageType<T>>>['onChain'] {
    if ('data' in data && 'witness' in data) {
      if (!this.dataCodec || !this.witnessCodec) throw new Error('no codec in instance')
      return {
        data: this.dataCodec.pack(data.data),
        witness: this.witnessCodec.pack(data.witness),
      }
    }
    if ('data' in data) {
      if (!this.dataCodec) throw new Error('no codec in instance')
      return {
        data: this.dataCodec.pack(data.data),
      }
    }
    if ('witness' in data) {
      if (!this.witnessCodec) throw new Error('no codec in instance')
      return {
        witness: this.witnessCodec.pack(data.witness),
      }
    }
    throw new NoExpectedDataException()
  }
  deserialize(
    data: StorageType<GetMoleculeStorageOffChain<GetMoleculeStorageType<T>>>['onChain'],
  ): StorageType<GetMoleculeStorageOffChain<GetMoleculeStorageType<T>>>['offChain'] {
    if ('data' in data && 'witness' in data) {
      if (!this.dataCodec || !this.witnessCodec) throw new Error('no codec in instance')
      return {
        data: this.dataCodec.unpack(data?.data),
        witness: this.witnessCodec.unpack(data?.witness),
      } as StorageType<GetMoleculeStorageOffChain<GetMoleculeStorageType<T>>>['offChain']
    }
    if ('data' in data) {
      if (!this.dataCodec) throw new Error('no codec in instance')
      return {
        data: this.dataCodec.unpack(data?.data),
      } as StorageType<GetMoleculeStorageOffChain<GetMoleculeStorageType<T>>>['offChain']
    }
    if ('witness' in data) {
      if (!this.witnessCodec) throw new Error('no codec in instance')
      return {
        witness: this.witnessCodec.unpack(data?.witness),
      } as StorageType<GetMoleculeStorageOffChain<GetMoleculeStorageType<T>>>['offChain']
    }
    throw new NoExpectedDataException()
  }
}
