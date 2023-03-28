import { describe, it, expect } from '@jest/globals'
import { CoR } from '../src/cor'
import { BaseController, Get, Post, Body, Param, Query, Controller } from '../src'

class AppController extends BaseController {
  @Get()
  async hello() {
    return 'hello root'
  }

  @Get('/parent')
  async parent() {
    return 'hello parent'
  }

  @Get('/parent/children')
  async children() {
    return 'hello children'
  }

  @Post('/test-body')
  async body(@Body() body: { username: string }) {
    return `hello ${body.username} by body`
  }

  @Get('/test-query')
  async query(@Query() query: { username: string }) {
    return `hello ${query.username} by query`
  }

  @Get('/:username')
  async username(@Param('username') username: string) {
    return `hello ${username} by param`
  }
}

@Controller('prefix')
class PrefixController extends BaseController {
  @Get()
  async hello() {
    return 'hello prefix'
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
    expect(result).toMatch('hello alice by param')

    const bodyResult = await cor.dispatch({ method: 'POST', path: '/test-body', body: { username: 'bob' } })
    expect(bodyResult).toMatch('hello bob by body')

    const queryResult = await cor.dispatch({ method: 'GET', path: '/test-query', query: { username: 'celia' } })
    expect(queryResult).toMatch('hello celia by query')
  })

  it(`controller support prefix path`, async () => {
    const cor = new CoR()
    const controller = new PrefixController()
    cor.use(controller.middleware())

    console.log('_routes', controller._routes)

    const result = await cor.dispatch({ method: 'GET', path: '/prefix' })
    expect(result).toMatch('hello prefix')
  })
})
