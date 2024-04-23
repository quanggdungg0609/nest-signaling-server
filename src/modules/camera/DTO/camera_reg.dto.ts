import { IsMACAddress, IsNotEmpty, IsString } from "class-validator"



export class CameraRegDto{
    @IsNotEmpty()
    @IsMACAddress()
    macAddr: string

    @IsNotEmpty()
    @IsString()
    name: string

    @IsNotEmpty()
    @IsString()
    location: string
}