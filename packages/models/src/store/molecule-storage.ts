import { molecule, number } from '@ckb-lumos/codec'
import { BI } from '@ckb-lumos/bi'
import { ChainStorage } from './chain-storage'
import { BytesCodec, FixedBytesCodec } from '@ckb-lumos/codec/lib/base'
import { OneOfRecord, UTF8String, wrapUnion } from './customer-molecule'
import { NoCodecForMolecueException, UnexpectedMoleculeTypeException } from '../exceptions'

/**
 * Comm types define
 */
type Tuple<T, N extends number, R extends T[] = []> = R['length'] extends N ? R : Tuple<T, N, [T, ...R]>
/** slice tuple types */
type SliceType<T extends unknown[]> = T extends [infer _, ...infer Left] ? Left : never
type ExpandToRecord<T extends number | string> = T extends T ? Record<T, T> : never
/** If the type is union type, return never, or return it */
type ExcludeUnionType<T extends number | string> = ExpandToRecord<T> extends Record<T, T> ? T : never
/** Valid is a const number */
type IsConstNumber<N extends number> = [1] extends [N] ? ([N] extends [1] ? N : never) : ExcludeUnionType<N>
type DeepLength = [never, 0, 1, 2, 3, 4, 5, 6]
type GetPreDeep<Deep extends DeepLength[number]> = DeepLength[Deep]

/**
 * Basic types define
 */
type FixedBasicTypeArr = ['Uint8', 'Uint16', 'Uint32', 'Uint64', 'Uint128', 'Uint256', 'Uint512']
type FixedBasic = FixedBasicTypeArr[number]

type DynBasicTypeArr = ['string']
type DynamicBasic = DynBasicTypeArr[number]

type IsOneType<
  T extends FixedBasic | DynamicBasic,
  Left extends unknown[] = [...FixedBasicTypeArr, ...DynBasicTypeArr],
> = Left['length'] extends 0 ? never : [T] extends [Left[0]] ? Left[0] : IsOneType<T, SliceType<Left>>

type GetOneType<
  T extends FixedBasic | DynamicBasic,
  Left extends unknown[] = [...FixedBasicTypeArr, ...DynBasicTypeArr],
> = IsOneType<T, Left> extends never ? never : T

type GetFixedBasicOffChain<T extends FixedBasic> = T extends 'Uint8' | 'Uint16' | 'Uint32' ? number : BI
type GetBasicOffChain<T extends FixedBasic | DynamicBasic> = IsOneType<T> extends never
  ? never
  : T extends FixedBasic
  ? GetFixedBasicOffChain<T>
  : T extends DynamicBasic
  ? string
  : never
/**
 * types template parameter
 */

const moleculeTypes = {
  array: 'array',
  struct: 'struct',
  vec: 'vec',
  table: 'table',
  option: 'option',
  union: 'union',
} as const
type GetMoleculeType<T extends keyof typeof moleculeTypes> = typeof moleculeTypes[T]

type FixedParam = FixedBasic | ArrayParam | StructParam
type FixedCodecConfig = FixedBasic | StructCodecConfig | ArrayCodecConfig

type ArrayParam = { type: GetMoleculeType<'array'>; value: [FixedParam, number] }
type ArrayCodecConfig = { type: GetMoleculeType<'array'>; value: FixedCodecConfig[] }

type StructParam = { type: GetMoleculeType<'struct'>; value: Record<string, FixedParam> }
type StructCodecConfig = { type: GetMoleculeType<'struct'>; value: Record<string, FixedCodecConfig> }

type VecParam = { type: GetMoleculeType<'vec'>; value: DynamicParam }
type VecCodecConfig = { type: GetMoleculeType<'vec'>; value: CodecConfig }

type TableParam = { type: GetMoleculeType<'table'>; value: Record<string, DynamicParam> }
type TableCodecConfig = { type: GetMoleculeType<'table'>; value: Record<string, CodecConfig> }

type OptionParam = { type: GetMoleculeType<'option'>; value: DynamicParam }
type OptionCodecConfig = { type: GetMoleculeType<'option'>; value: CodecConfig }

type UnionParam = { type: GetMoleculeType<'union'>; value: Record<string, DynamicParam> }
type UnionCodecConfig = { type: GetMoleculeType<'union'>; value: Record<string, CodecConfig> }

export type DynamicParam = FixedParam | DynamicBasic | VecParam | OptionParam | UnionParam | TableParam
export type CodecConfig =
  | FixedCodecConfig
  | DynamicBasic
  | VecCodecConfig
  | TableCodecConfig
  | OptionCodecConfig
  | UnionCodecConfig

type GetFixedCodecConfig<T extends FixedParam, Deep extends DeepLength[number] = 6> = Deep extends never
  ? never
  : T extends FixedBasic
  ? GetOneType<T>
  : T extends ArrayParam
  ? {
      type: GetMoleculeType<'array'>
      value: IsConstNumber<T['value'][1]> extends never
        ? never
        : GetFixedCodecConfig<T['value'][0], GetPreDeep<Deep>> extends never
        ? never
        : Tuple<GetFixedCodecConfig<T['value'][0], GetPreDeep<Deep>>, T['value'][1]>
    }
  : T extends StructParam
  ? {
      type: GetMoleculeType<'struct'>
      value: { [P in keyof T['value']]: GetFixedCodecConfig<T['value'][P], GetPreDeep<Deep>> }
    }
  : never

