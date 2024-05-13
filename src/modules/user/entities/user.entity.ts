import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import * as mongoose from "mongoose";
import { Camera } from "../../camera/schemas/camera.schema";
import { RefreshToken } from "../../auth/entities/tokens.entity";

export type UserDocument = HydratedDocument<User>;

@Schema({ timestamps: true, collection: "users" })
export class User {
    @Prop({ required: true, unique: true })
    userName: string;

    @Prop({ required: true })
    password: string;

    @Prop({ required: true })
    role: string;

    @Prop()
    firstName: string;

    @Prop()
    lastName: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Camera" }] })
    accessCameras: Camera[];

    @Prop({
        type: [{ type: mongoose.Schema.Types.ObjectId, ref: "RefreshToken" }],
    })
    tokens: RefreshToken[];
}

export const UserSchema = SchemaFactory.createForClass(User);
