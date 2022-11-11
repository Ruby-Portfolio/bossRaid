import { TestingModule } from '@nestjs/testing';

export const testApp = (module: TestingModule) => {
  return module.createNestApplication();
};
