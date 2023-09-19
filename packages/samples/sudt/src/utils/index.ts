import { BadRequest } from 'http-errors';
import { parseAddress } from '@ckb-lumos/helpers';

export const getLock = (address: string) => {
  try {
    return parseAddress(address);
  } catch {
    throw new BadRequest('invalid address');
  }
};
