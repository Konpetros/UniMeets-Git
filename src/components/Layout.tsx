import React from 'react';
import { useAuth } from './AuthContext';
import { useTranslation } from '../i18n';
import { LogOut, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children, showHeader = false }: { children: React.ReactNode; showHeader?: boolean }) {
  const { user, logout, toasts, removeToast } = useAuth();
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex justify-center items-stretch font-sans antialiased relative">
      {/* Soft desktop ambient lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none hidden md:block"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none hidden md:block"></div>

      {/* Mobile-first centered frame */}
      <div className="w-full max-w-[480px] bg-slate-950 min-h-screen flex flex-col relative shadow-2xl border-x border-slate-800/80 overflow-x-hidden">
        {showHeader && (
          <header className="sticky top-0 z-40 bg-slate-950/90 backdrop-blur-md border-b border-slate-900 px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center shadow-lg shadow-purple-500/20">
                <span className="text-sm">🎓</span>
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                UniMeets
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Simple language switch button */}
              <button
                id="header-lang-btn"
                onClick={() => setLanguage(language === 'el' ? 'en' : 'el')}
                className="p-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800/60 text-xs flex items-center gap-1 transition-all"
              >
                <Globe size={13} className="text-purple-400" />
                <span>{language === 'el' ? 'EN' : 'ΕΛ'}</span>
              </button>

              {user && (
                <button
                  id="header-signout-btn"
                  onClick={logout}
                  title={t('sign_out')}
                  className="p-1.5 rounded-lg bg-slate-900 hover:bg-red-950/30 hover:border-red-900/40 border border-slate-800/60 text-slate-400 hover:text-red-400 transition-all"
                >
                  <LogOut size={14} />
                </button>
              )}
            </div>
          </header>
        )}

        {/* Content area */}
        <main className="flex-1 flex flex-col overflow-y-auto">
          {children}
        </main>

        {/* Dynamic Interactive Toasts Container */}
        <div className="absolute top-4 left-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                id={`toast-${toast.id}`}
                initial={{ opacity: 0, y: -20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9, y: -10 }}
                className={`p-3.5 rounded-xl border shadow-xl flex items-center justify-between gap-3 pointer-events-auto backdrop-blur-md ${
                  toast.type === 'success'
                    ? 'bg-emerald-950/80 border-emerald-500/30 text-emerald-200'
                    : toast.type === 'error'
                    ? 'bg-red-950/80 border-red-500/30 text-red-200'
                    : 'bg-slate-900/90 border-slate-700/50 text-slate-200'
                }`}
              >
                <span className="text-xs font-medium">{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-xs opacity-60 hover:opacity-100 px-1 py-0.5 rounded bg-black/20 hover:bg-black/40"
                >
                  ✕
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
