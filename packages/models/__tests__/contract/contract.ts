import { describe, it, expect, jest } from '@jest/globals'
import { ProviderKey, PROTOCOL, Status, ActorURI, MessagePayload } from '../../src'
import type { ContractMethod } from '../../src/contract'
import { ParamsMissException } from '../../src/exceptions'

const ref = {
  name: '',
  protocol: '',
  path: '',
  uri: 'contract',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requestMock = jest.fn<() => Promise<{ body: { json: () => any } }>>()
jest.mock('undici', () => ({
  request: () => requestMock(),
}))
const callMock = jest.fn()
jest.mock('../../src/actor/actor', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalModule = jest.requireActual('../../src/actor/actor') as any
  class Actor {
    call(to: ActorURI, payload: MessagePayload, timeout?: number) {
      return callMock(to, payload, timeout)
    }
  }
  return {
    __esModule: true,
    ...originalModule,
    Actor,
  }
})
import { Contract } from '../../src/contract/contract'
Reflect.defineMetadata(ProviderKey.Actor, { ref }, Contract)

describe('test contract', () => {
  describe('test run', () => {
    const contract = new Contract()
    it('call remote params miss', async () => {
      await expect(contract.run(`114.0.1.1:8008/get_a`, null)).rejects.toThrow(new ParamsMissException())
    })
    it('call remote params miss', async () => {
      await expect(contract.run(`114.0.1.1:8008/get_a`, { symbol: Symbol('get_a') })).rejects.toThrow(
        new ParamsMissException(),
      )
    })
    it('call remote ok', async () => {
      requestMock.mockResolvedValueOnce({
        body: {
          json() {
            return 10
          },
        },
      })
      const getA = Symbol('get_a')
      const res = await contract.run(`114.0.1.1:8008/get_a`, { symbol: getA }, 'get_a')
      expect(res.status).toBe(Status.ok)
      expect(res.message?.symbol).toBe(getA)
      expect(res.message?.value).toBe(10)
    })
    it('call remote exception', async () => {
      requestMock.mockRejectedValueOnce({
        body: {
          json() {
            return 10
          },
        },
      })
      const getA = Symbol('get_a')
      const res = await contract.run(`114.0.1.1:8008/get_a`, { symbol: getA }, 'get_a')
      expect(res.status).toBe(Status.error)
      expect(res.message).toBeNull()
    })
    it('call local', async () => {
      await contract.run(`${PROTOCOL.LOCAL}/get`, null)
      expect(callMock).toBeCalledWith(`${PROTOCOL.LOCAL}/get`, null, undefined)
    })
  })

  describe('test link', () => {
    it('link and call remote', async () => {
      const contract = new Contract()
      const res = contract.link<{ a: ContractMethod<number, number> }>(['a'])
      requestMock.mockResolvedValueOnce({
        body: {
          json() {
            return 20
          },
        },
      })
      const getA = Symbol('get_a')
      const result = await res.a('114.0.0.1://', { symbol: getA, value: 10 })
      expect(result.status).toBe(Status.ok)
      expect(result.message?.symbol).toBe(getA)
      expect(result.message?.value).toBe(20)
    })
    it('link and call local', async () => {
      const contract = new Contract()
      const res = contract.link<{ a: ContractMethod<number, number> }>(['a'])
      requestMock.mockResolvedValueOnce({
        body: {
          json() {
            return 20
          },
        },
      })
      const getA = Symbol('get_a')
      await res.a(`${PROTOCOL.LOCAL}://`, { symbol: getA, value: 10 })
      expect(callMock).toBeCalledWith(`${PROTOCOL.LOCAL}://`, { symbol: getA, value: 10 }, undefined)
    })
  })
})
