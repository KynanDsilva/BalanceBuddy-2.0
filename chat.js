// Import required Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc, updateDoc, collection, getDocs, query, orderBy, addDoc, arrayUnion } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-analytics.js";

// Your Firebase configuration and initialization
const firebaseConfig = {
    apiKey: "AIzaSyCM2bVe7bRvhlBducH9kxw1CRmrsK_kYEA",
    authDomain: "balancebuddy-5427b.firebaseapp.com",
    databaseURL: "https://balancebuddy-5427b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "balancebuddy-5427b",
    storageBucket: "balancebuddy-5427b.firebasestorage.app",
    messagingSenderId: "263147724503",
    appId: "1:263147724503:web:6ee0f6171e89a4d4575a92",
    measurementId: "G-5SJQ1VLRHH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
onAuthStateChanged(auth, (user) => {
    if (!user) {
        console.log("User not logged in, redirecting to login page");
        window.location.href = "login.html";  // Check if the path is correct
    } else {
        console.log("User is logged in:", user.email);
    }
});

// Function to create a new room
async function createRoom() {
    const user = auth.currentUser;

    if (!user) {
        alert('You must be logged in to create a room');
        return;
    }

    const roomId = Math.random().toString(36).substring(2,10); // Function to generate a unique room ID

    // Add room to Firestore
    const roomRef = doc(db, "rooms", roomId);

    try{
        await setDoc(roomRef, {
            roomId: roomId,
            createdBy: user.uid,
            members: [user.uid],
            createdAt: new Date().toISOString(),
        });
    

    alert(`Room created successfully! Room ID: ${roomId}`);
    document.getElementById('roomIdInput').value = roomId;

    toggleRoomOptions(false);

    } catch(error) {
        console.error("Error creating room: ", error);
        alert("Error creating room. Please try again.");
    }
}

//Event listener for creating a room
document.getElementById('createRoomBtn').addEventListener('click', createRoom);

// Function to join the room
async function joinRoom() {
    const roomId = document.getElementById('roomIdInput').value;
    const user = auth.currentUser;

    if (!user) {
        alert('You must be logged in to join a room');
        return;
    }

    if (!roomId) {
        alert('Please enter a valid room ID');
        return;
    }

    const roomRef = doc(db, 'rooms', roomId);
    const roomDoc = await getDoc(roomRef);

    if (!roomDoc.exists()) {
        alert('Room does not exist');
        return;
    }

    const roomData = roomDoc.data();
    const members = roomData.members || [];

    if (members.includes(user.uid)) {
        alert('You are already in this room');
        return;
    }

    // Add the user to the room's member list
    await updateDoc(roomRef, {
        members: arrayUnion(user.uid)
    });

    alert('Joined the room successfully!');

    document.getElementById('chatContainer').style.display = 'block'; // Show the chat UI
    toggleRoomOptions(false)
    listenForMessages(roomId); // Start listening for messages
}
function toggleRoomOptions(show) {
    const roomOptions = document.getElementById('roomOptions');
    const chatWindow = documents.getElementById('chatWindow');

    if(show) {
        roomOptions.style.display = 'block';
        chatWindow.style.display = 'none';
    } else {
        roomOptions.style.display = 'none';
        chatWindow.style.display = 'block';
    }
}

// Function to send a message
async function sendMessage() {
    const roomId = document.getElementById('roomIdInput').value;
    const messageText = document.getElementById('messageInput').value.trim();
    const user = auth.currentUser;

    if (!user) {
        alert('You must be logged in to send a message');
        return;
    }

    if (!messageText) {
        alert('Please enter a message');
        return;
    }

    const message = {
        text: messageText,
        senderId: user.uid,
        timestamp: new Date().toISOString(),
    };

    const roomRef = doc(db, 'rooms', roomId);
    const messagesRef = collection(roomRef, 'messages');

    await addDoc(messagesRef, message);
    document.getElementById('messageInput').value = ''; // Clear the input field
}

// Real-time message listener for the room
function listenForMessages(roomId) {
    const roomRef = doc(db, 'rooms', roomId);
    const messagesRef = collection(roomRef, 'messages');
    const messagesQuery = query(messagesRef, orderBy('timestamp'));

    // Listen for changes in the messages collection
    onSnapshot(messagesQuery, (snapshot) => {
        const chatWindow = document.getElementById('chatWindow');
        snapshot.docChanges().forEach(change => {
            if (change.type === 'added') {
                const messageData = change.doc.data();
                const messageDiv = document.createElement('div');
                messageDiv.classList.add('message');
                messageDiv.textContent = messageData.text;

                chatWindow.appendChild(messageDiv);
                chatWindow.scrollTop = chatWindow.scrollHeight; // Auto-scroll to the bottom
            }
        });
    });
}

// Event listeners for buttons
document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
document.getElementById('joinRoomBtn').addEventListener('click', joinRoom);