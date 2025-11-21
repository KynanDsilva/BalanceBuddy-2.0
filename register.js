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

    const name = document.getElementById('name').value.trim();
    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!name || !email || !password) {
        alert('Please fill out all fields.');
        return;
    }

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    name: name, // This will be stored in user_metadata
                }
            }
        });

        if (error) {
            throw error;
        }

        // The trigger in Supabase will automatically create a profile.
        alert("Account created successfully! Please check your email to verify your account before logging in.");
        window.location.href = "login.html";

    } catch (error) {
        console.error('Error during registration:', error);
        alert(`Registration failed: ${error.message}`);
    }
});
