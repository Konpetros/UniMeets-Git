import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from '../i18n';
import Layout from './Layout';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Send, Clock, Users, Check, X, ShieldAlert, AlertCircle, Sparkles, MessageSquare
} from 'lucide-react';
import { 
  doc, onSnapshot, collection, addDoc, query, orderBy, updateDoc, arrayUnion, arrayRemove, Timestamp 
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UniMeet } from '../types';
import { CATEGORY_EMOJIS, CATEGORY_COLORS } from './FeedPage';

interface Message {
  id: string;
  sender_id: string;
  sender_username: string;
  sender_avatar: string;
  text: string;
  created_at: any;
}

export default function ChatScreenPage() {
  const { unimeetId } = useParams<{ unimeetId: string }>();
  const { user, profile, showToast } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [meet, setMeet] = useState<UniMeet | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQueue, setShowQueue] = useState(true); // Toggle for approval queue
  const [nowTime, setNowTime] = useState<number>(Date.now());

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Tick clock for remaining time
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Listen to UniMeet document
  useEffect(() => {
    if (!unimeetId || !user) return;

    const docRef = doc(db, 'unimeets', unimeetId);
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) {
        showToast("Meetup not found or deleted", "error");
        navigate('/', { replace: true });
        return;
      }

      const data = docSnap.data();
      const loadedMeet: UniMeet = {
        id: docSnap.id,
        title: data.title,
        category: data.category,
        creator_id: data.creator_id,
        creator_username: data.creator_username,
        creator_avatar: data.creator_avatar,
        creator_university: data.creator_university,
        latitude: data.latitude,
        longitude: data.longitude,
        geohash: data.geohash,
        expires_at: data.expires_at,
        status: data.status,
        participant_ids: data.participant_ids || [],
        pending_ids: data.pending_ids || [],
        requires_approval: data.requires_approval || false,
        created_at: data.created_at,
      };

      // Access control: Only creator or participants can enter the chat room
      const isCreator = loadedMeet.creator_id === user.uid;
      const isParticipant = loadedMeet.participant_ids.includes(user.uid);

      if (!isCreator && !isParticipant) {
        showToast("You must be an approved participant to access this chat!", "error");
        navigate('/', { replace: true });
        return;
      }

      setMeet(loadedMeet);
      setLoading(false);
    }, (err) => {
      console.error("Error loading chat meetup:", err);
      showToast("Access Denied", "error");
      navigate('/', { replace: true });
    });

    return () => unsubscribe();
  }, [unimeetId, user]);

  // Listen to messages subcollection
  useEffect(() => {
    if (!unimeetId || !meet) return;

    const messagesQuery = query(
      collection(db, 'unimeets', unimeetId, 'messages'),
      orderBy('created_at', 'asc')
    );

    const unsubscribe = onSnapshot(messagesQuery, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        msgs.push({
          id: docSnap.id,
          sender_id: data.sender_id,
          sender_username: data.sender_username,
          sender_avatar: data.sender_avatar,
          text: data.text,
          created_at: data.created_at,
        });
      });
      setMessages(msgs);
    }, (err) => {
      console.error("Error loading chat messages:", err);
    });

    return () => unsubscribe();
  }, [unimeetId, meet]);

  // Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle message sending
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!unimeetId || !user || !inputText.trim() || sending || !meet) return;

    // Check if meetup expired or cancelled
    const expires = meet.expires_at?.toDate().getTime() || 0;
    if (meet.status === 'cancelled' || expires < Date.now()) {
      showToast("This meetup is no longer active", "error");
      return;
    }

    setSending(true);
    try {
      const msgData = {
        sender_id: user.uid,
        sender_username: profile?.username || 'student',
        sender_avatar: profile?.avatar_url || '',
        text: inputText.trim().substring(0, 500),
        created_at: Timestamp.now(),
      };

      await addDoc(collection(db, 'unimeets', unimeetId, 'messages'), msgData);
      setInputText('');
    } catch (err) {
      console.error("Error sending message:", err);
      showToast("Failed to send message", "error");
    } finally {
      setSending(false);
    }
  };

  // Approval Queue Actions
  const handleApprove = async (studentId: string) => {
    if (!meet) return;
    try {
      const docRef = doc(db, 'unimeets', meet.id);
      await updateDoc(docRef, {
        pending_ids: arrayRemove(studentId),
        participant_ids: arrayUnion(studentId)
      });
      showToast("Student request approved!", "success");
    } catch (err) {
      console.error("Error approving request:", err);
      showToast("Failed to approve request", "error");
    }
  };

  const handleReject = async (studentId: string) => {
    if (!meet) return;
    try {
      const docRef = doc(db, 'unimeets', meet.id);
      await updateDoc(docRef, {
        pending_ids: arrayRemove(studentId)
      });
      showToast("Request declined", "info");
    } catch (err) {
      console.error("Error declining request:", err);
      showToast("Failed to decline request", "error");
    }
  };

  // Render Time Remaining / Status
  const getRemainingTimeText = (): { text: string; active: boolean; error: boolean } => {
    if (!meet) return { text: '', active: false, error: false };
    if (meet.status === 'cancelled') {
      return { text: 'Cancelled', active: false, error: true };
    }
    const expires = meet.expires_at?.toDate().getTime() || 0;
    const diff = expires - nowTime;
    if (diff <= 0 || meet.status === 'expired') {
      return { text: 'Expired', active: false, error: true };
    }

    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;

    if (hours > 0) {
      return { text: `${hours}h ${remMins}m remaining`, active: true, error: false };
    }
    return { text: `${remMins}m remaining`, active: true, error: false };
  };

  if (loading || !meet) {
    return (
      <Layout>
        <div className="flex-1 flex flex-col items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
          <p className="text-xs text-slate-500 mt-4">Connecting to room...</p>
        </div>
      </Layout>
    );
  }

  const isCreator = meet.creator_id === user?.uid;
  const timeState = getRemainingTimeText();
  const col = CATEGORY_COLORS[meet.category] || CATEGORY_COLORS.coffee;

  return (
    <Layout>
      {/* Sticky Top Header */}
      <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 px-4 py-3 flex items-center justify-between">
        <button
          id="chat-back-btn"
          onClick={() => navigate('/my-unimeets')}
          className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-850 border border-slate-800/60 text-slate-400 hover:text-slate-200 transition"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Central Title Details */}
        <div className="flex-1 min-w-0 mx-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm">{CATEGORY_EMOJIS[meet.category]}</span>
            <h2 className="text-xs font-extrabold text-slate-200 truncate max-w-[180px]">
              {meet.title}
            </h2>
          </div>
          <div className="flex items-center justify-center gap-2 mt-0.5 text-[10px] font-mono">
            <span className={timeState.error ? 'text-red-400' : 'text-amber-400'}>
              {timeState.text}
            </span>
            <span className="text-slate-700">•</span>
            <span className="text-purple-400 flex items-center gap-0.5">
              <Users size={10} />
              <span>{meet.participant_ids.length + 1} students</span>
            </span>
          </div>
        </div>

        {/* Action Button: Toggle Pending Queue */}
        {isCreator && meet.requires_approval && (meet.pending_ids?.length || 0) > 0 ? (
          <button
            id="toggle-queue-btn"
            onClick={() => setShowQueue(!showQueue)}
            className="p-1.5 rounded-lg bg-amber-950/30 border border-amber-900/40 text-amber-400 hover:bg-amber-900/30 relative"
            title="Approval Queue"
          >
            <ShieldAlert size={16} />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-extrabold px-1 rounded-full">
              {meet.pending_ids?.length}
            </span>
          </button>
        ) : (
          <div className="w-8"></div>
        )}
      </header>

      {/* Main chat layout */}
      <div className="flex-1 flex flex-col min-h-0 relative">
        
        {/* Real-time Approval Queue Panel for Organizer */}
        <AnimatePresence>
          {isCreator && meet.requires_approval && showQueue && (meet.pending_ids?.length || 0) > 0 && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-slate-950 border-b border-slate-900 overflow-hidden shrink-0 z-20"
            >
              <div className="p-3.5 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-slate-400">
                  <span className="text-amber-400 flex items-center gap-1">
                    <Sparkles size={11} />
                    <span>Pending Requests ({meet.pending_ids?.length})</span>
                  </span>
                  <button onClick={() => setShowQueue(false)} className="text-slate-600 hover:text-slate-400">
                    Hide
                  </button>
                </div>

                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {meet.pending_ids?.map((studentId) => {
                    const studentSeed = studentId.substring(0, 5);
                    return (
                      <div
                        key={studentId}
                        id={`request-row-${studentId}`}
                        className="p-2 bg-slate-900/40 border border-slate-900 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${studentSeed}`}
                            alt="Student"
                            className="w-6 h-6 rounded-full bg-slate-900"
                          />
                          <span className="text-xs font-bold text-slate-200">
                            Student @{studentSeed}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            id={`approve-btn-${studentId}`}
                            onClick={() => handleApprove(studentId)}
                            className="p-1 bg-emerald-950/40 border border-emerald-900/50 hover:bg-emerald-900/30 text-emerald-400 rounded-lg transition"
                            title="Approve"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            id={`reject-btn-${studentId}`}
                            onClick={() => handleReject(studentId)}
                            className="p-1 bg-red-950/40 border border-red-900/50 hover:bg-red-900/30 text-red-400 rounded-lg transition"
                            title="Decline"
                          >
                            <X size={13} />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Welcome Intro bubble */}
          <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl text-center max-w-sm mx-auto my-2">
            <span className="text-3xl block mb-2">🎉</span>
            <h4 className="text-xs font-extrabold text-slate-200">
              {isCreator ? "Your meetup room is open!" : `You joined @${meet.creator_username}'s meetup!`}
            </h4>
            <p className="text-[10px] text-slate-500 mt-1">
              Be friendly, suggest a coordinate, and stay safe. Meetups expire automatically.
            </p>
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-600">
              <MessageSquare size={24} className="opacity-30 mb-2" />
              <p className="text-[10px] font-medium uppercase tracking-wide">No messages yet. Say hi!</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id === user?.uid;
              return (
                <div
                  key={msg.id}
                  id={`chat-msg-${msg.id}`}
                  className={`flex items-start gap-2.5 ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  {/* Sender Avatar */}
                  {!isMe && (
                    <img
                      src={msg.sender_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${msg.sender_username}`}
                      alt={msg.sender_username}
                      className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 shrink-0"
                    />
                  )}

                  <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                    
                    {/* Username detail */}
                    {!isMe && (
                      <span className="text-[10px] font-bold text-slate-400 mb-1 ml-1">
                        @{msg.sender_username}
                      </span>
                    )}

                    {/* Speech bubble */}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow ${
                        isMe
                          ? 'bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-tr-none'
                          : 'bg-slate-900 border border-slate-800/80 text-slate-200 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Time of send */}
                    <span className="text-[8px] text-slate-600 font-mono mt-1 px-1">
                      {msg.created_at ? new Date(msg.created_at.toDate()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                    </span>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input section */}
        <div className="p-4 bg-slate-950 border-t border-slate-900 shrink-0 z-30">
          {!timeState.active ? (
            <div className="p-3 bg-red-950/20 border border-red-900/30 text-red-400 text-xs rounded-xl flex items-center gap-2 justify-center font-bold">
              <AlertCircle size={14} />
              <span>{meet.status === 'cancelled' ? 'This meetup was cancelled.' : 'This meetup has expired.'}</span>
            </div>
          ) : (
            <form onSubmit={handleSend} className="flex gap-2 items-center">
              <input
                id="chat-message-input"
                type="text"
                required
                maxLength={500}
                placeholder="Type your message..."
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                className="flex-1 bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-slate-100 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
              <button
                id="chat-send-btn"
                type="submit"
                disabled={!inputText.trim() || sending}
                className="p-2.5 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white rounded-xl shadow-lg hover:shadow-purple-600/20 active:scale-[0.98] transition disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </form>
          )}
        </div>

      </div>
    </Layout>
  );
}
