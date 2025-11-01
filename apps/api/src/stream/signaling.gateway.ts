import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { SignalingService } from './signaling.service';
import type {
  CreateRoomPayload,
  JoinRoomPayload,
  OfferPayload,
  AnswerPayload,
  IceCandidatePayload,
  LeaveRoomPayload,
} from './interfaces';

@WebSocketGateway()
export class SignalingGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server | undefined;

  private readonly logger = new Logger(SignalingGateway.name);

  constructor(private readonly signalingService: SignalingService) {}

  async handleConnection(client: Socket) {
    this.logger.log(`Client connected: ${client.id}`);

    const rooms = this.signalingService
      .getAllRooms()
      .map((room) => this.mapRoomToInfo(room));
    client.emit('room-list', { rooms });
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);

    const userRooms = this.signalingService.getUserRooms(client.id);

    for (const roomId of userRooms) {
      const roomDeleted = this.signalingService.leaveRoom(roomId, client.id);

      if (!roomDeleted) {
        client.to(roomId).emit('user-left');
        this.logger.log(
          `Notified room ${roomId} about user ${client.id} leaving`
        );
      }
    }
  }

  @SubscribeMessage('create-room')
  handleCreateRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: CreateRoomPayload
  ) {
    try {
      if (payload.roomId && payload.roomId.length < 3) {
        throw new WsException('Room ID must be at least 3 characters long');
      }

      if (payload.roomId && payload.roomId.length > 20) {
        throw new WsException('Room ID must be less than 20 characters');
      }

      this.logger.log('PING created');

      const roomId = this.signalingService.createRoom(
        client.id,
        payload.roomId
      );

      client.join(roomId);
      client.emit('room-created', { roomId });

      this.broadcastRoomList();
      this.logger.log(`Room ${roomId} created by ${client.id}`);
    } catch (error) {
      throw new WsException(JSON.stringify(error));
    }
  }

  @SubscribeMessage('join-room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: JoinRoomPayload
  ) {
    if (!payload.roomId) {
      throw new WsException('Room ID is required');
    }

    if (payload.roomId.length < 3) {
      throw new WsException('Invalid room ID');
    }

    try {
      this.signalingService.joinRoom(payload.roomId, client.id);
      client.join(payload.roomId);

      client.emit('room-joined', { roomId: payload.roomId });
      this.logger.log(payload);
      client.to(payload.roomId).emit('user-joined');

      this.broadcastRoomList();
      this.logger.log(`User ${client.id} joined room ${payload.roomId}`);
    } catch (error) {
      throw new WsException(JSON.stringify(error));
    }
  }

  // @SubscribeMessage("user-joined")
  // handleUserJoined() {
  //   this.logger.log("USER JOINED")
  // }

  @SubscribeMessage('offer')
  handleOffer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: OfferPayload
  ) {
    this.logger.log('PING OFFER', payload);

    if (!payload.roomId) {
      this.logger.log('cond 1');

      throw new WsException('Room ID is required');
    }

    if (!payload.offer) {
      this.logger.log('cond 2');

      throw new WsException('Offer is required');
    }

    const room = this.signalingService.getRoom(payload.roomId);
    if (!room || !room.users.has(client.id)) {
      this.logger.log('cond 3');

      throw new WsException('You are not in this room');
    }

    client.to(payload.roomId).emit('offer', { offer: payload.offer });
    this.logger.log(`Offer forwarded in room ${payload.roomId}`);
  }

  @SubscribeMessage('answer')
  handleAnswer(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: AnswerPayload
  ) {
    if (!payload.roomId) {
      throw new WsException('Room ID is required');
    }

    if (!payload.answer) {
      throw new WsException('Answer is required');
    }

    const room = this.signalingService.getRoom(payload.roomId);
    if (!room || !room.users.has(client.id)) {
      throw new WsException('You are not in this room');
    }

    client.to(payload.roomId).emit('answer', { answer: payload.answer });
    this.logger.log(`Answer forwarded in room ${payload.roomId}`);
  }

  @SubscribeMessage('ice-candidate')
  handleIceCandidate(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: IceCandidatePayload
  ) {
    if (!payload.roomId) {
      throw new WsException('Room ID is required');
    }

    if (!payload.candidate) {
      throw new WsException('Candidate is required');
    }

    const room = this.signalingService.getRoom(payload.roomId);
    if (!room || !room.users.has(client.id)) {
      throw new WsException('You are not in this room');
    }

    client
      .to(payload.roomId)
      .emit('ice-candidate', { candidate: payload.candidate });
    this.logger.log(`ICE candidate forwarded in room ${payload.roomId}`);
  }

  @SubscribeMessage('leave-room')
  handleLeaveRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: LeaveRoomPayload
  ) {
    if (!payload.roomId) {
      throw new WsException('Room ID is required');
    }

    const roomDeleted = this.signalingService.leaveRoom(
      payload.roomId,
      client.id
    );
    client.leave(payload.roomId);

    if (!roomDeleted) {
      client.to(payload.roomId).emit('user-left');
    }

    this.broadcastRoomList();
    this.logger.log(`User ${client.id} left room ${payload.roomId}`);
  }

  private broadcastRoomList() {
    const rooms = this.signalingService.getAllRooms().map((room) => ({
      id: room.id,
      users: Array.from(room.users),
      creator: room.creator,
      createdAt: room.createdAt,
    }));
    this.server!.emit('room-list', { rooms });
  }

  private mapRoomToInfo(room: any) {
    return {
      id: room.id,
      users: Array.from(room.users),
      creator: room.creator,
      createdAt: room.createdAt,
    };
  }
}
