// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// Firebase configuration (This holds all your Firebase project credentials)
const firebaseConfig = {
    apiKey: "AIzaSyCM2bVe7bRvhlBducH9kxw1CRmrsK_kYEA",
    authDomain: "balancebuddy-5427b.firebaseapp.com",
    projectId: "balancebuddy-5427b",
    storageBucket: "balancebuddy-5427b.appspot.com",
    messagingSenderId: "263147724503",
    appId: "1:263147724503:web:6ee0f6171e89a4d4575a92",
    measurementId: "G-5SJQ1VLRHH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);  // Initializes Firebase for your app
const analytics = getAnalytics(app);
const auth = getAuth();  // Sets up authentication

onAuthStateChanged(auth, user => {
    if (user) {
        // If the user is logged in, redirect to home page
        window.location.href = 'home.html'; // Change to your home page URL
    }
});

// Login submit handler
const submit = document.getElementById('submit');
submit.addEventListener('click', async function (event) {
    event.preventDefault();  // Prevent form default submission

    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;

    // Log the value of the "Remember Me" checkbox
    console.log("Remember Me checked:", rememberMe);

    // Choose persistence based on "Remember Me" checkbox
    const persistence = rememberMe ? browserLocalPersistence : browserSessionPersistence;

    try {
        // Force reset persistence before applying the new one
        await setPersistence(auth, persistence);
        console.log("Persistence set to:", rememberMe ? "Local" : "Session");

        // Now sign in the user with the chosen persistence
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        console.log('Successfully logged in:', user.displayName);
        alert(`Welcome, ${user.displayName}! Redirecting to home...`);
        window.location.href = "home.html";  // Redirect to home after login
    } catch (error) {
        console.error('Error during login or persistence:', error);
        alert(error.message);  // Display error message
    }
});