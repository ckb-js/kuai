import { describe, it, expect } from '@jest/globals'
import { CoR } from '../src/cor'
import { BaseController, Get } from '../src'
import type { Context } from '../src/types'

class AppController extends BaseController {
  @Get()
  async hello(ctx: Context) {
    ctx.ok('hello root')
  }

  @Get('/parent')
  async parent(ctx: Context) {
    ctx.ok('hello parent')
  }

  @Get('/parent/children')
  async children(ctx: Context) {
    ctx.ok('hello children')
  }

  @Get('/:username')
  async username(ctx: Context<{ payload: { params: { username?: string } } }>) {
    ctx.ok(`hello ${ctx.payload.params?.username}`)
  }
}

describe('test Controller', () => {
  it(`should use Controller`, async () => {
    const cor = new CoR()
    const appController = new AppController()
    cor.use(appController.middleware())

    const rootResult = await cor.dispatch({ method: 'GET', path: '/' })
    expect(rootResult).toMatch('hello root')

    const parentResult = await cor.dispatch({ method: 'GET', path: '/parent' })
    expect(parentResult).toMatch('hello parent')

    const childrenResult = await cor.dispatch({ method: 'GET', path: '/parent/children' })
    expect(childrenResult).toMatch('hello children')
  })

  it(`controller support params`, async () => {
    const cor = new CoR()
    const appController = new AppController()
    cor.use(appController.middleware())

    const result = await cor.dispatch({ method: 'GET', path: '/alice' })
    expect(result).toMatch('hello alice')
  })
})
