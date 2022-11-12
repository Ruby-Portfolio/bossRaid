import { SuccessInterceptor } from '../common/interceptor/success.interceptor';

/**
 * interceptor 적용 설정
 * @param app
 */
export const interceptorConfig: Function = (app): void => {
  app.useGlobalPipes(new SuccessInterceptor());
};
