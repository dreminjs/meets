import { useEffect, useRef } from 'react';

export const RoomPage = () => {
  const localStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localPeerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const remotePeerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const pc1IceCandidatesRef = useRef<RTCIceCandidate[]>([]);
  const pc2IceCandidatesRef = useRef<RTCIceCandidate[]>([]);

  const config: RTCConfiguration = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
    ],
  };

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

        await initPeerConnection();
      } catch (e) {
        console.error(e);
      }
    }

    async function initPeerConnection() {
      const localStream = localStreamRef.current;
      if (!localStream) return;

      try {
        const pc1 = new RTCPeerConnection(config);
        const pc2 = new RTCPeerConnection(config);

        localPeerConnectionRef.current = pc1;
        remotePeerConnectionRef.current = pc2;

        localStream.getTracks().forEach((track) => {
          pc1.addTrack(track, localStream);
        });

        pc2.ontrack = (event) => {
          console.log('✅ Получен удаленный поток');
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
          }
        };

        pc1.onicecandidate = (event) => {
          if (event.candidate) {
            if (pc2.remoteDescription) {
              pc2.addIceCandidate(event.candidate).catch(e => 
                console.log('ICE candidate ошибка (нормально):', e)
              );
            } else {
              pc1IceCandidatesRef.current.push(event.candidate);
            }
          }
        };

        pc2.onicecandidate = (event) => {
          if (event.candidate) {
            console.log('🧊 PC2 ICE candidate');
            if (pc1.remoteDescription) {
              pc1.addIceCandidate(event.candidate).catch(e => 
                console.log('ICE candidate ошибка (нормально):', e)
              );
            } else {
              pc2IceCandidatesRef.current.push(event.candidate);
            }
          }
        };

        const offer = await pc1.createOffer();
        await pc1.setLocalDescription(offer);

        await pc2.setRemoteDescription(offer);

        for (const candidate of pc1IceCandidatesRef.current) {
          await pc2.addIceCandidate(candidate).catch(e => console.log(e));
        }
        pc1IceCandidatesRef.current = [];

        const answer = await pc2.createAnswer();
        await pc2.setLocalDescription(answer);

        await pc1.setRemoteDescription(answer);

        for (const candidate of pc2IceCandidatesRef.current) {
          await pc1.addIceCandidate(candidate).catch(e => console.log(e));
        }
        pc2IceCandidatesRef.current = [];


      } catch (error) {
        console.error(error);
      }
    }

    initMedia();
  }, []);

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

  const closeConnection = () => {
    if (localPeerConnectionRef.current) {
      localPeerConnectionRef.current.close();
      localPeerConnectionRef.current = null;
    }
    if (remotePeerConnectionRef.current) {
      remotePeerConnectionRef.current.close();
      remotePeerConnectionRef.current = null;
    }
    stopAllTracks();
  };

  useEffect(() => {
    return () => {
      closeConnection();
    };
  }, []);

  return (
    <div>
      <div className='flex text-center'>
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
            }}
          />
        </div>
      </div>
    </div>
  );
};