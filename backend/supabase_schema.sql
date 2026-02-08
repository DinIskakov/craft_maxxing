-- ============================================
-- CraftMaxxing Database Schema (Simplified)
-- Run this in Supabase SQL Editor
-- Dashboard → SQL Editor → New Query → Paste & Run
-- ============================================

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT,
    avatar_url TEXT,
    bio TEXT,
    total_wins INTEGER DEFAULT 0,
    total_losses INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for username search
CREATE INDEX IF NOT EXISTS profiles_username_idx ON public.profiles(username);

-- 2. CHALLENGES TABLE
CREATE TABLE IF NOT EXISTS public.challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    opponent_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    challenger_skill TEXT NOT NULL,
    opponent_skill TEXT NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'active', 'completed', 'cancelled', 'expired')),
    response_deadline TIMESTAMPTZ,
    winner_id UUID REFERENCES public.profiles(id),
    message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_challenge CHECK (challenger_id != opponent_id)
);

CREATE INDEX IF NOT EXISTS challenges_challenger_idx ON public.challenges(challenger_id);
CREATE INDEX IF NOT EXISTS challenges_opponent_idx ON public.challenges(opponent_id);
CREATE INDEX IF NOT EXISTS challenges_status_idx ON public.challenges(status);

-- 3. CHALLENGE PROGRESS TABLE
CREATE TABLE IF NOT EXISTS public.challenge_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenge_id UUID NOT NULL REFERENCES public.challenges(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    completed_days INTEGER DEFAULT 0,
    total_days INTEGER DEFAULT 30,
    last_checkin TIMESTAMPTZ,
    completion_percentage DECIMAL(5,2) DEFAULT 0,
    daily_log JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(challenge_id, user_id)
);

CREATE INDEX IF NOT EXISTS challenge_progress_challenge_idx ON public.challenge_progress(challenge_id);
CREATE INDEX IF NOT EXISTS challenge_progress_user_idx ON public.challenge_progress(user_id);

-- 4. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    message TEXT,
    data JSONB,
    read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS notifications_user_idx ON public.notifications(user_id);

-- 5. FRIENDS TABLE
CREATE TABLE IF NOT EXISTS public.friends (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    friend_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'blocked')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT no_self_friend CHECK (user_id != friend_id),
    UNIQUE(user_id, friend_id)
);

CREATE INDEX IF NOT EXISTS friends_user_idx ON public.friends(user_id);
CREATE INDEX IF NOT EXISTS friends_friend_idx ON public.friends(friend_id);
CREATE INDEX IF NOT EXISTS friends_status_idx ON public.friends(status);

-- 6. CHALLENGE LINKS TABLE (shareable invite links)
CREATE TABLE IF NOT EXISTS public.challenge_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    skill TEXT NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    message TEXT,
    code TEXT UNIQUE NOT NULL,
    used_by UUID REFERENCES public.profiles(id),
    challenge_id UUID REFERENCES public.challenges(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '7 days')
);

CREATE INDEX IF NOT EXISTS challenge_links_code_idx ON public.challenge_links(code);
CREATE INDEX IF NOT EXISTS challenge_links_creator_idx ON public.challenge_links(creator_id);

-- ============================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.challenge_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- PROFILES policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

-- CHALLENGES policies
CREATE POLICY "Users can view their challenges" ON public.challenges
    FOR SELECT USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

CREATE POLICY "Users can create challenges" ON public.challenges
    FOR INSERT WITH CHECK (auth.uid() = challenger_id);

CREATE POLICY "Users can update their challenges" ON public.challenges
    FOR UPDATE USING (auth.uid() = challenger_id OR auth.uid() = opponent_id);

-- CHALLENGE PROGRESS policies
CREATE POLICY "Users can view challenge progress" ON public.challenge_progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.challenges c 
            WHERE c.id = challenge_id 
            AND (c.challenger_id = auth.uid() OR c.opponent_id = auth.uid())
        )
    );

CREATE POLICY "Users can update own progress" ON public.challenge_progress
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON public.challenge_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- NOTIFICATIONS policies  
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Anyone can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- FRIENDS policies
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their friendships" ON public.friends
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can insert friend requests" ON public.friends
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update friend requests" ON public.friends
    FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);

CREATE POLICY "Users can delete friendships" ON public.friends
    FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);

-- CHALLENGE LINKS policies
ALTER TABLE public.challenge_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view challenge links by code" ON public.challenge_links
    FOR SELECT USING (true);

CREATE POLICY "Users can create challenge links" ON public.challenge_links
    FOR INSERT WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Users can update their challenge links" ON public.challenge_links
    FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = used_by);

-- ============================================
-- DONE! Tables created successfully.
-- ============================================
