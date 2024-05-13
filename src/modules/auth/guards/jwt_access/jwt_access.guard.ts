import {
    ExecutionContext,
    HttpException,
    HttpStatus,
    Injectable,
    UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService, NotBeforeError, TokenExpiredError } from "@nestjs/jwt";
import { AuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";

@Injectable()
export class JwtAccessGuard extends AuthGuard("jwt") {
    constructor(
        private jwtService: JwtService,
        private config: ConfigService,
    ) {
        super();
    }

    canActivate(
        context: ExecutionContext,
    ): boolean | Promise<boolean> | Observable<boolean> {
        const request = context.switchToHttp().getRequest();
        const authorization = request.get("authorization");
        if (!authorization) {
            return false;
        }
        const token = authorization.replace("Bearer", "").trim();
        try {
            const payload = this.jwtService.verify(token, {
                secret: this.config.get<string>("ACCESS_JWT_SECRET"),
            });
            request["user"] = payload;
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
        return true;
    }
}
