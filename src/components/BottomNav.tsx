import React from 'react';
import { Home, Map, HeartHandshake, Wrench, MessageSquare, User, AlertTriangle, Users, Search } from 'lucide-react';

export type NavTab = 'feed' | 'map' | 'search' | 'borrow' | 'help' | 'alerts' | 'pros' | 'messages' | 'profile';

interface BottomNavProps {
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  unreadMessagesCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onSelectTab,
  unreadMessagesCount,
}) => {
  const tabs = [
    { id: 'feed' as NavTab, label: 'Tablica', icon: Home },
    { id: 'map' as NavTab, label: 'Mapa', icon: Map },
    { id: 'search' as NavTab, label: 'Szukaj', icon: Search },
    { id: 'borrow' as NavTab, label: 'Pożycz', icon: Wrench },
    { id: 'help' as NavTab, label: 'Pomoc', icon: HeartHandshake },
    { id: 'pros' as NavTab, label: 'Fachowcy', icon: Users },
    { id: 'alerts' as NavTab, label: 'Alerty', icon: AlertTriangle },
    { id: 'messages' as NavTab, label: 'Wiadomości', icon: MessageSquare, badge: unreadMessagesCount },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg pb-safe">
      <div className="max-w-4xl mx-auto flex items-center justify-around px-1 py-1.5 sm:py-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2 rounded-xl transition-all duration-150 active:scale-90 ${
                isActive
                  ? 'text-emerald-700 font-semibold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform ${
                    isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                  }`}
                />
                {tab.badge && tab.badge > 0 ? (
                  <span className="absolute -top-1.5 -right-2 bg-red-600 text-white text-[9px] font-bold px-1 rounded-full min-w-4 h-4 flex items-center justify-center">
                    {tab.badge}
                  </span>
                ) : null}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
              {isActive && (
                <span className="absolute bottom-0 w-3 h-0.5 bg-emerald-600 rounded-full" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
