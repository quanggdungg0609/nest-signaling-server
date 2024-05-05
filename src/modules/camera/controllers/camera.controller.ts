import { Body, Controller, Get, HttpStatus, Logger, NotFoundException, Param, ParseFilePipeBuilder,
        Post, Put, Query, Res, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import {Response} from "express"

import { CameraRegDto } from '../DTO';
import { CameraService } from '../services/camera.service';
import { CameraModifyDto } from '../DTO/camera_modify.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { CameraGuard } from '../guards/camera.guard';

@Controller('api/cameras')
export class CameraController {
    private logger = new Logger(CameraController.name);

    constructor(
        private readonly cameraService: CameraService
    ){}

    @Post("register")
    register(@Body() dto: CameraRegDto){
        console.log(dto)
        return this.cameraService.register(dto);
    }

    @Put("modifyInfo")
    @UseGuards(CameraGuard)
    modifyInfo(@Body() dto: CameraModifyDto){
        this.logger.debug(dto);
        return {test:"test"}
    }


    @Post("upload-thumbnail")
    @UseInterceptors(FileInterceptor("file"))
    async uploadImage(  
        @UploadedFile(
            new ParseFilePipeBuilder()
            .addFileTypeValidator({fileType:"image/jpeg"})
            .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file,){
        return this.cameraService.uploadThumnail(file)
    }


    @Post("upload-video")
    @UseInterceptors(FileInterceptor("file"))
    async uploadVideo(  
        @UploadedFile(
            new ParseFilePipeBuilder()
            .addFileTypeValidator({fileType:"video/webm"})
            .build({ errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY }),
    )
    file: Express.Multer.File, @Body('camera-uuid') cameraUuid: string){
        console.log(file.mimetype)
        return this.cameraService.uploadVideo(cameraUuid, file)
    }

    @Get("verify-apikey")
    async verifyApiKey(){
        
    }

    @Get("get-thumbnail")
    async getThumbnail(@Query('camera-uuid') cameraUuid: string, @Res() res: Response){
        try{
            const imgPath = await this.cameraService.getThumbnail(cameraUuid)
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
