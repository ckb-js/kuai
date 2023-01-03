import { describe, it, expect, afterAll } from '@jest/globals'
import { CoR } from '../src/cor'
import { KuaiRouter } from '../src/router'
import { KoaRouterAdapter } from '../src/adapter'
import Koa from 'koa'

describe('test KoaRouterAdapter', () => {
  const koaServer = new Koa()

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

  const koaRouterAdapter = new KoaRouterAdapter(cor)

  koaServer.use(koaRouterAdapter.routes()).use(koaRouterAdapter.allowedMethods())

  const server = koaServer.listen(4004)

  afterAll(() => {
    server.close()
  })

  it(`should find root`, async () => {
    const res = await fetch('http://localhost:4004/', { method: 'GET' })
    expect(res.status).toEqual(200)
    const body = await res.text()
    expect(body).toEqual('hello root')
  })

  it(`should find parent`, async () => {
    const res = await fetch('http://localhost:4004/parent', { method: 'GET' })
    expect(res.status).toEqual(200)
    const body = await res.text()
    expect(body).toEqual('hello parent')
  })

  it(`should find children`, async () => {
    const res = await fetch('http://localhost:4004/parent/children', { method: 'GET' })
    expect(res.status).toEqual(200)
    const body = await res.text()
    expect(body).toEqual('hello children')
  })
})
