// import { ApiParam } from "@nestjs/swagger"
import { IsNotEmpty, IsString, IsUUID } from "class-validator";

export class GetVideoStreamDto {
    // @ApiParam({ name: 'camaraUuid', description: 'UUID of the camera', type: 'string', example: "a9f0cef0-68cf-43dc-a3a8-5242212cb330" })
    @IsString()
    @IsUUID()
    cameraUuid: string;

    @IsNotEmpty()
    @IsString()
    videoName: string;
}
