import { useState, useCallback, useRef, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketProps {
  onJoined?: (data: { roomId: string; users: string[] }) => void;
  onUserJoined?: (data: { userId: string; users: string[] }) => void;
  onUserLeft?: (data: { userId: string; users: string[] }) => void;
  onOffer?: (offer: RTCSessionDescriptionInit) => void;
  onAnswer?: (answer: RTCSessionDescriptionInit) => void;
  onIceCandidate?: (candidate: RTCIceCandidateInit) => void;
}

export const useSocket = () => {
  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [peerId, setPeerId] = useState<string>('');
  const [usersInRoom, setUsersInRoom] = useState<string[]>([]);
  
  const handlersRef = useRef<UseSocketProps>({});

  const updateHandlers = useCallback((newHandlers: UseSocketProps) => {
    handlersRef.current = { ...handlersRef.current, ...newHandlers };
  }, []);

  const connect = useCallback(async (serverUrl = 'http://localhost:3000'): Promise<void> => {
    return new Promise((resolve, reject) => {
      const socketInstance = io(serverUrl, {
        transports: ['websocket', 'polling'],
      });

      socketRef.current = socketInstance;

      socketInstance.on('connect', () => {
        setIsConnected(true);
        setPeerId(socketInstance.id || '');
        resolve();
      });

      socketInstance.on('connect_error', (error) => {
        reject(error);
      });

      socketInstance.on('disconnect', () => {
        setIsConnected(false);
        setPeerId('');
      });

      socketInstance.on('joined', (data) => {
        setUsersInRoom(data.users);
        handlersRef.current.onJoined?.(data);
      });

      socketInstance.on('user-joined', (data) => {
        setUsersInRoom(data.users);
        handlersRef.current.onUserJoined?.(data);
      });

      socketInstance.on('user-left', (data) => {
        setUsersInRoom(data.users);
        handlersRef.current.onUserLeft?.(data);
      });

      socketInstance.on('offer', (data) => {
        handlersRef.current.onOffer?.(data.offer);
      });

      socketInstance.on('answer', (data) => {
        handlersRef.current.onAnswer?.(data.answer);
      });

      socketInstance.on('ice-candidate', (data) => {
        handlersRef.current.onIceCandidate?.(data.candidate);
      });

      socketInstance.on('room-users', (users: string[]) => {
        setUsersInRoom(users);
      });
    });
  }, []);

  const joinRoom = useCallback((roomId: string): void => {
    if (socketRef.current) {
      socketRef.current.emit('join-room', roomId);
    }
  }, []);

  const leaveRoom = useCallback((roomId: string): void => {
    if (socketRef.current) {
      socketRef.current.emit('leave-room', roomId);
    }
  }, []);

  const disconnect = useCallback((): void => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
      setIsConnected(false);
      setPeerId('');
      setUsersInRoom([]);
    }
  }, []);

  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    socket: socketRef.current,
    isConnected,
    peerId,
    usersInRoom,
    connect,
    joinRoom,
    leaveRoom,
    disconnect,
    updateHandlers
  };
};