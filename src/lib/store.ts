// ==============================================================================
// STARE STAWY — SĄSIEDZI: UNIFIED STORE & REPOSITORY LAYER
// Hybrydowy magazyn danych: Supabase Realtime + lokalny fallback z localStorage.
// ==============================================================================

import {
  UserProfile,
  Post,
  PostComment,
  HelpRequest,
  BorrowItem,
  AlertItem,
  Professional,
  ProfessionalReview,
  Conversation,
  DirectMessage,
  ReportItem,
  NotificationItem,
  UnifiedOffer,
} from '../types';

import {
  DEMO_USERS,
  DEMO_POSTS,
  DEMO_COMMENTS,
  DEMO_HELP_REQUESTS,
  DEMO_BORROW_ITEMS,
  DEMO_ALERTS,
  DEMO_PROFESSIONALS,
  DEMO_REVIEWS,
  DEMO_CONVERSATIONS,
  DEMO_MESSAGES,
  DEMO_NOTIFICATIONS,
} from './demoData';

import { maskCoordinatesSafely, STARE_STAWY_CENTER } from './geo';
import {
  getSupabase,
  isSupabaseConfigured,
  getSupabaseConfig,
  saveCustomSupabaseConfig,
  clearCustomSupabaseConfig,
  testSupabaseConnection,
} from './supabase';

const STORAGE_KEYS = {
  CURRENT_USER_ID: 'stare_stawy_current_user_id',
  USERS: 'stare_stawy_users_v2',
  POSTS: 'stare_stawy_posts_v2',
  COMMENTS: 'stare_stawy_comments_v2',
  HELP: 'stare_stawy_help_v2',
  BORROW: 'stare_stawy_borrow_v2',
  ALERTS: 'stare_stawy_alerts_v2',
  PROS: 'stare_stawy_pros_v2',
  REVIEWS: 'stare_stawy_reviews_v2',
  CONVERSATIONS: 'stare_stawy_conversations_v2',
  MESSAGES: 'stare_stawy_messages_v2',
  REPORTS: 'stare_stawy_reports_v2',
  BLOCKS: 'stare_stawy_blocks_v2',
  NOTIFICATIONS: 'stare_stawy_notifications_v2',
};

// Pomocniczy parser do localStorage
function loadLocal<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.warn(`Błąd wczytywania ${key}:`, err);
    return fallback;
  }
}

function saveLocal<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.warn(`Błąd zapisu ${key}:`, err);
  }
}

class Store {
  private users: UserProfile[];
  private posts: Post[];
  private comments: PostComment[];
  private helpRequests: HelpRequest[];
  private borrowItems: BorrowItem[];
  private alerts: AlertItem[];
  private pros: Professional[];
  private reviews: ProfessionalReview[];
  private conversations: Conversation[];
  private messages: DirectMessage[];
  private reports: ReportItem[];
  private blocks: string[];
  private notifications: NotificationItem[];
  private currentUserId: string | null;
  private listeners: Set<() => void> = new Set();
  private isCloudSyncing = false;

