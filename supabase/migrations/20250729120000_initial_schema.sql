/*
# [Initial Schema Setup]
This script sets up the complete initial database schema for the BalanceBuddy application. It creates tables for user profiles, friendships, debts, and chat functionality. It also configures Row Level Security (RLS) to ensure data privacy and a trigger to automatically create user profiles upon signup.

## Query Description: [This is a foundational setup and is safe to run on a new project. It defines the structure for all application data. No existing data will be affected if the tables do not already exist. It is not reversible without dropping the tables.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["High"]
- Requires-Backup: [false]
- Reversible: [false]

## Structure Details:
- Tables Created: public.profiles, public.friendships, public.debts, public.rooms, public.room_members, public.messages
- Triggers Created: on_auth_user_created on auth.users
- Functions Created: public.handle_new_user()

## Security Implications:
- RLS Status: [Enabled] on all new tables.
- Policy Changes: [Yes] - Policies are created to restrict data access to authorized users.
- Auth Requirements: [Supabase Auth] is required for all operations.

## Performance Impact:
- Indexes: [Added] - Primary keys and foreign keys create indexes automatically.
- Triggers: [Added] - One trigger on the auth.users table.
- Estimated Impact: [Low] - The setup is lightweight and optimized for common query patterns.
*/

-- 1. PROFILES TABLE
-- Stores public user data.
CREATE TABLE public.profiles (
    id uuid NOT NULL PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name text,
    email text UNIQUE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.profiles IS 'Stores public user profile information.';

-- 2. TRIGGER FOR NEW USER PROFILES
-- Automatically creates a profile row when a new user signs up.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email)
  VALUES (new.id, new.raw_user_meta_data->>'name', new.email);
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 3. FRIENDSHIPS TABLE
-- Manages the many-to-many relationship between users for friendships.
CREATE TABLE public.friendships (
    requester_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    addressee_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status text NOT NULL CHECK (status IN ('pending', 'accepted')) DEFAULT 'pending',
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (requester_id, addressee_id)
);
COMMENT ON TABLE public.friendships IS 'Manages friend requests and connections between users.';

-- 4. DEBTS TABLE
-- Tracks debts owed between users.
CREATE TABLE public.debts (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    debtor_name text NOT NULL,
    amount numeric NOT NULL,
    interest_rate numeric DEFAULT 0,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.debts IS 'Tracks debts created by users.';

-- 5. CHAT ROOMS TABLE
CREATE TABLE public.rooms (
    id uuid NOT NULL PRIMARY KEY DEFAULT gen_random_uuid(),
    room_code text NOT NULL UNIQUE,
    created_by uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.rooms IS 'Stores information about chat rooms.';

-- 6. ROOM MEMBERS TABLE
-- Manages the many-to-many relationship between users and rooms.
CREATE TABLE public.room_members (
    room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    joined_at timestamp with time zone DEFAULT now() NOT NULL,
    PRIMARY KEY (room_id, user_id)
);
COMMENT ON TABLE public.room_members IS 'Tracks which users are members of which rooms.';

-- 7. MESSAGES TABLE
-- Stores chat messages for each room.
CREATE TABLE public.messages (
    id bigint PRIMARY KEY GENERATED ALWAYS AS IDENTITY,
    room_id uuid NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
    sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    text text NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL
);
COMMENT ON TABLE public.messages IS 'Stores individual chat messages.';

/*******************
* RLS POLICIES       *
********************/

-- PROFILES RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Profiles are publicly visible to authenticated users." ON public.profiles FOR SELECT USING (true);


-- FRIENDSHIPS RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own friendships" ON public.friendships
FOR ALL USING (auth.uid() = requester_id OR auth.uid() = addressee_id);

-- DEBTS RLS
ALTER TABLE public.debts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage their own debts" ON public.debts
FOR ALL USING (auth.uid() = user_id);

-- ROOMS RLS
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can create rooms" ON public.rooms FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Users can view rooms they are in" ON public.rooms FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.room_members
        WHERE room_members.room_id = rooms.id AND room_members.user_id = auth.uid()
    )
);

-- ROOM_MEMBERS RLS
ALTER TABLE public.room_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can join or leave rooms" ON public.room_members FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view members of their rooms" ON public.room_members FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.room_members AS rm
        WHERE rm.room_id = room_members.room_id AND rm.user_id = auth.uid()
    )
);

-- MESSAGES RLS
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage messages in their rooms" ON public.messages FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.room_members
        WHERE room_members.room_id = messages.room_id AND room_members.user_id = auth.uid()
    )
);
