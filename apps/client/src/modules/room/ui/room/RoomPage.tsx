import { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMediaStream } from '../../model/hooks/useMediaStream';
import { useSocket } from '../../model/hooks/useSocket';
import { useWebRTC } from '../../model/hooks/useWebRTC';
import { ConnectionInfo } from './ConnectionInfo';
import { VideoPlayer } from './VideoPlayer';

export const RoomPage = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [isJoined, setIsJoined] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [hasLeft, setHasLeft] = useState<boolean>(false);

  const { localStreamRef, initMedia, stopMedia } = useMediaStream();

  const socket = useSocket();

  const webRTC = useWebRTC({
    localStream: localStreamRef.current,
    socket: socket.socket,
    roomId: roomId || '',
  });

  const handleLeaveRoom = useCallback(() => {
    setHasLeft(true);

    if (roomId) {
      socket.leaveRoom(roomId);
    }
    webRTC.closeConnection();
    socket.disconnect();
    stopMedia();

    navigate('/');
  }, [navigate, roomId, socket, stopMedia, webRTC]);

  useEffect(() => {
    if (
      webRTC.handleOffer &&
      webRTC.handleAnswer &&
      webRTC.handleIceCandidate &&
      webRTC.createOffer
    ) {
      socket.updateHandlers({
        onJoined: (data: { roomId: string; users: string[] }) => {
          setIsJoined(true);
          setIsLoading(false);
          if (webRTC.createOffer) {
            setTimeout(() => webRTC.createOffer(), 1000);
          }
        },
        onUserJoined: (data: { userId: string; users: string[] }) => {
          if (isJoined && webRTC.createOffer) {
            webRTC.createOffer();
          }
        },
        onUserLeft: (data: { userId: string; users: string[] }) => {
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
        },
        onOffer: webRTC.handleOffer,
        onAnswer: webRTC.handleAnswer,
        onIceCandidate: webRTC.handleIceCandidate,
      });
    }
  }, [
    webRTC.handleOffer,
    webRTC.handleAnswer,
    webRTC.handleIceCandidate,
    webRTC.createOffer,
    isJoined,
    socket,
    webRTC,
  ]);

  useEffect(() => {
    console.log(localStreamRef)
    if (localStreamRef.current && localVideoRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
    }
  }, [localStreamRef]);

  useEffect(() => {
    if (webRTC.remoteStreamRef.current && remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = webRTC.remoteStreamRef.current;
    }
  }, [webRTC.isConnected, webRTC.remoteStreamRef]);

  useEffect(() => {
    const initializeRoom = async () => {
      if (!roomId) {
        return;
      }

      await initMedia();

      await socket.connect();

      await webRTC.initializePeerConnection();

      socket.joinRoom(roomId);
    };

    initializeRoom();

    return () => {
      if (!hasLeft) {
        handleLeaveRoom();
      }
    };
  }, [handleLeaveRoom, hasLeft, initMedia, roomId, socket, webRTC]);

  const handleCopyRoomId = (): void => {
    if (roomId) {
      navigator.clipboard.writeText(roomId);
    }
  };

  if (!roomId) {
    return <div>Invalid room ID</div>;
  }

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-gray-800 rounded-lg p-4 mb-6">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-white">Video Room</h1>
              <div className="flex items-center space-x-2">
                <span className="text-gray-300">Room ID:</span>
                <span className="text-white font-mono bg-gray-700 px-3 py-1 rounded">
                  {roomId}
                </span>
                <button
                  onClick={handleCopyRoomId}
                  className="text-gray-400 hover:text-white transition-colors"
                  title="Copy Room ID"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <button
              onClick={handleLeaveRoom}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors flex items-center space-x-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                />
              </svg>
              <span>Leave Room</span>
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
              <p className="text-white text-lg">Joining room...</p>
              <p className="text-gray-400 text-sm mt-2">
                Setting up your camera and connecting to peers
              </p>
            </div>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-6">
              <VideoPlayer
                videoRef={localVideoRef}
                title={`You ${socket.peerId ? `(${socket.peerId})` : ''}`}
                description="Local video stream"
                isLocal={true}
                isConnected={true}
              />

              <VideoPlayer
                videoRef={remoteVideoRef}
                title="Remote Peer"
                description={
                  webRTC.isConnected
                    ? 'Connected'
                    : 'Waiting for someone to join...'
                }
                isConnected={webRTC.isConnected}
                showWaiting={true}
              />
            </div>

            <ConnectionInfo
              connectionState={webRTC.connectionState}
              peerId={socket.peerId}
              usersInRoom={socket.usersInRoom}
              iceCandidates={webRTC.iceCandidates}
              isConnected={webRTC.isConnected}
            />
          </>
        )}
      </div>
    </div>
  );
};
