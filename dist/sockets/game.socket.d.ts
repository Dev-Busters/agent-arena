/**
 * Game Socket.io Handlers
 * Real-time multiplayer game events
 */
import { Socket, Server as SocketIOServer } from 'socket.io';
export interface GameSocket extends Socket {
    user?: {
        id: string;
        email: string;
        username: string;
    };
    battleId?: string;
}
export declare function setupGameSockets(io: SocketIOServer): void;
//# sourceMappingURL=game.socket.d.ts.map