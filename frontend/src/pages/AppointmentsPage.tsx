import { useEffect, useState, useRef } from 'react';
import SidebarLayout from '../components/SidebarLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Plus, CheckCircle, Clock, Video, VideoOff,
  User, AlertCircle, ArrowLeft, Loader2, RefreshCw, Check,
  Mic, MicOff, PhoneOff
} from 'lucide-react';
import api from '../api';
import { useAuthStore } from '../store/authStore';

interface DoctorProfile {
  id: string;
  specialty: string;
  years_experience: number;
  bio?: string;
}

interface UserDetail {
  id: string;
  email: string;
  full_name: string;
  role: 'patient' | 'doctor' | 'admin';
  doctor_profile?: DoctorProfile;
}

interface Appointment {
  id: string;
  patient_id: string;
  doctor_id: string;
  status: 'pending' | 'confirmed' | 'rejected' | 'proposed' | 'completed';
  confirmed_slot: string;
  call_room_id?: string;
  call_provider?: string;
  patient?: UserDetail;
  doctor?: UserDetail;
}

export default function AppointmentsPage() {
  const { user, role } = useAuthStore();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [doctors, setDoctors] = useState<UserDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Tab control
  const [activeTab, setActiveTab] = useState<'my' | 'book' | 'history'>('my');
  
  // Booking Form State
  const [selectedDoctorId, setSelectedDoctorId] = useState<string>('');
  const [confirmedSlot, setConfirmedSlot] = useState<string>('');
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);

  // Propose / Reschedule State
  const [proposingId, setProposingId] = useState<string | null>(null);
  const [proposedTime, setProposedTime] = useState<string>('');
  const [proposalLoading, setProposalLoading] = useState(false);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  
  const [reschedulingId, setReschedulingId] = useState<string | null>(null);
  const [rescheduleTime, setRescheduleTime] = useState<string>('');
  const [rescheduleLoading, setRescheduleLoading] = useState(false);

  const getLocalISOString = () => {
    const tzOffset = new Date().getTimezoneOffset() * 60000;
    return new Date(Date.now() - tzOffset).toISOString().slice(0, 16);
  };

  // Custom WebRTC & WebSocket Call States
  const [isCalling, setIsCalling] = useState(false);
  const [callAppointment, setCallAppointment] = useState<Appointment | null>(null);
  const [callStatus, setCallStatus] = useState<string>('Initializing media devices...');
  const [isMuted, setIsMuted] = useState(false);
  const [isCameraOff, setIsCameraOff] = useState(false);
  const [callDuration, setCallDuration] = useState(0);

  // WebRTC Refs
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const timerRef = useRef<any>(null);
  const remoteCandidatesQueue = useRef<any[]>([]);

  const [joiningCallId, setJoiningCallId] = useState<string | null>(null);
  const [confirmingId, setConfirmingId] = useState<string | null>(null);

  const fetchAppointments = async () => {
    try {
      const response = await api.get('/appointments');
      setAppointments(response.data);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching appointments:', err);
      setError('Failed to fetch appointments. Please try again.');
    }
  };

  const fetchDoctors = async () => {
    try {
      const response = await api.get('/doctors');
      setDoctors(response.data);
    } catch (err: any) {
      console.error('Error fetching doctors:', err);
    }
  };

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAppointments();
      if (role === 'patient') {
        await fetchDoctors();
      }
      setLoading(false);
    };
    init();
  }, [role]);

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorId || !confirmedSlot) return;

    setBookingLoading(true);
    try {
      await api.post('/appointments', {
        doctor_id: selectedDoctorId,
        confirmed_slot: new Date(confirmedSlot).toISOString(),
      });
      setBookingSuccess(true);
      setSelectedDoctorId('');
      setConfirmedSlot('');
      await fetchAppointments();
      setTimeout(() => {
        setBookingSuccess(false);
        setActiveTab('my');
      }, 2000);
    } catch (err: any) {
      console.error('Error booking appointment:', err);
      const detail = err.response?.data?.detail || 'Booking failed. Please try again.';
      setError(detail);
    } finally {
      setBookingLoading(false);
    }
  };

  const handleConfirm = async (appointmentId: string) => {
    setConfirmingId(appointmentId);
    try {
      await api.post(`/appointments/${appointmentId}/confirm`);
      await fetchAppointments();
    } catch (err: any) {
      console.error('Error confirming appointment:', err);
      const detail = err.response?.data?.detail || 'Confirmation failed. Please try again.';
      setError(detail);
    } finally {
      setConfirmingId(null);
    }
  };

  const handleReject = async (appointmentId: string) => {
    setRejectingId(appointmentId);
    try {
      await api.post(`/appointments/${appointmentId}/reject`);
      await fetchAppointments();
    } catch (err: any) {
      console.error('Error rejecting appointment:', err);
      const detail = err.response?.data?.detail || 'Reject failed. Please try again.';
      setError(detail);
    } finally {
      setRejectingId(null);
    }
  };

  const handlePropose = async (appointmentId: string) => {
    if (!proposedTime) return;
    setProposalLoading(true);
    try {
      await api.post(`/appointments/${appointmentId}/propose`, {
        proposed_slot: new Date(proposedTime).toISOString()
      });
      setProposingId(null);
      setProposedTime('');
      await fetchAppointments();
    } catch (err: any) {
      console.error('Error proposing time:', err);
      const detail = err.response?.data?.detail || 'Proposing time failed. Please try again.';
      setError(detail);
    } finally {
      setProposalLoading(false);
    }
  };

  const handleAcceptProposal = async (appointmentId: string) => {
    try {
      await api.post(`/appointments/${appointmentId}/accept-proposal`);
      await fetchAppointments();
    } catch (err: any) {
      console.error('Error accepting proposal:', err);
      const detail = err.response?.data?.detail || 'Failed to accept proposal.';
      setError(detail);
    }
  };

  const handleRejectProposal = async (appointmentId: string) => {
    try {
      await api.post(`/appointments/${appointmentId}/reject-proposal`);
      await fetchAppointments();
    } catch (err: any) {
      console.error('Error rejecting proposal:', err);
      const detail = err.response?.data?.detail || 'Failed to reject proposal.';
      setError(detail);
    }
  };

  const handleReschedule = async (appointmentId: string) => {
    if (!rescheduleTime) return;
    setRescheduleLoading(true);
    try {
      await api.post(`/appointments/${appointmentId}/reschedule`, {
        confirmed_slot: new Date(rescheduleTime).toISOString()
      });
      setReschedulingId(null);
      setRescheduleTime('');
      await fetchAppointments();
    } catch (err: any) {
      console.error('Error rescheduling:', err);
      const detail = err.response?.data?.detail || 'Rescheduling failed. Please try again.';
      setError(detail);
    } finally {
      setRescheduleLoading(false);
    }
  };

  // Start P2P WebRTC Video Call
  const handleJoinCall = async (appointment: Appointment) => {
    setJoiningCallId(appointment.id);
    setError(null);
    remoteCandidatesQueue.current = [];

    try {
      // 1. Verify join window with backend
      await api.get(`/appointments/${appointment.id}/join-window`);
      
      // 2. Set call states
      setCallAppointment(appointment);
      setIsCalling(true);
      setCallStatus('Accessing camera & microphone...');
      setCallDuration(0);

      // 3. Capture camera & microphone (with fallback if webcam is locked)
      let stream: MediaStream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      } catch (mediaErr: any) {
        console.warn('Media capture failed, trying fallback:', mediaErr);
        if (mediaErr.name === 'NotReadableError' || mediaErr.name === 'TrackStartError') {
          // Fallback to audio-only if camera is locked by another browser/tab on the same machine
          stream = await navigator.mediaDevices.getUserMedia({ video: false, audio: true });
          setIsCameraOff(true);
        } else {
          throw mediaErr;
        }
      }
      localStreamRef.current = stream;

      // 4. Initialize WebRTC Peer Connection
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' }
        ]
      });
      peerConnectionRef.current = pc;

      // Add local stream tracks to WebRTC peer connection
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      // Handle remote media track arrival
      pc.ontrack = (event) => {
        console.log('Remote track received:', event.streams[0]);
        const remoteStream = event.streams[0];
        remoteStreamRef.current = remoteStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }
        setCallStatus('Connected');
        // Start duration timer if not running
        if (!timerRef.current) {
          timerRef.current = setInterval(() => {
            setCallDuration(prev => prev + 1);
          }, 1000);
        }
      };

      // Gather and send local ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
          wsRef.current.send(JSON.stringify({ type: 'candidate', candidate: event.candidate }));
        }
      };

      // Connect to Signaling WebSocket Server
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.hostname}:8000/api/appointments/${appointment.id}/ws`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      // Handle WebSocket signaling events
      ws.onopen = () => {
        setCallStatus('Waiting for call partner to connect...');
      };

      ws.onmessage = async (message) => {
        const msg = JSON.parse(message.data);
        console.log('WebSocket received type:', msg.type);
        
        if (msg.type === 'peer-joined') {
          // Relay connection joined from signaling manager
          setCallStatus('Partner joined. Exchanging keys...');
          try {
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);
            ws.send(JSON.stringify({ type: 'offer', offer }));
          } catch (err) {
            console.error('Error creating offer:', err);
          }
        }
        else if (msg.type === 'offer') {
          setCallStatus('Negotiating connection...');
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            ws.send(JSON.stringify({ type: 'answer', answer }));
            
            // Process queued candidates
            console.log('Processing queued candidates after offer:', remoteCandidatesQueue.current.length);
            for (const candidate of remoteCandidatesQueue.current) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.error('Error adding queued candidate:', e);
              }
            }
            remoteCandidatesQueue.current = [];
          } catch (err) {
            console.error('Error handling offer:', err);
          }
        }
        else if (msg.type === 'answer') {
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(msg.answer));
            
            // Process queued candidates
            console.log('Processing queued candidates after answer:', remoteCandidatesQueue.current.length);
            for (const candidate of remoteCandidatesQueue.current) {
              try {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              } catch (e) {
                console.error('Error adding queued candidate:', e);
              }
            }
            remoteCandidatesQueue.current = [];
          } catch (err) {
            console.error('Error handling answer:', err);
          }
        }
        else if (msg.type === 'candidate') {
          if (pc.remoteDescription && pc.remoteDescription.type) {
            try {
              await pc.addIceCandidate(new RTCIceCandidate(msg.candidate));
            } catch (e) {
              console.error('Error adding candidate directly:', e);
            }
          } else {
            console.log('Queueing remote candidate:', msg.candidate);
            remoteCandidatesQueue.current.push(msg.candidate);
          }
        }
        else if (msg.type === 'peer-left') {
          setCallStatus('Partner left the call.');
          remoteStreamRef.current = null;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = null;
          }
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
        }
        else if (msg.type === 'error') {
          setError(msg.message);
          handleHangUp();
        }
      };

      ws.onclose = () => {
        if (isCalling) {
          setCallStatus('Signaling disconnected.');
        }
      };

      ws.onerror = () => {
        setError('Signaling server connection error.');
      };

    } catch (err: any) {
      console.error('Error starting call:', err);
      const detail = err.response?.data?.detail || 'Calling setup failed. Ensure camera/mic permissions are granted and slot is active.';
      setError(detail);
      handleHangUp();
    } finally {
      setJoiningCallId(null);
    }
  };

  const handleHangUp = () => {
    // 1. Stop local media capture
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }

    // Stop remote stream capture
    if (remoteStreamRef.current) {
      remoteStreamRef.current.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
    }

    // 2. Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // 3. Close signaling WebSocket
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    // 4. Clear timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    remoteCandidatesQueue.current = [];

    // 5. Reset states
    setIsCalling(false);
    setCallAppointment(null);
    setIsMuted(false);
    setIsCameraOff(false);
    setCallDuration(0);
    fetchAppointments();
  };

  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleCamera = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOff(!videoTrack.enabled);
      }
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const isJoinable = (slot: string) => {
    const slotDate = new Date(slot);
    const now = new Date();
    const diffMinutes = Math.abs(now.getTime() - slotDate.getTime()) / 60000;
    return diffMinutes <= 15;
  };

  const formatSlot = (slot: string) => {
    return new Date(slot).toLocaleString(undefined, {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  };

  // Full Screen Calling UI
  if (isCalling && callAppointment) {
    const partnerName = role === 'patient' 
      ? (callAppointment.doctor?.full_name || 'Your Doctor')
      : (callAppointment.patient?.full_name || 'Your Patient');

    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col relative overflow-hidden font-sans">
        
        {/* Top Call Info Overlay */}
        <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-20">
          <div className="flex items-center gap-3">
            <div className="w-3.5 h-3.5 rounded-full bg-rose-500 animate-ping flex-shrink-0" />
            <div>
              <h1 className="font-extrabold text-lg text-slate-100 tracking-tight">{partnerName}</h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5 flex items-center gap-2">
                <span>{callStatus}</span>
                {callStatus === 'Connected' && (
                  <>
                    <span className="w-1.5 h-1.5 bg-slate-500 rounded-full" />
                    <span className="font-mono text-emerald-400 font-bold">{formatDuration(callDuration)}</span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button 
            onClick={handleHangUp}
            className="flex items-center gap-2 px-5 py-3 bg-rose-600 hover:bg-rose-700 active:scale-95 transition-all text-white font-bold text-sm rounded-2xl shadow-lg shadow-rose-600/30"
          >
            <PhoneOff className="w-4 h-4" /> End Call
          </button>
        </div>

        {/* Video Streams Container */}
        <div className="flex-grow w-full relative bg-slate-950 flex items-center justify-center">
          
          {/* Remote Video (Full Screen) */}
          <video
            ref={(el) => {
              remoteVideoRef.current = el;
              if (el && remoteStreamRef.current) {
                el.srcObject = remoteStreamRef.current;
              }
            }}
            autoPlay
            playsInline
            className="w-full h-full object-cover absolute inset-0"
          />

          {/* Remote Camera Muted/Off Empty View */}
          {callStatus !== 'Connected' && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center text-center p-6">
              <div className="w-20 h-20 bg-slate-800 rounded-full flex items-center justify-center mb-4 border border-slate-700">
                <User className="w-10 h-10 text-slate-400 animate-pulse" />
              </div>
              <p className="text-slate-200 font-semibold">{callStatus}</p>
              <p className="text-slate-500 text-sm mt-1">Connecting peer-to-peer streams...</p>
            </div>
          )}

          {/* Floating Local Video Picture-in-Picture (Bottom-Right) */}
          <motion.div 
            drag
            dragConstraints={{ left: -300, right: 300, top: -200, bottom: 200 }}
            whileHover={{ scale: 1.02 }}
            className="absolute bottom-28 right-6 w-36 h-48 sm:w-44 sm:h-60 bg-slate-900 rounded-3xl border-2 border-white/20 shadow-2xl overflow-hidden z-10 cursor-grab active:cursor-grabbing"
          >
            <video
              ref={(el) => {
                localVideoRef.current = el;
                if (el && localStreamRef.current) {
                  el.srcObject = localStreamRef.current;
                }
              }}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover scale-x-[-1]" // mirror local camera
            />
            {isCameraOff && (
              <div className="absolute inset-0 bg-slate-900 flex flex-col items-center justify-center text-center">
                <VideoOff className="w-6 h-6 text-slate-500" />
                <span className="text-[10px] text-slate-400 mt-1">Camera Off</span>
              </div>
            )}
            <div className="absolute bottom-2 left-2 px-2 py-0.5 bg-black/60 rounded-md text-[9px] font-bold text-white tracking-wide">
              You
            </div>
          </motion.div>
        </div>

        {/* Media Controls Bar */}
        <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/90 to-transparent flex justify-center items-center gap-4 z-20">
          
          <button
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all active:scale-90 ${
              isMuted 
                ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                : 'bg-slate-800 text-white border border-slate-750 hover:bg-slate-700'
            }`}
            title={isMuted ? 'Unmute microphone' : 'Mute microphone'}
          >
            {isMuted ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
          </button>

          <button
            onClick={toggleCamera}
            className={`p-4 rounded-full transition-all active:scale-90 ${
              isCameraOff 
                ? 'bg-rose-500/20 text-rose-500 border border-rose-500/30' 
                : 'bg-slate-800 text-white border border-slate-750 hover:bg-slate-700'
            }`}
            title={isCameraOff ? 'Turn camera on' : 'Turn camera off'}
          >
            {isCameraOff ? <VideoOff className="w-5 h-5" /> : <Video className="w-5 h-5" />}
          </button>

          <button
            onClick={handleHangUp}
            className="p-4 bg-rose-600 hover:bg-rose-700 rounded-full transition-all text-white shadow-lg active:scale-90"
            title="End video call"
          >
            <PhoneOff className="w-5 h-5" />
          </button>

        </div>
      </div>
    );
  }

  const now = new Date();
  
  const activeAppointments = appointments.filter(app => {
    const slotDate = new Date(app.confirmed_slot);
    const isPast = now.getTime() - slotDate.getTime() > 15 * 60 * 1000; // older than 15 minutes
    
    if (app.status === 'rejected' || app.status === 'completed') {
      return false;
    }
    return !isPast;
  });

  const historyAppointments = appointments.filter(app => {
    const slotDate = new Date(app.confirmed_slot);
    const isPast = now.getTime() - slotDate.getTime() > 15 * 60 * 1000; // older than 15 minutes
    
    return app.status === 'rejected' || app.status === 'completed' || isPast;
  });

  return (
    <SidebarLayout>
      <div className="max-w-5xl mx-auto py-8 px-4 sm:px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 mb-8">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-brand-teal-light rounded-2xl border border-brand-teal/10 shadow-sm shadow-brand-teal/5">
                <Calendar className="w-8 h-8 text-brand-teal" />
              </div>
              <div>
                <h1 className="text-3xl font-black text-slate-950 tracking-tight">Consultations</h1>
                <p className="text-slate-500 text-sm mt-0.5">Secure peer-to-peer video clinic consultations</p>
              </div>
            </div>

            <div className="flex bg-slate-200/60 p-1.5 rounded-2xl w-fit border border-slate-300/30">
              <button
                onClick={() => setActiveTab('my')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === 'my' 
                    ? 'bg-white text-slate-950 shadow-md shadow-slate-400/10' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                {role === 'doctor' ? 'Schedule' : 'Appointments'}
              </button>
              {role === 'patient' && (
                <button
                  onClick={() => setActiveTab('book')}
                  className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                    activeTab === 'book' 
                      ? 'bg-brand-teal text-white shadow-md shadow-brand-teal/25' 
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Book Appointment
                </button>
              )}
              <button
                onClick={() => setActiveTab('history')}
                className={`px-5 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 ${
                  activeTab === 'history' 
                    ? 'bg-white text-slate-950 shadow-md shadow-slate-400/10' 
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                History
              </button>
            </div>
          </div>

          {/* Toast / Notification Box */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="bg-red-50/80 border border-red-200/50 backdrop-blur p-4 rounded-2xl mb-6 flex gap-3 items-start shadow-lg shadow-red-500/5"
              >
                <AlertCircle className="text-red-500 w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
                <div className="flex-grow">
                  <p className="text-red-800 font-semibold text-sm">{error}</p>
                </div>
                <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600 font-bold text-xs">Dismiss</button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Loading view */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-10 h-10 text-brand-teal animate-spin mb-4" />
              <p className="text-slate-500 font-semibold">Loading clinics and calendar schedule...</p>
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'my' ? (
                <motion.div 
                  key="my-appointments" 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-brand-teal" />
                      {role === 'doctor' ? 'Your Schedule' : 'Upcoming Consultations'}
                    </h2>
                    <button 
                      onClick={fetchAppointments} 
                      className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600"
                      title="Refresh schedule"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {activeAppointments.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 p-12 text-center">
                      <div className="w-20 h-20 bg-brand-teal-light rounded-full flex items-center justify-center mx-auto mb-5 border-4 border-white shadow-inner">
                        <Calendar className="w-9 h-9 text-brand-teal" />
                      </div>
                      <p className="text-slate-800 font-extrabold text-lg">No appointments scheduled</p>
                      <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                        {role === 'patient' 
                          ? 'Choose a highly rated specialist and book a standard online medical consultation.'
                          : 'You do not have any patient consultations requested or scheduled yet.'
                        }
                      </p>
                      {role === 'patient' && (
                        <button
                          onClick={() => setActiveTab('book')}
                          className="mt-6 inline-flex items-center gap-2 px-5 py-3 bg-brand-teal text-white rounded-2xl font-bold text-sm shadow-md shadow-brand-teal/25 hover:bg-brand-teal-dark active:scale-95 transition-all"
                        >
                          <Plus className="w-4 h-4" /> Book Now
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {activeAppointments.map((appointment) => {
                        const partnerName = role === 'patient' 
                          ? (appointment.doctor?.full_name || 'Doctor')
                          : (appointment.patient?.full_name || 'Patient');
                        const partnerEmail = role === 'patient'
                          ? appointment.doctor?.email
                          : appointment.patient?.email;
                        const spec = role === 'patient' && appointment.doctor?.doctor_profile?.specialty;
                        const joinEnabled = appointment.status === 'confirmed' && isJoinable(appointment.confirmed_slot);

                        return (
                          <motion.div
                            key={appointment.id}
                            whileHover={{ y: -4 }}
                            className="bg-white/80 backdrop-blur rounded-3xl p-6 border border-slate-100 shadow-lg shadow-slate-100/50 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                                  appointment.status === 'confirmed'
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : appointment.status === 'proposed'
                                    ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                    : appointment.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                    : 'bg-amber-50 text-amber-600 border border-amber-100'
                                }`}>
                                  {appointment.status}
                                </span>
                                <div className="text-right text-xs text-slate-400 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatSlot(appointment.confirmed_slot)}
                                </div>
                              </div>

                              <div className="flex gap-4 items-start mb-6">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-500 font-bold shadow-inner">
                                  <User className="w-6 h-6 text-slate-400" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-900">{partnerName}</h3>
                                  <p className="text-slate-400 text-xs">{partnerEmail}</p>
                                  {spec && (
                                    <p className="text-brand-teal text-xs font-semibold mt-1 bg-brand-teal-light/50 px-2.5 py-0.5 rounded-md w-fit">
                                      {spec}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
                              {/* Doctor Propose Time Inputs */}
                              {role === 'doctor' && proposingId === appointment.id && (
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                  <label className="block text-xs font-bold text-slate-500">Propose New Slot</label>
                                  <input
                                    type="datetime-local"
                                    required
                                    min={getLocalISOString()}
                                    value={proposedTime}
                                    onChange={e => setProposedTime(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setProposingId(null)}
                                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-500 font-bold text-[11px]"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handlePropose(appointment.id)}
                                      disabled={proposalLoading || !proposedTime}
                                      className="px-3 py-1.5 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-sm"
                                    >
                                      {proposalLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                      Propose Time
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Patient Reschedule Inputs */}
                              {role === 'patient' && reschedulingId === appointment.id && (
                                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                  <label className="block text-xs font-bold text-slate-500">Choose New Slot</label>
                                  <input
                                    type="datetime-local"
                                    required
                                    min={getLocalISOString()}
                                    value={rescheduleTime}
                                    onChange={e => setRescheduleTime(e.target.value)}
                                    className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
                                  />
                                  <div className="flex gap-2 justify-end">
                                    <button
                                      type="button"
                                      onClick={() => setReschedulingId(null)}
                                      className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-500 font-bold text-[11px]"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleReschedule(appointment.id)}
                                      disabled={rescheduleLoading || !rescheduleTime}
                                      className="px-3 py-1.5 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-sm"
                                    >
                                      {rescheduleLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                      Confirm Reschedule
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Action Options */}
                              <div className="flex gap-2">
                                {role === 'doctor' && appointment.status === 'pending' && !proposingId && (
                                  <>
                                    <button
                                      onClick={() => handleConfirm(appointment.id)}
                                      disabled={confirmingId === appointment.id}
                                      className="flex-grow flex items-center justify-center gap-2 py-3 bg-brand-teal text-white rounded-2xl font-bold text-sm shadow-md shadow-brand-teal/25 hover:bg-brand-teal-dark disabled:bg-slate-300 transition-all active:scale-95"
                                    >
                                      {confirmingId === appointment.id ? (
                                        <>
                                          <Loader2 className="w-4 h-4 animate-spin" /> Confirming...
                                        </>
                                      ) : (
                                        <>
                                          <Check className="w-4 h-4" /> Confirm
                                        </>
                                      )}
                                    </button>

                                    <button
                                      onClick={() => setProposingId(appointment.id)}
                                      className="px-4 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-bold text-sm border border-slate-200 transition-all active:scale-95"
                                    >
                                      Propose Time
                                    </button>

                                    <button
                                      onClick={() => handleReject(appointment.id)}
                                      disabled={rejectingId === appointment.id}
                                      className="px-4 py-3 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-2xl font-bold text-sm border border-rose-200 transition-all active:scale-95"
                                    >
                                      {rejectingId === appointment.id ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                      ) : (
                                        'Reject'
                                      )}
                                    </button>
                                  </>
                                )}

                                {role === 'doctor' && appointment.status === 'proposed' && (
                                  <div className="w-full py-3 bg-slate-50 border border-slate-100 text-slate-400 text-center rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5">
                                    <Clock className="w-4 h-4 animate-pulse text-purple-500" /> Proposed slot. Awaiting Patient Response.
                                  </div>
                                )}

                                {role === 'patient' && appointment.status === 'proposed' && (
                                  <div className="w-full flex flex-col gap-2">
                                    <div className="flex gap-2">
                                      <button
                                        onClick={() => handleAcceptProposal(appointment.id)}
                                        className="flex-1 py-2.5 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl font-bold text-xs shadow-sm transition-all"
                                      >
                                        Accept Proposal
                                      </button>
                                      <button
                                        onClick={() => handleRejectProposal(appointment.id)}
                                        className="flex-1 py-2.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-xl font-bold text-xs border border-rose-200 transition-all"
                                      >
                                        Reject Proposal
                                      </button>
                                    </div>
                                  </div>
                                )}

                                {appointment.status === 'confirmed' && (
                                  <div className="w-full flex flex-col gap-2">
                                    <button
                                      onClick={() => handleJoinCall(appointment)}
                                      disabled={!joinEnabled || joiningCallId === appointment.id}
                                      className={`w-full flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95 ${
                                        joinEnabled
                                          ? 'bg-rose-500 text-white shadow-rose-500/25 hover:bg-rose-600'
                                          : 'bg-slate-100 text-slate-400 shadow-none border border-slate-200 cursor-not-allowed'
                                      }`}
                                    >
                                      {joiningCallId === appointment.id ? (
                                        <>
                                          <Loader2 className="w-4 h-4 animate-spin" /> Preparing Call...
                                        </>
                                      ) : (
                                        <>
                                          <Video className="w-4 h-4" /> Join WebRTC Call
                                        </>
                                      )}
                                    </button>
                                    {!joinEnabled && (
                                      <p className="text-[10px] text-center text-slate-400">
                                        Join active 15 mins before slot
                                      </p>
                                    )}
                                  </div>
                                )}

                                {role === 'patient' && appointment.status === 'pending' && (
                                  <div className="w-full py-3 bg-slate-50 border border-slate-100 text-slate-400 text-center rounded-2xl font-semibold text-xs flex items-center justify-center gap-1.5">
                                    <Clock className="w-4 h-4 animate-pulse text-amber-500" /> Awaiting Doctor Approval
                                  </div>
                                )}

                                {role === 'patient' && appointment.status === 'rejected' && !reschedulingId && (
                                  <button
                                    onClick={() => setReschedulingId(appointment.id)}
                                    className="w-full py-3 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-95"
                                  >
                                    Reschedule Appointment
                                  </button>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              ) : activeTab === 'book' ? (
                <motion.div 
                  key="booking-portal" 
                  initial={{ opacity: 0, x: 10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="bg-white rounded-3xl border border-slate-100 shadow-xl p-8"
                >
                  <h2 className="text-2xl font-black text-slate-900 mb-6 flex items-center gap-2">
                    <Plus className="w-6 h-6 text-brand-teal" /> Schedule Consultation
                  </h2>

                  {bookingSuccess ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-4 border border-emerald-100 shadow shadow-emerald-500/10">
                        <CheckCircle className="w-9 h-9" />
                      </div>
                      <h3 className="text-xl font-bold text-slate-800">Booking Successful!</h3>
                      <p className="text-slate-500 text-sm mt-1 max-w-sm">
                        Your appointment has been successfully requested. The doctor will review your request shortly.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={handleBook} className="space-y-6">
                      
                      {/* Doctor Select Grid */}
                      <div>
                        <label className="block text-slate-700 font-extrabold text-sm mb-3">Select Doctor Specialist</label>
                        {doctors.length === 0 ? (
                          <div className="p-6 bg-slate-50 border border-slate-200/50 text-slate-500 text-center rounded-2xl text-sm font-semibold">
                            No approved doctors available on the marketplace right now.
                          </div>
                        ) : (
                          <div className="grid gap-4 sm:grid-cols-2">
                            {doctors.map((doc) => (
                              <div
                                key={doc.id}
                                onClick={() => setSelectedDoctorId(doc.id)}
                                className={`p-5 rounded-2xl cursor-pointer border-2 transition-all flex items-start gap-3.5 ${
                                  selectedDoctorId === doc.id
                                    ? 'border-brand-teal bg-brand-teal-light/30 shadow-md shadow-brand-teal/5'
                                    : 'border-slate-150 bg-slate-50 hover:bg-slate-100/70'
                                }`}
                              >
                                <div className="w-10 h-10 rounded-xl bg-white border border-slate-200/50 flex items-center justify-center flex-shrink-0 text-slate-400 shadow-sm">
                                  <User className="w-5 h-5 text-brand-teal" />
                                </div>
                                <div className="overflow-hidden">
                                  <h4 className="font-bold text-slate-900 truncate">{doc.full_name}</h4>
                                  <p className="text-brand-teal text-xs font-extrabold uppercase tracking-wide mt-0.5">
                                    {doc.doctor_profile?.specialty}
                                  </p>
                                  <p className="text-slate-400 text-[11px] mt-1 line-clamp-2">
                                    {doc.doctor_profile?.bio || 'No profile description available.'}
                                  </p>
                                  <p className="text-[10px] text-slate-400 mt-1.5 font-semibold">
                                    Experience: {doc.doctor_profile?.years_experience} years
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Date picker */}
                      <div className="max-w-md">
                        <label htmlFor="confirmed_slot" className="block text-slate-700 font-extrabold text-sm mb-2">
                          Select Consultation Date & Time
                        </label>
                        <input
                          id="confirmed_slot"
                          type="datetime-local"
                          required
                          min={getLocalISOString()}
                          value={confirmedSlot}
                          onChange={(e) => setConfirmedSlot(e.target.value)}
                          className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-150 text-slate-800 rounded-xl font-bold text-sm focus:border-brand-teal focus:outline-none transition-all"
                        />
                      </div>

                      {/* Submit */}
                      <div className="pt-4 border-t border-slate-150 flex justify-end gap-3">
                        <button
                          type="button"
                          onClick={() => setActiveTab('my')}
                          className="px-5 py-3 border-2 border-slate-200 text-slate-500 rounded-xl font-bold text-sm hover:bg-slate-50 active:scale-95 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={bookingLoading || !selectedDoctorId || !confirmedSlot}
                          className="px-6 py-3 bg-brand-teal text-white rounded-xl font-bold text-sm shadow-md shadow-brand-teal/25 hover:bg-brand-teal-dark disabled:bg-slate-200 disabled:text-slate-400 disabled:shadow-none active:scale-95 transition-all flex items-center gap-2"
                        >
                          {bookingLoading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" /> Scheduling...
                            </>
                          ) : (
                            <>
                              Schedule Appointment
                            </>
                          )}
                        </button>
                      </div>

                    </form>
                  )}
                </motion.div>
              ) : (
                <motion.div 
                  key="consultation-history" 
                  initial={{ opacity: 0, x: 10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6"
                >
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-brand-teal" />
                      Consultation History
                    </h2>
                    <button 
                      onClick={fetchAppointments} 
                      className="p-2 hover:bg-slate-100 rounded-xl transition-all text-slate-400 hover:text-slate-600"
                      title="Refresh schedule"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                  </div>

                  {historyAppointments.length === 0 ? (
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 p-12 text-center">
                      <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-5 border-2 border-slate-100">
                        <Clock className="w-9 h-9 text-slate-400" />
                      </div>
                      <p className="text-slate-800 font-extrabold text-lg">No past consultations</p>
                      <p className="text-slate-400 text-sm mt-1 max-w-sm mx-auto">
                        Your completed, rejected, and past consultation history will be listed here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-4 md:grid-cols-2">
                      {historyAppointments.map((appointment) => {
                        const partnerName = role === 'patient' 
                          ? (appointment.doctor?.full_name || 'Doctor')
                          : (appointment.patient?.full_name || 'Patient');
                        const partnerEmail = role === 'patient'
                          ? appointment.doctor?.email
                          : appointment.patient?.email;
                        const spec = role === 'patient' && appointment.doctor?.doctor_profile?.specialty;

                        return (
                          <motion.div
                            key={appointment.id}
                            whileHover={{ y: -2 }}
                            className="bg-white/90 backdrop-blur rounded-3xl p-6 border border-slate-100 shadow-md shadow-slate-100/40 flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex justify-between items-start mb-4">
                                <span className={`px-3.5 py-1.5 rounded-full text-xs font-bold tracking-wide uppercase ${
                                  appointment.status === 'confirmed'
                                    ? 'bg-emerald-50 text-emerald-600 border border-emerald-100'
                                    : appointment.status === 'rejected'
                                    ? 'bg-rose-50 text-rose-600 border border-rose-100'
                                    : appointment.status === 'proposed'
                                    ? 'bg-purple-50 text-purple-600 border border-purple-100'
                                    : 'bg-slate-100 text-slate-600 border border-slate-200'
                                }`}>
                                  {appointment.status}
                                </span>
                                <div className="text-right text-xs text-slate-400 flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5" />
                                  {formatSlot(appointment.confirmed_slot)}
                                </div>
                              </div>

                              <div className="flex gap-4 items-start mb-4">
                                <div className="w-12 h-12 rounded-2xl bg-slate-100 border border-slate-200/50 flex items-center justify-center text-slate-500 font-bold shadow-inner">
                                  <User className="w-6 h-6 text-slate-400" />
                                </div>
                                <div>
                                  <h3 className="font-bold text-slate-900">{partnerName}</h3>
                                  <p className="text-slate-400 text-xs">{partnerEmail}</p>
                                  {spec && (
                                    <p className="text-brand-teal text-xs font-semibold mt-1 bg-brand-teal-light/50 px-2.5 py-0.5 rounded-md w-fit">
                                      {spec}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Reschedule inline if rejected */}
                            {role === 'patient' && appointment.status === 'rejected' && (
                              <div className="border-t border-slate-100 pt-4 mt-2">
                                {reschedulingId === appointment.id ? (
                                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                    <label className="block text-xs font-bold text-slate-500">Choose New Slot</label>
                                    <input
                                      type="datetime-local"
                                      required
                                      min={getLocalISOString()}
                                      value={rescheduleTime}
                                      onChange={e => setRescheduleTime(e.target.value)}
                                      className="w-full px-3 py-2 bg-white border border-slate-200 text-slate-800 rounded-xl font-bold text-xs focus:outline-none focus:ring-2 focus:ring-brand-teal/20"
                                    />
                                    <div className="flex gap-2 justify-end">
                                      <button
                                        type="button"
                                        onClick={() => setReschedulingId(null)}
                                        className="px-3 py-1.5 border border-slate-200 hover:bg-slate-100 rounded-xl text-slate-500 font-bold text-[11px]"
                                      >
                                        Cancel
                                      </button>
                                      <button
                                        type="button"
                                        onClick={() => handleReschedule(appointment.id)}
                                        disabled={rescheduleLoading || !rescheduleTime}
                                        className="px-3 py-1.5 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl font-bold text-[11px] flex items-center gap-1 shadow-sm"
                                      >
                                        {rescheduleLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                        Confirm Reschedule
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  <button
                                    onClick={() => setReschedulingId(appointment.id)}
                                    className="w-full py-2 bg-brand-teal hover:bg-brand-teal-dark text-white rounded-xl font-bold text-xs transition-all"
                                  >
                                    Reschedule Appointment
                                  </button>
                                )}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          )}

        </motion.div>
      </div>
    </SidebarLayout>
  );
}
