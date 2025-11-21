import { supabase } from './supabase-client.js';

// Redirect to home if a session already exists
supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        window.location.href = 'home.html';
    }
});

const submitButton = document.getElementById('submit');
submitButton.addEventListener('click', async function (event) {
    event.preventDefault();

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const { error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) {
            throw error;
        }
        // onAuthStateChange will handle the redirect on successful login
    } catch (error) {
        console.error('Error during login:', error);
        alert(`Login failed: ${error.message}`);
    }
});
