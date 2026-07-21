import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from '../i18n';
import Layout from './Layout';
import { motion } from 'motion/react';
import { ArrowLeft, Sparkles, MapPin, AlertCircle, Calendar } from 'lucide-react';
import { collection, addDoc, doc, setDoc, Timestamp } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { encodeGeohash, hasProfanity } from '../utils';
import { CategoryType } from '../types';

const CATEGORIES: { id: CategoryType; labelEn: string; labelEl: string; emoji: string; color: string; hover: string; selectClass: string }[] = [
  { id: 'coffee', labelEn: 'Coffee', labelEl: 'Καφές', emoji: '☕', color: 'bg-amber-50 text-amber-800 border-amber-200', hover: 'hover:bg-amber-100', selectClass: 'bg-amber-500 text-white border-amber-500 font-bold scale-[1.04] shadow-sm' },
  { id: 'study', labelEn: 'Study', labelEl: 'Διάβασμα', emoji: '📚', color: 'bg-blue-50 text-blue-800 border-blue-200', hover: 'hover:bg-blue-100', selectClass: 'bg-blue-500 text-white border-blue-500 font-bold scale-[1.04] shadow-sm' },
  { id: 'walk', labelEn: 'Walk', labelEl: 'Βόλτα', emoji: '🌿', color: 'bg-emerald-50 text-emerald-800 border-emerald-200', hover: 'hover:bg-emerald-100', selectClass: 'bg-emerald-500 text-white border-emerald-500 font-bold scale-[1.04] shadow-sm' },
  { id: 'movies', labelEn: 'Movies', labelEl: 'Ταινίες', emoji: '🎬', color: 'bg-purple-50 text-purple-800 border-purple-200', hover: 'hover:bg-purple-100', selectClass: 'bg-purple-500 text-white border-purple-500 font-bold scale-[1.04] shadow-sm' },
  { id: 'party', labelEn: 'Party', labelEl: 'Πάρτι', emoji: '🎉', color: 'bg-pink-50 text-pink-800 border-pink-200', hover: 'hover:bg-pink-100', selectClass: 'bg-pink-500 text-white border-pink-500 font-bold scale-[1.04] shadow-sm' },
  { id: 'gaming', labelEn: 'Gaming', labelEl: 'Gaming', emoji: '🎮', color: 'bg-indigo-50 text-indigo-800 border-indigo-200', hover: 'hover:bg-indigo-100', selectClass: 'bg-indigo-500 text-white border-indigo-500 font-bold scale-[1.04] shadow-sm' },
  { id: 'sports', labelEn: 'Sports', labelEl: 'Αθλητισμός', emoji: '⚽', color: 'bg-orange-50 text-orange-800 border-orange-200', hover: 'hover:bg-orange-100', selectClass: 'bg-orange-500 text-white border-orange-500 font-bold scale-[1.04] shadow-sm' },
  { id: 'music', labelEn: 'Music', labelEl: 'Μουσική', emoji: '🎵', color: 'bg-rose-50 text-rose-800 border-rose-200', hover: 'hover:bg-rose-100', selectClass: 'bg-rose-500 text-white border-rose-500 font-bold scale-[1.04] shadow-sm' },
];

