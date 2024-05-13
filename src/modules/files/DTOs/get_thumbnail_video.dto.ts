import { IsNotEmpty, IsString } from "class-validator";
import { ApiProperty } from "@nestjs/swagger";

export class GetThumbnailVideoDto {
    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    cameraUuid: string;

    @ApiProperty()
    @IsNotEmpty()
    @IsString()
    imageName: string;
}
