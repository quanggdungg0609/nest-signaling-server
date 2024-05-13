import {
    CanActivate,
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
    Logger,
    UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, NotBeforeError, TokenExpiredError } from "@nestjs/jwt";
import { Request } from "express";
import { Observable } from "rxjs";

@Injectable()
export class JwtRefreshGuard implements CanActivate {
    private logger = new Logger(JwtRefreshGuard.name);
    constructor(
        private readonly config: ConfigService,
        private readonly jwtService: JwtService,
    ) {}

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest() as Request;
        const authorization = request.get("authorization");

        if (!authorization) {
            return false;
        }

        const token = authorization.replace("Bearer", "").trim();

        try {
            const payload = this.jwtService.verify(token, {
                secret: this.config.get<string>("REFRESH_JWT_SECRET"),
            });
            request["user"] = {
                token,
                ...payload,
            };
        } catch (exception) {
            if (exception instanceof TokenExpiredError) {
                throw new HttpException(
                    "Token expired",
                    HttpStatus.NOT_ACCEPTABLE,
                );
            } else if (exception instanceof NotBeforeError) {
                throw new HttpException(
                    "Token not active",
                    HttpStatus.NOT_ACCEPTABLE,
                );
            } else {
                throw new UnauthorizedException();
            }
        }
        // // * verify if request token exist
        // const refreshToken = request.body.refresh_token!;
        // if (!refreshToken) {
        //     this.logger.log(
        //         `[${request.hostname}] don't have the refresh token`,
        //     );
        //     return false;
        // }

        // try {
        //     const payload = this.jwtService.verify(refreshToken, {
        //         secret: this.config.get<string>("REFRESH_JWT_SECRET"),
        //     });

        //     this.logger.debug(payload);
        //     request["user"] = {

        //         ...payload
        //     };
        // } catch (exception) {
        //     this.logger.error(`${exception}`);
        //     return false;
        // }
        return true;
    }
}
