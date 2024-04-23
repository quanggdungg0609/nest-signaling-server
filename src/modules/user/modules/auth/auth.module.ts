import { Module } from '@nestjs/common';
import { AuthController } from './controllers/auth.controller';
import { JwtModule } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { UserSchema, User } from '../../entities/user.entity';
import { AuthService } from './services/auth.service';
import { RefreshToken, RefreshTokenSchema } from './entities/tokens.entity';
import { VerifyRoleStrategy } from './strategies/role.strategy';

@Module({
    imports:[

        MongooseModule.forFeature([
            {name: User.name, schema: UserSchema}, 
            {name: RefreshToken.name, schema: RefreshTokenSchema}
        ]),
        JwtModule.register({
            global:true,
        }),
    ],
    providers: [AuthService],
    controllers: [AuthController],

})
export class AuthModule {}
