import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import Layout from './Layout';
import { ArrowLeft, Ban, ShieldAlert, ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from './AuthContext';
import { collection, query, where, getDocs, doc, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface BlockedProfile {
  uid: string;
  username: string;
  avatar_url: string;
  blockDocId: string;
}

export default function BlockedUsersPage() {
  const { user, language, refreshBlocks, showToast } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [blockedList, setBlockedList] = useState<BlockedProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [unblockingId, setUnblockingId] = useState<string | null>(null);

  const tr = {
    en: {
      title: 'Blocked Users',
      sub: 'Manage other student accounts that you have muted or blocked',
      empty: 'No blocked users yet',
      empty_desc: 'Muted or blocked student profiles will appear here. They will not be able to see your UniMeets and you won\'t see theirs.',
      back: 'Back to Profile',
      unblock_btn: 'Unblock',
      unblock_success: 'User has been unblocked.',
      loading_list: 'Loading block list...',
    },
    el: {
      title: 'Αποκλεισμένοι Χρήστες',
      sub: 'Διαχειρίσου τους λογαριασμούς φοιτητών που έχεις αποκλείσει',
      empty: 'Κανένας αποκλεισμένος χρήστης ακόμα',
      empty_desc: 'Οι αποκλεισμένοι φοιτητές θα εμφανίζονται εδώ. Δεν θα μπορούν να βλέπουν τα UniMeets σου ούτε εσύ τα δικά τους.',
      back: 'Επιστροφή στο Προφίλ',
      unblock_btn: 'Ξεκλείδωμα',
      unblock_success: 'Ο χρήστης ξεκλειδώθηκε με επιτυχία.',
      loading_list: 'Φόρτωση λίστας...',
    }
  }[language === 'el' ? 'el' : 'en'];

  const fetchBlockedUsers = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const q = query(collection(db, 'blocks'), where('blocker_id', '==', user.uid));
      const querySnapshot = await getDocs(q);
      
      const resolvedList: BlockedProfile[] = [];

      // Resolve each blocked user profile
      const promises = querySnapshot.docs.map(async (blockDoc) => {
        const blockData = blockDoc.data();
        const blockedId = blockData.blocked_id;
        
        try {
          const profileDoc = await getDoc(doc(db, 'profiles', blockedId));
          if (profileDoc.exists()) {
            const profData = profileDoc.data();
            resolvedList.push({
              uid: blockedId,
              username: profData.username || 'unknown',
              avatar_url: profData.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${blockedId}`,
              blockDocId: blockDoc.id,
            });
          } else {
            // Profile deleted or inactive
            resolvedList.push({
              uid: blockedId,
              username: `deleted_student_${blockedId.substring(0, 5)}`,
              avatar_url: `https://api.dicebear.com/7.x/bottts/svg?seed=${blockedId}`,
              blockDocId: blockDoc.id,
            });
          }
        } catch (err) {
          console.error("Error fetching blocked profile:", err);
        }
      });

      await Promise.all(promises);
      setBlockedList(resolvedList);
    } catch (err) {
      console.error("Error loading blocked list:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBlockedUsers();
  }, [user]);

  const handleUnblock = async (blockedItem: BlockedProfile) => {
    setUnblockingId(blockedItem.uid);
    try {
      // 1. Delete document from Firestore
      await deleteDoc(doc(db, 'blocks', blockedItem.blockDocId));
      
      // 2. Refresh AuthContext blocks lists
      await refreshBlocks();
      
      // 3. Remove local state
      setBlockedList(prev => prev.filter(x => x.uid !== blockedItem.uid));
      
      showToast(tr.unblock_success, 'success');
    } catch (err) {
      console.error("Failed to unblock:", err);
      showToast('Failed to unblock user', 'error');
    } finally {
      setUnblockingId(null);
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

        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-1.5">
          <Ban className="text-orange-500 w-5 h-5" />
          <span>{tr.title}</span>
        </h2>
        <p className="text-xs text-gray-400 mb-6">{tr.sub}</p>

        {loading ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-gray-400 text-xs font-semibold gap-2">
            <RefreshCw className="animate-spin text-orange-500" size={20} />
            <span>{tr.loading_list}</span>
          </div>
        ) : blockedList.length === 0 ? (
          /* Empty State */
          <div className="flex-1 flex flex-col items-center justify-center py-12 px-4 text-center bg-white border border-gray-100 rounded-2.5xl shadow-sm my-auto">
            <div className="w-14 h-14 rounded-2xl bg-gray-100 border border-gray-200 text-gray-400 flex items-center justify-center mb-4">
              <ShieldCheck size={26} />
            </div>
            <h3 className="text-sm font-bold text-gray-800">{tr.empty}</h3>
            <p className="text-xs text-gray-400 mt-2 max-w-[280px] leading-relaxed mx-auto">
              {tr.empty_desc}
            </p>
          </div>
        ) : (
          /* List of Blocked Users */
          <div className="space-y-3">
            {blockedList.map((item) => (
              <div 
                key={item.uid}
                className="bg-white border border-gray-100 rounded-2xl p-4 flex items-center justify-between gap-4 shadow-sm"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full border border-gray-200 bg-gray-50 overflow-hidden shrink-0">
                    <img 
                      src={item.avatar_url} 
                      alt={item.username} 
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="block text-sm font-bold text-gray-800">@{item.username}</span>
                  </div>
                </div>

                <button
                  id={`unblock-btn-${item.username}`}
                  onClick={() => handleUnblock(item)}
                  disabled={unblockingId === item.uid}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border border-gray-200 text-gray-700 text-xs font-bold rounded-xl transition shrink-0 disabled:opacity-50"
                >
                  {unblockingId === item.uid ? '...' : tr.unblock_btn}
                </button>
              </div>
            ))}
          </div>
        )}

      </div>
    </Layout>
  );
}
