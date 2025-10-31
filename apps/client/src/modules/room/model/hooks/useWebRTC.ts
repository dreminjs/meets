import { useRef, useState, useCallback } from 'react';
import { Socket } from 'socket.io-client';

interface UseWebRTCProps {
  localStream: MediaStream | null;
  socket: Socket | null;
  roomId: string;
}

export const useWebRTC = ({ localStream, socket, roomId }: UseWebRTCProps) => {
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  
  const [iceCandidates, setIceCandidates] = useState<RTCIceCandidate[]>([]);
  const [connectionState, setConnectionState] = useState<string>('new');
  const [isConnected, setIsConnected] = useState<boolean>(false);

  const createPeerConnection = useCallback((): RTCPeerConnection => {
    const pc = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
      ],
    });
    
    pc.ontrack = (event: RTCTrackEvent) => {
      const [remoteStream] = event.streams;
      remoteStreamRef.current = remoteStream;
      setIsConnected(true);
    };

    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && socket) {
        socket.emit('ice-candidate', {
          candidate: event.candidate,
          roomId: roomId
        });
        setIceCandidates(prev => [...prev, event.candidate!]);
      }
    };

    pc.onconnectionstatechange = () => {
      const state = pc.connectionState;
      setConnectionState(state);
      
      if (state === 'connected') {
        setIsConnected(true);
      } else if (state === 'disconnected' || state === 'failed') {
        setIsConnected(false);
      }
    };

    pc.oniceconnectionstatechange = () => {
      console.log('ICE connection state:', pc.iceConnectionState);
    };

    return pc;
  }, [socket, roomId]);

  const initializePeerConnection = useCallback(async (): Promise<void> => {
    if (!localStream) {
      throw new Error('Local stream is not available');
    }

    const pc = createPeerConnection();

    peerConnectionRef.current = pc;

    localStream.getTracks().forEach(track => {
      pc.addTrack(track, localStream);
    });

  }, [localStream, createPeerConnection]);

  const createOffer = useCallback(async (): Promise<void> => {
    if (!peerConnectionRef.current || !socket) {
      throw new Error('Peer connection or socket not available');
    }

    try {
      const offer = await peerConnectionRef.current.createOffer();
      await peerConnectionRef.current.setLocalDescription(offer);
      
      socket.emit('offer', {
        offer: offer,
        roomId: roomId
      });
    } catch (error) {
      console.error('Error creating offer:', error);
      throw error;
    }
  }, [socket, roomId]);

  const handleOffer = useCallback(async (offer: RTCSessionDescriptionInit): Promise<void> => {
    if (!peerConnectionRef.current || !socket) {
      throw new Error('Peer connection or socket not available');
    }

    try {
      await peerConnectionRef.current.setRemoteDescription(offer);
      const answer = await peerConnectionRef.current.createAnswer();
      await peerConnectionRef.current.setLocalDescription(answer);
      
      socket.emit('answer', {
        answer: answer,
        roomId: roomId
      });
    } catch (error) {
      console.error('Error handling offer:', error);
      throw error;
    }
  }, [socket, roomId]);

  const handleAnswer = useCallback(async (answer: RTCSessionDescriptionInit): Promise<void> => {
    if (!peerConnectionRef.current) {
      throw new Error('Peer connection not available');
    }

    try {
      await peerConnectionRef.current.setRemoteDescription(answer);
    } catch (error) {
      console.error('Error handling answer:', error);
      throw error;
    }
  }, []);

  const handleIceCandidate = useCallback(async (candidate: RTCIceCandidateInit): Promise<void> => {
    if (!peerConnectionRef.current) {
      throw new Error('Peer connection not available');
    }

    try {
      await peerConnectionRef.current.addIceCandidate(candidate);
    } catch (error) {
      console.error('Error adding ICE candidate:', error);
      throw error;
    }
  }, []);

  const closeConnection = useCallback((): void => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }
    
    setIsConnected(false);
    setConnectionState('closed');
    setIceCandidates([]);
    console.log('WebRTC connection closed');
  }, []);

  return {
    peerConnection: peerConnectionRef.current,
    remoteStreamRef,
    iceCandidates,
    connectionState,
    isConnected,
    initializePeerConnection,
    createOffer,
    handleOffer,
    handleAnswer,
    handleIceCandidate,
    closeConnection
  };
};