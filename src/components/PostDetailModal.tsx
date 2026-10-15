import React, { useState, useEffect } from 'react';
import {
  X,
  MapPin,
  MessageSquare,
  Send,
  ShieldCheck,
  Flag,
  Trash2,
  Share2,
  Mail,
  User,
  Sparkles,
} from 'lucide-react';
import { store } from '../lib/store';
import { Post, PostComment, UserProfile } from '../types';
import { formatDistanceSafe } from '../lib/geo';

interface PostDetailModalProps {
  post: Post | null;
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onStartChat: (targetUserId: string) => void;
  onReport: (type: 'post', id: string, title: string) => void;
  onRequireAuth: () => void;
}

export const PostDetailModal: React.FC<PostDetailModalProps> = ({
  post,
  isOpen,
  onClose,
  currentUser,
  onStartChat,
  onReport,
  onRequireAuth,
}) => {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [commentText, setCommentText] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (post) {
      setComments(store.getComments(post.id));
    }
  }, [post]);

  if (!isOpen || !post) return null;

  const isOwner = currentUser?.id === post.userId;
  const canDelete = isOwner || currentUser?.isAdmin;
  const distanceStr = formatDistanceSafe(
    currentUser?.latitude,
    currentUser?.longitude,
    post.latitude,
    post.longitude
  );

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!commentText.trim()) return;

    store.addComment(post.id, commentText.trim());
    setCommentText('');
    setComments(store.getComments(post.id));
  };

  const handleDeletePost = () => {
    if (confirm('Czy na pewno chcesz usunąć to ogłoszenie?')) {
      store.deletePost(post.id);
      onClose();
    }
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: post.title,
        text: `${post.title} — na Starych Stawach`,
        url: window.location.href,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
              {post.category}
            </span>
            {post.isFree || post.price === 0 || post.category === 'oddam' ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                🎁 Za darmo (0 zł)
              </span>
            ) : post.price !== undefined && post.price > 0 ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                🏷️ Cena: {post.price} zł
              </span>
            ) : null}
            {post.condition && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                Stan: {post.condition === 'new' ? 'Nowy' : 'Używany'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleShare}
              title="Udostępnij"
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition"
            >
              <Share2 className="w-4 h-4" />
            </button>
            {canDelete && (
              <button
                onClick={handleDeletePost}
                title="Usuń ogłoszenie"
                className="p-1.5 rounded-full text-red-400 hover:text-red-600 hover:bg-red-50 transition"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {/* Author info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <img
                src={post.author.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt={post.author.displayName}
                className="w-10 h-10 rounded-full object-cover border border-slate-200"
              />
              <div>
                <div className="flex items-center gap-1">
                  <p className="font-semibold text-xs sm:text-sm text-slate-900">
                    {post.author.displayName}
                  </p>
                  {post.author.isVerified && (
                    <span title="Zweryfikowany sąsiad">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[11px] text-slate-400">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  <span>{post.approxLocation}</span>
                  {distanceStr && <span>• <strong className="text-emerald-700 font-semibold">{distanceStr}</strong></span>}
                </div>
              </div>
            </div>

            {/* Direct Message button */}
            {!isOwner && (
              <button
                onClick={() => {
                  if (!currentUser) {
                    onRequireAuth();
                    return;
                  }
                  onStartChat(post.userId);
                  onClose();
                }}
                className="flex items-center gap-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 shadow-2xs"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Napisz</span>
              </button>
            )}
          </div>

          {/* Post Title & Text */}
          <div>
            <h1 className="text-base sm:text-lg font-bold text-slate-900 leading-snug">
              {post.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-700 mt-2 whitespace-pre-line leading-relaxed">
              {post.content}
            </p>
          </div>

          {/* Optional Post Image */}
          {post.imageUrl && (
            <div className="rounded-2xl overflow-hidden border border-slate-200 bg-slate-100 max-h-80">
              <img
                src={post.imageUrl}
                alt={post.title}
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {/* Action bar (Report / Date) */}
          <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-slate-100">
            <span>Dodano: {new Date(post.createdAt).toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
            <button
              onClick={() => onReport('post', post.id, post.title)}
              className="flex items-center gap-1 hover:text-red-600 transition"
            >
              <Flag className="w-3 h-3" />
              <span>Zgłoś naruszenie</span>
            </button>
          </div>

          {/* Comments Section */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5" />
              Odpowiedzi sąsiadów ({comments.length})
            </h3>

            {comments.length === 0 ? (
              <div className="py-4 text-center rounded-xl bg-slate-50 border border-dashed border-slate-200">
                <p className="text-xs text-slate-500">Na razie nikt jeszcze nie odpowiedział.</p>
                <p className="text-[11px] text-emerald-700 font-medium">Bądź pierwszym sąsiadem, który napisze!</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {comments.map((comm) => (
                  <div key={comm.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{comm.author.displayName}</span>
                        {comm.author.isVerified && (
                          <ShieldCheck className="w-3 h-3 text-emerald-600" />
                        )}
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {new Date(comm.createdAt).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 whitespace-pre-line">{comm.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Comment input form */}
        <form onSubmit={handleAddComment} className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0">
          <input
            type="text"
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={currentUser ? 'Napisz publiczną odpowiedź...' : 'Zaloguj się, aby odpowiedzieć...'}
            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
          <button
            type="submit"
            disabled={!commentText.trim()}
            className="p-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl transition active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
