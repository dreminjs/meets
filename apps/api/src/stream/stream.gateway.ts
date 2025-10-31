import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway()
export class StreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger(StreamGateway.name);

  private rooms = new Map();

  handleDisconnect(client: Socket) {
    this.rooms.forEach((users, roomId) => {
      if (users.has(client.id)) {
        users.delete(client.id);

        if (users.size === 0) {
          this.rooms.delete(roomId);
        } else {
          client.to(roomId).emit('user-left', {
            userId: client.id,
            users: Array.from(users),
          });
        }
      }
    });
  }
  
  handleConnection() {
    this.logger.log('connect');
  }

  @WebSocketServer()
  server: Server | undefined;

  @SubscribeMessage('join')
  handleJoin(client: Socket, roomId: string) {
    client.rooms.forEach((room) => {
      if (room !== client.id) {
        client.leave(room);
      }
    });

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    const roomUsers = this.rooms.get(roomId);
    roomUsers.add(client.id);

    this.server!.emit('joined', {
      roomId,
      users: Array.from(roomUsers),
    });

    client.join(roomId);

    client.to(roomId).emit('joined', {
      userId: client.id,
      users: Array.from(roomUsers),
    });
  }

  @SubscribeMessage('offer')
  handleOffer(client: Socket, payload: { room: string; offer: any }) {
    client
      .to(payload.room)
      .emit('offer', { offer: payload.offer, from: client.id });
  }

  @SubscribeMessage('answer')
  handleAnswer(client: Socket, payload: { room: string; answer: any }) {
    client
      .to(payload.room)
      .emit('answer', { answer: payload.answer, from: client.id });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    client: Socket,
    payload: { room: string; candidate: any }
  ) {
    client
      .to(payload.room)
      .emit('ice-candidate', { candidate: payload.candidate, from: client.id });
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(client: Socket, roomId: string) {
    if (this.rooms.has(roomId)) {
      const roomUsers = this.rooms.get(roomId);
      roomUsers.delete(client.id);

      if (roomUsers.size === 0) {
        this.rooms.delete(roomId);
      } else {
        client.to(roomId).emit('user-left', {
          userId: client.id,
          users: Array.from(roomUsers),
        });
      }
    }
    client.leave(roomId);
  }
}
