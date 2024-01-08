export class ExplorerService {
  constructor(
    private host = 'https://testnet-api.explorer.nervos.org',
    private _email: string,
  ) {}

  updateSUDT = async (params: {
    typeHash: string
    symbol: string
    decimal: string
    totalAmount: string
    description: string
    operatorWebsite: string
    token?: string
  }) => {
    const body = JSON.stringify({
      type_hash: params.typeHash,
      symbol: params.symbol,
      decimal: params.decimal,
      total_amount: params.totalAmount,
      description: params.description,
      operator_website: params.operatorWebsite,
      email: this._email,
      uan: `${params.symbol}.ckb`,
    })
    const res = await fetch(`${this.host}/api/v1/udts/${params.typeHash}`, {
      method: 'PUT',
      body,
      headers: {
        Accept: 'application/vnd.api+json',
        'Content-Type': 'application/vnd.api+json',
      },
    })
    console.log(res, body)
    if (!res.ok) {
      throw new Error('Internal Service Error')
    }

    switch (Math.ceil(res.status / 100)) {
      case 2:
        return true
      case 3:
        throw new Error('Redirect')
      case 4:
        throw new Error('Client Error')
    }
  }
}
