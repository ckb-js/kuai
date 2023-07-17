export type SkillType = 'Uint16'
export const Skill: SkillType = 'Uint16'

export type SkillsType = {
  type: 'vec'
  value: 'Uint16'
}
export const Skills: SkillsType = {
  type: 'vec',
  value: 'Uint16',
}

export type AttrsType = {
  type: 'table'
  value: {
    name: 'Uint8'
    role: 'Uint8'
  }
}
export const Attrs: AttrsType = {
  type: 'table',
  value: {
    name: 'Uint8',
    role: 'Uint8',
  },
}

export type UsersType = {
  type: 'vec'
  value: {
    type: 'table'
    value: {
      name: 'Uint8'
      role: 'Uint8'
    }
  }
}
export const Users: UsersType = {
  type: 'vec',
  value: {
    type: 'table',
    value: {
      name: 'Uint8',
      role: 'Uint8',
    },
  },
}
