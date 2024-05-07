import { ApiParam, ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";


export class GetVideoNamesDto{
    @ApiProperty({
        description: "UUID of camera",
        example: "b22f742e-50e4-4fc0-8cc5-1ff86f7b8881"
    })
    @IsString()
    @IsNotEmpty()
    @IsUUID()
    cameraUuid: string
}