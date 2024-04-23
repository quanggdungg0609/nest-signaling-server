import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { ValidationPipe } from '@nestjs/common';


async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    logger:['log', 'fatal', 'error', 'warn', 'debug', 'verbose'],
  });
  // ! Validation Pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true
  }));
  // ! Websocket Adapter
  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(3000);
}
bootstrap();
