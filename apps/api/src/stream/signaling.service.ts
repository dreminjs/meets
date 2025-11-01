import { Injectable, Logger } from '@nestjs/common';
import { WsException } from '@nestjs/websockets';
import { randomUUID } from 'crypto';
export interface Room {
  id: string;
  users: Set<string>;
  creator: string;
  createdAt: Date;
}

@Injectable()
export class SignalingService {
  private readonly logger = new Logger(SignalingService.name);
  private readonly rooms: Map<string, Room> = new Map();

  createRoom(creatorSocketId: string, customRoomId?: string): string {
    const roomId = customRoomId || this.generateRoomId();
    
    if (this.rooms.has(roomId)) {
      throw new WsException('Room already exists');
    }

    const room: Room = {
      id: roomId,
      users: new Set([creatorSocketId]),
      creator: creatorSocketId,
      createdAt: new Date(),
    };

    this.rooms.set(roomId, room);
    this.logger.log(`Room created: ${roomId} by ${creatorSocketId}`);
    
    return roomId;
  }

  joinRoom(roomId: string, socketId: string): void {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      throw new WsException('Room not found');
    }

    if (room.users.size >= 2) {
      throw new WsException("Room is full")
    }

    room.users.add(socketId);
    this.logger.log(`User ${socketId} joined room ${roomId}`);
  }

  leaveRoom(roomId: string, socketId: string): boolean {
    const room = this.rooms.get(roomId);
    
    if (!room) {
      return false;
    }

    room.users.delete(socketId);
    
    this.logger.log(`User ${socketId} left room ${roomId}`);

    if (room.users.size === 0) {
      this.rooms.delete(roomId);
      this.logger.log(`Room deleted: ${roomId}`);
      return true; 
    }

    return false;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  getUserRooms(socketId: string): string[] {
    const userRooms: string[] = [];
    
    for (const [roomId, room] of this.rooms.entries()) {
      if (room.users.has(socketId)) {
        userRooms.push(roomId);
      }
    }
    
    return userRooms;
  }

  getAllRooms(): Room[] {
    return Array.from(this.rooms.values()).map(room => ({
      ...room,
      users: new Set(room.users)
    }));
  }

  getRoomUsers(roomId: string): string[] {
    const room = this.rooms.get(roomId);
    return room ? Array.from(room.users) : [];
  }

  private generateRoomId(): string {
    return randomUUID()
  }
}