import React, { useState, useEffect } from 'react';
import { store } from './lib/store';
import {
  UserProfile,
  Post,
  HelpRequest,
  BorrowItem,
  AlertItem,
  Professional,
  NotificationItem,
} from './types';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { LandingPage } from './components/LandingPage';
import { FeedTab } from './components/FeedTab';
import { MapTab } from './components/MapTab';
import { SearchTab } from './components/SearchTab';
import { HelpTab } from './components/HelpTab';
import { BorrowTab } from './components/BorrowTab';
import { AlertsTab } from './components/AlertsTab';
import { ProsTab } from './components/ProsTab';
import { MessagesTab } from './components/MessagesTab';
import { PostDetailModal } from './components/PostDetailModal';
import { CreateModal } from './components/CreateModal';
import { OffersSearchModal } from './components/OffersSearchModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { AdminModal } from './components/AdminModal';
import { LocationPickerModal } from './components/LocationPickerModal';
import { ReportModal } from './components/ReportModal';
import { NotificationsModal } from './components/NotificationsModal';
import { LegalModal } from './components/LegalModal';
import { ExportModal } from './components/ExportModal';
import { OfflineIndicator } from './components/PWAInstallButton';
import { Plus } from 'lucide-react';

export function App() {
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(store.getCurrentUser());
  const [posts, setPosts] = useState<Post[]>(store.getPosts());
  const [helpRequests, setHelpRequests] = useState<HelpRequest[]>(store.getHelpRequests());
  const [borrowItems, setBorrowItems] = useState<BorrowItem[]>(store.getBorrowItems());
  const [alerts, setAlerts] = useState<AlertItem[]>(store.getAlerts());
  const [pros, setPros] = useState<Professional[]>(store.getProfessionals());
  const [notifications, setNotifications] = useState<NotificationItem[]>(store.getNotifications());

  // Navigation tab
  const [currentTab, setCurrentTab] = useState<NavTab>('feed');
  const [hasDismissedLanding, setHasDismissedLanding] = useState(false);

  // Active chat conversation ID (when switching to messages tab)
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);

  // Modals
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createInitialType, setCreateInitialType] = useState<'post' | 'help' | 'borrow' | 'alert' | null>(null);
  const [createInitialLocation, setCreateInitialLocation] = useState<{ lat: number; lng: number; approxLocation?: string } | null>(null);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [adminModalOpen, setAdminModalOpen] = useState(false);
  const [locationPickerOpen, setLocationPickerOpen] = useState(false);
  const [notificationsModalOpen, setNotificationsModalOpen] = useState(false);
  const [legalModalType, setLegalModalType] = useState<'privacy' | 'terms' | 'contact' | null>(null);
  const [exportModalOpen, setExportModalOpen] = useState(false);

  const handleOpenCreateWithConfig = (
    type?: 'post' | 'help' | 'borrow' | 'alert',
    location?: { lat: number; lng: number; approxLocation?: string }
  ) => {
    setCreateInitialType(type || null);
    setCreateInitialLocation(location || null);
    setCreateModalOpen(true);
  };

  // Report Modal
  const [reportConfig, setReportConfig] = useState<{
    isOpen: boolean;
    targetType: 'post' | 'user' | 'comment';
    targetId: string;
    targetTitle?: string;
  }>({
    isOpen: false,
    targetType: 'post',
    targetId: '',
  });

  // Re-sync with store updates
  useEffect(() => {
    const sync = () => {
      setCurrentUser(store.getCurrentUser());
      setPosts(store.getPosts());
      setHelpRequests(store.getHelpRequests());
      setBorrowItems(store.getBorrowItems());
      setAlerts(store.getAlerts());
      setPros(store.getProfessionals());
      setNotifications(store.getNotifications());
    };

    sync();
    return store.subscribe(sync);
  }, []);

  // Calculate unread direct messages count
  const conversations = store.getConversations();
  const unreadMessagesCount = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  // Handlers
  const handleOpenAuth = (mode: 'login' | 'register' = 'login') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
  };

  const handleStartChatWithUser = (targetUserId: string, initialMessage?: string) => {
    if (!currentUser) {
      handleOpenAuth('login');
      return;
    }
    const conv = store.startOrGetConversation(targetUserId);
    if (initialMessage) {
      store.sendMessage(conv.id, initialMessage);
    }
    setActiveConversationId(conv.id);
    setCurrentTab('messages');
  };

  const handleOpenReport = (
    targetType: 'post' | 'user' | 'comment',
    targetId: string,
    targetTitle?: string
  ) => {
    setReportConfig({
      isOpen: true,
      targetType,
      targetId,
      targetTitle,
    });
  };

  // If user is not logged in AND hasn't chosen to explore as guest, show the landing page
  if (!currentUser && !hasDismissedLanding) {
    return (
      <>
        <LandingPage
          onJoin={() => handleOpenAuth('register')}
          onExploreAsGuest={() => setHasDismissedLanding(true)}
          onOpenLegal={(type) => setLegalModalType(type)}
          onOpenExport={() => setExportModalOpen(true)}
        />
        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          defaultMode={authMode}
          onSuccess={() => setHasDismissedLanding(true)}
        />
        <LegalModal
          isOpen={!!legalModalType}
          type={legalModalType}
          onClose={() => setLegalModalType(null)}
        />
        <ExportModal
          isOpen={exportModalOpen}
          onClose={() => setExportModalOpen(false)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100/70 text-slate-900 flex flex-col font-sans selection:bg-emerald-200">
      <OfflineIndicator />

      {/* Sticky Header with neighborhood brand and quick switcher */}
      <Header
        currentUser={currentUser}
        onOpenProfile={() => setProfileModalOpen(true)}
        onOpenAdmin={() => setAdminModalOpen(true)}
        onOpenNotifications={() => setNotificationsModalOpen(true)}
        onOpenLocationPicker={() => setLocationPickerOpen(true)}
        onOpenLegal={(type) => setLegalModalType(type)}
        onOpenExport={() => setExportModalOpen(true)}
        onOpenSearch={() => setSearchModalOpen(true)}
        onOpenMap={() => setCurrentTab('map')}
      />

      {/* Main Content Viewport */}
      <main className="flex-1 max-w-4xl mx-auto w-full px-3 sm:px-4 py-4">
        {currentTab === 'feed' && (
          <FeedTab
            posts={posts}
            currentUser={currentUser}
            onOpenPost={(post) => setSelectedPost(post)}
            onOpenCreate={() => setCreateModalOpen(true)}
          />
        )}

        {currentTab === 'map' && (
          <MapTab
            posts={posts}
            alerts={alerts}
            helpRequests={helpRequests}
            borrowItems={borrowItems}
            currentUser={currentUser}
            onOpenPost={(post) => setSelectedPost(post)}
            onOpenCreate={handleOpenCreateWithConfig}
            onStartChat={handleStartChatWithUser}
            onRequireAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentTab === 'search' && (
          <SearchTab
            currentUser={currentUser}
            onStartChat={handleStartChatWithUser}
            onOpenPost={(post) => setSelectedPost(post)}
            onOpenCreate={() => setCreateModalOpen(true)}
            onRequireAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentTab === 'help' && (
          <HelpTab
            requests={helpRequests}
            currentUser={currentUser}
            onOpenCreate={() => setCreateModalOpen(true)}
            onStartChat={handleStartChatWithUser}
            onRequireAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentTab === 'borrow' && (
          <BorrowTab
            items={borrowItems}
            currentUser={currentUser}
            onOpenCreate={() => setCreateModalOpen(true)}
            onStartChat={handleStartChatWithUser}
            onRequireAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentTab === 'alerts' && (
          <AlertsTab
            alerts={alerts}
            currentUser={currentUser}
            onOpenCreate={() => setCreateModalOpen(true)}
            onStartChat={handleStartChatWithUser}
            onRequireAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentTab === 'pros' && (
          <ProsTab
            pros={pros}
            currentUser={currentUser}
            onStartChat={handleStartChatWithUser}
            onRequireAuth={() => handleOpenAuth('login')}
          />
        )}

        {currentTab === 'messages' && (
          <MessagesTab
            currentUser={currentUser}
            activeConversationId={activeConversationId}
            onSelectConversation={(id) => setActiveConversationId(id)}
            onReport={(type, id, name) => handleOpenReport(type, id, name)}
            onRequireAuth={() => handleOpenAuth('login')}
          />
        )}
      </main>

      {/* Floating Action Button (+ Dodaj) */}
      <div className="fixed bottom-18 right-4 sm:right-8 z-20">
        <button
          onClick={() => {
            if (!currentUser) {
              handleOpenAuth('login');
              return;
            }
            setCreateModalOpen(true);
          }}
          className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-bold px-4 py-3 rounded-full shadow-lg shadow-emerald-700/30 transition border-2 border-white"
          title="Dodaj ogłoszenie, prośbę o pomoc, rzecz do pożyczenia lub alert"
        >
          <Plus className="w-5 h-5 stroke-[2.8]" />
          <span className="text-xs sm:text-sm font-semibold tracking-wide">Dodaj</span>
        </button>
      </div>

      {/* Bottom Mobile-First Navigation */}
      <BottomNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          if (tab === 'profile') {
            if (!currentUser) {
              handleOpenAuth('login');
            } else {
              setProfileModalOpen(true);
            }
          } else {
            setCurrentTab(tab);
          }
        }}
        unreadMessagesCount={unreadMessagesCount}
      />

      {/* Modals */}
      <CreateModal
        isOpen={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreateInitialType(null);
          setCreateInitialLocation(null);
        }}
        currentUser={currentUser}
        onRequireAuth={() => handleOpenAuth('login')}
        onCreated={(type) => {
          if (type === 'post') setCurrentTab('feed');
          if (type === 'help') setCurrentTab('help');
          if (type === 'borrow') setCurrentTab('borrow');
          if (type === 'alert') setCurrentTab('alerts');
        }}
        initialType={createInitialType}
        initialLocation={createInitialLocation}
      />

      <PostDetailModal
        post={selectedPost}
        isOpen={!!selectedPost}
        onClose={() => setSelectedPost(null)}
        currentUser={currentUser}
        onStartChat={handleStartChatWithUser}
        onReport={(type, id, title) => handleOpenReport(type, id, title)}
        onRequireAuth={() => handleOpenAuth('login')}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultMode={authMode}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        currentUser={currentUser}
        onOpenLocationPicker={() => {
          setProfileModalOpen(false);
          setLocationPickerOpen(true);
        }}
        onRequireAuth={() => handleOpenAuth('login')}
      />

      <AdminModal
        isOpen={adminModalOpen}
        onClose={() => setAdminModalOpen(false)}
        currentUser={currentUser}
      />

      <LocationPickerModal
        isOpen={locationPickerOpen}
        onClose={() => setLocationPickerOpen(false)}
        currentUser={currentUser}
      />

      <ReportModal
        isOpen={reportConfig.isOpen}
        onClose={() => setReportConfig((prev) => ({ ...prev, isOpen: false }))}
        targetType={reportConfig.targetType}
        targetId={reportConfig.targetId}
        targetTitle={reportConfig.targetTitle}
      />

      <NotificationsModal
        isOpen={notificationsModalOpen}
        onClose={() => setNotificationsModalOpen(false)}
        notifications={notifications}
        onNavigate={(link) => {
          if (link === 'messages') setCurrentTab('messages');
          if (link === 'alerts') setCurrentTab('alerts');
          if (link === 'feed') setCurrentTab('feed');
        }}
      />

      <LegalModal
        isOpen={!!legalModalType}
        type={legalModalType}
        onClose={() => setLegalModalType(null)}
      />

      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
      />

      <OffersSearchModal
        isOpen={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        currentUser={currentUser}
        onStartChat={handleStartChatWithUser}
        onOpenPost={(post) => setSelectedPost(post)}
        onOpenCreate={() => setCreateModalOpen(true)}
        onRequireAuth={() => handleOpenAuth('login')}
      />
    </div>
  );
}

export default App;
