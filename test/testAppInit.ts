import { TestingModule } from '@nestjs/testing';
import { pipeConfig } from '../src/config/pipeConfig';
import { NestFastifyApplication } from '@nestjs/platform-fastify';
import { interceptorConfig } from '../src/config/interceptorConfig';

export const testApp = (module: TestingModule) => {
  const app: NestFastifyApplication = module.createNestApplication();
  pipeConfig(app);
  interceptorConfig(app);

  return app;
};
