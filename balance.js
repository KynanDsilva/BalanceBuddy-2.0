import { getAnalytics } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-analytics.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-app.js";
import { getFirestore, addDoc, deleteDoc, doc, getDocs, collection } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/9.16.0/firebase-auth.js";

// Firebase configuration
const firebaseConfig = {
    apiKey: "AIzaSyCM2bVe7bRvhlBducH9kxw1CRmrsK_kYEA",
    authDomain: "balancebuddy-5427b.firebaseapp.com",
    databaseURL: "https://balancebuddy-5427b-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "balancebuddy-5427b",
    storageBucket: "balancebuddy-5427b.appspot.com",
    messagingSenderId: "263147724503",
    appId: "1:263147724503:web:6ee0f6171e89a4d4575a92",
    measurementId: "G-5SJQ1VLRHH"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Function to calculate months between two dates
function calculateMonthsDifference(date1, date2) {
    const year1 = date1.getFullYear();
    const year2 = date2.getFullYear();
    const month1 = date1.getMonth();
    const month2 = date2.getMonth();

    return (year2 - year1) * 12 + (month2 - month1);
}

// Function to calculate updated debt with interest
function calculateInterest(initialAmount, interestRate, monthsPassed) {
    return initialAmount * Math.pow(1 + (interestRate / 100), monthsPassed);
}

// Form submission event to add debt
document.getElementById('debt-form').addEventListener('submit', async function (e) {
    e.preventDefault();

    const debtorName = document.getElementById('debtor-name').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const interestRate = parseFloat(document.getElementById('interest-rate').value) || 0;

    // Ensure interest rate is not more than 2%
    if (interestRate > 2) {
        alert("Interest rate cannot exceed 2%");
        return;
    }

    // Create a debt object
    const debt = {
        name: debtorName,
        amount: amount,
        interestRate: interestRate,
        createdAt: new Date()  // Storing current timestamp
    };

    // Add debt to Firestore
    try {
        await addDoc(collection(db, 'debts'), debt);
        alert('Debt added successfully!');
        loadDebts();  // Reload the debts after adding
    } catch (error) {
        console.error("Error adding debt", error);
    }

    // Reset the form
    document.getElementById('debt-form').reset();
});

// Function to load debts and apply interest
async function loadDebts() {
    const debtList = document.getElementById('debt-list');
    debtList.innerHTML = '';  // Clear the list

    try {
        const querySnapshot = await getDocs(collection(db, 'debts'));
        querySnapshot.forEach(docSnap => {
            const debt = docSnap.data();
            const debtId = docSnap.id; // Get the unique ID of the document
            const li = document.createElement('li');

            // Calculate months passed
            const createdAt = debt.createdAt.toDate();  // Convert Firestore timestamp to JavaScript Date
            const now = new Date();
            const monthsPassed = calculateMonthsDifference(createdAt, now);

            // Calculate future debt based on interest
            let totalDebt = calculateInterest(debt.amount, debt.interestRate, monthsPassed);

            // Display debt information with a delete button
            li.innerHTML = `
                ${debt.name} owes ₹${totalDebt.toFixed(2)} (Interest: ${debt.interestRate}% over ${monthsPassed} months)
                <button class="delete-btn" data-id="${debtId}">Delete</button>
            `;
            debtList.appendChild(li);

            // Add event listener to delete button
            li.querySelector('.delete-btn').addEventListener('click', async () => {
                await deleteDebt(debtId);
                loadDebts();  // Reload the debt list after deletion
            });
        });
    } catch (error) {
        console.error('Error loading debts: ', error);
    }
}

// Function to delete a debt
async function deleteDebt(debtId) {
    try {
        await deleteDoc(doc(db, 'debts', debtId)); // Delete debt from Firestore
        alert('Debt deleted successfully');
    } catch (error) {
        console.error('Error deleting debt:', error);
    }
}

document.getElementById('home-link').addEventListener('click', function(event) {
    event.preventDefault();
    window.location.href = 'home.html';
});

// Load debts when the page loads
window.onload = loadDebts;
