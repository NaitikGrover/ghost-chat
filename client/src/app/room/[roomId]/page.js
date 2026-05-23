"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import socket from "@/lib/socket";
import { 
  Mic, 
  Image as ImageIcon, 
  Play, 
  Pause, 
  CornerUpLeft, 
  X, 
  Send, 
  Check, 
  Shield,
  Volume2,
  Share2,
  LogOut,
  Power,
  Copy,
  ExternalLink,
  Users,
  Plus,
  Shuffle,
  Download,
  FileText,
  Video,
  Music,
  Archive,
  MoreHorizontal
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

// Woman portrait matching Reet's avatar visual style from the screenshot
const REET_AVATAR = "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80";


export default function RoomPage() {
  const { roomId } = useParams();
  const { name, avatar } = useUser();
  const router = useRouter();

  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [roomNameDisplay, setRoomNameDisplay] = useState("Reet");
  const [errorMsg, setErrorMsg] = useState("");
  const [viewportHeight, setViewportHeight] = useState("100dvh");
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);

  // Reply Mode State
  const [replyTo, setReplyTo] = useState(null);

  // File Preview and Download States/Helpers
  const [previewFile, setPreviewFile] = useState(null);

  const downloadFile = (fileUrl, fileName) => {
    if (!fileUrl) return;
    const link = document.createElement("a");
    link.href = fileUrl;
    link.download = fileName || "downloaded-file";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const openPreview = (msg) => {
    setPreviewFile({
      url: msg.fileUrl || msg.imageUrl,
      name: msg.fileName || (msg.messageType === "video" ? "video.mp4" : "image.png"),
      type: msg.messageType,
    });
  };



  // Image Upload Ref
  const fileInputRef = useRef(null);
  const chatInputRef = useRef(null);

  // Simulated Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const recordingTimerRef = useRef(null);

  // Audio Playback states (synced with custom waveform animations)
  const [audioPlayback, setAudioPlayback] = useState({
    messageId: null,
    progress: 0,
  });
  const audioIntervalRef = useRef(null);

  // Transcription expansion state
  const [showTranscriptionId, setShowTranscriptionId] = useState(null);

  const messagesEndRef = useRef(null);

  // Self-Destruct Timer & Expiry states
  const [roomDetails, setRoomDetails] = useState(null);
  const [timeLeft, setTimeLeft] = useState("");
  const [isUrgent, setIsUrgent] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Online Users Count
  const [userCount, setUserCount] = useState(1);
  const [usersList, setUsersList] = useState([]);
  const [showUsersDrawer, setShowUsersDrawer] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showMicToast, setShowMicToast] = useState(false);

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState(null); // null | 'terminate' | 'leave' | 'make-admin'
  const [targetAdminUser, setTargetAdminUser] = useState(null);

  // Helper to format countdown from milliseconds
  const formatCountdown = (ms) => {
    if (ms <= 0) return "00:00";
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
  };

  // Timer Effect
  useEffect(() => {
    if (!roomDetails) return;

    const endTime = roomDetails.createdAt + roomDetails.duration * 60 * 1000;

    const updateTimer = () => {
      const remaining = endTime - Date.now();
      if (remaining <= 0) {
        setTimeLeft("00:00");
        setIsUrgent(true);
        return;
      }
      setTimeLeft(formatCountdown(remaining));
      setIsUrgent(remaining < 60000); // Pulse red when less than 1 minute remains
    };

    updateTimer();
    const timerInterval = setInterval(updateTimer, 1000);

    return () => clearInterval(timerInterval);
  }, [roomDetails]);

  // Handle mobile visual viewport (virtual keyboard height adjustments)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleResize = () => {
      if (window.visualViewport) {
        const isMobile = window.innerWidth < 768;
        const keyboardOpen = isMobile && window.visualViewport.height < window.innerHeight * 0.85;
        setIsKeyboardOpen(keyboardOpen);
        setViewportHeight(`${window.visualViewport.height}px`);
      } else {
        setViewportHeight("100dvh");
        setIsKeyboardOpen(false);
      }
    };

    handleResize();

    if (window.visualViewport) {
      window.visualViewport.addEventListener("resize", handleResize);
      window.visualViewport.addEventListener("scroll", handleResize);
    }
    window.addEventListener("resize", handleResize);

    return () => {
      if (window.visualViewport) {
        window.visualViewport.removeEventListener("resize", handleResize);
        window.visualViewport.removeEventListener("scroll", handleResize);
      }
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Prevent double scroll or shifts when input is focused on mobile
  useEffect(() => {
    if (typeof window === "undefined" || !window.visualViewport) return;

    const handleViewportScroll = () => {
      if (document.activeElement?.tagName === "TEXTAREA" || document.activeElement?.tagName === "INPUT") {
        window.scrollTo(0, 0);
      }
    };

    window.visualViewport.addEventListener("scroll", handleViewportScroll);
    return () => {
      window.visualViewport?.removeEventListener("scroll", handleViewportScroll);
    };
  }, []);

  const handleTerminateRoom = () => {
    setConfirmModal('terminate');
  };

  const handleLeaveRoom = () => {
    setConfirmModal('leave');
  };

  const confirmTerminate = () => {
    setConfirmModal(null);
    socket.emit("terminate-room", { roomId });
  };

  const confirmLeave = () => {
    setConfirmModal(null);
    socket.emit("leave-room", { roomId, name });
    router.push("/lobby");
  };

  const handleSkip = () => {
    socket.emit("skip-peer", { roomId });
    router.push("/lobby?requeue=true");
  };

  const confirmMakeAdmin = () => {
    setConfirmModal(null);
    if (targetAdminUser) {
      socket.emit("make-admin", { roomId, adminName: name, targetUserName: targetAdminUser });
      setTargetAdminUser(null);
    }
  };

  const handleCopyLink = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  // Load / Setup Room
  useEffect(() => {
    if (!name) {
      const timeout = setTimeout(() => {
        if (!sessionStorage.getItem("ghost_name")) {
          sessionStorage.setItem("intended_room", roomId);
          router.push("/");
        }
      }, 500);
      return () => clearTimeout(timeout);
    }

    // Connect socket
    socket.emit("join-room", { roomId, name, avatar });

    const handleReceiveMessage = (data) => {
      const msgId = Math.random().toString();
      setMessages((prev) => [...prev, { ...data, isMine: false, id: msgId }]);
    };

    const handleRoomDetails = (data) => {
      setRoomDetails(data);
      // Set name to Reet if room is initialized (to showcase the exact mockup style), or display custom room name
      setRoomNameDisplay(data.roomName === "My Room" || data.roomName === "Secure Room" ? "Reet" : data.roomName);
    };

    const handleErrorMessage = (msg) => setErrorMsg(msg);
    const handleRoomExpired = (msg) => setErrorMsg(msg);
    const handleUserJoined = (users) => {
      setUsersList(users);
      setUserCount(users.length);
    };
    const handleKicked = (msg) => setErrorMsg(msg);

    const handlePeerSkipped = () => {
      setErrorMsg("The other person left the chat.");
    };

    socket.on("receive-message", handleReceiveMessage);
    socket.on("room-details", handleRoomDetails);
    socket.on("error-message", handleErrorMessage);
    socket.on("room-expired", handleRoomExpired);
    socket.on("user-joined", handleUserJoined);
    socket.on("kicked", handleKicked);
    socket.on("peer-skipped", handlePeerSkipped);

    return () => {
      // Explicitly emit leave-room so the server updates count and broadcasts to other users immediately
      socket.emit("leave-room", { roomId, name });

      socket.off("receive-message", handleReceiveMessage);
      socket.off("room-details", handleRoomDetails);
      socket.off("error-message", handleErrorMessage);
      socket.off("room-expired", handleRoomExpired);
      socket.off("user-joined", handleUserJoined);
      socket.off("kicked", handleKicked);
      socket.off("peer-skipped", handlePeerSkipped);
    };
  }, [roomId, name, router]);

  // Handle browser tab close, refreshes, or navigation to external URLs
  useEffect(() => {
    if (!name || !roomId) return;

    const handleTabClose = () => {
      socket.emit("leave-room", { roomId, name });
    };

    window.addEventListener("beforeunload", handleTabClose);
    window.addEventListener("pagehide", handleTabClose);

    return () => {
      window.removeEventListener("beforeunload", handleTabClose);
      window.removeEventListener("pagehide", handleTabClose);
    };
  }, [roomId, name]);

  // Recording timer simulation
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } else {
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
    return () => clearInterval(recordingTimerRef.current);
  }, [isRecording]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-focus chat input when replying
  useEffect(() => {
    if (replyTo) {
      chatInputRef.current?.focus();
    }
  }, [replyTo]);

  // Auto-resize textarea height as content changes
  useEffect(() => {
    const textarea = chatInputRef.current;
    if (textarea) {
      textarea.style.height = "auto";
      textarea.style.height = `${Math.min(textarea.scrollHeight, 160)}px`;
    }
  }, [inputMessage]);

  // Send standard or media/reply message
  const handleSendMessage = (messageText = null, extraData = {}) => {
    const finalMessageText = messageText || inputMessage;
    if (!finalMessageText.trim() && !extraData.messageType) return;

    const msgId = Math.random().toString();
    const payload = {
      roomId,
      message: finalMessageText,
      senderName: name,
      id: msgId,
      replyTo: replyTo ? replyTo.senderName : undefined,
      replyToText: replyTo ? replyTo.message : undefined,
      ...extraData,
    };

    // Emit via Socket
    socket.emit("send-message", payload);

    // Save locally
    setMessages((prev) => [
      ...prev,
      {
        ...payload,
        isMine: true,
        timestamp: Date.now(),
      },
    ]);

    // Reset input states
    setInputMessage("");
    setReplyTo(null);
  };

  const handleFormSubmit = (e) => {
    e.preventDefault();
    handleSendMessage();
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Image Upload Action (paperclip/gallery icon)
  const triggerImageUpload = () => {
    fileInputRef.current?.click();
  };

  const formatBytes = (bytes, decimals = 1) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const fileType = file.type;
      const isImg = fileType.startsWith("image/");
      const isVid = fileType.startsWith("video/");
      
      let msgType = "file";
      if (isImg) msgType = "image";
      else if (isVid) msgType = "video";

      handleSendMessage("", {
        messageType: msgType,
        fileUrl: reader.result,
        fileName: file.name,
        fileSize: formatBytes(file.size),
        fileType: fileType,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = ""; // Reset
  };

  // Audio Playback Sweep Animation (extremely high fidelity)
  const toggleAudioPlay = (msgId) => {
    if (audioPlayback.messageId === msgId) {
      // Pause
      setAudioPlayback({ messageId: null, progress: 0 });
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
    } else {
      // Play
      if (audioIntervalRef.current) clearInterval(audioIntervalRef.current);
      
      setAudioPlayback({ messageId: msgId, progress: 0 });
      
      audioIntervalRef.current = setInterval(() => {
        setAudioPlayback((prev) => {
          if (prev.progress >= 100) {
            clearInterval(audioIntervalRef.current);
            return { messageId: null, progress: 0 };
          }
          return { ...prev, progress: prev.progress + 4 };
        });
      }, 350); // synced to take roughly 8-10 seconds to sweep
    }
  };

  // Voice Recording Actions
  const toggleRecording = () => {
    if (isRecording) {
      // Send recording
      setIsRecording(false);
      const minutes = Math.floor(recordingSeconds / 60);
      const seconds = recordingSeconds % 60;
      const formattedDuration = `${minutes}:${seconds.toString().padStart(2, "0")}`;

      handleSendMessage("", {
        messageType: "audio",
        audioDuration: formattedDuration || "0:09",
        transcription: "Hello, this is an automated transcription of the voice note I just recorded securely.",
        waveform: Array.from({ length: 28 }, () => Math.floor(Math.random() * 55) + 10),
      });
    } else {
      // Start recording
      setIsRecording(true);
    }
  };

  const cancelRecording = () => {
    setIsRecording(false);
  };

  if (!name) return null;

  if (errorMsg) {
    const isSkipped = errorMsg.includes("skipped") || errorMsg.includes("left the chat");
    return (
      <main className="h-screen w-full flex items-center justify-center relative z-10 p-6 font-sans bg-black animate-in fade-in">
        <div className="bg-[#1c1c1e] border border-white/5 p-8 rounded-3xl max-w-md w-full text-center space-y-6 animate-in zoom-in duration-500 shadow-2xl">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto border ${
            isSkipped ? "bg-amber-500/10 border-amber-500/20" : "bg-red-500/10 border-red-500/20"
          }`}>
            {isSkipped ? (
              <Shuffle className="w-8 h-8 text-amber-500 animate-pulse" />
            ) : (
              <Shield className="w-8 h-8 text-red-500" />
            )}
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-white tracking-tighter uppercase">
              {isSkipped ? "Chat Ended" : "Connection Dropped"}
            </h2>
            <p className="text-sm text-zinc-500 font-medium">{errorMsg}</p>
          </div>
          <button 
            onClick={() => router.push(isSkipped ? "/lobby?requeue=true" : "/lobby")}
            className={`w-full h-12 rounded-xl font-bold text-xs uppercase tracking-widest transition-all ${
              isSkipped 
                ? "bg-amber-500/10 border border-amber-500/25 hover:bg-amber-500/25 text-amber-400" 
                : "bg-white/5 border border-white/10 hover:bg-white/10 text-white"
            }`}
          >
            {isSkipped ? "Find Next" : "Return to Lobby"}
          </button>
        </div>
      </main>
    );
  }

  // Format time inside mockup style
  const getMockFormattedTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: false });
  };



  return (
    <main 
      style={{ height: viewportHeight }}
      className="w-full flex flex-col relative z-10 overflow-hidden font-sans bg-transparent"
    >

      {/* Confirmation Modal Overlay */}
      <AnimatePresence>
        {confirmModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-999 flex items-center justify-center bg-black/70 backdrop-blur-sm p-6"
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.85, opacity: 0, y: 20 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
              className="bg-[#0a0a0a]/98 border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl text-center space-y-5"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto border ${
                confirmModal === 'terminate'
                  ? 'bg-red-500/10 border-red-500/25'
                  : confirmModal === 'make-admin'
                  ? 'bg-blue-500/10 border-blue-500/25'
                  : 'bg-amber-500/10 border-amber-500/25'
              }`}>
                {confirmModal === 'terminate' ? (
                  <Power className="w-6 h-6 text-red-400" />
                ) : confirmModal === 'make-admin' ? (
                  <Users className="w-6 h-6 text-blue-400" />
                ) : (
                  <LogOut className="w-6 h-6 text-amber-400" />
                )}
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-black text-white tracking-tight">
                  {confirmModal === 'terminate' ? 'Terminate Tunnel?' : confirmModal === 'make-admin' ? 'Transfer Ownership?' : 'Leave Room?'}
                </h3>
                <p className="text-sm text-zinc-500 font-medium leading-relaxed">
                  {confirmModal === 'terminate'
                    ? 'This will permanently dissolve the secure tunnel for all participants. This action cannot be undone.'
                    : confirmModal === 'make-admin'
                    ? `Are you sure you want to transfer admin ownership of this room to ${targetAdminUser}? You will lose admin privileges.`
                    : 'You will exit this room. The tunnel remains active for other participants.'}
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setConfirmModal(null);
                    setTargetAdminUser(null);
                  }}
                  className="flex-1 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-zinc-300 font-bold text-sm transition-all"
                >
                  Cancel
                </button>
                <button
                  onClick={
                    confirmModal === 'terminate'
                      ? confirmTerminate
                      : confirmModal === 'make-admin'
                      ? confirmMakeAdmin
                      : confirmLeave
                  }
                  className={`flex-1 h-11 rounded-xl font-bold text-sm transition-all ${
                    confirmModal === 'terminate'
                      ? 'bg-red-500/15 border border-red-500/30 hover:bg-red-500/30 text-red-300'
                      : confirmModal === 'make-admin'
                      ? 'bg-blue-500/15 border border-blue-500/30 hover:bg-blue-500/30 text-blue-300'
                      : 'bg-amber-500/15 border border-amber-500/30 hover:bg-amber-500/30 text-amber-300'
                  }`}
                >
                  {confirmModal === 'terminate' ? 'Terminate' : confirmModal === 'make-admin' ? 'Transfer' : 'Leave'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mic Coming Soon Toast */}
      <AnimatePresence>
        {showMicToast && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-999 w-[90%] max-w-sm bg-[#0a0a0c]/95 backdrop-blur-3xl border border-blue-500/20 rounded-2xl p-4 shadow-[0_0_30px_rgba(59,130,246,0.15)] flex items-center gap-3.5"
          >
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0 animate-pulse">
              <Mic className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="text-[8px] font-mono text-blue-500 uppercase tracking-widest block font-black mb-0.5">Transmission Blocked</span>
              <p className="text-xs font-semibold text-zinc-200 tracking-wide">
                Secure voice tunneling coming soon!
              </p>
            </div>
            <button 
              type="button"
              onClick={() => setShowMicToast(false)}
              className="p-1 rounded-full hover:bg-white/5 text-zinc-500 hover:text-zinc-300 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hidden File Picker */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        accept="*/*" 
        className="hidden" 
      />

      {/* Header matching exact layout and icons */}
      <header className="w-full h-20 px-4 md:px-6 flex justify-between items-center bg-black/10 backdrop-blur-md border-b border-white/5 relative z-20 shrink-0">
        
        {/* Glowing Cybernetic Status Monitor */}
        <div className="flex flex-col justify-center shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[9px] uppercase tracking-[0.25em] text-zinc-500 font-mono font-black">TUNNEL //</span>
            <h1 className="text-[13px] font-black tracking-wider text-white font-mono leading-none">
              {roomNameDisplay}
            </h1>
          </div>
          <div className="flex items-center gap-2 mt-1">
            {/* Sleek Pulse Beacon */}
            <span className={`w-1.5 h-1.5 rounded-full ${
              isUrgent 
                ? "bg-red-500 animate-pulse shadow-[0_0_6px_#ef4444]" 
                : "bg-cyan-400 animate-pulse shadow-[0_0_6px_#22d3ee]"
            }`} />
            
            <span className={`text-[9px] font-mono font-bold tracking-widest uppercase ${
              isUrgent ? "text-red-500 animate-pulse" : "text-zinc-400"
            }`}>
              {timeLeft ? `AUTO-BURN: ${timeLeft}` : "Securing Tunnel..."}
            </span>
          </div>
        </div>

        {/* Right Action Controls - Icon Only */}
        <div className="flex items-center gap-1 sm:gap-2 mr-1">
          {/* Skip Peer Action (Random chat only) */}
          {roomDetails?.isRandom && (
            <button
              type="button"
              title="Skip (Find Next)"
              onClick={handleSkip}
              className="flex items-center gap-1.5 px-3 h-8 sm:h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/25 hover:border-amber-500/40 text-amber-400 hover:text-amber-300 transition-all font-mono text-[10px] sm:text-xs font-bold uppercase tracking-wider cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Next Chat</span>
            </button>
          )}
          {/* Active Users Count and List Trigger */}
          <button
            type="button"
            title="Active Users"
            onClick={() => setShowUsersDrawer(true)}
            className={`hidden sm:flex items-center gap-1.5 px-2 sm:px-3 h-8 sm:h-9 rounded-xl border transition-all duration-300 relative group overflow-hidden ${
              showUsersDrawer
                ? "bg-white/15 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-400 hover:text-white"
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span className="text-[10px] sm:text-[11px] font-black tracking-widest font-mono">
              {userCount}
            </span>
          </button>

          {/* Room Code Copy Box */}
          {!roomDetails?.isRandom && (
          <>
          <button
            type="button"
            title="Click to copy room code"
            onClick={() => {
              navigator.clipboard.writeText(roomId);
              setCopiedLink(true);
              setTimeout(() => setCopiedLink(false), 2000);
            }}
            className="hidden sm:flex items-center gap-1.5 px-2 sm:px-3 h-8 sm:h-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 transition-all group"
          >
            <span className="hidden sm:inline text-[11px] font-black tracking-[0.2em] uppercase text-zinc-400 group-hover:text-white transition-colors font-mono">
              {copiedLink ? "Copied!" : roomId}
            </span>
            {copiedLink
              ? <Check className="w-3 h-3 text-emerald-400 animate-in zoom-in duration-200 shrink-0" />
              : <Copy className="w-3 h-3 text-zinc-600 group-hover:text-zinc-300 transition-colors shrink-0" />
            }
          </button>

          {/* Share Button with beautiful glassmorphic popover */}
          <div className="hidden sm:block relative">
            <button 
              type="button"
              title="Share Room"
              onClick={() => setShowShareMenu(!showShareMenu)}
              className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center transition-all ${
                showShareMenu
                  ? 'bg-white/15 border border-white/20 text-white'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-400 hover:text-white'
              }`}
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Glassmorphic Share Dropdown Popover */}
            <AnimatePresence>
              {showShareMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  className="absolute right-0 mt-3 w-64 bg-[#0a0a0a]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 p-4 space-y-3"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-[11px] font-bold text-zinc-400 uppercase tracking-widest">Share Secure Room</span>
                    <button 
                      type="button"
                      onClick={() => setShowShareMenu(false)}
                      className="p-1 rounded-full hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="space-y-2">
                    {/* Copy Link Button */}
                    <button
                      type="button"
                      onClick={handleCopyLink}
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all text-left group"
                    >
                      <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">
                        {copiedLink ? "Copied Tunnel Link!" : "Copy Link"}
                      </span>
                      {copiedLink ? (
                        <Check className="w-3.5 h-3.5 text-green-400 animate-in zoom-in duration-200" />
                      ) : (
                        <Copy className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                      )}
                    </button>

                    {/* WhatsApp Button */}
                    <a
                      href={`https://wa.me/?text=${encodeURIComponent(`Join my secure Adyber room: ${typeof window !== "undefined" ? window.location.href : ""}`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-between p-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all group"
                    >
                      <span className="text-xs font-semibold text-zinc-300 group-hover:text-white transition-colors">WhatsApp</span>
                      <ExternalLink className="w-3.5 h-3.5 text-zinc-500 group-hover:text-white transition-colors" />
                    </a>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          </>
          )}

          {/* Leave Button - Icon Only */}
          <button 
            type="button"
            title="Leave Room"
            onClick={handleLeaveRoom}
            className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 rounded-xl items-center justify-center bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-400 hover:text-white transition-all"
          >
            <LogOut className="w-4 h-4" />
          </button>

          {/* Terminate Button - Icon Only, red tinted */}
          {name === roomDetails?.adminName && (
            <button 
              type="button" 
              title="Terminate Room" 
              onClick={handleTerminateRoom}
              className="hidden sm:flex w-8 h-8 sm:w-9 sm:h-9 rounded-xl items-center justify-center bg-red-500/10 border border-red-500/20 hover:bg-red-500/25 hover:border-red-500/40 text-red-400 hover:text-red-300 transition-all"
            >
              <Power className="w-4 h-4" />
            </button>
          )}

          {/* Mobile More Options Button */}
          <div className="relative sm:hidden">
            <button
              type="button"
              onClick={() => setShowMoreMenu(!showMoreMenu)}
              className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all ${
                showMoreMenu
                  ? 'bg-white/15 border border-white/20 text-white shadow-[0_0_12px_rgba(255,255,255,0.15)]'
                  : 'bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-400 hover:text-white'
              }`}
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>

            {/* Mobile More Options Dropdown List */}
            <AnimatePresence>
              {showMoreMenu && (
                <>
                  {/* Backdrop */}
                  <div 
                    onClick={() => setShowMoreMenu(false)}
                    className="fixed inset-0 z-40 bg-transparent"
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-[#0a0a0c]/95 backdrop-blur-2xl border border-white/10 rounded-2xl shadow-2xl z-50 p-2.5 flex flex-col gap-1"
                  >
                    {/* Active Users */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowUsersDrawer(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-all text-left cursor-pointer"
                    >
                      <Users className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-semibold">Active Users ({userCount})</span>
                    </button>

                    {/* Copy Code */}
                    {!roomDetails?.isRandom && (
                    <>
                    <button
                      type="button"
                      onClick={() => {
                        navigator.clipboard.writeText(roomId);
                        setCopiedLink(true);
                        setTimeout(() => setCopiedLink(false), 2000);
                      }}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-all text-left cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        {copiedLink ? (
                          <Check className="w-4 h-4 text-emerald-400 animate-in zoom-in duration-200" />
                        ) : (
                          <Copy className="w-4 h-4 text-zinc-500 group-hover:text-white transition-colors" />
                        )}
                        <span className="text-xs font-semibold">{copiedLink ? "Copied!" : "Copy Code"}</span>
                      </div>
                      <span className="text-[10px] font-mono text-zinc-500 font-bold">{roomId}</span>
                    </button>

                    {/* Share Room */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        setShowShareMenu(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-all text-left cursor-pointer"
                    >
                      <Share2 className="w-4 h-4 text-cyan-400" />
                      <span className="text-xs font-semibold">Share Tunnel</span>
                    </button>

                    <div className="h-px bg-white/5 my-1 w-full" />
                    </>
                    )}

                    {/* Leave Room */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowMoreMenu(false);
                        handleLeaveRoom();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/5 text-zinc-300 hover:text-white transition-all text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-amber-400" />
                      <span className="text-xs font-semibold">Leave Room</span>
                    </button>

                    {/* Terminate Room (Admin Only) */}
                    {name === roomDetails?.adminName && (
                      <button
                        type="button"
                        onClick={() => {
                          setShowMoreMenu(false);
                          handleTerminateRoom();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400 hover:text-red-300 transition-all text-left border border-transparent hover:border-red-500/10 cursor-pointer"
                      >
                        <Power className="w-4 h-4 text-red-500" />
                        <span className="text-xs font-semibold">Terminate Tunnel</span>
                      </button>
                    )}

                  </motion.div>
                </>
                )}
              </AnimatePresence>
            </div>
        </div>
      </header>

      {/* Message Feed - pure transparent layout with background universe video */}
      <div className="flex-1 min-h-0 overflow-y-auto px-6 py-6 scrollbar-hide bg-transparent">
        
        {messages.map((msg, idx) => {
          const isMine = msg.isMine;
          const isSystem = msg.isSystem || msg.senderName === "SYSTEM";

          // Grouping helpers — compare with prev/next non-system messages
          const prevMsg = messages[idx - 1];
          const nextMsg = messages[idx + 1];
          const sameAsPrev = !isSystem && prevMsg && !prevMsg.isSystem && prevMsg.senderName === msg.senderName && prevMsg.isMine === msg.isMine;
          const sameAsNext = !isSystem && nextMsg && !nextMsg.isSystem && nextMsg.senderName === msg.senderName && nextMsg.isMine === msg.isMine;

          // Show sender name only at the very start of a group
          const showSenderName = !isMine && !isSystem && !sameAsPrev;

          // Gap: tiny below if NEXT message is from same sender, normal otherwise
          const rowGap = isSystem ? "my-3" : sameAsNext ? "mb-[1px]" : "mb-3.5";
          
          // Render system join/leave notification
          if (isSystem) {
            return (
              <div key={msg.id || idx} className="flex justify-center py-1">
                <span className="text-[11px] text-zinc-600 font-medium bg-white/3 border border-white/5 px-3 py-1 rounded-full">
                  {msg.message}
                </span>
              </div>
            );
          }

          return (
            <div 
              key={msg.id || idx} 
              className={`flex w-full items-end gap-3 ${rowGap} ${isMine ? "justify-end" : "justify-start"}`}
            >
              {/* Main message bubble block */}
              <div className={`flex flex-col min-w-0 max-w-[85%] sm:max-w-[50%] relative`}>
                
                {/* Reply Indicator text above bubble */}
                {msg.replyTo && (
                  <span className="text-[11px] text-zinc-500 font-medium mb-1 px-1 block">
                    {msg.senderName} replied to {msg.replyTo === name ? "you" : msg.replyTo}
                  </span>
                )}

                {/* Reply replica preview */}
                {msg.replyTo && (
                  <div className={`mb-1 px-4 py-2.5 rounded-[1.25rem] text-[14.5px] leading-[1.4] font-medium tracking-wide truncate max-w-full opacity-50 ${
                    isMine 
                      ? "bg-[#3753e8] text-white"
                      : "bg-[#262626] text-white"
                  }`}>
                    {msg.replyToText}
                  </div>
                )}

                {/* Sender name label - ABOVE the first bubble of a group, incoming only */}
                {showSenderName && !msg.replyTo && (
                  <span className="text-[10px] font-bold tracking-wide text-zinc-500 mb-1 px-1 self-start">
                    {msg.senderName}
                  </span>
                )}

                {/* Bubble wrapper to isolate hover & vertical alignment */}
                <div className={`relative group flex items-center max-w-full ${isMine ? "self-end" : "self-start"}`}>
                  
                  {/* Message Bubble Rendering */}
                  {msg.messageType === "audio" ? (
                    // Outgoing Audio waveform styled exactly like screenshot
                    <div className={`px-5 py-4 rounded-[1.5rem] bg-[#3753e8] text-white flex flex-col gap-3 shadow-lg select-none ${
                      isMine ? "rounded-br-md" : "rounded-bl-md"
                    }`}>
                      <div className="flex items-center gap-3">
                        {/* Play/Pause Button */}
                        <button 
                          onClick={() => toggleAudioPlay(msg.id)}
                          className="w-9 h-9 rounded-full bg-white flex items-center justify-center text-[#3753e8] hover:scale-105 active:scale-95 transition-all shadow-md shrink-0"
                        >
                          {audioPlayback.messageId === msg.id ? (
                            <Pause className="w-4 h-4 fill-[#3753e8] stroke-0 ml-px" />
                          ) : (
                            <Play className="w-4 h-4 fill-[#3753e8] stroke-0 ml-1" />
                          )}
                        </button>

                        {/* Custom Waveform bars */}
                        <div className="flex items-end gap-[1.5px] sm:gap-[2px] h-10 px-1 flex-1">
                          {(msg.waveform || Array.from({ length: 28 }, () => 20)).map((val, wIdx) => {
                            const barProgress = (wIdx / 28) * 100;
                            const isActive = audioPlayback.messageId === msg.id && audioPlayback.progress >= barProgress;
                            return (
                              <div 
                                key={wIdx} 
                                style={{ height: `${val}%` }} 
                                className={`w-[2px] sm:w-[3px] rounded-full transition-all duration-300 ${
                                  isActive 
                                    ? "bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                                    : "bg-white/35"
                                }`}
                              />
                            );
                          })}
                        </div>

                        {/* Duration Tag */}
                        <span className="text-[11px] font-semibold bg-white/15 px-2.5 py-1 rounded-full text-white/95 tracking-wide shrink-0">
                          {msg.audioDuration || "0:09"}
                        </span>
                      </div>

                      {/* View Transcription toggles below wave inside bubble */}
                      <div className="border-t border-white/10 pt-2 flex flex-col gap-1.5">
                        <button 
                          onClick={() => setShowTranscriptionId(showTranscriptionId === msg.id ? null : msg.id)}
                          className="text-[10px] text-white/70 font-bold uppercase tracking-wider text-left hover:text-white transition-colors"
                        >
                          {showTranscriptionId === msg.id ? "Hide transcription" : "View transcription"}
                        </button>
                        
                        {showTranscriptionId === msg.id && (
                          <p className="text-xs text-white/90 leading-relaxed font-medium bg-white/5 p-2 rounded-lg italic border border-white/5">
                            "{msg.transcription || "Areyyyy"}"
                          </p>
                        )}
                      </div>
                    </div>
                  ) : msg.messageType === "image" || msg.messageType === "video" ? (
                    // Image/Video attachment with quick download on hover and detail view on click
                    <div 
                      onClick={() => openPreview(msg)}
                      className="rounded-[1.25rem] overflow-hidden border border-white/5 hover:border-white/10 shadow-2xl relative group bg-[#050505] cursor-pointer max-w-full"
                    >
                      {msg.messageType === "video" ? (
                        <div className="relative">
                          <video 
                            src={msg.fileUrl} 
                            className="w-full max-h-72 object-cover pointer-events-none" 
                          />
                          {/* Play Overlay */}
                          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                            <div className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white group-hover:scale-110 active:scale-95 transition-all">
                              <Play className="w-5 h-5 fill-white stroke-0 ml-0.5" />
                            </div>
                          </div>
                        </div>
                      ) : (
                        <img 
                          src={msg.fileUrl || msg.imageUrl} 
                          alt={msg.fileName || "Attachment"} 
                          className="w-full max-h-72 object-cover hover:scale-[1.02] transition-transform duration-500" 
                        />
                      )}
                      
                      {/* Hover Overlay with Download quick action */}
                      <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-all flex items-end justify-between p-3.5 pointer-events-none">
                        <span className="text-[10px] bg-black/60 backdrop-blur-md text-zinc-300 border border-white/5 px-2 py-1 rounded-md font-mono tracking-wide truncate max-w-[70%]">
                          {msg.fileName || (msg.messageType === "video" ? "video.mp4" : "image.png")}
                        </span>
                        
                        {/* Download button on thumbnail */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // prevent opening preview
                            downloadFile(msg.fileUrl || msg.imageUrl, msg.fileName || (msg.messageType === "video" ? "video.mp4" : "image.png"));
                          }}
                          className="pointer-events-auto w-8 h-8 rounded-full bg-white text-black hover:scale-105 active:scale-95 flex items-center justify-center shadow-lg transition-transform"
                        >
                          <Download className="w-4 h-4 text-black" />
                        </button>
                      </div>
                    </div>
                  ) : msg.messageType === "file" ? (
                    // Stealth-Chic Monochrome Document/File Card
                    (() => {
                      const fileExt = (msg.fileName ? msg.fileName.split('.').pop() : "FILE").toUpperCase();
                      
                      // Dynamically choose format-specific icon but keep styling monochromatic
                      let IconComponent = FileText;
                      const audioExts = ["mp3", "wav", "m4a", "ogg", "flac", "aac"];
                      const archiveExts = ["zip", "rar", "tar", "gz", "7z"];
                      
                      if (audioExts.includes(fileExt.toLowerCase())) {
                        IconComponent = Music;
                      } else if (archiveExts.includes(fileExt.toLowerCase())) {
                        IconComponent = Archive;
                      }

                      return (
                        <button
                          type="button"
                          onClick={() => downloadFile(msg.fileUrl, msg.fileName)}
                          className="px-5 py-4 rounded-2xl bg-zinc-950/40 backdrop-blur-2xl border border-white/5 hover:border-white/20 hover:bg-zinc-900/60 transition-all duration-300 flex items-center gap-4 text-left max-w-full group shadow-2xl"
                        >
                          {/* Left Icon with Stealth Glassmorphic Container */}
                          <div className="p-3 bg-white/5 rounded-xl border border-white/10 group-hover:border-white/20 transition-all shrink-0">
                            <IconComponent className="w-5.5 h-5.5 text-zinc-400 group-hover:text-white transition-colors" />
                          </div>

                          {/* Technical Info Column */}
                          <div className="flex-1 min-w-0 pr-3">
                            <p className="text-[13.5px] font-semibold text-zinc-200 group-hover:text-white tracking-wide truncate max-w-xs transition-colors">
                              {msg.fileName || "document.pdf"}
                            </p>
                            <div className="flex items-center gap-2.5 mt-1.5">
                              <span className="text-[10px] text-zinc-500 font-mono tracking-tight">
                                {msg.fileSize || "Unknown size"}
                              </span>
                              <span className="text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded bg-zinc-900 border border-zinc-800 text-zinc-400 font-sans leading-none">
                                {fileExt}
                              </span>
                            </div>
                          </div>

                          {/* Right Action Button - Premium Monochrome Hollow-to-Solid White/Black Transition */}
                          <div className="w-9 h-9 rounded-full border border-white/10 text-zinc-400 group-hover:text-black group-hover:bg-white group-hover:border-white flex items-center justify-center transition-all duration-300 shrink-0 shadow-sm">
                            <Download className="w-4 h-4 group-hover:scale-105 transition-transform" />
                          </div>
                        </button>
                      );
                    })()
                  ) : (
                    // Standard bubble — corners shaped by group position (square where bubbles touch)
                    <div 
                      className={`px-4 py-2.5 text-[14.5px] leading-[1.4] font-medium tracking-wide whitespace-pre-wrap max-w-full ${
                        isMine
                          ? `bg-[#3753e8] text-white ${
                              !sameAsPrev && !sameAsNext ? 'rounded-[1.25rem]'                                       // solo
                            : !sameAsPrev && sameAsNext  ? 'rounded-[1.25rem] rounded-br-none'                      // first
                            : sameAsPrev  && sameAsNext  ? 'rounded-[1.25rem] rounded-tr-none rounded-br-none'     // middle
                            :                              'rounded-[1.25rem] rounded-tr-none'                      // last
                            }`
                          : `bg-[#262626] text-white ${
                              !sameAsPrev && !sameAsNext ? 'rounded-[1.25rem]'                                       // solo
                            : !sameAsPrev && sameAsNext  ? 'rounded-[1.25rem] rounded-bl-none'                      // first
                            : sameAsPrev  && sameAsNext  ? 'rounded-[1.25rem] rounded-tl-none rounded-bl-none'     // middle
                            :                              'rounded-[1.25rem] rounded-tl-none'                      // last
                            }`
                      }`}
                      style={{ wordBreak: "break-word", overflowWrap: "anywhere" }}
                    >
                      {msg.message}
                    </div>
                  )}

                  {/* Inline Hover Action: Reply Trigger */}
                  <button
                    onClick={() => {
                      setReplyTo(msg);
                      chatInputRef.current?.focus();
                    }}
                    className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 p-2 rounded-full bg-zinc-800 border border-zinc-700 text-zinc-300 hover:text-white transition-all scale-75 hover:scale-90 z-20 ${
                      isMine ? "-left-11" : "-right-11"
                    }`}
                  >
                    <CornerUpLeft className="w-4 h-4" />
                  </button>
                </div>

              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} className="h-4" />
      </div>



      {/* Reply Preview Bar above bottom input container */}
      <AnimatePresence>
        {replyTo && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 py-2 bg-black/40 backdrop-blur-md border-t border-zinc-900/40 flex justify-between items-center text-xs"
          >
            <div className="flex flex-col gap-0.5 truncate text-zinc-400">
              <span className="font-bold text-zinc-300">Replying to @{replyTo.senderName}</span>
              <span className="truncate max-w-md italic">"{replyTo.messageType === "audio" ? "Voice Note" : replyTo.message}"</span>
            </div>
            <button 
              onClick={() => setReplyTo(null)}
              className="p-1 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Input Area - fully transparent, no divider */}
      <div className={`p-3 ${isKeyboardOpen ? 'pb-3' : 'pb-[calc(0.75rem+env(safe-area-inset-bottom))]'} md:p-6 bg-transparent shrink-0`}>
        <form onSubmit={handleFormSubmit} className="max-w-5xl mx-auto flex items-center gap-3 relative">
          
          {/* Main Input Container Pill - semi-transparent glass */}
          <div className="flex-1 flex items-center bg-black/30 rounded-[1.75rem] min-h-13 h-auto py-1.5 pl-4.5 pr-1.5 border border-white/8 focus-within:border-white/15">
            
            {/* Plus Button on extreme left for files */}
            <button 
              type="button" 
              onClick={triggerImageUpload}
              className="text-zinc-400 hover:text-white transition-colors mr-3 shrink-0 hover:scale-110 active:scale-95 duration-200"
            >
              <Plus className="w-[22px] h-[22px] stroke-[2.2]" />
            </button>

            {/* Simulated Recording Wave Visualizer or Text Input */}
            {isRecording ? (
              <div className="flex-1 flex items-center justify-between text-xs text-red-500 font-bold tracking-wide">
                <div className="flex items-center gap-2 sm:gap-3">
                  <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-ping shadow-[0_0_8px_rgba(239,68,68,0.6)]" />
                  <span className="hidden sm:inline">RECORDING SECURE AUDIO: {recordingSeconds}s</span>
                  <span className="sm:hidden text-[10px]">SECURE REC: {recordingSeconds}s</span>
                </div>
                {/* Visual bouncing recording bars */}
                <div className="hidden sm:flex gap-[3px] items-center mr-4">
                  <div className="w-1.5 h-3 bg-red-500 rounded-full animate-pulse" />
                  <div className="w-1.5 h-5 bg-red-500 rounded-full animate-pulse delay-75" />
                  <div className="w-1.5 h-4 bg-red-500 rounded-full animate-pulse delay-150" />
                </div>
                <button 
                  type="button" 
                  onClick={cancelRecording}
                  className="text-zinc-500 hover:text-white uppercase tracking-wider text-[10px] font-black mr-2 bg-white/5 px-2.5 py-1 rounded-lg"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <textarea
                ref={chatInputRef}
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Message..."
                rows={1}
                className="flex-1 bg-transparent sm:text-[14.5px] text-base font-medium tracking-wide text-white focus:outline-none placeholder:text-zinc-500 resize-none max-h-40 py-2 scrollbar-none"
              />
            )}

            {/* Right Side Button inside input container - Dynamic Voice / Send */}
            <div className="flex items-center text-zinc-400 ml-1.5 shrink-0">
              {inputMessage.trim() ? (
                <button 
                  type="submit"
                  className="w-10 h-10 rounded-full bg-[#3753e8] hover:bg-[#4d69f0] text-white flex items-center justify-center transition-all duration-200 shadow-md shrink-0 animate-in fade-in zoom-in"
                >
                  <Send className="w-[17px] h-[17px] stroke-[2.4]" style={{ transform: "translate(-0.5px, 0.5px)" }} />
                </button>
              ) : (
                <button 
                  type="button" 
                  onClick={() => {
                    setShowMicToast(true);
                    const timeout = setTimeout(() => setShowMicToast(false), 3000);
                    return () => clearTimeout(timeout);
                  }}
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 shrink-0 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <Mic className="w-[21px] h-[21px] stroke-[1.8]" />
                </button>
              )}
            </div>
          </div>
      </form>
    </div>

      {/* Active Users Drawer */}
      <AnimatePresence>
        {showUsersDrawer && (
          <div className="fixed inset-0 z-900 flex justify-end">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowUsersDrawer(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
            />

            {/* Sidebar Content */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 30, stiffness: 300 }}
              className="relative w-full max-w-[320px] sm:w-80 h-full bg-[#070708]/95 backdrop-blur-2xl border-l border-white/5 p-6 flex flex-col z-10 shadow-2xl justify-between"
            >
              <div className="space-y-6 flex-1 overflow-y-auto scrollbar-hide">
                {/* Header */}
                <div className="flex justify-between items-center pb-4 border-b border-white/5">
                  <div className="space-y-1">
                    <span className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.3em] font-mono block">ACTIVE NETWORK</span>
                    <h2 className="text-sm font-black text-white uppercase tracking-widest font-mono flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-400" />
                      Users
                    </h2>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowUsersDrawer(false)}
                    className="p-1.5 rounded-xl hover:bg-white/5 text-zinc-500 hover:text-white transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* User List */}
                <div className="space-y-3">
                  {usersList.map((user) => {
                    const isUserAdmin = user.name === roomDetails?.adminName;
                    const isSelf = user.name === name;
                    const userAvatarId = user.avatar || 1;
                    
                    return (
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-white/2 border border-white/5 hover:border-white/10 hover:bg-white/4 transition-all duration-300 group"
                      >
                        <div className="flex items-center gap-3">
                          {/* Avatar */}
                          <div className="w-10 h-10 rounded-full border border-white/10 overflow-hidden bg-zinc-950 shrink-0 relative">
                            <img
                              src={`/assets/avatars/${userAvatarId}.png`}
                              alt={user.name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                e.target.src = REET_AVATAR; // fallback
                              }}
                            />
                            {isUserAdmin && (
                              <div className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-blue-500 rounded-full border border-black flex items-center justify-center" title="Admin">
                                <span className="text-[6px] font-black text-black">A</span>
                              </div>
                            )}
                          </div>

                          {/* Info */}
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-white tracking-wide group-hover:text-blue-400 transition-colors">
                              {user.name}
                            </span>
                            <div className="flex gap-1.5 items-center mt-0.5">
                              {isSelf && (
                                <span className="text-[8px] font-black tracking-widest uppercase bg-white/10 text-zinc-400 px-1 py-0.2 rounded font-mono">
                                  YOU
                                </span>
                              )}
                              {isUserAdmin && (
                                <span className="text-[8px] font-black tracking-widest uppercase bg-blue-500/10 text-blue-400 px-1 py-0.2 rounded font-mono">
                                  ADMIN
                                </span>
                              )}
                              {!isSelf && !isUserAdmin && (
                                <span className="text-[8px] font-black tracking-widest uppercase bg-white/3 text-zinc-500 px-1 py-0.2 rounded font-mono">
                                  MEMBER
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Admin Action Triggers */}
                        {name === roomDetails?.adminName && !isSelf && (
                          <div className="flex items-center gap-1 sm:gap-1.5 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity duration-300">
                            <button
                              type="button"
                              onClick={() => {
                                setTargetAdminUser(user.name);
                                setConfirmModal('make-admin');
                              }}
                              className="text-[9px] font-black tracking-widest uppercase border border-blue-500/30 text-blue-500/80 hover:text-blue-400 hover:bg-blue-500/10 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg transition-all"
                            >
                              ADMIN
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                socket.emit("kick-user", { roomId, adminName: name, userName: user.name });
                              }}
                              className="text-[9px] font-black tracking-widest uppercase border border-amber-500/30 text-amber-500/80 hover:text-amber-400 hover:bg-amber-500/10 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg transition-all"
                            >
                              KICK
                            </button>
                            <button
                              type="button"
                              onClick={() => {
                                socket.emit("ban-user", { roomId, adminName: name, userName: user.name });
                              }}
                              className="text-[9px] font-black tracking-widest uppercase border border-red-500/30 text-red-500/80 hover:text-red-400 hover:bg-red-500/10 px-1.5 py-0.5 sm:px-2 sm:py-1 rounded-lg transition-all"
                            >
                              BAN
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Status bar */}
              <div className="pt-4 border-t border-white/5 space-y-2 text-[9px] font-mono text-zinc-500 uppercase tracking-widest">
                <div className="flex justify-between">
                  <span>ROOM CAPACITY</span>
                  <span className="font-bold text-white">{userCount} / {roomDetails?.maxUsers || 2}</span>
                </div>
                <div className="flex justify-between">
                  <span>ENCRYPTION</span>
                  <span className="text-blue-400 font-bold">SSL / TLS SECURE</span>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Detailed Full-Screen Media Preview Modal */}
      <AnimatePresence>
        {previewFile && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-1000 flex flex-col justify-between bg-black/95 backdrop-blur-xl p-6"
          >
            {/* Header / Top Control Bar */}
            <div className="w-full flex justify-between items-center z-10 animate-in slide-in-from-top duration-300">
              <div className="flex flex-col">
                <span className="text-[10px] font-black tracking-widest text-zinc-500 uppercase font-mono">Media Preview</span>
                <span className="text-sm font-bold text-white tracking-wide truncate max-w-sm font-mono mt-0.5">
                  {previewFile.name}
                </span>
              </div>
              
              <div className="flex items-center gap-3">
                {/* Download Button */}
                <button
                  type="button"
                  title="Download File"
                  onClick={() => downloadFile(previewFile.url, previewFile.name)}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-white flex items-center justify-center transition-all duration-200 active:scale-95"
                >
                  <Download className="w-5 h-5" />
                </button>
                
                {/* Close Button */}
                <button
                  type="button"
                  title="Close Preview"
                  onClick={() => setPreviewFile(null)}
                  className="w-11 h-11 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-white/20 text-zinc-400 hover:text-white flex items-center justify-center transition-all duration-200 active:scale-95"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Media Content - Scaled and Centered */}
            <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative">
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="max-w-full max-h-full flex items-center justify-center overflow-hidden rounded-3xl"
              >
                {previewFile.type === "video" ? (
                  <video 
                    src={previewFile.url} 
                    controls 
                    autoPlay
                    className="max-w-full max-h-[80vh] rounded-2xl shadow-2xl border border-white/5" 
                  />
                ) : (
                  <img 
                    src={previewFile.url} 
                    alt={previewFile.name} 
                    className="max-w-full max-h-[80vh] object-contain rounded-2xl shadow-2xl border border-white/5" 
                  />
                )}
              </motion.div>
            </div>
            
            {/* Footer Status / Decorative Info */}
            <div className="w-full text-center pb-2 text-[9px] font-mono text-zinc-600 uppercase tracking-widest animate-in slide-in-from-bottom duration-300">
              Adyber // Encrypted Transmission
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
