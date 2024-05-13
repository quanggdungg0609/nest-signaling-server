import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { HydratedDocument } from "mongoose";
import * as mongoose from "mongoose";
import { User } from "src/modules/user/entities/user.entity";

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

@Schema({ timestamps: true, collection: "refresh_token" })
export class RefreshToken {
    @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
    userId: User;

    @Prop({ required: true, unique: true })
    refreshToken: string;

    @Prop({ required: true })
    userAgent: string;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);
