import { IsNotEmpty, IsString } from "class-validator";


export class VerifyApiKeyDto{
    @IsString()
    @IsNotEmpty()
    apiKey:string
}