import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import Layout from './Layout';
import { ArrowLeft, Lock, Shield, Eye, MapPin } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function PrivacySettingsPage() {
  const { language } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [shareUni, setShareUni] = useState(true);
  const [preciseLoc, setPreciseLoc] = useState(false);
  const [searchable, setSearchable] = useState(true);

  const tr = {
    en: {
      title: 'Privacy Settings',
      sub: 'Manage how your data is shared and who can view your profile',
      share_uni: 'Show university to non-participants',
      share_uni_desc: 'Allows students outside of your joined meets to see which Greek university you attend',
      precise: 'Share location precisely',
      precise_desc: 'Show a more precise indicator of your meetup coordinates (default is rounded geohashes)',
      searchable: 'Profile visible in searches',
      searchable_desc: 'Allow your student profile to be viewed by non-participants on the map and feed',
      back: 'Back to Profile',
    },
    el: {
      title: 'Ρυθμίσεις Απορρήτου',
      sub: 'Διαχειρίσου τον τρόπο κοινής χρήσης των δεδομένων σου',
      share_uni: 'Εμφάνιση πανεπιστημίου σε μη συμμετέχοντες',
      share_uni_desc: 'Επιτρέπει σε φοιτητές εκτός των συναντήσεών σου να βλέπουν σε ποιο ελληνικό πανεπιστήμιο φοιτάς',
      precise: 'Ακριβής κοινή χρήση τοποθεσίας',
      precise_desc: 'Εμφάνιση πιο ακριβών συντεταγμένων συνάντησης (η προεπιλογή είναι στρογγυλοποιημένα geohashes)',
      searchable: 'Προφίλ ορατό σε αναζητήσεις',
      searchable_desc: 'Επίτρεψε στο φοιτητικό σου προφίλ να εμφανίζεται σε μη συμμετέχοντες στο χάρτη και στη ροή',
      back: 'Επιστροφή στο Προφίλ',
    }
  }[language === 'el' ? 'el' : 'en'];

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
          {/* Share university */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 mt-0.5">
                <Shield size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{tr.share_uni}</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[220px] leading-relaxed">{tr.share_uni_desc}</p>
              </div>
            </div>
            
            <button
              onClick={() => setShareUni(!shareUni)}
              className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none ${
                shareUni ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                  shareUni ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Precise Location */}
          <div className="flex items-center justify-between gap-4 border-t border-slate-900/80 pt-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 mt-0.5">
                <MapPin size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{tr.precise}</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[220px] leading-relaxed">{tr.precise_desc}</p>
              </div>
            </div>
            
            <button
              onClick={() => setPreciseLoc(!preciseLoc)}
              className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none ${
                preciseLoc ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                  preciseLoc ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Profile Searchable */}
          <div className="flex items-center justify-between gap-4 border-t border-slate-900/80 pt-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 mt-0.5">
                <Eye size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{tr.searchable}</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[220px] leading-relaxed">{tr.searchable_desc}</p>
              </div>
            </div>
            
            <button
              onClick={() => setSearchable(!searchable)}
              className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none ${
                searchable ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                  searchable ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
