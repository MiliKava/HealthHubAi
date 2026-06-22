import React, { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api';
import SidebarLayout from '../components/SidebarLayout';
import Peer from 'peerjs';

const VideoCall: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [roomData, setRoomData] = useState<any>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const peerRef = useRef<Peer | null>(null);
  const [connected, setConnected] = useState(false);
  const connectedRef = useRef(false);

  useEffect(() => {
    const initCall = async () => {
      try {
        const response = await api.post(`/appointments/requests/${id}/join-token`);
        const data = response.data;
        setRoomData(data);
        
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setLocalStream(stream);
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        const peerId = `${data.room_id}-${data.role}`;
        const peer = new Peer(peerId, {
          debug: 2
        });
        peerRef.current = peer;

        let retryInterval: any;

        peer.on('open', () => {
          if (data.role === 'patient') {
            const connectToDoctor = () => {
              const call = peer.call(`${data.room_id}-doctor`, stream);
              if (call) {
                call.on('stream', (remoteStream) => {
                  setRemoteStream(remoteStream);
                  setConnected(true);
                  connectedRef.current = true;
                  clearInterval(retryInterval);
                });
                call.on('error', (err) => {
                  setError('Call Error: ' + err.message);
                });
              }
            };
            connectToDoctor();
            retryInterval = setInterval(() => {
              if (!peerRef.current?.disconnected && !connectedRef.current) {
                connectToDoctor();
              }
            }, 3000);
          }
        });

        peer.on('call', (call) => {
          call.answer(stream);
          call.on('stream', (remoteStream) => {
            setRemoteStream(remoteStream);
            setConnected(true);
          });
          call.on('error', (err) => {
            setError('Answer Error: ' + err.message);
          });
        });

        peer.on('error', (err: any) => {
          console.error("PeerJS Error:", err);
          // Don't overwrite general errors if we are just retrying
          if (err.type !== 'peer-unavailable') {
             setError(`Connection Error: ${err.type} - ${err.message}`);
          }
        });
        
      } catch (err: any) {
        setError(err.response?.data?.detail || err.message || 'Failed to join video call');
      }
    };

    if (id) initCall();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  const endCall = async () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    if (roomData?.role === 'doctor') {
      try {
        await api.post(`/appointments/requests/${id}/end-call`);
      } catch (err) {
        console.error("Failed to end call", err);
      }
    }
    navigate('/dashboard');
  };

  return (
    <SidebarLayout>
      <div className="max-w-6xl mx-auto py-8 px-4">
        <h1 className="text-3xl font-bold text-slate-800 mb-6">Video Consultation</h1>
        
        {error ? (
          <div className="bg-red-50 text-red-700 p-4 rounded-md border border-red-200">
            <p className="font-medium">Error</p>
            <p>{error}</p>
            <button 
              onClick={() => navigate('/dashboard')}
              className="mt-4 px-4 py-2 bg-slate-800 text-white rounded-md hover:bg-slate-700"
            >
              Go Back
            </button>
          </div>
        ) : !roomData ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-slate-500 text-lg animate-pulse">Connecting to secure room...</div>
          </div>
        ) : (
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <div>
                <p className="text-sm font-semibold text-emerald-600 uppercase tracking-wider">SECURE CONNECTION ESTABLISHED</p>
                <p className="text-slate-500 text-sm">Room ID: {roomData.room_id}</p>
              </div>
              <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium">
                Role: {roomData.role}
              </div>
            </div>
            
            <div className="relative bg-slate-900 rounded-lg overflow-hidden aspect-video flex items-center justify-center border border-slate-800 shadow-inner">
              {/* Remote Video (Main screen) */}
              {connected ? (
                 <video 
                  ref={remoteVideoRef} 
                  autoPlay 
                  playsInline 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center">
                  <p className="text-white bg-black/60 px-6 py-3 rounded-lg font-medium tracking-wide">
                    {roomData.role === 'doctor' ? "Waiting for Patient to connect..." : "Connecting to Doctor..."}
                  </p>
                </div>
              )}
              
              {/* Local Video (Picture-in-Picture) */}
              <div className="absolute bottom-4 right-4 w-48 aspect-video bg-black rounded-lg overflow-hidden shadow-xl border-2 border-white/20 z-10">
                <video 
                  ref={localVideoRef} 
                  autoPlay 
                  playsInline 
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              </div>
            </div>
            
            <div className="mt-8 flex justify-center">
              <button 
                onClick={endCall}
                className="px-8 py-3 bg-red-600 text-white rounded-lg font-bold hover:bg-red-700 transition-colors shadow-sm text-lg"
              >
                {roomData.role === 'doctor' ? "End Consultation" : "Leave Call"}
              </button>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default VideoCall;
