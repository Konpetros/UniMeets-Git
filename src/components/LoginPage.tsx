import React, { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { useTranslation } from '../i18n';
import Layout from './Layout';
import { Eye, EyeOff, Mail, Lock, CheckSquare, Square, ShieldCheck } from 'lucide-react';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

export default function LoginPage() {
  const { user, onboardingCompleted, loginWithGoogle, loginWithApple, showToast, loading: authLoading } = useAuth();
  const { t, language, setLanguage } = useTranslation();
  const navigate = useNavigate();

  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [confirmAge, setConfirmAge] = useState(false);
  const [loading, setLoading] = useState(false);

  // If user is already authenticated and loading is complete, redirect
  if (!authLoading && user) {
    if (onboardingCompleted) {
      return <Navigate to="/" replace />;
    } else {
      return <Navigate to="/onboarding" replace />;
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    // Validations
    if (password.length < 6) {
      showToast(t('password_length_error'), 'error');
      return;
    }

    if (isSignUp) {
      if (password !== confirmPassword) {
        showToast(t('passwords_match_error'), 'error');
        return;
      }
      if (!acceptTerms) {
        showToast(t('terms_required_error'), 'error');
        return;
      }
      if (!confirmAge) {
        showToast(t('age_required_error'), 'error');
        return;
      }
    }

    setLoading(true);
    try {
      if (isSignUp) {
        await createUserWithEmailAndPassword(auth, email, password);
        showToast('Account created successfully!', 'success');
        navigate('/onboarding');
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        showToast('Logged in successfully!', 'success');
        navigate('/');
      }
    } catch (err: any) {
      let msg = err.message || 'Authentication failed';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = language === 'el' ? 'Λανθασμένο email ή κωδικός πρόσβασης' : 'Invalid email or password';
      } else if (err.code === 'auth/email-already-in-use') {
        msg = language === 'el' ? 'Το email χρησιμοποιείται ήδη' : 'Email is already in use';
      }
      showToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="flex-1 flex flex-col justify-center px-6 py-10">
        {/* Language switch at top right of the page */}
        <div className="absolute top-4 right-4 z-10">
          <button
            id="login-lang-toggle"
            onClick={() => setLanguage(language === 'el' ? 'en' : 'el')}
            className="px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-xs font-semibold hover:bg-slate-800 transition"
          >
            {language === 'el' ? '🇬🇧 English' : '🇬🇷 Ελληνικά'}
          </button>
        </div>

        {/* App Logo area */}
        <div className="text-center mb-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-xl shadow-purple-500/20 mb-4 animate-bounce">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
            {t('app_name')}
          </h1>
          <p className="text-sm text-slate-400 mt-1.5">{t('subtitle')}</p>
        </div>

        {/* Social Buttons */}
        <div className="space-y-3 mb-6">
          <button
            id="google-login-btn"
            onClick={loginWithGoogle}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-800 rounded-xl bg-slate-950 hover:bg-slate-900 font-medium text-sm text-slate-200 transition-all shadow-sm"
          >
            {/* Google SVG Icon */}
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22-.03-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{t('continue_google')}</span>
          </button>

          <button
            id="apple-login-btn"
            onClick={loginWithApple}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border border-slate-800 rounded-xl bg-slate-950 hover:bg-slate-900 font-medium text-sm text-slate-200 transition-all shadow-sm"
          >
            {/* Apple SVG Icon */}
            <svg className="w-5 h-5 fill-slate-200" viewBox="0 0 24 24">
              <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.2.67-2.92 1.49-.62.71-1.16 1.85-1.01 2.96 1.1.09 2.23-.58 2.94-1.39z" />
            </svg>
            <span>{t('continue_apple')}</span>
          </button>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-slate-900"></div>
          <span className="text-xs uppercase tracking-wider text-slate-500 font-bold">{t('or')}</span>
          <div className="flex-1 h-px bg-slate-900"></div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide">
              {t('email_label')}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                id="login-email-input"
                type="email"
                required
                placeholder={t('email_placeholder')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide">
              {t('password_label')}
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
              <input
                id="login-password-input"
                type={showPassword ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-950/50 border border-slate-900 rounded-xl py-3 pl-11 pr-11 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
              />
              <button
                id="password-toggle-btn"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {isSignUp && (
            <>
              <div>
                <label className="block text-xs font-semibold text-slate-400 mb-1.5 tracking-wide">
                  {t('confirm_password_label')}
                </label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500 w-4 h-4" />
                  <input
                    id="signup-confirm-password-input"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="w-full bg-slate-950/50 border border-slate-900 rounded-xl py-3 pl-11 pr-4 text-sm text-slate-200 focus:outline-none focus:border-purple-500 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3 pt-1">
                <button
                  id="tos-checkbox-btn"
                  type="button"
                  onClick={() => setAcceptTerms(!acceptTerms)}
                  className="flex items-start gap-3 text-left w-full group"
                >
                  <span className="text-purple-400 mt-0.5 group-hover:text-purple-300 transition">
                    {acceptTerms ? <CheckSquare size={18} /> : <Square size={18} />}
                  </span>
                  <span className="text-xs text-slate-400 group-hover:text-slate-300 transition">
                    {t('terms_accept')}
                  </span>
                </button>

                <button
                  id="age-checkbox-btn"
                  type="button"
                  onClick={() => setConfirmAge(!confirmAge)}
                  className="flex items-start gap-3 text-left w-full group"
                >
                  <span className="text-purple-400 mt-0.5 group-hover:text-purple-300 transition">
                    {confirmAge ? <CheckSquare size={18} /> : <Square size={18} />}
                  </span>
                  <span className="text-xs text-slate-400 group-hover:text-slate-300 transition flex items-center gap-1.5">
                    <ShieldCheck size={14} className="text-slate-500" />
                    {t('age_confirm')}
                  </span>
                </button>
              </div>
            </>
          )}

          <button
            id="auth-submit-btn"
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-blue-500 hover:from-purple-500 hover:to-blue-400 text-white font-bold py-3.5 px-4 rounded-xl shadow-lg shadow-purple-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-4 text-sm disabled:opacity-50"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>{t('loading')}</span>
              </>
            ) : (
              <span>{isSignUp ? t('signup_title') : t('login_title')}</span>
            )}
          </button>
        </form>

        {/* Form toggle */}
        <div className="text-center mt-6">
          <button
            id="auth-mode-toggle-btn"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setPassword('');
              setConfirmPassword('');
            }}
            className="text-xs font-semibold text-purple-400 hover:text-purple-300 transition"
          >
            {isSignUp ? t('switch_login') : t('switch_signup')}
          </button>
        </div>
      </div>
    </Layout>
  );
}
