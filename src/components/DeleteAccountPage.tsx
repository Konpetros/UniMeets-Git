import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import Layout from './Layout';
import { ArrowLeft, Trash2, ShieldAlert } from 'lucide-react';
import { useAuth } from './AuthContext';
import { doc, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';

export default function DeleteAccountPage() {
  const { user, logout, showToast, language } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(false);

  const tr = {
    en: {
      title: 'Delete Account',
      sub: 'This is a permanent action that cannot be undone',
      warning_head: 'Are you absolutely sure?',
      warning_body: 'Deleting your student account will permanently purge your profile, active statuses, historical meetups, and joined chat records. This action is irreversible.',
      button_label: 'Permanently Delete Account',
      deleting: 'Deleting...',
      success: 'Your student profile has been completely deleted.',
      back: 'Back to Profile',
    },
    el: {
      title: 'Διαγραφή Λογαριασμού',
      sub: 'Αυτή είναι μια μόνιμη ενέργεια που δεν μπορεί να αναιρεθεί',
      warning_head: 'Είστε απολύτως σίγουροι;',
      warning_body: 'Η διαγραφή του φοιτητικού σας λογαριασμού θα αφαιρέσει οριστικά το προφίλ, τις ενεργές καταστάσεις, το ιστορικό συναντήσεων και τα αρχεία συνομιλιών σας. Αυτή η ενέργεια είναι μη αναστρέψιμη.',
      button_label: 'Οριστική Διαγραφή Λογαριασμού',
      deleting: 'Διαγραφή...',
      success: 'Το φοιτητικό σας προφίλ διαγράφηκε οριστικά.',
      back: 'Επιστροφή στο Προφίλ',
    }
  }[language === 'el' ? 'el' : 'en'];

  const handleDeleteAccount = async () => {
    if (!user) return;
    setLoading(true);
    const path = `profiles/${user.uid}`;
    try {
      // 1. Delete profile from Firestore
      await deleteDoc(doc(db, 'profiles', user.uid));
      
      // 2. Sign out the user
      await logout();
      
      showToast(tr.success, 'info');
      navigate('/login');
    } catch (err) {
      console.error(err);
      handleFirestoreError(err, OperationType.DELETE, path);
      showToast('Failed to delete account data', 'error');
    } finally {
      setLoading(false);
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
          <Trash2 className="text-red-500 w-5 h-5" />
          <span className="text-red-500">{tr.title}</span>
        </h2>
        <p className="text-xs text-slate-500 mb-6">{tr.sub}</p>

        {/* Warning card */}
        <div className="bg-red-950/10 border border-red-900/30 rounded-2.5xl p-5 mb-8 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-xl bg-red-500/10 text-red-500 flex items-center justify-center mb-4">
            <ShieldAlert size={22} />
          </div>
          <h3 className="text-sm font-bold text-red-400">{tr.warning_head}</h3>
          <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-[280px]">
            {tr.warning_body}
          </p>
        </div>

        {/* Action Button */}
        <button
          id="confirm-delete-account-btn"
          disabled={loading}
          onClick={handleDeleteAccount}
          className="w-full bg-red-600 hover:bg-red-500 text-white font-extrabold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 transition disabled:opacity-50"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>{tr.deleting}</span>
            </>
          ) : (
            <>
              <Trash2 size={14} />
              <span>{tr.button_label}</span>
            </>
          )}
        </button>

      </div>
    </Layout>
  );
}
