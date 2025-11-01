import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

type RTCIceCandidate = any;

@WebSocketGateway()
export class StreamGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private logger = new Logger(StreamGateway.name);

  private rooms: Map<string, Set<string>> = new Map();

  private users: Map<string, string> = new Map();

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

  @SubscribeMessage('join-room')
  handleJoin(
    client: Socket,
    { roomId, userId }: { roomId: string; userId: string }
  ) {
    this.leaveRoom(client);

    client.join(roomId);

    this.users.set(client.id, roomId);

    if (!this.rooms.has(roomId)) {
      this.rooms.set(roomId, new Set());
    }

    this.rooms.get(roomId)!.add(client.id);

    client.to(roomId).emit('user-joined', { userId, socketId: client.id });

    const roomUsers = Array.from(this.rooms.get(roomId)!).map((socketId) => ({
      socketId,
      userId: 'user-' + socketId,
    }));

    client.emit('room-users', roomUsers);
  }

  @SubscribeMessage('offer')
  handleOffer(
    client: Socket,
    data: {
      targetSocketId: string;
      // RTCSessionDescriptionInit
      offer: any;
      roomId: string;
    }
  ) {
    client.to(data.targetSocketId).emit('offer', {
      offer: data.offer,
      fromSocketId: client.id,
    });
  }

  @SubscribeMessage('answer')
  handleAnswer(
    client: Socket,
    data: {
      targetSocketId: string;
      // RTCSessionDescriptionInit
      answer: any;
    }
  ) {
    client.to(data.targetSocketId).emit('answer', {
      answer: data.answer,
      fromSocketId: client.id,
    });
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    client: Socket,
    data: {
      targetSocketId: string;
      candidate: RTCIceCandidate;
    }
  ) {
    client.to(data.targetSocketId).emit('ice-candidate', {
      candidate: data.candidate,
      fromSocketId: client.id,
    });
  }

  private leaveRoom(client: Socket) {
    const roomId = this.users.get(client.id);
    if (roomId) {
      client.leave(roomId);
      this.users.delete(client.id);

      const room = this.rooms.get(roomId);
      if (room) {
        room.delete(client.id);

        client.to(roomId).emit('user-left', { socketId: client.id });

        if (room.size === 0) {
          this.rooms.delete(roomId);
        }
      }
    }
  }
}
