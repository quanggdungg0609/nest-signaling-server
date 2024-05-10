import { Body, Controller, ForbiddenException, Header, HttpCode, HttpException, HttpStatus, InternalServerErrorException, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from '../services/auth.service';
import { SignInDto, SignUpDto, RefreshDto, VerifyApiKeyDto } from '../DTO';
import { AuthGuard } from '@nestjs/passport';
import { Request } from "express"
import { JwtRefreshGuard } from '../guards/jwt_refresh/jwt_refresh.guard';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';


@ApiTags('Authentication APIs')
@Controller('api/auth')
export class AuthController {
    private readonly logger = new Logger(AuthController.name)
    constructor(private authService: AuthService) {}

    @Post("signup")
    @ApiOperation({ summary: 'Sign up'})
    @ApiResponse({
        status: 201,
        description: "User created"
    })
    @ApiResponse({
        status: 400,
        description: "Bad request"
    })
    @ApiResponse({
        status:500,
        description: "Internal Server Error"
    })
    signUp(
        @Req() request: Request,
        @Body() dto: SignUpDto
    ) {
        try{
            const userAgent = this._getUserAgent(request);
            return this.authService.signUp(dto, userAgent);
        }catch(exception){
            this.logger.error(exception)
            throw exception
        }
    }

    @Post("login")
    @ApiOperation({ summary: 'Login' })
    @HttpCode(200)
    @ApiResponse({
        status:200,
        description: "Login successful"
    })
    @ApiResponse({
        status:404,
        description: "User not found"
    })
    @ApiResponse({
        status:401,
        description: "Unauthorized"
    })
    @ApiResponse({
        status:500,
        description: "Internal Server Error"
    })
    login(
        @Req() request: Request,
        @Body() dto: SignInDto
    ) {
        try{
            const userAgent = this._getUserAgent(request)
            return this.authService.login(dto, userAgent);
        }catch(exception){
            this.logger.error(exception)
            if (exception instanceof HttpException){
                throw exception
            }else{
                throw new InternalServerErrorException()
            }
            
        }
    }


    @UseGuards(JwtRefreshGuard)
    @Post("refresh")
    @HttpCode(HttpStatus.OK)
    @ApiBearerAuth()
    @ApiOperation({
        summary:"Provide a new access token with a valid refresh token given"
    })
    @ApiBody({
        type: RefreshDto,
        description:"A valid Refresh token"
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: "Generate a new access token successful"
    })
    @ApiResponse({
        status: HttpStatus.UNAUTHORIZED,
        description: "Unauthorized"
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: "Forbidden"
    })
    @ApiResponse({
        status: HttpStatus.BAD_REQUEST,
        description: "Bad Request"
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: "Internal Server Error"
    })
    refresh(
        @Req() request: Request,
        @Body() dto: RefreshDto
    ){
        const userAgent = this._getUserAgent(request)
        const payload = {
            payload: request.user,
            userAgent: userAgent
        }
        return this.authService.refresh(dto, payload);
    }   

    @Post("logout")
    logout(
        @Req() request: Request
    ){
        // TODO: Implement later
        const payload = request.user
        return this.authService.logout()
    }


    @Post("verify-api-key")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({
        summary: "Verify a API Key given by a camera"
    })
    @ApiBody({
        type:VerifyApiKeyDto,
        description: "A API Key of a camera"
    })
    @ApiResponse({
        status: HttpStatus.OK,
        description: "API Key is valid"
    })
    @ApiResponse({
        status: HttpStatus.FORBIDDEN,
        description: "API Key is not valid"
    })
    @ApiResponse({
        status: HttpStatus.INTERNAL_SERVER_ERROR,
        description: "Internal Server Error"
    })
    async verifyApiKey(
        @Body() dto: VerifyApiKeyDto
    ){
        try{
            if(await this.authService.verifyApiKey(dto.apiKey)){
                return {message: "API Key authorized"}
            }else{
                throw new ForbiddenException("API Key is not valid")
            }
        }catch(exception){
            this.logger.error(exception)
            throw exception
        }
    }

    private _getUserAgent(request: Request): string{
        const uaString = request.headers["user-agent"];
        return uaString
    }
}