  constructor() {
    this.users = loadLocal(STORAGE_KEYS.USERS, DEMO_USERS);
    this.posts = loadLocal(STORAGE_KEYS.POSTS, DEMO_POSTS);
    this.comments = loadLocal(STORAGE_KEYS.COMMENTS, DEMO_COMMENTS);
    this.helpRequests = loadLocal(STORAGE_KEYS.HELP, DEMO_HELP_REQUESTS);
    this.borrowItems = loadLocal(STORAGE_KEYS.BORROW, DEMO_BORROW_ITEMS);
    this.alerts = loadLocal(STORAGE_KEYS.ALERTS, DEMO_ALERTS);
    this.pros = loadLocal(STORAGE_KEYS.PROS, DEMO_PROFESSIONALS);
    this.reviews = loadLocal(STORAGE_KEYS.REVIEWS, DEMO_REVIEWS);
    this.conversations = loadLocal(STORAGE_KEYS.CONVERSATIONS, DEMO_CONVERSATIONS);
    this.messages = loadLocal(STORAGE_KEYS.MESSAGES, DEMO_MESSAGES);
    this.reports = loadLocal(STORAGE_KEYS.REPORTS, []);
    this.blocks = loadLocal(STORAGE_KEYS.BLOCKS, []);
    this.notifications = loadLocal(STORAGE_KEYS.NOTIFICATIONS, DEMO_NOTIFICATIONS);

    const savedUserId = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    this.currentUserId = savedUserId || (this.users[0]?.id || null);

    // Zainicjuj synchronizację z Supabase jeśli jest skonfigurowany
    this.initCloud();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify(): void {
    this.listeners.forEach((fn) => fn());
  }

  // ==========================
  // CLOUD & SUPABASE SYNC
  // ==========================

  public isCloudConnected(): boolean {
    return isSupabaseConfigured();
  }

  public getCloudStatus() {
    return getSupabaseConfig();
  }

  public async setCustomCloudCredentials(url: string, key: string) {
    const saved = saveCustomSupabaseConfig(url, key);
    if (saved) {
      await this.initCloud();
    }
    return saved;
  }

  public clearCustomCloudCredentials() {
    clearCustomSupabaseConfig();
    this.notify();
  }

  public async checkCloudHealth() {
    return await testSupabaseConnection();
  }

  private async initCloud(): Promise<void> {
    const client = getSupabase();
    if (!client) return;

    try {
      this.isCloudSyncing = true;

      // 1. Sprawdź sesję auth w Supabase
      const { data: authData } = await client.auth.getSession();
      if (authData?.session?.user) {
        const authUser = authData.session.user;
        const existingProfile = this.users.find((u) => u.id === authUser.id);
        if (existingProfile) {
          this.currentUserId = existingProfile.id;
          localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, existingProfile.id);
        }
      }

      // 1b. Pobierz zarejestrowane profile mieszkańców z Supabase (włącznie z adresami e-mail)
      const { data: cloudProfiles } = await client
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (cloudProfiles && cloudProfiles.length > 0) {
        const mappedProfiles: UserProfile[] = cloudProfiles.map((cp: any) => ({
          id: cp.id,
          displayName: cp.display_name || 'Mieszkaniec',
          email: cp.email || '',
          avatarUrl: cp.avatar_url || `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(cp.display_name || 'user')}`,
          bio: cp.bio || 'Mieszkaniec Starych Stawów',
          neighborhood: cp.neighborhood || 'Stare Stawy',
          approxLocation: cp.approx_location || 'Stare Stawy',
          latitude: Number(cp.latitude) || STARE_STAWY_CENTER.lat,
          longitude: Number(cp.longitude) || STARE_STAWY_CENTER.lng,
          isVerified: Boolean(cp.is_verified),
          isAdmin: Boolean(cp.is_admin),
          isBlocked: Boolean(cp.is_blocked),
          createdAt: cp.created_at || new Date().toISOString(),
        }));

        // Połącz profile z chmury z lokalnymi (zastępując stare o tym samym ID)
        const cloudMap = new Map(mappedProfiles.map((p) => [p.id, p]));
        const mergedUsers = [...mappedProfiles];
        for (const localUser of this.users) {
          if (!cloudMap.has(localUser.id)) {
            mergedUsers.push(localUser);
          }
        }
        this.users = mergedUsers;
        saveLocal(STORAGE_KEYS.USERS, this.users);
      }

      // 2. Pobierz posty z Supabase
      const { data: cloudPosts } = await client
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (cloudPosts && cloudPosts.length > 0) {
        // Mapuj ze struktury Supabase (snake_case)
        const mappedPosts: Post[] = cloudPosts.map((p: any) => {
          const authorUser = this.users.find((u) => u.id === p.user_id);
          return {
            id: p.id,
            userId: p.user_id,
            author: {
              displayName: authorUser?.displayName || 'Mieszkaniec Starych Stawów',
              avatarUrl: authorUser?.avatarUrl,
              isVerified: authorUser?.isVerified ?? false,
              approxLocation: p.approx_location || 'Stare Stawy',
            },
            title: p.title,
            content: p.content,
            category: p.category,
            imageUrl: p.image_url,
            approxLocation: p.approx_location || 'Stare Stawy',
            latitude: Number(p.latitude) || STARE_STAWY_CENTER.lat,
            longitude: Number(p.longitude) || STARE_STAWY_CENTER.lng,
            status: p.status || 'active',
            repliesCount: p.replies_count || 0,
            createdAt: p.created_at,
            isDemo: false,
          };
        });

        this.posts = mappedPosts;
        saveLocal(STORAGE_KEYS.POSTS, this.posts);
      }

      // 3. Pobierz pomoc sąsiedzką
      const { data: cloudHelp } = await client
        .from('help_requests')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (cloudHelp && cloudHelp.length > 0) {
        this.helpRequests = cloudHelp.map((h: any) => {
          const authorUser = this.users.find((u) => u.id === h.user_id);
          return {
            id: h.id,
            userId: h.user_id,
            author: {
              displayName: authorUser?.displayName || 'Sąsiad',
              avatarUrl: authorUser?.avatarUrl,
              isVerified: authorUser?.isVerified ?? false,
              approxLocation: h.approx_location || 'Stare Stawy',
            },
            title: h.title,
            description: h.description,
            category: h.category,
            urgency: h.urgency,
            approxLocation: h.approx_location || 'Stare Stawy',
            latitude: Number(h.latitude) || STARE_STAWY_CENTER.lat,
            longitude: Number(h.longitude) || STARE_STAWY_CENTER.lng,
            status: h.status || 'open',
            createdAt: h.created_at,
            isDemo: false,
          };
        });
        saveLocal(STORAGE_KEYS.HELP, this.helpRequests);
      }

      // 4. Pobierz pożyczalnię
      const { data: cloudBorrow } = await client
        .from('borrow_items')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (cloudBorrow && cloudBorrow.length > 0) {
        this.borrowItems = cloudBorrow.map((b: any) => {
          const authorUser = this.users.find((u) => u.id === b.user_id);
          return {
            id: b.id,
            userId: b.user_id,
            owner: {
              displayName: authorUser?.displayName || 'Sąsiad',
              avatarUrl: authorUser?.avatarUrl,
              isVerified: authorUser?.isVerified ?? false,
              approxLocation: b.approx_location || 'Stare Stawy',
            },
            name: b.name,
            description: b.description,
            imageUrl: b.image_url,
            approxLocation: b.approx_location || 'Stare Stawy',
            latitude: Number(b.latitude) || STARE_STAWY_CENTER.lat,
            longitude: Number(b.longitude) || STARE_STAWY_CENTER.lng,
            availability: b.availability || 'available',
            rules: b.rules || 'Zwrócić czyste i sprawne.',
            createdAt: b.created_at,
            isDemo: false,
          };
        });
        saveLocal(STORAGE_KEYS.BORROW, this.borrowItems);
      }

      // 5. Pobierz fachowców
      const { data: cloudPros } = await client
        .from('professionals')
        .select('*')
        .order('rating', { ascending: false });

      if (cloudPros && cloudPros.length > 0) {
        this.pros = cloudPros.map((p: any) => ({
          id: p.id,
          userId: p.user_id,
          name: p.name,
          description: p.description,
          category: p.category,
          serviceArea: p.service_area,
          phone: p.phone,
          website: p.website,
          imageUrl: p.image_url,
          isVerified: p.is_verified,
          rating: Number(p.rating) || 5.0,
          reviewsCount: Number(p.reviews_count) || 0,
          createdAt: p.created_at,
          isDemo: false,
        }));
        saveLocal(STORAGE_KEYS.PROS, this.pros);
      }

      this.notify();
    } catch (err) {
      console.warn('Supabase sync skipped, working in offline/local storage mode:', err);
    } finally {
      this.isCloudSyncing = false;
    }
  }

  private async pushToCloud(table: string, payload: any): Promise<void> {
    const client = getSupabase();
    if (!client) return;

    try {
      await client.from(table).upsert(payload);
    } catch (err) {
      console.warn(`Could not sync to cloud table ${table}:`, err);
    }
  }

  // ==========================
  // UŻYTKOWNICY I PROFIL
  // ==========================

  public getCurrentUser(): UserProfile | null {
    if (!this.currentUserId) return null;
    return this.users.find((u) => u.id === this.currentUserId) || null;
  }

  public getAllUsers(): UserProfile[] {
    return [...this.users];
  }

