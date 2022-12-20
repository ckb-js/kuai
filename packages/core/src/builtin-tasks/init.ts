import { task } from '../config/config-env'
import { createProject } from '../project-creation'

task('init')
  .setDescription('create kuai dapp tamplate')
  .setAction(async () => {
    try {
      await createProject()
    } catch {
      return
    }
  })
