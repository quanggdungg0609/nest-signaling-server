import { IsNotEmpty } from "class-validator";

export class ValidateDto {
    @IsNotEmpty()
    sub: string;

    @IsNotEmpty()
    role: string;

    @IsNotEmpty()
    iat: number;

    @IsNotEmpty()
    exp: number;
}
