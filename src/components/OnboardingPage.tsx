import React, { useState, useEffect } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation, UNIVERSITIES, INTEREST_OPTIONS } from '../i18n';
import Layout from './Layout';
import { motion, AnimatePresence } from 'motion/react';
import { 
  ArrowLeft, ArrowRight, Check, Search, Upload, Info, 
  MapPin, MessageSquare, Flame, Sparkles 
} from 'lucide-react';
import { collection, query, where, getDocs, doc, setDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export default function OnboardingPage() {
  const { user, profile, refreshProfile, showToast, loading: authLoading } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [direction, setDirection] = useState(1); // 1 = forward, -1 = backward

  // Form States
  const [username, setUsername] = useState('');
  const [usernameChecking, setUsernameChecking] = useState(false);
  const [usernameAvailable, setUsernameAvailable] = useState<boolean | null>(null);
  const [usernameError, setUsernameError] = useState('');

  const [uniSearch, setUniSearch] = useState('');
  const [selectedUni, setSelectedUni] = useState<{ id: string; en: string; el: string } | null>(null);
  const [showUniDropdown, setShowUniDropdown] = useState(false);

  const [avatarBase64, setAvatarBase64] = useState<string>('');
  const [bio, setBio] = useState('');
  const [selectedInterests, setSelectedInterests] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  // Redirection checks
  if (authLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
        </div>
      </Layout>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (profile?.onboarding_completed) {
    return <Navigate to="/" replace />;
  }

  // Username validation and debounced availability check
  useEffect(() => {
    if (step !== 2) return;
    if (username.length < 3) {
      setUsernameAvailable(null);
      setUsernameError('');
      return;
    }

    // Greek and Latin letters, numbers, and underscores allowed
    const regex = /^[a-zA-Z0-9_\u0370-\u03ff\u1f00-\u1fff]+$/;
    if (!regex.test(username)) {
      setUsernameAvailable(false);
      setUsernameError(t('username_invalid'));
      return;
    }

    if (username.length > 20) {
      setUsernameAvailable(false);
      setUsernameError(t('username_invalid'));
      return;
    }

    setUsernameChecking(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const q = query(collection(db, 'profiles'), where('username', '==', username.toLowerCase()));
        const querySnapshot = await getDocs(q);
        
        let takenByOther = false;
        querySnapshot.forEach((doc) => {
          if (doc.id !== user.uid) {
            takenByOther = true;
          }
        });

        if (takenByOther) {
          setUsernameAvailable(false);
          setUsernameError(t('username_taken'));
        } else {
          setUsernameAvailable(true);
          setUsernameError('');
        }
      } catch (err) {
        console.error(err);
      } finally {
        setUsernameChecking(false);
      }
    }, 4000);

    return () => clearTimeout(delayDebounce);
  }, [username, step]);

  const handleNext = () => {
    if (step === 2 && !usernameAvailable) {
      showToast(t('username_invalid'), 'error');
      return;
    }
    if (step === 3 && !selectedUni) {
      showToast(t('step_uni_desc'), 'error');
      return;
    }
    setDirection(1);
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setDirection(-1);
    setStep((prev) => prev - 1);
  };

  // Image upload to base64
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      showToast('Max file size 10MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setAvatarBase64(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInterestToggle = (id: string) => {
    setSelectedInterests((prev) => {
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

  const handleFinish = async () => {
    if (selectedInterests.length < 1) {
      showToast(t('interests_range_error'), 'error');
      return;
    }

    setSubmitting(true);
    const path = `profiles/${user.uid}`;
    try {
      const profileData = {
        username: username.toLowerCase(),
        university: selectedUni ? (language === 'el' ? selectedUni.el : selectedUni.en) : '',
        bio: bio.trim(),
        avatar_url: avatarBase64 || `https://api.dicebear.com/7.x/bottts/svg?seed=${username}`,
        interests: selectedInterests,
        onboarding_completed: true,
        created_at: new Date().toISOString(),
      };

      await setDoc(doc(db, 'profiles', user.uid), profileData);
      showToast('Onboarding complete! Welcome!', 'success');
      await refreshProfile();
      navigate('/');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, path);
      showToast('Failed to save profile', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUnis = UNIVERSITIES.filter((uni) => {
    const term = uniSearch.toLowerCase();
    return uni.en.toLowerCase().includes(term) || uni.el.toLowerCase().includes(term);
  });

  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir < 0 ? 300 : -300,
      opacity: 0,
    }),
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col px-6 py-6 overflow-y-auto">
        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex justify-between items-center text-xs text-gray-400 mb-2 font-mono">
            <span>{t('onboarding_progress', { current: step, total: 6 })}</span>
            <span>{Math.round((step / 6) * 100)}%</span>
          </div>
          <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-orange-500 to-orange-400 transition-all duration-300"
              style={{ width: `${(step / 6) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Slide Steps Container */}
        <div className="flex-1 flex flex-col justify-between relative min-h-[460px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}
              className="flex-1 flex flex-col justify-between"
            >
              {/* Step 1: Welcome Screen */}
              {step === 1 && (
                <div className="flex-1 flex flex-col justify-between" id="onboarding-step-1">
                  <div className="flex-1 flex flex-col justify-center text-center py-4">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-orange-500 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/20 mb-4 mx-auto animate-bounce">
                      <span className="text-2.5xl">🎓</span>
                    </div>
                    <h2 className="text-2.5xl font-bold text-gray-900 tracking-tight">
                      {t('onboarding_welcome')}
                    </h2>
                    <p className="text-sm text-gray-500 mt-2 max-w-[320px] mx-auto">
                      {t('onboarding_welcome_sub')}
                    </p>

                    {/* Features cards */}
                    <div className="grid grid-cols-1 gap-3 mt-8 text-left">
                      <div className="flex gap-4 p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-xl shrink-0">🎯</div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">{t('feature_1_title')}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{t('feature_1_desc')}</p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-xl shrink-0">💬</div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">{t('feature_2_title')}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{t('feature_2_desc')}</p>
                        </div>
                      </div>

                      <div className="flex gap-4 p-3.5 bg-white border border-gray-100 rounded-xl shadow-sm">
                        <div className="w-10 h-10 rounded-lg bg-orange-50 flex items-center justify-center text-xl shrink-0">📍</div>
                        <div>
                          <h4 className="text-sm font-bold text-gray-800">{t('feature_3_title')}</h4>
                          <p className="text-xs text-gray-500 mt-0.5">{t('feature_3_desc')}</p>
                        </div>
                      </div>
                    </div>

                    {/* Language Selector */}
                    <div className="flex justify-center gap-3 mt-8">
                      <button
                        id="onboarding-lang-el"
                        onClick={() => setLanguage('el')}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition flex items-center gap-2 ${
                          language === 'el'
                            ? 'bg-orange-50 border-orange-400 text-orange-600'
                            : 'bg-gray-100 border-gray-200 text-gray-500'
                        }`}
                      >
                        <span>🇬🇷</span> Ελληνικά
                      </button>
                      <button
                        id="onboarding-lang-en"
                        onClick={() => setLanguage('en')}
                        className={`px-4 py-2 rounded-xl text-sm font-semibold border transition flex items-center gap-2 ${
                          language === 'en'
                            ? 'bg-orange-50 border-orange-400 text-orange-600'
                            : 'bg-gray-100 border-gray-200 text-gray-500'
                        }`}
                      >
                        <span>🇬🇧</span> English
                      </button>
                    </div>
                  </div>

                  <div className="pt-4 space-y-3">
                    <button
                      id="onboarding-start-btn"
                      onClick={handleNext}
                      className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg transition flex items-center justify-center gap-2 text-sm"
                    >
                      <span>{t('lets_start')}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 2: Choose Username */}
              {step === 2 && (
                <div className="flex-1 flex flex-col justify-between" id="onboarding-step-2">
                  <div className="py-4">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                      {t('step_username_title')}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">{t('step_username_desc')}</p>

                    <div className="mt-8 relative">
                      <input
                        id="onboarding-username-input"
                        type="text"
                        placeholder="e.g. niki_papadopoulou"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        className="w-full bg-white border border-gray-200 rounded-xl py-3.5 px-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 shadow-sm"
                      />

                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                        {usernameChecking && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-orange-500"></div>
                        )}
                        {!usernameChecking && usernameAvailable === true && (
                          <span className="text-emerald-600 bg-emerald-50 p-1 rounded-full"><Check size={14} /></span>
                        )}
                        {!usernameChecking && usernameAvailable === false && (
                          <span className="text-red-600 text-xs font-bold font-mono">✕</span>
                        )}
                      </div>
                    </div>

                    <div className="mt-2 min-h-[20px]">
                      {usernameChecking && (
                        <p className="text-xs text-gray-400 font-medium">{t('checking_username')}</p>
                      )}
                      {!usernameChecking && usernameAvailable === true && (
                        <p className="text-xs text-emerald-600 font-semibold">{t('username_available')}</p>
                      )}
                      {!usernameChecking && usernameAvailable === false && (
                        <p className="text-xs text-red-600 font-semibold">{usernameError}</p>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      id="onboarding-back-btn"
                      onClick={handleBack}
                      className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 font-semibold text-sm transition flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={16} />
                      <span>{t('back')}</span>
                    </button>
                    <button
                      id="onboarding-next-btn"
                      onClick={handleNext}
                      disabled={!usernameAvailable || usernameChecking}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:from-orange-600 hover:to-orange-500 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      <span>{t('next')}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 3: University dropdown */}
              {step === 3 && (
                <div className="flex-1 flex flex-col justify-between" id="onboarding-step-3">
                  <div className="py-4 flex-1 flex flex-col">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                      {t('step_uni_title')}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">{t('step_uni_desc')}</p>

                    {/* Custom search combobox */}
                    <div className="mt-6 relative flex-1 flex flex-col">
                      <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          id="onboarding-uni-search"
                          type="text"
                          placeholder={t('search_uni')}
                          value={uniSearch}
                          onChange={(e) => {
                            setUniSearch(e.target.value);
                            setShowUniDropdown(true);
                          }}
                          onFocus={() => setShowUniDropdown(true)}
                          className="w-full bg-white border border-gray-200 rounded-xl py-3 pl-11 pr-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 shadow-sm"
                        />
                      </div>

                      {/* Dropdown Options */}
                      {showUniDropdown && (
                        <div className="mt-2 bg-white border border-gray-200 rounded-xl overflow-y-auto max-h-[220px] shadow-lg z-20">
                          {filteredUnis.length > 0 ? (
                            filteredUnis.map((uni) => (
                              <button
                                key={uni.id}
                                id={`uni-option-${uni.id}`}
                                type="button"
                                onClick={() => {
                                  setSelectedUni(uni);
                                  setUniSearch(language === 'el' ? uni.el : uni.en);
                                  setShowUniDropdown(false);
                                }}
                                className={`w-full text-left px-4 py-3 text-xs border-b border-gray-100 hover:bg-gray-50 transition flex items-center justify-between ${
                                  selectedUni?.id === uni.id ? 'bg-orange-50 text-orange-600 font-bold' : 'text-gray-700'
                                }`}
                              >
                                <span>{language === 'el' ? uni.el : uni.en}</span>
                                {selectedUni?.id === uni.id && <Check size={14} />}
                              </button>
                            ))
                          ) : (
                            <div className="p-4 text-center text-xs text-gray-400">No universities found</div>
                          )}
                        </div>
                      )}

                      {/* Display Selected Uni card */}
                      {selectedUni && !showUniDropdown && (
                        <div className="mt-4 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
                          <span className="text-xl">🏫</span>
                          <div>
                            <h4 className="text-[10px] font-bold text-orange-600 uppercase tracking-wider">Selected University</h4>
                            <p className="text-sm text-gray-800 mt-1 font-semibold">{language === 'el' ? selectedUni.el : selectedUni.en}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      id="onboarding-back-btn"
                      onClick={handleBack}
                      className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 font-semibold text-sm transition flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={16} />
                      <span>{t('back')}</span>
                    </button>
                    <button
                      id="onboarding-next-btn"
                      onClick={handleNext}
                      disabled={!selectedUni}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:from-orange-600 hover:to-orange-500 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      <span>{t('next')}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 4: Profile photo upload */}
              {step === 4 && (
                <div className="flex-1 flex flex-col justify-between" id="onboarding-step-4">
                  <div className="py-4 text-center">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight text-left">
                      {t('step_photo_title')}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1 text-left">{t('step_photo_desc')}</p>

                    {/* Circular photo preview */}
                    <div className="my-8 flex justify-center">
                      <div className="relative group">
                        <div className="w-32 h-32 rounded-full border-4 border-gray-100 overflow-hidden bg-white flex items-center justify-center shadow-md relative">
                          {avatarBase64 ? (
                            <img src={avatarBase64} alt="Avatar preview" className="w-full h-full object-cover" />
                          ) : (
                            <div className="text-center p-4">
                              <span className="text-4xl text-gray-400">👤</span>
                            </div>
                          )}
                        </div>
                        {avatarBase64 && (
                          <button
                            id="remove-avatar-btn"
                            onClick={() => setAvatarBase64('')}
                            className="absolute -top-1 -right-1 bg-red-600 hover:bg-red-500 text-white rounded-full p-1.5 shadow-lg text-xs"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>

                    {/* File Dropzone */}
                    <label className="border border-dashed border-gray-200 rounded-2xl p-6 flex flex-col items-center justify-center cursor-pointer bg-gray-50 hover:bg-gray-100/70 transition-all">
                      <Upload className="text-orange-500 mb-2" size={24} />
                      <span className="text-xs text-gray-500 font-semibold">{t('drag_drop_photo')}</span>
                      <input 
                        id="onboarding-avatar-file-input"
                        type="file" 
                        accept="image/*" 
                        onChange={handlePhotoUpload} 
                        className="hidden" 
                      />
                    </label>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      id="onboarding-back-btn"
                      onClick={handleBack}
                      className="py-3 px-4 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 font-semibold text-sm transition flex items-center justify-center gap-1"
                    >
                      <ArrowLeft size={16} />
                      <span>{t('back')}</span>
                    </button>
                    <button
                      id="onboarding-skip-btn"
                      onClick={handleNext}
                      className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-200 transition text-sm"
                    >
                      {t('skip')}
                    </button>
                    <button
                      id="onboarding-next-btn"
                      onClick={handleNext}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:from-orange-600 hover:to-orange-500 transition flex items-center justify-center gap-1 text-sm"
                    >
                      <span>{t('next')}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 5: Bio textarea */}
              {step === 5 && (
                <div className="flex-1 flex flex-col justify-between" id="onboarding-step-5">
                  <div className="py-4">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                      {t('step_bio_title')}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">{t('step_bio_desc')}</p>

                    <div className="mt-6 relative">
                      <textarea
                        id="onboarding-bio-textarea"
                        placeholder={t('bio_placeholder')}
                        value={bio}
                        onChange={(e) => setBio(e.target.value.slice(0, 300))}
                        rows={5}
                        className="w-full bg-white border border-gray-200 rounded-xl p-4 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:border-orange-400 resize-none shadow-sm"
                      />
                      <div className="text-right text-xs text-gray-400 mt-1 font-mono">
                        {t('char_count', { count: bio.length, max: 300 })}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      id="onboarding-back-btn"
                      onClick={handleBack}
                      className="py-3 px-4 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 font-semibold text-sm transition flex items-center justify-center gap-1"
                    >
                      <ArrowLeft size={16} />
                      <span>{t('back')}</span>
                    </button>
                    <button
                      id="onboarding-skip-btn"
                      onClick={handleNext}
                      className="flex-1 py-3 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl border border-gray-200 hover:bg-gray-200 transition text-sm"
                    >
                      {t('skip')}
                    </button>
                    <button
                      id="onboarding-next-btn"
                      onClick={handleNext}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:from-orange-600 hover:to-orange-500 transition flex items-center justify-center gap-1 text-sm"
                    >
                      <span>{t('next')}</span>
                      <ArrowRight size={16} />
                    </button>
                  </div>
                </div>
              )}

              {/* Step 6: Select Interests */}
              {step === 6 && (
                <div className="flex-1 flex flex-col justify-between" id="onboarding-step-6">
                  <div className="py-4">
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">
                      {t('step_interests_title')}
                    </h2>
                    <p className="text-xs text-gray-500 mt-1">{t('step_interests_desc')}</p>

                    {/* Badge Interest Chips */}
                    <div className="flex flex-wrap gap-2.5 mt-6 max-h-[300px] overflow-y-auto pr-1">
                      {INTEREST_OPTIONS.map((interest) => {
                        const isSelected = selectedInterests.includes(interest.id);
                        return (
                          <button
                            key={interest.id}
                            id={`interest-chip-${interest.id}`}
                            type="button"
                            onClick={() => handleInterestToggle(interest.id)}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold border flex items-center gap-2 transition-all duration-150 ${
                              isSelected
                                ? 'bg-orange-50 border-orange-400 text-orange-600 scale-[1.03] shadow-md shadow-orange-500/10'
                                : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'
                            }`}
                          >
                            <span>{interest.icon}</span>
                            <span>{language === 'el' ? interest.labelEl : interest.labelEn}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-4 flex items-center gap-2 text-xs text-gray-400">
                      <Info size={14} className="text-orange-500" />
                      <span>{t('interests_range_error')}</span>
                    </div>
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      id="onboarding-back-btn"
                      onClick={handleBack}
                      className="flex-1 py-3 px-4 border border-gray-200 rounded-xl text-gray-500 hover:bg-gray-100 font-semibold text-sm transition flex items-center justify-center gap-2"
                    >
                      <ArrowLeft size={16} />
                      <span>{t('back')}</span>
                    </button>
                    <button
                      id="onboarding-finish-btn"
                      onClick={handleFinish}
                      disabled={selectedInterests.length === 0 || submitting}
                      className="flex-1 bg-gradient-to-r from-orange-500 to-orange-400 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:from-orange-600 hover:to-orange-500 transition flex items-center justify-center gap-2 text-sm disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                          <span>{t('loading')}</span>
                        </>
                      ) : (
                        <>
                          <span>{t('finish')}</span>
                          <Check size={16} />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}
