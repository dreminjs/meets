import { useRef, useState, useCallback } from 'react';

export const useMediaStream = () => {
  const localStreamRef = useRef<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const initMedia = useCallback(async (): Promise<MediaStream> => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });

      console.log(stream)

      localStreamRef.current = stream;
      console.log(localStreamRef)
      return stream;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      throw err;
    }
  }, []);

  const stopMedia = useCallback((): void => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
  }, []);

  return {
    localStreamRef,
    error,
    initMedia,
    stopMedia
  };
};