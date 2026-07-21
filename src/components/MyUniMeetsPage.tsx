import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from '../i18n';
import Layout from './Layout';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, Calendar, User as UserIcon, Clock, Users, Trash2, ChevronRight, Compass, AlertCircle
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UniMeet } from '../types';
import { CATEGORY_COLORS, CATEGORY_EMOJIS } from './FeedPage';

export default function MyUniMeetsPage() {
  const { user, showToast } = useAuth();
  const { t } = useTranslation();
  const navigate = useNavigate();

  // Switcher: 'my-posts' | 'joined'
  const [subTab, setSubTab] = useState<'my-posts' | 'joined'>('my-posts');

  const [myPosts, setMyPosts] = useState<UniMeet[]>([]);
  const [joinedPosts, setJoinedPosts] = useState<UniMeet[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [loadingJoined, setLoadingJoined] = useState(true);
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Set up clock tick for countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Listen to my posts
  useEffect(() => {
    if (!user) return;

    setLoadingPosts(true);
    const q = query(
      collection(db, 'unimeets'),
      where('creator_id', '==', user.uid),
      orderBy('created_at', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: UniMeet[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
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
          });
        });
        setMyPosts(list);
        setLoadingPosts(false);
      },
      (err) => {
        console.error("Error listening to my posts:", err);
        handleFirestoreError(err, OperationType.GET, 'unimeets-my-posts');
        setLoadingPosts(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Listen to joined posts
  useEffect(() => {
    if (!user) return;

    setLoadingJoined(true);
    const q = query(
      collection(db, 'unimeets'),
      where('participant_ids', 'array-contains', user.uid)
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: UniMeet[] = [];
        snapshot.forEach((d) => {
          const data = d.data();
          list.push({
            id: d.id,
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
          });
        });
        // Sort client side by created_at desc
        list.sort((a, b) => b.created_at?.toDate().getTime() - a.created_at?.toDate().getTime());
        setJoinedPosts(list);
        setLoadingJoined(false);
      },
      (err) => {
        console.error("Error listening to joined posts:", err);
        handleFirestoreError(err, OperationType.GET, 'unimeets-joined');
        setLoadingJoined(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Cancel meetup (sets status to 'cancelled')
  const handleCancelMeetup = async (meetId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // prevent navigating to chat
    const path = `unimeets/${meetId}`;
    try {
      const docRef = doc(db, 'unimeets', meetId);
      await updateDoc(docRef, {
        status: 'cancelled'
      });
      showToast("Meetup cancelled successfully", "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      showToast("Failed to cancel meetup", "error");
    }
  };

  // Get countdown text or status
  const getCountdownText = (meet: UniMeet): { text: string; active: boolean } => {
    if (meet.status === 'cancelled') {
      return { text: 'Cancelled', active: false };
    }
    const expires = meet.expires_at?.toDate().getTime() || 0;
    const diff = expires - nowTime;
    if (diff <= 0 || meet.status === 'expired') {
      return { text: 'Expired', active: false };
    }

    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;

    if (hours > 0) {
      return { text: `${hours}h ${remMins}m remaining`, active: true };
    }
    return { text: `${remMins}m remaining`, active: true };
  };

  return (
    <Layout showHeader>
      <div className="flex-1 flex flex-col p-4 pb-20">
        
        {/* Title / Section Header */}
        <h2 className="text-xl font-extrabold text-slate-100 mb-4 flex items-center gap-2">
          <Calendar className="text-purple-400 w-5 h-5 animate-pulse" />
          <span>{t('tab_my_meets')}</span>
        </h2>

        {/* Tab Switcher at the Top */}
        <div className="flex bg-slate-900/60 p-1 rounded-xl border border-slate-900 mb-6">
          <button
            id="subtab-my-posts"
            onClick={() => setSubTab('my-posts')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
              subTab === 'my-posts'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            My Posts
          </button>
          <button
            id="subtab-joined"
            onClick={() => setSubTab('joined')}
            className={`flex-1 py-2 text-center text-xs font-bold rounded-lg transition-all ${
              subTab === 'joined'
                ? 'bg-purple-600 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Joined
          </button>
        </div>

        {/* LIST SECTION */}
        <div className="flex-1 flex flex-col">
          {subTab === 'my-posts' ? (
            loadingPosts ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              </div>
            ) : myPosts.length > 0 ? (
              <div className="space-y-4">
                {myPosts.map((meet) => {
                  const countdown = getCountdownText(meet);
                  const isMuted = !countdown.active;
                  const col = CATEGORY_COLORS[meet.category] || CATEGORY_COLORS.coffee;

                  return (
                    <div
                      key={meet.id}
                      id={`mypost-card-${meet.id}`}
                      onClick={() => navigate(`/chat/${meet.id}`)}
                      className={`p-4 bg-slate-950 border border-slate-900 rounded-2xl hover:border-slate-800 transition shadow-xl relative cursor-pointer group flex flex-col justify-between min-h-[120px] ${
                        isMuted ? 'opacity-60 bg-slate-950/40' : ''
                      }`}
                    >
                      {/* Top Row: Category badge & cancel button */}
                      <div className="flex justify-between items-start gap-4">
                        <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${col.bg} ${col.text} ${col.border}`}>
                          <span>{CATEGORY_EMOJIS[meet.category]}</span>
                          <span>{meet.category}</span>
                        </div>

                        {countdown.active && (
                          <button
                            id={`cancel-post-btn-${meet.id}`}
                            onClick={(e) => handleCancelMeetup(meet.id, e)}
                            className="p-2 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-900/30 transition duration-150"
                            title="Cancel Meetup"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      {/* Middle: Title */}
                      <div className="my-3">
                        <h3 className={`text-sm font-extrabold text-slate-100 leading-snug group-hover:text-purple-400 transition ${
                          isMuted ? 'line-through text-slate-500' : ''
                        }`}>
                          {meet.title}
                        </h3>
                      </div>

                      {/* Bottom Row: Info */}
                      <div className="flex items-center justify-between border-t border-slate-900 pt-3 text-[11px] font-mono font-medium text-slate-400">
                        <div className={`flex items-center gap-1 ${isMuted ? 'text-slate-600' : 'text-amber-400'}`}>
                          <Clock size={12} />
                          <span>{countdown.text}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-blue-400">
                          <Users size={12} />
                          <span>{meet.participant_ids.length + 1} Joined</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-slate-950 border border-slate-900/60 rounded-2.5xl my-auto">
                <span className="text-4xl block mb-4">📝</span>
                <h3 className="text-slate-300 font-bold">Nothing here yet</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-[280px] mx-auto">
                  You haven't posted any spontanenous statuses today. Set yourself as available now!
                </p>
                <button
                  onClick={() => navigate('/create')}
                  className="mt-6 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-bold rounded-xl text-xs transition"
                >
                  Create availability
                </button>
              </div>
            )
          ) : (
            loadingJoined ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
              </div>
            ) : joinedPosts.length > 0 ? (
              <div className="space-y-4">
                {joinedPosts.map((meet) => {
                  const countdown = getCountdownText(meet);
                  const isMuted = !countdown.active;
                  const col = CATEGORY_COLORS[meet.category] || CATEGORY_COLORS.coffee;

                  return (
                    <div
                      key={meet.id}
                      id={`joinedpost-card-${meet.id}`}
                      onClick={() => navigate(`/chat/${meet.id}`)}
                      className={`p-4 bg-slate-950 border border-slate-900 rounded-2xl hover:border-slate-800 transition shadow-xl relative cursor-pointer group flex flex-col justify-between min-h-[120px] ${
                        isMuted ? 'opacity-60 bg-slate-950/40' : ''
                      }`}
                    >
                      {/* Top Row: User details & category badge */}
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={meet.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${meet.creator_username}`}
                            alt={meet.creator_username}
                            className="w-7 h-7 rounded-full bg-slate-900 border border-slate-800 object-cover"
                          />
                          <div>
                            <h4 className="text-xs font-bold text-slate-200">@{meet.creator_username}</h4>
                            <span className="text-[9px] text-slate-500 block font-mono truncate max-w-[150px]">
                              {meet.creator_university}
                            </span>
                          </div>
                        </div>

                        <div className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 ${col.bg} ${col.text} ${col.border}`}>
                          <span>{CATEGORY_EMOJIS[meet.category]}</span>
                          <span>{meet.category}</span>
                        </div>
                      </div>

                      {/* Middle: Title */}
                      <div className="my-2.5">
                        <h3 className={`text-sm font-extrabold text-slate-100 leading-snug group-hover:text-purple-400 transition ${
                          isMuted ? 'line-through text-slate-500' : ''
                        }`}>
                          {meet.title}
                        </h3>
                      </div>

                      {/* Bottom Row: Info */}
                      <div className="flex items-center justify-between border-t border-slate-900 pt-3 text-[11px] font-mono font-medium text-slate-400">
                        <div className={`flex items-center gap-1 ${isMuted ? 'text-slate-600' : 'text-amber-400'}`}>
                          <Clock size={12} />
                          <span>{countdown.text}</span>
                        </div>

                        <div className="flex items-center gap-1.5 text-blue-400">
                          <Users size={12} />
                          <span>{meet.participant_ids.length + 1} Joined</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-16 px-4 bg-slate-950 border border-slate-900/60 rounded-2.5xl my-auto">
                <span className="text-4xl block mb-4">🤝</span>
                <h3 className="text-slate-300 font-bold">Nothing here yet</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-[280px] mx-auto">
                  You haven't joined any spontanenous statuses today. Head back to the Feed and connect with other students!
                </p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-6 px-5 py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-bold rounded-xl text-xs transition"
                >
                  Browse Feed
                </button>
              </div>
            )
          )}
        </div>

        {/* BOTTOM NAVIGATION TAB BAR */}
        <nav className="absolute bottom-0 left-0 right-0 h-16 bg-slate-950/95 backdrop-blur-md border-t border-slate-900 flex items-stretch z-40">
          <button
            id="nav-tab-home"
            onClick={() => navigate('/')}
            className="flex-1 flex flex-col justify-center items-center gap-1 text-slate-500 hover:text-slate-400 transition"
          >
            <HomeIcon size={18} />
            <span className="text-[10px]">{t('tab_home')}</span>
          </button>

          <button
            id="nav-tab-my-meets"
            onClick={() => {}}
            className="flex-1 flex flex-col justify-center items-center gap-1 text-purple-400 font-bold transition"
          >
            <Calendar size={18} />
            <span className="text-[10px]">{t('tab_my_meets')}</span>
          </button>

          <button
            id="nav-tab-profile"
            onClick={() => navigate('/?tab=profile')}
            className="flex-1 flex flex-col justify-center items-center gap-1 text-slate-500 hover:text-slate-400 transition"
          >
            <UserIcon size={18} />
            <span className="text-[10px]">{t('tab_profile')}</span>
          </button>
        </nav>

      </div>
    </Layout>
  );
}
