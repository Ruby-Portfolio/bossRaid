import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { pipeConfig } from './config/pipeConfig';
import { interceptorConfig } from './config/interceptorConfig';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  pipeConfig(app);
  interceptorConfig(app);

  const port = process.env.PORT;
  await app.listen(port);
}
bootstrap();
