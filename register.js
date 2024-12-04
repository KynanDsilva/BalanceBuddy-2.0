// Import the necessary Firebase functions
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-analytics.js";
import { getAuth, onAuthStateChanged, createUserWithEmailAndPassword, updateProfile } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";
import { getFirestore, doc, setDoc } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-firestore.js";

// Your web app's Firebase configuration
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
const analytics = getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);

onAuthStateChanged(auth, user => {
    if (user) {
        // If the user is logged in, redirect to home page
        window.location.href = 'home.html'; // Change to your home page URL
    }
});

// Submit button handler for registration
const submit = document.getElementById('submit');
submit.addEventListener('click', async function (event) {
    event.preventDefault();  // Prevent form default behavior

    console.log('Creating user...');

    // Capture form inputs
    const name = document.getElementById('name').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (password !== confirmPassword) {
        alert('Passwords do not match');
        return;
    }

    try {
        //Create the user in Firebase Authentication
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        //Update the user's profile with the display name
        await updateProfile(user, { displayName: name });
        console.log("Profile updated successfully");

        //Store the user's details in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            name: name,
            email: email,
            userId: user.uid
        });

        console.log('User registered and data stored in Firestore.');

        //Redirect to the login page
        alert("Account created successfully! Redirecting to login...");
        console.log("Redirecting to login...");
        window.location.href = "login.html";  // Redirects to login page

    } catch (error) {
        console.error('Error during registration:', error);
        alert(error.message);  // Display error message to the user
    }
});