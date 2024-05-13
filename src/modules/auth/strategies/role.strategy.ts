import { ExtractJwt, Strategy } from "passport-jwt";
import { PassportStrategy } from "@nestjs/passport";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ValidateDto } from "../entities";

@Injectable()
export class VerifyRoleStrategy extends PassportStrategy(Strategy, "admin") {
    constructor() {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            secretOrKey: "your_secret_key", // Thay thế bằng secret key của bạn
        });
    }

    async validate(payload: ValidateDto) {
        const { role } = payload;
        if (role !== "admin") {
            return new UnauthorizedException();
        }
        return payload;
    }
}
