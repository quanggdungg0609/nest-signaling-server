import { Controller, Get, Req, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";
import { Request } from "express";
import { JwtAccessGuard } from "../../auth/guards/jwt_access/jwt_access.guard";
import { JwtRefreshGuard } from "../../auth/guards/jwt_refresh/jwt_refresh.guard";

@Controller("api/users")
export class UserController {
    // @UseGuards(JwtAccessGuard)
    // @UseGuards(JwtRefreshGuard)

    @UseGuards(AuthGuard("jwt"))
    @Get("me")
    getMe(@Req() request: Request) {
        // TODO: implements later

        return "user info";
    }
}
