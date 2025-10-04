// --- KRİTİK GLOBAL DƏYİŞƏNLƏR ---
let conversations = [];
let selectedConversationData = null; // Seçilmiş konversasiyanın bütün məlumatlarını saxlayır
let currentMessages = []; // Cari konversasiyanın mesajları
let currentUserId = null; // Hazırkı istifadəçinin ID-si
let signalRConnection = null;

// API Configuration (ZƏHMƏT OLMASA BUNLARI DÜZƏLDİN)
const API_BASE_URL = 'https://localhost:7027/api';
const HUB_URL = 'https://localhost:7027/chathub';


// --- JWT VƏ USER ID YARDIMÇI FUNKSİYALARI ---

function getAuthToken() {
    return localStorage.getItem('jwt') || localStorage.getItem('authToken') || localStorage.getItem('token');
}

window.getUserIdFromToken = function () {
    const token = getAuthToken();
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        // Payload-dan NameID (User ID) çıxarılır
        return payload.nameid; 
    } catch (e) {
        console.error("JWT çözümleme hatası:", e);
        return null;
    }
}


// --- REAL-TIME SIGNALR ENTEGRASYONU ---

window.setupSignalR = async function () {
    const token = getAuthToken();
    if (!token) return console.warn("Token yox, SignalR başladılmadı.");

    signalRConnection = new signalR.HubConnectionBuilder()
        .withUrl(HUB_URL, {
            accessTokenFactory: () => token
        })
        .withAutomaticReconnect()
        .build();

    // Serverdən gələn mesajları qəbul edir (Real-Time yenilənmə)
    signalRConnection.on("NewMessage", (message) => {

        // Mesajın cari seçilmiş konversasiyaya aid olub olmadığını yoxla
        const isSelectedConversation = (
            (message.senderId === selectedConversationData?.otherUserId && message.receiverId === currentUserId) ||
            (message.receiverId === selectedConversationData?.otherUserId && message.senderId === currentUserId)
        ) && (
            message.listingId === selectedConversationData?.listingId // Elan ID-si də eyni olmalıdır
        );

        if (isSelectedConversation) {
            currentMessages.push(mapMessageToUI(message));
            document.getElementById('messagesContainer').innerHTML = renderMessages();
            scrollToBottom();
            // Mesaj gələn kimi oxundu kimi işarələ (təcrübəni yaxşılaşdırır)
            markConversationAsRead(selectedConversationData.otherUserId); 
        }

        // Sidebar'ı və okunmamış sayılarını yenilə
        loadConversations();
    });

    try {
        await signalRConnection.start();
        console.log("SignalR Bağlantısı Başarılı.");
    } catch (err) {
        console.error("SignalR Başlatma Hatası:", err);
    }
}

// Hub Method: Sohbete Katıl (Yeni mesajları real-time almaq üçün)
window.joinConversationHub = async function () {
    if (!signalRConnection || signalRConnection.state !== signalR.HubConnectionState.Connected || !selectedConversationData) {
        return;
    }

    const otherUserId = selectedConversationData.otherUserId;
    const listingId = selectedConversationData.listingId;

    if (otherUserId) {
        try {
            await signalRConnection.invoke("JoinConversation", otherUserId, listingId);
        } catch (err) {
            console.error("Hub JoinConversation hatası:", err);
        }
    }
}

// Hub Method: Gruptan Ayrıl (Yaddaş optimizasiyası üçün)
window.leaveConversationHub = async function (conv) {
    if (signalRConnection && signalRConnection.state === signalR.HubConnectionState.Connected && conv) {
        try {
            await signalRConnection.invoke("LeaveConversation", conv.otherUserId, conv.listingId);
        } catch (err) {
            console.error("Hub LeaveConversation hatası:", err);
        }
    }
}


// --- API VƏ VERİ İŞLƏMƏ ---

