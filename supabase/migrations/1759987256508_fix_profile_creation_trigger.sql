/*
# [Fix Profile Creation Trigger]
This migration corrects the database trigger responsible for creating a user profile. The original trigger was missing a required field (`name_lowercase`), causing registration to fail. This script drops the old trigger and function, and replaces them with a corrected version.

## Query Description: [This operation fixes a critical bug in the user registration process. It modifies backend database functions but does not alter existing user data. It is safe to run on a live system as it only affects the creation of new users.]

## Metadata:
- Schema-Category: ["Structural"]
- Impact-Level: ["Medium"]
- Requires-Backup: [false]
- Reversible: [true]

## Structure Details:
- Drops trigger: `on_auth_user_created` on `auth.users`
- Drops function: `public.create_public_profile_for_new_user()`
- Re-creates function: `public.create_public_profile_for_new_user()` with `name_lowercase` insertion.
- Re-creates trigger: `on_auth_user_created` on `auth.users`

## Security Implications:
- RLS Status: [Unaffected]
- Policy Changes: [No]
- Auth Requirements: [None]

## Performance Impact:
- Indexes: [Unaffected]
- Triggers: [Modified]
- Estimated Impact: [Negligible. The trigger function is slightly modified but performance impact is minimal.]
*/

-- Step 1: Drop the existing trigger and function to avoid conflicts.
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.create_public_profile_for_new_user();

-- Step 2: Create the corrected function.
-- This function now correctly populates the 'name_lowercase' field.
create function public.create_public_profile_for_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, name, email, name_lowercase)
  values (
    new.id,
    new.raw_user_meta_data->>'name',
    new.email,
    lower(new.raw_user_meta_data->>'name')
  );
  return new;
end;
$$;

-- Step 3: Re-create the trigger on the auth.users table.
-- This trigger will execute the corrected function after a new user is inserted.
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_public_profile_for_new_user();
