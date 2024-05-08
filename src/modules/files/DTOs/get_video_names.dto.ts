import { ApiParam, ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString, IsUUID } from "class-validator";


export class GetVideoNamesDto{

    @IsString()
    @IsNotEmpty()
    cameraUuid: string
}