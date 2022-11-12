import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { pipeConfig } from './config/pipeConfig';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  pipeConfig(app);

  const port = process.env.PORT;
  await app.listen(port);
}
bootstrap();
