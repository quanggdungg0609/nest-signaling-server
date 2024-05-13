import {
    Body,
    Controller,
    HttpCode,
    HttpStatus,
    Logger,
    ParseFilePipeBuilder,
    Post,
    Put,
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from "@nestjs/common";

import { CameraRegDto } from "../DTO";
import { CameraService } from "../services/camera.service";
import { CameraModifyDto } from "../DTO/camera_modify.dto";
import { FileInterceptor } from "@nestjs/platform-express";
import { CameraGuard } from "../guards/camera.guard";
import {
    ApiBody,
    ApiConsumes,
    ApiOperation,
    ApiResponse,
    ApiTags,
} from "@nestjs/swagger";

//TODO: add api key auth in the future
@ApiTags("Camera APIs")
@Controller("api/cameras")
export class CameraController {
    private logger = new Logger(CameraController.name);

    constructor(private readonly cameraService: CameraService) {}

    @Post("register")
    @HttpCode(HttpStatus.CREATED)
    @ApiOperation({ summary: "Register camera" })
    @ApiResponse({
        status: 201,
        description: "The camera are registered",
    })
    @ApiResponse({
        status: 409,
        description: "The camera existed",
    })
    @ApiResponse({
        status: 500,
        description: "Internal Server Error",
    })
    @ApiResponse({
        status: 400,
        description: "Bad request",
    })
    @ApiBody({
        type: CameraRegDto,
        description: "Necessary camera information",
    })
    register(@Body() dto: CameraRegDto) {
        try {
            return this.cameraService.register(dto);
        } catch (exception) {
            throw exception;
        }
    }

    @Put("modifyInfo")
    @UseGuards(CameraGuard)
    modifyInfo(@Body() dto: CameraModifyDto) {
        this.logger.debug(dto);
        return { test: "test" };
    }

    @Post("upload-thumbnail")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Upload camera thumbnail" })
    @ApiConsumes("multipart/form-data")
    @ApiBody({
        required: true,
        schema: {
            type: "object",
            properties: {
                file: {
                    type: "string",
                    format: "binary",
                },
            },
        },
    })
    @ApiResponse({
        status: 200,
        description: "Image Uploaded",
    })
    @ApiResponse({
        status: 422,
        description: "Image is not valid",
    })
    @ApiResponse({
        status: 500,
        description: "Internal Server Error",
    })
    @UseInterceptors(FileInterceptor("file"))
    async uploadThumbnail(
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({ fileType: "image/jpeg" })
                .build({
                    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                }),
        )
        file,
    ) {
        return this.cameraService.uploadThumbnail(file);
    }

    @Post("upload-image")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Upload image taked by camera" })
    @ApiConsumes("multipart/form-data")
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
        },
    })
    @ApiResponse({
        status: 200,
        description: "Image Uploaded",
    })
    @ApiResponse({
        status: 422,
        description: "Image is not valid",
    })
    @ApiResponse({
        status: 500,
        description: "Internal Server Error",
    })
    @UseInterceptors(FileInterceptor("file"))
    async uploadImage(
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({ fileType: "image/jpeg" })
                .build({
                    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                }),
        )
        file,
        @Body("camera-uuid") cameraUuid: string,
    ) {
        return this.cameraService.uploadImage(file, cameraUuid);
    }

    @Post("upload-video")
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: "Upload video taked by camera" })
    @ApiConsumes("multipart/form-data")
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
        },
    })
    @ApiResponse({
        status: 200,
        description: "Image Uploaded",
    })
    @ApiResponse({
        status: 422,
        description: "Image is not valid",
    })
    @ApiResponse({
        status: 500,
        description: "Internal Server Error",
    })
    @UseInterceptors(FileInterceptor("file"))
    async uploadVideo(
        @UploadedFile(
            new ParseFilePipeBuilder()
                .addFileTypeValidator({ fileType: "video/webm" })
                .build({
                    errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
                }),
        )
        file: Express.Multer.File,
        @Body("camera-uuid") cameraUuid: string,
    ) {
        return this.cameraService.uploadVideo(cameraUuid, file);
    }
}
