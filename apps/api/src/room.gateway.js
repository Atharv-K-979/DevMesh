import {
  WebSocketGateway,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  WebSocketServer,
} from '@nestjs/websockets';
import { SocketActions } from '@devmesh/shared-types';
import { randomUUID } from 'crypto';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class RoomGateway {
  @WebSocketServer()
  server;

  userSocketMap = {};
  socketRoomMap = {};
  roomChatHistory = new Map();

  handleConnection(client) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client) {
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

      const leaveSystemMsg = {
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
      const history = this.roomChatHistory.get(roomId);
      history.push(leaveSystemMsg);
      if (history.length > 100) history.shift();

      this.server.in(roomId).emit(SocketActions.CHAT_BROADCAST, leaveSystemMsg);
    }

    console.log(`Client disconnected: ${client.id}`);
  }

  getAllConnectedClients(roomId, excludeSocketId) {
    const room = this.server.sockets.adapter.rooms.get(roomId);
    if (!room) return [];

    const rawClients = Array.from(room)
      .filter((socketId) => socketId !== excludeSocketId && !!this.userSocketMap[socketId])
      .map((socketId) => ({
        socketId,
        username: this.userSocketMap[socketId],
      }));

    // Deduplicate by username so participants are unique in active list
    const uniqueMap = new Map();
    for (const client of rawClients) {
      uniqueMap.set(client.username, client);
    }
    return Array.from(uniqueMap.values());
  }

  @SubscribeMessage(SocketActions.JOIN)
  handleJoin(@ConnectedSocket() client, @MessageBody() payload) {
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

    const joinSystemMsg = {
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
    const history = this.roomChatHistory.get(roomId);
    history.push(joinSystemMsg);
    if (history.length > 100) history.shift();

    this.server.in(roomId).emit(SocketActions.CHAT_BROADCAST, joinSystemMsg);

    // Deliver chat history to newly joined user
    client.emit(SocketActions.CHAT_HISTORY, { messages: history });
  }

  @SubscribeMessage(SocketActions.CHAT_SEND)
  handleChatMessage(@ConnectedSocket() client, @MessageBody() payload) {
    const { roomId, content, senderName } = payload;

    const chatMsg = {
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
    const history = this.roomChatHistory.get(roomId);
    history.push(chatMsg);
    if (history.length > 100) history.shift();

    this.server.in(roomId).emit(SocketActions.CHAT_BROADCAST, chatMsg);
  }

  @SubscribeMessage(SocketActions.CURSOR_MOVE)
  handleCursorMove(@ConnectedSocket() client, @MessageBody() payload) {
    client.to(payload.roomId).emit(SocketActions.CURSOR_MOVE, payload);
  }

  @SubscribeMessage(SocketActions.USER_ROLE_CHANGE)
  handleRoleChange(@ConnectedSocket() client, @MessageBody() payload) {
    this.server.in(payload.roomId).emit(SocketActions.USER_ROLE_CHANGE, payload);
  }

  @SubscribeMessage(SocketActions.RECORDING_NOTIFY)
  handleRecordingNotify(@ConnectedSocket() client, @MessageBody() payload) {
    this.server.in(payload.roomId).emit(SocketActions.RECORDING_NOTIFY, payload);
  }

  @SubscribeMessage(SocketActions.USER_MUTE)
  handleUserMute(@ConnectedSocket() client, @MessageBody() payload) {
    this.server.in(payload.roomId).emit(SocketActions.USER_MUTE, payload);
  }

  @SubscribeMessage(SocketActions.USER_KICK)
  handleUserKick(@ConnectedSocket() client, @MessageBody() payload) {
    this.server.in(payload.roomId).emit(SocketActions.USER_KICK, payload);
    const targetClient = this.server.sockets.sockets.get(payload.targetSocketId);
    if (targetClient) {
      targetClient.leave(payload.roomId);
    }
  }
}
