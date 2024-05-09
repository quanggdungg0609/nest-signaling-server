import {  Logger, Module } from '@nestjs/common';
import { WebsocketGateway } from './gateways/websocket/websocket.gateway';
import { UserModule } from './modules/user/user.module';
import { CameraModule } from './modules/camera/camera.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from "@nestjs/config"
import { User, UserSchema } from './modules/user/entities/user.entity';
import { RefreshToken, RefreshTokenSchema } from './modules/auth/entities/tokens.entity';
import { Camera, CameraSchema } from './modules/camera/schemas/camera.schema';
import { AdminModule } from './modules/admin/admin.module';
import { FilesModule } from './modules/files/files.module';
import { AuthModule } from './modules/auth/auth.module';






@Module({
  imports: [
    // 
    // * config module for .env file
    ConfigModule.forRoot({
      envFilePath: ".env",
      isGlobal: true,
    }),
    // * import mongoose module
    // MongooseModule.forRoot("mongodb://root:lanestel29@dev-db:27017/"),
    MongooseModule.forRootAsync({
      imports:[ConfigModule],
      useFactory: async (configService: ConfigService)=>({
        uri:`mongodb://${configService.get<string>("MONGO_ACCOUNT")}:${configService.get<string>("MONGO_PASSWORD")}@${configService.get<string>("MONGO_URI")}`
      }),
      inject:[ConfigService]
    }),
    MongooseModule.forFeature([
      {name: User.name, schema: UserSchema}, 
      {name: RefreshToken.name, schema: RefreshTokenSchema},
      {name: Camera.name, schema: CameraSchema}
    ]),
    // * Orther modules
    UserModule,
    AuthModule,
    CameraModule,
    AdminModule, 
    FilesModule
  ],
  controllers: [],
  providers: [
    WebsocketGateway, 
    Logger,
  ],
})
export class AppModule {}

