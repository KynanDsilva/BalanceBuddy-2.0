import { supabase } from './supabase-client.js';

let currentUserId = null;

supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        currentUserId = session.user.id;
        loadDebts();
    } else {
        window.location.href = 'login.html';
    }
});

function calculateMonthsDifference(date1, date2) {
    const year1 = date1.getFullYear();
    const year2 = date2.getFullYear();
    const month1 = date1.getMonth();
    const month2 = date2.getMonth();
    return (year2 - year1) * 12 + (month2 - month1);
}

function calculateInterest(initialAmount, interestRate, monthsPassed) {
    return initialAmount * Math.pow(1 + (interestRate / 100), monthsPassed);
}

document.getElementById('debt-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    if (!currentUserId) return;

    const debtorName = document.getElementById('debtor-name').value;
    const amount = parseFloat(document.getElementById('amount').value);
    const interestRate = parseFloat(document.getElementById('interest-rate').value) || 0;

    if (interestRate > 2) {
        alert("Interest rate cannot exceed 2%");
        return;
    }

    const debt = {
        user_id: currentUserId,
        name: debtorName,
        amount: amount,
        interest_rate: interestRate,
    };

    try {
        const { error } = await supabase.from('debts').insert(debt);
        if (error) throw error;
        loadDebts();
    } catch (error) {
        console.error("Error adding debt", error);
    }

    document.getElementById('debt-form').reset();
});

async function loadDebts() {
    if (!currentUserId) return;
    const debtList = document.getElementById('debt-list');
    debtList.innerHTML = '<li>Loading debts...</li>';

    try {
        const { data: debts, error } = await supabase
            .from('debts')
            .select('*')
            .eq('user_id', currentUserId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        debtList.innerHTML = '';
        if (debts.length === 0) {
            debtList.innerHTML = '<li>No debts found. Add one to get started!</li>';
            return;
        }

        debts.forEach(debt => {
            const li = document.createElement('li');
            const createdAt = new Date(debt.created_at);
            const now = new Date();
            const monthsPassed = calculateMonthsDifference(createdAt, now);
            let totalDebt = calculateInterest(debt.amount, debt.interest_rate, monthsPassed);

            li.innerHTML = `
                <div>
                    <div class="debt-info">${debt.name} owes ₹${totalDebt.toFixed(2)}</div>
                    <div class="debt-details">Original: ₹${debt.amount.toFixed(2)} | Interest: ${debt.interest_rate}% over ${monthsPassed} months</div>
                </div>
                <button class="delete-btn" data-id="${debt.id}"><i class='bx bx-trash'></i></button>
            `;
            debtList.appendChild(li);

            li.querySelector('.delete-btn').addEventListener('click', async () => {
                await deleteDebt(debt.id);
            });
        });
    } catch (error) {
        console.error('Error loading debts: ', error);
        debtList.innerHTML = '<li>Error loading debts.</li>';
    }
}

async function deleteDebt(debtId) {
    try {
        const { error } = await supabase.from('debts').delete().eq('id', debtId);
        if (error) throw error;
        loadDebts(); // Reload debts after deletion
    } catch (error) {
        console.error('Error deleting debt:', error);
    }
}
