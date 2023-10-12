export interface CreateTokenRequest {
  name: string
  symbol: string
  supply: string
  account: string
  decimal: number
  description: string
  website: string
  icon: string
  typeId: string
  explorerCode: string
  args: string
}

export interface CreateTokenResponse {
  url: string
}
