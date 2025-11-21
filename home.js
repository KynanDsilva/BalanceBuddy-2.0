import { supabase } from './supabase-client.js';

// Check user auth state and redirect if not logged in
supabase.auth.onAuthStateChange((event, session) => {
  if (!session) {
    window.location.href = "login.html";
  }
});
