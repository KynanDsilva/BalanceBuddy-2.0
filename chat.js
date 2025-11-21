import { supabase } from './supabase-client.js';

let realtimeChannel;
let currentRoomId;
let currentUser;

supabase.auth.onAuthStateChange((event, session) => {
    if (session) {
        currentUser = session.user;
    } else {
        window.location.href = "login.html";
    }
});

function toggleViews(showChat) {
    document.getElementById('roomOptions').style.display = showChat ? 'none' : 'block';
    document.getElementById('chatContainer').style.display = showChat ? 'flex' : 'none';
}

async function createRoom() {
    if (!currentUser) return alert('Log in first!');
    
    const { data, error } = await supabase.from('chat_rooms').insert({ created_by: currentUser.id }).select().single();
    if (error) return alert('Error creating room.');
    
    const roomId = data.id;
    // Also add creator to room_members
    await supabase.from('room_members').insert({ room_id: roomId, user_id: currentUser.id });

    alert(`Room created! ID: ${roomId}. Share it with your friends.`);
    joinRoom(roomId);
}

async function joinRoom(id) {
    const roomId = id || document.getElementById('roomIdInput').value.trim();
    if (!roomId) return alert('Please enter a Room ID.');
    
    const { data: room, error } = await supabase.from('chat_rooms').select('id').eq('id', roomId).single();
    if (error || !room) return alert('Room not found!');
    
    // Add user to room members, ignore if already a member (due to primary key constraint)
    await supabase.from('room_members').insert({ room_id: roomId, user_id: currentUser.id });
    
    currentRoomId = roomId;
    document.getElementById('room-id-header').textContent = `Room: ${roomId}`;
    toggleViews(true);
    await listenForMessages(roomId);
}

function leaveRoom() {
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
        realtimeChannel = null;
    }
    document.getElementById('chatWindow').innerHTML = '';
    currentRoomId = null;
    toggleViews(false);
}

async function sendMessage() {
    const content = document.getElementById('messageInput').value.trim();
    if (!content || !currentRoomId) return;

    await supabase.from('messages').insert({
        content: content, 
        user_id: currentUser.id,
        room_id: currentRoomId
    });

    document.getElementById('messageInput').value = '';
}

async function listenForMessages(roomId) {
    const chatWindow = document.getElementById('chatWindow');
    chatWindow.innerHTML = '';

    // Fetch initial messages
    const { data: messages, error } = await supabase
        .from('messages')
        .select('*, profile:profiles(name)')
        .eq('room_id', roomId)
        .order('created_at');
    
    if (error) return console.error('Error fetching messages', error);

    messages.forEach(msg => displayMessage(msg));
    chatWindow.scrollTop = chatWindow.scrollHeight;

    // Set up realtime subscription
    if (realtimeChannel) {
        supabase.removeChannel(realtimeChannel);
    }

    realtimeChannel = supabase.channel(`room:${roomId}`)
        .on('postgres_changes', {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `room_id=eq.${roomId}`
        }, async (payload) => {
            // Fetch the message with the profile info
            const { data: newMessage, error: newMsgError } = await supabase
                .from('messages')
                .select('*, profile:profiles(name)')
                .eq('id', payload.new.id)
                .single();
            if (newMsgError) return console.error('Error fetching new message', newMsgError);
            displayMessage(newMessage);
            chatWindow.scrollTop = chatWindow.scrollHeight;
        })
        .subscribe();
}

function displayMessage(msg) {
    const chatWindow = document.getElementById('chatWindow');
    const msgDiv = document.createElement('div');
    
    const isSent = currentUser.id === msg.user_id;
    msgDiv.classList.add('message', isSent ? 'sent' : 'received');
    
    if (!isSent) {
        const senderName = document.createElement('div');
        senderName.className = 'message-sender';
        senderName.textContent = msg.profile?.name || 'Anonymous';
        msgDiv.appendChild(senderName);
    }

    const messageText = document.createElement('div');
    messageText.className = 'message-text';
    messageText.textContent = msg.content;
    msgDiv.appendChild(messageText);

    chatWindow.appendChild(msgDiv);
}

document.getElementById('createRoomBtn').addEventListener('click', createRoom);
document.getElementById('joinRoomBtn').addEventListener('click', () => joinRoom());
document.getElementById('leaveRoomBtn').addEventListener('click', leaveRoom);
document.getElementById('sendMessageBtn').addEventListener('click', sendMessage);
document.getElementById('messageInput').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});

toggleViews(false);
