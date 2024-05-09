import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, } from "class-validator";

export class SignUpDto{
    @IsNotEmpty()
    @IsString()
    username: string

    @IsNotEmpty()
    @IsString()
    @Length(6,20)
    password: string

    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email: string
}

export class SignInDto{
    @IsOptional()
    @IsEmail()
    email?: string

    @IsOptional()
    @IsString()
    username?: string

    @IsNotEmpty()
    @IsString()
    @Length(6,20)
    password: string
}