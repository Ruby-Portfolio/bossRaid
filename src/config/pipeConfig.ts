import { validationPipe } from '../common/pipe/validation.pipe';

/**
 * pipe 적용 설정
 * @param app
 */
export const pipeConfig: Function = (app): void => {
  validationPipe(app);
};
