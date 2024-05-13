import { ApiProperty } from "@nestjs/swagger";
import { IsNotEmpty, IsString } from "class-validator";

export class GetThumbnailImageDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    cameraUuid: string;
}