  public switchDemoUser(userId: string): void {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      this.currentUserId = user.id;
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, user.id);
      this.notify();
    }
  }

  public registerUser(params: {
    id?: string;
    displayName: string;
    email: string;
    approxLocation: string;
    latitude?: number;
    longitude?: number;
    bio?: string;
  }): UserProfile {
    const masked =
      params.latitude && params.longitude
        ? maskCoordinatesSafely(params.latitude, params.longitude)
        : { lat: STARE_STAWY_CENTER.lat, lng: STARE_STAWY_CENTER.lng };

    const newUser: UserProfile = {
      id: params.id || 'usr_' + Date.now(),
      displayName: params.displayName.trim(),
      email: params.email.trim(),
      avatarUrl: `https://api.dicebear.com/7.x/bottts/svg?seed=${encodeURIComponent(params.displayName)}`,
      bio: params.bio?.trim() || 'Mieszkaniec Starych Stawów',
      neighborhood: 'Stare Stawy',
      approxLocation: params.approxLocation || 'Stare Stawy',
      latitude: masked.lat,
      longitude: masked.lng,
      isVerified: false,
      isAdmin: false,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };

    this.users.unshift(newUser);
    this.currentUserId = newUser.id;
    saveLocal(STORAGE_KEYS.USERS, this.users);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, newUser.id);

    // Zapis do Supabase jeśli połączony
    this.pushToCloud('profiles', {
      id: newUser.id,
      display_name: newUser.displayName,
      email: newUser.email,
      avatar_url: newUser.avatarUrl,
      bio: newUser.bio,
      neighborhood: newUser.neighborhood,
      approx_location: newUser.approxLocation,
      latitude: newUser.latitude,
      longitude: newUser.longitude,
      is_verified: newUser.isVerified,
      is_admin: newUser.isAdmin,
      is_blocked: newUser.isBlocked,
    });

    this.notify();
    return newUser;
  }

  public updateProfile(params: Partial<UserProfile>): void {
    const currentUser = this.getCurrentUser();
    if (!currentUser) return;

    this.users = this.users.map((u) => {
      if (u.id === currentUser.id) {
        return {
          ...u,
          ...params,
          isAdmin: u.isAdmin,
          isVerified: u.isVerified,
          isBlocked: u.isBlocked,
        };
      }
      return u;
    });

    saveLocal(STORAGE_KEYS.USERS, this.users);

    this.pushToCloud('profiles', {
      id: currentUser.id,
      display_name: params.displayName || currentUser.displayName,
      bio: params.bio !== undefined ? params.bio : currentUser.bio,
      avatar_url: params.avatarUrl || currentUser.avatarUrl,
      approx_location: params.approxLocation || currentUser.approxLocation,
      latitude: params.latitude || currentUser.latitude,
      longitude: params.longitude || currentUser.longitude,
    });

    this.notify();
  }

  public deleteAccount(userId: string): void {
    this.users = this.users.filter((u) => u.id !== userId);
    this.posts = this.posts.filter((p) => p.userId !== userId);
    this.helpRequests = this.helpRequests.filter((h) => h.userId !== userId);
    this.borrowItems = this.borrowItems.filter((b) => b.userId !== userId);
    this.alerts = this.alerts.filter((a) => a.userId !== userId);
    this.comments = this.comments.filter((c) => c.userId !== userId);

    if (this.currentUserId === userId) {
      this.currentUserId = null;
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    }

    saveLocal(STORAGE_KEYS.USERS, this.users);
    saveLocal(STORAGE_KEYS.POSTS, this.posts);
    saveLocal(STORAGE_KEYS.HELP, this.helpRequests);
    saveLocal(STORAGE_KEYS.BORROW, this.borrowItems);
    saveLocal(STORAGE_KEYS.ALERTS, this.alerts);
    saveLocal(STORAGE_KEYS.COMMENTS, this.comments);
    this.notify();
  }

  public logout(): void {
    this.currentUserId = null;
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);

    const client = getSupabase();
    if (client) {
      client.auth.signOut().catch(() => {});
    }

    this.notify();
  }

  // ==========================
  // TABLICA SĄSIADÓW (POSTS)
  // ==========================

  public getPosts(filters?: {
    category?: string;
    search?: string;
    maxDistanceMeters?: number;
    userLocation?: { lat: number; lng: number } | null;
  }): Post[] {
    const blocked = new Set(this.blocks);

    return this.posts
      .filter((p) => {
        if (p.status === 'hidden') return false;
        if (blocked.has(p.userId)) return false;

        if (filters?.category && filters.category !== 'all' && p.category !== filters.category) {
          return false;
        }

        if (filters?.search) {
          const q = filters.search.toLowerCase().trim();
          const matchTitle = p.title.toLowerCase().includes(q);
          const matchContent = p.content.toLowerCase().includes(q);
          const matchAuthor = p.author.displayName.toLowerCase().includes(q);
          const matchLocation = p.approxLocation.toLowerCase().includes(q);
          if (!matchTitle && !matchContent && !matchAuthor && !matchLocation) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getPostById(postId: string): Post | undefined {
    return this.posts.find((p) => p.id === postId);
  }

  public createPost(params: {
    title: string;
    content: string;
    category: Post['category'];
    price?: number;
    isFree?: boolean;
    condition?: 'new' | 'used' | 'other';
    imageUrl?: string;
    approxLocation: string;
    latitude?: number;
    longitude?: number;
  }): Post {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Musisz być zalogowany, aby dodać ogłoszenie.');

    const masked =
      params.latitude && params.longitude
        ? maskCoordinatesSafely(params.latitude, params.longitude)
        : { lat: user.latitude, lng: user.longitude };

    const newPost: Post = {
      id: 'post_' + Date.now(),
      userId: user.id,
      author: {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        approxLocation: user.approxLocation,
      },
      title: params.title.trim(),
      content: params.content.trim(),
      category: params.category,
      price: params.price !== undefined ? params.price : undefined,
      isFree: params.isFree || params.category === 'oddam',
      condition: params.condition,
      imageUrl: params.imageUrl?.trim() || undefined,
      approxLocation: params.approxLocation || user.approxLocation,
      latitude: masked.lat,
      longitude: masked.lng,
      status: 'active',
      repliesCount: 0,
      createdAt: new Date().toISOString(),
      isDemo: false,
    };

    this.posts.unshift(newPost);
    saveLocal(STORAGE_KEYS.POSTS, this.posts);

    this.pushToCloud('posts', {
      id: newPost.id,
      user_id: user.id,
      title: newPost.title,
      content: newPost.content,
      category: newPost.category,
      price: newPost.price,
      is_free: newPost.isFree,
      image_url: newPost.imageUrl,
      approx_location: newPost.approxLocation,
      latitude: newPost.latitude,
      longitude: newPost.longitude,
      status: 'active',
      replies_count: 0,
      created_at: newPost.createdAt,
    });

    this.notify();
    return newPost;
  }

  public deletePost(postId: string): void {
    const user = this.getCurrentUser();
    const post = this.posts.find((p) => p.id === postId);
    if (!post) return;
    if (user?.id !== post.userId && !user?.isAdmin) {
      throw new Error('Brak uprawnień do usunięcia tego ogłoszenia.');
    }

    this.posts = this.posts.filter((p) => p.id !== postId);
    this.comments = this.comments.filter((c) => c.postId !== postId);
    saveLocal(STORAGE_KEYS.POSTS, this.posts);
    saveLocal(STORAGE_KEYS.COMMENTS, this.comments);

    const client = getSupabase();
    if (client) {
      Promise.resolve(client.from('posts').delete().eq('id', postId)).catch(() => {});
    }

    this.notify();
  }

  // ==========================
  // KOMENTARZE
  // ==========================

  public getComments(postId: string): PostComment[] {
    return this.comments
      .filter((c) => c.postId === postId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public addComment(postId: string, content: string): PostComment {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Zaloguj się, aby dodać odpowiedź.');

    const newComment: PostComment = {
      id: 'cmt_' + Date.now(),
      postId,
      userId: user.id,
      author: {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      },
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    this.comments.push(newComment);

    this.posts = this.posts.map((p) =>
      p.id === postId ? { ...p, repliesCount: (p.repliesCount || 0) + 1 } : p
    );

    saveLocal(STORAGE_KEYS.COMMENTS, this.comments);
    saveLocal(STORAGE_KEYS.POSTS, this.posts);

    this.pushToCloud('post_comments', {
      id: newComment.id,
      post_id: postId,
      user_id: user.id,
      content: newComment.content,
      created_at: newComment.createdAt,
    });

    this.notify();
    return newComment;
  }

  // ==========================
  // POMOC SĄSIEDZKA (HELP)
  // ==========================

  public getHelpRequests(filters?: { category?: string; status?: string }): HelpRequest[] {
    const blocked = new Set(this.blocks);

    return this.helpRequests
      .filter((h) => {
        if (blocked.has(h.userId)) return false;
        if (filters?.category && filters.category !== 'all' && h.category !== filters.category) {
          return false;
        }
        if (filters?.status && filters.status !== 'all' && h.status !== filters.status) {
          return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createHelpRequest(params: {
    title: string;
    description: string;
    category: HelpRequest['category'];
    urgency: HelpRequest['urgency'];
    approxLocation: string;
    latitude?: number;
    longitude?: number;
  }): HelpRequest {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Musisz być zalogowany, aby poprosić o pomoc.');

    const masked =
      params.latitude && params.longitude
        ? maskCoordinatesSafely(params.latitude, params.longitude)
        : { lat: user.latitude, lng: user.longitude };

    const newHelp: HelpRequest = {
      id: 'help_' + Date.now(),
      userId: user.id,
      author: {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        approxLocation: user.approxLocation,
      },
      title: params.title.trim(),
      description: params.description.trim(),
      category: params.category,
      urgency: params.urgency,
      approxLocation: params.approxLocation || user.approxLocation,
      latitude: masked.lat,
      longitude: masked.lng,
      status: 'open',
      createdAt: new Date().toISOString(),
      isDemo: false,
    };

    this.helpRequests.unshift(newHelp);
    saveLocal(STORAGE_KEYS.HELP, this.helpRequests);

    this.pushToCloud('help_requests', {
      id: newHelp.id,
      user_id: user.id,
      title: newHelp.title,
      description: newHelp.description,
      category: newHelp.category,
      urgency: newHelp.urgency,
      approx_location: newHelp.approxLocation,
      latitude: newHelp.latitude,
      longitude: newHelp.longitude,
      status: 'open',
      created_at: newHelp.createdAt,
    });

    this.notify();
    return newHelp;
  }

  public resolveHelpRequest(reqId: string): void {
    const user = this.getCurrentUser();
    this.helpRequests = this.helpRequests.map((h) => {
      if (h.id === reqId && (h.userId === user?.id || user?.isAdmin)) {
        return { ...h, status: 'resolved' };
      }
      return h;
    });
    saveLocal(STORAGE_KEYS.HELP, this.helpRequests);
    this.notify();
  }

  public deleteHelpRequest(reqId: string): void {
    const user = this.getCurrentUser();
    this.helpRequests = this.helpRequests.filter(
      (h) => !(h.id === reqId && (h.userId === user?.id || user?.isAdmin))
    );
    saveLocal(STORAGE_KEYS.HELP, this.helpRequests);
    this.notify();
  }

  // ==========================
  // POŻYCZALNIA (BORROW)
  // ==========================

  public getBorrowItems(filters?: { availability?: string; search?: string }): BorrowItem[] {
    const blocked = new Set(this.blocks);

    return this.borrowItems
      .filter((b) => {
        if (blocked.has(b.userId)) return false;
        if (filters?.availability && filters.availability !== 'all' && b.availability !== filters.availability) {
          return false;
        }
        if (filters?.search) {
          const q = filters.search.toLowerCase().trim();
          const matchName = b.name.toLowerCase().includes(q);
          const matchDesc = b.description.toLowerCase().includes(q);
          if (!matchName && !matchDesc) return false;
        }
        return true;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createBorrowItem(params: {
    name: string;
    description: string;
    rules: string;
    deposit?: string;
    itemCategory?: string;
    imageUrl?: string;
    approxLocation: string;
    latitude?: number;
    longitude?: number;
  }): BorrowItem {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Musisz być zalogowany, aby dodać przedmiot.');

    const masked =
      params.latitude && params.longitude
        ? maskCoordinatesSafely(params.latitude, params.longitude)
        : { lat: user.latitude, lng: user.longitude };

    const newItem: BorrowItem = {
      id: 'borrow_' + Date.now(),
      userId: user.id,
      owner: {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
        approxLocation: user.approxLocation,
      },
      name: params.name.trim(),
      description: params.description.trim(),
      imageUrl: params.imageUrl?.trim() || undefined,
      deposit: params.deposit?.trim() || undefined,
      itemCategory: params.itemCategory || undefined,
      approxLocation: params.approxLocation || user.approxLocation,
      latitude: masked.lat,
      longitude: masked.lng,
      availability: 'available',
      rules: params.rules.trim() || 'Zwrócić w stanie nienaruszonym.',
      createdAt: new Date().toISOString(),
      isDemo: false,
    };

    this.borrowItems.unshift(newItem);
    saveLocal(STORAGE_KEYS.BORROW, this.borrowItems);

    this.pushToCloud('borrow_items', {
      id: newItem.id,
      user_id: user.id,
      name: newItem.name,
      description: newItem.description,
      image_url: newItem.imageUrl,
      approx_location: newItem.approxLocation,
      latitude: newItem.latitude,
      longitude: newItem.longitude,
      availability: newItem.availability,
      rules: newItem.rules,
      created_at: newItem.createdAt,
    });

    this.notify();
    return newItem;
  }

  public toggleBorrowItemAvailability(itemId: string): void {
    const user = this.getCurrentUser();
    this.borrowItems = this.borrowItems.map((b) => {
      if (b.id === itemId && (b.userId === user?.id || user?.isAdmin)) {
        const nextAvail = b.availability === 'available' ? 'borrowed' : 'available';
        return { ...b, availability: nextAvail };
      }
      return b;
    });
    saveLocal(STORAGE_KEYS.BORROW, this.borrowItems);
    this.notify();
  }

  public deleteBorrowItem(itemId: string): void {
    const user = this.getCurrentUser();
    this.borrowItems = this.borrowItems.filter(
      (b) => !(b.id === itemId && (b.userId === user?.id || user?.isAdmin))
    );
    saveLocal(STORAGE_KEYS.BORROW, this.borrowItems);
    this.notify();
  }

  // ==========================
  // ALERTY OSIEDLOWE (ALERTS)
  // ==========================

  public getAlerts(includePending = false): AlertItem[] {
    return this.alerts
      .filter((a) => {
        if (includePending) return true;
        return a.status === 'approved';
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public createAlert(params: {
    title: string;
    description: string;
    category: AlertItem['category'];
    approxLocation: string;
    latitude?: number;
    longitude?: number;
  }): AlertItem {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Musisz być zalogowany, aby zgłosić alert.');

    const masked =
      params.latitude && params.longitude
        ? maskCoordinatesSafely(params.latitude, params.longitude)
        : { lat: user.latitude, lng: user.longitude };

    const newAlert: AlertItem = {
      id: 'alt_' + Date.now(),
      userId: user.id,
      author: {
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isVerified: user.isVerified,
      },
      title: params.title.trim(),
      description: params.description.trim(),
      category: params.category,
      approxLocation: params.approxLocation || 'Stare Stawy',
      latitude: masked.lat,
      longitude: masked.lng,
      status: user.isAdmin ? 'approved' : 'pending',
      createdAt: new Date().toISOString(),
      isDemo: false,
    };

    this.alerts.unshift(newAlert);
    saveLocal(STORAGE_KEYS.ALERTS, this.alerts);

    this.pushToCloud('alerts', {
      id: newAlert.id,
      user_id: user.id,
      title: newAlert.title,
      description: newAlert.description,
      category: newAlert.category,
      approx_location: newAlert.approxLocation,
      latitude: newAlert.latitude,
      longitude: newAlert.longitude,
      status: newAlert.status,
      created_at: newAlert.createdAt,
    });

    this.notify();
    return newAlert;
  }

  public approveAlert(alertId: string): void {
    this.alerts = this.alerts.map((a) => (a.id === alertId ? { ...a, status: 'approved' } : a));
    saveLocal(STORAGE_KEYS.ALERTS, this.alerts);
    this.notify();
  }

  public rejectAlert(alertId: string): void {
    this.alerts = this.alerts.map((a) => (a.id === alertId ? { ...a, status: 'rejected' } : a));
    saveLocal(STORAGE_KEYS.ALERTS, this.alerts);
    this.notify();
  }

  public deleteAlert(alertId: string): void {
    this.alerts = this.alerts.filter((a) => a.id !== alertId);
    saveLocal(STORAGE_KEYS.ALERTS, this.alerts);
    this.notify();
  }

  // ==========================
  // FACHOWCY (PROS)
  // ==========================

  public getProfessionals(category?: string, search?: string): Professional[] {
    return this.pros
      .filter((p) => {
        if (category && category !== 'all' && p.category !== category) return false;
        if (search) {
          const q = search.toLowerCase().trim();
          const matchName = p.name.toLowerCase().includes(q);
          const matchDesc = p.description.toLowerCase().includes(q);
          const matchArea = p.serviceArea.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchArea) return false;
        }
        return true;
      })
      .sort((a, b) => b.rating - a.rating);
  }

  public createProfessional(params: {
    name: string;
    description: string;
    category: Professional['category'];
    serviceArea: string;
    phone?: string;
    website?: string;
    imageUrl?: string;
  }): Professional {
    const user = this.getCurrentUser();

    const newPro: Professional = {
      id: 'pro_' + Date.now(),
      userId: user?.id,
      name: params.name.trim(),
      description: params.description.trim(),
      category: params.category,
      serviceArea: params.serviceArea.trim() || 'Stare Stawy i Oświęcim',
      phone: params.phone?.trim() || undefined,
      website: params.website?.trim() || undefined,
      imageUrl: params.imageUrl?.trim() || undefined,
      isVerified: false,
      rating: 5.0,
      reviewsCount: 0,
      createdAt: new Date().toISOString(),
      isDemo: false,
    };

    this.pros.unshift(newPro);
    saveLocal(STORAGE_KEYS.PROS, this.pros);

    this.pushToCloud('professionals', {
      id: newPro.id,
      user_id: user?.id,
      name: newPro.name,
      description: newPro.description,
      category: newPro.category,
      service_area: newPro.serviceArea,
      phone: newPro.phone,
      website: newPro.website,
      image_url: newPro.imageUrl,
      is_verified: false,
      rating: 5.0,
      reviews_count: 0,
      created_at: newPro.createdAt,
    });

    this.notify();
    return newPro;
  }

  public verifyProfessional(proId: string, isVerified: boolean): void {
    this.pros = this.pros.map((p) => (p.id === proId ? { ...p, isVerified } : p));
    saveLocal(STORAGE_KEYS.PROS, this.pros);
    this.notify();
  }

  public getReviews(proId: string): ProfessionalReview[] {
    return this.reviews
      .filter((r) => r.professionalId === proId && r.status === 'active')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public addReview(proId: string, rating: number, comment: string): ProfessionalReview {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Musisz być zalogowany, aby wystawić opinię.');

    const newRev: ProfessionalReview = {
      id: 'rev_' + Date.now(),
      professionalId: proId,
      userId: user.id,
      authorName: user.displayName,
      rating: Math.max(1, Math.min(5, Math.round(rating))),
      comment: comment.trim(),
      createdAt: new Date().toISOString(),
      status: 'active',
    };

    this.reviews.unshift(newRev);

    const proRevs = this.reviews.filter((r) => r.professionalId === proId && r.status === 'active');
    const avg = proRevs.reduce((acc, curr) => acc + curr.rating, 0) / (proRevs.length || 1);

    this.pros = this.pros.map((p) =>
      p.id === proId
        ? {
            ...p,
            rating: Number(avg.toFixed(1)),
            reviewsCount: proRevs.length,
          }
        : p
    );

    saveLocal(STORAGE_KEYS.REVIEWS, this.reviews);
    saveLocal(STORAGE_KEYS.PROS, this.pros);

    this.pushToCloud('professional_reviews', {
      id: newRev.id,
      professional_id: proId,
      user_id: user.id,
      rating: newRev.rating,
      comment: newRev.comment,
      created_at: newRev.createdAt,
    });

    this.notify();
    return newRev;
  }

  // ==========================
  // WIADOMOŚCI 1:1
  // ==========================

  public getConversations(): Conversation[] {
    const user = this.getCurrentUser();
    if (!user) return [];

    return this.conversations
      .filter((c) => c.participant1Id === user.id || c.participant2Id === user.id)
      .map((c) => {
        const otherId = c.participant1Id === user.id ? c.participant2Id : c.participant1Id;
        const otherUser = this.users.find((u) => u.id === otherId);

        return {
          ...c,
          otherParticipant: {
            id: otherId,
            displayName: otherUser?.displayName || 'Sąsiad ze Starych Stawów',
            avatarUrl: otherUser?.avatarUrl,
            isVerified: otherUser?.isVerified ?? false,
          },
        };
      })
      .sort((a, b) => {
        const timeA = a.lastMessageAt ? new Date(a.lastMessageAt).getTime() : 0;
        const timeB = b.lastMessageAt ? new Date(b.lastMessageAt).getTime() : 0;
        return timeB - timeA;
      });
  }

  public getMessages(conversationId: string): DirectMessage[] {
    return this.messages
      .filter((m) => m.conversationId === conversationId)
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
  }

  public startOrGetConversation(targetUserId: string): Conversation {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Musisz być zalogowany, aby rozpocząć konwersację.');
    if (user.id === targetUserId) throw new Error('Nie możesz pisać do samego siebie.');

    const existing = this.conversations.find(
      (c) =>
        (c.participant1Id === user.id && c.participant2Id === targetUserId) ||
        (c.participant1Id === targetUserId && c.participant2Id === user.id)
    );

    if (existing) {
      return existing;
    }

    const otherUser = this.users.find((u) => u.id === targetUserId);
    const newConv: Conversation = {
      id: 'conv_' + Date.now(),
      participant1Id: user.id,
      participant2Id: targetUserId,
      otherParticipant: {
        id: targetUserId,
        displayName: otherUser?.displayName || 'Sąsiad',
        avatarUrl: otherUser?.avatarUrl,
        isVerified: otherUser?.isVerified ?? false,
      },
      lastMessage: undefined,
      lastMessageAt: new Date().toISOString(),
      unreadCount: 0,
    };

    this.conversations.unshift(newConv);
    saveLocal(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    this.notify();
    return newConv;
  }

  public sendMessage(conversationId: string, content: string): DirectMessage {
    const user = this.getCurrentUser();
    if (!user) throw new Error('Musisz być zalogowany, aby wysłać wiadomość.');

    const conv = this.conversations.find((c) => c.id === conversationId);
    if (!conv) throw new Error('Nie znaleziono konwersacji.');

    const recipientId = conv.participant1Id === user.id ? conv.participant2Id : conv.participant1Id;

    const newMsg: DirectMessage = {
      id: 'msg_' + Date.now(),
      conversationId,
      senderId: user.id,
      recipientId,
      content: content.trim(),
      createdAt: new Date().toISOString(),
    };

    this.messages.push(newMsg);

    this.conversations = this.conversations.map((c) =>
      c.id === conversationId
        ? {
            ...c,
            lastMessage: newMsg.content,
            lastMessageAt: newMsg.createdAt,
          }
        : c
    );

    saveLocal(STORAGE_KEYS.MESSAGES, this.messages);
    saveLocal(STORAGE_KEYS.CONVERSATIONS, this.conversations);

    this.pushToCloud('messages', {
      id: newMsg.id,
      conversation_id: conversationId,
      sender_id: user.id,
      recipient_id: recipientId,
      content: newMsg.content,
      created_at: newMsg.createdAt,
    });

    this.notify();
    return newMsg;
  }

  // ==========================
  // ZGŁOSZENIA I BLOKOWANIE
  // ==========================

  public createReport(params: {
    targetType: ReportItem['targetType'];
    targetId: string;
    targetTitle?: string;
    reason: string;
    notes?: string;
  }): ReportItem {
    const user = this.getCurrentUser();
    const newRep: ReportItem = {
      id: 'rep_' + Date.now(),
      reporterId: user?.id || 'anon',
      targetType: params.targetType,
      targetId: params.targetId,
      targetTitle: params.targetTitle,
      reason: params.reason,
      status: 'pending',
      notes: params.notes,
      createdAt: new Date().toISOString(),
    };

    this.reports.unshift(newRep);
    saveLocal(STORAGE_KEYS.REPORTS, this.reports);
    this.notify();
    return newRep;
  }

  public getReports(): ReportItem[] {
    return [...this.reports];
  }

  public resolveReport(reportId: string, action: 'dismiss' | 'hide_content' | 'block_user'): void {
    const rep = this.reports.find((r) => r.id === reportId);
    if (!rep) return;

    if (action === 'hide_content') {
      if (rep.targetType === 'post') {
        this.posts = this.posts.map((p) => (p.id === rep.targetId ? { ...p, status: 'hidden' } : p));
        saveLocal(STORAGE_KEYS.POSTS, this.posts);
      }
    } else if (action === 'block_user') {
      this.blockUser(rep.targetId);
    }

    this.reports = this.reports.map((r) => (r.id === reportId ? { ...r, status: 'reviewed' } : r));
    saveLocal(STORAGE_KEYS.REPORTS, this.reports);
    this.notify();
  }

  public blockUser(targetUserId: string): void {
    if (!this.blocks.includes(targetUserId)) {
      this.blocks.push(targetUserId);
      saveLocal(STORAGE_KEYS.BLOCKS, this.blocks);
      this.notify();
    }
  }

  public unblockUser(targetUserId: string): void {
    this.blocks = this.blocks.filter((id) => id !== targetUserId);
    saveLocal(STORAGE_KEYS.BLOCKS, this.blocks);
    this.notify();
  }

  public isUserBlocked(targetUserId: string): boolean {
    return this.blocks.includes(targetUserId);
  }

  // ==========================
  // POWIADOMIENIA
  // ==========================

  public getNotifications(): NotificationItem[] {
    const user = this.getCurrentUser();
    if (!user) return [];
    return this.notifications.filter((n) => n.userId === user.id);
  }

  public markNotificationAsRead(id: string): void {
    this.notifications = this.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n));
    saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
  }

  public markAllNotificationsRead(): void {
    const user = this.getCurrentUser();
    if (!user) return;
    this.notifications = this.notifications.map((n) =>
      n.userId === user.id ? { ...n, isRead: true } : n
    );
    saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    this.notify();
  }

  // ==========================
  // ZARZĄDZANIE DANYMI & WDROŻENIE
  // ==========================

  // Wyczyść dane demonstracyjne i przygotuj do prawdziwego startu osiedla
  public clearForProduction(): void {
    const officialAdmin: UserProfile = {
      id: 'admin-rada-stare-stawy',
      displayName: 'Rada Osiedla Stare Stawy',
      email: 'kontakt@starestawy.pl',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=250&q=80',
      bio: 'Oficjalny profil moderatora społeczności osiedla Stare Stawy w Oświęcimiu.',
      neighborhood: 'Stare Stawy',
      approxLocation: 'Stare Stawy (Centrum osiedla)',
      latitude: STARE_STAWY_CENTER.lat,
      longitude: STARE_STAWY_CENTER.lng,
      isVerified: true,
      isAdmin: true,
      isBlocked: false,
      createdAt: new Date().toISOString(),
    };

    const welcomePost: Post = {
      id: 'post-official-welcome',
      userId: officialAdmin.id,
      author: {
        displayName: officialAdmin.displayName,
        avatarUrl: officialAdmin.avatarUrl,
        isVerified: true,
        approxLocation: officialAdmin.approxLocation,
      },
      title: 'Witajcie sąsiedzi na oficjalnej platformie osiedla Stare Stawy!',
      content:
        'Cieszymy się, że jesteś z nami! Ta tablica służy mieszkańcom Starych Stawów do wzajemnej pomocy, bezpiecznego pożyczania narzędzi i sprzętu ogrodowego, alertów osiedlowych oraz sąsiedzkiej wymiany. Zachęcamy do dodawania pierwszych ogłoszeń, przedstawienia się i dbania o nasze wspólne otoczenie!',
      category: 'informacja',
      imageUrl: '/banner-promocyjny.jpg',
      approxLocation: 'Stare Stawy (Centrum osiedla)',
      latitude: STARE_STAWY_CENTER.lat,
      longitude: STARE_STAWY_CENTER.lng,
      status: 'active',
      repliesCount: 0,
      createdAt: new Date().toISOString(),
      isDemo: false,
    };

    const officialAlert: AlertItem = {
      id: 'alert-official-contacts',
      userId: officialAdmin.id,
      author: {
        displayName: officialAdmin.displayName,
        avatarUrl: officialAdmin.avatarUrl,
        isVerified: true,
      },
      title: '📞 Ważne telefony i kontakty alarmowe — Stare Stawy',
      description:
        'Straż Miejska w Oświęcimiu: 986 / 33 842 30 11 • Dzielnicowy KPP Oświęcim: 47 84 55 255 • Pogotowie Wodociągowe PWiK: 994 • Pogotowie Energetyczne Tauron: 991 • Pogotowie Gazowe: 992 • Urząd Miasta Oświęcim: 33 842 91 00',
      category: 'important',
      approxLocation: 'Stare Stawy (Całe Osiedle)',
      latitude: STARE_STAWY_CENTER.lat,
      longitude: STARE_STAWY_CENTER.lng,
      status: 'approved',
      createdAt: new Date().toISOString(),
    };

    const welcomeNotif: NotificationItem = {
      id: 'notif-welcome',
      userId: officialAdmin.id,
      title: 'Witaj na Starych Stawach!',
      body: 'Czysta baza pod oficjalny start osiedla została zainicjowana. Możesz dodawać pierwsze wpisy i zapraszać mieszkańców!',
      type: 'alert',
      isRead: false,
      createdAt: new Date().toISOString(),
    };

    this.users = [officialAdmin];
    this.posts = [welcomePost];
    this.comments = [];
    this.helpRequests = [];
    this.borrowItems = [];
    this.alerts = [officialAlert];
    this.pros = DEMO_PROFESSIONALS; // zachowaj zweryfikowane kontakty do polecanych fachowców z Oświęcimia
    this.reviews = [];
    this.conversations = [];
    this.messages = [];
    this.reports = [];
    this.blocks = [];
    this.notifications = [welcomeNotif];
    this.currentUserId = officialAdmin.id;

    saveLocal(STORAGE_KEYS.USERS, this.users);
    saveLocal(STORAGE_KEYS.POSTS, this.posts);
    saveLocal(STORAGE_KEYS.COMMENTS, this.comments);
    saveLocal(STORAGE_KEYS.HELP, this.helpRequests);
    saveLocal(STORAGE_KEYS.BORROW, this.borrowItems);
    saveLocal(STORAGE_KEYS.ALERTS, this.alerts);
    saveLocal(STORAGE_KEYS.PROS, this.pros);
    saveLocal(STORAGE_KEYS.REVIEWS, this.reviews);
    saveLocal(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    saveLocal(STORAGE_KEYS.MESSAGES, this.messages);
    saveLocal(STORAGE_KEYS.REPORTS, this.reports);
    saveLocal(STORAGE_KEYS.BLOCKS, this.blocks);
    saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId);

    this.notify();
  }

  public isCleanProductionMode(): boolean {
    return this.posts.some((p) => p.id === 'post-official-welcome') && this.posts.length <= 2;
  }

  // Przywróć pełne dane demonstracyjne
  public resetToDemo(): void {
    this.users = DEMO_USERS;
    this.posts = DEMO_POSTS;
    this.comments = DEMO_COMMENTS;
    this.helpRequests = DEMO_HELP_REQUESTS;
    this.borrowItems = DEMO_BORROW_ITEMS;
    this.alerts = DEMO_ALERTS;
    this.pros = DEMO_PROFESSIONALS;
    this.reviews = DEMO_REVIEWS;
    this.conversations = DEMO_CONVERSATIONS;
    this.messages = DEMO_MESSAGES;
    this.reports = [];
    this.blocks = [];
    this.notifications = DEMO_NOTIFICATIONS;
    this.currentUserId = 'user-krzysztof';

    saveLocal(STORAGE_KEYS.USERS, this.users);
    saveLocal(STORAGE_KEYS.POSTS, this.posts);
    saveLocal(STORAGE_KEYS.COMMENTS, this.comments);
    saveLocal(STORAGE_KEYS.HELP, this.helpRequests);
    saveLocal(STORAGE_KEYS.BORROW, this.borrowItems);
    saveLocal(STORAGE_KEYS.ALERTS, this.alerts);
    saveLocal(STORAGE_KEYS.PROS, this.pros);
    saveLocal(STORAGE_KEYS.REVIEWS, this.reviews);
    saveLocal(STORAGE_KEYS.CONVERSATIONS, this.conversations);
    saveLocal(STORAGE_KEYS.MESSAGES, this.messages);
    saveLocal(STORAGE_KEYS.REPORTS, this.reports);
    saveLocal(STORAGE_KEYS.BLOCKS, this.blocks);
    saveLocal(STORAGE_KEYS.NOTIFICATIONS, this.notifications);
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, this.currentUserId);
    this.notify();
  }

  // ==============================================================================
  // UNIFIED OFFERS SEARCH (WSZECHSTRONNA WYSZUKIWARKA OFERT, SPRZĘTU, POMOCY I FACHOWCÓW)
  // ==============================================================================
  public searchOffers(filters: {
    query?: string;
    kind?: 'all' | 'sell' | 'free' | 'buy' | 'borrow' | 'help' | 'pro' | 'alert';
    priceRange?: 'all' | 'free' | 'paid' | 'under50' | 'under100';
    onlyAvailable?: boolean;
    onlyVerified?: boolean;
    onlyWithPhotos?: boolean;
    locationSector?: string;
    sortBy?: 'newest' | 'title_asc' | 'price_asc' | 'price_desc' | 'rating_desc';
  }): UnifiedOffer[] {
    const blocked = new Set(this.blocks);
    const results: UnifiedOffer[] = [];

    // 1. Ogłoszenia tablicy / marketplace
    for (const p of this.posts) {
      if (p.status === 'hidden' || blocked.has(p.userId)) continue;
      results.push({
        id: p.id,
        kind: 'post',
        title: p.title,
        description: p.content,
        category: p.category,
        imageUrl: p.imageUrl,
        price: p.price,
        isFree: p.isFree || p.category === 'oddam',
        status: p.status,
        approxLocation: p.approxLocation,
        latitude: p.latitude,
        longitude: p.longitude,
        author: {
          id: p.userId,
          displayName: p.author.displayName,
          avatarUrl: p.author.avatarUrl,
          isVerified: p.author.isVerified,
          approxLocation: p.author.approxLocation,
        },
        createdAt: p.createdAt,
        rawItem: p,
      });
    }

    // 2. Pożyczalnia sprzętu
    for (const b of this.borrowItems) {
      if (blocked.has(b.userId)) continue;
      results.push({
        id: b.id,
        kind: 'borrow',
        title: b.name,
        description: `${b.description}${b.rules ? ' • Zasady: ' + b.rules : ''}`,
        category: b.itemCategory || 'pożycz',
        imageUrl: b.imageUrl,
        deposit: b.deposit || 'Brak kaucji',
        isFree: true,
        price: 0,
        status: b.availability,
        approxLocation: b.approxLocation,
        latitude: b.latitude,
        longitude: b.longitude,
        author: {
          id: b.userId,
          displayName: b.owner.displayName,
          avatarUrl: b.owner.avatarUrl,
          isVerified: b.owner.isVerified,
          approxLocation: b.owner.approxLocation,
        },
        createdAt: b.createdAt,
        rawItem: b,
      });
    }

    // 3. Prośby o pomoc sąsiedzką
    for (const h of this.helpRequests) {
      if (blocked.has(h.userId)) continue;
      results.push({
        id: h.id,
        kind: 'help',
        title: h.title,
        description: h.description,
        category: h.category,
        urgency: h.urgency,
        status: h.status,
        approxLocation: h.approxLocation,
        latitude: h.latitude,
        longitude: h.longitude,
        author: {
          id: h.userId,
          displayName: h.author.displayName,
          avatarUrl: h.author.avatarUrl,
          isVerified: h.author.isVerified,
          approxLocation: h.author.approxLocation,
        },
        createdAt: h.createdAt,
        rawItem: h,
      });
    }

    // 4. Lokalni fachowcy
    for (const pro of this.pros) {
      results.push({
        id: pro.id,
        kind: 'pro',
        title: pro.name,
        description: `${pro.description} • Obszar: ${pro.serviceArea}`,
        category: pro.category,
        imageUrl: pro.imageUrl,
        rating: pro.rating,
        reviewsCount: pro.reviewsCount,
        status: 'active',
        approxLocation: pro.serviceArea,
        latitude: STARE_STAWY_CENTER.lat,
        longitude: STARE_STAWY_CENTER.lng,
        author: {
          id: pro.userId || pro.id,
          displayName: pro.name,
          avatarUrl: pro.imageUrl,
          isVerified: pro.isVerified,
          approxLocation: pro.serviceArea,
          phone: pro.phone,
        },
        createdAt: pro.createdAt,
        rawItem: pro,
      });
    }

    // 5. Alerty
    for (const a of this.alerts) {
      if (blocked.has(a.userId)) continue;
      results.push({
        id: a.id,
        kind: 'alert',
        title: a.title,
        description: a.description,
        category: a.category,
        status: a.status,
        approxLocation: a.approxLocation,
        latitude: a.latitude,
        longitude: a.longitude,
        author: {
          id: a.userId,
          displayName: a.author.displayName,
          avatarUrl: a.author.avatarUrl,
          isVerified: a.author.isVerified,
          approxLocation: a.approxLocation,
        },
        createdAt: a.createdAt,
        rawItem: a,
      });
    }

    // Filtrowanie
    let filtered = results;

    // Filtruj tekst (query)
    if (filters.query && filters.query.trim()) {
      const q = filters.query.toLowerCase().trim();
      const tokens = q.split(/\s+/).filter(Boolean);
      filtered = filtered.filter((item) => {
        const fullText = `${item.title} ${item.description} ${item.category} ${item.author.displayName} ${item.approxLocation}`.toLowerCase();
        return tokens.every((token) => fullText.includes(token));
      });
    }

    // Filtruj rodzaj oferty (kind)
    if (filters.kind && filters.kind !== 'all') {
      if (filters.kind === 'sell') {
        filtered = filtered.filter((i) => i.kind === 'post' && i.category === 'sprzedam');
      } else if (filters.kind === 'free') {
        filtered = filtered.filter((i) => i.isFree || i.category === 'oddam');
      } else if (filters.kind === 'buy') {
        filtered = filtered.filter((i) => i.kind === 'post' && i.category === 'kupie');
      } else if (filters.kind === 'borrow') {
        filtered = filtered.filter((i) => i.kind === 'borrow' || i.category === 'pozycze');
      } else if (filters.kind === 'help') {
        filtered = filtered.filter((i) => i.kind === 'help' || i.category === 'pomoc');
      } else if (filters.kind === 'pro') {
        filtered = filtered.filter((i) => i.kind === 'pro');
      } else if (filters.kind === 'alert') {
        filtered = filtered.filter((i) => i.kind === 'alert' || i.category === 'zguba');
      }
    }

    // Filtruj zakres cenowy
    if (filters.priceRange && filters.priceRange !== 'all') {
      if (filters.priceRange === 'free') {
        filtered = filtered.filter((i) => i.isFree || (i.price !== undefined && i.price === 0));
      } else if (filters.priceRange === 'paid') {
        filtered = filtered.filter((i) => i.price !== undefined && i.price > 0);
      } else if (filters.priceRange === 'under50') {
        filtered = filtered.filter((i) => i.price !== undefined && i.price > 0 && i.price <= 50);
      } else if (filters.priceRange === 'under100') {
        filtered = filtered.filter((i) => i.price !== undefined && i.price > 0 && i.price <= 100);
      }
    }

    // Tylko dostępne teraz
    if (filters.onlyAvailable) {
      filtered = filtered.filter((i) => {
        if (i.kind === 'borrow') return i.status === 'available';
        if (i.kind === 'help') return i.status === 'open';
        if (i.kind === 'post') return i.status === 'active';
        return true;
      });
    }

    // Tylko zweryfikowani
    if (filters.onlyVerified) {
      filtered = filtered.filter((i) => i.author.isVerified);
    }

    // Tylko ze zdjęciem
    if (filters.onlyWithPhotos) {
      filtered = filtered.filter((i) => !!i.imageUrl);
    }

    // Rejon osiedla
    if (filters.locationSector && filters.locationSector !== 'all') {
      const sec = filters.locationSector.toLowerCase();
      filtered = filtered.filter((i) => i.approxLocation.toLowerCase().includes(sec));
    }

    // Sortowanie
    const sort = filters.sortBy || 'newest';
    filtered.sort((a, b) => {
      if (sort === 'title_asc') {
        return a.title.localeCompare(b.title, 'pl');
      }
      if (sort === 'price_asc') {
        const pa = a.price !== undefined ? a.price : a.isFree ? 0 : 999999;
        const pb = b.price !== undefined ? b.price : b.isFree ? 0 : 999999;
        return pa - pb;
      }
      if (sort === 'price_desc') {
        const pa = a.price !== undefined ? a.price : a.isFree ? 0 : -1;
        const pb = b.price !== undefined ? b.price : b.isFree ? 0 : -1;
        return pb - pa;
      }
      if (sort === 'rating_desc') {
        return (b.rating || 0) - (a.rating || 0);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

    return filtered;
  }

  // Eksport całej bazy do pliku JSON
  public exportDatabaseJson(): string {
    const backup = {
      exportedAt: new Date().toISOString(),
      neighborhood: 'Stare Stawy, Oświęcim',
      users: this.users,
      posts: this.posts,
      comments: this.comments,
      helpRequests: this.helpRequests,
      borrowItems: this.borrowItems,
      alerts: this.alerts,
      professionals: this.pros,
      reviews: this.reviews,
      conversations: this.conversations,
      messages: this.messages,
    };
    return JSON.stringify(backup, null, 2);
  }

  // Import bazy z pliku JSON
  public importDatabaseJson(jsonStr: string): boolean {
    try {
      const data = JSON.parse(jsonStr);
      if (Array.isArray(data.users)) this.users = data.users;
      if (Array.isArray(data.posts)) this.posts = data.posts;
      if (Array.isArray(data.comments)) this.comments = data.comments;
      if (Array.isArray(data.helpRequests)) this.helpRequests = data.helpRequests;
      if (Array.isArray(data.borrowItems)) this.borrowItems = data.borrowItems;
      if (Array.isArray(data.alerts)) this.alerts = data.alerts;
      if (Array.isArray(data.professionals)) this.pros = data.professionals;
      if (Array.isArray(data.reviews)) this.reviews = data.reviews;

      saveLocal(STORAGE_KEYS.USERS, this.users);
      saveLocal(STORAGE_KEYS.POSTS, this.posts);
      saveLocal(STORAGE_KEYS.COMMENTS, this.comments);
      saveLocal(STORAGE_KEYS.HELP, this.helpRequests);
      saveLocal(STORAGE_KEYS.BORROW, this.borrowItems);
      saveLocal(STORAGE_KEYS.ALERTS, this.alerts);
      saveLocal(STORAGE_KEYS.PROS, this.pros);
      saveLocal(STORAGE_KEYS.REVIEWS, this.reviews);

      this.notify();
      return true;
    } catch {
      return false;
    }
  }
}

export const store = new Store();
