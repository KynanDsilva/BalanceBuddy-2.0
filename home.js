import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.13.1/firebase-auth.js";

// Firebase configuration
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

// Check user auth state and redirect if not logged in
onAuthStateChanged(auth, (user) => {
  console.log("Auth state changed");
  if (!user) {
    console.log("User not logged in, redirecting to login page");
    window.location.href = "login.html";  // Check if the path is correct
  } else {
    console.log("User is logged in:", user.email);
  }
});
