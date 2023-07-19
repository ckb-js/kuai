export type Uint16Type = 'Uint16'
export const Uint16: Uint16Type = 'Uint16'

export type Uint16ArrayType = {
  type: 'array'
  value: ['Uint16', 2]
}
export const Uint16Array: Uint16ArrayType = {
  type: 'array',
  value: ['Uint16', 2],
}

export type AttributesType = {
  type: 'struct'
  value: {
    dexterity: 'Uint8'
    speed: 'Uint16'
    test: {
      type: 'array'
      value: ['Uint16', 2]
    }
  }
}
export const Attributes: AttributesType = {
  type: 'struct',
  value: {
    dexterity: 'Uint8',
    speed: 'Uint16',
    test: {
      type: 'array',
      value: ['Uint16', 2],
    },
  },
}
