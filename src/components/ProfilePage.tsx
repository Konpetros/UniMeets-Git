import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation, INTEREST_OPTIONS } from '../i18n';
import Layout from './Layout';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Home as HomeIcon, Calendar, User as UserIcon, ChevronRight, Edit, Save, 
  Upload, Info, LogOut, Globe, Bell, Lock, Ban, FileText, Trash2, GraduationCap
} from 'lucide-react';
import { doc, updateDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

// Beautiful category color mapping for all interests
const INTEREST_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  movies: { bg: 'bg-red-950/25', text: 'text-red-400', border: 'border-red-900/40' },
  coffee: { bg: 'bg-amber-950/25', text: 'text-amber-400', border: 'border-amber-900/40' },
  study: { bg: 'bg-blue-950/25', text: 'text-blue-400', border: 'border-blue-900/40' },
  walk: { bg: 'bg-emerald-950/25', text: 'text-emerald-400', border: 'border-emerald-900/40' },
  party: { bg: 'bg-purple-950/25', text: 'text-purple-400', border: 'border-purple-900/40' },
  gaming: { bg: 'bg-pink-950/25', text: 'text-pink-400', border: 'border-pink-900/40' },
  sports: { bg: 'bg-orange-950/25', text: 'text-orange-400', border: 'border-orange-900/40' },
  music: { bg: 'bg-violet-950/25', text: 'text-violet-400', border: 'border-violet-900/40' },
  reading: { bg: 'bg-teal-950/25', text: 'text-teal-400', border: 'border-teal-900/40' },
  travel: { bg: 'bg-sky-950/25', text: 'text-sky-400', border: 'border-sky-900/40' },
  photography: { bg: 'bg-indigo-950/25', text: 'text-indigo-400', border: 'border-indigo-900/40' },
  food: { bg: 'bg-yellow-950/25', text: 'text-yellow-400', border: 'border-yellow-900/40' },
  art: { bg: 'bg-fuchsia-950/25', text: 'text-fuchsia-400', border: 'border-fuchsia-900/40' },
  technology: { bg: 'bg-cyan-950/25', text: 'text-cyan-400', border: 'border-cyan-900/40' },
  fitness: { bg: 'bg-rose-950/25', text: 'text-rose-400', border: 'border-rose-900/40' },
  nature: { bg: 'bg-green-950/25', text: 'text-green-400', border: 'border-green-900/40' },
};

const LOCAL_TR = {
  en: {
    title: 'My Profile',
    edit_profile: 'Edit Profile',
    created: 'Created',
    joined: 'Joined',
    stats_created: 'UniMeets Posted',
    stats_joined: 'UniMeets Joined',
    settings_header: 'Account Settings',
    lang_label: 'Language',
    notifications: 'Notifications',
    privacy: 'Privacy Settings',
    blocked: 'Blocked Users',
    terms: 'Terms of Service',
    delete_account: 'Delete Account',
    bio_label: 'Student Bio',
    interests_label: 'Student Interests',
    empty_bio: 'No bio written yet. Tell nearby students about yourself!',
    edit_bio_placeholder: 'Tell students about yourself (max 300 characters)...',
    edit_photo_btn: 'Upload New Photo',
    edit_interests_info: 'Select 1 to 5 interests',
    loading_saving: 'Saving...',
    unsupported_format: 'Invalid image format. Please upload JPEG/PNG/SVG.',
    max_size_error: 'Max file size 10MB',
  },
  el: {
    title: 'Το Προφίλ μου',
    edit_profile: 'Επεξεργασία Προφίλ',
    created: 'Δημιουργήθηκαν',
    joined: 'Συμμετοχές',
    stats_created: 'UniMeets που ανάρτησες',
    stats_joined: 'UniMeets που συμμετείχες',
    settings_header: 'Ρυθμίσεις Λογαριασμού',
    lang_label: 'Γλώσσα',
    notifications: 'Ειδοποιήσεις',
    privacy: 'Ρυθμίσεις Απορρήτου',
    blocked: 'Αποκλεισμένοι Χρήστες',
    terms: 'Όροι Χρήσης',
    delete_account: 'Διαγραφή Λογαριασμού',
    bio_label: 'Σύντομο Βιογραφικό',
    interests_label: 'Ενδιαφέροντα',
    empty_bio: 'Δεν υπάρχει βιογραφικό ακόμα. Πες στους συμφοιτητές σου κάτι για σένα!',
    edit_bio_placeholder: 'Πες κάτι για σένα (έως 300 χαρακτήρες)...',
    edit_photo_btn: 'Ανέβασε νέα φωτογραφία',
    edit_interests_info: 'Επίλεξε 1 έως 5 ενδιαφέροντα',
    loading_saving: 'Αποθήκευση...',
    unsupported_format: 'Μη έγκυρη μορφή εικόνας. Ανεβάστε JPEG/PNG/SVG.',
    max_size_error: 'Μέγιστο μέγεθος αρχείου 10MB',
  }
};

