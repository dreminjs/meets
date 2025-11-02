import { useSignaling } from '../../model/hooks/use-signaling';
import { useInitMedia } from '../../model/hooks/use-init-media';

export const RoomPage = () => {
  
  const {
    localStreamRef,
    leaveRoom,
    createRoom,
    onChangeJoinRoomId,
    joinRoom,
    localVideoRef,
    roomId,
    remoteVideoRef,
    isConnected,
    joinRoomId,
  } = useSignaling();

  useInitMedia(localStreamRef, localVideoRef)

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
                  onChange={(e) => onChangeJoinRoomId(e.target.value)}
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
