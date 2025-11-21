import { supabase } from './supabase-client.js';

let currentUser = null;

function getInitials(name) {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length > 1) {
        return (words[0][0] + words[1][0]);
    }
    return name.substring(0, 2);
}

supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        currentUser = session.user;
        loadPageData();
    } else {
        window.location.href = "login.html";
    }
});

async function loadPageData() {
    if (!currentUser) return;
    displayFriendRequests();
    displayFriendList();
}

async function sendFriendRequest(friendId) {
    if (!currentUser) return;
    const { error } = await supabase.from('friendships').insert({
        user1_id: currentUser.id,
        user2_id: friendId,
        status: 'pending'
    });
    if (error) {
        console.error('Error sending friend request:', error);
        alert(`Could not send friend request: ${error.message}`);
    } else {
        alert('Friend request sent!');
        searchUsers(); // Refresh search results
    }
}

async function displayFriendRequests() {
    const { data, error } = await supabase
        .from('friendships')
        .select('*, user1:profiles!user1_id(id, name)')
        .eq('user2_id', currentUser.id)
        .eq('status', 'pending');

    if (error) return console.error(error);

    const container = document.getElementById('friendRequestsReceived');
    container.innerHTML = '';
    const badge = document.getElementById('friendRequestBadge');

    if (data.length > 0) {
        badge.textContent = data.length;
        badge.style.display = 'inline-block';
        data.forEach(req => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'user-item';
            itemDiv.innerHTML = `
                <div class="user-avatar">${getInitials(req.user1.name)}</div>
                <div class="user-info"><span>${req.user1.name}</span></div>
                <div class="user-actions">
                    <button class="btn btn-sm btn-accept" data-id="${req.user1.id}" title="Accept"><i class='bx bx-check'></i></button>
                    <button class="btn btn-sm btn-reject" data-id="${req.user1.id}" title="Reject"><i class='bx bx-x'></i></button>
                </div>
            `;
            container.appendChild(itemDiv);
        });
    } else {
        container.innerHTML = "<p class='no-results'>No pending friend requests.</p>";
        badge.style.display = 'none';
    }
}

async function acceptFriendRequest(senderId) {
    const { error } = await supabase
        .from('friendships')
        .update({ status: 'accepted' })
        .match({ user1_id: senderId, user2_id: currentUser.id });
    if (error) console.error(error);
    loadPageData();
}

async function rejectFriendRequest(senderId) {
    const { error } = await supabase
        .from('friendships')
        .delete()
        .match({ user1_id: senderId, user2_id: currentUser.id });
    if (error) console.error(error);
    loadPageData();
}

async function removeFriend(friendId) {
    if (!confirm("Are you sure you want to remove this friend?")) return;

    const { error } = await supabase
        .from('friendships')
        .delete()
        .or(`(user1_id.eq.${currentUser.id},user2_id.eq.${friendId}),(user1_id.eq.${friendId},user2_id.eq.${currentUser.id})`)
        .eq('status', 'accepted');

    if (error) {
        console.error('Error removing friend:', error);
        alert(`Could not remove friend: ${error.message}`);
    } else {
        loadPageData();
    }
}

async function displayFriendList() {
    const { data, error } = await supabase
        .from('friendships')
        .select('*, user1:profiles!user1_id(id, name), user2:profiles!user2_id(id, name)')
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`)
        .eq('status', 'accepted');

    if (error) return console.error(error);

    const container = document.getElementById('friendList');
    container.innerHTML = '';

    if (data.length > 0) {
        data.forEach(friendship => {
            const friend = friendship.user1_id === currentUser.id ? friendship.user2 : friendship.user1;
            const itemDiv = document.createElement('div');
            itemDiv.className = 'user-item';
            itemDiv.innerHTML = `
                <div class="user-avatar">${getInitials(friend.name)}</div>
                <div class="user-info"><span>${friend.name}</span></div>
                <div class="user-actions">
                    <button class="btn btn-sm btn-reject btn-remove-friend" data-id="${friend.id}" title="Remove Friend"><i class='bx bx-trash'></i></button>
                </div>
            `;
            container.appendChild(itemDiv);
        });
    } else {
        container.innerHTML = "<p class='no-results'>You haven't added any friends yet.</p>";
    }
}

async function searchUsers() {
    const searchQuery = document.getElementById("searchInput").value.trim();
    if (!searchQuery) {
        document.getElementById("searchResults").innerHTML = '';
        return;
    };

    const resultsContainer = document.getElementById("searchResults");
    resultsContainer.innerHTML = '<p class="no-results">Searching...</p>';

    const { data: users, error } = await supabase
        .from('profiles')
        .select('id, name')
        .ilike('name', `%${searchQuery}%`)
        .neq('id', currentUser.id);

    if (error) return console.error(error);

    const { data: friendships, error: friendsError } = await supabase
        .from('friendships')
        .select('*')
        .or(`user1_id.eq.${currentUser.id},user2_id.eq.${currentUser.id}`);

    if (friendsError) return console.error(friendsError);
    
    resultsContainer.innerHTML = '';
    if (users.length === 0) {
        resultsContainer.innerHTML = "<p class='no-results'>No users found.</p>";
        return;
    }

    users.forEach(user => {
        const itemDiv = document.createElement("div");
        itemDiv.className = "user-item";
        let buttonHTML;

        const existingFriendship = friendships.find(f => (f.user1_id === user.id || f.user2_id === user.id));

        if (existingFriendship?.status === 'accepted') {
            buttonHTML = `<button class="btn btn-sm" disabled style="background-color: var(--success);"><i class='bx bx-check'></i> Friends</button>`;
        } else if (existingFriendship?.status === 'pending') {
            buttonHTML = `<button class="btn btn-sm" disabled>Request Sent</button>`;
        } else {
            buttonHTML = `<button class="btn btn-sm btn-primary btn-send-request" data-id="${user.id}"><i class='bx bx-user-plus'></i> Add</button>`;
        }

        itemDiv.innerHTML = `
            <div class="user-avatar">${getInitials(user.name)}</div>
            <div class="user-info"><span>${user.name}</span></div>
            <div class="user-actions">${buttonHTML}</div>
        `;
        resultsContainer.appendChild(itemDiv);
    });
}

document.getElementById("searchButton").addEventListener('click', searchUsers);
document.getElementById('searchInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchUsers();
});

document.addEventListener('click', function (e) {
    const button = e.target.closest('button');
    if (!button) return;

    const friendId = button.dataset.id;
    if (!friendId) return;

    if (button.matches('.btn-send-request')) {
        sendFriendRequest(friendId);
    }
    if (button.matches('.btn-accept')) {
        acceptFriendRequest(friendId);
    }
    if (button.matches('.btn-reject') && !button.matches('.btn-remove-friend')) {
        rejectFriendRequest(friendId);
    }
    if (button.matches('.btn-remove-friend')) {
        removeFriend(friendId);
    }
});
