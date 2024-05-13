import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class VerifyApiKeyDto {
    @ApiProperty({
        name: "apiKey",
        description: "A API Key of a camera",
    })
    @IsString()
    @IsNotEmpty()
    apiKey: string;
}
