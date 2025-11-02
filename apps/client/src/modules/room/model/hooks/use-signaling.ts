import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const config: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

export const useSignaling = () => {
  const roomIdRef = useRef<number | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [joinRoomId, setJoinRoomId] = useState('');
const [isConnected,setIsConnected] = useState(false)
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localPeerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const initPeerConnection = () => {
    if (localPeerConnectionRef.current) {
      localPeerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(config);
    localPeerConnectionRef.current = pc;

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    pc.ontrack = (event) => {
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
    };

    pc.onicecandidate = (event) => {
      if (event.candidate) {
        emitWithRoomId('ice-candidate', { candidate: event.candidate });
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
    };

    return pc;
  };

  const emitWithRoomId = useCallback((event: string, data: any) => {
    const currentRoomId = roomIdRef.current;
    if (socketRef.current?.connected && currentRoomId) {
      socketRef.current.emit(event, {
        ...data,
        roomId: currentRoomId,
      });
    }
  }, []);

  const createRoom = () => {
    if (!socketRef.current?.connected) {
      return;
    }

    socketRef.current.emit('create-room', {
      roomId: Math.floor(Math.random() * 10000),
    });
  };

  const joinRoom = () => {
    if (!socketRef.current?.connected) {
      return;
    }

    if (!joinRoomId.trim()) {
      return;
    }
    socketRef.current.emit('join-room', { roomId: +joinRoomId.trim() });
  };

  const createOffer = async () => {
    if (!localPeerConnectionRef.current) {
      initPeerConnection();
    }

    try {
      const offer = await localPeerConnectionRef.current!.createOffer();
      await localPeerConnectionRef.current!.setLocalDescription(offer);
      emitWithRoomId('offer', { offer });
    } catch (error) {
      alert(error);
    }
  };

  const handleOffer = async (offer: RTCSessionDescriptionInit) => {
    if (!localPeerConnectionRef.current) {
      initPeerConnection();
    }

    try {
      await localPeerConnectionRef.current!.setRemoteDescription(offer);

      const answer = await localPeerConnectionRef.current!.createAnswer();
      await localPeerConnectionRef.current!.setLocalDescription(answer);

      emitWithRoomId('answer', { answer });
    } catch (error) {
      alert(error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!localPeerConnectionRef.current) {
      return;
    }

    try {
      await localPeerConnectionRef.current!.setRemoteDescription(answer);
    } catch (error) {
      alert(error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!localPeerConnectionRef.current) {
      alert('No peer connection');
      return;
    }

    try {
      await localPeerConnectionRef.current!.addIceCandidate(candidate);
    } catch (error) {
      alert(error);
    }
  };

  const leaveRoom = () => {
    if (socketRef.current?.connected && roomIdRef.current) {
      socketRef.current.emit('leave-room', { roomId: roomIdRef.current });
    }

    if (localPeerConnectionRef.current) {
      localPeerConnectionRef.current.close();
      localPeerConnectionRef.current = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }

    setRoomId(null);
  };

  const stopAllTracks = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
    }
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  useEffect(() => {
    const socket = io('https://dbdda7fbf072cccff5eff84c52a93b69.serveo.net', {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('We connected');
      setIsConnected(true)
    });

    socket.on('disconnect', () => {
      console.log('We disconnected');
      setIsConnected(false)
    });

    socket.on('room-created', (data: { roomId: number }) => {
      setRoomId(data.roomId);
    });

    socket.on('room-joined', (data: { roomId: number }) => {
      setRoomId(data.roomId);
    });

    socket.on('user-joined', () => {
      if (!localPeerConnectionRef.current) {
        initPeerConnection();
      }
      if (localPeerConnectionRef.current) {
        createOffer();
      }
    });

    socket.on('user-left', () => {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
    });

    socket.on('offer', async (data: { offer: RTCSessionDescriptionInit }) => {
      await handleOffer(data.offer);
    });

    socket.on('answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      await handleAnswer(data.answer);
    });

    socket.on(
      'ice-candidate',
      async (data: { candidate: RTCIceCandidateInit }) => {
        await handleIceCandidate(data.candidate);
      }
    );

    socket.on('error', (error: string) => {
      alert(`Socket error: ${error}`);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  return {
    leaveRoom,
    roomId,
    createRoom,
    joinRoom,
    onChangeJoinRoomId: (newValue: string) => setJoinRoomId(newValue),
    roomIdRef,
    localStreamRef,
    localVideoRef,
    remoteVideoRef,
    isConnected,
    joinRoomId
  };
};
