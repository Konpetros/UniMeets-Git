import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation, INTEREST_OPTIONS, UNIVERSITIES } from '../i18n';
import Layout from './Layout';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, Calendar, User as UserIcon, Search, SlidersHorizontal, Plus, 
  MapPin, Clock, Users, Trash2, LogOut, Check, ChevronRight, Compass, Save, Edit, HelpCircle
} from 'lucide-react';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, arrayRemove, Timestamp, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { UniMeet, CategoryType } from '../types';
import { calculateDistance } from '../utils';

// Color map for categories
export const CATEGORY_COLORS: Record<CategoryType, { bg: string; text: string; border: string; accent: string }> = {
  movies: { bg: 'bg-purple-950/30', text: 'text-purple-300', border: 'border-purple-900/50', accent: 'bg-purple-500' },
  coffee: { bg: 'bg-amber-950/30', text: 'text-amber-300', border: 'border-amber-900/50', accent: 'bg-amber-500' },
  study: { bg: 'bg-blue-950/30', text: 'text-blue-300', border: 'border-blue-900/50', accent: 'bg-blue-500' },
  walk: { bg: 'bg-emerald-950/30', text: 'text-emerald-300', border: 'border-emerald-900/50', accent: 'bg-emerald-500' },
  party: { bg: 'bg-pink-950/30', text: 'text-pink-300', border: 'border-pink-900/50', accent: 'bg-pink-500' },
  gaming: { bg: 'bg-indigo-950/30', text: 'text-indigo-300', border: 'border-indigo-900/50', accent: 'bg-indigo-500' },
  sports: { bg: 'bg-orange-950/30', text: 'text-orange-300', border: 'border-orange-900/50', accent: 'bg-orange-500' },
  music: { bg: 'bg-rose-950/30', text: 'text-rose-300', border: 'border-rose-900/50', accent: 'bg-rose-500' },
};

export const CATEGORY_EMOJIS: Record<CategoryType, string> = {
  movies: '🎬',
  coffee: '☕',
  study: '📚',
  walk: '🌿',
  party: '🎉',
  gaming: '🎮',
  sports: '⚽',
  music: '🎵',
};

