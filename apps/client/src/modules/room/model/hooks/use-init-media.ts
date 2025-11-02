import { RefObject, useEffect } from 'react';

export const useInitMedia = (
  localStreamRef: RefObject<MediaStream | null>,
  localVideoRef: RefObject<HTMLVideoElement | null>
) => {
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
        console.error(`Error accessing media: ${e}`);
      }
    }

    initMedia();
  }, []);
};
