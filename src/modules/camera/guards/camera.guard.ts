import { CanActivate, ExecutionContext, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Request } from 'express';
import { Observable } from 'rxjs';
import { Camera } from '../schemas/camera.schema';
import { Model } from 'mongoose';
import * as argon from  "argon2";
import { ConfigService } from '@nestjs/config';


@Injectable()
export class CameraGuard implements CanActivate {
  private  logger = new Logger(CameraGuard.name)

  constructor(
    @InjectModel(Camera.name)private readonly cameraModel: Model<Camera>,
    private readonly config: ConfigService,
  ){}

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const request = context.switchToHttp().getRequest() as Request
    const  apiKey  = (request.headers as Object)["api-key"]
    const salt = this.config.get<string>("SALT_APIKEY")
    const hash = argon.hash(apiKey,{
      salt: Buffer.from(salt, "utf-8")
    })
    return true;
  }
}
