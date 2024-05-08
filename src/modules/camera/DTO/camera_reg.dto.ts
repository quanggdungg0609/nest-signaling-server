import { ApiProperty } from "@nestjs/swagger"
import { IsMACAddress, IsNotEmpty, IsString, IsUUID } from "class-validator"



export class CameraRegDto{
    @ApiProperty({
        example:"814d683b-d3b0-4315-ba64-f042cd4aa695",
        required:true
    })
    @IsNotEmpty()
    @IsUUID()
    uuid: string

    @ApiProperty(
        {
            example:"Testing Camera",
            required:true
        }
    )
    @IsNotEmpty()
    @IsString()
    name: string

    @ApiProperty(
        {
            example:"My Home",
            required:true
        }
    )
    @IsNotEmpty()
    @IsString()
    location: string
}