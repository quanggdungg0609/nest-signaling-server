import { ApiProperty } from "@nestjs/swagger";
import { IsEmail, IsNotEmpty, IsOptional, IsString, Length, } from "class-validator";

export class SignUpDto{
    @ApiProperty({
        name: "username",
        description: "Username of user",
        example: "user123"
    })
    @IsNotEmpty()
    @IsString()
    username: string

    @ApiProperty({
        name: "password",
        description: "Password of the account",
        minLength:6,
        maxLength:20,
        example: "aVeryStrongPassword"
    })
    @IsNotEmpty()
    @IsString()
    @Length(6,20)
    password: string


    @ApiProperty({
        name: "email",
        description: "Email of user",
        example: "amail123@mail.com"
    })
    @IsString()
    @IsEmail()
    @IsNotEmpty()
    email: string
}

export class SignInDto{
    @ApiProperty({
        name: "email",
        description: "Email of user",
        required:false,
        example: "amail123@mail.com"
    })
    @IsOptional()
    @IsEmail()
    email?: string


    @ApiProperty({
        name: "username",
        description: "Username of user",
        example: "user123"
    })
    @IsOptional()
    @IsString()
    username?: string

    @ApiProperty({
        name: "password",
        description: "Password of the account",
        minLength:6,
        maxLength:20,
        example: "aVeryStrongPassword"
    })
    @IsNotEmpty()
    @IsString()
    @Length(6,20)
    password: string
}