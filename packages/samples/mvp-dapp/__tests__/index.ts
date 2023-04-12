import { describe, expect, test } from '@jest/globals'
import { CoR } from '@ckb-js/kuai-io'
import { router } from '../src/app.controller'

describe('controller test', () => {
  test('/load', async () => {
    const cor = new CoR()
    cor.use(router.middleware())

    await expect(cor.dispatch({ method: 'GET', path: '/load/mistakeaddress' })).rejects.toThrow('invalid address')
  })
})
