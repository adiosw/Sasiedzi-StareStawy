-- ==============================================================================
-- STARE STAWY — SĄSIEDZI: SUPABASE DATABASE SCHEMA & RLS POLICIES
-- Ultra-lokalna platforma dla mieszkańców osiedla Stare Stawy w Oświęcimiu
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUMS & TYPES
DO $$ BEGIN
    CREATE TYPE post_category AS ENUM (
        'oddam', 'sprzedam', 'kupie', 'pozycze', 'szukam', 'pomoc', 'zguba', 'pytanie', 'informacja', 'inne'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE help_category AS ENUM (
        'transport', 'fizyczna', 'zakupy', 'naprawa', 'opieka', 'inna'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE help_urgency AS ENUM (
        'normal', 'urgent', 'critical'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE alert_category AS ENUM (
        'road', 'outage', 'pet', 'lost', 'important', 'other'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    display_name TEXT NOT NULL,
    email TEXT,
    avatar_url TEXT,
    bio TEXT,
    neighborhood TEXT NOT NULL DEFAULT 'Stare Stawy',
    approx_location TEXT NOT NULL DEFAULT 'Stare Stawy',
    latitude NUMERIC(8, 4),
    longitude NUMERIC(8, 4),
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    is_admin BOOLEAN NOT NULL DEFAULT FALSE,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE
);

-- Trigger to automatically create a profile in public.profiles when auth.users is created
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name, email, avatar_url, approx_location, neighborhood, is_verified, is_admin)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    new.email,
    COALESCE(new.raw_user_meta_data->>'avatar_url', 'https://api.dicebear.com/7.x/bottts/svg?seed=' || new.id),
    COALESCE(new.raw_user_meta_data->>'approx_location', 'Stare Stawy'),
    'Stare Stawy',
    FALSE,
    FALSE
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    display_name = COALESCE(public.profiles.display_name, EXCLUDED.display_name);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 4. POSTS (Tablica Sąsiadów)
CREATE TABLE IF NOT EXISTS public.posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category post_category NOT NULL DEFAULT 'informacja',
    image_url TEXT,
    approx_location TEXT NOT NULL DEFAULT 'Stare Stawy',
    latitude NUMERIC(8, 4),
    longitude NUMERIC(8, 4),
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'archived', 'hidden'
    replies_count INT NOT NULL DEFAULT 0,
    deleted_at TIMESTAMPTZ
);

-- 5. POST COMMENTS
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL
);

-- 6. HELP REQUESTS (Pomoc Lokalna)
CREATE TABLE IF NOT EXISTS public.help_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category help_category NOT NULL DEFAULT 'inna',
    urgency help_urgency NOT NULL DEFAULT 'normal',
    approx_location TEXT NOT NULL DEFAULT 'Stare Stawy',
    latitude NUMERIC(8, 4),
    longitude NUMERIC(8, 4),
    status TEXT NOT NULL DEFAULT 'open' -- 'open', 'resolved', 'closed'
);

-- 7. BORROW ITEMS (Pożyczalnia Rzeczy)
CREATE TABLE IF NOT EXISTS public.borrow_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT,
    approx_location TEXT NOT NULL DEFAULT 'Stare Stawy',
    latitude NUMERIC(8, 4),
    longitude NUMERIC(8, 4),
    availability TEXT NOT NULL DEFAULT 'available', -- 'available', 'borrowed', 'reserved'
    rules TEXT NOT NULL DEFAULT 'Zwrócić czyste i sprawne, maksymalnie do 3 dni.'
);

-- 8. ALERTS (Alerty Osiedlowe)
CREATE TABLE IF NOT EXISTS public.alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    category alert_category NOT NULL DEFAULT 'important',
    approx_location TEXT NOT NULL DEFAULT 'Stare Stawy',
    latitude NUMERIC(8, 4),
    longitude NUMERIC(8, 4),
    status TEXT NOT NULL DEFAULT 'approved', -- 'pending', 'approved', 'resolved', 'rejected'
    approved_by UUID REFERENCES public.profiles(id)
);

