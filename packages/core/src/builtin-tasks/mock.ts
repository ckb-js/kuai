import { task } from '../config/config-env';
import { string } from '../params';

task('hello')
  .setDescription('set hello')
  .addParam('name', `what's your name`, 'alice', string, true)
  .setAction(({ name }) => console.log(`hello ${name}`));
