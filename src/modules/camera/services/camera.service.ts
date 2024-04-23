import { Model } from 'mongoose';
import { HttpException, HttpStatus, Injectable, InternalServerErrorException, Logger, NotFoundException} from '@nestjs/common';
import { generateApiKey } from 'generate-api-key';
import * as argon from "argon2";
import * as path from 'path';
import * as fs from 'fs-extra';

import { CameraRegDto } from '../DTO';
import { InjectModel } from '@nestjs/mongoose';
import { Camera } from '../schemas/camera.schema';
import { CameraModifyDto } from '../DTO/camera_modify.dto';




@Injectable()
export class CameraService {
    private readonly logger = new Logger(CameraService.name);

    constructor(
        @InjectModel(Camera.name) private readonly cameraModel: Model<Camera>,
    ){}


    async register(dto: CameraRegDto){
        const { macAddr, name, location} = dto;
        
        try{
            const found = await this.cameraModel.findOne({
                macAddr: macAddr
            });
            if(found){
                throw new HttpException("Camera existed", HttpStatus.CONFLICT);
            }

            const apiKey = this.createApiKey();
            const hash = await argon.hash(apiKey);
            await this. cameraModel.create({
                macAddr: macAddr,
                apiKey: hash,
                name: name,
                location: location
            });
            let a = "aaaaaa"
            a.split("")
            this.logger.log("New Camera added")
            return { apiKey: apiKey };
        }catch (exception){
            this.logger.error(exception, exception.stack)
            throw exception instanceof HttpException ? exception : new InternalServerErrorException();
        }
    }


    // use for
    async uploadImage(file?: Express.Multer.File){
        try {
            const uploadPath = path.join(__dirname, '..', '..', '..', 'cameras', 'images');
            console.log(uploadPath)
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
            console.log(error)
            return { error: 'Error uploading file' };
        }
    }

    async getThumbnail(imageName: string){
        const imagePath = path.join(__dirname, '..', '..', '..', 'cameras', 'images', imageName+".jpeg")
        if (!fs.existsSync(imagePath)) {
            throw new NotFoundException('Không tìm thấy hình ảnh');
        }

        return imagePath
    }
    private createApiKey(): string{
        const apiKey = generateApiKey({method: "string", min: 8, max: 20}).toString();
        return apiKey;
    }


}
