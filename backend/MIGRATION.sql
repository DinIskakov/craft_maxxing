-- ============================================
-- Database Migration
-- Run this in Supabase SQL Editor
-- ============================================

-- Add response_deadline column to challenges table
ALTER TABLE public.challenges 
ADD COLUMN IF NOT EXISTS response_deadline TIMESTAMPTZ;

-- Update the status constraint to include 'expired'
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_status_check;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_status_check 
    CHECK (status IN ('pending', 'accepted', 'declined', 'active', 'completed', 'cancelled', 'expired'));

-- Create challenge_links table if it doesn't exist
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

-- Add RLS policies for friends table if not exists
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friends' AND policyname = 'Users can view their friendships') THEN
        CREATE POLICY "Users can view their friendships" ON public.friends
            FOR SELECT USING (auth.uid() = user_id OR auth.uid() = friend_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friends' AND policyname = 'Users can insert friend requests') THEN
        CREATE POLICY "Users can insert friend requests" ON public.friends
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friends' AND policyname = 'Users can update friend requests') THEN
        CREATE POLICY "Users can update friend requests" ON public.friends
            FOR UPDATE USING (auth.uid() = user_id OR auth.uid() = friend_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'friends' AND policyname = 'Users can delete friendships') THEN
        CREATE POLICY "Users can delete friendships" ON public.friends
            FOR DELETE USING (auth.uid() = user_id OR auth.uid() = friend_id);
    END IF;
END $$;

-- Add RLS policies for challenge_links
ALTER TABLE public.challenge_links ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenge_links' AND policyname = 'Anyone can view challenge links by code') THEN
        CREATE POLICY "Anyone can view challenge links by code" ON public.challenge_links
            FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenge_links' AND policyname = 'Users can create challenge links') THEN
        CREATE POLICY "Users can create challenge links" ON public.challenge_links
            FOR INSERT WITH CHECK (auth.uid() = creator_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'challenge_links' AND policyname = 'Users can update their challenge links') THEN
        CREATE POLICY "Users can update their challenge links" ON public.challenge_links
            FOR UPDATE USING (auth.uid() = creator_id OR auth.uid() = used_by);
    END IF;
END $$;

-- Enable RLS on friends table if not enabled
ALTER TABLE public.friends ENABLE ROW LEVEL SECURITY;

-- Done!
SELECT 'Migration complete!' as status;