-- 9. PROFESSIONALS (Lokalni Fachowcy)
CREATE TABLE IF NOT EXISTS public.professionals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'remonty',
    service_area TEXT NOT NULL DEFAULT 'Stare Stawy i Oświęcim',
    phone TEXT,
    website TEXT,
    image_url TEXT,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    rating NUMERIC(3, 2) NOT NULL DEFAULT 5.0,
    reviews_count INT NOT NULL DEFAULT 0
);

-- 10. PROFESSIONAL REVIEWS
CREATE TABLE IF NOT EXISTS public.professional_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    professional_id UUID NOT NULL REFERENCES public.professionals(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active'
);

-- 11. CONVERSATIONS & MESSAGES (1:1)
CREATE TABLE IF NOT EXISTS public.conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    participant1_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    participant2_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    last_message TEXT,
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_participants UNIQUE (participant1_id, participant2_id)
);

CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    read_at TIMESTAMPTZ
);

-- 12. REPORTS & MODERATION
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reporter_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_type TEXT NOT NULL, -- 'post', 'comment', 'help_request', 'borrow_item', 'alert', 'user', 'conversation'
    target_id TEXT NOT NULL,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'reviewed', 'dismissed'
    notes TEXT
);

-- 13. USER BLOCKS
CREATE TABLE IF NOT EXISTS public.user_blocks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    blocker_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    blocked_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    CONSTRAINT unique_block UNIQUE (blocker_id, blocked_id)
);

-- 14. NOTIFICATIONS
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'message',
    link TEXT,
    is_read BOOLEAN NOT NULL DEFAULT FALSE
);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.help_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.borrow_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professionals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.professional_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Helper function: Is current user an admin?
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND is_admin = TRUE
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles: Anyone can read profiles (public view), users can update only their own (except is_admin and is_verified)
CREATE POLICY "Public profiles are readable" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id
        AND is_admin = (SELECT is_admin FROM public.profiles WHERE id = auth.uid())
        AND is_verified = (SELECT is_verified FROM public.profiles WHERE id = auth.uid())
    );

CREATE POLICY "Admins have full access to profiles" ON public.profiles
    FOR ALL USING (public.is_admin());

