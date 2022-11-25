import { task } from '../config/config-env';
import { paramTypes } from '../params';

// for temporary, remove it when other built-in tasks are implemented.
task('hello')
  .setDescription('say hello')
  .addParam('name', `what's your name`, 'alice', paramTypes.string, true)
  .setAction(({ name }) => console.log(`hello ${name}`));
