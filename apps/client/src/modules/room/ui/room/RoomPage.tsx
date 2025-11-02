import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';

export const RoomPage = () => {
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localPeerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const socketRef = useRef<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [roomId, setRoomId] = useState<number | null>(null);
  const [joinRoomId, setJoinRoomId] = useState('');

  const roomIdRef = useRef<number | null>(null);

  useEffect(() => {
    roomIdRef.current = roomId;
  }, [roomId]);

  const config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
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

  useEffect(() => {
    const socket = io('https://35c2994560b77e4407e3319d83fa9c00.serveo.net', {
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('We connected');
      setIsConnected(true);
    });

    socket.on('disconnect', () => {
      console.log('We disconnected');
      setIsConnected(false);
    });

    socket.on('room-created', (data: { roomId: number }) => {
      setRoomId(data.roomId);
    });

    socket.on('room-joined', (data: { roomId: number }) => {
      setRoomId(data.roomId);
    });

    socket.on('user-joined', () => {
      console.log("USER JOINED", { roomId: roomIdRef.current });
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
      console.log(data);
      await handleOffer(data.offer);
    });

    socket.on('answer', async (data: { answer: RTCSessionDescriptionInit }) => {
      console.log(data);
      await handleAnswer(data.answer);
    });

    socket.on(
      'ice-candidate',
      async (data: { candidate: RTCIceCandidateInit }) => {
        console.log(data);
        await handleIceCandidate(data.candidate);
      }
    );

    socket.on('error', (error: string) => {
      console.error('Socket error:', error);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    async function initMedia() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });

        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.error('Error accessing media:', e);
      }
    }

    initMedia();
  }, []);

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
    console.log(joinRoomId);

    socketRef.current.emit('join-room', { roomId: +joinRoomId.trim() });
  };

  const createOffer = async () => {
    console.log('OFFER');

    if (!localPeerConnectionRef.current) {
      initPeerConnection();
    }

    try {
      const offer = await localPeerConnectionRef.current!.createOffer();
      await localPeerConnectionRef.current!.setLocalDescription(offer);

      emitWithRoomId('offer', { offer });
    } catch (error) {
      console.error('Error creating offer:', error);
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
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer: RTCSessionDescriptionInit) => {
    if (!localPeerConnectionRef.current) {
      console.error('No peer connection');
      return;
    }

    try {
      await localPeerConnectionRef.current!.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate: RTCIceCandidateInit) => {
    if (!localPeerConnectionRef.current) {
      console.error('No peer connection');
      return;
    }

    try {
      await localPeerConnectionRef.current!.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
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
    return () => {
      leaveRoom();
      stopAllTracks();
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, []);

  return (
    <div className="px-[20px] max-w-[1200px] mx-auto">
      <div className="mb-[20px] p-[15px] bg-[#f5f5f5] rounded-[8px]">
        <div className="flex gap-[10px] flex-wrap items-center">
          {!roomId ? (
            <>
              <button
                onClick={createRoom}
                disabled={!isConnected}
                style={{
                  padding: '10px 20px',
                  backgroundColor: isConnected ? '#007bff' : '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: isConnected ? 'pointer' : 'not-allowed',
                }}
              >
                Create Room
              </button>

              <div className="flex gap-[10px] items-center">
                <input
                  type="text"
                  placeholder="Enter Room ID"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                  style={{
                    padding: '10px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    width: '150px',
                  }}
                />
                <button
                  onClick={joinRoom}
                  disabled={!isConnected}
                  style={{
                    padding: '10px 20px',
                    backgroundColor: isConnected ? '#28a745' : '#6c757d',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: isConnected ? 'pointer' : 'not-allowed',
                  }}
                >
                  Join Room
                </button>
              </div>
            </>
          ) : (
            <div className="flex gap-[10px items-center]">
              <span>
                <strong>Room ID:</strong> {roomId}
              </span>
              <button
                onClick={leaveRoom}
                style={{
                  padding: '8px 16px',
                  backgroundColor: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                }}
              >
                Leave Room
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-[20px] justify-center flex-wrap">
        <div>
          <h3>Local Video</h3>
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            style={{
              border: '2px solid #007bff',
              borderRadius: '10px',
              width: '400px',
              height: '300px',
              transform: 'scaleX(-1)',
              backgroundColor: '#000',
            }}
          />
        </div>

        <div>
          <h3>Remote Video</h3>
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            style={{
              border: '2px solid #28a745',
              borderRadius: '10px',
              width: '400px',
              height: '300px',
              transform: 'scaleX(-1)',
              backgroundColor: '#000',
            }}
          />
        </div>
      </div>
    </div>
  );
};