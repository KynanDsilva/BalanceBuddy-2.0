/*
# [Add Foreign Keys to Friendships Table]
This migration establishes the formal relationship between the `friendships` table and the `profiles` table by adding foreign key constraints.

## Query Description:
This operation adds two foreign key constraints to the `friendships` table. It links the `user1_id` and `user2_id` columns to the `id` column of the `profiles` table. This is a non-destructive operation that enforces data integrity, ensuring that every friendship record is linked to valid user profiles. It also adds `ON DELETE CASCADE`, which means if a user profile is deleted, their associated friendship records will also be automatically removed.

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Low"]
- Requires-Backup: false
- Reversible: true

## Structure Details:
- Table Modified: `public.friendships`
- Columns Affected: `user1_id`, `user2_id`
- Constraints Added: `friendships_user1_id_fkey`, `friendships_user2_id_fkey`

## Security Implications:
- RLS Status: Unchanged
- Policy Changes: No
- Auth Requirements: None

## Performance Impact:
- Indexes: Foreign keys automatically create indexes on `user1_id` and `user2_id`, which will improve the performance of joins and lookups on these columns.
- Estimated Impact: Positive. Queries joining `friendships` and `profiles` will be faster.
*/

-- Add foreign key constraint for user1_id
ALTER TABLE public.friendships
ADD CONSTRAINT friendships_user1_id_fkey
FOREIGN KEY (user1_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- Add foreign key constraint for user2_id
ALTER TABLE public.friendships
ADD CONSTRAINT friendships_user2_id_fkey
FOREIGN KEY (user2_id)
REFERENCES public.profiles(id)
ON DELETE CASCADE;
