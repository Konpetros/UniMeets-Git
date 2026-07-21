import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { ArrowLeft, Trash2, ShieldAlert } from 'lucide-react';
import { useAuth } from './AuthContext';
import { doc, deleteDoc, collection, query, where, getDocs, updateDoc, arrayRemove } from 'firebase/firestore';
import { deleteUser } from 'firebase/auth';
import { db, handleFirestoreError, OperationType } from '../firebase';

export default function DeleteAccountPage() {
  const { user, logout, showToast, language } = useAuth();
  const navigate = useNavigate();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);

  const tr = {
    en: {
      title: 'Delete Account',
      sub: 'This is a permanent action that cannot be undone',
      warning_head: 'Are you absolutely sure?',
      warning_body: 'Deleting your student account will permanently remove your profile, cancel all UniMeets you created, and remove you from any joined chats. This action is irreversible.',
      confirm_placeholder: 'Type "DELETE" to confirm',
      button_label: 'Permanently Delete Account',
      deleting: 'Deleting Account...',
      success: 'Your student profile and account have been completely deleted.',
      back: 'Back to Profile',
    },
    el: {
      title: 'Διαγραφή Λογαριασμού',
      sub: 'Αυτή είναι μια μόνιμη ενέργεια που δεν μπορεί να αναιρεθεί',
      warning_head: 'Είστε απολύτως σίγουροι;',
      warning_body: 'Η διαγραφή του φοιτητικού σας λογαριασμού θα αφαιρέσει οριστικά το προφίλ σας, θα ακυρώσει όλα τα UniMeets που δημιουργήσατε και θα σας αφαιρέσει από όλες τις συνομιλίες. Αυτή η ενέργεια είναι μη αναστρέψιμη.',
      confirm_placeholder: 'Πληκτρολογήστε "DELETE" για επιβεβαίωση',
      button_label: 'Οριστική Διαγραφή Λογαριασμού',
      deleting: 'Διαγραφή Λογαριασμού...',
      success: 'Το φοιτητικό σας προφίλ και ο λογαριασμός διαγράφηκαν οριστικά.',
      back: 'Επιστροφή στο Προφίλ',
    }
  }[language === 'el' ? 'el' : 'en'];

  const handleDeleteAccount = async () => {
    if (!user || confirmText !== 'DELETE') return;
    setLoading(true);
    const path = `profiles/${user.uid}`;
    try {
      // 1. Cancel all active meetups created by this user
      const qCreated = query(
        collection(db, 'unimeets'),
        where('creator_id', '==', user.uid),
        where('status', '==', 'active')
      );
      const createdSnap = await getDocs(qCreated);
      const cancelPromises: Promise<any>[] = [];
      createdSnap.forEach((meetDoc) => {
        cancelPromises.push(updateDoc(doc(db, 'unimeets', meetDoc.id), { status: 'cancelled' }));
      });
      await Promise.all(cancelPromises);

      // 2. Remove the user from all active participant lists (chats) they joined
      const qJoined = query(
        collection(db, 'unimeets'),
        where('participant_ids', 'array-contains', user.uid),
        where('status', '==', 'active')
      );
      const joinedSnap = await getDocs(qJoined);
      const leavePromises: Promise<any>[] = [];
      joinedSnap.forEach((meetDoc) => {
        leavePromises.push(updateDoc(doc(db, 'unimeets', meetDoc.id), {
          participant_ids: arrayRemove(user.uid)
        }));
      });
      await Promise.all(leavePromises);

      // 3. Delete profiles document from Firestore
      await deleteDoc(doc(db, 'profiles', user.uid));
      
      // 4. Delete the user from Firebase Auth
      await deleteUser(user);
      
      // 5. Sign out the local state (using logout) and redirect
      await logout();
      
      showToast(tr.success, 'info');
      navigate('/login');
    } catch (err: any) {
      console.error("Error during account deletion:", err);
      if (err?.code === 'auth/requires-recent-login') {
        showToast('Please sign out and sign back in to delete your account for security reasons.', 'error');
      } else {
        handleFirestoreError(err, OperationType.DELETE, path);
        showToast('Failed to delete account. Please try again.', 'error');
      }
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
          className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-gray-700 transition mb-6"
        >
          <ArrowLeft size={14} />
          <span>{tr.back}</span>
        </button>

        <h2 className="text-xl font-bold text-red-600 flex items-center gap-2 mb-1.5">
          <Trash2 className="text-red-500 w-5 h-5" />
          <span>{tr.title}</span>
        </h2>
        <p className="text-xs text-gray-400 mb-6">{tr.sub}</p>

        {/* Warning Card */}
        <div className="bg-red-50 border border-red-200 rounded-2.5xl p-5 mb-6 flex flex-col items-center text-center shadow-sm">
          <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center mb-4">
            <ShieldAlert size={22} />
          </div>
          <h3 className="text-sm font-bold text-red-600">{tr.warning_head}</h3>
          <p className="text-xs text-gray-600 mt-2 leading-relaxed max-w-[280px]">
            {tr.warning_body}
          </p>
        </div>

        {/* Confirmation Text Input */}
        <div className="mb-6 space-y-2">
          <label className="block text-[10px] font-bold text-gray-400 uppercase tracking-wider">
            {tr.confirm_placeholder}
          </label>
          <input
            id="delete-confirmation-input"
            type="text"
            value={confirmText}
            onChange={(e) => setConfirmText(e.target.value)}
            placeholder='Type "DELETE"'
            className="w-full bg-white border border-gray-200 focus:border-red-500 rounded-xl p-3 text-sm text-center font-bold text-red-600 placeholder-gray-300 tracking-wider focus:outline-none transition-all"
          />
        </div>

        {/* Action Button */}
        <button
          id="confirm-delete-account-btn"
          disabled={loading || confirmText !== 'DELETE'}
          onClick={handleDeleteAccount}
          className="w-full bg-red-600 hover:bg-red-500 disabled:bg-gray-100 text-white disabled:text-gray-400 font-bold py-3.5 px-4 rounded-xl text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-500/10 transition disabled:opacity-50 disabled:border-gray-200 border border-transparent"
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
