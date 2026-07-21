import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import Layout from './Layout';
import { ArrowLeft, Bell, Users, MessageSquare, Flame, CheckCircle } from 'lucide-react';
import { useAuth } from './AuthContext';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';

export default function NotificationsPage() {
  const { user, profile, refreshProfile, language, showToast } = useAuth();
  const navigate = useNavigate();

  const [newJoinRequest, setNewJoinRequest] = useState(() => profile?.notification_settings?.new_join_request ?? true);
  const [someoneJoined, setSomeoneJoined] = useState(() => profile?.notification_settings?.someone_joined ?? true);
  const [joinApproved, setJoinApproved] = useState(() => profile?.notification_settings?.join_approved ?? true);
  const [newMessage, setNewMessage] = useState(() => profile?.notification_settings?.new_message ?? true);

  useEffect(() => {
    if (profile?.notification_settings) {
      setNewJoinRequest(profile.notification_settings.new_join_request ?? true);
      setSomeoneJoined(profile.notification_settings.someone_joined ?? true);
      setJoinApproved(profile.notification_settings.join_approved ?? true);
      setNewMessage(profile.notification_settings.new_message ?? true);
    }
  }, [profile]);

  const tr = {
    en: {
      title: 'Notifications',
      sub: 'Manage how you want to stay updated on UniMeets',
      new_join_request: 'New join request on my UniMeet',
      new_join_request_desc: 'Get notified when a student requests to join one of your active UniMeets',
      someone_joined: 'Someone joined my UniMeet',
      someone_joined_desc: 'Get notified when a participant successfully joins or is approved for your UniMeet',
      join_approved: 'My join request was approved',
      join_approved_desc: 'Get notified when an organizer accepts your request to join their UniMeet',
      new_message: 'New message in chat',
      new_message_desc: 'Receive alerts when someone sends a message inside active UniMeet chats',
      back: 'Back to Profile',
    },
    el: {
      title: 'Ειδοποιήσεις',
      sub: 'Διαχειρίσου τον τρόπο που ενημερώνεσαι στο UniMeets',
      new_join_request: 'Νέο αίτημα συμμετοχής στο UniMeet μου',
      new_join_request_desc: 'Λάβε ειδοποίηση όταν ένας φοιτητής ζητά να συμμετάσχει σε ένα ενεργό UniMeet σου',
      someone_joined: 'Κάποιος συμμετείχε στο UniMeet μου',
      someone_joined_desc: 'Λάβε ειδοποίηση όταν ένας συμμετέχων εισέρχεται ή εγκρίνεται στο UniMeet σου',
      join_approved: 'Το αίτημα συμμετοχής μου εγκρίθηκε',
      join_approved_desc: 'Λάβε ειδοποίηση όταν ένας διοργανωτής κάνει δεκτό το αίτημά σου για συμμετοχή',
      new_message: 'Νέο μήνυμα στη συνομιλία',
      new_message_desc: 'Λάβε ειδοποιήσεις όταν κάποιος στέλνει μήνυμα σε ενεργές συνομιλίες UniMeets',
      back: 'Επιστροφή στο Προφίλ',
    }
  }[language === 'el' ? 'el' : 'en'];

  const handleToggle = async (key: 'new_join_request' | 'someone_joined' | 'join_approved' | 'new_message', currentVal: boolean) => {
    if (!user) return;
    
    // Optimistic update
    const newVal = !currentVal;
    if (key === 'new_join_request') setNewJoinRequest(newVal);
    if (key === 'someone_joined') setSomeoneJoined(newVal);
    if (key === 'join_approved') setJoinApproved(newVal);
    if (key === 'new_message') setNewMessage(newVal);

    try {
      const docRef = doc(db, 'profiles', user.uid);
      await updateDoc(docRef, {
        [`notification_settings.${key}`]: newVal
      });
      await refreshProfile();
    } catch (err) {
      console.error("Error updating notification setting:", err);
      showToast("Failed to save setting", "error");
      // Revert on error
      if (key === 'new_join_request') setNewJoinRequest(currentVal);
      if (key === 'someone_joined') setSomeoneJoined(currentVal);
      if (key === 'join_approved') setJoinApproved(currentVal);
      if (key === 'new_message') setNewMessage(currentVal);
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
          <Bell className="text-orange-500 w-5 h-5" />
          <span>{tr.title}</span>
        </h2>
        <p className="text-xs text-gray-400 mb-6">{tr.sub}</p>

        {/* Toggles Container */}
        <div className="bg-white border border-gray-100 rounded-2.5xl p-5 space-y-6 shadow-sm">
          
          {/* New join request on my UniMeet */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-50 rounded-xl text-orange-500 mt-0.5">
                <Users size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">{tr.new_join_request}</h4>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[220px] leading-relaxed">{tr.new_join_request_desc}</p>
              </div>
            </div>
            
            <button
              id="toggle-new-join-request"
              onClick={() => handleToggle('new_join_request', newJoinRequest)}
              className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none shrink-0 ${
                newJoinRequest ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                  newJoinRequest ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Someone joined my UniMeet */}
          <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-50 rounded-xl text-blue-500 mt-0.5">
                <Users size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">{tr.someone_joined}</h4>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[220px] leading-relaxed">{tr.someone_joined_desc}</p>
              </div>
            </div>
            
            <button
              id="toggle-someone-joined"
              onClick={() => handleToggle('someone_joined', someoneJoined)}
              className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none shrink-0 ${
                someoneJoined ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                  someoneJoined ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* My join request was approved */}
          <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-50 rounded-xl text-emerald-500 mt-0.5">
                <CheckCircle size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">{tr.join_approved}</h4>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[220px] leading-relaxed">{tr.join_approved_desc}</p>
              </div>
            </div>
            
            <button
              id="toggle-join-approved"
              onClick={() => handleToggle('join_approved', joinApproved)}
              className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none shrink-0 ${
                joinApproved ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                  joinApproved ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* New message in chat */}
          <div className="flex items-center justify-between gap-4 border-t border-gray-100 pt-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-amber-50 rounded-xl text-amber-500 mt-0.5">
                <MessageSquare size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-gray-800">{tr.new_message}</h4>
                <p className="text-[10px] text-gray-400 mt-1 max-w-[220px] leading-relaxed">{tr.new_message_desc}</p>
              </div>
            </div>
            
            <button
              id="toggle-new-message"
              onClick={() => handleToggle('new_message', newMessage)}
              className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none shrink-0 ${
                newMessage ? 'bg-orange-500' : 'bg-gray-200'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                  newMessage ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

        </div>
      </div>
    </Layout>
  );
}