export default function FeedPage() {
  const { user, profile, refreshProfile, logout, showToast } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  // Active Tab
  const [activeTab, setActiveTab] = useState<'home' | 'my-meets' | 'profile'>('home');

  // Location state
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locationDenied, setLocationDenied] = useState(false);
  const [gettingLocation, setGettingLocation] = useState(true);

  // Search & Filters
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryType | null>(null);
  const [showFilterModal, setShowFilterModal] = useState(false);

  // Feed items
  const [unimeets, setUnimeets] = useState<UniMeet[]>([]);
  const [hiddenMeetIds, setHiddenMeetIds] = useState<string[]>([]);
  const [activeMeetup, setActiveMeetup] = useState<UniMeet | null>(null);
  const [loadingMeets, setLoadingMeets] = useState(true);

  // Ticking time for countdowns
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Profile edit states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editUni, setEditUni] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [showUniDropdown, setShowUniDropdown] = useState(false);

  // Set up clock tick for countdowns
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 10000);
    return () => clearInterval(timer);
  }, []);

  // Request browser coordinates
  const requestLocation = () => {
    setGettingLocation(true);
    setLocationDenied(false);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCoords({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
          setGettingLocation(false);
        },
        (error) => {
          console.error('Location error:', error);
          // If denied, we keep state but also offer a mock fallback (Syntagma coordinates) so the app remains fully functional
          setLocationDenied(true);
          setGettingLocation(false);
        },
        { enableHighAccuracy: true, timeout: 15000 }
      );
    } else {
      setLocationDenied(true);
      setGettingLocation(false);
    }
  };

  useEffect(() => {
    requestLocation();
  }, []);

  // Real-time Firestore listener for Active UniMeets
  useEffect(() => {
    if (!user) return;

    setLoadingMeets(true);
    const path = 'unimeets';
    
    // We fetch all active unimeets.
    const q = query(
      collection(db, 'unimeets'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const list: UniMeet[] = [];
        let myActive: UniMeet | null = null;
        const now = new Date();

        snapshot.forEach((d) => {
          const data = d.data();
          const expiresAt = data.expires_at?.toDate();
          
          // Client-side filtering for expired posts
          if (expiresAt && expiresAt > now) {
            const meet: UniMeet = {
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
              created_at: data.created_at,
            };

            list.push(meet);

            // Set my active post
            if (meet.creator_id === user.uid) {
              myActive = meet;
            }
          }
        });

        // Sort by created_at desc
        list.sort((a, b) => b.created_at?.toDate().getTime() - a.created_at?.toDate().getTime());

        setUnimeets(list);
        setActiveMeetup(myActive);
        setLoadingMeets(false);
      },
      (err) => {
        handleFirestoreError(err, OperationType.GET, path);
        setLoadingMeets(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  // Handle Swipe/Action Actions
  const handleJoin = async (meet: UniMeet) => {
    if (!user) return;
    if (meet.creator_id === user.uid) {
      showToast("You cannot join your own meetup!", "info");
      return;
    }
    if (meet.participant_ids.includes(user.uid)) {
      showToast("You are already participating in this meetup!", "info");
      return;
    }

    const path = `unimeets/${meet.id}`;
    try {
      const docRef = doc(db, 'unimeets', meet.id);
      await updateDoc(docRef, {
        participant_ids: arrayUnion(user.uid)
      });
      showToast("Successfully joined meetup!", "success");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      showToast("Failed to join meetup", "error");
    }
  };

  const handleLeave = async (meet: UniMeet) => {
    if (!user) return;
    const path = `unimeets/${meet.id}`;
    try {
      const docRef = doc(db, 'unimeets', meet.id);
      await updateDoc(docRef, {
        participant_ids: arrayRemove(user.uid)
      });
      showToast("Left the meetup", "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      showToast("Failed to leave meetup", "error");
    }
  };

  const handleCancelMeetup = async (meet: UniMeet) => {
    const path = `unimeets/${meet.id}`;
    try {
      const docRef = doc(db, 'unimeets', meet.id);
      await updateDoc(docRef, {
        status: 'expired'
      });
      showToast("Meetup cancelled/expired", "info");
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      showToast("Failed to cancel meetup", "error");
    }
  };

  const handleDismiss = (meetId: string) => {
    setHiddenMeetIds((prev) => [...prev, meetId]);
    showToast("Meetup dismissed", "info");
  };

  // Populate edit fields when opening editing
  const startEditing = () => {
    if (!profile) return;
    setEditUni(profile.university);
    setEditBio(profile.bio || '');
    setEditInterests(profile.interests);
    setIsEditingProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!user || !profile) return;
    if (editInterests.length < 1 || editInterests.length > 5) {
      showToast(t('interests_range_error'), 'error');
      return;
    }

    setSavingProfile(true);
    const path = `profiles/${user.uid}`;
    try {
      const profileRef = doc(db, 'profiles', user.uid);
      await updateDoc(profileRef, {
        university: editUni,
        bio: editBio.trim(),
        interests: editInterests,
      });
      showToast(t('profile_updated'), 'success');
      setIsEditingProfile(false);
      await refreshProfile();
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      showToast('Failed to update profile', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const toggleEditInterest = (id: string) => {
    setEditInterests((prev) => {
      if (prev.includes(id)) {
        return prev.filter((item) => item !== id);
      } else {
        if (prev.length >= 5) {
          showToast(t('interests_range_error'), 'error');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Filter feed items
  const filteredMeetups = unimeets.filter((meet) => {
    if (hiddenMeetIds.includes(meet.id)) return false;
    
    // Category filter
    if (selectedCategory && meet.category !== selectedCategory) return false;

    // Search query
    if (searchQuery.trim() !== '') {
      const term = searchQuery.toLowerCase();
      const matchTitle = meet.title.toLowerCase().includes(term);
      const matchUni = meet.creator_university.toLowerCase().includes(term);
      const matchUser = meet.creator_username.toLowerCase().includes(term);
      if (!matchTitle && !matchUni && !matchUser) return false;
    }

    return true;
  });

  // Calculate distance bands
  const getDistanceBand = (meet: UniMeet): { label: string; raw: number } => {
    if (!coords) return { label: t('distance_5'), raw: 2 }; // default approximation

    const dist = calculateDistance(coords.lat, coords.lng, meet.latitude, meet.longitude);
    if (dist <= 5) return { label: t('distance_5'), raw: dist };
    if (dist <= 10) return { label: t('distance_10'), raw: dist };
    if (dist <= 25) return { label: t('distance_25'), raw: dist };
    return { label: t('distance_far'), raw: dist };
  };

  // Remaining time formatted string
  const getRemainingTime = (meet: UniMeet): string => {
    const expires = meet.expires_at?.toDate().getTime() || 0;
    const diff = expires - nowTime;
    if (diff <= 0) return 'expired';

    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    const remMins = mins % 60;

    if (hours > 0) {
      return `${hours}h ${remMins}m`;
    }
    return `${remMins}m`;
  };

  // Filter lists of UniMeets for "My Meets" tab
  const myCreatedMeets = unimeets.filter((m) => m.creator_id === user?.uid);
  const myJoinedMeets = unimeets.filter((m) => m.participant_ids.includes(user?.uid || ''));

  return (
    <Layout showHeader>
      {/* Search Header Extension */}
      {activeTab === 'home' && searchOpen && (
        <div className="bg-slate-950 px-4 pb-3 pt-1 border-b border-slate-900 transition-all">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
            <input
              id="feed-search-input"
              type="text"
              autoFocus
              placeholder={t('search_placeholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-900/60 border border-slate-900 rounded-xl py-2.5 pl-10 pr-10 text-sm text-slate-200 focus:outline-none focus:border-purple-500"
            />
            {searchQuery && (
              <button
                id="feed-search-clear"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 text-xs"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col relative pb-20">
        
        {/* TAB 1: HOME (FEED) */}
        {activeTab === 'home' && (
          <div className="flex-1 flex flex-col p-4">
            
            {/* Header / Actions Row */}
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2">
                <Compass className="text-purple-400 w-5 h-5 animate-pulse" />
                <span>{t('near_you')}</span>
                <span className="text-xs bg-slate-900 text-purple-400 px-2.5 py-1 rounded-full font-mono border border-slate-800">
                  {filteredMeetups.length}
                </span>
              </h2>

              <div className="flex items-center gap-2">
                {/* Search Bar Toggle */}
                <button
                  id="feed-search-toggle"
                  onClick={() => {
                    setSearchOpen(!searchOpen);
                    if (searchOpen) setSearchQuery('');
                  }}
                  className={`p-2 rounded-xl border transition ${
                    searchOpen
                      ? 'bg-purple-950/20 border-purple-500 text-purple-300'
                      : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <Search size={16} />
                </button>

                {/* Filter pill */}
                <button
                  id="feed-filter-toggle"
                  onClick={() => setShowFilterModal(true)}
                  className={`p-2 rounded-xl border transition flex items-center gap-1.5 ${
                    selectedCategory
                      ? 'bg-purple-950/20 border-purple-500 text-purple-300'
                      : 'bg-slate-900 border-slate-800/80 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  <SlidersHorizontal size={16} />
                  {selectedCategory && (
                    <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                  )}
                </button>
              </div>
            </div>

            {/* Active post / Available banner */}
            <div className="mb-6">
              {activeMeetup ? (
                <div className="p-4 bg-gradient-to-r from-purple-950/40 to-blue-950/40 border border-purple-900/40 rounded-2xl shadow-xl flex items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block">My Spontaneous Status</span>
                    <h4 className="text-sm font-semibold text-slate-200 mt-1 truncate">
                      Looking for: {activeMeetup.title}
                    </h4>
                    <span className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                      <Clock size={12} className="text-slate-500" />
                      {getRemainingTime(activeMeetup)} remaining
                    </span>
                  </div>

                  <button
                    id="cancel-active-meetup-btn"
                    onClick={() => handleCancelMeetup(activeMeetup!)}
                    className="p-2.5 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 hover:bg-red-900/30 transition duration-150"
                    title={t('cancel_meetup')}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ) : (
                <div className="p-4 bg-slate-950 border border-slate-900 rounded-2xl shadow-xl flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl shrink-0">✨</div>
                    <div>
                      <h4 className="text-sm font-semibold text-slate-200">{t('become_available_banner')}</h4>
                      <p className="text-xs text-slate-500 mt-0.5">Expires after 6 hours</p>
                    </div>
                  </div>

                  <button
                    id="create-meetup-btn"
                    onClick={() => navigate('/create')}
                    className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-bold rounded-xl shadow-lg shadow-purple-600/10 text-xs flex items-center gap-1.5 transition-all active:scale-[0.98]"
                  >
                    <Plus size={14} />
                    <span>{t('create_button')}</span>
                  </button>
                </div>
              )}
            </div>

            {/* Locked Feed State if Geolocation Denied */}
            {locationDenied ? (
              <div className="bg-slate-950/60 border border-slate-900 rounded-2xl p-6 text-center my-6 flex flex-col items-center">
                <div className="w-14 h-14 rounded-2xl bg-purple-500/10 flex items-center justify-center text-2.5xl mb-4">📍</div>
                <h3 className="text-base font-bold text-slate-100">{t('location_denied')}</h3>
                <p className="text-xs text-slate-400 mt-2 max-w-[320px] leading-relaxed">
                  {t('location_denied_sub')}
                </p>

                {/* Simulated Geolocation option inside iframe */}
                <div className="mt-6 flex flex-col gap-3 w-full max-w-[280px]">
                  <button
                    id="simulate-loc-btn"
                    onClick={() => {
                      // Athens Syntagma coordinates
                      setCoords({ lat: 37.9838, lng: 23.7275 });
                      setLocationDenied(false);
                      showToast('Location simulated successfully!', 'success');
                    }}
                    className="w-full py-2.5 bg-slate-900 border border-slate-800 text-purple-400 rounded-xl text-xs font-semibold hover:bg-slate-800 transition"
                  >
                    Simulate Athens Campus Location
                  </button>
                  <button
                    id="request-loc-retry"
                    onClick={requestLocation}
                    className="w-full py-2.5 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-xl text-xs font-bold shadow-lg transition"
                  >
                    {t('re_request_location')}
                  </button>
                </div>
              </div>
            ) : gettingLocation ? (
              <div className="flex-1 flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
                <p className="text-xs text-slate-500 mt-3 font-mono">Fetching coordinates...</p>
              </div>
            ) : (
              /* Meets List */
              <div className="flex-1 space-y-4">
                {loadingMeets ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                  </div>
                ) : filteredMeetups.length > 0 ? (
                  <AnimatePresence mode="popLayout">
                    {filteredMeetups.map((meet) => {
                      const col = CATEGORY_COLORS[meet.category] || CATEGORY_COLORS.coffee;
                      const distance = getDistanceBand(meet);
                      const isCreator = meet.creator_id === user?.uid;
                      const hasJoined = meet.participant_ids.includes(user?.uid || '');

                      return (
                        <motion.div
                          key={meet.id}
                          id={`unimeet-card-${meet.id}`}
                          drag="x"
                          dragConstraints={{ left: -150, right: 150 }}
                          onDragEnd={(event, info) => {
                            if (info.offset.x > 100) {
                              // Swipe right to join
                              if (!isCreator && !hasJoined) {
                                handleJoin(meet);
                              }
                            } else if (info.offset.x < -100) {
                              // Swipe left to dismiss
                              handleDismiss(meet.id);
                            }
                          }}
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, x: -200, scale: 0.95 }}
                          className="bg-slate-950 border border-slate-900 rounded-2.5xl p-4 shadow-xl hover:border-slate-800 transition relative overflow-hidden group touch-none cursor-grab active:cursor-grabbing"
                        >
                          {/* Slide Indicator hints */}
                          <div className="absolute inset-y-0 left-0 w-1 bg-emerald-500 opacity-0 group-hover:opacity-40 transition"></div>
                          <div className="absolute inset-y-0 right-0 w-1 bg-red-500 opacity-0 group-hover:opacity-40 transition"></div>

                          {/* Card Creator Header */}
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <img
                                src={meet.creator_avatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${meet.creator_username}`}
                                alt={meet.creator_username}
                                className="w-10 h-10 rounded-full bg-slate-900 border border-slate-800 object-cover"
                              />
                              <div>
                                <h4 className="text-sm font-bold text-slate-200">@{meet.creator_username}</h4>
                                <span className="text-[10px] text-slate-500 font-medium block max-w-[220px] truncate">
                                  {meet.creator_university}
                                </span>
                              </div>
                            </div>

                            {/* Category Badge */}
                            <div className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${col.bg} ${col.text} ${col.border}`}>
                              <span>{CATEGORY_EMOJIS[meet.category]}</span>
                              <span>{meet.category}</span>
                            </div>
                          </div>

                          {/* Meet Title */}
                          <div className="my-3">
                            <p className="text-xs text-slate-500 font-bold tracking-wide uppercase">Looking for someone to</p>
                            <h3 className="text-base font-extrabold text-slate-100 mt-0.5 leading-snug">
                              {meet.title}
                            </h3>
                          </div>

                          {/* Location & Time Footer */}
                          <div className="flex items-center justify-between border-t border-slate-900 pt-3 mt-4 text-[11px] text-slate-400 font-medium font-mono">
                            <div className="flex items-center gap-1 text-purple-400">
                              <MapPin size={12} />
                              <span>{distance.label}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-amber-400">
                              <Clock size={12} />
                              <span>{t('expires_in', { time: getRemainingTime(meet) })}</span>
                            </div>

                            <div className="flex items-center gap-1.5 text-blue-400">
                              <Users size={12} />
                              <span>{meet.participant_ids.length + 1} / 10</span>
                            </div>
                          </div>

                          {/* Participant Bubble List (If any) */}
                          {meet.participant_ids.length > 0 && (
                            <div className="mt-3 flex items-center gap-1.5">
                              <span className="text-[9px] text-slate-500 uppercase font-bold tracking-wider">Joined:</span>
                              <div className="flex -space-x-1.5 overflow-hidden">
                                {meet.participant_ids.map((pId) => (
                                  <img
                                    key={pId}
                                    src={`https://api.dicebear.com/7.x/bottts/svg?seed=${pId}`}
                                    alt="Participant"
                                    className="inline-block h-4.5 w-4.5 rounded-full ring-2 ring-slate-950 bg-slate-900"
                                  />
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Quick Actions overlay bar */}
                          <div className="mt-4 flex gap-2">
                            {isCreator ? (
                              <button
                                id={`cancel-meetup-btn-${meet.id}`}
                                onClick={() => handleCancelMeetup(meet)}
                                className="w-full py-2 rounded-xl bg-red-950/20 border border-red-900/30 text-red-400 text-xs font-bold hover:bg-red-950/40 transition"
                              >
                                {t('cancel_meetup')}
                              </button>
                            ) : hasJoined ? (
                              <button
                                id={`leave-meetup-btn-${meet.id}`}
                                onClick={() => handleLeave(meet)}
                                className="w-full py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 text-xs font-bold hover:bg-slate-850 transition"
                              >
                                {t('leave_meetup')}
                              </button>
                            ) : (
                              <button
                                id={`join-meetup-btn-${meet.id}`}
                                onClick={() => handleJoin(meet)}
                                className="w-full py-2 rounded-xl bg-gradient-to-r from-purple-600 to-blue-500 text-white text-xs font-bold hover:from-purple-500 hover:to-blue-400 transition"
                              >
                                {t('join')}
                              </button>
                            )}

                            <button
                              id={`dismiss-meetup-btn-${meet.id}`}
                              onClick={() => handleDismiss(meet.id)}
                              className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-500 hover:text-slate-300 text-xs"
                              title="Dismiss / Hide"
                            >
                              ✕
                            </button>
                          </div>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                ) : (
                  <div className="text-center py-16 px-4 bg-slate-950 border border-slate-900/60 rounded-2.5xl">
                    <div className="w-14 h-14 rounded-2xl bg-purple-500/5 flex items-center justify-center text-3xl mx-auto mb-4">🔍</div>
                    <h3 className="text-slate-200 font-bold">{t('no_meets')}</h3>
                    <p className="text-xs text-slate-500 mt-2 max-w-[280px] mx-auto leading-relaxed">
                      {t('no_meets_sub')}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: MY UNIMEETS */}
        {activeTab === 'my-meets' && (
          <div className="flex-1 flex flex-col p-4" id="my-meets-tab-content">
            <h2 className="text-xl font-extrabold text-slate-100 mb-6 flex items-center gap-2">
              <Calendar className="text-purple-400 w-5 h-5" />
              <span>{t('tab_my_meets')}</span>
            </h2>

            {myCreatedMeets.length === 0 && myJoinedMeets.length === 0 ? (
              <div className="text-center py-16 px-4 bg-slate-950 border border-slate-900/60 rounded-2.5xl my-auto">
                <span className="text-4xl">📋</span>
                <h3 className="text-slate-300 font-bold mt-4">No active meetups</h3>
                <p className="text-xs text-slate-500 mt-2 max-w-[280px] mx-auto">
                  {t('no_active_meets_user')}
                </p>
                <button
                  onClick={() => navigate('/create')}
                  className="mt-6 px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-bold rounded-xl text-xs transition"
                >
                  Create availability
                </button>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Created by me */}
                {myCreatedMeets.length > 0 && (
                  <div>
                    <h3 className="text-xs font-extrabold text-purple-400 uppercase tracking-wider mb-3">Created by me</h3>
                    <div className="space-y-3">
                      {myCreatedMeets.map((meet) => (
                        <div key={meet.id} className="p-4 bg-slate-950 border border-slate-900 rounded-xl flex justify-between items-center gap-4">
                          <div>
                            <span className="text-[10px] text-purple-400 uppercase font-mono font-bold block">{meet.category}</span>
                            <h4 className="text-sm font-bold text-slate-100 mt-1">{meet.title}</h4>
                            <span className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Users size={12} /> {meet.participant_ids.length} Joined
                            </span>
                          </div>
                          <button
                            id={`cancel-meetup-btn-${meet.id}`}
                            onClick={() => handleCancelMeetup(meet)}
                            className="p-2 bg-red-950/20 border border-red-900/30 text-red-400 rounded-xl hover:bg-red-950/40 transition"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Joined by me */}
                {myJoinedMeets.length > 0 && (
                  <div>
                    <h3 className="text-xs font-extrabold text-blue-400 uppercase tracking-wider mb-3">Joined by me</h3>
                    <div className="space-y-3">
                      {myJoinedMeets.map((meet) => (
                        <div key={meet.id} className="p-4 bg-slate-950 border border-slate-900 rounded-xl flex justify-between items-center gap-4">
                          <div>
                            <span className="text-[10px] text-blue-400 uppercase font-mono font-bold block">@{meet.creator_username}</span>
                            <h4 className="text-sm font-bold text-slate-100 mt-1">{meet.title}</h4>
                            <span className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Users size={12} /> {meet.participant_ids.length + 1} participants
                            </span>
                          </div>
                          <button
                            id={`leave-meetup-btn-${meet.id}`}
                            onClick={() => handleLeave(meet)}
                            className="px-3 py-1.5 bg-slate-900 border border-slate-800 hover:bg-slate-850 text-slate-400 text-xs font-semibold rounded-xl transition"
                          >
                            {t('leave_meetup')}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: PROFILE */}
        {activeTab === 'profile' && profile && (
          <div className="flex-1 flex flex-col p-4" id="profile-tab-content">
            <h2 className="text-xl font-extrabold text-slate-100 mb-6 flex items-center gap-2">
              <UserIcon className="text-purple-400 w-5 h-5" />
              <span>{t('tab_profile')}</span>
            </h2>

            {/* Profile Info card */}
            <div className="bg-slate-950 border border-slate-900 rounded-2.5xl p-5 shadow-2xl relative">
              
              {/* Edit toggle */}
              <button
                id="edit-profile-btn"
                onClick={() => {
                  if (isEditingProfile) {
                    setIsEditingProfile(false);
                  } else {
                    startEditing();
                  }
                }}
                className="absolute top-4 right-4 p-2 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 text-purple-400 transition"
              >
                {isEditingProfile ? <span className="text-xs font-bold">✕ Cancel</span> : <Edit size={14} />}
              </button>

              <div className="flex flex-col items-center text-center">
                <div className="w-20 h-20 rounded-full border-4 border-slate-900 overflow-hidden bg-slate-900 mb-3 shadow-xl">
                  <img
                    src={profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`}
                    alt={profile.username}
                    className="w-full h-full object-cover"
                  />
                </div>
                <h3 className="text-lg font-extrabold text-slate-100">@{profile.username}</h3>
                
                {isEditingProfile ? (
                  /* Editing Mode */
                  <div className="w-full text-left space-y-4 mt-6">
                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">University</label>
                      <input
                        id="profile-edit-uni-search"
                        type="text"
                        value={editUni}
                        onChange={(e) => setEditUni(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-850 rounded-xl py-2.5 px-3.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Short Bio</label>
                      <textarea
                        id="profile-edit-bio-textarea"
                        value={editBio}
                        onChange={(e) => setEditBio(e.target.value.slice(0, 300))}
                        rows={3}
                        className="w-full bg-slate-900 border border-slate-850 rounded-xl p-3 text-xs text-slate-100 focus:outline-none focus:border-purple-500 resize-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-400 mb-1.5 uppercase tracking-wide">Interests (1 to 5)</label>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {INTEREST_OPTIONS.map((opt) => {
                          const isSel = editInterests.includes(opt.id);
                          return (
                            <button
                              key={opt.id}
                              id={`edit-interest-${opt.id}`}
                              type="button"
                              onClick={() => toggleEditInterest(opt.id)}
                              className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold border transition ${
                                isSel
                                  ? 'bg-purple-950/40 border-purple-500 text-purple-300'
                                  : 'bg-slate-900 border-slate-850 text-slate-400'
                              }`}
                            >
                              <span>{opt.icon}</span> {language === 'el' ? opt.labelEl : opt.labelEn}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      id="save-profile-btn"
                      onClick={handleSaveProfile}
                      disabled={savingProfile}
                      className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:from-purple-500 hover:to-blue-400 transition flex items-center justify-center gap-2 text-xs"
                    >
                      {savingProfile ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <>
                          <Save size={14} />
                          <span>{t('save_changes')}</span>
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  /* Standard display Mode */
                  <>
                    <p className="text-xs text-slate-500 font-semibold flex items-center gap-1.5 mt-1">
                      <MapPin size={12} className="text-purple-400" />
                      {profile.university}
                    </p>

                    <div className="mt-6 w-full text-left bg-slate-900/40 border border-slate-900 rounded-2xl p-4">
                      <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1.5">Student Bio</h4>
                      <p className="text-xs text-slate-300 leading-relaxed italic">
                        {profile.bio || 'No bio written yet. Tell nearby students about yourself!'}
                      </p>
                    </div>

                    <div className="mt-6 w-full text-left">
                      <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-3">Student Interests</h4>
                      <div className="flex flex-wrap gap-2">
                        {profile.interests.map((intId) => {
                          const item = INTEREST_OPTIONS.find((o) => o.id === intId);
                          return (
                            <span
                              key={intId}
                              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-[11px] font-semibold text-slate-300 flex items-center gap-1.5"
                            >
                              <span>{item?.icon || '✨'}</span>
                              <span>{language === 'el' ? item?.labelEl : item?.labelEn}</span>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <button
                      id="profile-signout-btn"
                      onClick={logout}
                      className="w-full mt-8 py-3 bg-red-950/20 hover:bg-red-950/30 border border-red-900/30 text-red-400 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition"
                    >
                      <LogOut size={14} />
                      <span>{t('sign_out')}</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        )}

        {/* BOTTOM NAVIGATION TAB BAR */}
        <nav className="absolute bottom-0 left-0 right-0 h-16 bg-slate-950/95 backdrop-blur-md border-t border-slate-900 flex items-stretch z-40">
          <button
            id="nav-tab-home"
            onClick={() => {
              setActiveTab('home');
              setSearchOpen(false);
              setSearchQuery('');
            }}
            className={`flex-1 flex flex-col justify-center items-center gap-1 transition ${
              activeTab === 'home' ? 'text-purple-400 font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <HomeIcon size={18} />
            <span className="text-[10px]">{t('tab_home')}</span>
          </button>

          <button
            id="nav-tab-my-meets"
            onClick={() => setActiveTab('my-meets')}
            className={`flex-1 flex flex-col justify-center items-center gap-1 transition ${
              activeTab === 'my-meets' ? 'text-purple-400 font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <Calendar size={18} />
            <span className="text-[10px]">{t('tab_my_meets')}</span>
          </button>

          <button
            id="nav-tab-profile"
            onClick={() => setActiveTab('profile')}
            className={`flex-1 flex flex-col justify-center items-center gap-1 transition ${
              activeTab === 'profile' ? 'text-purple-400 font-bold' : 'text-slate-500 hover:text-slate-400'
            }`}
          >
            <UserIcon size={18} />
            <span className="text-[10px]">{t('tab_profile')}</span>
          </button>
        </nav>
      </div>

      {/* FILTER MODAL OVERLAY */}
      {showFilterModal && (
        <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-slate-950 border-t border-slate-900 rounded-t-3xl p-6 space-y-4 max-h-[85%] overflow-y-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-900">
              <h3 className="text-base font-extrabold text-slate-100">Filter Activities</h3>
              <button
                id="filter-close-btn"
                onClick={() => setShowFilterModal(false)}
                className="text-xs text-slate-500 hover:text-slate-300 font-bold px-2 py-1"
              >
                ✕ Close
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2">
              {INTEREST_OPTIONS.map((opt) => {
                const isSel = selectedCategory === opt.id;
                return (
                  <button
                    key={opt.id}
                    id={`filter-opt-${opt.id}`}
                    type="button"
                    onClick={() => {
                      setSelectedCategory(selectedCategory === opt.id ? null : (opt.id as CategoryType));
                      setShowFilterModal(false);
                    }}
                    className={`p-3 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition ${
                      isSel
                        ? 'bg-purple-950/40 border-purple-500 text-purple-300'
                        : 'bg-slate-900/50 border-slate-900/80 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    <span>{opt.icon}</span>
                    <span>{language === 'el' ? opt.labelEl : opt.labelEn}</span>
                  </button>
                );
              })}
            </div>

            {selectedCategory && (
              <button
                id="clear-filter-btn"
                onClick={() => {
                  setSelectedCategory(null);
                  setShowFilterModal(false);
                }}
                className="w-full py-2.5 mt-4 bg-slate-900 border border-slate-800 text-purple-400 text-xs font-bold rounded-xl hover:bg-slate-850 transition"
              >
                Clear Filters
              </button>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
