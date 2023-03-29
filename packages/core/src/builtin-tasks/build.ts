import { exec } from 'node:child_process'
import { task, subtask } from '../config/config-env'
import { paramTypes } from '../params'

interface Args {
  server: boolean
}

subtask('build:dev', 'build server side application in dev mode').setAction(async () => {
  exec('npm run dev', (error, stdout, stderr) => {
    if (error) {
      console.error(error)
      return
    }

    if (stderr) {
      console.error(stderr)
      return
    }

    console.info(stdout)
  })
})

subtask('build:server', 'build server side application').setAction(async () => {
  exec('npm run build', (error, stdout, stderr) => {
    if (error) {
      console.error(error)
      return
    }

    if (stderr) {
      console.error(stderr)
      return
    }

    console.info(stdout)
  })
})

task('build', 'build the dapp')
  .addParam('server', 'Build Server', true, paramTypes.boolean)
  .setAction(async ({ server }: Args, env) => {
    if (server) {
      await env.run('build:server')
    } else {
      throw new Error('No module was found to build')
    }
  })
