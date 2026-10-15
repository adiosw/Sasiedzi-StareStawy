import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Send,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  MoreVertical,
  Flag,
  UserX,
  Sparkles,
} from 'lucide-react';
import { Conversation, DirectMessage, UserProfile } from '../types';
import { store } from '../lib/store';

interface MessagesTabProps {
  currentUser: UserProfile | null;
  activeConversationId?: string | null;
  onSelectConversation: (id: string | null) => void;
  onReport: (type: 'user', id: string, name?: string) => void;
  onRequireAuth: () => void;
}

export const MessagesTab: React.FC<MessagesTabProps> = ({
  currentUser,
  activeConversationId,
  onSelectConversation,
  onReport,
  onRequireAuth,
}) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<DirectMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const update = () => {
      setConversations(store.getConversations());
      if (activeConversationId) {
        setMessages(store.getMessages(activeConversationId));
      }
    };
    update();
    return store.subscribe(update);
  }, [activeConversationId]);

  if (!currentUser) {
    return (
      <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-700 flex items-center justify-center mx-auto text-2xl">
          💬
        </div>
        <div>
          <h4 className="text-base font-bold text-slate-800">Wiadomości sąsiedzkie</h4>
          <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
            Zaloguj się, aby bezpiecznie pisać z mieszkańcami Starych Stawów bez ujawniania numeru telefonu.
          </p>
        </div>
        <button
          onClick={onRequireAuth}
          className="inline-flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2.5 rounded-xl text-xs font-semibold shadow-sm"
        >
          Zaloguj się
        </button>
      </div>
    );
  }

  const activeConv = conversations.find((c) => c.id === activeConversationId);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConversationId || !inputText.trim()) return;

    store.sendMessage(activeConversationId, inputText.trim());
    setInputText('');
    setMessages(store.getMessages(activeConversationId));
  };

  const handleBlock = () => {
    if (!activeConv) return;
    if (confirm(`Czy na pewno chcesz zablokować użytkownika ${activeConv.otherParticipant.displayName}?`)) {
      store.blockUser(activeConv.otherParticipant.id);
      onSelectConversation(null);
    }
  };

  // Chat Conversation View
  if (activeConv) {
    return (
      <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs flex flex-col h-[75vh] overflow-hidden">
        {/* Chat Header */}
        <div className="px-4 py-3 border-b border-slate-200/80 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onSelectConversation(null)}
              className="p-1 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-200/60"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <img
              src={activeConv.otherParticipant.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
              alt={activeConv.otherParticipant.displayName}
              className="w-9 h-9 rounded-full object-cover border border-slate-200"
            />
            <div>
              <div className="flex items-center gap-1">
                <span className="font-bold text-xs sm:text-sm text-slate-900">
                  {activeConv.otherParticipant.displayName}
                </span>
                {activeConv.otherParticipant.isVerified && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                )}
              </div>
              <p className="text-[10px] text-slate-400">Bezpieczna rozmowa 1:1</p>
            </div>
          </div>

          {/* Options Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-200/60"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {showMenu && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setShowMenu(false)} />
                <div className="absolute right-0 mt-1 w-48 bg-white rounded-2xl shadow-xl border border-slate-200 z-50 py-1.5 text-xs animate-in fade-in">
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      onReport('user', activeConv.otherParticipant.id, activeConv.otherParticipant.displayName);
                    }}
                    className="w-full text-left px-3.5 py-2 text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Flag className="w-4 h-4 text-slate-400" />
                    <span>Zgłoś sąsiada</span>
                  </button>
                  <button
                    onClick={() => {
                      setShowMenu(false);
                      handleBlock();
                    }}
                    className="w-full text-left px-3.5 py-2 text-red-600 hover:bg-red-50 flex items-center gap-2"
                  >
                    <UserX className="w-4 h-4 text-red-500" />
                    <span>Zablokuj użytkownika</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Message Thread */}
        <div className="p-4 flex-1 overflow-y-auto space-y-2.5">
          <div className="text-center py-2">
            <span className="text-[10px] text-slate-400 bg-slate-100 px-2.5 py-1 rounded-full">
              Wiadomości są prywatne i widoczne tylko dla Was dwojga
            </span>
          </div>

          {messages.map((m) => {
            const isMe = m.senderId === currentUser.id;
            return (
              <div
                key={m.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-xs sm:text-sm ${
                    isMe
                      ? 'bg-emerald-600 text-white rounded-br-xs'
                      : 'bg-slate-100 text-slate-800 rounded-bl-xs'
                  }`}
                >
                  <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
                </div>
                <span className="text-[9px] text-slate-400 mt-0.5 px-1">
                  {new Date(m.createdAt).toLocaleTimeString('pl-PL', {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>
            );
          })}
        </div>

        {/* Send input */}
        <form
          onSubmit={handleSendMessage}
          className="p-3 bg-slate-50 border-t border-slate-200 flex items-center gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Napisz bezpieczną wiadomość..."
            className="flex-1 px-3.5 py-2 text-xs sm:text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
          />
          <button
            type="submit"
            disabled={!inputText.trim()}
            className="p-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-xl transition active:scale-95"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    );
  }

  // Conversations List View
  return (
    <div className="space-y-4 pb-20">
      <div className="bg-white rounded-3xl p-4 sm:p-5 border border-slate-200/80 shadow-xs">
        <h2 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
          Wiadomości Sąsiedzkie
        </h2>
        <p className="text-xs text-slate-500">
          Bezpośrednie i dyskretne rozmowy z sąsiadami ze Starych Stawów
        </p>
      </div>

      {conversations.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-3xl border border-slate-200 shadow-xs space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-slate-100 text-slate-600 flex items-center justify-center mx-auto text-2xl">
            💬
          </div>
          <div>
            <h4 className="text-sm sm:text-base font-bold text-slate-800">Brak aktywnych rozmów</h4>
            <p className="text-xs text-slate-500 max-w-xs mx-auto mt-1">
              Rozpocznij czat klikając «Napisz» pod ogłoszeniem, prośbą o pomoc lub ofertą pożyczenia.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {conversations.map((conv) => (
            <div
              key={conv.id}
              onClick={() => onSelectConversation(conv.id)}
              className="bg-white rounded-2xl p-3.5 border border-slate-200/80 hover:border-emerald-300 hover:bg-emerald-50/20 shadow-xs transition cursor-pointer flex items-center gap-3"
            >
              <img
                src={conv.otherParticipant.avatarUrl || 'https://api.dicebear.com/7.x/bottts/svg?seed=user'}
                alt={conv.otherParticipant.displayName}
                className="w-11 h-11 rounded-full object-cover border border-slate-200 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1">
                    <span className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                      {conv.otherParticipant.displayName}
                    </span>
                    {conv.otherParticipant.isVerified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    )}
                  </div>
                  {conv.lastMessageAt && (
                    <span className="text-[10px] text-slate-400">
                      {new Date(conv.lastMessageAt).toLocaleDateString('pl-PL', {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 truncate">{conv.lastMessage || 'Rozpocznij rozmowę'}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
