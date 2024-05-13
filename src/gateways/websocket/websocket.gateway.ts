import { Logger, UseGuards } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
    SubscribeMessage,
    WebSocketGateway,
    OnGatewayInit,
    OnGatewayConnection,
    OnGatewayDisconnect,
    WebSocketServer,
} from "@nestjs/websockets";
import { Model } from "mongoose";
import { User } from "src/modules/user/entities/user.entity";
import { RefreshToken } from "src/modules/auth/entities/tokens.entity";
import { WebSocketServer as Server, WebSocket } from "ws";
import * as argon from "argon2";
import { Camera } from "src/modules/camera/schemas/camera.schema";
import { ConfigService } from "@nestjs/config";

// TODO: implements this gateway later

interface UserInfo {
    uuid: string;
    username: string;
    role: string;
}

interface CameraInfo {
    uuid: string;
    name: string;
    location: string;
}

interface Data {
    event: string;
    uuid: string;
    payload: any;
}

@WebSocketGateway(3030, {
    cors: {
        origin: "*",
    },
})
export class WebsocketGateway
    implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
    private readonly logger = new Logger(WebSocketGateway.name);
    private cameras: Map<WebSocket, CameraInfo> = new Map<
        WebSocket,
        CameraInfo
    >();
    private users: Map<WebSocket, UserInfo> = new Map<WebSocket, UserInfo>();

    constructor(
        @InjectModel(User.name) private userModel: Model<User>,
        @InjectModel(RefreshToken.name) private tokenModel: Model<RefreshToken>,
        @InjectModel(Camera.name) private cameraModel: Model<Camera>,
        private readonly config: ConfigService,
    ) {}

    @WebSocketServer() server: Server;

    afterInit() {
        this.logger.log("Initialized Websocket Server");
    }

    async handleConnection(client: any, ...args: any[]) {
        this.logger.log(`${client._socket.address().address} - has connected`);
        console.log(args);
        //
        // get kHeaders Symbol
        // if (!await this.verifyApiKeyOrJwt(args)){
        //   client.send(JSON.stringify({
        //     event:"Error",
        //     data:"Unauthorized"
        //   }))
        //   client.terminate()
        // }
        // this.server.clients.forEach(client => {
        //   client.send(JSON.stringify({"event":"hello", "payload":"hello"}))
        // })
    }

    handleDisconnect(client: WebSocket) {
        // find if the user disconnect
        let userUuid: string | undefined;
        let cameraUuid: string | undefined;

        this.users.forEach((user: UserInfo, key: WebSocket) => {
            if (key === client) {
                userUuid = user.uuid;

                this.cameras.forEach((camera: CameraInfo, ws: WebSocket) => {
                    ws.send(
                        JSON.stringify({
                            event: "user-disconnect",
                            data: {
                                uuid: user.uuid,
                            },
                        }),
                    );
                });
            }
        });

        this.cameras.forEach((camera: CameraInfo, key: WebSocket) => {
            // find and notice all user a camera disconnect
            if (key === client) {
                cameraUuid = camera.uuid;
                this.users.forEach((user: UserInfo, ws: WebSocket) => {
                    ws.send(
                        JSON.stringify({
                            event: "camera-disconnect",
                            data: {
                                uuid: camera.uuid,
                            },
                        }),
                    );
                });
            }
        });

        if (userUuid !== undefined) {
            this.users.delete(client);
        }

        if (cameraUuid !== undefined) {
            this.cameras.delete(client);
        }

        if (userUuid === undefined && cameraUuid === undefined) {
            this.logger.log("Undefined client disconnect");
        } else if (userUuid !== undefined || cameraUuid !== undefined) {
            this.logger.log(
                `${userUuid ? "User [" + userUuid + "]" : "Camera [" + cameraUuid + "]"} - has disconnected`,
            );
        }
    }

    @SubscribeMessage("user-connect")
    handleUserConnect(client: WebSocket, data: any) {
        let newUser: UserInfo = {
            uuid: data.uuid,
            username: data.username,
            role: data.role,
        };
        this.users.set(client, newUser);
        this.logger.log(`User [${newUser.uuid}] connected`);

        //after save the users, send uuid new users connected to all camera
        this.cameras.forEach((camera: CameraInfo, key: WebSocket) => {
            key.send(
                JSON.stringify({
                    event: "user-connect",
                    data: {
                        uuid: newUser.uuid,
                    },
                }),
            );
        });
    }

    @SubscribeMessage("camera-connect")
    handleCameraConnect(client: WebSocket, data: any) {
        let newCamera: CameraInfo = {
            uuid: data.uuid,
            name: data.name,
            location: data.location,
        };
        this.cameras.set(client, newCamera);
        this.logger.log(`Camera [${newCamera.uuid}] connected`);
        this.users.forEach((user: UserInfo, key: WebSocket) => {
            key.send(
                JSON.stringify({
                    event: "camera-connect",
                    data: {
                        uuid: newCamera.uuid,
                        name: newCamera.name,
                        location: newCamera.location,
                    },
                }),
            );
        });
    }

    @SubscribeMessage("request-list-users")
    handleRequestListUsers(client: WebSocket, data: any) {
        this.authCameraAndDoAction(client, () => {
            let listUsers = Array.from(this.users.values()).map((user) => ({
                uuid: user.uuid,
            }));
            client.send(
                JSON.stringify({
                    event: "response-list-users",
                    data: listUsers,
                }),
            );
        });
    }

    @SubscribeMessage("request-list-cameras")
    handleRequestListCameras(client: WebSocket, data: any) {
        this.authUserAndDoAction(client, () => {
            let listCameras = Array.from(this.cameras.values()).map(
                (camera) => ({
                    uuid: camera.uuid,
                    name: camera.name,
                    location: camera.location,
                }),
            );
            client.send(
                JSON.stringify({
                    event: "response-list-cameras",
                    data: listCameras,
                }),
            );
        });
    }

    @SubscribeMessage("offer-sd")
    handleOfferSD(
        client: WebSocket,
        data: { uuid: string; to: string; type: string; sdp: string },
    ) {
        const cameraSocket = this.findCameraByUuid(data.to);
        if (cameraSocket) {
            const payload = {
                from: data.uuid,
                type: data.type,
                sdp: data.sdp,
            };
            cameraSocket.send(
                JSON.stringify({
                    event: "offer-sd",
                    data: payload,
                }),
            );
        } else {
            client.send(
                JSON.stringify({
                    event: "error",
                    data: "Camera not found",
                }),
            );
        }
    }

    @SubscribeMessage("answer-sd")
    handleAnswerSD(
        client: WebSocket,
        data: { uuid: string; to: string; type: string; sdp: string },
    ) {
        const userSocket = this.findUserByUuid(data.to);
        if (userSocket) {
            const payload = {
                from: data.uuid,
                type: data.type,
                sdp: data.sdp,
            };
            userSocket.send(
                JSON.stringify({
                    event: "answer-sd",
                    data: payload,
                }),
            );
        } else {
            client.send(
                JSON.stringify({
                    event: "error",
                    data: "User not found",
                }),
            );
        }
    }

    @SubscribeMessage("ice-candidate")
    handleIceCandidate(client: WebSocket, data: { uuid: string; to: string }) {
        // TODO: Need to implement
    }

    private authCameraAndDoAction(
        userSocket: WebSocket,
        onAuthorized: () => void,
    ): void {
        if (!this.cameras.has(userSocket)) {
            userSocket.send(
                JSON.stringify({
                    event: "error",
                    data: "Camera unauthorized",
                }),
            );
            userSocket.terminate();
        } else {
            onAuthorized();
        }
    }

    private authUserAndDoAction(
        userSocket: WebSocket,
        onAuthorized: () => void,
    ): void {
        if (!this.users.has(userSocket)) {
            userSocket.send(
                JSON.stringify({
                    event: "error",
                    data: " User unauthorized",
                }),
            );
            userSocket.terminate();
        } else {
            onAuthorized();
        }
    }

    private findCameraByUuid(uuid: string): WebSocket | undefined {
        for (const [key, camera] of this.cameras) {
            if (camera.uuid === uuid) {
                return key;
            }
        }
        return undefined;
    }

    private findUserByUuid(uuid: string): WebSocket | undefined {
        for (const [key, user] of this.users) {
            if (user.uuid === uuid) {
                return key;
            }
        }
        return undefined;
    }

    // private async verifyApiKeyOrJwt(args: any[]):Promise<Boolean>{
    //   /*
    //   * get Api Key or JWT in headers and verify
    //   */

    //   const kHeadersSymbol = Object.getOwnPropertySymbols(args[0]).find(symbol=>symbol.toString()==="Symbol(kHeaders)")

    //   // If a camera, api-key exists
    //   if(args[0][kHeadersSymbol]["api-key"]){
    //     console.log(args[0][kHeadersSymbol]["api-key"])
    //     const salt = this.config.get<string>("SALT_APIKEY")
    //     const hashApiKey = await argon.hash(args[0][kHeadersSymbol]["api-key"],{
    //       salt: Buffer.from(salt, "utf-8")
    //     })
    //     const camera = await this.cameraModel.findOne({apiKey:hashApiKey})
    //     if(camera){
    //       return true
    //     }
    //   }

    //   // If users, jwt bearer exists
    //   if(args[0][kHeadersSymbol]["authorization"]){
    //     //TODO: implement this features soon
    //   }
    //   return true
    // }
}
