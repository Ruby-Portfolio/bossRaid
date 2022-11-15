import { UpdateResult } from 'typeorm';

export const isUpdateState = (updateResult: UpdateResult) => {
  return !!updateResult.affected;
};
