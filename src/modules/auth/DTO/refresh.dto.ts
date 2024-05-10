
import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class RefreshDto{
    @ApiProperty({
        name:"refresh_token",
        description: "A valid Refresh token"
    })
    @IsNotEmpty()
    @IsString()
    refresh_token: string
}