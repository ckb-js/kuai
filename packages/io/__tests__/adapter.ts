import { describe, it, expect, afterAll } from '@jest/globals'
import { CoR } from '../src/cor'
import { KuaiRouter } from '../src/router'
import { KoaRouterAdapter } from '../src/adapter'
import Koa from 'koa'
import { koaBody } from 'koa-body'

describe('test KoaRouterAdapter', () => {
  const koaServer = new Koa()
  koaServer.use(koaBody())

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

  kuaiRouter.get('/test-query', async (ctx) => {
    ctx.ok(`queries: ${JSON.stringify(ctx.payload.query)}`)
  })

  kuaiRouter.post('/test-body', async (ctx) => {
    ctx.ok(`body: ${JSON.stringify(ctx.payload.body)}`)
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

  it(`support query`, async () => {
    const res = await fetch('http://localhost:4004/test-query?fieldA=a&filedB=b', { method: 'GET' })
    expect(res.status).toEqual(200)
    const body = await res.text()
    expect(body).toEqual('queries: {"fieldA":"a","filedB":"b"}')
  })

  it(`support body`, async () => {
    const res = await fetch('http://localhost:4004/test-body', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fieldA: 'a', filedB: 'b' }),
    })

    expect(res.status).toEqual(200)
    const body = await res.text()
    expect(body).toEqual('body: {"fieldA":"a","filedB":"b"}')
  })
})
