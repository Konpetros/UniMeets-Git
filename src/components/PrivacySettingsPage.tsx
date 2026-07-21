import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import Layout from './Layout';
import { ArrowLeft, Lock, Shield, Eye, Flame } from 'lucide-react';
import { useAuth } from './AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function PrivacySettingsPage() {
  const { user, profile, refreshProfile, language, showToast } = useAuth();
  const navigate = useNavigate();

  const [showUniversity, setShowUniversity] = useState(() => profile?.privacy_settings?.show_university ?? true);
  const [showJoinedCount, setShowJoinedCount] = useState(() => profile?.privacy_settings?.show_joined_count ?? true);
  const [showOnlineStatus, setShowOnlineStatus] = useState(() => profile?.privacy_settings?.show_online_status ?? true);

  useEffect(() => {
    if (profile?.privacy_settings) {
      setShowUniversity(profile.privacy_settings.show_university ?? true);
      setShowJoinedCount(profile.privacy_settings.show_joined_count ?? true);
      setShowOnlineStatus(profile.privacy_settings.show_online_status ?? true);
    }
  }, [profile]);

  const tr = {
    en: {
      title: 'Privacy Settings',
      sub: 'Manage how your data is shared and who can view your profile',
      show_university: 'Show my university on my profile',
      show_university_desc: 'Allows other students to see which Greek university you attend',
      show_joined_count: "Show how many UniMeets I've joined",
      show_joined_count_desc: 'Display your total met-up statistics publicly on your profile card',
      show_online_status: 'Show my online status',
      show_online_status_desc: 'Let other students see when you are active or online',
      back: 'Back to Profile',
    },
    el: {
      title: 'Ρυθμίσεις Απορρήτου',
      sub: 'Διαχειρίσου τον τρόπο κοινής χρήσης των δεδομένων σου',
      show_university: 'Εμφάνιση του πανεπιστημίου μου στο προφίλ μου',
      show_university_desc: 'Επιτρέπει σε άλλους φοιτητές να βλέπουν σε ποιο ελληνικό πανεπιστήμιο φοιτάς',
      show_joined_count: 'Εμφάνιση του αριθμού UniMeets που έχω συμμετάσχει',
      show_joined_count_desc: 'Εμφάνιση των στατιστικών των συναντήσεών σου δημόσια στην κάρτα προφίλ σου',
      show_online_status: 'Εμφάνιση της κατάστασης σύνδεσής μου',
      show_online_status_desc: 'Επιτρέπει σε άλλους φοιτητές να βλέπουν πότε είσαι ενεργός/-ή',
      back: 'Επιστροφή στο Προφίλ',
    }
  }[language === 'el' ? 'el' : 'en'];

  const handleToggle = async (key: 'show_university' | 'show_joined_count' | 'show_online_status', currentVal: boolean) => {
    if (!user) return;

    const newVal = !currentVal;
    if (key === 'show_university') setShowUniversity(newVal);
    if (key === 'show_joined_count') setShowJoinedCount(newVal);
    if (key === 'show_online_status') setShowOnlineStatus(newVal);

    try {
      const docRef = doc(db, 'profiles', user.uid);
      await updateDoc(docRef, {
        [`privacy_settings.${key}`]: newVal
      });
      await refreshProfile();
    } catch (err) {
      console.error("Error updating privacy setting:", err);
      showToast("Failed to save setting", "error");
      // Revert
      if (key === 'show_university') setShowUniversity(currentVal);
      if (key === 'show_joined_count') setShowJoinedCount(currentVal);
      if (key === 'show_online_status') setShowOnlineStatus(currentVal);
    }
  };

  return (
    <Layout showHeader>
      <div className="flex-1 flex flex-col p-5 overflow-y-auto">
        {/* Back Button */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition mb-6"
        >
          <ArrowLeft size={14} />
          <span>{tr.back}</span>
        </button>

        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2 mb-1.5">
          <Lock className="text-purple-400 w-5 h-5" />
          <span>{tr.title}</span>
        </h2>
        <p className="text-xs text-slate-500 mb-6">{tr.sub}</p>

        {/* Toggles */}
        <div className="bg-slate-950 border border-slate-900 rounded-2.5xl p-5 space-y-6 shadow-xl">
          {/* Show University */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 mt-0.5">
                <Shield size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{tr.show_university}</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[220px] leading-relaxed">{tr.show_university_desc}</p>
              </div>
            </div>
            
            <button
              id="toggle-show-university"
              onClick={() => handleToggle('show_university', showUniversity)}
              className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none shrink-0 ${
                showUniversity ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                  showUniversity ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Show Joined Count */}
          <div className="flex items-center justify-between gap-4 border-t border-slate-900/80 pt-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 mt-0.5">
                <Flame size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{tr.show_joined_count}</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[220px] leading-relaxed">{tr.show_joined_count_desc}</p>
              </div>
            </div>
            
            <button
              id="toggle-show-joined-count"
              onClick={() => handleToggle('show_joined_count', showJoinedCount)}
              className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none shrink-0 ${
                showJoinedCount ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                  showJoinedCount ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Show Online Status */}
          <div className="flex items-center justify-between gap-4 border-t border-slate-900/80 pt-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 mt-0.5">
                <Eye size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{tr.show_online_status}</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[220px] leading-relaxed">{tr.show_online_status_desc}</p>
              </div>
            </div>
            
            <button
              id="toggle-show-online-status"
              onClick={() => handleToggle('show_online_status', showOnlineStatus)}
              className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none shrink-0 ${
                showOnlineStatus ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                  showOnlineStatus ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
