export type Uint16Type = 'Uint16'
export const Uint16: Uint16Type = 'Uint16'

export type OrgType = {
  type: 'table'
  value: {
    name: 'Uint16'
    url: 'Uint16'
  }
}
export const Org: OrgType = {
  type: 'table',
  value: {
    name: 'Uint16',
    url: 'Uint16',
  },
}

export type AttrsType = {
  type: 'table'
  value: {
    name: 'Uint8'
    org: {
      type: 'table'
      value: {
        name: 'Uint16'
        url: 'Uint16'
      }
    }
  }
}
export const Attrs: AttrsType = {
  type: 'table',
  value: {
    name: 'Uint8',
    org: {
      type: 'table',
      value: {
        name: 'Uint16',
        url: 'Uint16',
      },
    },
  },
}
