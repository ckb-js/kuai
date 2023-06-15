import { describe, it, expect, jest, beforeEach } from '@jest/globals'
import { BI } from '@ckb-lumos/bi'
import { deepForIn } from '../../src'

describe('test deep for in', () => {
  const callBack = jest.fn<(v: unknown, path: string[]) => boolean>()
  beforeEach(() => {
    callBack.mockReset()
  })
  it('call with null or undefined', () => {
    deepForIn(undefined, callBack)
    expect(callBack).toBeCalledWith(undefined, [])
    deepForIn(null, callBack)
    expect(callBack).toBeCalledWith(null, [])
    expect(callBack).toBeCalledTimes(2)
  })
  it('call with simple type', () => {
    callBack.mockImplementation((_v) => true)
    deepForIn(10, callBack)
    expect(callBack).toBeCalledWith(10, [])
    deepForIn('string', callBack)
    expect(callBack).toBeCalledWith('string', [])
    deepForIn(true, callBack)
    expect(callBack).toBeCalledWith(true, [])
    expect(callBack).toBeCalledTimes(3)
  })
  it('call break when callback Return false with BI', () => {
    callBack.mockReturnValue(false)
    deepForIn(BI.from(10), callBack)
    expect(callBack).toBeCalledWith(BI.from(10), [])
    expect(callBack).toBeCalledTimes(1)
  })
  it('call with object', () => {
    callBack.mockImplementation((_v) => true)
    deepForIn({ b: 'b1' }, callBack)
    expect(callBack).toBeCalledWith({ b: 'b1' }, [])
    expect(callBack).toBeCalledWith('b1', ['b'])
    expect(callBack).toBeCalledTimes(2)
  })
})
