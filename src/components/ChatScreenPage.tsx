import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from '../i18n';
import Layout from './Layout';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, Send, Clock, Users, Check, X, ShieldAlert, AlertCircle, Sparkles, MessageSquare,
  MoreVertical, Ban
} from 'lucide-react';
import { 
  doc, onSnapshot, collection, addDoc, query, orderBy, updateDoc, arrayUnion, arrayRemove, Timestamp, getDoc
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
  const { user, profile, showToast, refreshBlocks } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [meet, setMeet] = useState<UniMeet | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showQueue, setShowQueue] = useState(true); // Toggle for approval queue
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Block & Menu states
  const [showHeaderMenu, setShowHeaderMenu] = useState(false);
  const [confirmBlockUser, setConfirmBlockUser] = useState<{ uid: string; username: string } | null>(null);
  const [participantProfiles, setParticipantProfiles] = useState<Record<string, string>>({});

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Fetch participant usernames
  useEffect(() => {
    if (!meet || !meet.participant_ids || meet.participant_ids.length === 0) return;
    const fetchProfiles = async () => {
      const newProfiles: Record<string, string> = {};
      const promises = meet.participant_ids.map(async (pId) => {
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', pId));
          if (profileDoc.exists()) {
            newProfiles[pId] = profileDoc.data().username || pId.substring(0, 5);
          } else {
            newProfiles[pId] = pId.substring(0, 5);
          }
        } catch (err) {
          console.error("Error fetching participant profile:", err);
          newProfiles[pId] = pId.substring(0, 5);
        }
      });
      await Promise.all(promises);
      setParticipantProfiles(newProfiles);
    };
    fetchProfiles();
  }, [meet?.participant_ids]);

  const handleBlockUserInChat = async () => {
    if (!user || !confirmBlockUser) return;
    try {
      await addDoc(collection(db, 'blocks'), {
        blocker_id: user.uid,
        blocked_id: confirmBlockUser.uid,
        created_at: new Date()
      });
      await refreshBlocks();
      showToast(`@${confirmBlockUser.username} blocked`, 'success');
      setConfirmBlockUser(null);
      // Navigate out of the chat since we have blocked them
      navigate('/my-unimeets');
    } catch (err) {
      console.error("Error blocking user in chat:", err);
      showToast('Failed to block user', 'error');
    }
  };

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
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
          <p className="text-xs text-gray-500 mt-4">Connecting to room...</p>
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
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          id="chat-back-btn"
          onClick={() => navigate('/my-unimeets')}
          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-500 hover:text-gray-700 transition"
        >
          <ArrowLeft size={16} />
        </button>

        {/* Central Title Details */}
        <div className="flex-1 min-w-0 mx-3 text-center">
          <div className="flex items-center justify-center gap-1.5">
            <span className="text-sm">{CATEGORY_EMOJIS[meet.category]}</span>
            <h2 className="text-xs font-extrabold text-gray-900 truncate max-w-[180px]">
              {meet.title}
            </h2>
          </div>
          <div className="flex items-center justify-center gap-2 mt-0.5 text-[10px] font-mono">
            <span className={timeState.error ? 'text-red-600' : 'text-amber-600'}>
              {timeState.text}
            </span>
            <span className="text-gray-300">•</span>
            <span className="text-orange-600 flex items-center gap-0.5">
              <Users size={10} />
              <span>{meet.participant_ids.length + 1} students</span>
            </span>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex items-center gap-1.5">
          {isCreator && meet.requires_approval && (meet.pending_ids?.length || 0) > 0 && (
            <button
              id="toggle-queue-btn"
              onClick={() => setShowQueue(!showQueue)}
              className="p-1.5 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 relative"
              title="Approval Queue"
            >
              <ShieldAlert size={16} />
              <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[8px] font-extrabold px-1 rounded-full">
                {meet.pending_ids?.length}
              </span>
            </button>
          )}

          {/* Action Menu (Block dropdown) */}
          <div className="relative">
            <button
              id="chat-header-menu-btn"
              onClick={() => setShowHeaderMenu(!showHeaderMenu)}
              className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-500 hover:text-gray-700 transition"
            >
              <MoreVertical size={16} />
            </button>

            {showHeaderMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-2xl py-1.5 shadow-xl z-50 animate-in fade-in slide-in-from-top-2">
                {/* Option for participant to block organizer */}
                {!isCreator && (
                  <button
                    id="block-organizer-btn"
                    onClick={() => {
                      setShowHeaderMenu(false);
                      setConfirmBlockUser({
                        uid: meet.creator_id,
                        username: meet.creator_username,
                      });
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold text-red-600 hover:bg-gray-50 transition flex items-center gap-2"
                  >
                    <Ban size={12} />
                    <span>Block @{meet.creator_username}</span>
                  </button>
                )}

                {/* Option for organizer to block any of the participants */}
                {isCreator && meet.participant_ids.length > 0 && (
                  <>
                    <div className="px-4 py-1.5 text-[9px] font-extrabold uppercase tracking-wider text-gray-400 border-b border-gray-100 mb-1">
                      Block Participant
                    </div>
                    {meet.participant_ids.map((pId) => {
                      const pUsername = participantProfiles[pId] || `Student_${pId.substring(0, 4)}`;
                      return (
                        <button
                          key={pId}
                          id={`block-participant-${pId}`}
                          onClick={() => {
                            setShowHeaderMenu(false);
                            setConfirmBlockUser({
                              uid: pId,
                              username: pUsername,
                            });
                          }}
                          className="w-full text-left px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-red-600 transition flex items-center gap-2"
                        >
                          <Ban size={11} className="text-red-600" />
                          <span className="truncate">@{pUsername}</span>
                        </button>
                      );
                    })}
                  </>
                )}

                {/* Empty state if organizer with no participants yet */}
                {isCreator && meet.participant_ids.length === 0 && (
                  <div className="px-4 py-3 text-[10px] text-gray-400 text-center">
                    No participants to block yet.
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
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
              className="bg-white border-b border-gray-200 overflow-hidden shrink-0 z-20"
            >
              <div className="p-3.5 space-y-3">
                <div className="flex justify-between items-center text-[10px] font-extrabold uppercase tracking-widest text-gray-500">
                  <span className="text-amber-600 flex items-center gap-1">
                    <Sparkles size={11} />
                    <span>Pending Requests ({meet.pending_ids?.length})</span>
                  </span>
                  <button onClick={() => setShowQueue(false)} className="text-gray-400 hover:text-gray-650">
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
                        className="p-2 bg-gray-50 border border-gray-250 rounded-xl flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://api.dicebear.com/7.x/bottts/svg?seed=${studentSeed}`}
                            alt="Student"
                            className="w-6 h-6 rounded-full bg-gray-100"
                          />
                          <span className="text-xs font-bold text-gray-800">
                            Student @{studentSeed}
                          </span>
                        </div>
                        <div className="flex gap-1.5">
                          <button
                            id={`approve-btn-${studentId}`}
                            onClick={() => handleApprove(studentId)}
                            className="p-1 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 text-emerald-600 rounded-lg transition"
                            title="Approve"
                          >
                            <Check size={13} />
                          </button>
                          <button
                            id={`reject-btn-${studentId}`}
                            onClick={() => handleReject(studentId)}
                            className="p-1 bg-red-50 border border-red-200 hover:bg-red-100 text-red-650 rounded-lg transition"
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
          <div className="p-4 bg-white border border-gray-200 rounded-2xl text-center max-w-sm mx-auto my-2 shadow-sm">
            <span className="text-3xl block mb-2">🎉</span>
            <h4 className="text-xs font-extrabold text-gray-800">
              {isCreator ? "Your meetup room is open!" : `You joined @${meet.creator_username}'s meetup!`}
            </h4>
            <p className="text-[10px] text-gray-500 mt-1">
              Be friendly, suggest a coordinate, and stay safe. Meetups expire automatically.
            </p>
          </div>

          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
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
                      className="w-7 h-7 rounded-full bg-gray-100 border border-gray-200 shrink-0"
                    />
                  )}

                  <div className={`flex flex-col max-w-[70%] ${isMe ? 'items-end' : 'items-start'}`}>
                    
                    {/* Username detail */}
                    {!isMe && (
                      <span className="text-[10px] font-bold text-gray-500 mb-1 ml-1">
                        @{msg.sender_username}
                      </span>
                    )}

                    {/* Speech bubble */}
                    <div
                      className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                        isMe
                          ? 'bg-gradient-to-r from-orange-500 to-orange-400 text-white rounded-tr-none'
                          : 'bg-gray-100 border border-gray-200 text-gray-800 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>

                    {/* Time of send */}
                    <span className="text-[8px] text-gray-400 font-mono mt-1 px-1">
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
        <div className="p-4 bg-white border-t border-gray-200 shrink-0 z-30">
          {!timeState.active ? (
            <div className="p-3 bg-red-50 border border-red-200 text-red-650 text-xs rounded-xl flex items-center gap-2 justify-center font-bold">
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
                className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-400"
              />
              <button
                id="chat-send-btn"
                type="submit"
                disabled={!inputText.trim() || sending}
                className="p-2.5 bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white rounded-xl shadow-sm active:scale-[0.98] transition disabled:opacity-50"
              >
                <Send size={14} />
              </button>
            </form>
          )}
        </div>

      </div>

      {/* Block Confirmation Modal */}
      {confirmBlockUser && (
        <div className="fixed inset-0 bg-gray-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[60] animate-in fade-in duration-200">
          <div className="bg-white border border-gray-200 rounded-3xl p-6 w-full max-w-sm shadow-xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 rounded-2xl bg-red-50 border border-red-200 text-red-655 flex items-center justify-center mb-4 mx-auto">
              <Ban size={22} />
            </div>
            <h3 className="text-base font-extrabold text-gray-900 text-center">
              Block @{confirmBlockUser.username}?
            </h3>
            <p className="text-xs text-gray-500 text-center mt-2 leading-relaxed">
              They won't be able to see your UniMeets and you won't see theirs.
            </p>
            <div className="flex gap-2.5 mt-6">
              <button
                id="cancel-chat-block"
                onClick={() => setConfirmBlockUser(null)}
                className="flex-1 py-2.5 bg-gray-100 border border-gray-200 text-gray-600 hover:text-gray-800 rounded-xl text-xs font-bold transition"
              >
                Cancel
              </button>
              <button
                id="submit-chat-block"
                onClick={handleBlockUserInChat}
                className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
              >
                Block
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
