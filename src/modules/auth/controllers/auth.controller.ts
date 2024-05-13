import {
    Body,
    Controller,
    ForbiddenException,
    HttpCode,
    HttpException,
    HttpStatus,
    InternalServerErrorException,
    Logger,
    Post,
    Req,
    UseGuards,
} from "@nestjs/common";
import { AuthService } from "../services/auth.service";
import { SignInDto, SignUpDto, VerifyApiKeyDto } from "../DTO";
import { Request } from "express";
import { JwtRefreshGuard } from "../guards/jwt_refresh/jwt_refresh.guard";
import {
    ApiBearerAuth,
    ApiBody,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";

@ApiTags("Authentication APIs")
@Controller("api/auth")
export class AuthController {
    private readonly logger = new Logger(AuthController.name);
    constructor(private authService: AuthService) {}

    @Post("signup")
    @ApiOperation({ summary: "Sign up" })
    @ApiResponse({
        status: 201,
        description: "User created",
    })
    @ApiResponse({
        status: 400,
        description: "Bad request",
    })
    @ApiResponse({
        status: 500,
        description: "Internal Server Error",
    })
    signUp(@Req() request: Request, @Body() dto: SignUpDto) {
        try {
            const userAgent = this._getUserAgent(request);
            return this.authService.signUp(dto, userAgent);
        } catch (exception) {
            this.logger.error(exception);
            throw exception;
        }
    }

    @Post("login")
    @ApiOperation({ summary: "Login" })
    @HttpCode(200)
    @ApiResponse({
        status: 200,
        description: "Login successful",
    })
    @ApiResponse({
        status: 404,
        description: "User not found",
    })
    @ApiResponse({
        status: 400,
        description: "Username/email is empty",
    })
    @ApiResponse({
        status: 401,
        description: "Password not valid",
    })
    @ApiResponse({
        status: 500,
        description: "Internal Server Error",
    })
    login(@Req() request: Request, @Body() dto: SignInDto) {
        try {
            const userAgent = this._getUserAgent(request);
            return this.authService.login(dto, userAgent);
        } catch (exception) {
            this.logger.error(exception);
            if (exception instanceof HttpException) {
                throw exception;
            } else {
                throw new InternalServerErrorException();
            }
        }
    }

    @UseGuards(JwtRefreshGuard)
    @Post("refresh")
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({
        summary:
            "Provide a new access token with a valid refresh token given, need bind a refresh token into Bearer Authorization instead of access token",
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: "Generate a new access token successful",
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: "Unauthorized",
    })
    @ApiResponse({
        status: HttpStatus.NOT_ACCEPTABLE,
        description: "Refresh Token is not acceptable",
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: "Refresh token not found",
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: "Bad Request",
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: "Internal Server Error",
    })
    refresh(@Req() request: Request) {
        const userAgent = this._getUserAgent(request);
        // console.log(request.user!);

        const payload: {
            sub?: string;
            token?: string;
            role?: string;
            iat?: number;
            exp?: number;
            userAgent: string;
        } = {
            userAgent,
            ...request.user!,
        };
        return this.authService.refresh(payload);
    }

    @Post("logout")
    logout(@Req() request: Request) {
        // TODO:
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const payload = request.user;
        return this.authService.logout();
    }

    @Post("verify-api-key")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: "Verify a API Key given by a camera",
    })
    @ApiBody({
        type: VerifyApiKeyDto,
        description: "A API Key of a camera",
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: "API Key is valid",
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: "API Key is not valid",
    })
    async verifyApiKey(@Body() dto: VerifyApiKeyDto) {
        try {
            if (await this.authService.verifyApiKey(dto.apiKey)) {
                return { message: "API Key authorized" };
            } else {
                throw new ForbiddenException("API Key is not valid");
            }
        } catch (exception) {
            this.logger.error(exception);
            throw exception;
        }
    }

    private _getUserAgent(request: Request): string {
        const uaString = request.headers["user-agent"];
        return uaString;
    }
}
