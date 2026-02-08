import { Express } from 'express';
import { Server as SocketIOServer } from 'socket.io';
declare const app: Express;
declare const io: SocketIOServer<import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, import("socket.io").DefaultEventsMap, any>;
export { app, io };
//# sourceMappingURL=server.d.ts.map