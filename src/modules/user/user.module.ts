import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from 'src/modules/user/entities/user.entity';
import { UserController } from './controllers/user.controller';
import { UserService } from './services/user.service';
import { AuthModule } from '../auth/auth.module';

@Module({
    imports:[
        MongooseModule.forFeature([{name: User.name, schema: UserSchema}, ]),
    ],
    controllers: [UserController],
    providers: [UserService]
})
export class UserModule {}
