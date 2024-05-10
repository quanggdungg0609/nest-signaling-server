import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WsAdapter } from '@nestjs/platform-ws';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';


async function bootstrap() {
  const app = await NestFactory.create(AppModule,{
    logger:['log', 'fatal', 'error', 'warn', 'debug', 'verbose'],
  });

  // * Setup Swagger for Api Document
  const configDocument = new DocumentBuilder()
    .setTitle("Nest API Documentation")
    .setVersion("1.0")
    .addBearerAuth()
    .build()
  const document= SwaggerModule.createDocument(app, configDocument)
  SwaggerModule.setup('api-document', app, document);

  
  // ! Validation Pipes
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true
  }));
  // ! Websocket Adapter
  app.useWebSocketAdapter(new WsAdapter(app));

  await app.listen(3000);
}
bootstrap();