window.apiRequest = async function (endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = getAuthToken();

    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` })
        }
    };

    const requestOptions = { ...defaultOptions, ...options };

    try {
        const response = await fetch(url, requestOptions);

        if (!response.ok) {
            if (response.status === 401) {
                localStorage.removeItem('jwt');
                window.location.href = './Login.html';
                return null;
            }
            // Hata detayını oxumağa çalışırıq
            const errorBody = await response.text();
            throw new Error(`HTTP error! Status: ${response.status}. Detay: ${errorBody.substring(0, 100)}`);
        }
        
        if (response.status === 204 || response.headers.get('Content-Length') === '0') {
            return {};
        }
        return await response.json();
    } catch (error) {
        console.error('API request failed:', error);
        throw error;
    }
}

// Mesaj objesini UI'ın beklediği formata çevirir
function mapMessageToUI(message) {
    const isSent = message.senderId === currentUserId;

    return {
        id: message.id,
        content: message.content,
        sender: isSent ? 'sent' : 'received',
        time: new Date(message.sentAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
        isRead: message.isRead,
        sentAt: new Date(message.sentAt)
    };
}

// Load conversations from API (Inbox listinin əsas data çəkmə funksiyası)
window.loadConversations = async function () {
    try {
        const rawMessages = await apiRequest('/Message/my-messages');
        const uniqueConversations = {};

        if (rawMessages && Array.isArray(rawMessages)) {
            // Server tərəfdə unikal söhbətlər qruplaşdırılmadığı üçün biz client tərəfdə qruplaşdırırıq.
            rawMessages.forEach(msg => {
                const otherId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
                // Unikal açar: digər_istifadəçi_ID + elan_ID
                const convKey = `${otherId}_${msg.listingId || 'direct'}`;

                // Söhbətin ən son mesajını tapırıq
                if (!uniqueConversations[convKey] || new Date(msg.sentAt) > new Date(uniqueConversations[convKey].sentAt)) {
                    uniqueConversations[convKey] = {
                        otherUserId: otherId,
                        name: msg.otherUserName || `User ${otherId?.substring(0, 8) || 'ADMIN'}`,
                        preview: msg.content,
                        time: new Date(msg.sentAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
                        sentAt: new Date(msg.sentAt),
                        listingId: msg.listingId,
                        isOnline: false, // Online statusunu API-dan almalısınız.
                        unreadCount: 0,
                        property: msg.listingId ? { title: `Elan ID: ${msg.listingId}`, price: 'N/A' } : null,
                        isAdmin: otherId === null
                    };
                }

                // Oxunmamış sayıları hesablayırıq
                if (!msg.isRead && msg.receiverId === currentUserId) {
                    uniqueConversations[convKey].unreadCount += 1;
                }
            });
        }

        // Ən son mesajın vaxtına görə sort edirik (ən yeni yuxarıda)
        conversations = Object.values(uniqueConversations).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));
        renderConversations();

    } catch (error) {
        console.error('Error loading conversations:', error);
        showError('Mesajları yükləyə bilmədik.');
        renderConversations();
    }
}


// Load messages for conversation (KÖHNƏ MESAJ TARİXÇƏSİNİ çəkir)
window.loadMessages = async function (otherUserId, listingId) {
    try {
        showLoading(true);
        const data = await apiRequest(`/Message/conversation/${otherUserId}?listingId=${listingId || ''}`);

        // Köhnə mesajların hamısını çəkir
        currentMessages = data.map(mapMessageToUI);
        currentMessages.sort((a, b) => a.sentAt - b.sentAt); // Vaxta görə sort et

        showLoading(false);
    } catch (error) {
        console.error('Error loading messages:', error);
        currentMessages = [];
        showLoading(false);
    }
}

// Select conversation and load messages (Klikləmə hadisəsi)
window.selectConversation = async function (conv) {
    // 1. Öncəki qrupdan çıx
    if (selectedConversationData) {
        leaveConversationHub(selectedConversationData);
    }
    
    // selectedConversationData-nı conversation array-də tapıb yeniləyirik
    const fullConvData = conversations.find(c => c.otherUserId === conv.otherUserId && c.listingId === conv.listingId);
    selectedConversationData = fullConvData || conv;

    // 2. Listi yenilə (seçilmişi aktiv etmək üçün)
    renderConversations();

    // 3. Chat sahəsini yüklə
    loadChatArea();

    // 4. Mesajları API'dan çək (BÜTÜN KÖHNƏ MESAJLAR)
    await loadMessages(selectedConversationData.otherUserId, selectedConversationData.listingId);

    // 5. Mesajları ekrana bas və scroll'u aşağı sal
    document.getElementById('messagesContainer').innerHTML = renderMessages();
    scrollToBottom();

    // 6. Hub'a qoşul (Real-time yenilənməni almağa başla)
    joinConversationHub();

    // 7. Konversasyonu oxundu olarak işaretle
    await markConversationAsRead(selectedConversationData.otherUserId);

    // 8. Sidebar'ı yenilə (unread badge sıfırlanması üçün)
    loadConversations();
}

// Mark conversation as read
window.markConversationAsRead = async function (otherUserId) {
    try {
        await apiRequest(`/Message/mark-conversation-read/${otherUserId}`, {
            method: 'POST'
        });
    } catch (error) {
        console.error('Error marking conversation as read:', error);
    }
}

// Send message (Mesaj göndərmə funksiyası)
window.sendMessage = async function () {
    const input = document.getElementById('messageInput');
    const content = input.value.trim();

    if (!content || !selectedConversationData) return;

    const sendButton = document.getElementById('sendButton');
    sendButton.disabled = true;

    try {
        const conv = selectedConversationData;

        const requestBody = {
            content: content,
            // Admin mesajı üçün receiverId null olacaq.
            receiverId: conv.isAdmin ? null : conv.otherUserId, 
            listingId: conv.listingId || null,
        };

        const sentMessage = await apiRequest('/Message/send', {
            method: 'POST',
            body: JSON.stringify(requestBody)
        });

        // Anlık görüntü güncellemesi (öz göndərdiyimiz mesajı görmək üçün)
        const localMessage = mapMessageToUI(sentMessage);
        currentMessages.push(localMessage);

        document.getElementById('messagesContainer').innerHTML = renderMessages();
        input.value = '';
        input.style.height = '45px'; // Hündürlüyü sıfırla
        scrollToBottom();

    } catch (error) {
        console.error('Error sending message:', error);
        showError('Mesaj göndərilmədi');
    } finally {
        sendButton.disabled = false;
    }
}


// --- YARDIMÇI VƏ UI FUNKSİYALARI ---

/**
 * Mesaj konteynerini aşağı çəkir.
 * Scroll hərəkətinin səhifə deyil, yalnız mesaj konteynerində qalmasını təmin edir.
 */
function scrollToBottom() {
    const container = document.getElementById('messagesContainer'); // messagesContainer ID-ni istifadə etdiyinə əmin ol
    if (container) {
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 50); 
    }
}

function showLoading(show) {
    const container = document.getElementById('messagesContainer');
    if (!container) return; 

    if (show) {
        container.innerHTML = `
            <div class="loading-messages">
                <div class="spinner"></div>
                Mesajlar yüklənir...
            </div>
        `;
    } 
}

// Render messages
function renderMessages() {
    if (currentMessages.length === 0) {
        return '<div class="empty-state"><p>Hələ mesaj yoxdur</p></div>';
    }

    return currentMessages.map(message => `
            <div class="message ${message.sender}">
                <div class="message-content">
                    ${message.content}
                </div>
                <div class="message-time">${message.time}</div>
            </div>
        `).join('');
}

// Render conversations list
window.renderConversations = function () {
    const container = document.getElementById('conversationsList');

    if (conversations.length === 0) {
        container.innerHTML = `
                <div class="no-conversations">
                    <i class="fas fa-comment-slash noConversations-icon"></i>
                    <h3>Hələ mesajınız yoxdur</h3>
                    <p>Əlaqə saxladığınız əmlak sahibləri burada görünəcək</p>
                </div>
            `;
        return;
    }

    container.innerHTML = conversations.map(conv => {
        const isActive = conv.otherUserId === selectedConversationData?.otherUserId && conv.listingId === selectedConversationData?.listingId;
        const convArg = JSON.stringify({ otherUserId: conv.otherUserId, listingId: conv.listingId, isAdmin: conv.isAdmin }); // selectConversation-a ötürüləcək data

        return `
            <div class="conversation-item ${isActive ? 'active' : ''}" 
                onclick='selectConversation(${convArg})'>
                <div class="avatar">${conv.name.charAt(0).toUpperCase()}</div>
                <div class="conversation-info">
                    <div class="conversation-name">${conv.name}</div>
                    <div class="conversation-preview">${conv.preview}</div>
                    <div class="conversation-meta">
                        <span class="status-badge ${conv.isOnline ? 'status-online' : 'status-offline'}">
                            ${conv.isOnline ? 'Onlayn' : 'Offlayn'}
                        </span>
                        <span class="conversation-time">${conv.time}</span>
                        ${conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : ''}
                    </div>
                </div>
            </div>
        `;
    }).join('');
}

// Load and render chat area
window.loadChatArea = function () {
    const chatArea = document.getElementById('chatArea');
    const conv = selectedConversationData;

    const propertyTitle = conv.property?.title || (conv.listingId ? `Elan ID: ${conv.listingId}` : "Fərdi Mesaj");
    const propertyPrice = conv.property?.price || "Məlumat yoxdur";

    chatArea.innerHTML = `
            <div class="chat-header">
                <div class="avatar">${conv.name.charAt(0).toUpperCase()}</div>
                <div class="chat-header-info">
                    <h3>${conv.name}</h3>
                    <p class="status-text">
                        <span class="status-badge ${conv.isOnline ? 'status-online' : 'status-offline'}">
                            ${conv.isOnline ? 'Onlayn' : 'Offlayn'}
                        </span>
                    </p>
                </div>
            </div>
            
            <div class="property-info">
                <div class="property-title">${propertyTitle}</div>
                <div class="property-price">${propertyPrice}</div>
            </div>
            
            <div class="chat-messages" id="messagesContainer">
                </div>
            
            <div class="chat-input">
                <div class="input-group">
                    <textarea class="message-input" id="messageInput" placeholder="Mesajınızı yazın..." 
                                 rows="1" onkeypress="handleMessageKeyPress(event)"></textarea>
                    <button class="send-button" onclick="sendMessage()" id="sendButton">
                        <i class="fas fa-paper-plane"></i>
                    </button>
                </div>
            </div>
        `;
}

// Show no conversation selected state
window.showNoConversationSelected = function () {
    document.getElementById('chatArea').innerHTML = `
        <div class="no-conversation-selected">
            <div class="empty-state">
                <h3>Konversasiya seçin</h3>
                <p>Soldakı siyahıdan konversasiya seçin vəya yeni mesajlaşma başladın</p>
            </div>
        </div>
    `;
}

// Handle Enter key press (Hündürlüyü məhdudlaşdıran düzəliş burada tətbiq olunur)
window.handleMessageKeyPress = function (event) {
    const input = event.target;
    
    // Yalnız Enter basılarsa (Shift+Enter yox), mesajı göndər
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
        return;
    }

    // Auto-hündürlük məntiqi:
    input.style.height = 'auto'; 
    const maxHeight = 120; 
    
    // Scroll hündürlüyünə əsasən hündürlüyü təyin edirik
    const newHeight = Math.min(input.scrollHeight, maxHeight);

    if (newHeight <= maxHeight) {
        input.style.height = newHeight + 'px';
    } else {
        // Maksimum hündürlüyə çatanda scroll yaranacaq (CSS-ə görə)
        input.style.height = maxHeight + 'px';
    }
}


// Orijinal logout funksiyası
window.logout = function () {
    localStorage.removeItem('jwt');
    localStorage.removeItem('authToken');
    localStorage.removeItem('token');
    window.location.href = './Login.html';
}

// Orijinal showError funksiyası
window.showError = function (message) {
    const chatArea = document.getElementById('chatArea');
    chatArea.innerHTML = `
            <div class="no-conversation-selected">
                <div class="empty-state">
                    <h3>Xəta</h3>
                    <p>${message}</p>
                </div>
            </div>
        `;
}

// Orijinal searchConversations funksiyası
window.searchConversations = function (query) {
    const items = document.querySelectorAll('.conversation-item');
    items.forEach(item => {
        const name = item.querySelector('.conversation-name').textContent.toLowerCase();
        const preview = item.querySelector('.conversation-preview').textContent.toLowerCase();
        
        if (name.includes(query.toLowerCase()) || preview.includes(query.toLowerCase())) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}
// FAYL: Chat.js

window.initializeChat = async function () {
    const token = getAuthToken();
    currentUserId = getUserIdFromToken();

    if (!token || !currentUserId) {
        alert('Sistəmə giriş etməlisiniz');
        window.location.href = './Login.html';
        return;
    }

    // 1. SignalR'ı qur
    setupSignalR();

    // 2. Bütün söhbətləri arxa fonda yüklə
    await loadConversations();

    // 3. Yönləndirmə ilə gələn yeni söhbət məlumatlarını yoxla
    const targetUserId = sessionStorage.getItem('chat_otherUserId');
    const targetListingId = sessionStorage.getItem('chat_listingId');
    const targetListingTitle = sessionStorage.getItem('chat_listingTitle');

    if (targetUserId && targetListingId) {
        // Məlumatları istifadə etdikdən sonra sessionStorage-dan silirik ki,
        // səhifəni yeniləyəndə təkrar açılmasın.
        sessionStorage.removeItem('chat_otherUserId');
        sessionStorage.removeItem('chat_listingId');
        sessionStorage.removeItem('chat_listingTitle');

        // Yüklənmiş söhbətlər arasında həmin söhbəti axtarırıq
        let conversationToOpen = conversations.find(c => 
            c.otherUserId === targetUserId && c.listingId == targetListingId
        );

        // Əgər bu yeni bir söhbətdirsə və siyahıda yoxdursa, müvəqqəti obyekt yaradırıq
        if (!conversationToOpen) {
            conversationToOpen = {
                otherUserId: targetUserId,
                listingId: parseInt(targetListingId),
                name: `User ${targetUserId.substring(0, 8)}`, // Adı daha sonra API-dan gələcək
                property: { title: targetListingTitle || `Elan ID: ${targetListingId}` }
            };
        }
        
        // Həmin söhbəti avtomatik olaraq seçirik
        selectConversation(conversationToOpen);

    } else {
        // Əgər yönləndirmə ilə gələn məlumat yoxdursa, standart boş ekranı göstər
        showNoConversationSelected();
    }
}

// Səhifə yüklənəndə initializeChat funksiyasını çağırırıq
document.addEventListener('DOMContentLoaded', initializeChat);