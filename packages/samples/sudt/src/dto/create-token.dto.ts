export interface CreateTokenRequest {
  name: string
  account: string
  decimal: number
  description: string
  website: string
  icon: string
  amount: string
  email: string
  explorerCode?: string
}

export interface CreateTokenResponse {
  url: string
}
