import { supabase } from './supabase-client.js';

supabase.auth.onAuthStateChange(async (event, session) => {
    if (session) {
        const currentUser = session.user;
        const userNameElement = document.getElementById('user-name');
        const userEmailElement = document.getElementById('user-email');

        // Display email from the user object
        userEmailElement.innerText = currentUser.email || 'N/A';

        // Get the user's name directly from the user_metadata, which is the most reliable source.
        const name = currentUser.user_metadata?.name;

        if (name) {
            userNameElement.innerText = name;
        } else {
            // As a fallback, if metadata is empty, try fetching from the profiles table.
            console.log('Name not found in session metadata, falling back to profiles table.');
            const { data: profile, error } = await supabase
                .from('profiles')
                .select('name')
                .eq('id', currentUser.id)
                .single();

            if (error) {
                console.error('Error fetching profile name:', error);
                userNameElement.innerText = 'Could not load name';
            } else if (profile && profile.name) {
                userNameElement.innerText = profile.name;
            } else {
                userNameElement.innerText = 'N/A';
            }
        }
    } else {
        window.location.href = "login.html";
    }
});

const logoutButton = document.getElementById('logout');
logoutButton.addEventListener('click', async () => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        window.location.href = "login.html";
    } catch (error) {
        console.error('Error during logout:', error);
        alert(`Failed to log out: ${error.message}`);
    }
});
