export class ExplorerService {
  constructor(private host = '') {}

  updateSUDT = async (params: {
    typeHash: string
    symbol: string
    fullName: string
    decimal: string
    totalAmount: string
    description: string
    operatorWebsite: string
    iconFile: string
    uan: string
    displayName: string
    email: string
    token?: string
  }) => {
    const res = await fetch(`${this.host}/api/v1/udts/${params.typeHash}`, { method: 'POST', body: JSON.stringify({}) })
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
