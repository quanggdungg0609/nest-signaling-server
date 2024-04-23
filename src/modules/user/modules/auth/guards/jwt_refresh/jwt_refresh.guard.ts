import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { Observable } from 'rxjs';


@Injectable()
export class JwtRefreshGuard implements CanActivate  {
    private logger = new Logger(JwtRefreshGuard.name);
    constructor(
        private readonly config: ConfigService,
        private readonly jwt: JwtService
    ){}

    canActivate(context: ExecutionContext): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest() as Request;

        // * verify if request token exist
        const refreshToken=  request.body.refresh_token!;
        if(!refreshToken){
            this.logger.log(`[${request.hostname}] don't have the refresh token`)
            return false;
        }

        try{
            const payload = this.jwt.verify(
                refreshToken,
                {
                    secret: this.config.get<string>("REFRESH_JWT_SECRET"),
                }
            )
            this.logger.debug(payload);
            request["user"] = payload
        }catch(exception){
            this.logger.error(`${exception}`);
            return false
        }
        return true
    }
}
