import { FC } from "react";

interface IProps {
  onJoinRoom: () => void;
  onLeaveRoom: () => void;
  isJoined: boolean;
  isInitialized: boolean;
  roomId: string;
  onRoomIdChange: (roomId: string) => void;
}

export const ConnectionControls: FC<IProps> = ({
  onJoinRoom,
  onLeaveRoom,
  isJoined,
  isInitialized,
  roomId,
  onRoomIdChange
}) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 mb-6">
      {!isInitialized ? (
        <div>
          <h2 className="text-white text-xl font-bold mb-4">Join Video Room</h2>
          <div className="flex gap-4">
            <input
              type="text"
              placeholder="Enter Room ID"
              value={roomId}
              onChange={(e) => onRoomIdChange(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && onJoinRoom()}
              className="flex-1 px-4 py-2 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={onJoinRoom}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold transition-colors"
            >
              Join Room
            </button>
          </div>
        </div>
      ) : (
        <div className="text-center">
          <button
            onClick={onLeaveRoom}
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors flex items-center space-x-2 mx-auto mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            <span>Leave Room</span>
          </button>
          <p className="text-gray-300">Room: <strong className="text-white">{roomId}</strong></p>
        </div>
      )}
    </div>
  );
};