import { Body, Controller, Get, HttpCode, HttpStatus, Logger, NotFoundException, Param, ParseFilePipeBuilder,
        Post, Put, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import {Response} from "express"

import { CameraRegDto, GetThumbnailImageDto, GetThumbnailVideoDto } from '../DTO';
import { CameraService } from '../services/camera.service';
import { CameraModifyDto } from '../DTO/camera_modify.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CameraGuard } from '../guards/camera.guard';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

//TODO: add api key auth in the future
@ApiTags('Camera APIs')
@Controller('api/cameras')
export class CameraController {
    private logger = new Logger(CameraController.name);

    constructor(
        private readonly cameraService: CameraService
    ){}

    @Post("register")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: 'Register camera' })
    @ApiResponse({
        status:201,
        description: 'The camera are registered',
    })
    @ApiResponse({
        status:409,
        description:"The camera existed"
    })
    @ApiResponse({
        status:500,
        description: "Internal Server Error",
    })
    @ApiResponse({
        status:400,
        description: "Bad request"
    })
    @ApiBody({
        type:CameraRegDto,
        description:"Necessary camera information"
    })
    register(@Body() dto: CameraRegDto){
        console.log(dto)
        return this.cameraService.register(dto);
    }

    @Get("verify-apikey")
    async verifyApiKey(){
        
    }

    @Put("modifyInfo")
    @UseGuards(CameraGuard)
    modifyInfo(@Body() dto: CameraModifyDto){
        this.logger.debug(dto);
        return {test:"test"}
    }

    @Post("upload-thumbnail")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Upload camera thumbnail' })
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        required: true,
        schema: {
            type: "object",
            properties: {
            file: {
                    type: "string",
                    format: "binary",
                }
            },
        }
    })
    @ApiResponse({
        status:200,
        description: "Image Uploaded"
    })
    @ApiResponse({
        status:422,
        description: "Image is not valid"
    })
    @ApiResponse({
        status:500,
        description: "Internal Server Error"
    })
    @UseInterceptors(FileInterceptor("file"))
    async uploadThumbnail(  
        @UploadedFile(
            new ParseFilePipeBuilder()
            .addFileTypeValidator({fileType:"image/jpeg"})
            .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file){
        return this.cameraService.uploadThumbnail(file)
    }

    @Post("upload-image")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Upload image taked by camera'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        required: true,
        schema: {
            type: "object",
            properties: {
                file: {
                    type: "string",
                    format: "binary",
                },
                "camera-uuid": {
                    type: "string",
                    description: "UUID of the camera",
                },
            },
        }
    })
    @ApiResponse({
        status:200,
        description: "Image Uploaded"
    })
    @ApiResponse({
        status:422,
        description: "Image is not valid"
    })
    @ApiResponse({
        status:500,
        description: "Internal Server Error"
    })
    @UseInterceptors(FileInterceptor("file"))
    async uploadImage(  
        @UploadedFile(
            new ParseFilePipeBuilder()
            .addFileTypeValidator({fileType:"image/jpeg"})
            .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file, @Body("camera-uuid") cameraUuid: string){
        return this.cameraService.uploadImage(file, cameraUuid)
    }


    @Post("upload-video")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Upload video taked by camera'})
    @ApiConsumes('multipart/form-data')
    @ApiBody({
        required: true,
        schema: {
            type: "object",
            properties: {
                file: {
                    type: "string",
                    format: "binary",
                },
                "camera-uuid": {
                    type: "string",
                    description: "UUID of the camera",
                },
            },
        }
    })
    @ApiResponse({
        status:200,
        description: "Image Uploaded"
    })
    @ApiResponse({
        status:422,
        description: "Image is not valid"
    })
    @ApiResponse({
        status:500,
        description: "Internal Server Error"
    })
    @UseInterceptors(FileInterceptor("file"))
    async uploadVideo(  
        @UploadedFile(
            new ParseFilePipeBuilder()
            .addFileTypeValidator({fileType:"video/webm"})
            .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File, @Body('camera-uuid') cameraUuid: string){
        return this.cameraService.uploadVideo(cameraUuid, file)
    }

    

    @Get("get-thumbnail/:cameraUuid")
    @HttpCode(200)
    @ApiOperation({ summary: 'Get camera thumbnail with the camera uuid given'})
    @ApiResponse({
        status: 200,
        description: "Get thumbnail successful" 
    })
    @ApiResponse({
        status:404,
        description: "Thumbnail not found"
    })
    async getThumbnail(@Param('camera-uuid') dto: GetThumbnailImageDto, @Res() res: Response){
        try{
            const imgPath = await this.cameraService.getThumbnail(dto.cameraUuid)
            res.sendFile(imgPath)
            return
        }catch(error){
            if(error instanceof NotFoundException){
                throw new NotFoundException(error.message)
            }
            throw error
        }
        
    }

    @Get("get-thumbnail-video/:cameraUuid/:imageName")
    @HttpCode(200)
    @ApiOperation({ summary: 'Get video thumbnail with the camera uuid given'})
    @ApiResponse({
        status: 200,
        description: "Get video thumbnail successful" 
    })
    @ApiResponse({
        status:404,
        description: "Video thumbnail not found"
    })
    async getThumbnailVideo(@Param() getThumbnailDto: GetThumbnailVideoDto ,@Res() res: Response){
        const {cameraUuid, imageName} = getThumbnailDto;
        try{
            const imgPath = await this.cameraService.getThumbnailVideo(cameraUuid, imageName)
            res.sendFile(imgPath)
            return
        }catch(error){
            if(error instanceof NotFoundException){
                throw new NotFoundException(error.message)
            }
            throw error
        }
    }
}
