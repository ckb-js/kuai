export type ArmorLightType = 'Uint16'
export const ArmorLight: ArmorLightType = 'Uint16'

export type ArmorHeavyType = 'Uint32'
export const ArmorHeavy: ArmorHeavyType = 'Uint32'

export type ArmorShieldsType = 'Uint64'
export const ArmorShields: ArmorShieldsType = 'Uint64'

export type SkillType = {
  type: 'union'
  value: {
    '0': 'Uint16'
    '1': 'Uint32'
    '2': 'Uint64'
  }
}
export const Skill: SkillType = {
  type: 'union',
  value: {
    '0': 'Uint16',
    '1': 'Uint32',
    '2': 'Uint64',
  },
}
