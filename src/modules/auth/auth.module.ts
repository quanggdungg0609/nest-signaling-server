import { Module } from "@nestjs/common";
import { AuthController } from "./controllers/auth.controller";
import { JwtModule } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { UserSchema, User } from "../user/entities/user.entity";
import { AuthService } from "./services/auth.service";
import { RefreshToken, RefreshTokenSchema } from "./entities/tokens.entity";
import { Camera, CameraSchema } from "../camera/schemas/camera.schema";

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: User.name, schema: UserSchema },
            { name: RefreshToken.name, schema: RefreshTokenSchema },
            { name: Camera.name, schema: CameraSchema },
        ]),
        JwtModule.register({
            global: true,
        }),
    ],
    providers: [AuthService],
    controllers: [AuthController],
})
export class AuthModule {}
