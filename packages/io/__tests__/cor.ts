import { jest, describe, it, expect } from '@jest/globals'
import { CoR } from '../src/cor'
import { Middleware } from '../src/types'

describe('Test CoR', () => {
  function isThirteenPayload(x: unknown): x is { type: 'is-thirteen'; value: unknown } {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof x === 'object' && x !== null && 'type' in x && (x as any).type === 'is-thirteen'
  }

  function isFivePayload(x: unknown): x is { type: 'is-five'; value: number } {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return typeof x === 'object' && x !== null && 'type' in x && (x as any).type === 'is-five'
  }

  const routerMiddleware: Middleware = async (ctx, next) => {
    const payload = ctx.payload

    // route like handler here
    if (isThirteenPayload(payload)) {
      if (payload.value === 13) ctx.ok()
      else ctx.err()
    }

    // the second route
    if (isFivePayload(payload)) {
      if (payload.value === 5) ctx.ok('gives you five')
      else ctx.err('please give me five')
    }

    await next()
  }

  it(`should use middleware`, async () => {
    const cor = new CoR()
    cor.use(routerMiddleware)

    const result = await cor.dispatch({ type: 'is-five', value: 5 })

    expect(result).toMatch('gives you five')
  })

  it(`should use multi middlewares`, async () => {
    const cor = new CoR()
    const mockFn = jest.fn()
    cor.use(async (_, next) => {
      mockFn()
      next()
    })
    cor.use(routerMiddleware)

    await cor.dispatch({ type: 'is-five', value: 5 })

    expect(mockFn).toBeCalled()
  })

  it(`should return ok on any middleware`, async () => {
    const cor = new CoR()
    const mockFn = jest.fn()
    const mockFn1 = jest.fn()
    const mockFn2 = jest.fn()

    cor.use(async (_, next) => {
      mockFn()
      await next()
    })
    cor.use(async (ctx) => {
      mockFn1()
      ctx.ok('ok')
    })
    cor.use(async (_, next) => {
      mockFn2()
      await next()
    })

    const result = await cor.dispatch({})

    expect(result).toMatch('ok')
    expect(mockFn).toBeCalled()
    expect(mockFn1).toBeCalled()
    expect(mockFn2).not.toBeCalled()
  })

  it(`should call each middleware before & after`, async () => {
    const cor = new CoR()
    const mockBefore = jest.fn()
    const mockAfter = jest.fn()

    cor.use(async (_, next) => {
      mockBefore()
      await next()
      mockAfter()
    })
    cor.use(async (ctx) => {
      ctx.ok('ok')
    })

    const result = await cor.dispatch({})

    expect(result).toMatch('ok')
    expect(mockBefore).toBeCalled()
    expect(mockAfter).toBeCalled()
  })

  it(`should return ok on any middleware`, async () => {
    const cor = new CoR()
    const mockFn = jest.fn()
    const mockFn1 = jest.fn()
    const mockFn2 = jest.fn()

    cor.use(async (_, next) => {
      mockFn()
      await next()
    })
    cor.use(async (ctx, next) => {
      mockFn1()
      ctx.ok('ok')
      await next()
    })
    cor.use(async (ctx) => {
      mockFn2()
      ctx.ok('hello')
    })

    const result = await cor.dispatch({})

    expect(result).toEqual('ok')
    expect(mockFn).toBeCalled()
    expect(mockFn1).toBeCalled()
    expect(mockFn2).toBeCalled()
  })
})