export default function ProfilePage() {
  const { user, profile, refreshProfile, logout, showToast } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();

  // Stats row states
  const [createdCount, setCreatedCount] = useState<number>(0);
  const [joinedCount, setJoinedCount] = useState<number>(0);
  const [statsLoading, setStatsLoading] = useState<boolean>(true);

  // Edit Modal bottom sheet state
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [editAvatar, setEditAvatar] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const tr = LOCAL_TR[language] || LOCAL_TR.en;

  // Query stats dynamically on mount
  useEffect(() => {
    if (!user) return;
    const fetchUserStats = async () => {
      try {
        const qCreated = query(collection(db, 'unimeets'), where('creator_id', '==', user.uid));
        const qJoined = query(collection(db, 'unimeets'), where('participant_ids', 'array-contains', user.uid));
        
        const [createdSnap, joinedSnap] = await Promise.all([
          getDocs(qCreated),
          getDocs(qJoined)
        ]);

        setCreatedCount(createdSnap.size);
        setJoinedCount(joinedSnap.size);
      } catch (err) {
        console.error("Error fetching user stats:", err);
      } finally {
        setStatsLoading(false);
      }
    };
    fetchUserStats();
  }, [user]);

  if (!profile) {
    return (
      <Layout showHeader>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
        </div>
      </Layout>
    );
  }

  // Handle opening of Edit Bottom Sheet
  const handleOpenSheet = () => {
    setEditAvatar(profile.avatar_url || '');
    setEditBio(profile.bio || '');
    setEditInterests(profile.interests || []);
    setIsSheetOpen(true);
  };

  // Convert uploaded image to base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast(tr.max_size_error, 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setEditAvatar(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Toggle interest select
  const toggleInterest = (id: string) => {
    setEditInterests((prev) => {
      if (prev.includes(id)) {
        return prev.filter((x) => x !== id);
      } else {
        if (prev.length >= 5) {
          showToast(t('interests_range_error'), 'error');
          return prev;
        }
        return [...prev, id];
      }
    });
  };

  // Save changes to Firestore
  const handleSaveChanges = async () => {
    if (editInterests.length < 1) {
      showToast(t('interests_range_error'), 'error');
      return;
    }

    setSaving(true);
    const path = `profiles/${profile.uid}`;
    try {
      const docRef = doc(db, 'profiles', profile.uid);
      await updateDoc(docRef, {
        bio: editBio.trim(),
        avatar_url: editAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`,
        interests: editInterests,
      });

      await refreshProfile();
      showToast(t('profile_updated'), 'success');
      setIsSheetOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, path);
      showToast('Failed to update profile', 'error');
    } finally {
      setSaving(false);
    }
  };

  // Inline toggle language
  const toggleLanguage = () => {
    const newLang = language === 'el' ? 'en' : 'el';
    setLanguage(newLang);
    showToast(newLang === 'el' ? 'Η γλώσσα άλλαξε στα Ελληνικά!' : 'Language changed to English!', 'success');
  };

  return (
    <Layout showHeader>
      <div className="flex-1 flex flex-col p-4 pb-20 overflow-y-auto">
        
        {/* Title */}
        <h2 className="text-xl font-extrabold text-slate-100 mb-6 flex items-center gap-2">
          <UserIcon className="text-purple-400 w-5 h-5 animate-pulse" />
          <span>{tr.title}</span>
        </h2>

        {/* Profile Card */}
        <div className="bg-slate-950 border border-slate-900 rounded-2.5xl p-6 shadow-2xl relative flex flex-col items-center text-center">
          
          {/* Avatar (large circular centered) */}
          <div className="w-24 h-24 rounded-full border-4 border-slate-900 overflow-hidden bg-slate-900 mb-4 shadow-2xl relative">
            <img
              src={profile.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`}
              alt={profile.username}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Username (bold) */}
          <h3 className="text-xl font-extrabold text-slate-50 tracking-tight">@{profile.username}</h3>
          
          {/* University with Graduate icon */}
          <p className="text-xs text-slate-400 font-semibold flex items-center gap-1.5 mt-1.5">
            <GraduationCap size={15} className="text-purple-400" />
            <span>{profile.university}</span>
          </p>

          {/* Bio text if exists */}
          <div className="mt-5 w-full text-left bg-slate-900/40 border border-slate-900 rounded-2xl p-4">
            <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-1">{tr.bio_label}</h4>
            <p className="text-xs text-slate-300 leading-relaxed italic">
              {profile.bio || tr.empty_bio}
            </p>
          </div>

          {/* Interests display as custom colored chips */}
          <div className="mt-5 w-full text-left">
            <h4 className="text-[10px] font-bold text-purple-400 uppercase tracking-widest mb-2.5">{tr.interests_label}</h4>
            <div className="flex flex-wrap gap-2">
              {profile.interests.map((intId) => {
                const item = INTEREST_OPTIONS.find((o) => o.id === intId);
                const col = INTEREST_COLORS[intId] || { bg: 'bg-purple-950/25', text: 'text-purple-400', border: 'border-purple-900/40' };
                return (
                  <span
                    key={intId}
                    className={`px-3 py-1.5 rounded-xl border text-[11px] font-semibold flex items-center gap-1.5 transition-all ${col.bg} ${col.text} ${col.border}`}
                  >
                    <span>{item?.icon || '✨'}</span>
                    <span>{language === 'el' ? item?.labelEl : item?.labelEn}</span>
                  </span>
                );
              })}
            </div>
          </div>

          {/* Stats Row */}
          <div className="grid grid-cols-2 gap-4 mt-6 w-full border-t border-slate-900 pt-5">
            <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-3 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-purple-400 font-mono">
                {statsLoading ? '...' : createdCount}
              </span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{tr.stats_created}</span>
            </div>

            <div className="bg-slate-900/20 border border-slate-900 rounded-2xl p-3 flex flex-col items-center justify-center">
              <span className="text-2xl font-black text-blue-400 font-mono">
                {statsLoading ? '...' : joinedCount}
              </span>
              <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{tr.stats_joined}</span>
            </div>
          </div>

          {/* Edit Profile Button */}
          <button
            id="open-edit-sheet-btn"
            onClick={handleOpenSheet}
            className="w-full mt-6 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-200 text-xs font-bold py-3.5 px-4 rounded-xl flex items-center justify-center gap-2 transition"
          >
            <Edit size={14} className="text-purple-400" />
            <span>{tr.edit_profile}</span>
          </button>
        </div>

        {/* Settings list below profile */}
        <div className="mt-8">
          <h4 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest px-1 mb-3">{tr.settings_header}</h4>
          
          <div className="bg-slate-950 border border-slate-900 rounded-2.5xl overflow-hidden divide-y divide-slate-900/80">
            {/* Language toggle inline row */}
            <button
              id="settings-lang-row"
              onClick={toggleLanguage}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-900/30 transition text-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 shrink-0">
                  <Globe size={16} />
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{tr.lang_label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Greek / English</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs bg-purple-950/40 border border-purple-900/40 px-2.5 py-1 rounded-lg text-purple-400 font-bold">
                  {language === 'el' ? '🇬🇷 Ελληνικά' : '🇬🇧 English'}
                </span>
                <ChevronRight size={16} className="text-slate-600" />
              </div>
            </button>

            {/* Notifications */}
            <button
              id="settings-notifs-row"
              onClick={() => navigate('/account/notifications')}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-900/30 transition text-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-amber-500/10 rounded-xl text-amber-400 shrink-0">
                  <Bell size={16} />
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{tr.notifications}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600" />
            </button>

            {/* Privacy Settings */}
            <button
              id="settings-privacy-row"
              onClick={() => navigate('/account/privacy-settings')}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-900/30 transition text-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0">
                  <Lock size={16} />
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{tr.privacy}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600" />
            </button>

            {/* Blocked Users */}
            <button
              id="settings-blocked-row"
              onClick={() => navigate('/account/blocked')}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-900/30 transition text-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-red-500/10 rounded-xl text-red-400 shrink-0">
                  <Ban size={16} />
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{tr.blocked}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600" />
            </button>

            {/* Terms of Service */}
            <button
              id="settings-terms-row"
              onClick={() => navigate('/account/terms')}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-900/30 transition text-sm"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-slate-500/10 rounded-xl text-slate-400 shrink-0">
                  <FileText size={16} />
                </div>
                <div>
                  <p className="font-semibold text-slate-200">{tr.terms}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-600" />
            </button>

            {/* Delete Account */}
            <button
              id="settings-delete-row"
              onClick={() => navigate('/account/delete')}
              className="w-full px-5 py-4 flex items-center justify-between text-left hover:bg-slate-900/30 transition text-sm bg-red-950/5"
            >
              <div className="flex items-center gap-3.5">
                <div className="p-2 bg-red-500/10 rounded-xl text-red-500 shrink-0">
                  <Trash2 size={16} />
                </div>
                <div>
                  <p className="font-semibold text-red-400">{tr.delete_account}</p>
                </div>
              </div>
              <ChevronRight size={16} className="text-red-900/40" />
            </button>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          id="profile-signout-btn"
          onClick={logout}
          className="w-full mt-8 py-3.5 bg-red-950/20 hover:bg-red-950/30 border border-red-900/30 text-red-400 font-extrabold rounded-xl text-xs flex items-center justify-center gap-2 transition"
        >
          <LogOut size={14} />
          <span>{t('sign_out')}</span>
        </button>

        {/* BOTTOM SHEET MODAL (Edit Profile) */}
        <AnimatePresence>
          {isSheetOpen && (
            <div className="fixed inset-0 z-50 flex items-end justify-center">
              
              {/* Overlay Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setIsSheetOpen(false)}
                className="absolute inset-0 bg-black/85 backdrop-blur-sm"
              />

              {/* Bottom Sheet Card */}
              <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="relative w-full max-w-md bg-slate-950 border-t border-slate-900 rounded-t-3xl shadow-2xl p-6 flex flex-col max-h-[85vh] overflow-y-auto z-10"
              >
                {/* Visual drag handle */}
                <div className="w-12 h-1.5 bg-slate-800 rounded-full mx-auto mb-5 shrink-0" />

                {/* Header */}
                <div className="flex justify-between items-center mb-6 shrink-0">
                  <h3 className="text-base font-extrabold text-slate-100">{tr.edit_profile}</h3>
                  <button
                    id="close-edit-sheet-btn"
                    onClick={() => setIsSheetOpen(false)}
                    className="text-xs font-bold text-slate-500 hover:text-slate-300"
                  >
                    ✕
                  </button>
                </div>

                {/* Form fields */}
                <div className="space-y-6 flex-1">
                  
                  {/* Photo upload section */}
                  <div className="flex flex-col items-center">
                    <div className="w-20 h-20 rounded-full border-4 border-slate-900 overflow-hidden bg-slate-900 mb-3 shadow-xl relative">
                      <img
                        src={editAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=${profile.username}`}
                        alt="Edit preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    
                    <label className="cursor-pointer bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-300 text-[11px] font-bold py-2 px-4 rounded-xl flex items-center gap-1.5 transition">
                      <Upload size={12} className="text-purple-400" />
                      <span>{tr.edit_photo_btn}</span>
                      <input
                        id="avatar-upload-file-input"
                        type="file"
                        accept="image/*"
                        onChange={handlePhotoUpload}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* Non-editable Username & University after onboarding */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Username</span>
                      <div className="bg-slate-900/40 border border-slate-900 px-3.5 py-3 rounded-xl text-xs text-slate-400 font-semibold font-mono">
                        @{profile.username}
                      </div>
                    </div>
                    <div>
                      <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">University</span>
                      <div className="bg-slate-900/40 border border-slate-900 px-3.5 py-3 rounded-xl text-xs text-slate-400 font-semibold truncate" title={profile.university}>
                        {profile.university}
                      </div>
                    </div>
                  </div>

                  {/* Bio textarea */}
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">{tr.bio_label}</span>
                    <textarea
                      id="profile-edit-bio-textarea"
                      placeholder={tr.edit_bio_placeholder}
                      value={editBio}
                      onChange={(e) => setEditBio(e.target.value.slice(0, 300))}
                      rows={3}
                      className="w-full bg-slate-900 border border-slate-850 rounded-xl p-3 text-xs text-slate-100 placeholder:text-slate-700 focus:outline-none focus:border-purple-500 resize-none"
                    />
                    <div className="text-right text-[10px] text-slate-600 mt-1 font-mono">
                      {t('char_count', { count: editBio.length, max: 300 })}
                    </div>
                  </div>

                  {/* Interests Selector chips (max 1-5) */}
                  <div>
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">{tr.edit_interests_info}</span>
                    <div className="flex flex-wrap gap-2 max-h-[160px] overflow-y-auto pr-1">
                      {INTEREST_OPTIONS.map((opt) => {
                        const isSelected = editInterests.includes(opt.id);
                        return (
                          <button
                            key={opt.id}
                            id={`edit-interest-${opt.id}`}
                            type="button"
                            onClick={() => toggleInterest(opt.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all duration-150 ${
                              isSelected
                                ? 'bg-purple-950/40 border-purple-500 text-purple-300'
                                : 'bg-slate-900 border-slate-850/80 text-slate-400 hover:bg-slate-850'
                            }`}
                          >
                            <span>{opt.icon}</span>
                            <span>{language === 'el' ? opt.labelEl : opt.labelEn}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                </div>

                {/* Submit Action */}
                <button
                  id="save-profile-btn"
                  onClick={handleSaveChanges}
                  disabled={saving}
                  className="w-full mt-6 bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-xs shrink-0 disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>{tr.loading_saving}</span>
                    </>
                  ) : (
                    <>
                      <Save size={14} />
                      <span>{t('save_changes')}</span>
                    </>
                  )}
                </button>
              </motion.div>

            </div>
          )}
        </AnimatePresence>

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
            onClick={() => navigate('/my-unimeets')}
            className="flex-1 flex flex-col justify-center items-center gap-1 text-slate-500 hover:text-slate-400 transition"
          >
            <Calendar size={18} />
            <span className="text-[10px]">{t('tab_my_meets')}</span>
          </button>

          <button
            id="nav-tab-profile"
            onClick={() => {}}
            className="flex-1 flex flex-col justify-center items-center gap-1 text-purple-400 font-bold transition"
          >
            <UserIcon size={18} />
            <span className="text-[10px]">{t('tab_profile')}</span>
          </button>
        </nav>

      </div>
    </Layout>
  );
}
