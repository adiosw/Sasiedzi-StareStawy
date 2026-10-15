import React, { useState } from 'react';
import {
  X,
  User,
  MapPin,
  ShieldCheck,
  Edit2,
  Trash2,
  LogOut,
  Sparkles,
  Camera,
  Check,
  Mail,
  Shield,
} from 'lucide-react';
import { store } from '../lib/store';
import { UserProfile, Post } from '../types';
import { NEIGHBORHOOD_SECTORS } from '../lib/geo';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile | null;
  onOpenLocationPicker: () => void;
  onRequireAuth: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onOpenLocationPicker,
  onRequireAuth,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [displayName, setDisplayName] = useState(currentUser?.displayName || '');
  const [bio, setBio] = useState(currentUser?.bio || '');
  const [approxLocation, setApproxLocation] = useState(
    currentUser?.approxLocation || 'Stare Stawy'
  );

  if (!isOpen) return null;

  if (!currentUser) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
        <div className="w-full max-w-sm bg-white rounded-3xl p-6 text-center shadow-2xl">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <User className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900 mb-1">Twój profil sąsiedzki</h3>
          <p className="text-xs text-slate-500 mb-5">
            Zaloguj się, aby zarządzać swoim profilem i ogłoszeniami.
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
            >
              Zamknij
            </button>
            <button
              onClick={() => {
                onClose();
                onRequireAuth();
              }}
              className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-sm"
            >
              Zaloguj się
            </button>
          </div>
        </div>
      </div>
    );
  }

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    store.updateProfile({
      displayName: displayName.trim(),
      bio: bio.trim(),
      approxLocation: approxLocation.trim(),
    });
    setIsEditing(false);
  };

  const handleDeleteAccount = () => {
    if (
      confirm(
        'Czy na pewno chcesz usunąć swoje konto oraz wszystkie dodane ogłoszenia i wiadomości? Ta operacja jest nieodwracalna.'
      )
    ) {
      store.deleteAccount(currentUser.id);
      onClose();
    }
  };

  const userPosts = store.getPosts().filter((p) => p.userId === currentUser.id);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-4 max-h-[92vh] flex flex-col">
        {/* Top cover banner */}
        <div className="h-28 bg-gradient-to-r from-emerald-700 to-teal-800 p-4 relative flex items-start justify-between text-white shrink-0">
          <span className="text-xs font-semibold tracking-wider uppercase opacity-80">
            Osiedle Stare Stawy • Oświęcim
          </span>
          <button
            onClick={onClose}
            className="p-1 rounded-full bg-black/20 hover:bg-black/40 text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Profile info section */}
        <div className="px-6 pb-6 pt-0 relative overflow-y-auto flex-1 space-y-4">
          <div className="flex items-end justify-between -mt-12 mb-2">
            <div className="relative">
              <img
                src={currentUser.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt={currentUser.displayName}
                className="w-22 h-22 rounded-2xl object-cover border-4 border-white shadow-md bg-white"
              />
              {currentUser.isVerified && (
                <div
                  title="Zweryfikowany mieszkaniec"
                  className="absolute -bottom-1 -right-1 bg-emerald-600 text-white p-1 rounded-lg shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                </div>
              )}
            </div>

            {!isEditing && (
              <button
                onClick={() => {
                  setDisplayName(currentUser.displayName);
                  setBio(currentUser.bio || '');
                  setApproxLocation(currentUser.approxLocation);
                  setIsEditing(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-300 hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edytuj profil</span>
              </button>
            )}
          </div>

          {isEditing ? (
            <form onSubmit={handleSaveProfile} className="space-y-3 pt-2">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Imię lub pseudonim
                </label>
                <input
                  type="text"
                  required
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Rejon osiedla (przybliżona lokalizacja)
                </label>
                <select
                  value={approxLocation}
                  onChange={(e) => setApproxLocation(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white"
                >
                  {NEIGHBORHOOD_SECTORS.map((sec) => (
                    <option key={sec.id} value={sec.name}>
                      {sec.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  O sobie
                </label>
                <textarea
                  rows={2}
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-xs font-semibold"
                >
                  Anuluj
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-sm"
                >
                  Zapisz zmiany
                </button>
              </div>
            </form>
          ) : (
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1.5">
                  <h2 className="text-lg font-bold text-slate-900">{currentUser.displayName}</h2>
                  {currentUser.isVerified ? (
                    <span className="flex items-center gap-0.5 text-[10px] text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full font-semibold border border-emerald-200">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      Zweryfikowany sąsiad
                    </span>
                  ) : (
                    <span className="flex items-center gap-0.5 text-[10px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full font-medium">
                      Konto niezweryfikowane
                    </span>
                  )}
                  {currentUser.isAdmin && (
                    <span className="text-[10px] text-amber-900 bg-amber-100 px-2 py-0.5 rounded-full font-bold">
                      Administrator
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 mt-0.5">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{currentUser.approxLocation}</span>
                </div>
              </div>

              {currentUser.email && (
                <div className="flex items-center gap-1.5 text-xs text-slate-700 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
                  <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-mono text-[11px] truncate">{currentUser.email}</span>
                  <span className="text-[10px] text-slate-400 ml-auto shrink-0 hidden sm:inline">(poufne)</span>
                </div>
              )}

              {!currentUser.isVerified && (
                <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 space-y-1">
                  <p className="font-bold flex items-center gap-1.5 text-amber-950">
                    <Shield className="w-3.5 h-3.5 text-amber-700" />
                    <span>Weryfikacja tożsamości mieszkańca</span>
                  </p>
                  <p className="text-amber-800 leading-relaxed">
                    Zweryfikowany profil buduje zaufanie na osiedlu i pozwala pożyczać wartościowy sprzęt. Aby otrzymać odznakę, skontaktuj się z Administratorem lub Radą Osiedla w celu potwierdzenia adresu.
                  </p>
                </div>
              )}

              {currentUser.bio && (
                <p className="text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 leading-relaxed">
                  {currentUser.bio}
                </p>
              )}

              {/* Privacy protection notice */}
              <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-100 text-[11px] text-emerald-900 space-y-1">
                <p className="font-semibold flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                  Ochrona prywatności na Starych Stawach
                </p>
                <p className="text-slate-600">
                  Twój dokładny adres ani numer telefonu nigdy nie są widoczne dla innych użytkowników. Sąsiedzi widzą jedynie Twój pseudonim i przybliżony rejon osiedla.
                </p>
              </div>

              {/* User posts history */}
              <div className="pt-2">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Twoje aktywne ogłoszenia ({userPosts.length})
                </h3>
                {userPosts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">Nie masz jeszcze dodanych ogłoszeń.</p>
                ) : (
                  <div className="space-y-1.5">
                    {userPosts.map((p) => (
                      <div
                        key={p.id}
                        className="p-2.5 rounded-xl border border-slate-200 text-xs flex items-center justify-between"
                      >
                        <span className="font-medium text-slate-800 truncate mr-2">{p.title}</span>
                        <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0">
                          {p.category}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Account management buttons */}
              <div className="pt-4 border-t border-slate-100 flex flex-col gap-2">
                <button
                  onClick={() => {
                    store.logout();
                    onClose();
                  }}
                  className="w-full py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-xs font-semibold text-slate-700 flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4 text-slate-400" />
                  <span>Wyloguj się</span>
                </button>

                <button
                  onClick={handleDeleteAccount}
                  className="w-full py-2 rounded-xl text-xs font-medium text-red-600 hover:bg-red-50 flex items-center justify-center gap-1.5 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Usuń konto i moje dane</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
