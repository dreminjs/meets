import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export const JoinRoomPage = () => {
  const [roomId, setRoomId] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleJoinRoom = async (): Promise<void> => {
    if (!roomId.trim()) {
      alert('Please enter room ID');
      return;
    }

    const isValidRoomId = /^[a-zA-Z0-9-]+$/.test(roomId);
    if (!isValidRoomId) {
      alert('Room ID can only contain letters, numbers, and hyphens');
      return;
    }

    setIsLoading(true);

    navigate(`/room/${roomId}`);
  };

  const handleCreateRoom = (): void => {
    const randomId = Math.random().toString(36).substring(2, 8).toUpperCase();
    navigate(`/room/${randomId}`);
  };

  return (
    <div className="min-h-screen bg-gray-900 flex items-center justify-center p-6">
      <div className="max-w-md w-full">
        <div className="bg-gray-800 rounded-2xl shadow-2xl p-8">
          <div className="space-y-6">
            <div>
              <label
                htmlFor="roomId"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Room ID
              </label>
              <div className="flex gap-3">
                <input
                  id="roomId"
                  type="text"
                  placeholder="Enter room ID"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-lg bg-gray-700 text-white border border-gray-600 focus:border-blue-500 focus:outline-none transition-colors"
                />
                <button
                  onClick={handleCreateRoom}
                  className="px-4 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors whitespace-nowrap"
                >
                  Create New
                </button>
              </div>
            </div>

            <button
              onClick={handleJoinRoom}
              disabled={isLoading || !roomId.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-semibold transition-colors flex items-center justify-center space-x-2"
            >
              <span>Join Room</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
