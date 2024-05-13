import {
    HttpException,
    HttpStatus,
    Injectable,
    InternalServerErrorException,
    Logger,
} from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import * as argon from "argon2";
import { Model } from "mongoose";

import { User } from "src/modules/user/entities/user.entity";
import { SignUpDto, SignInDto } from "../DTO";
import { MongoServerError } from "mongodb";
import { JwtService, TokenExpiredError } from "@nestjs/jwt";
import { ConfigService } from "@nestjs/config";
import { RefreshToken } from "../entities/tokens.entity";
import { Camera } from "src/modules/camera/schemas/camera.schema";

@Injectable({})
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(RefreshToken.name) private tokenModel: Model<RefreshToken>,
        @InjectModel(Camera.name) private cameraModel: Model<Camera>,
        private jwt: JwtService,
        private config: ConfigService,
    ) {}

    // ! Login and return access token and refresh token
    async login(dto: SignInDto, userAgent: string) {
        try {
            // * Get the user with username/email given
            if (!dto.username && !dto.email) {
                throw new HttpException(
                    "Username/email is empty",
                    HttpStatus.BAD_REQUEST,
                );
            }
            const login = dto.username || dto.email;
            const user = await this.userModel.findOne({
                $or: [{ userName: login }, { email: login }],
            });

            if (!user) {
                throw new HttpException(
                    "User not existed",
                    HttpStatus.NOT_FOUND,
                );
            }
            // * Verify passsword
            const salt = this.config.get<string>("SALT_PWD");
            // * Verify password
            if (
                !(await argon.verify(user.password, dto.password, {
                    salt: Buffer.from(salt, "utf-8"),
                }))
            ) {
                throw new HttpException(
                    "Password is not match",
                    HttpStatus.UNAUTHORIZED,
                );
            }

            // * prepare tokens
            const accessToken = await this._signAccessToken(
                user._id.toString(),
                user.role,
            );
            const refreshToken = await this._signRefreshToken(
                user._id.toString(),
                user.role,
            );

            const hashToken = await this._hashRefreshToken(refreshToken);
            const token = await this.tokenModel.create({
                userId: user,
                refreshToken: hashToken,
                userAgent: userAgent,
            });
            user.tokens.push(token);
            await user.save();
            return {
                userName: user.userName,
                email: user.email,
                role: user.role,
                ...accessToken,
                ...refreshToken,
            };
        } catch (exception) {
            throw exception;
        }
    }

    // ! Register new user and return the refresh token and access token
    async signUp(dto: SignUpDto, userAgent: string) {
        try {
            // * generate hash password
            const salt = this.config.get<string>("SALT_PWD");

            const hash = await argon.hash(dto.password, {
                salt: Buffer.from(salt, "utf-8"),
            });
            // * save thje new user in the db
            const newUser = await this.userModel.create({
                userName: dto.username,
                password: hash,
                email: dto.email,
                role: "user",
            });

            const accessToken = await this._signAccessToken(
                newUser._id.toString(),
                newUser.role,
            );
            const refreshToken = await this._signRefreshToken(
                newUser._id.toString(),
                newUser.role,
            );

            const hashToken = await this._hashRefreshToken(refreshToken);
            const token = await this.tokenModel.create({
                userId: newUser._id.toString(),
                refreshToken: hashToken,
                userAgent: userAgent,
            });

            newUser.tokens.push(token);
            await newUser.save();

            return {
                userName: newUser.userName,
                email: newUser.email,
                role: newUser.role,
                ...accessToken,
                ...refreshToken,
            };
        } catch (error) {
            if (error instanceof MongoServerError) {
                switch (error.code) {
                    case 11000:
                        throw new HttpException(
                            "Username or Email exsited",
                            HttpStatus.BAD_REQUEST,
                        );
                    default:
                }
            } else {
                throw new InternalServerErrorException();
            }
        }
    }

    // ! Refresh access token with the valid refresh token
    async refresh(payload: {
        sub?: string;
        token?: string;
        role?: string;
        iat?: number;
        exp?: number;
        userAgent: string;
    }) {
        // * verify refresh token
        try {
            const hashToken = await this._hashRefreshToken({
                refresh_token: payload.token!,
            });
            const user = await this.userModel
                .findOne({
                    _id: payload.sub!,
                })
                .populate("tokens")
                .exec();
            if (!user) {
                this.logger.error("User not found");
                throw new HttpException(
                    "User with refresh not found",
                    HttpStatus.UNAUTHORIZED,
                );
            }
            const rt = user.tokens.filter(
                (token) => token.refreshToken === hashToken,
            );

            if (rt.length === 0) {
                throw new HttpException(
                    "Refresh token not found",
                    HttpStatus.NOT_FOUND,
                );
            }

            // verify refresh token in database if is expired
            this.jwt.verify(rt[0].refreshToken, {
                secret: this.config.get<string>("REFRESH_JWT_SECRET"),
            });

            const newToken = await this._signAccessToken(
                user._id.toString(),
                user.role,
            );
            this.logger.log("New access token created");
            return {
                ...newToken,
            };
        } catch (exception) {
            this.logger.error(exception);
            if (exception instanceof TokenExpiredError) {
                // if token expired, delete token in database

                const token = await this.tokenModel.findOneAndDelete({
                    refreshToken: payload.token,
                });

                if (token) {
                    await this.userModel.findOneAndUpdate(
                        { _id: payload.sub },
                        { $pull: { tokens: token._id } },
                    );
                }

                // const token = await this.tokenModel.findOne({ refreshToken: payload.token });
                // const user = await this.userModel
                //     .findOne({
                //         _id: payload.sub!,
                //     })
                //     .populate("tokens")
                //     .exec();
                // const index = user.tokens.indexOf(token)
                // user.tokens.splice(index, 1)
                // await user.save()
                // await token.deleteOne()
                // Remove the expired token from the user's token list
                throw new HttpException(
                    "Token is expired",
                    HttpStatus.BAD_REQUEST,
                );
            } else if (exception instanceof HttpException) {
                throw exception;
            } else {
                throw new InternalServerErrorException();
            }
        }
    }

    // ! Logout func
    async logout() {
        // TODO: implement later
    }

    // ! verify ApiKey
    async verifyApiKey(apiKey: string): Promise<boolean> {
        try {
            const hashApiKey = await this._hashApiKey(apiKey);
            const camera = await this.cameraModel.findOne({
                apiKey: hashApiKey,
            });
            if (camera) {
                return true;
            }
            return false;
        } catch (exception) {
            throw new InternalServerErrorException();
        }
    }

    private async _signAccessToken(
        userId: string,
        role: string,
    ): Promise<{ access_token: string }> {
        const payload = {
            sub: userId,
            role: role,
        };

        const token = await this.jwt.signAsync(payload, {
            expiresIn: this.config.get<string>("ACCESS_EXP_TIME"),
            secret: this.config.get<string>("ACCESS_JWT_SECRET"),
        });
        return {
            access_token: token,
        };
    }

    private async _signRefreshToken(
        userId: string,
        role: string,
    ): Promise<{ refresh_token: string }> {
        const payload = {
            sub: userId,
            role: role,
        };
        const token = await this.jwt.signAsync(payload, {
            expiresIn: this.config.get<string>("REFRESH_EXP_TIME"),
            secret: this.config.get<string>("REFRESH_JWT_SECRET"),
        });
        return {
            refresh_token: token,
        };
    }

    private async _hashRefreshToken(refreshToken: {
        refresh_token: string;
    }): Promise<string> {
        return await argon.hash(refreshToken.refresh_token, {
            salt: Buffer.from(this.config.get<string>("SALT_TOKEN")),
        });
    }

    private async _hashApiKey(apiKey: string): Promise<string> {
        return await argon.hash(apiKey, {
            salt: Buffer.from(this.config.get<string>("SALT_APIKEY")),
        });
    }
}
