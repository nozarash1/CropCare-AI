import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageSquare, 
  Send, 
  Image as ImageIcon, 
  User as UserIcon, 
  Clock, 
  Plus, 
  X,
  MessageCircle,
  ChevronRight,
  Trash2,
  LogIn,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { auth, db, handleFirestoreError, OperationType, signInWithGoogle } from '../firebase';
import { 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp, 
  doc, 
  updateDoc, 
  increment,
  getDocs,
  deleteDoc
} from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

interface Post {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: any;
  commentCount: number;
}

interface Comment {
  id: string;
  authorUid: string;
  authorName: string;
  authorPhoto: string;
  content: string;
  createdAt: any;
}

export default function Forum() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newImage, setNewImage] = useState<string | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [newComment, setNewComment] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const postsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Post[];
      setPosts(postsData);
    }, (err) => handleFirestoreError(err, OperationType.LIST, 'posts'));

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (selectedPost) {
      const q = query(
        collection(db, `posts/${selectedPost.id}/comments`), 
        orderBy('createdAt', 'asc')
      );
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const commentsData = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Comment[];
        setComments(commentsData);
      }, (err) => handleFirestoreError(err, OperationType.LIST, 'comments'));

      return () => unsubscribe();
    }
  }, [selectedPost]);

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      try {
        await signInWithGoogle();
      } catch (err) {
        console.error('Sign in failed:', err);
      }
      return;
    }
    if (!newTitle || !newContent) return;

    try {
      await addDoc(collection(db, 'posts'), {
        authorUid: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Anonymous Farmer',
        authorPhoto: auth.currentUser.photoURL || '',
        title: newTitle,
        content: newContent,
        imageUrl: newImage,
        createdAt: new Date().toISOString(),
        commentCount: 0
      });
      setNewTitle('');
      setNewContent('');
      setNewImage(null);
      setIsCreating(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'posts');
    }
  };

  const handleDeletePost = async (postId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser) return;
    setDeletingPostId(postId);
  };

  const confirmDeletePost = async () => {
    if (!deletingPostId) return;
    try {
      await deleteDoc(doc(db, 'posts', deletingPostId));
      if (selectedPost?.id === deletingPostId) {
        setSelectedPost(null);
      }
      setDeletingPostId(null);
    } catch (err) {
      console.error('Delete post failed:', err);
      handleFirestoreError(err, OperationType.DELETE, `posts/${deletingPostId}`);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) {
      try {
        await signInWithGoogle();
      } catch (err) {
        console.error('Sign in failed:', err);
      }
      return;
    }
    if (!newComment || !selectedPost) return;

    try {
      await addDoc(collection(db, `posts/${selectedPost.id}/comments`), {
        postId: selectedPost.id,
        authorUid: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Anonymous Farmer',
        authorPhoto: auth.currentUser.photoURL || '',
        content: newComment,
        createdAt: new Date().toISOString()
      });
      
      // Increment comment count
      await updateDoc(doc(db, 'posts', selectedPost.id), {
        commentCount: increment(1)
      });

      setNewComment('');
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'comments');
    }
  };

  const handleDeleteComment = async (commentId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!auth.currentUser || !selectedPost) return;
    setDeletingCommentId(commentId);
  };

  const confirmDeleteComment = async () => {
    if (!deletingCommentId || !selectedPost) return;
    try {
      await deleteDoc(doc(db, `posts/${selectedPost.id}/comments`, deletingCommentId));
      
      // Decrement comment count
      await updateDoc(doc(db, 'posts', selectedPost.id), {
        commentCount: increment(-1)
      });
      setDeletingCommentId(null);
    } catch (err) {
      console.error('Delete comment failed:', err);
      handleFirestoreError(err, OperationType.DELETE, `comments/${deletingCommentId}`);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setNewImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white">Community Forum</h2>
          <p className="text-gray-500 dark:text-gray-400">Discuss plant diseases and treatments with fellow farmers.</p>
        </div>
        <button 
          onClick={async () => {
            if (!auth.currentUser) {
              try {
                await signInWithGoogle();
              } catch (err) {
                console.error('Sign in failed:', err);
              }
              return;
            }
            setIsCreating(true);
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg shadow-green-200 dark:shadow-none transition-all"
        >
          {auth.currentUser ? <Plus size={20} /> : <LogIn size={20} />}
          {auth.currentUser ? 'Ask Question' : 'Sign In to Post'}
        </button>
      </div>

      {!auth.currentUser && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/30 p-4 rounded-2xl flex items-start gap-4">
          <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center text-blue-600 shrink-0">
            <Info size={20} />
          </div>
          <div>
            <h4 className="font-bold text-blue-900 dark:text-blue-100">Guest Mode</h4>
            <p className="text-sm text-blue-700 dark:text-blue-300">You are currently viewing the forum as a guest. You can read all posts and comments, but you'll need to sign in to join the conversation.</p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {posts.map((post) => (
          <motion.div 
            key={post.id}
            layoutId={post.id}
            onClick={() => setSelectedPost(post)}
            className="bg-white dark:bg-gray-800 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:border-green-500 transition-all group"
          >
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                {post.authorPhoto ? (
                  <img src={post.authorPhoto} alt={post.authorName} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <UserIcon size={24} />
                  </div>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-widest">
                  <span>{post.authorName}</span>
                  <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                  <span className="flex items-center gap-1">
                    <Clock size={12} />
                    {post.createdAt ? formatDistanceToNow(new Date(post.createdAt)) : 'just now'} ago
                  </span>
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-green-600 transition-colors">{post.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 line-clamp-2 text-sm leading-relaxed">{post.content}</p>
                
                <div className="flex items-center gap-4 pt-2">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                    <MessageCircle size={16} className="text-green-600" />
                    {post.commentCount} Comments
                  </div>
                  {post.imageUrl && (
                    <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500">
                      <ImageIcon size={16} className="text-blue-600" />
                      Image attached
                    </div>
                  )}
                  {auth.currentUser?.uid === post.authorUid && (
                    <button 
                      onClick={(e) => handleDeletePost(post.id, e)}
                      className="flex items-center gap-1.5 text-xs font-bold text-red-500 hover:text-red-600 transition-colors ml-auto"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  )}
                </div>
              </div>
              <div className="self-center text-gray-300 group-hover:text-green-600 transition-colors">
                <ChevronRight size={24} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Create Post Modal */}
      <AnimatePresence>
        {isCreating && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCreating(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Ask the Community</h3>
                  <button onClick={() => setIsCreating(false)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>

                <form onSubmit={handleCreatePost} className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Title</label>
                    <input 
                      type="text"
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g., Brown spots on my rubber tree leaves"
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Content</label>
                    <textarea 
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder="Describe the issue in detail..."
                      rows={6}
                      className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all resize-none"
                    />
                  </div>

                  {newImage && (
                    <div className="relative w-32 h-32 rounded-2xl overflow-hidden border-2 border-green-500">
                      <img src={newImage} className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={() => setNewImage(null)}
                        className="absolute top-1 right-1 bg-black/50 text-white p-1 rounded-full"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4">
                    <button 
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-green-600 transition-colors"
                    >
                      <ImageIcon size={20} />
                      Attach Image
                      <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleImageUpload} />
                    </button>
                    <button 
                      type="submit"
                      disabled={!newTitle || !newContent}
                      className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-8 py-3 rounded-2xl font-bold flex items-center gap-2 transition-all"
                    >
                      <Send size={18} />
                      Post Question
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Post Detail Modal */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div 
              layoutId={selectedPost.id}
              className="relative w-full max-w-3xl bg-white dark:bg-gray-800 rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-start mb-6">
                  <div className="flex gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-700 overflow-hidden shrink-0">
                      {selectedPost.authorPhoto ? (
                        <img src={selectedPost.authorPhoto} alt={selectedPost.authorName} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <UserIcon size={24} />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{selectedPost.title}</h3>
                      <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                        {selectedPost.authorName} • {selectedPost.createdAt ? formatDistanceToNow(new Date(selectedPost.createdAt)) : 'just now'} ago
                      </p>
                    </div>
                  </div>
                  <button onClick={() => setSelectedPost(null)} className="text-gray-400 hover:text-gray-600">
                    <X size={24} />
                  </button>
                </div>

                <div className="space-y-6">
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{selectedPost.content}</p>
                  
                  {selectedPost.imageUrl && (
                    <div className="rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 shadow-sm">
                      <img src={selectedPost.imageUrl} className="w-full h-auto" />
                    </div>
                  )}

                  <div className="pt-8 border-t border-gray-100 dark:border-gray-700 space-y-6">
                    <h4 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                      <MessageSquare size={20} className="text-green-600" />
                      Comments ({comments.length})
                    </h4>

                    <div className="space-y-4">
                      {comments.map((comment) => (
                        <div key={comment.id} className="flex gap-3 bg-gray-50 dark:bg-gray-900 p-4 rounded-2xl">
                          <div className="w-8 h-8 rounded-xl bg-gray-200 dark:bg-gray-700 overflow-hidden shrink-0">
                            {comment.authorPhoto ? (
                              <img src={comment.authorPhoto} className="w-full h-full object-cover" />
                            ) : (
                              <UserIcon size={16} className="m-2 text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="text-xs font-bold text-gray-900 dark:text-white">{comment.authorName}</span>
                              <div className="flex items-center gap-2">
                                {auth.currentUser?.uid === comment.authorUid && (
                                  <button 
                                    onClick={(e) => handleDeleteComment(comment.id, e)}
                                    className="text-red-500 hover:text-red-600 transition-colors"
                                  >
                                    <Trash2 size={12} />
                                  </button>
                                )}
                                <span className="text-[10px] text-gray-400 uppercase font-bold">
                                  {comment.createdAt ? formatDistanceToNow(new Date(comment.createdAt)) : 'just now'} ago
                                </span>
                              </div>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400">{comment.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <form onSubmit={handleAddComment} className="flex gap-2 pt-4">
                      <input 
                        type="text"
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={auth.currentUser ? "Write a helpful response..." : "Log in to join the discussion"}
                        disabled={!auth.currentUser}
                        className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl px-4 py-3 focus:outline-none focus:ring-2 focus:ring-green-500 transition-all disabled:opacity-50"
                      />
                      <button 
                        type="submit"
                        disabled={!newComment || !auth.currentUser}
                        className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
                      >
                        <Send size={20} />
                      </button>
                    </form>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Post Confirmation Modal */}
      <AnimatePresence>
        {deletingPostId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingPostId(null)}
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
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Post?</h3>
                <p className="text-gray-500 dark:text-gray-400">This action cannot be undone. Are you sure you want to remove this post and all its comments?</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeletingPostId(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeletePost}
                  className="flex-1 py-3 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold transition-all shadow-lg shadow-red-200 dark:shadow-none"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Comment Confirmation Modal */}
      <AnimatePresence>
        {deletingCommentId && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDeletingCommentId(null)}
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
                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Delete Comment?</h3>
                <p className="text-gray-500 dark:text-gray-400">Are you sure you want to remove this comment?</p>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => setDeletingCommentId(null)}
                  className="flex-1 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDeleteComment}
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
