import { Model } from 'mongoose';
import { HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import { generateApiKey } from 'generate-api-key';
import * as argon from "argon2";
import * as path from 'path';
import * as fs from 'fs-extra';
import * as ffmpeg from "fluent-ffmpeg";

import { CameraRegDto } from '../DTO';
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
            this.logger.error(exception, exception.stack)
            throw exception instanceof HttpException ? exception : new InternalServerErrorException();
        }
    }


    // use for upload video
    async uploadThumnail(file?: Express.Multer.File){
        try {
            const uploadPath = path.join(__dirname, '..', '..', '..', 'cameras', 'thumbnail');
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
            return { message: 'File uploaded successfully' };
        } catch (error) {
            // Xử lý lỗi nếu có
            console.log(error);
            return { error: 'Error uploading file' };
        }
    }

    async uploadVideo(cameraUuid: string, file?: Express.Multer.File){
        try{
            const uploadPath = path.join(__dirname, '..', '..', '..', 'cameras', "video", cameraUuid, file.originalname.split(".")[0]);
            await fs.ensureDir(uploadPath);
            // Verify if file existed
            const filePath = path.join(uploadPath, file.originalname);
            const fileExists = await fs.pathExists(filePath);
            console.log(filePath)
            if (fileExists) {
                // If file existed, overwrite
                // await fs.copyFile(file.path, filePath, { overwrite: true });
                await fs.remove(filePath); // Delete old file
                await fs.move(file.path, filePath);
            } else {
                // Else, move the file into the directory
                await fs.move(file.path, filePath);
            }
            this.logger.log(`video ${file.originalname} uploaded`)

            ffmpeg()
                .input(filePath)
                .screenshots({ 
                    timestamps: [2.0],
                    filename: `${file.originalname.split(".")[0]}.jpg`,
                    folder: uploadPath,
                },)
                .on("end",()=>{
                    this.logger.log("Get thumnail from video done")
                })
            return { message: 'File uploaded successfully' };

        }catch(error){
            console.log(error);
            return { error: 'Error uploading file' };
        }
    }

    async getThumbnail(imageName: string){
        const imagePath = path.join(__dirname, '..', '..', '..', 'cameras', 'thumbnail', imageName+".jpeg")
        if (!fs.existsSync(imagePath)) {
            throw new NotFoundException('Image not found');
        }
        return imagePath
    }

    async verifyApiKey(){
        
    }


    private createApiKey(): string{
        const apiKey = generateApiKey({method: "string", min: 8, max: 20}).toString();
        return apiKey;
    }


}
