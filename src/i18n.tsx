import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from './types';

export const UNIVERSITIES = [
  { id: 'ekpa', en: 'National and Kapodistrian University of Athens (NKUA)', el: 'Εθνικό και Καποδιστριακό Πανεπιστήμιο Αθηνών (ΕΚΠΑ)' },
  { id: 'auth', en: 'Aristotle University of Thessaloniki (AUTh)', el: 'Αριστοτέλειο Πανεπιστήμιο Θεσσαλονίκης (ΑΠΘ)' },
  { id: 'ntua', en: 'National Technical University of Athens (NTUA)', el: 'Εθνικό Μετσόβιο Πολυτεχνείο (ΕΜΠ)' },
  { id: 'patras', en: 'University of Patras', el: 'Πανεπιστήμιο Πατρών' },
  { id: 'crete', en: 'University of Crete', el: 'Πανεπιστήμιο Κρήτης' },
  { id: 'aueb', en: 'Athens University of Economics and Business (AUEB)', el: 'Οικονομικό Πανεπιστήμιο Αθηνών (ΟΠΑ)' },
  { id: 'panteion', en: 'Panteion University', el: 'Πάντειο Πανεπιστήμιο' },
  { id: 'piraeus', en: 'University of Piraeus', el: 'Πανεπιστήμιο Πειραιώς' },
  { id: 'duth', en: 'Democritus University of Thrace (DUTH)', el: 'Δημοκρίτειο Πανεπιστήμιο Θράκης (ΔΠΘ)' },
  { id: 'aegean', en: 'University of the Aegean', el: 'Πανεπιστήμιο Αιγαίου' },
  { id: 'tuc', en: 'Technical University of Crete (TUC)', el: 'Πολυτεχνείο Κρήτης' },
  { id: 'harokopio', en: 'Harokopio University', el: 'Χαροκόπειο Πανεπιστήμιο' },
  { id: 'uowm', en: 'University of Western Macedonia', el: 'Πανεπιστήμιο Δυτικής Μακεδονίας' },
  { id: 'ioannina', en: 'University of Ioannina', el: 'Πανεπιστήμιο Ιωαννίνων' },
  { id: 'ionian', en: 'Ionian University', el: 'Ιόνιο Πανεπιστήμιο' },
  { id: 'thessaly', en: 'University of Thessaly', el: 'Πανεπιστήμιο Θεσσαλίας' },
  { id: 'hmu', en: 'Hellenic Mediterranean University', el: 'Ελληνικό Μεσογειακό Πανεπιστήμιο' },
  { id: 'pada', en: 'University of West Attica (UNIWA)', el: 'Πανεπιστήμιο Δυτικής Αττικής (ΠΑΔΑ)' },
  { id: 'ihu', en: 'International Hellenic University', el: 'Διεθνές Πανεπιστήμιο της Ελλάδος' },
];

export const INTEREST_OPTIONS = [
  { id: 'movies', labelEn: 'Movies', labelEl: 'Ταινίες', icon: '🎬' },
  { id: 'coffee', labelEn: 'Coffee', labelEl: 'Καφές', icon: '☕' },
  { id: 'study', labelEn: 'Study', labelEl: 'Διάβασμα', icon: '📚' },
  { id: 'walk', labelEn: 'Walk', labelEl: 'Βόλτα', icon: '🌿' },
  { id: 'party', labelEn: 'Party', labelEl: 'Πάρτι', icon: '🎉' },
  { id: 'gaming', labelEn: 'Gaming', labelEl: 'Gaming', icon: '🎮' },
  { id: 'sports', labelEn: 'Sports', labelEl: 'Αθλητισμός', icon: '⚽' },
  { id: 'music', labelEn: 'Music', labelEl: 'Μουσική', icon: '🎵' },
  { id: 'reading', labelEn: 'Reading', labelEl: 'Διάβασμα βιβλίων', icon: '📖' },
  { id: 'travel', labelEn: 'Travel', labelEl: 'Ταξίδια', icon: '✈️' },
  { id: 'photography', labelEn: 'Photography', labelEl: 'Φωτογραφία', icon: '📷' },
  { id: 'food', labelEn: 'Food', labelEl: 'Φαγητό', icon: '🍕' },
  { id: 'art', labelEn: 'Art', labelEl: 'Τέχνη', icon: '🎨' },
  { id: 'technology', labelEn: 'Technology', labelEl: 'Τεχνολογία', icon: '💻' },
  { id: 'fitness', labelEn: 'Fitness', labelEl: 'Γυμναστήριο', icon: '💪' },
  { id: 'nature', labelEn: 'Nature', labelEl: 'Φύση', icon: '🌲' },
];

