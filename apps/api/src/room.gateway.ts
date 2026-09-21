import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import {
  SocketActions,
  JoinPayload,
  ClientInfo,
} from '@devmesh/shared-types';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  protected userSocketMap: Record<string, string> = {};
  protected socketRoomMap: Record<string, string> = {};

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    const username = this.userSocketMap[client.id];
    const roomId = this.socketRoomMap[client.id];
    delete this.userSocketMap[client.id];
    delete this.socketRoomMap[client.id];

    if (roomId && username) {
      const updatedClients = this.getAllConnectedClients(roomId, client.id);

      this.server.in(roomId).emit(SocketActions.DISCONNECTED, {
        socketId: client.id,
        username,
        clients: updatedClients,
      });

      this.onUserLeftRoom(roomId, username, client.id);
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  protected getAllConnectedClients(roomId: string, excludeSocketId?: string): ClientInfo[] {
    const room = this.server.sockets.adapter.rooms.get(roomId);
    if (!room) return [];

    const rawClients: ClientInfo[] = Array.from(room)
      .filter((socketId) => socketId !== excludeSocketId && !!this.userSocketMap[socketId])
      .map((socketId) => ({
        socketId,
        username: this.userSocketMap[socketId],
      }));

    // Deduplicate by username so each participant appears once in the active roster
    const uniqueMap = new Map<string, ClientInfo>();
    for (const client of rawClients) {
      uniqueMap.set(client.username, client);
    }
    return Array.from(uniqueMap.values());
  }

  @SubscribeMessage(SocketActions.JOIN)
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinPayload,
  ) {
    const { roomId, username } = payload;
    this.userSocketMap[client.id] = username;
    this.socketRoomMap[client.id] = roomId;
    client.join(roomId);

    const clients = this.getAllConnectedClients(roomId);

    // Broadcast updated participant roster to all room members
    this.server.in(roomId).emit(SocketActions.JOINED, {
      clients,
      username,
      socketId: client.id,
    });

    this.onUserJoinedRoom(roomId, username, client);
  }

  @SubscribeMessage(SocketActions.LEAVE)
  handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const roomId = payload?.roomId || this.socketRoomMap[client.id];
    const username = this.userSocketMap[client.id];

    if (roomId) {
      client.leave(roomId);
      delete this.socketRoomMap[client.id];

      const updatedClients = this.getAllConnectedClients(roomId, client.id);
      this.server.in(roomId).emit(SocketActions.DISCONNECTED, {
        socketId: client.id,
        username: username || 'Anonymous',
        clients: updatedClients,
      });

      if (username) {
        this.onUserLeftRoom(roomId, username, client.id);
      }
    }
  }

  // Lifecycle hooks extensible by chat/controls layer
  protected onUserJoinedRoom(roomId: string, username: string, client: Socket) {}
  protected onUserLeftRoom(roomId: string, username: string, socketId: string) {}
}
