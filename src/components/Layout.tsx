import React from 'react';
import { useAuth } from './AuthContext';
import { useTranslation } from '../i18n';
import { LogOut, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function Layout({ children, showHeader = false }: { children: React.ReactNode; showHeader?: boolean }) {
  const { user, logout, toasts, removeToast } = useAuth();
  const { language, setLanguage, t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 flex justify-center items-stretch font-sans antialiased relative">
      {/* Soft desktop ambient lights */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-orange-500/5 rounded-full blur-3xl pointer-events-none hidden md:block"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-orange-400/5 rounded-full blur-3xl pointer-events-none hidden md:block"></div>

      {/* Mobile-first centered frame */}
      <div className="w-full max-w-[480px] bg-gray-50 min-h-screen flex flex-col relative shadow-2xl border-x border-gray-200 overflow-x-hidden">
        {showHeader && (
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-orange-500 to-orange-400 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <span className="text-sm">🎓</span>
              </div>
              <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                UniMeets
              </span>
            </div>

            <div className="flex items-center gap-3">
              {/* Simple language switch button */}
              <button
                id="header-lang-btn"
                onClick={() => setLanguage(language === 'el' ? 'en' : 'el')}
                className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 text-xs flex items-center gap-1 text-gray-700 transition-all font-semibold"
              >
                <Globe size={13} className="text-orange-500" />
                <span>{language === 'el' ? 'EN' : 'ΕΛ'}</span>
              </button>

              {user && (
                <button
                  id="header-signout-btn"
                  onClick={logout}
                  title={t('sign_out')}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 hover:border-red-200 border border-gray-200 text-gray-500 hover:text-red-600 transition-all"
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
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : toast.type === 'error'
                    ? 'bg-red-50 border-red-200 text-red-800'
                    : 'bg-white border-gray-200 text-gray-800'
                }`}
              >
                <span className="text-xs font-semibold">{toast.message}</span>
                <button
                  onClick={() => removeToast(toast.id)}
                  className="text-xs opacity-60 hover:opacity-100 px-1 py-0.5 rounded bg-black/5 hover:bg-black/10"
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
