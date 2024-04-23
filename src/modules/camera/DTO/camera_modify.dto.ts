import { IsOptional, IsString } from "class-validator"


export class CameraModifyDto{
    @IsOptional()
    @IsString()
    name?: string

    @IsOptional()
    @IsString()
    location?: string

}