-- Posts: Active posts are visible to all authenticated / public users, owner can insert/update/delete
CREATE POLICY "Active posts are readable" ON public.posts
    FOR SELECT USING (status != 'hidden' OR auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Authenticated users can insert posts" ON public.posts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts" ON public.posts
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete own posts" ON public.posts
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Comments
CREATE POLICY "Comments are readable" ON public.post_comments
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create comments" ON public.post_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments" ON public.post_comments
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Help Requests
CREATE POLICY "Help requests are readable" ON public.help_requests
    FOR SELECT USING (true);

CREATE POLICY "Users can insert help requests" ON public.help_requests
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own help requests" ON public.help_requests
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete own help requests" ON public.help_requests
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Borrow Items
CREATE POLICY "Borrow items are readable" ON public.borrow_items
    FOR SELECT USING (true);

CREATE POLICY "Users can insert borrow items" ON public.borrow_items
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own borrow items" ON public.borrow_items
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can delete own borrow items" ON public.borrow_items
    FOR DELETE USING (auth.uid() = user_id OR public.is_admin());

-- Alerts: Approved alerts readable by all, users can create pending/approved alerts, admins manage
CREATE POLICY "Approved alerts are readable" ON public.alerts
    FOR SELECT USING (status = 'approved' OR auth.uid() = user_id OR public.is_admin());

CREATE POLICY "Users can insert alerts" ON public.alerts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins or owners can update alerts" ON public.alerts
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Professionals: Readable by all, created by authenticated users or admins
CREATE POLICY "Professionals are readable" ON public.professionals
    FOR SELECT USING (true);

CREATE POLICY "Users can submit professional profile" ON public.professionals
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins or owners can update professional profile" ON public.professionals
    FOR UPDATE USING (auth.uid() = user_id OR public.is_admin());

-- Reviews
CREATE POLICY "Reviews are readable" ON public.professional_reviews
    FOR SELECT USING (status = 'active' OR public.is_admin());

CREATE POLICY "Users can write reviews" ON public.professional_reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Conversations & Messages
CREATE POLICY "Users can see conversations they belong to" ON public.conversations
    FOR SELECT USING (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can create conversations" ON public.conversations
    FOR INSERT WITH CHECK (auth.uid() = participant1_id OR auth.uid() = participant2_id);

CREATE POLICY "Users can read their messages" ON public.messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Users can send messages" ON public.messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

-- Reports: Users can create reports, only admins can view and resolve
CREATE POLICY "Users can file reports" ON public.reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Admins can view and manage reports" ON public.reports
    FOR ALL USING (public.is_admin());

-- Blocks: Users can view and manage their own blocks
CREATE POLICY "Users can view and manage their blocks" ON public.user_blocks
    FOR ALL USING (auth.uid() = blocker_id);

-- Notifications: Users see only their own notifications
CREATE POLICY "Users view own notifications" ON public.notifications
    FOR ALL USING (auth.uid() = user_id);

-- ==============================================================================
-- 15. STORAGE BUCKET CONFIGURATION (Wgrywanie zdjęć i plików)
-- ==============================================================================
-- Utworzenie publicznego zasobnika na zdjęcia ogłoszeń, awatary i pożyczalnię
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'neighborhood-uploads',
    'neighborhood-uploads',
    TRUE,
    5242880, -- max 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = TRUE,
    file_size_limit = 5242880,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Polityka: Każdy może przeglądać zdjęcia
DO $$ BEGIN
    CREATE POLICY "Public neighborhood images are readable"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'neighborhood-uploads');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Polityka: Zalogowani użytkownicy mogą wgrywać zdjęcia
DO $$ BEGIN
    CREATE POLICY "Authenticated users can upload neighborhood images"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'neighborhood-uploads' AND auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Polityka: Właściciel pliku może go usunąć
DO $$ BEGIN
    CREATE POLICY "Users can delete own neighborhood images"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'neighborhood-uploads' AND auth.uid()::text = (storage.foldername(name))[1]);
EXCEPTION WHEN duplicate_object THEN null; END $$;
-- ==============================================================================
-- STARE STAWY — SĄSIEDZI: DANE STARTOWE (SEED SQL DLA SUPABASE)
-- Uruchom ten plik w Supabase SQL Editor po wykonaniu 'schema.sql'
-- ==============================================================================

-- 1. ZWERYFIKOWANI LOKALNI FACHOWCY NA OSIEDLU
INSERT INTO public.professionals (id, name, description, category, service_area, phone, is_verified, rating, reviews_count)
VALUES
  (
    '11111111-1111-1111-1111-111111111101',
    'Marek Kwiecień — Hydraulika & Ogrzewanie',
    'Mieszkaniec Starych Stawów. Pogotowie hydrauliczne, wymiana zaworów, montaż baterii, naprawa spłuczek i instalacji c.o. Szybki dojazd na osiedlu.',
    'hydraulik',
    'Stare Stawy, Zasole, Oświęcim',
    '+48 601 234 567',
    TRUE,
    4.95,
    18
  ),
  (
    '11111111-1111-1111-1111-111111111102',
    'Stanisław Nowak — Usługi Elektryczne SEP',
    'Pomiary instalacji, wymiana bezpieczników, podłączanie płyt indukcyjnych z pieczątką gwarancyjną, montaż oświetlenia LED i gniazdek.',
    'elektryk',
    'Stare Stawy, Błonie, Oświęcim',
    '+48 603 987 654',
    TRUE,
    4.88,
    12
  ),
  (
    '11111111-1111-1111-1111-111111111103',
    'Piotr Zieliński — Usługi Ogrodnicze & Pielęgnacja',
    'Koszenie trawników, wertykulacja, cięcie żywopłotów i drzew owocowych, porządki wiosenno-jesienne w ogrodach przydomowych.',
    'ogrodnictwo',
    'Stare Stawy i okolice Oświęcimia',
    '+48 605 555 444',
    TRUE,
    5.00,
    9
  )
ON CONFLICT (id) DO NOTHING;