export type GetCodecConfig<T extends DynamicParam, Deep extends DeepLength[number] = 6> = Deep extends never
  ? never
  : T extends FixedBasic | DynamicBasic
  ? GetOneType<T>
  : T extends FixedParam
  ? GetFixedCodecConfig<T, GetPreDeep<Deep>>
  : T extends VecParam
  ? { type: GetMoleculeType<'vec'>; value: GetCodecConfig<T['value'], GetPreDeep<Deep>> }
  : T extends TableParam
  ? {
      type: GetMoleculeType<'table'>
      value: { [P in keyof T['value']]: GetCodecConfig<T['value'][P], GetPreDeep<Deep>> }
    }
  : T extends OptionParam
  ? { type: GetMoleculeType<'option'>; value: GetCodecConfig<T['value'], GetPreDeep<Deep>> }
  : T extends UnionParam
  ? {
      type: GetMoleculeType<'union'>
      value: { [P in keyof T['value']]: GetCodecConfig<T['value'][P], GetPreDeep<Deep>> }
    }
  : never

type GetFixedOffChain<T extends FixedParam, Deep extends DeepLength[number] = 6> = Deep extends never
  ? never
  : T extends FixedBasic
  ? GetBasicOffChain<T>
  : T extends StructParam
  ? { [P in keyof T['value']]: GetFixedOffChain<T['value'][P], GetPreDeep<Deep>> }
  : T extends ArrayParam
  ? Tuple<GetFixedOffChain<T['value'][0], GetPreDeep<Deep>>, T['value'][1]>
  : never

export type GetMoleculeOffChain<T extends DynamicParam, Deep extends DeepLength[number] = 6> = Deep extends never
  ? never
  : T extends FixedBasic | DynamicBasic
  ? GetBasicOffChain<T>
  : T extends FixedParam
  ? GetFixedOffChain<T, GetPreDeep<Deep>>
  : T extends VecParam
  ? GetMoleculeOffChain<T['value'], GetPreDeep<Deep>>[]
  : T extends TableParam
  ? { [P in keyof T['value']]: GetMoleculeOffChain<T['value'][P], GetPreDeep<Deep>> }
  : T extends OptionParam
  ? GetMoleculeOffChain<T['value'], GetPreDeep<Deep>>
  : T extends UnionParam
  ? OneOfRecord<{ [P in keyof T['value']]: GetMoleculeOffChain<T['value'][P], GetPreDeep<Deep>> }>
  : never

export class MoleculeStorage<T extends DynamicParam> extends ChainStorage<GetMoleculeOffChain<T>> {
  codec?: BytesCodec

  constructor(moleculeType: GetCodecConfig<T>) {
    super()
    this.codec = this.getCodec(moleculeType)
  }

  private getFixedCodec(codecConfig: FixedCodecConfig): FixedBytesCodec {
    if (typeof codecConfig === 'string') {
      switch (codecConfig) {
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
          throw new UnexpectedMoleculeTypeException(codecConfig)
      }
    }
    if (codecConfig.type === moleculeTypes.array) {
      return molecule.array(this.getFixedCodec(codecConfig.value[0]), codecConfig.value.length)
    }
    const keys = Object.keys(codecConfig.value)
    const structParams: Record<string, FixedBytesCodec> = {}
    for (let i = 0; i < keys.length; i++) {
      structParams[keys[i]] = this.getFixedCodec(codecConfig.value[keys[i]])
    }
    return molecule.struct(structParams, keys)
  }

  private getCodec(codecConfig: CodecConfig): BytesCodec {
    if (typeof codecConfig === 'string') {
      if (codecConfig === 'string') return UTF8String
      return this.getFixedCodec(codecConfig)
    }
    const codecParams: Record<string, BytesCodec> = {}
    let keys: string[] = []
    switch (codecConfig.type) {
      case moleculeTypes.array:
      case moleculeTypes.struct:
        return this.getFixedCodec(codecConfig)
      case moleculeTypes.vec:
        return molecule.vector(this.getCodec(codecConfig.value))
      case moleculeTypes.option:
        return molecule.option(this.getCodec(codecConfig.value))
      case moleculeTypes.table:
        keys = Object.keys(codecConfig.value)
        for (let i = 0; i < keys.length; i++) {
          codecParams[keys[i]] = this.getCodec(codecConfig.value[keys[i]])
        }
        return molecule.table(codecParams, keys)
      case moleculeTypes.union:
        keys = Object.keys(codecConfig.value)
        for (let i = 0; i < keys.length; i++) {
          codecParams[keys[i]] = this.getCodec(codecConfig.value[keys[i]])
        }
        return wrapUnion(codecParams, keys)
      default:
        throw new UnexpectedMoleculeTypeException('unknown')
    }
  }

  serialize(data: GetMoleculeOffChain<T>): Uint8Array {
    if (!this.codec) throw new NoCodecForMolecueException()
    return this.codec.pack(data)
  }

  deserialize(data: Uint8Array): GetMoleculeOffChain<T> {
    if (!this.codec) throw new NoCodecForMolecueException()
    return this.codec.unpack(data)
  }
}
