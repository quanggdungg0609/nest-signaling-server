import { Model } from 'mongoose';
import { HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import { generateApiKey } from 'generate-api-key';
import * as argon from "argon2";
import * as path from 'path';
import * as fs from 'fs-extra';
import * as ffmpeg from "fluent-ffmpeg";

import { CameraRegDto, UploadThumbnailDto } from '../DTO';
import { InjectModel } from '@nestjs/mongoose';
import { Camera } from '../schemas/camera.schema';
import {  ConfigService } from '@nestjs/config';




@Injectable()
export class CameraService {
    private readonly logger = new Logger(CameraService.name);

    constructor(
        @InjectModel(Camera.name) private readonly cameraModel: Model<Camera>,
        private config: ConfigService
    ){}


    async register(dto: CameraRegDto){
        const { uuid, name, location} = dto;
        
        try{
            const found = await this.cameraModel.findOne({
                uuid: uuid
            });
            if(found){
                throw new HttpException("Camera existed", HttpStatus.CONFLICT);
            }

            const apiKey = this.createApiKey();
            const salt = this.config.get<string>("SALT_APIKEY")
            const hash = await argon.hash(apiKey,{
                salt: Buffer.from(salt,"utf-8")
            });
            await this. cameraModel.create({
                uuid: uuid,
                apiKey: hash,
                name: name,
                location: location
            });
            this.logger.log("New Camera added")
            return { apiKey: apiKey };
        }catch (exception){
            this.logger.error(exception)
            throw exception instanceof HttpException ? exception : new InternalServerErrorException();
        }
    }

    async uploadThumbnail(file: Express.Multer.File){
        try{
            const uploadPath = path.join(__dirname, '..', '..', '..', 'cameras', file.originalname.split(".")[0], 'thumbnail');
            await fs.ensureDir(uploadPath);
            // Verify if file existed
            const filePath = path.join(uploadPath, file.originalname);
            const fileExists = await fs.pathExists(filePath);
            if (fileExists) {
                // If file existed, overwrite
                // await fs.copyFile(file.path, filePath, { overwrite: true });
                await fs.remove(filePath); // Delete old file
                await fs.move(file.path, filePath);
            } else {
                // Else, move the file into the directory
                await fs.move(file.path, filePath);
            }
            this.logger.log(`Thumbnail image ${file.originalname} uploaded`)
            // remove temp file
            await fs.remove(file.path)

            return { message: 'File uploaded successfully' };
        }catch(exception){
            console.log(exception)
            return new HttpException("Internal Server Error", HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    async uploadImage(file: Express.Multer.File, cameraUuid: string){
        try {
            const uploadPath = path.join(__dirname, '..', '..', '..', 'cameras', cameraUuid, 'images', );
            await fs.ensureDir(uploadPath);
            // Verify if file existed
            const filePath = path.join(uploadPath, file.originalname);
            const fileExists = await fs.pathExists(filePath);

            if (fileExists) {
                // If file existed, overwrite
                // await fs.copyFile(file.path, filePath, { overwrite: true });
                await fs.remove(filePath); // Delete old file
                await fs.move(file.path, filePath);
            } else {
                // Else, move the file into the directory
                await fs.move(file.path, filePath);
            }

            this.logger.log(`Image ${file.originalname} uploaded`)
            
            // remove temp file
            await fs.remove(file.path)

            return { message: 'File uploaded successfully' };
        } catch (error) {
            console.log(error);
            return { error: 'Error uploading file' };
        }
    }

    // use for upload video
    async uploadVideo(cameraUuid: string, file: Express.Multer.File){
        try{
            const uploadPath = path.join(__dirname, '..', '..', '..', 'cameras', cameraUuid,"video", file.originalname.split(".")[0]);
            await fs.ensureDir(uploadPath);
            const filePath = path.join(uploadPath, file.originalname);
            
            const fileExists = await fs.pathExists(filePath);
            if (fileExists) {
                // If file existed, overwrite
                // await fs.copyFile(file.path, filePath, { overwrite: true });
                await fs.remove(filePath); // Delete old file
                await fs.move(file.path, filePath);
            } else {
                // Else, move the file into the directory
                
                await fs.move(file.path, filePath);
            }
            const mp4Path = path.join(uploadPath, `${file.originalname.split(".")[0]}.mp4`);
            this.convertToMp4(filePath,mp4Path)
            this.logger.log(`Video ${file.originalname.split(".")[0]} uploaded`)
            ffmpeg()
                .input(filePath)
                .screenshots({ 
                    timestamps: [2.0],
                    filename: `${file.originalname.split(".")[0]}.jpg`,
                    folder: uploadPath,
                },)
                .on("end",async ()=>{
                    this.logger.log("Get thumbnail from video done")
                    this.logger.log("Clean temporary file")
                    await fs.remove(file.path)
                    await fs.remove(filePath)
                })
                .on("error",(error)=>{
                    this.logger.log("error here")
                })
            
            return { message: 'File uploaded successfully' };

        }catch(error){
            this.logger.error(error);
            return { error: 'Error uploading file' };
        }
    }




    


    async verifyApiKey(){
        //TODO: implements later    
    }


    private convertToMp4(videoPath: string, savePath: string){
        ffmpeg(videoPath, {timeout:432000}).addOptions([
            // "-c:v libvpx",
            "-c:v libx264",
            "-b:v 1M",
            "-level 3.0",
            "-f mp4"
        ]).output(savePath).on("end",()=>{
            this.logger.log("Video converted to HLS")
        }).
        on("error",(error)=>{
            console.log(error)
        })
        .run()
    }

    private createApiKey(): string{
        const apiKey = generateApiKey({method: "string", min: 8, max: 20}).toString();
        return apiKey;
    }


}
