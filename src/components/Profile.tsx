import React, { useState, useEffect } from 'react';
import { 
  User as UserIcon, 
  History, 
  Settings, 
  LogOut, 
  ChevronRight, 
  Calendar, 
  AlertCircle, 
  CheckCircle2,
  Trash2,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, logout, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { format } from 'date-fns';

interface Analysis {
  id: string;
  crop_name: string;
  disease_detected: string;
  confidence_score: number;
  severity_level: string;
  createdAt: string;
  imageUrl: string;
}

export default function Profile() {
  const [analyses, setAnalyses] = useState<Analysis[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnalysis, setSelectedAnalysis] = useState<Analysis | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    const q = query(
      collection(db, 'analyses'), 
      where('uid', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const data = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Analysis[];
      setAnalyses(data);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'analyses'));

    return () => unsubscribe();
  }, []);

  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeletingId(id);
  };

  const confirmDelete = async () => {
    if (!deletingId) return;
    try {
      await deleteDoc(doc(db, 'analyses', deletingId));
      setDeletingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, 'analyses');
    }
  };

  const filteredAnalyses = analyses.filter(a => 
    a.crop_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    a.disease_detected.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!auth.currentUser) return null;

  return (
    <div className="space-y-8">
      {/* User Header */}
      <div className="bg-white dark:bg-gray-800 rounded-[2.5rem] p-8 shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row items-center gap-8">
        <div className="w-24 h-24 rounded-3xl bg-green-100 dark:bg-green-900/30 overflow-hidden shrink-0 border-4 border-white dark:border-gray-700 shadow-lg">
          {auth.currentUser.photoURL ? (
            <img src={auth.currentUser.photoURL} alt={auth.currentUser.displayName || ''} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-green-600">
              <UserIcon size={48} />
            </div>
          )}
        </div>
        <div className="flex-1 text-center md:text-left space-y-2">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">{auth.currentUser.displayName || 'Farmer'}</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">{auth.currentUser.email}</p>
          <div className="flex flex-wrap justify-center md:justify-start gap-4 pt-2">
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-full">
              <History size={14} className="text-green-600" />
              {analyses.length} Analyses
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-gray-900 px-4 py-2 rounded-full">
              <Calendar size={14} className="text-blue-600" />
              Joined {format(new Date(auth.currentUser.metadata.creationTime || Date.now()), 'MMM yyyy')}
            </div>
          </div>
        </div>
        <button 
          onClick={logout}
          className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
        >
          <LogOut size={20} />
          Sign Out
        </button>
      </div>

      {/* History Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Diagnosis History</h3>
            <p className="text-gray-500 dark:text-gray-400">Review your past plant health checks.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input 
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search history..."
              className="w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl pl-12 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAnalyses.map((analysis) => (
              <motion.div 
                key={analysis.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                onClick={() => setSelectedAnalysis(analysis)}
                className="bg-white dark:bg-gray-800 rounded-3xl p-4 shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4 cursor-pointer hover:border-green-500 transition-all group"
              >
                <div className="w-24 h-24 rounded-2xl overflow-hidden shrink-0">
                  <img src={analysis.imageUrl} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 space-y-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <h4 className="font-bold text-gray-900 dark:text-white truncate">{analysis.crop_name}</h4>
                    <button 
                      onClick={(e) => handleDelete(analysis.id, e)}
                      className="text-gray-300 hover:text-red-500 transition-colors p-1"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <Calendar size={12} />
                    {format(new Date(analysis.createdAt), 'MMM dd, yyyy')}
                  </div>
                  <div className="flex items-center gap-2 pt-1">
                    {analysis.disease_detected === 'Healthy' ? (
                      <CheckCircle2 size={14} className="text-green-600" />
                    ) : (
                      <AlertCircle size={14} className="text-amber-600" />
                    )}
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{analysis.disease_detected}</span>
                  </div>
                </div>
                <div className="self-center text-gray-300 group-hover:text-green-600 transition-colors">
                  <ChevronRight size={20} />
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredAnalyses.length === 0 && (
          <div className="text-center py-20 bg-gray-50 dark:bg-gray-900/50 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center text-gray-400 mx-auto mb-4">
              <History size={32} />
            </div>
            <p className="text-gray-500 dark:text-gray-400 font-medium">No history found.</p>
          </div>
        )}
      </div>

      {/* Analysis Detail Modal */}
      <AnimatePresence>
        {selectedAnalysis && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedAnalysis(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto custom-scrollbar"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Analysis Details</h3>
                  <button onClick={() => setSelectedAnalysis(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>
                <div className="rounded-3xl overflow-hidden aspect-video">
                  <img src={selectedAnalysis.imageUrl} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="text-3xl font-bold text-gray-900 dark:text-white">{selectedAnalysis.crop_name}</h4>
                      <p className="text-sm font-bold text-gray-400 uppercase tracking-widest mt-1">
                        Diagnosed on {format(new Date(selectedAnalysis.createdAt), 'MMMM dd, yyyy HH:mm')}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Confidence</span>
                      <p className="text-2xl font-mono font-bold text-gray-900 dark:text-white">{selectedAnalysis.confidence_score}%</p>
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-900 rounded-2xl flex items-center gap-3">
                    {selectedAnalysis.disease_detected === 'Healthy' ? (
                      <CheckCircle2 className="text-green-600" size={24} />
                    ) : (
                      <AlertCircle className="text-amber-600" size={24} />
                    )}
                    <span className="font-bold text-gray-900 dark:text-white">{selectedAnalysis.disease_detected}</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deletingId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingId(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-[2rem] shadow-2xl p-8 text-center space-y-6"
            >
              <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600 mx-auto">
                <Trash2 size={32} />
              </div>
              <div className="space-y-2">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Analysis?</h3>
                <p className="text-gray-500 dark:text-gray-400">This action cannot be undone. Are you sure you want to remove this diagnosis from your history?</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeletingId(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-200 dark:shadow-none"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function X({ size, className }: { size?: number, className?: string }) {
  return (
    <svg 
      xmlns="http://www.w3.org/2000/svg" 
      width={size || 24} 
      height={size || 24} 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
    </svg>
  );
}
