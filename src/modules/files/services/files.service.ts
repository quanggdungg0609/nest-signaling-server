import {
    Injectable,
    InternalServerErrorException,
    Logger,
    NotFoundException,
} from "@nestjs/common";
import * as path from "path";
import * as fs from "fs-extra";
import * as ffmpeg from "fluent-ffmpeg";
import * as ffmpegInstaller from "@ffmpeg-installer/ffmpeg";

import { statSync, createReadStream } from "fs";

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

@Injectable()
export class FilesService {
    private readonly logger = new Logger(FilesService.name);

    async getVideoNames(
        cameraUuid: string,
        page: number = 1,
        limit: number = 10,
    ): Promise<{
        videoNames: string[];
        currentPage: number;
        nextPage: number;
        previousPage: number | null;
        totalPages: number;
    }> {
        try {
            console.log(cameraUuid);
            const cameraPath = path.join(
                __dirname,
                "..",
                "..",
                "..",
                "cameras",
                cameraUuid,
                "video",
            );
            const cameraExists = await fs.promises
                .stat(cameraPath)
                .then(() => true)
                .catch(() => false);

            if (!cameraExists) {
                throw new NotFoundException("Camera not found");
            }

            const entries = await fs.promises.readdir(cameraPath, {
                withFileTypes: true,
            });

            const directoryNames = entries
                .filter((entry) => entry.isDirectory())
                .map((entry) => entry.name);

            // pagination
            const totalPages = directoryNames.length;

            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedNames = directoryNames.slice(startIndex, endIndex);

            const currentPage = page;
            const nextPage =
                currentPage * limit < directoryNames.length
                    ? currentPage + 1
                    : null;
            const previousPage = currentPage > 1 ? currentPage - 1 : null;

            return {
                videoNames: paginatedNames,
                currentPage: currentPage,
                nextPage: nextPage,
                previousPage: previousPage,
                totalPages: totalPages,
            };
        } catch (exception) {
            this.logger.error(exception);
            if (exception instanceof NotFoundException) {
                throw exception;
            }
            throw new InternalServerErrorException();
        }
    }

    async getThumbnail(cameraUuid: string) {
        const imagePath = path.join(
            __dirname,
            "..",
            "..",
            "..",
            "cameras",
            cameraUuid,
            "thumbnail",
            cameraUuid + ".jpeg",
        );
        if (!fs.existsSync(imagePath)) {
            throw new NotFoundException("Image not found");
        }
        return imagePath;
    }

    async getThumbnailVideo(cameraUuid: string, imageName: string) {
        const imagePath = path.join(
            __dirname,
            "..",
            "..",
            "..",
            "cameras",
            cameraUuid,
            "video",
            imageName,
            imageName + ".jpeg",
        );
        if (!fs.existsSync(imagePath)) {
            throw new NotFoundException("Image not found");
        }
        return imagePath;
    }

    getVideoPath(cameraUuid: string, videoName: string) {
        const videoPath = path.join(
            __dirname,
            "..",
            "..",
            "..",
            "cameras",
            cameraUuid,
            "video",
            videoName,
            videoName + ".mp4",
        );
        if (!fs.existsSync(videoPath)) {
            throw new NotFoundException("Video not found");
        }
        return videoPath;
    }

    // async convertToHLS(cameraUuid: string, videoName: string){
    //     const videoPath = path.join(__dirname, '..', '..', '..', 'cameras', cameraUuid, "video", videoName, videoName+".mp4");
    //     const fileExists = await fs.pathExists(videoPath);
    //     if(fileExists){
    //         console.log(videoPath)
    //         const savePath = path.join(__dirname, '..', '..', '..', 'cameras', cameraUuid, "video", videoName, "hls")
    //         await fs.ensureDir(savePath);
    //         console.log(savePath)
    //         ffmpeg(videoPath, {timeout:432000}).addOptions([
    //             // "-c:v libvpx",
    //             // "-c:v libx264",
    //             // "-b:v 1M",
    //             "-profile:v baseline",
    //             "-level 3.0",
    //             // "-an",
    //             "-start_number 0",
    //             "-hls_time 5",
    //             "-f hls"
    //         ]).output(savePath+"/output.m3u8").on("end",()=>{
    //             this.logger.log("Video converted to HLS")
    //         }).
    //         on("error",(error)=>{
    //             console.log(error)
    //         })
    //         .run()
    //     }
    // }
}
