/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Leaf, 
  MessageSquare, 
  User as UserIcon, 
  Sun, 
  Moon, 
  Scan, 
  LogIn,
  ChevronRight,
  ShieldCheck,
  Sprout
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, signInWithGoogle, onAuthStateChanged, testConnection } from './firebase';
import Analyze from './components/Analyze';
import Forum from './components/Forum';
import Profile from './components/Profile';

type Tab = 'analyze' | 'forum' | 'profile';

export default function App() {
  const [activeTab, setActiveTab] = useState<Tab>('analyze');
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });
  const [user, setUser] = useState(auth.currentUser);
  const [isAuthReady, setIsAuthReady] = useState(false);

  useEffect(() => {
    testConnection();
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setIsAuthReady(true);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
      document.documentElement.setAttribute('data-theme', 'dark');
      document.body.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      document.documentElement.setAttribute('data-theme', 'light');
      document.body.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);

  if (!isAuthReady) {
    return (
      <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} flex items-center justify-center bg-green-50 dark:bg-gray-900`}>
        <motion.div 
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-green-600"
        >
          <Leaf size={64} />
        </motion.div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDarkMode ? 'dark' : ''} bg-[#F8F9FA] dark:bg-[#0A0C0E] text-[#1A1C1E] dark:text-[#E1E3E6] font-sans selection:bg-green-100 dark:selection:bg-green-900/40`}>
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 bg-green-600 rounded-xl flex items-center justify-center text-white shadow-lg shadow-green-200 dark:shadow-none">
            <Leaf size={24} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-gray-900 dark:text-white leading-none">CropCare AI</h1>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 font-medium uppercase tracking-wider">Precision Crop Diagnostics</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <motion.button 
            whileTap={{ scale: 0.9 }}
            whileHover={{ scale: 1.05 }}
            onClick={toggleTheme}
            className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all shadow-sm overflow-hidden"
            aria-label="Toggle Theme"
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={isDarkMode ? 'dark' : 'light'}
                initial={{ y: 20, opacity: 0, rotate: -90 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: -20, opacity: 0, rotate: 90 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
              >
                {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
              </motion.div>
            </AnimatePresence>
          </motion.button>
          
          {!user && (
            <button 
              onClick={signInWithGoogle}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 text-sm transition-all shadow-lg shadow-green-200 dark:shadow-none"
            >
              <LogIn size={18} />
              Sign In
            </button>
          )}
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8 pb-32">
        {!user && activeTab === 'profile' ? (
          <div className="text-center py-20 space-y-8">
            <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-[2.5rem] flex items-center justify-center text-green-600 mx-auto">
              <ShieldCheck size={48} />
            </div>
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Sign in to continue</h2>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">Join our community of farmers to save your history and discuss plant health in the forum.</p>
            </div>
            <button 
              onClick={signInWithGoogle}
              className="bg-green-600 hover:bg-green-700 text-white px-10 py-4 rounded-2xl font-bold flex items-center gap-3 mx-auto shadow-xl shadow-green-200 dark:shadow-none transition-all"
            >
              <LogIn size={20} />
              Sign in with Google
            </button>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === 'analyze' && <Analyze />}
              {activeTab === 'forum' && <Forum />}
              {activeTab === 'profile' && <Profile />}
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[60]">
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-gray-200 dark:border-gray-800 rounded-3xl p-2 flex items-center gap-2 shadow-2xl">
          <button 
            onClick={() => setActiveTab('analyze')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'analyze' 
                ? 'bg-green-600 text-white shadow-lg shadow-green-200 dark:shadow-none' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <Scan size={20} />
            <span className="hidden sm:inline">Analyze</span>
          </button>
          <button 
            onClick={() => setActiveTab('forum')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'forum' 
                ? 'bg-green-600 text-white shadow-lg shadow-green-200 dark:shadow-none' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <MessageSquare size={20} />
            <span className="hidden sm:inline">Forum</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-bold transition-all ${
              activeTab === 'profile' 
                ? 'bg-green-600 text-white shadow-lg shadow-green-200 dark:shadow-none' 
                : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
            }`}
          >
            <UserIcon size={20} />
            <span className="hidden sm:inline">Profile</span>
          </button>
        </div>
      </nav>

      {/* Background Accents */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none opacity-20 dark:opacity-10">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-green-300 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-300 rounded-full blur-[120px]" />
      </div>
    </div>
  );
}

