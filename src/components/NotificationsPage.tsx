import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import Layout from './Layout';
import { ArrowLeft, Bell, Sparkles, MessageSquare, Flame } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function NotificationsPage() {
  const { language } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const [meetupAlerts, setMeetupAlerts] = useState(true);
  const [messages, setMessages] = useState(true);
  const [requests, setRequests] = useState(true);

  const tr = {
    en: {
      title: 'Notifications',
      sub: 'Manage how you want to stay updated on UniMeets',
      meetups: 'Spontaneous meetup alerts',
      meetups_desc: 'Get notified when new UniMeets are created near your university',
      chats: 'New chat messages',
      chats_desc: 'Receive push alerts when someone sends a message inside joined chats',
      joins: 'Join requests & approvals',
      joins_desc: 'Get notified when users request to join your meets or when your request is accepted',
      back: 'Back to Profile',
    },
    el: {
      title: 'Ειδοποιήσεις',
      sub: 'Διαχειρίσου τον τρόπο που ενημερώνεσαι στο UniMeets',
      meetups: 'Ειδοποιήσεις για αυθόρμητες συναντήσεις',
      meetups_desc: 'Λάβε ειδοποίηση όταν δημιουργούνται νέα UniMeets κοντά στο πανεπιστήμιό σου',
      chats: 'Νέα μηνύματα συνομιλίας',
      chats_desc: 'Λάβε ειδοποιήσεις push όταν κάποιος στέλνει μήνυμα σε συνομιλίες που συμμετέχεις',
      joins: 'Αιτήματα συμμετοχής & εγκρίσεις',
      joins_desc: 'Λάβε ειδοποίηση όταν χρήστες ζητούν να συμμετάσχουν ή όταν εγκρίνεται το αίτημά σου',
      back: 'Επιστροφή στο Προφίλ',
    }
  }[language === 'el' ? 'el' : 'en'];

  return (
    <Layout showHeader>
      <div className="flex-1 flex flex-col p-5 overflow-y-auto">
        {/* Back Button & Title */}
        <button
          onClick={() => navigate('/profile')}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-slate-200 transition mb-6"
        >
          <ArrowLeft size={14} />
          <span>{tr.back}</span>
        </button>

        <h2 className="text-xl font-extrabold text-slate-100 flex items-center gap-2 mb-1.5">
          <Bell className="text-purple-400 w-5 h-5" />
          <span>{tr.title}</span>
        </h2>
        <p className="text-xs text-slate-500 mb-6">{tr.sub}</p>

        {/* Toggles Container */}
        <div className="bg-slate-950 border border-slate-900 rounded-2.5xl p-5 space-y-6 shadow-xl">
          {/* Meetup Alerts */}
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-purple-500/10 rounded-xl text-purple-400 mt-0.5">
                <Sparkles size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{tr.meetups}</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[220px] leading-relaxed">{tr.meetups_desc}</p>
              </div>
            </div>
            
            <button
              onClick={() => setMeetupAlerts(!meetupAlerts)}
              className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none ${
                meetupAlerts ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                  meetupAlerts ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* New messages */}
          <div className="flex items-center justify-between gap-4 border-t border-slate-900/80 pt-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-blue-500/10 rounded-xl text-blue-400 mt-0.5">
                <MessageSquare size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{tr.chats}</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[220px] leading-relaxed">{tr.chats_desc}</p>
              </div>
            </div>
            
            <button
              onClick={() => setMessages(!messages)}
              className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none ${
                messages ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                  messages ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Joins and approvals */}
          <div className="flex items-center justify-between gap-4 border-t border-slate-900/80 pt-5">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl text-emerald-400 mt-0.5">
                <Flame size={16} />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-slate-200">{tr.joins}</h4>
                <p className="text-[10px] text-slate-500 mt-1 max-w-[220px] leading-relaxed">{tr.joins_desc}</p>
              </div>
            </div>
            
            <button
              onClick={() => setRequests(!requests)}
              className={`w-11 h-6 rounded-full p-0.5 transition duration-200 focus:outline-none ${
                requests ? 'bg-purple-600' : 'bg-slate-800'
              }`}
            >
              <div
                className={`bg-white w-5 h-5 rounded-full shadow-md transform transition duration-200 ${
                  requests ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

      </div>
    </Layout>
  );
}
