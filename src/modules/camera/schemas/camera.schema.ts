import {Prop, Schema, SchemaFactory} from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import * as mongoose from 'mongoose';
import { User } from "../../user/entities/user.entity";


export type CameraDocument = HydratedDocument<Camera>;

@Schema({timestamps: true, collection: "cameras"})
export class Camera{
    @Prop({required: true})
    uuid: string;

    @Prop({required: true})
    apiKey: string;

    @Prop({required: true})
    name: string;

    @Prop({})
    location: string;

    @Prop({type:[{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]})
    accessUsers: User[]
}

export const CameraSchema = SchemaFactory.createForClass(Camera);