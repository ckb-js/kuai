import { describe, it, expect, jest } from '@jest/globals'
import { ProviderKey, PROTOCOL, Status, ActorURI, MessagePayload } from '../../src'
import type { ContractMethod } from '../../src/contract'
import { REMOTE_CALL_PATTERN } from '../../src/contract'
import { ParamsMissException } from '../../src/exceptions'

const ref = {
  name: '',
  protocol: '',
  path: '',
  uri: 'contract',
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const requestMock = jest.fn<() => Promise<{ json: () => any } & Omit<Response, 'json'>>>()
jest.spyOn(global, 'fetch').mockImplementation(requestMock)
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
    const contract = new Contract(undefined)
    it('call remote params miss', async () => {
      await expect(contract.run(`114.0.1.1:8008/get_a`, null)).rejects.toThrow(new ParamsMissException())
    })
    it('call remote params miss', async () => {
      await expect(contract.run(`114.0.1.1:8008/get_a`, { pattern: 'get_a' })).rejects.toThrow(
        new ParamsMissException(),
      )
      fetch
    })
    it('call remote ok', async () => {
      requestMock.mockResolvedValueOnce({
        json: () => {
          return 10
        },
        headers: new Headers(),
        ok: false,
        redirected: false,
        status: 0,
        statusText: '',
        type: 'basic',
        url: '',
        clone: function (): Response {
          throw new Error('Function not implemented.')
        },
        body: null,
        bodyUsed: false,
        arrayBuffer: function (): Promise<ArrayBuffer> {
          throw new Error('Function not implemented.')
        },
        blob: function (): Promise<Blob> {
          throw new Error('Function not implemented.')
        },
        formData: function (): Promise<FormData> {
          throw new Error('Function not implemented.')
        },
        text: function (): Promise<string> {
          throw new Error('Function not implemented.')
        },
      })
      const getA = 'get_a'
      const res = await contract.run(`114.0.1.1:8008/get_a`, {
        pattern: getA,
        value: { params: 10, method: 'remote_method' },
      })
      expect(res.status).toBe(Status.ok)
      expect(res.message?.pattern).toBe(getA)
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
      const getA = 'get_a'
      const res = await contract.run(`114.0.1.1:8008/get_a`, { pattern: getA, value: { method: 'remote_method' } })
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
      const contract = new Contract(undefined)
      const res = contract.link<{ a: ContractMethod<number, number> }>(['a'])
      requestMock.mockResolvedValueOnce({
        json: () => {
          return 20
        },
        headers: new Headers(),
        ok: false,
        redirected: false,
        status: 0,
        statusText: '',
        type: 'basic',
        url: '',
        clone: function (): Response {
          throw new Error('Function not implemented.')
        },
        body: null,
        bodyUsed: false,
        arrayBuffer: function (): Promise<ArrayBuffer> {
          throw new Error('Function not implemented.')
        },
        blob: function (): Promise<Blob> {
          throw new Error('Function not implemented.')
        },
        formData: function (): Promise<FormData> {
          throw new Error('Function not implemented.')
        },
        text: function (): Promise<string> {
          throw new Error('Function not implemented.')
        },
      })
      const result = await res.a('114.0.0.1://', 10)
      expect(result.status).toBe(Status.ok)
      expect(result.message?.pattern).toBe(REMOTE_CALL_PATTERN)
      expect(result.message?.value).toBe(20)
    })
    it('link and call local', async () => {
      const contract = new Contract(undefined)
      const res = contract.link<{ a: ContractMethod<number, number> }>(['a'])
      requestMock.mockResolvedValueOnce({
        json: () => {
          return 20
        },
        headers: new Headers(),
        ok: false,
        redirected: false,
        status: 0,
        statusText: '',
        type: 'basic',
        url: '',
        clone: function (): Response {
          throw new Error('Function not implemented.')
        },
        body: null,
        bodyUsed: false,
        arrayBuffer: function (): Promise<ArrayBuffer> {
          throw new Error('Function not implemented.')
        },
        blob: function (): Promise<Blob> {
          throw new Error('Function not implemented.')
        },
        formData: function (): Promise<FormData> {
          throw new Error('Function not implemented.')
        },
        text: function (): Promise<string> {
          throw new Error('Function not implemented.')
        },
      })
      const getA = 'get_a'
      await res.a(`${PROTOCOL.LOCAL}://`, 10, getA)
      expect(callMock).toBeCalledWith(
        `${PROTOCOL.LOCAL}://`,
        { pattern: getA, value: { params: 10, method: 'a' } },
        undefined,
      )
    })
  })
})
