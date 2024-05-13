import {
    Controller,
    Get,
    Header,
    HttpCode,
    Logger,
    NotFoundException,
    Param,
    Res,
    Headers,
    HttpStatus,
    InternalServerErrorException,
    Query,
    DefaultValuePipe,
    ParseIntPipe,
} from "@nestjs/common";
import {
    ApiOperation,
    ApiParam,
    ApiQuery,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";
import { Response } from "express";
import { createReadStream, statSync } from "fs";

import { FilesService } from "../services/files.service";

import {
    GetThumbnailVideoDto,
    GetThumbnailImageDto,
    GetVideoNamesDto,
} from "../DTOs";
import { GetVideoStreamDto } from "../DTOs/get_video_stream.dto";

@ApiTags("Files APIs")
@Controller("api/files")
export class FilesController {
    private logger = new Logger(FilesController.name);
    constructor(private readonly filesService: FilesService) {}

    @Get("get-video-names/:cameraUuid")
    @HttpCode(200)
    @ApiOperation({ summary: "Get list of video with pagination" })
    @ApiParam({
        name: "camaraUuid",
        description: "UUID of the camera",
        type: "string",
        example: "b22f742e-50e4-4fc0-8cc5-1ff86f7b8881",
    })
    @ApiQuery({
        name: "page",
        description: "Number of page(Default: 1)",
        example: "2",
    })
    @ApiQuery({
        name: "limit",
        description: "Number of result return(Default:10)",
        example: "1",
    })
    async getVideoNames(
        @Param() dto: GetVideoNamesDto,
        @Query("limit", new DefaultValuePipe(1), ParseIntPipe) limit: number,
        @Query("page", new DefaultValuePipe(1), ParseIntPipe) page: number,
    ) {
        try {
            const result = await this.filesService.getVideoNames(
                dto.cameraUuid,
                page,
                limit,
            );

            return result;
        } catch (exception) {
            throw exception;
        }
    }

    @Get("get-thumbnail/:cameraUuid")
    @HttpCode(200)
    @ApiOperation({
        summary: "Get camera thumbnail with the camera uuid given",
    })
    @ApiResponse({
        status: 200,
        description: "Get thumbnail successful",
    })
    @ApiResponse({
        status: 404,
        description: "Thumbnail not found",
    })
    async getThumbnail(
        @Param("camaraUuid") dto: GetThumbnailImageDto,
        @Res() res: Response,
    ) {
        try {
            const imgPath = await this.filesService.getThumbnail(
                dto.cameraUuid,
            );
            res.sendFile(imgPath);
            return;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }
            throw error;
        }
    }

    @Get("get-thumbnail-video/:cameraUuid/:imageName")
    @HttpCode(200)
    @ApiOperation({ summary: "Get video thumbnail with the camera uuid given" })
    @ApiResponse({
        status: 200,
        description: "Get video thumbnail successful",
    })
    @ApiResponse({
        status: 404,
        description: "Video thumbnail not found",
    })
    async getThumbnailVideo(
        @Param() getThumbnailDto: GetThumbnailVideoDto,
        @Res() res: Response,
    ) {
        const { cameraUuid, imageName } = getThumbnailDto;
        try {
            const imgPath = await this.filesService.getThumbnailVideo(
                cameraUuid,
                imageName,
            );
            res.sendFile(imgPath);
            return;
        } catch (error) {
            if (error instanceof NotFoundException) {
                throw new NotFoundException(error.message);
            }
            throw error;
        }
    }

    @Get("stream/:cameraUuid/:videoName")
    @Header("Accept-Ranges", "bytes")
    @Header("Access-Control-Allow-Origin", "*")
    @Header("Content-Type", "video/mp4")
    @ApiOperation({
        summary:
            "Get video stream with the name of video and the uuid of camera ",
    })
    @ApiResponse({
        status: 200,
        description: "Get video stream successful",
        content: {
            "video/mp4": {},
        },
    })
    @ApiResponse({
        status: 404,
        description: "Video not found",
    })
    @ApiResponse({
        status: 400,
        description: "Bad request",
    })
    @ApiResponse({
        status: 500,
        description: "Internal Server Error",
    })
    @ApiParam({
        name: "videoName",
        description: "Name of video",
        type: "string",
        example: "152105_01052024",
    })
    @ApiParam({
        name: "cameraUuid",
        description: "UUID of the camera",
        type: "string",
        example: "a9f0cef0-68cf-43dc-a3a8-5242212cb330",
    })
    async getStreamVideo(
        @Param() dto: GetVideoStreamDto,
        @Headers() headers,
        @Res() res: Response,
    ) {
        try {
            const videoPath = this.filesService.getVideoPath(
                dto.cameraUuid,
                dto.videoName,
            );
            const { size } = statSync(videoPath);
            const videoRange = headers.range;

            if (videoRange) {
                const parts = videoRange.replace(/bytes=/, "").split("-");
                const start = parseInt(parts[0], 10);
                const end = parts[1] ? parseInt(parts[1], 10) : size - 1;
                const chunkSize = end - start + 1;
                const readStreamfile = createReadStream(videoPath, {
                    start,
                    end,
                    highWaterMark: 60,
                });
                const head = {
                    "Content-Range": `bytes ${start}-${end}/${size}`,
                    "Content-Length": chunkSize,
                };
                res.writeHead(HttpStatus.PARTIAL_CONTENT, head); //206
                readStreamfile.pipe(res);
            } else {
                const head = {
                    "Content-Length": size,
                };
                res.writeHead(HttpStatus.OK, head);
                createReadStream(videoPath).pipe(res);
            }
            return;
        } catch (exception) {
            if (exception instanceof NotFoundException) {
                throw exception;
            } else {
                throw new InternalServerErrorException();
            }
        }
    }
}