export const TRANSLATIONS = {
  en: {
    app_name: 'UniMeets',
    subtitle: 'Find company around you',
    login_title: 'Sign In',
    signup_title: 'Create Account',
    continue_google: 'Continue with Google',
    continue_apple: 'Continue with Apple',
    or: 'or',
    email_label: 'University Email',
    email_placeholder: 'you@university.gr',
    password_label: 'Password',
    confirm_password_label: 'Confirm Password',
    terms_accept: 'I accept the Terms of Service and Privacy Policy',
    age_confirm: 'I confirm that I am 18 years of age or older',
    passwords_match_error: 'Passwords do not match',
    password_length_error: 'Password must be at least 6 characters',
    terms_required_error: 'You must accept the terms and privacy policy',
    age_required_error: 'You must confirm that you are 18+',
    loading: 'Loading...',
    switch_signup: "Don't have an account? Sign Up",
    switch_login: 'Already have an account? Login',
    onboarding_progress: 'Step {current} of {total}',
    onboarding_welcome: 'Welcome to UniMeets!',
    onboarding_welcome_sub: 'The spontaneous student meetup app for Greek university students.',
    feature_1_title: 'Find Company',
    feature_1_desc: 'Connect spontaneous activities like coffee, study, walk, or party.',
    feature_2_title: 'Chat Instantly',
    feature_2_desc: 'Message other verified students nearby within a 6-hour window.',
    feature_3_title: 'Keep it Close',
    feature_3_desc: 'Meet people in your university or neighboring campuses.',
    lets_start: "Let's Start",
    back_to_login: 'Back to login',
    step_username_title: 'Choose a Username',
    step_username_desc: 'Alphanumeric and underscores only (3-20 characters, Latin or Greek letters).',
    checking_username: 'Checking availability...',
    username_available: 'Username is available!',
    username_taken: 'Username is already taken',
    username_invalid: '3-20 characters, letters, numbers, and underscores only',
    step_uni_title: 'Select your University',
    step_uni_desc: 'Please select the Greek university you currently attend.',
    search_uni: 'Search university...',
    step_photo_title: 'Profile Photo',
    step_photo_desc: 'Upload a picture so students can recognize you. (Max 10MB)',
    drag_drop_photo: 'Drag & drop image here, or click to select',
    skip: 'Skip',
    next: 'Next',
    back: 'Back',
    finish: 'Finish',
    step_bio_title: 'Write a short Bio',
    step_bio_desc: 'Tell nearby students a bit about yourself, what you study, or what you like.',
    bio_placeholder: 'Hey! I am studying Computer Science and love grabbing coffee between classes...',
    step_interests_title: 'Choose your Interests',
    step_interests_desc: 'Pick 1 to 5 interests to display on your profile.',
    interests_range_error: 'Please pick between 1 and 5 interests',
    tab_home: 'Home',
    tab_my_meets: 'My Meets',
    tab_profile: 'Profile',
    near_you: 'Near You',
    active_posts: 'available posts',
    search_placeholder: 'Search meets...',
    no_meets: 'No UniMeets nearby right now.',
    no_meets_sub: "Be the first to let people know you're free!",
    location_denied: 'Location Access Denied',
    location_denied_sub: 'UniMeets requires location services to show spontaneous meetups near you within a 6-hour window.',
    re_request_location: 'Enable Location Services',
    become_available_banner: "Let people know you're available!",
    active_meet_banner: 'You have an active UniMeet: {title}',
    create_button: 'Create',
    category_title: 'Category',
    title_section: 'Title',
    prefix_looking_for: 'Looking for someone to',
    title_placeholder: 'grab coffee at Syntagma / study at the library...',
    available_submit: "I'm Available!",
    profanity_warning: 'Please avoid offensive words.',
    view_meetup: 'View Meetup',
    distance_5: 'within 5km',
    distance_10: 'within 10km',
    distance_25: 'within 25km',
    distance_far: 'farther away',
    expires_in: 'expires in {time}',
    join: 'Join',
    joined: 'Joined',
    joined_badge: 'You joined',
    view_participants: 'Participants ({count}/{max})',
    creator_tag: 'Creator',
    cancel_meetup: 'Cancel Meetup',
    leave_meetup: 'Leave Meetup',
    no_active_meets_user: "You haven't posted any active meetups, and haven't joined any yet.",
    sign_out: 'Sign Out',
    save_changes: 'Save Changes',
    profile_updated: 'Profile updated successfully!',
    char_count: '{count} / {max} characters',
  },
  el: {
    app_name: 'UniMeets',
    subtitle: 'Βρες παρέα γύρω σου',
    login_title: 'Σύνδεση',
    signup_title: 'Δημιουργία Λογαριασμού',
    continue_google: 'Συνέχεια με Google',
    continue_apple: 'Συνέχεια με Apple',
    or: 'ή',
    email_label: 'Πανεπιστημιακό Email',
    email_placeholder: 'you@university.gr',
    password_label: 'Κωδικός πρόσβασης',
    confirm_password_label: 'Επιβεβαίωση κωδικού',
    terms_accept: 'Αποδέχομαι τους Όρους Χρήσης και την Πολιτική Απορρήτου',
    age_confirm: 'Επιβεβαιώνω ότι είμαι 18 ετών ή μεγαλύτερος',
    passwords_match_error: 'Οι κωδικοί δεν ταιριάζουν',
    password_length_error: 'Ο κωδικός πρέπει να είναι τουλάχιστον 6 χαρακτήρες',
    terms_required_error: 'Πρέπει να αποδεχτείτε τους όρους χρήσης',
    age_required_error: 'Πρέπει να επιβεβαιώσετε ότι είστε 18+',
    loading: 'Φόρτωση...',
    switch_signup: 'Δεν έχετε λογαριασμό; Εγγραφή',
    switch_login: 'Έχετε ήδη λογαριασμό; Σύνδεση',
    onboarding_progress: 'Βήμα {current} από {total}',
    onboarding_welcome: 'Καλώς ήρθες στο UniMeets!',
    onboarding_welcome_sub: 'Η εφαρμογή για αυθόρμητες συναντήσεις μεταξύ Ελλήνων φοιτητών.',
    feature_1_title: 'Βρες Παρέα',
    feature_1_desc: 'Συνδέσου για αυθόρμητες δραστηριότητες όπως καφέ, διάβασμα, βόλτα ή πάρτι.',
    feature_2_title: 'Άμεση Συνομιλία',
    feature_2_desc: 'Στείλε μήνυμα σε επαληθευμένους φοιτητές κοντά σου με ορίζοντα 6 ωρών.',
    feature_3_title: 'Μείνε Κοντά',
    feature_3_desc: 'Γνώρισε άτομα από το πανεπιστήμιό σου ή από γειτονικές σχολές.',
    lets_start: 'Ας Ξεκινήσουμε',
    back_to_login: 'Επιστροφή στη σύνδεση',
    step_username_title: 'Επίλεξε Όνομα Χρήστη',
    step_username_desc: 'Μόνο αλφαριθμητικά και κάτω παύλες (3-20 χαρακτήρες, λατινικά ή ελληνικά γράμματα).',
    checking_username: 'Έλεγχος διαθεσιμότητας...',
    username_available: 'Το όνομα χρήστη είναι διαθέσιμο!',
    username_taken: 'Το όνομα χρήστη χρησιμοποιείται ήδη',
    username_invalid: '3-20 χαρακτήρες, μόνο γράμματα, αριθμοί και κάτω παύλες',
    step_uni_title: 'Επίλεξε Πανεπιστήμιο',
    step_uni_desc: 'Παρακαλώ επίλεξε το ελληνικό πανεπιστήμιο στο οποίο φοιτάς.',
    search_uni: 'Αναζήτηση πανεπιστημίου...',
    step_photo_title: 'Φωτογραφία Προφίλ',
    step_photo_desc: 'Ανέβασε μια φωτογραφία για να σε αναγνωρίζουν οι συμφοιτητές σου. (Έως 10MB)',
    drag_drop_photo: 'Σύρε & απόθεσε την εικόνα εδώ, ή κάνε κλικ για επιλογή',
    skip: 'Παράλειψη',
    next: 'Επόμενο',
    back: 'Πίσω',
    finish: 'Ολοκλήρωση',
    step_bio_title: 'Γράψε ένα σύντομο Βιογραφικό',
    step_bio_desc: 'Πες στους φοιτητές γύρω σου λίγα λόγια για σένα, τι σπουδάζεις ή τι σου αρέσει.',
    bio_placeholder: 'Γεια! Σπουδάζω Πληροφορική και μου αρέσει να πίνω καφέ ανάμεσα στα μαθήματα...',
    step_interests_title: 'Επίλεξε τα Ενδιαφέροντά σου',
    step_interests_desc: 'Επίλεξε από 1 έως 5 ενδιαφέροντα για να εμφανίζονται στο προφίλ σου.',
    interests_range_error: 'Παρακαλώ επίλεξε από 1 έως 5 ενδιαφέροντα',
    tab_home: 'Αρχική',
    tab_my_meets: 'Συναντήσεις',
    tab_profile: 'Προφίλ',
    near_you: 'Κοντά σου',
    active_posts: 'διαθέσιμες συναντήσεις',
    search_placeholder: 'Αναζήτηση συναντήσεων...',
    no_meets: 'Δεν υπάρχουν UniMeets κοντά σου αυτή τη στιγμή.',
    no_meets_sub: 'Γίνε ο πρώτος που θα ενημερώσει ότι είναι ελεύθερος!',
    location_denied: 'Αποκλεισμός Τοποθεσίας',
    location_denied_sub: 'Το UniMeets απαιτεί πρόσβαση στην τοποθεσία σας για να εμφανίσει αυθόρμητες συναντήσεις κοντά σας εντός 6 ωρών.',
    re_request_location: 'Ενεργοποίηση Τοποθεσίας',
    become_available_banner: 'Είσαι ελεύθερος/η; Ενημέρωσε τους άλλους!',
    active_meet_banner: 'Έχεις ενεργό UniMeet: {title}',
    create_button: 'Δημιουργία',
    category_title: 'Κατηγορία',
    title_section: 'Τίτλος',
    prefix_looking_for: 'Ψάχνω άτομο για',
    title_placeholder: 'να πιούμε καφέ στο Σύνταγμα / να διαβάσουμε στη βιβλιοθήκη...',
    available_submit: 'Είμαι Διαθέσιμος/η!',
    profanity_warning: 'Παρακαλώ αποφύγετε απρεπείς λέξεις.',
    view_meetup: 'Προβολή Συνάντησης',
    distance_5: 'εντός 5χλμ',
    distance_10: 'εντός 10χλμ',
    distance_25: 'εντός 25χλμ',
    distance_far: 'πιο μακριά',
    expires_in: 'λήγει σε {time}',
    join: 'Συμμετοχή',
    joined: 'Συμμετέχεις',
    joined_badge: 'Έχεις δηλώσει συμμετοχή',
    view_participants: 'Συμμετέχοντες ({count}/{max})',
    creator_tag: 'Δημιουργός',
    cancel_meetup: 'Ακύρωση Συνάντησης',
    leave_meetup: 'Αποχώρηση',
    no_active_meets_user: 'Δεν έχεις δημοσιεύσει κάποια συνάντηση, ούτε έχεις δηλώσει συμμετοχή σε κάποια ακόμα.',
    sign_out: 'Αποσύνδεση',
    save_changes: 'Αποθήκευση αλλαγών',
    profile_updated: 'Το προφίλ ενημερώθηκε επιτυχώς!',
    char_count: '{count} / {max} χαρακτήρες',
  },
};

const LanguageContext = createContext<{
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: keyof typeof TRANSLATIONS.en, replace?: Record<string, string | number>) => string;
} | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLangState] = useState<Language>(() => {
    const saved = localStorage.getItem('unimeets_lang');
    if (saved === 'el' || saved === 'en') return saved;
    return 'el'; // Default to Greek as request states Greek university students
  });

  const setLanguage = (lang: Language) => {
    setLangState(lang);
    localStorage.setItem('unimeets_lang', lang);
  };

  const t = (key: keyof typeof TRANSLATIONS.en, replace?: Record<string, string | number>): string => {
    const dict = TRANSLATIONS[language] || TRANSLATIONS.en;
    let text = dict[key] || TRANSLATIONS.en[key] || String(key);
    if (replace) {
      Object.entries(replace).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useTranslation must be used within LanguageProvider');
  return context;
}
