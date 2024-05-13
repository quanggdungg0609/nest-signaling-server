import { Module } from "@nestjs/common";
import { CameraController } from "./controllers/camera.controller";
import { CameraService } from "./services/camera.service";
import { MongooseModule } from "@nestjs/mongoose";
import { Camera, CameraSchema } from "./schemas/camera.schema";
import { MulterModule } from "@nestjs/platform-express";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Module({
    imports: [
        // * Multer module for file upload
        MulterModule.registerAsync({
            imports: [ConfigModule],
            useFactory: async (configService: ConfigService) => ({
                dest: configService.get<string>("MULTER_DEST"),
            }),
            inject: [ConfigService],
        }),
        // * Mongoose Module
        MongooseModule.forFeature([
            { name: Camera.name, schema: CameraSchema },
        ]),
    ],
    controllers: [CameraController],
    providers: [CameraService],
})
export class CameraModule {}
