import { ValidationPipe } from '@nestjs/common';

/**
 * 요청시 검증을 위한 ValidationPipe 의 Global 적용
 * @param app
 */
export const validationPipe = (app): void => {
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
};
