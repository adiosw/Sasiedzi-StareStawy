import React, { useState } from 'react';
import {
  Users,
  Star,
  Phone,
  Globe,
  ShieldCheck,
  Plus,
  MessageSquare,
  Search,
  CheckCircle,
  Sparkles,
  Send,
  X,
} from 'lucide-react';
import { Professional, ProfessionalReview, UserProfile, ProCategory } from '../types';
import { store } from '../lib/store';

interface ProsTabProps {
  pros: Professional[];
  currentUser: UserProfile | null;
  onStartChat: (userId: string) => void;
  onRequireAuth: () => void;
}

export const ProsTab: React.FC<ProsTabProps> = ({
  pros,
  currentUser,
  onStartChat,
  onRequireAuth,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProForReviews, setSelectedProForReviews] = useState<Professional | null>(null);
  const [reviewsList, setReviewsList] = useState<ProfessionalReview[]>([]);
  const [showAddProModal, setShowAddProModal] = useState(false);

  // New review form
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  // New pro form
  const [proName, setProName] = useState('');
  const [proDesc, setProDesc] = useState('');
  const [proCat, setProCat] = useState<ProCategory>('hydraulik');
  const [proArea, setProArea] = useState('Stare Stawy i Oświęcim');
  const [proPhone, setProPhone] = useState('');
  const [proWebsite, setProWebsite] = useState('');

  const categories = [
    { id: 'all', label: 'Wszyscy fachowcy' },
    { id: 'hydraulik', label: '🚰 Hydraulik' },
    { id: 'elektryk', label: '⚡ Elektryk' },
    { id: 'zlota_raczka', label: '🛠️ Złota rączka' },
    { id: 'ogrodnictwo', label: '🌿 Ogrodnictwo' },
    { id: 'agd', label: '🧺 Naprawa AGD' },
    { id: 'mechanik', label: '🚗 Mechanik' },
    { id: 'korepetycje', label: '📚 Korepetycje' },
    { id: 'opieka', label: '🐾 Opieka / zwierzaki' },
  ];

  const filteredPros = pros.filter((pro) => {
    if (selectedCategory !== 'all' && pro.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchName = pro.name.toLowerCase().includes(q);
      const matchDesc = pro.description.toLowerCase().includes(q);
      if (!matchName && !matchDesc) return false;
    }
    return true;
  });

  const handleOpenReviews = (pro: Professional) => {
    setSelectedProForReviews(pro);
    setReviewsList(store.getReviews(pro.id));
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!selectedProForReviews || !newComment.trim()) return;

    store.addReview(selectedProForReviews.id, newRating, newComment.trim());
    setReviewsList(store.getReviews(selectedProForReviews.id));
    setNewComment('');
  };

  const handleCreatePro = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) {
      onRequireAuth();
      return;
    }
    if (!proName.trim() || !proDesc.trim()) return;

    store.createProfessional({
      name: proName.trim(),
      description: proDesc.trim(),
      category: proCat,
      serviceArea: proArea.trim(),
      phone: proPhone.trim() || undefined,
      website: proWebsite.trim() || undefined,
    });

    setShowAddProModal(false);
    setProName('');
    setProDesc('');
    setProPhone('');
    setProWebsite('');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Card */}
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Lokalni Fachowcy
              </h2>
              <p className="text-xs text-slate-500">
                Sprawdzone usługi na Starych Stawach i w Oświęcimiu z opiniami mieszkańców
              </p>
            </div>
          </div>
          <button
            onClick={() => {
              if (!currentUser) {
                onRequireAuth();
                return;
              }
              setShowAddProModal(true);
            }}
            className="flex items-center gap-1.5 bg-teal-600 hover:bg-teal-700 text-white px-3.5 py-2 rounded-xl text-xs font-bold shadow-md shadow-teal-600/20 transition active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Dodaj fachowca</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Szukaj hydraulika, elektryka, mechanika..."
            className="w-full pl-9.5 pr-4 py-2 text-xs sm:text-sm rounded-2xl border border-slate-200 bg-slate-50/70 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/50 transition"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition active:scale-95 ${
                  isSelected
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200/80'
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Pros List */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        {filteredPros.map((pro) => (
          <div
            key={pro.id}
            className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 hover:border-teal-300 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-3"
          >
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm sm:text-base text-slate-900">{pro.name}</h3>
                    {pro.isVerified && (
                      <span className="flex items-center gap-0.5 text-[10px] text-teal-800 bg-teal-50 px-1.5 py-0.5 rounded font-bold">
                        <ShieldCheck className="w-3.5 h-3.5 text-teal-600" />
                        Zweryfikowany
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 font-medium">{pro.serviceArea}</p>
                </div>

                {/* Rating badge */}
                <button
                  onClick={() => handleOpenReviews(pro)}
                  className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-2 py-1 rounded-xl text-xs font-bold hover:bg-amber-100 transition"
                  title="Zobacz opinie sąsiadów"
                >
                  <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                  <span>{pro.rating.toFixed(1)}</span>
                  <span className="text-[10px] text-amber-700">({pro.reviewsCount})</span>
                </button>
              </div>

              <p className="text-xs text-slate-600 line-clamp-3 leading-relaxed">
                {pro.description}
              </p>
            </div>

            {/* Contacts & actions */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {pro.phone && (
                  <a
                    href={`tel:${pro.phone}`}
                    className="flex items-center gap-1 text-xs font-semibold text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-xl transition"
                  >
                    <Phone className="w-3.5 h-3.5" />
                    <span>Zadzwoń</span>
                  </a>
                )}
                {pro.website && (
                  <a
                    href={pro.website}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
              </div>

              <button
                onClick={() => handleOpenReviews(pro)}
                className="text-xs text-slate-600 hover:text-teal-700 font-medium flex items-center gap-1 underline underline-offset-2"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Opinie ({pro.reviewsCount})</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Reviews Modal */}
      {selectedProForReviews && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[90vh] flex flex-col">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between shrink-0">
              <div>
                <h3 className="font-bold text-base">{selectedProForReviews.name}</h3>
                <p className="text-xs text-slate-300">Opinie mieszkańców osiedla Stare Stawy</p>
              </div>
              <button
                onClick={() => setSelectedProForReviews(null)}
                className="p-1 rounded-full text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              {/* Form to add review */}
              <form onSubmit={handleAddReview} className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2.5">
                <p className="text-xs font-bold text-slate-800">
                  {currentUser ? 'Wystaw opinię sąsiadowi:' : 'Zaloguj się, aby dodać opinię'}
                </p>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setNewRating(star)}
                      className="p-1 hover:scale-110 transition"
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= newRating ? 'fill-amber-400 text-amber-500' : 'text-slate-300'
                        }`}
                      />
                    </button>
                  ))}
                  <span className="text-xs font-bold text-slate-700 ml-2">{newRating} / 5</span>
                </div>
                <textarea
                  rows={2}
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Krótko opisz wykonaną usługę (terminowość, jakość, kultura)..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-teal-500 bg-white"
                />
                <button
                  type="submit"
                  disabled={!currentUser || !newComment.trim()}
                  className="w-full py-2 bg-teal-600 hover:bg-teal-700 disabled:opacity-40 text-white rounded-xl text-xs font-semibold transition"
                >
                  Dodaj opinię
                </button>
              </form>

              {/* Reviews List */}
              <div className="space-y-2.5">
                {reviewsList.length === 0 ? (
                  <p className="text-center text-xs text-slate-400 py-4">
                    Brak opinii. Bądź pierwszym sąsiadem, który oceni tę usługę!
                  </p>
                ) : (
                  reviewsList.map((rev) => (
                    <div key={rev.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-semibold text-slate-900">{rev.authorName}</span>
                        <div className="flex items-center text-amber-500">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 fill-amber-400" />
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-slate-600">{rev.comment}</p>
                      <span className="text-[10px] text-slate-400 block pt-1">
                        {new Date(rev.createdAt).toLocaleDateString('pl-PL')}
                      </span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Pro Modal */}
      {showAddProModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <h3 className="font-bold text-base">Dodaj profil fachowca</h3>
              <button onClick={() => setShowAddProModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleCreatePro} className="p-5 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Nazwa / Imię i nazwisko *</label>
                <input
                  type="text"
                  required
                  value={proName}
                  onChange={(e) => setProName(e.target.value)}
                  placeholder="np. Marek — Hydraulika & Ogrzewanie"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Branża / Kategoria</label>
                <select
                  value={proCat}
                  onChange={(e) => setProCat(e.target.value as ProCategory)}
                  className="w-full px-2.5 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  <option value="hydraulik">Hydraulik</option>
                  <option value="elektryk">Elektryk</option>
                  <option value="zlota_raczka">Złota rączka</option>
                  <option value="ogrodnictwo">Ogrodnictwo</option>
                  <option value="agd">Naprawa AGD</option>
                  <option value="mechanik">Mechanik</option>
                  <option value="korepetycje">Korepetycje</option>
                  <option value="opieka">Opieka</option>
                  <option value="inne">Inne</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Obszar działania</label>
                <input
                  type="text"
                  value={proArea}
                  onChange={(e) => setProArea(e.target.value)}
                  placeholder="np. Stare Stawy, Zasole, Oświęcim"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Telefon kontaktowy</label>
                <input
                  type="tel"
                  value={proPhone}
                  onChange={(e) => setProPhone(e.target.value)}
                  placeholder="+48 600 000 000"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Opis usług i doświadczenie *</label>
                <textarea
                  rows={3}
                  required
                  value={proDesc}
                  onChange={(e) => setProDesc(e.target.value)}
                  placeholder="Czym się zajmujesz, jakie posiadasz uprawnienia..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProModal(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-xs font-semibold shadow-sm"
                >
                  Zapisz i opublikuj
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
