import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import Layout from './Layout';
import { ArrowLeft, Ban, ShieldAlert } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function BlockedUsersPage() {
  const { language } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tr = {
    en: {
      title: 'Blocked Users',
      sub: 'Manage other student accounts that you have muted or blocked',
      empty: 'No blocked users yet',
      empty_desc: 'Muted or blocked student profiles will appear here. They will not be able to join your UniMeets or send you direct messages.',
      back: 'Back to Profile',
    },
    el: {
      title: 'Αποκλεισμένοι Χρήστες',
      sub: 'Διαχειρίσου τους λογαριασμούς φοιτητών που έχεις αποκλείσει',
      empty: 'Κανένας αποκλεισμένος χρήστης ακόμα',
      empty_desc: 'Οι αποκλεισμένοι φοιτητές θα εμφανίζονται εδώ. Δεν θα μπορούν να συμμετέχουν στα UniMeets σου ούτε να σου στέλνουν άμεσα μηνύματα.',
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
          <Ban className="text-purple-400 w-5 h-5" />
          <span>{tr.title}</span>
        </h2>
        <p className="text-xs text-slate-500 mb-6">{tr.sub}</p>

        {/* Empty State */}
        <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center bg-slate-950 border border-slate-900 rounded-2.5xl my-auto">
          <div className="w-14 h-14 rounded-2xl bg-red-950/20 border border-red-900/20 text-red-400 flex items-center justify-center mb-4">
            <ShieldAlert size={26} />
          </div>
          <h3 className="text-sm font-bold text-slate-200">{tr.empty}</h3>
          <p className="text-xs text-slate-500 mt-2 max-w-[280px] leading-relaxed mx-auto">
            {tr.empty_desc}
          </p>
        </div>

      </div>
    </Layout>
  );
}
