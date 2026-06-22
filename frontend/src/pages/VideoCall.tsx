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
      <div className="max-w-6xl mx-auto py-8 px-4 relative z-10">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-slate-800 tracking-tight">Video Consultation</h1>
          {roomData && (
            <div className="flex items-center gap-3 bg-white/60 backdrop-blur-md px-4 py-2 rounded-full border border-slate-200/50 mac-shadow">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-sm font-semibold text-slate-700">Secure Room</span>
              <span className="text-xs px-2 py-0.5 bg-slate-200/80 rounded-full text-slate-600 font-medium capitalize">{roomData.role}</span>
            </div>
          )}
        </div>

        {error ? (
          <div className="glass-panel border-red-200 p-8 rounded-2xl mac-shadow flex flex-col items-center justify-center max-w-lg mx-auto mt-20 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
              <span className="text-3xl">⚠️</span>
            </div>
            <p className="text-xl font-bold text-slate-800 mb-2">Connection Error</p>
            <p className="text-slate-600 mb-8">{error}</p>
            <button
              onClick={() => navigate('/dashboard')}
              className="px-6 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition-all shadow-md"
            >
              Return to Dashboard
            </button>
          </div>
        ) : !roomData ? (
          <div className="glass-panel p-16 rounded-3xl mac-shadow flex flex-col items-center justify-center min-h-[60vh]">
            <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4" />
            <div className="text-slate-500 font-medium text-lg">Connecting to secure room...</div>
          </div>
        ) : (
          <div className="glass-panel p-4 sm:p-6 rounded-3xl mac-shadow flex flex-col">


            <div className="relative bg-slate-900 rounded-2xl overflow-hidden aspect-video flex items-center justify-center border border-slate-800/50 shadow-2xl">
              {/* Remote Video (Main screen) */}
              {connected ? (
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900">
                  <div className="w-16 h-16 rounded-full bg-slate-800 flex items-center justify-center mb-6">
                     <div className="w-8 h-8 border-4 border-indigo-500/30 border-t-indigo-500 rounded-full animate-spin" />
                  </div>
                  <p className="text-white/90 bg-white/5 backdrop-blur-md px-6 py-3 rounded-full font-medium tracking-wide text-sm border border-white/10">
                    {roomData.role === 'doctor' ? "Waiting for Patient to connect..." : "Connecting to Doctor..."}
                  </p>
                </div>
              )}

              {/* Local Video (Picture-in-Picture) */}
              <div className="absolute bottom-6 right-6 w-48 sm:w-64 aspect-video bg-slate-800 rounded-xl overflow-hidden shadow-2xl border-4 border-white/10 backdrop-blur-md z-10 transition-transform hover:scale-105 cursor-pointer">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover transform scale-x-[-1]"
                />
              </div>
            </div>

            <div className="mt-8 flex justify-center pb-2">
              <button
                onClick={endCall}
                className="group relative px-10 py-4 bg-gradient-to-r from-red-500 to-rose-600 text-white rounded-2xl font-bold transition-all shadow-[0_4px_14px_0_rgba(225,29,72,0.39)] hover:shadow-[0_6px_20px_rgba(225,29,72,0.23)] hover:-translate-y-0.5 overflow-hidden"
              >
                <div className="absolute inset-0 bg-white/20 transform -skew-x-12 -ml-10 w-8 transition-transform group-hover:translate-x-[300px] duration-500"></div>
                <div className="flex items-center gap-3 relative z-10">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 8l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M5 3a2 2 0 00-2 2v1c0 8.284 6.716 15 15 15h1a2 2 0 002-2v-3.28a1 1 0 00-.684-.948l-4.493-1.498a1 1 0 00-1.21.502l-1.13 2.257a11.042 11.042 0 01-5.516-5.517l2.257-1.128a1 1 0 00.502-1.21L9.228 3.683A1 1 0 008.279 3H5z" />
                  </svg>
                  <span className="text-lg">{roomData.role === 'doctor' ? "End Consultation" : "Leave Call"}</span>
                </div>
              </button>
            </div>
          </div>
        )}
      </div>
    </SidebarLayout>
  );
};

export default VideoCall;
