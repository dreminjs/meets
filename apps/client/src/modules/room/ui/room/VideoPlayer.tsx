// components/VideoPlayer.tsx
import { FC, RefObject } from 'react';

interface IProps {
  videoRef: RefObject<HTMLVideoElement | null>;
  title: string;
  description: string;
  isLocal?: boolean;
  isConnected?: boolean;
  showWaiting?: boolean;
  className?: string;
}

export const VideoPlayer: FC<IProps> = ({
  videoRef,
  title,
  description,
  isLocal = false,
  isConnected = true,
  showWaiting = false,
  className = "w-full h-96 object-cover border-red-500"
}) => {
  return (
    <div className="bg-gray-800 rounded-xl overflow-hidden shadow-2xl">
      <div className="p-4 bg-gray-700 border-b border-gray-600">
        <h3 className="text-white font-semibold text-lg">{title}</h3>
        <p className="text-gray-300 text-sm">{description}</p>
      </div>
      
      <video
        autoPlay
        ref={videoRef}
        muted={isLocal}
        playsInline
        className={className}
      />
      
      {showWaiting && !isConnected && (
        <div className="flex items-center justify-center h-96 text-gray-400">
          <div className="text-center">
            <svg 
              className="w-16 h-16 mx-auto mb-3 opacity-50" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1} 
                d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" 
              />
            </svg>
            <p className="text-lg">Waiting for connection...</p>
          </div>
        </div>
      )}
    </div>
  );
};