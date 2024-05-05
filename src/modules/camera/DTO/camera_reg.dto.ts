import { IsMACAddress, IsNotEmpty, IsString, IsUUID } from "class-validator"



export class CameraRegDto{
    @IsNotEmpty()
    @IsUUID()
    uuid: string

    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsString()
    location: string
}