// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, signOut, setPersistence, browserLocalPersistence, browserSessionPersistence } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Your Firebase configuration
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
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// Display user profile details after login
auth.onAuthStateChanged(async (user) => {
    if (user) {
        // Capture HTML elements to display profile details
        const userNameElement = document.getElementById('user-name');
        const userEmailElement = document.getElementById('user-email');
        const userWelcomeMessage = document.getElementById('welcomeMessage');

        // Display the user's name and email
        userNameElement.innerText = user.displayName || 'No display name';
        userEmailElement.innerText = user.email;

        // Fetch additional user data from Firestore (if needed)
        try {
            const userDocRef = doc(db, 'users', user.uid);
            const userDoc = await getDoc(userDocRef);

            if (userDoc.exists()) {
                const userData = userDoc.data();
                userWelcomeMessage.innerText = `Welcome back, ${userData.name}!`;
            } else {
                console.log('No additional user data found in Firestore.');
            }
        } catch (error) {
            console.error("Error fetching user data from Firestore:", error);
        }
    } else {
        // If no user is logged in, redirect to the login page
        window.location.href = "login.html";
    }
});

// Handle logout functionality
const logoutButton = document.getElementById('logout');
logoutButton.addEventListener('click', async () => {
    auth.signOut().then(() => {
        console.log('User signed out. Clearing persistence...');
        auth.setPersistence(browserSessionPersistence);  // Reset to session persistence on logout
    });
    try {
        await signOut(auth);
        console.log('User logged out');
        alert('Logged out successfully!');
        window.location.href = "login.html";  // Redirect to login page after logout
    } catch (error) {
        console.error('Error during logout:', error);
    }
});