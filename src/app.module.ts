import {  Logger, Module } from '@nestjs/common';
import { WebsocketGateway } from './gateways/websocket/websocket.gateway';
import { UserModule } from './modules/user/user.module';
import { CameraModule } from './modules/camera/camera.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule } from "@nestjs/config"





@Module({
  imports: [
    // * config module for .env file
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),
    // * import mongoose module
    MongooseModule.forRoot("mongodb://root:lanestel29@localhost:27017/"),
    // * Orther modules
    UserModule, 
    CameraModule
  ],
  controllers: [],
  providers: [
    WebsocketGateway, 
    Logger,
  ],
})
export class AppModule {}
