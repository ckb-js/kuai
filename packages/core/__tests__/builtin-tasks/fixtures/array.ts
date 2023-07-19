export type Uint8Type = 'Uint8'
export const Uint8: Uint8Type = 'Uint8'

export type TestType = {
  type: 'array'
  value: ['Uint8', 2]
}
export const Test: TestType = {
  type: 'array',
  value: ['Uint8', 2],
}

export type TestArrayType = {
  type: 'array'
  value: [
    {
      type: 'array'
      value: ['Uint8', 2]
    },
    2,
  ]
}
export const TestArray: TestArrayType = {
  type: 'array',
  value: [
    {
      type: 'array',
      value: ['Uint8', 2],
    },
    2,
  ],
}
