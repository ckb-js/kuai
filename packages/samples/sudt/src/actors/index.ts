import { Registry } from '@ckb-js/kuai-models';

const appRegistry = new Registry();
appRegistry.load(__dirname);

export { appRegistry };
