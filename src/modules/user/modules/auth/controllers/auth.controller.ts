import { Body, Controller, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { SignInDto, SignUpDto, RefreshDto } from '../DTO';
import { AuthGuard } from '@nestjs/passport';
import { Request } from "express"
import { JwtRefreshGuard } from '../guards/jwt_refresh/jwt_refresh.guard';

@Controller('auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name)
    constructor(private authService: AuthService) {}

    @Post("signup")   
    signUp(
        @Req() request: Request,
        @Body() dto: SignUpDto
    ) {
        const userAgent = this.getUserAgent(request);
        return this.authService.signUp(dto, userAgent);
    }

    @Post("login")
    login(
        @Req() request: Request,
        @Body() dto: SignInDto
    ) {
        const userAgent = this.getUserAgent(request)
        return this.authService.login(dto, userAgent);
    }


    @UseGuards(JwtRefreshGuard)
    @Post("refresh")
    refresh(
        @Req() request: Request,
        @Body() dto: RefreshDto
    ){
        const userAgent = this.getUserAgent(request)
        const payload = {
            payload: request.user,
            userAgent: userAgent
        }
        return this.authService.refresh(dto, payload);
    }   

    @Post()
    logout(
        @Req() request: Request
    ){
        const payload = request.user
        return this.authService.logout()
    }


    private getUserAgent(request: Request): string{
        const uaString = request.headers["user-agent"];
        return uaString
    }
}
