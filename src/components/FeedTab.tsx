import React, { useState } from 'react';
import {
  Search,
  Plus,
  MapPin,
  MessageSquare,
  Gift,
  Tag,
  Wrench,
  HelpCircle,
  AlertTriangle,
  Filter,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Post, UserProfile, PostCategory } from '../types';
import { formatDistanceSafe } from '../lib/geo';

interface FeedTabProps {
  posts: Post[];
  currentUser: UserProfile | null;
  onOpenPost: (post: Post) => void;
  onOpenCreate: () => void;
}

export const FeedTab: React.FC<FeedTabProps> = ({
  posts,
  currentUser,
  onOpenPost,
  onOpenCreate,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [distanceRadius, setDistanceRadius] = useState<number | null>(null);

  // Category pills matching prompt specification
  const categories = [
    { id: 'all', label: '📢 Wszystko' },
    { id: 'pomoc', label: '🤝 Pomoc' },
    { id: 'pozycze', label: '🔧 Pożycz' },
    { id: 'oddam', label: '🎁 Oddam' },
    { id: 'sprzedam', label: '🏷️ Sprzedam' },
    { id: 'kupie', label: '🛒 Kupię' },
    { id: 'zguba', label: '🔑 Zguba' },
    { id: 'pytanie', label: '❓ Pytanie' },
    { id: 'informacja', label: 'ℹ️ Informacja' },
  ];

  const filteredPosts = posts.filter((post) => {
    if (selectedCategory !== 'all' && post.category !== selectedCategory) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchContent = post.content.toLowerCase().includes(q);
      const matchAuthor = post.author.displayName.toLowerCase().includes(q);
      if (!matchTitle && !matchContent && !matchAuthor) return false;
    }
    return true;
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Hero Welcome & Search section */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Co dzieje się teraz na Starych Stawach?
            </h2>
            <p className="text-xs text-slate-500">
              Lokalne ogłoszenia i sprawy sąsiadów w Twojej okolicy
            </p>
          </div>
          <button
            onClick={onOpenCreate}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-emerald-600/20 transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Dodaj</span>
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Czego szukasz na osiedlu? (np. wiertarka, szafa, kot...)"
            className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 transition"
          />
        </div>

        {/* Category Pills horizontal scroll */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                  isSelected
                    ? 'bg-emerald-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Feed Feed Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Najnowsze ogłoszenia ({filteredPosts.length})
        </h3>
        {selectedCategory !== 'all' && (
          <button
            onClick={() => setSelectedCategory('all')}
            className="text-[11px] text-emerald-700 font-semibold hover:underline"
          >
            Pokaż wszystkie
          </button>
        )}
      </div>

      {/* Posts List or Empty State */}
      {filteredPosts.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
            👀
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-800">
              Na razie jest tu spokojnie 👀
            </h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Bądź pierwszą osobą, która coś doda i powiadomi sąsiadów.
            </p>
          </div>
          <button
            onClick={onOpenCreate}
            className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2.5 rounded-xl text-xs font-semibold transition active:scale-95 shadow-sm"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Dodaj pierwsze ogłoszenie</span>
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const distanceStr = formatDistanceSafe(
              currentUser?.latitude,
              currentUser?.longitude,
              post.latitude,
              post.longitude
            );

            return (
              <article
                key={post.id}
                onClick={() => onOpenPost(post)}
                className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 hover:border-emerald-300 shadow-xs hover:shadow-md transition cursor-pointer space-y-3 active:scale-[0.99]"
              >
                {/* Top author row */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <img
                      src={post.author.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                      alt={post.author.displayName}
                      className="w-9 h-9 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <div className="flex items-center gap-1">
                        <span className="font-semibold text-xs sm:text-sm text-slate-900">
                          {post.author.displayName}
                        </span>
                        {post.author.isVerified && (
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        )}
                      </div>
                      <div className="flex items-center gap-1 text-[11px] text-slate-400">
                        <MapPin className="w-3 h-3 text-slate-400" />
                        <span>{post.approxLocation}</span>
                        {distanceStr && (
                          <span>
                            • <strong className="text-emerald-700 font-semibold">{distanceStr}</strong>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {post.isFree || post.price === 0 || post.category === 'oddam' ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-100 text-emerald-800 border border-emerald-200">
                        🎁 Za darmo
                      </span>
                    ) : post.price !== undefined && post.price > 0 ? (
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-blue-100 text-blue-800 border border-blue-200">
                        🏷️ {post.price} zł
                      </span>
                    ) : null}
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 text-slate-700">
                      {post.category}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div>
                  <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                    {post.title}
                  </h4>
                  <p className="text-xs sm:text-sm text-slate-600 mt-1 line-clamp-2 leading-relaxed">
                    {post.content}
                  </p>
                </div>

                {/* Photo preview if present */}
                {post.imageUrl && (
                  <div className="rounded-2xl overflow-hidden max-h-56 bg-slate-100 border border-slate-100">
                    <img
                      src={post.imageUrl}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                )}

                {/* Bottom stats row */}
                <div className="flex items-center justify-between text-xs text-slate-400 pt-1 border-t border-slate-100">
                  <span className="text-[11px]">
                    {new Date(post.createdAt).toLocaleDateString('pl-PL', {
                      day: 'numeric',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                  <div className="flex items-center gap-1 text-emerald-800 font-medium text-[11px] bg-emerald-50 px-2 py-0.5 rounded-lg">
                    <MessageSquare className="w-3.5 h-3.5" />
                    <span>{post.repliesCount || 0} odpowiedzi</span>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
};
