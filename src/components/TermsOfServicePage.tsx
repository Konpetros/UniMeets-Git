import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '../i18n';
import Layout from './Layout';
import { ArrowLeft, FileText, CheckCircle2 } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function TermsOfServicePage() {
  const { language } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const tr = {
    en: {
      title: 'Terms of Service',
      sub: 'Please read our terms and student community guidelines',
      intro: 'Welcome to UniMeets, the spontaneous student meetup application designed for Greek university campuses.',
      guidelines_title: 'Student Community Guidelines',
      rule_1: 'Spontaneous & Respectful Interactions: Treat nearby students with respect and kindness. Harassment or abusive behavior will lead to direct account termination.',
      rule_2: 'Verified Student Status: Always use your authentic student profile details. Impersonation of other university students or faculty is strictly prohibited.',
      rule_3: 'Physical Meetup Safety: Meet in public university campus areas or crowded student venues. Keep campus security or local emergency numbers handy.',
      rule_4: 'Strict Prohibition of Inappropriate Posts: No promotion of commercial services, illegal activities, or explicit material. All statuses automatically expire in 6 hours.',
      back: 'Back to Profile',
    },
    el: {
      title: 'Όροι Χρήσης',
      sub: 'Παρακαλούμε διαβάστε τους όρους και τις οδηγίες της φοιτητικής μας κοινότητας',
      intro: 'Καλώς ήρθατε στο UniMeets, την εφαρμογή για αυθόρμητες συναντήσεις που σχεδιάστηκε για ελληνικά πανεπιστήμια.',
      guidelines_title: 'Οδηγίες Φοιτητικής Κοινότητας',
      rule_1: 'Αυθόρμητες & Σεβαστές Αλληλεπιδράσεις: Αντιμετωπίστε τους συμφοιτητές σας με σεβασμό. Η παρενόχληση ή η υβριστική συμπεριφορά θα οδηγήσει σε άμεση διαγραφή λογαριασμού.',
      rule_2: 'Επαληθευμένη Φοιτητική Ιδιότητα: Χρησιμοποιείτε πάντα τα αυθεντικά σας στοιχεία. Η προσομοίωση άλλων φοιτητών ή μελών ΔΕΠ απαγορεύεται αυστηρά.',
      rule_3: 'Ασφάλεια Φυσικών Συναντήσεων: Συναντηθείτε σε δημόσιους χώρους της πανεπιστημιούπολης ή σε πολυσύχναστα φοιτητικά στέκια. Έχετε πάντα πρόχειρα τα τηλέφωνα ασφαλείας.',
      rule_4: 'Αυστηρή Απαγόρευση Ακατάλληλων Αναρτήσεων: Απαγορεύεται η προώθηση εμπορικών υπηρεσιών, παράνομων δραστηριοτήτων ή ακατάλληλου περιεχομένου. Όλες οι αναρτήσεις λήγουν αυτόματα σε 6 ώρες.',
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
          <FileText className="text-purple-400 w-5 h-5" />
          <span>{tr.title}</span>
        </h2>
        <p className="text-xs text-slate-500 mb-6">{tr.sub}</p>

        {/* Content */}
        <div className="bg-slate-950 border border-slate-900 rounded-2.5xl p-5 space-y-6 shadow-xl leading-relaxed">
          <p className="text-xs text-slate-300">
            {tr.intro}
          </p>

          <div className="border-t border-slate-900/80 pt-5">
            <h3 className="text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">{tr.guidelines_title}</h3>
            
            <div className="space-y-4">
              {[tr.rule_1, tr.rule_2, tr.rule_3, tr.rule_4].map((rule, idx) => (
                <div key={idx} className="flex gap-3 items-start">
                  <CheckCircle2 size={15} className="text-purple-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-slate-400">{rule}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </Layout>
  );
}
