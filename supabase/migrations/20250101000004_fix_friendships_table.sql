/*
# [Fix] Correct Friendships Table Schema
This migration corrects the schema for the `friendships` table by adding the necessary columns and foreign key constraints to link it to the `profiles` table. This fixes the "column does not exist" error during migration and resolves the "Could not find a relationship" error in the application.

## Query Description:
This script performs the following safe, structural changes:
1. Adds `user1_id` and `user2_id` columns to the `friendships` table if they don't already exist.
2. Drops any potentially lingering, incorrect foreign key constraints from previous failed attempts.
3. Creates the correct foreign key constraints, linking `user1_id` and `user2_id` to the `id` column in the `profiles` table.
4. Adds indexes to these new columns to ensure query performance.
This operation is structural and does not risk data loss.

## Metadata:
- Schema-Category: "Structural"
- Impact-Level: "Low"
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table: `public.friendships`
- Columns Added: `user1_id` (UUID), `user2_id` (UUID)
- Constraints Added: `friendships_user1_id_fkey`, `friendships_user2_id_fkey`
- Indexes Added: `idx_friendships_user1_id`, `idx_friendships_user2_id`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: Added on `user1_id` and `user2_id` to improve join performance when fetching friend data.
- Estimated Impact: Positive. Queries on the friends page will be faster and more efficient.
*/

-- Step 1: Add columns if they don't exist
ALTER TABLE public.friendships
ADD COLUMN IF NOT EXISTS user1_id UUID,
ADD COLUMN IF NOT EXISTS user2_id UUID;

-- Step 2: Drop old, potentially incorrect constraints to ensure a clean slate
ALTER TABLE public.friendships
DROP CONSTRAINT IF EXISTS friendships_user1_id_fkey,
DROP CONSTRAINT IF EXISTS friendships_user2_id_fkey;

-- Step 3: Add the correct foreign key constraints
ALTER TABLE public.friendships
ADD CONSTRAINT friendships_user1_id_fkey
FOREIGN KEY (user1_id) REFERENCES public.profiles(id) ON DELETE CASCADE,
ADD CONSTRAINT friendships_user2_id_fkey
FOREIGN KEY (user2_id) REFERENCES public.profiles(id) ON DELETE CASCADE;

-- Step 4: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_friendships_user1_id ON public.friendships(user1_id);
CREATE INDEX IF NOT EXISTS idx_friendships_user2_id ON public.friendships(user2_id);
