import { describe, it, expect } from '@jest/globals'
import { CoR } from '../src/cor'
import { KuaiRouter } from '../src/router'

describe('test KuaiRouter', () => {
  it(`should use kuaiRouter`, async () => {
    const cor = new CoR()
    const kuaiRouter = new KuaiRouter()
    kuaiRouter.get('/', async (ctx) => {
      ctx.ok('hello root')
    })

    kuaiRouter.get('/parent', async (ctx) => {
      ctx.ok('hello parent')
    })

    kuaiRouter.get('/parent/children', async (ctx) => {
      ctx.ok('hello children')
    })

    cor.use(kuaiRouter.middleware())

    const rootResult = await cor.dispatch({ method: 'GET', path: '/' })
    expect(rootResult).toMatch('hello root')

    const parentResult = await cor.dispatch({ method: 'GET', path: '/parent' })
    expect(parentResult).toMatch('hello parent')

    const childrenResult = await cor.dispatch({ method: 'GET', path: '/parent/children' })
    expect(childrenResult).toMatch('hello children')
  })
})