export default function CreateMeetupPage() {
  const { user, profile, showToast } = useAuth();
  const { t, language } = useTranslation();
  const navigate = useNavigate();

  const [category, setCategory] = useState<CategoryType>('coffee');
  const [title, setTitle] = useState('');
  const [requiresApproval, setRequiresApproval] = useState(false);
  const [loading, setLoading] = useState(false);
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Prefetch coordinates on load
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        },
        (err) => {
          console.warn("Location not granted, falling back to Athens default campus", err);
          // Default to Syntagma Square coordinates (Athens core)
          setCoords({ lat: 37.9838, lng: 23.7275 });
        }
      );
    } else {
      setCoords({ lat: 37.9838, lng: 23.7275 });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    if (hasProfanity(title)) {
      showToast(t('profanity_warning'), 'error');
      return;
    }

    setLoading(true);
    const path = 'unimeets';
    try {
      const activeCoords = coords || { lat: 37.9838, lng: 23.7275 };
      const geohash = encodeGeohash(activeCoords.lat, activeCoords.lng);

      const now = new Date();
      const expires = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours expiration

      const meetupData = {
        title: title.trim(),
        category,
        creator_id: user?.uid || '',
        creator_username: profile?.username || 'student',
        creator_avatar: profile?.avatar_url || '',
        creator_university: profile?.university || 'Greek University',
        latitude: activeCoords.lat,
        longitude: activeCoords.lng,
        geohash,
        expires_at: Timestamp.fromDate(expires),
        status: 'active',
        participant_ids: [],
        pending_ids: [],
        requires_approval: requiresApproval,
        created_at: Timestamp.fromDate(now),
      };

      await addDoc(collection(db, 'unimeets'), meetupData);
      showToast('You are now available!', 'success');
      navigate('/');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, path);
      showToast('Failed to post availability', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      {/* Sticky Header */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 px-4 py-3 flex items-center justify-between">
        <button
          id="create-back-btn"
          onClick={() => navigate('/')}
          className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-500 hover:text-gray-750 transition-all flex items-center gap-1.5 text-xs font-semibold"
        >
          <ArrowLeft size={14} />
          <span>{t('back')}</span>
        </button>

        <h1 className="text-sm font-extrabold text-gray-900 tracking-tight flex items-center gap-1.5">
          <Calendar size={14} className="text-orange-500" />
          <span>Become Available</span>
        </h1>

        <div className="w-10"></div> {/* balancing spacer */}
      </header>

      <div className="flex-1 flex flex-col p-6 overflow-y-auto">
        <form onSubmit={handleSubmit} className="flex-1 flex flex-col justify-between">
          <div className="space-y-6">
            
            {/* Category Select section */}
            <div>
              <h3 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3.5 flex items-center gap-2">
                <span className="text-orange-500">01</span>
                <span>{t('category_title')}</span>
              </h3>

              {/* 4x2 Category Grid */}
              <div className="grid grid-cols-2 gap-2.5">
                {CATEGORIES.map((cat) => {
                  const isSelected = category === cat.id;
                  return (
                    <button
                      key={cat.id}
                      id={`category-btn-${cat.id}`}
                      type="button"
                      onClick={() => setCategory(cat.id)}
                      className={`p-3.5 rounded-xl border text-xs font-semibold flex items-center gap-2.5 transition-all duration-150 ${
                        isSelected ? cat.selectClass : `${cat.color} ${cat.hover}`
                      }`}
                    >
                      <span className="text-lg">{cat.emoji}</span>
                      <span>{language === 'el' ? cat.labelEl : cat.labelEn}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title text input Section */}
            <div>
              <h3 className="text-xs font-extrabold text-gray-500 uppercase tracking-widest mb-3.5 flex items-center gap-2">
                <span className="text-orange-500">02</span>
                <span>{t('title_section')}</span>
              </h3>

              <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm">
                {/* Prefix Label */}
                <p className="text-xs text-orange-600 font-extrabold uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Sparkles size={13} />
                  <span>{t('prefix_looking_for')}...</span>
                </p>

                {/* Input box */}
                <textarea
                  id="create-title-input"
                  rows={3}
                  required
                  maxLength={60}
                  placeholder={t('title_placeholder')}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 resize-none font-medium leading-relaxed"
                />

                <div className="flex justify-between items-center mt-2.5 text-[10px] text-gray-400 font-mono">
                  <div className="flex items-center gap-1">
                    <AlertCircle size={10} className="text-gray-400" />
                    <span>Avoid spam / profanities</span>
                  </div>
                  <span>{title.length} / 60</span>
                </div>
              </div>
            </div>

            {/* Requires Approval Toggle */}
            <div className="p-4 bg-white border border-gray-200 rounded-2xl shadow-sm flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-bold text-gray-800">Require Organizer Approval</h4>
                <p className="text-[10px] text-gray-500 mt-1">
                  Students must request to join, and you can approve them before they can enter the chat.
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  id="requires-approval-toggle"
                  type="checkbox"
                  checked={requiresApproval}
                  onChange={(e) => setRequiresApproval(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gray-400 after:border-gray-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-orange-500 peer-checked:after:bg-white"></div>
              </label>
            </div>

            {/* Location Display Indicator */}
            <div className="p-3.5 bg-gray-50 border border-gray-200 rounded-xl flex items-center gap-3">
              <MapPin size={16} className="text-orange-500 shrink-0" />
              <div className="text-[11px] text-gray-600">
                <p className="font-bold uppercase tracking-wider text-orange-600 text-[9px]">Location Anchor</p>
                <p className="mt-0.5">Meetup will be anchored to your current coordinates (6h expires).</p>
              </div>
            </div>
          </div>

          <button
            id="create-submit-btn"
            type="submit"
            disabled={!title.trim() || loading}
            className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white font-bold py-4 px-4 rounded-xl shadow-sm active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-8 text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t('loading')}</span>
              </>
            ) : (
              <>
                <span>{t('available_submit')}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </Layout>
  );
}
