import React from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from './Layout';
import { ArrowLeft, FileText, ShieldAlert, CheckCircle, Scale, Eye } from 'lucide-react';
import { useAuth } from './AuthContext';

export default function TermsOfServicePage() {
  const { language } = useAuth();
  const navigate = useNavigate();

  const tr = {
    en: {
      title: 'Terms of Service',
      sub: 'Please read our terms and community guidelines before using UniMeets',
      back: 'Back to Profile',
      
      section_age: '1. Age Requirement (18+)',
      section_age_text: 'UniMeets is strictly intended for university students in Greece who are at least 18 years of age. By creating an account and using the platform, you represent and warrant that you are 18 years or older and currently enrolled in a Greek Higher Education Institution (AEI/TEI).',
      
      section_gdpr: '2. GDPR Compliance & Privacy',
      section_gdpr_text: 'We respect your personal data under the EU General Data Protection Regulation (GDPR) and Greek Law 4624/2019. We collect and process your student profile data (username, university affiliation, interests, and approximate geohash coordinates) solely to connect you with nearby student meetups. Your data is confidential and you can delete your profile and personal records permanently at any time through the Delete Account page.',
      
      section_prohibited: '3. Prohibited Content & Behavior',
      section_prohibited_text: 'The spontaneous nature of UniMeets requires a safe environment. You are strictly prohibited from posting, distributing, or transmitting content that is harassment, commercial/advertisement spam, sexually explicit, hate speech, or promotes illegal activities. All meetups are limited to 6 hours and must be academic, casual, or social. Violators will face immediate ban and permanent profile termination.',
      
      section_liability: '4. No Liability for In-Person Meetings',
      section_liability_text: 'UniMeets is a digital matchmaking medium that helps students organize spontaneous public interactions. The developers, operators, and hosting entities of UniMeets exert no control over in-person behavior and accept ABSOLUTELY NO LIABILITY OR RESPONSIBILITY for any incidents, disputes, harm, losses, or actions that occur during physical, real-life student meetups. Students are advised to meet exclusively in highly visible, well-lit university campus environments or public cafes, and to prioritize personal safety.',
    },
    el: {
      title: 'Όροι Χρήσης',
      sub: 'Παρακαλούμε διαβάστε τους όρους και τις οδηγίες κοινότητας πριν χρησιμοποιήσετε το UniMeets',
      back: 'Επιστροφή στο Προφίλ',
      
      section_age: '1. Ηλικιακό Όριο (18+)',
      section_age_text: 'Το UniMeets απευθύνεται αυστηρά σε φοιτητές πανεπιστημίων στην Ελλάδα που είναι τουλάχιστον 18 ετών. Δημιουργώντας λογαριασμό και χρησιμοποιώντας την πλατφόρμα, δηλώνετε και εγγυάστε ότι είστε άνω των 18 ετών και εγγεγραμμένος φοιτητής σε Ελληνικό Ανώτατο Εκπαιδευτικό Ίδρυμα (ΑΕΙ/ΤΕΙ).',
      
      section_gdpr: '2. Συμμόρφωση GDPR & Απόρρητο',
      section_gdpr_text: 'Σεβόμαστε τα προσωπικά σας δεδομένα σύμφωνα με τον Γενικό Κανονισμό για την Προστασία Δεδομένων της ΕΕ (GDPR) και τον Ελληνικό Νόμο 4624/2019. Συλλέγουμε και επεξεργαζόμαστε τα δεδομένα του φοιτητικού σας προφίλ (όνομα χρήστη, πανεπιστήμιο, ενδιαφέροντα και κατά προσέγγιση συντεταγμένες geohash) αποκλειστικά για τη σύνδεσή σας με κοντινές φοιτητικές συναντήσεις. Μπορείτε να διαγράψετε μόνιμα το προφίλ σας ανά πάσα στιγμή.',
      
      section_prohibited: '3. Απαγορευμένο Περιεχόμενο & Συμπεριφορά',
      section_prohibited_text: 'Ο αυθόρμητος χαρακτήρας του UniMeets απαιτεί ένα ασφαλές περιβάλλον. Απαγορεύεται αυστηρά η ανάρτηση περιεχομένου που αποτελεί παρενόχληση, διαφήμιση/spam, σεξουαλικά σαφές υλικό, ρητορική μίσους ή προώθηση παράνομων δραστηριοτήτων. Όλες οι συναντήσεις διαρκούν έως 6 ώρες. Οι παραβάτες θα αποκλείονται άμεσα και μόνιμα.',
      
      section_liability: '4. Καμία Ευθύνη για Φυσικές Συναντήσεις',
      section_liability_text: 'Το UniMeets είναι ένα ψηφιακό μέσο που βοηθά στη διοργάνωση αυθόρμητων κοινωνικών επαφών μεταξύ φοιτητών. Οι δημιουργοί και διαχειριστές του UniMeets δεν ελέγχουν τη συμπεριφορά των χρηστών στην πραγματική ζωή και δεν φέρουν ΑΠΟΛΥΤΩΣ ΚΑΜΙΑ ΕΥΘΥΝΗ για οποιοδήποτε περιστατικό, ζημία, απώλεια ή πράξη συμβεί κατά τη διάρκεια φυσικών συναντήσεων. Οι φοιτητές συμβουλεύονται να συναντιούνται αποκλειστικά σε πολυσύχναστους και καλά φωτισμένους χώρους της πανεπιστημιούπολης.',
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

        {/* Content Panel */}
        <div className="bg-slate-950 border border-slate-900 rounded-2.5xl p-5 space-y-6 shadow-xl leading-relaxed">
          
          {/* Age Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <CheckCircle size={15} className="text-purple-500 shrink-0" />
              <span>{tr.section_age}</span>
            </h3>
            <p className="text-xs text-slate-400 pl-7 leading-relaxed">
              {tr.section_age_text}
            </p>
          </div>

          {/* GDPR Section */}
          <div className="border-t border-slate-900/80 pt-5 space-y-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Eye size={15} className="text-purple-500 shrink-0" />
              <span>{tr.section_gdpr}</span>
            </h3>
            <p className="text-xs text-slate-400 pl-7 leading-relaxed">
              {tr.section_gdpr_text}
            </p>
          </div>

          {/* Prohibited Content */}
          <div className="border-t border-slate-900/80 pt-5 space-y-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldAlert size={15} className="text-purple-500 shrink-0" />
              <span>{tr.section_prohibited}</span>
            </h3>
            <p className="text-xs text-slate-400 pl-7 leading-relaxed">
              {tr.section_prohibited_text}
            </p>
          </div>

          {/* Liability waiver Section */}
          <div className="border-t border-slate-900/80 pt-5 space-y-2">
            <h3 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Scale size={15} className="text-purple-500 shrink-0" />
              <span>{tr.section_liability}</span>
            </h3>
            <p className="text-xs text-slate-400 pl-7 leading-relaxed">
              {tr.section_liability_text}
            </p>
          </div>

        </div>
      </div>
    </Layout>
  );
}
