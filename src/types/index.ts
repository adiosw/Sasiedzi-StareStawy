// ==============================================================================
// STARE STAWY — SĄSIEDZI: TYPY DANYCH
// ==============================================================================

export type PostCategory =
  | 'oddam'
  | 'sprzedam'
  | 'kupie'
  | 'pozycze'
  | 'szukam'
  | 'pomoc'
  | 'zguba'
  | 'pytanie'
  | 'informacja'
  | 'inne';

export type HelpCategory =
  | 'transport'
  | 'fizyczna'
  | 'zakupy'
  | 'naprawa'
  | 'opieka'
  | 'inna';

export type HelpUrgency = 'normal' | 'urgent' | 'critical';

export type AlertCategory =
  | 'road'       // 🚧 Droga / utrudnienia
  | 'outage'     // ⚡ Awaria
  | 'pet'        // 🐕 Zwierzę
  | 'lost'       // 🔑 Zguba / znaleziono
  | 'important'  // ⚠️ Ważne
  | 'other';     // 🌳 Inne

export type ProCategory =
  | 'hydraulik'
  | 'elektryk'
  | 'mechanik'
  | 'fryzjer'
  | 'kosmetyczka'
  | 'remonty'
  | 'ogrodnictwo'
  | 'transport'
  | 'inne';

export interface UserProfile {
  id: string;
  displayName: string;
  email?: string;
  avatarUrl?: string;
  bio?: string;
  neighborhood: string;
  approxLocation: string;
  latitude: number;
  longitude: number;
  isVerified: boolean;
  isAdmin: boolean;
  isBlocked: boolean;
  createdAt: string;
}

export interface Post {
  id: string;
  userId: string;
  author: {
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
    approxLocation: string;
  };
  title: string;
  content: string;
  category: PostCategory;
  price?: number;
  isFree?: boolean;
  condition?: 'new' | 'used' | 'other';
  imageUrl?: string;
  approxLocation: string;
  latitude: number;
  longitude: number;
  status: 'active' | 'archived' | 'hidden';
  repliesCount: number;
  createdAt: string;
  isDemo?: boolean;
}

export interface PostComment {
  id: string;
  postId: string;
  userId: string;
  author: {
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  content: string;
  createdAt: string;
}

export interface HelpRequest {
  id: string;
  userId: string;
  author: {
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
    approxLocation: string;
  };
  title: string;
  description: string;
  category: HelpCategory;
  urgency: HelpUrgency;
  approxLocation: string;
  latitude: number;
  longitude: number;
  status: 'open' | 'resolved' | 'closed';
  createdAt: string;
  isDemo?: boolean;
}

export interface BorrowItem {
  id: string;
  userId: string;
  owner: {
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
    approxLocation: string;
  };
  name: string;
  description: string;
  imageUrl?: string;
  itemCategory?: string;
  deposit?: string;
  approxLocation: string;
  latitude: number;
  longitude: number;
  availability: 'available' | 'borrowed' | 'reserved';
  rules: string;
  createdAt: string;
  isDemo?: boolean;
}

export interface AlertItem {
  id: string;
  userId: string;
  author: {
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  title: string;
  description: string;
  category: AlertCategory;
  approxLocation: string;
  latitude: number;
  longitude: number;
  status: 'pending' | 'approved' | 'resolved' | 'rejected';
  createdAt: string;
  isDemo?: boolean;
}

export interface Professional {
  id: string;
  userId?: string;
  name: string;
  description: string;
  category: ProCategory;
  serviceArea: string;
  phone?: string;
  website?: string;
  imageUrl?: string;
  isVerified: boolean;
  rating: number;
  reviewsCount: number;
  createdAt: string;
  isDemo?: boolean;
}

export interface ProfessionalReview {
  id: string;
  professionalId: string;
  userId: string;
  authorName: string;
  rating: number;
  comment: string;
  createdAt: string;
  status: 'active' | 'hidden';
}

export interface Conversation {
  id: string;
  participant1Id: string;
  participant2Id: string;
  otherParticipant: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
  };
  lastMessage?: string;
  lastMessageAt?: string;
  unreadCount: number;
}

export interface DirectMessage {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  createdAt: string;
  readAt?: string;
}

export type ReportReason =
  | 'spam'
  | 'fraud'
  | 'danger'
  | 'offensive'
  | 'wrong_location'
  | 'other';

export interface ReportItem {
  id: string;
  reporterId: string;
  targetType: 'post' | 'comment' | 'help' | 'borrow' | 'alert' | 'user' | 'message';
  targetId: string;
  targetTitle?: string;
  reason: string;
  status: 'pending' | 'reviewed' | 'dismissed';
  notes?: string;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: 'message' | 'reply' | 'alert' | 'help';
  link?: string;
  isRead: boolean;
  createdAt: string;
}

// ==============================================================================
// UNIFIED OFFERS SEARCH SYSTEM (WSZYSTKIE OFERTY, SPRZĘT, POMOC, FACHOWCY)
// ==============================================================================

export type OfferKind = 'post' | 'borrow' | 'help' | 'pro' | 'alert';

export interface UnifiedOffer {
  id: string;
  kind: OfferKind;
  title: string;
  description: string;
  category: string;
  imageUrl?: string;
  price?: number;
  isFree?: boolean;
  deposit?: string;
  status: string;
  approxLocation: string;
  latitude: number;
  longitude: number;
  author: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    isVerified: boolean;
    approxLocation: string;
    phone?: string;
  };
  rating?: number;
  reviewsCount?: number;
  urgency?: string;
  createdAt: string;
  rawItem: Post | BorrowItem | HelpRequest | Professional | AlertItem;
}

