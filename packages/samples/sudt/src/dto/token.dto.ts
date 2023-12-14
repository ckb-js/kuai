import { Token } from '../entities/token.entity'

export interface TokenResponse {
  symbol: string
  typeId: string
  name: string
  amount: string
  decimal: number
  description: string
  website: string
  icon: string
  explorerUrl: string
}

export const tokenEntityToDto = (token: Token, amount: string, explorerHost: string): TokenResponse => {
  return {
    symbol: token.name,
    name: token.name,
    amount,
    decimal: token.decimal,
    description: token.description ?? '',
    website: token.website,
    icon: token.icon,
    typeId: token.typeId,
    explorerUrl: `${explorerHost}/sudt/${token.typeId}`,
  }
}
