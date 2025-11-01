
type RTCIceCandidateInit = any

type RTCSessionDescriptionInit = any

export interface CreateRoomPayload {
  roomId?: string;
}

export interface JoinRoomPayload {
  roomId: string;
}

export interface OfferPayload {
  roomId: string;
  offer: RTCSessionDescriptionInit;
}

export interface AnswerPayload {
  roomId: string;
  answer: RTCSessionDescriptionInit;
}

export interface IceCandidatePayload {
  roomId: string;
  candidate: RTCIceCandidateInit;
}

export interface LeaveRoomPayload {
  roomId: string;
}

export interface RoomInfo {
  id: string;
  users: string[];
  creator: string;
  createdAt: Date;
}

export interface ServerEvents {
  'room-created': (data: { roomId: string }) => void;
  'room-joined': (data: { roomId: string }) => void;
  'user-joined': () => void;
  'user-left': () => void;
  'offer': (data: { offer: RTCSessionDescriptionInit }) => void;
  'answer': (data: { answer: RTCSessionDescriptionInit }) => void;
  'ice-candidate': (data: { candidate: RTCIceCandidateInit }) => void;
  'error': (error: string) => void;
  'room-list': (data: { rooms: RoomInfo[] }) => void;
}