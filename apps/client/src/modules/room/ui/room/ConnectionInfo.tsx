import { FC } from "react";

interface IProps {
  connectionState: string;
  peerId: string;
  usersInRoom: string[];
  iceCandidates: RTCIceCandidate[];
  isConnected: boolean;
}

export const ConnectionInfo: FC<IProps> = ({
  connectionState,
  peerId,
  usersInRoom,
  iceCandidates,
  isConnected
}) => {
  return (
    <div className="space-y-4">
      <div className="bg-gray-800 rounded-lg p-4">
        <h4 className="text-white font-medium mb-2">Connection Status</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">WebRTC:</span>
            <span className={`ml-2 ${isConnected ? 'text-green-400' : 'text-red-400'}`}>
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
          <div>
            <span className="text-gray-400">State:</span>
            <span className="ml-2 text-white">{connectionState}</span>
          </div>
          <div>
            <span className="text-gray-400">Your ID:</span>
            <span className="ml-2 text-white">{peerId}</span>
          </div>
          <div>
            <span className="text-gray-400">Users:</span>
            <span className="ml-2 text-white">{usersInRoom.length}</span>
          </div>
        </div>
      </div>

      {/* ICE кандидаты */}
      {iceCandidates.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-4">
          <h4 className="text-white font-medium mb-2">ICE Candidates ({iceCandidates.length})</h4>
          <div className="bg-gray-900 rounded p-3 max-h-32 overflow-y-auto">
            {iceCandidates.map((candidate, index) => (
              <div key={index} className="text-gray-400 text-xs font-mono mb-1">
                {candidate.candidate.substring(0, 80)}...
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};