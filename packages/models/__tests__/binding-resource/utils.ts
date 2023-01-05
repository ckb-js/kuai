import { describe, expect, it } from '@jest/globals'
import { outpointToOutPointString } from '../../src/resource-binding'

describe('Test utils', () => {
  describe('Test outpointToOutPointString', () => {
    it('should convert outpoint object to outpoint string', () => {
      const outpoint = {
        txHash: '0x12',
        index: '0x11',
      }
      expect(outpointToOutPointString(outpoint)).toEqual('0x1211')
    })
  })
})
