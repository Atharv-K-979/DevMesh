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
  SendChatMessagePayload,
  ChatMessage,
  ClientInfo,
  RoleChangePayload,
  CursorMovePayload,
} from '@devmesh/shared-types';
import { randomUUID } from 'crypto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RoomGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private userSocketMap: Record<string, string> = {};
  private socketRoomMap: Record<string, string> = {};
  private roomChatHistory: Map<string, ChatMessage[]> = new Map();

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

      const leaveSystemMsg: ChatMessage = {
        id: randomUUID(),
        roomId,
        senderId: 'system',
        senderName: 'System',
        content: `${username} left the room`,
        timestamp: Date.now(),
      };

      if (!this.roomChatHistory.has(roomId)) {
        this.roomChatHistory.set(roomId, []);
      }
      const history = this.roomChatHistory.get(roomId)!;
      history.push(leaveSystemMsg);
      if (history.length > 100) history.shift();

      this.server.in(roomId).emit(SocketActions.CHAT_BROADCAST, leaveSystemMsg);
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  private getAllConnectedClients(roomId: string, excludeSocketId?: string): ClientInfo[] {
    const room = this.server.sockets.adapter.rooms.get(roomId);
    if (!room) return [];

    const rawClients: ClientInfo[] = Array.from(room)
      .filter((socketId) => socketId !== excludeSocketId && !!this.userSocketMap[socketId])
      .map((socketId) => ({
        socketId,
        username: this.userSocketMap[socketId],
      }));

    // Deduplicate by username so participants are unique in active list
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

    // Notify all participants in room of the joined member
    this.server.in(roomId).emit(SocketActions.JOINED, {
      clients,
      username,
      socketId: client.id,
    });

    const joinSystemMsg: ChatMessage = {
      id: randomUUID(),
      roomId,
      senderId: 'system',
      senderName: 'System',
      content: `${username} joined the room`,
      timestamp: Date.now(),
    };

    if (!this.roomChatHistory.has(roomId)) {
      this.roomChatHistory.set(roomId, []);
    }
    const history = this.roomChatHistory.get(roomId)!;
    history.push(joinSystemMsg);
    if (history.length > 100) history.shift();

    this.server.in(roomId).emit(SocketActions.CHAT_BROADCAST, joinSystemMsg);

    // Deliver chat history to newly joined user
    client.emit(SocketActions.CHAT_HISTORY, { messages: history });
  }

  @SubscribeMessage(SocketActions.CHAT_SEND)
  handleChatMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendChatMessagePayload,
  ) {
    const { roomId, content, senderName } = payload;

    const chatMsg: ChatMessage = {
      id: randomUUID(),
      roomId,
      senderId: client.id,
      senderName: senderName || this.userSocketMap[client.id] || 'Anonymous',
      content,
      timestamp: Date.now(),
    };

    if (!this.roomChatHistory.has(roomId)) {
      this.roomChatHistory.set(roomId, []);
    }
    const history = this.roomChatHistory.get(roomId)!;
    history.push(chatMsg);
    if (history.length > 100) history.shift();

    this.server.in(roomId).emit(SocketActions.CHAT_BROADCAST, chatMsg);
  }

  @SubscribeMessage(SocketActions.CURSOR_MOVE)
  handleCursorMove(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CursorMovePayload,
  ) {
    client.to(payload.roomId).emit(SocketActions.CURSOR_MOVE, payload);
  }

  @SubscribeMessage(SocketActions.USER_ROLE_CHANGE)
  handleRoleChange(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: RoleChangePayload,
  ) {
    this.server.in(payload.roomId).emit(SocketActions.USER_ROLE_CHANGE, payload);
  }

  @SubscribeMessage(SocketActions.RECORDING_NOTIFY)
  handleRecordingNotify(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; username: string; action: 'start' | 'stop'; title?: string },
  ) {
    this.server.in(payload.roomId).emit(SocketActions.RECORDING_NOTIFY, payload);
  }

  @SubscribeMessage(SocketActions.USER_MUTE)
  handleUserMute(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; targetSocketId: string; targetUsername: string; mute: boolean; byUsername: string },
  ) {
    this.server.in(payload.roomId).emit(SocketActions.USER_MUTE, payload);
  }

  @SubscribeMessage(SocketActions.USER_KICK)
  handleUserKick(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; targetSocketId: string; targetUsername: string; byUsername: string },
  ) {
    this.server.in(payload.roomId).emit(SocketActions.USER_KICK, payload);
    const targetClient = this.server.sockets.sockets.get(payload.targetSocketId);
    if (targetClient) {
      targetClient.leave(payload.roomId);
    }
  }
}
