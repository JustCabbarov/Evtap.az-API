

(function () {
    'use strict';


    const API_BASE_URL = 'https://localhost:7027/api';
    const HUB_URL = 'https://localhost:7027/chathub';
    const MESSAGE_PAGE_SIZE = 200;


    let conversations = [];
    let selectedConversationData = null;
    let currentMessages = [];
    let currentUserId = null;
    let signalRConnection = null;


    function getAuthToken() {
        return localStorage.getItem('jwt') || localStorage.getItem('authToken') || localStorage.getItem('token') || null;
    }

    function parseJwt(token) {
        try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
                return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
            }).join(''));
            return JSON.parse(jsonPayload);
        } catch (e) {
            return null;
        }
    }

    function getUserIdFromToken() {
        const token = getAuthToken();
        if (!token) return null;
        const payload = parseJwt(token);
        if (!payload) return null;
        // Müxtəlif backend-lərdə fərqli sahə adı ola bilər
        return payload.nameid || payload.nameId || payload.sub || payload.NameIdentifier || payload.nameidentifier || null;
    }


    async function apiRequest(endpoint, options = {}) {
        const url = `${API_BASE_URL}${endpoint}`;
        const token = getAuthToken();

        const defaultHeaders = {
            'Content-Type': 'application/json',
            ...(token ? { 'Authorization': `Bearer ${token}` } : {})
        };

        const mergedOptions = {
            headers: defaultHeaders,
            ...options
        };

        try {
            const resp = await fetch(url, mergedOptions);

            if (resp.status === 401) {
                // unauthorized — istifadəçini çıxar
                localStorage.removeItem('jwt');
                localStorage.removeItem('authToken');
                localStorage.removeItem('token');
                window.location.href = './Login.html';
                return null;
            }

            if (!resp.ok) {
                const bodyText = await resp.text().catch(() => '');
                throw new Error(`API error: ${resp.status} ${resp.statusText} ${bodyText.substring(0, 200)}`);
            }

            // No content
            if (resp.status === 204) return null;

            const text = await resp.text();
            if (!text) return null;
            return JSON.parse(text);
        } catch (err) {
            console.error('apiRequest hata:', err);
            throw err;
        }
    }

    // ======= SIGNALR SETUP =======
    async function setupSignalR() {
        const token = getAuthToken();
        if (!token) {
            console.warn('Token yoxdur — SignalR quraşdırılmadı.');
            return;
        }

        // Əgər artıq bir bağlantı varsa əvvəl onu dayandır
        if (signalRConnection) {
            try {
                await signalRConnection.stop();
            } catch (e) {
                // ignore
            }
            signalRConnection = null;
        }

        // qlobal signalR olmalıdır
        signalRConnection = new signalR.HubConnectionBuilder()
            .withUrl(HUB_URL, {
                accessTokenFactory: () => token
            })
            .withAutomaticReconnect()
            .build();


        signalRConnection.on('NewMessage', async (message) => {
            try {

                if (isMessageForSelectedConversation(message)) {
                    const uiMsg = mapMessageToUI(message);
                    currentMessages.push(uiMsg);
                    currentMessages.sort((a, b) => a.sentAt - b.sentAt);
                    renderMessagesToContainer();
                    scrollToBottom();

                    await markConversationAsRead(selectedConversationData.otherUserId);
                }

                // Yenidən conversations yüklə ki unread/sıra düzəlsin
                await loadConversations();
            } catch (e) {
                console.error('NewMessage handler error', e);
            }
        });

        signalRConnection.on('UserOnline', (userId) => {

            const conv = conversations.find(c => c.otherUserId === userId);
            if (conv) {
                conv.isOnline = true;
                renderConversations();
            }
        });

        signalRConnection.on('UserOffline', (userId) => {
            const conv = conversations.find(c => c.otherUserId === userId);
            if (conv) {
                conv.isOnline = false;
                renderConversations();
            }
        });

        try {
            await signalRConnection.start();
            console.log('SignalR connected:', signalRConnection.connectionId);
        } catch (err) {
            console.error('SignalR start error:', err);
        }
    }

    function isMessageForSelectedConversation(message) {
        if (!selectedConversationData) return false;
        const sameListing = (message.listingId == selectedConversationData.listingId) || (message.listingId == null && selectedConversationData.listingId == null);
        const isBetween = (message.senderId === selectedConversationData.otherUserId && message.receiverId === currentUserId) ||
            (message.receiverId === selectedConversationData.otherUserId && message.senderId === currentUserId);
        return isBetween && sameListing;
    }

    async function joinConversationHub() {
        if (!signalRConnection || signalRConnection.state !== signalR.HubConnectionState.Connected || !selectedConversationData) return;
        try {
            await signalRConnection.invoke('JoinConversation', selectedConversationData.otherUserId, selectedConversationData.listingId);
        } catch (err) {
            console.error('JoinConversation error:', err);
        }
    }

    async function leaveConversationHub(conv) {
        if (!signalRConnection || signalRConnection.state !== signalR.HubConnectionState.Connected || !conv) return;
        try {
            await signalRConnection.invoke('LeaveConversation', conv.otherUserId, conv.listingId);
        } catch (err) {
            console.error('LeaveConversation error:', err);
        }
    }

    function mapMessageToUI(message) {
        const isSent = message.senderId === currentUserId;
        const sentAt = message.sentAt ? new Date(message.sentAt) : new Date();
        return {
            id: message.id || (`local-${Math.random().toString(36).substr(2, 9)}`),
            content: message.content || message.text || '',
            sender: isSent ? 'sent' : 'received',
            time: sentAt.toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
            isRead: !!message.isRead,
            sentAt
        };
    }

    function renderConversations() {
        const container = document.getElementById('conversationsList');
        if (!container) return;

        // Filter out conversations with yourself
        const validConversations = conversations.filter(conv => {
            return !conv.otherUserId || conv.otherUserId !== currentUserId;
        });

        if (!validConversations || validConversations.length === 0) {
            container.innerHTML = `
                <div class="no-conversations">
                    <i class="fas fa-comment-slash noConversations-icon"></i>
                    <h3>Hələ mesajınız yoxdur</h3>
                    <p>Əlaqə saxladığınız əmlak sahibləri burada görünəcək</p>
                </div>
            `;
            return;
        }

        container.innerHTML = validConversations.map(conv => {
            const isActive = conv.otherUserId === selectedConversationData?.otherUserId && conv.listingId == selectedConversationData?.listingId;
            const preview = conv.preview ? escapeHtml(conv.preview).slice(0, 60) : '';
            const unreadBadge = conv.unreadCount > 0 ? `<span class="unread-badge">${conv.unreadCount}</span>` : '';
            const onlineClass = conv.isOnline ? 'status-online' : 'status-offline';
            const title = conv.name || (conv.property?.title || `User ${conv.otherUserId?.substring(0, 8) || 'ADMIN'}`);

            // data attributes ilə məlumat saxlayırıq
            const dataAttrs = `data-otherid="${conv.otherUserId}" data-listingid="${conv.listingId || ''}"`;

            return `
                <div class="conversation-item ${isActive ? 'active' : ''}" ${dataAttrs}>
                    <div class="avatar">${(title && title[0]) ? title[0].toUpperCase() : '?'}</div>
                    <div class="conversation-info">
                        <div class="conversation-name">${escapeHtml(title)}</div>
                        <div class="conversation-preview">${preview}</div>
                        <div class="conversation-meta">
                            <span class="status-badge ${onlineClass}">${conv.isOnline ? 'Onlayn' : 'Offlayn'}</span>
                            <span class="conversation-time">${conv.time || ''}</span>
                            ${unreadBadge}
                    </div>
                    </div>
        </div>
    `;
        }).join('');

        // event listener əlavə et
        container.querySelectorAll('.conversation-item').forEach(item => {
            item.addEventListener('click', async () => {
                const otherUserId = item.getAttribute('data-otherid');
                const listingId = item.getAttribute('data-listingid') || null;
                const conv = conversations.find(c => c.otherUserId === otherUserId && String(c.listingId) === String(listingId));
                // əgər conversation array-dən tapılmadısa, minimal obyekt hazırla
                const convToOpen = conv || {
                    otherUserId,
                    listingId: listingId ? parseInt(listingId) : null,
                    name: item.querySelector('.conversation-name')?.textContent || `User ${otherUserId?.substring(0, 8)}`
                };
                await selectConversation(convToOpen);
            });
        });
    }

    function escapeHtml(text) {
        if (!text) return '';
        return text
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    }

    function renderMessagesToContainer() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;

        if (!currentMessages || currentMessages.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>Hələ mesaj yoxdur</p></div>';
            return;
        }

        container.innerHTML = currentMessages.map(m => {
            return `
                <div class="message ${m.sender}">
                    <div class="message-content">${escapeHtml(m.content)}</div>
                    <div class="message-time">${m.time}</div>
                    </div>
            `;
        }).join('');
    }

    function loadChatArea() {
        const chatArea = document.getElementById('chatArea');
        if (!chatArea) return;
        const conv = selectedConversationData;

        // Properly display listing title
        let propertyTitle = "Fərdi Mesaj";
        if (conv.property && conv.property.title) {
            propertyTitle = conv.property.title;
        } else if (conv.listingId) {
            propertyTitle = `Elan ${conv.listingId}`;
        }

        const propertyPrice = (conv.property && conv.property.price) ? conv.property.price : "Məlumat yoxdur";

        // Show property info only if there's a listing
        const propertyInfoHtml = conv.listingId ? `
            <div class="property-info">
                <div class="property-title">${escapeHtml(propertyTitle)}</div>
                <div class="property-price">${escapeHtml(propertyPrice)}</div>
            </div>
        ` : '';

        chatArea.innerHTML = `
            <div class="chat-header">
                <div class="avatar">${(conv.name && conv.name[0]) ? conv.name[0].toUpperCase() : '?'}</div>
                <div class="chat-header-info">
                    <h3>${escapeHtml(conv.name || 'User')}</h3>
                    <p class="status-text">
                        <span class="status-badge ${conv.isOnline ? 'status-online' : 'status-offline'}">
                            ${conv.isOnline ? 'Onlayn' : 'Offlayn'}
                        </span>
                    </p>
                </div>
            </div>
            
            ${propertyInfoHtml}
            
            <div class="chat-messages" id="messagesContainer"></div>
            
            <div class="chat-input">
                <div class="input-group">
                    <textarea class="message-input" id="messageInput" placeholder="Mesajınızı yazın..." rows="1"></textarea>
                    <button class="send-button" id="sendButton">
                        <i class="fas fa-paper-plane"></i>
                    </button>
            </div>
        </div>
    `;

        // input və düymə event-lərini əlavə et
        const input = document.getElementById('messageInput');
        const sendBtn = document.getElementById('sendButton');

        if (input) {
            input.addEventListener('keypress', (event) => {
                // Enter (Shift+Enter üçün yeni sətir)
                if (event.key === 'Enter' && !event.shiftKey) {
                    event.preventDefault();
                    sendMessage();
                } else {
                    // auto height
                    input.style.height = 'auto';
                    const maxHeight = 120;
                    const newH = Math.min(input.scrollHeight, maxHeight);
                    input.style.height = newH + 'px';
                }
            });
        }

        if (sendBtn) {
            sendBtn.addEventListener('click', sendMessage);
        }
    }

    // ======= LOAD DATA =======
    // Fetch listing details from API
    async function fetchListingTitle(listingId) {
        if (!listingId) return null;
        try {
            const listing = await apiRequest(`/Listing/GetListingDetailById/${listingId}`);
            if (listing) {
                return {
                    title: listing.title || `Elan ${listingId}`,
                    price: listing.price ? `${listing.price.toLocaleString('az-AZ')} ₼` : 'Qiymət yoxdur'
                };
            }
        } catch (err) {
            console.error('Error fetching listing title:', err);
        }
        return { title: `Elan ${listingId}`, price: 'N/A' };
    }

    async function loadConversations() {
        try {
            const rawMessages = await apiRequest('/Message/my-messages');
            const uniqueConversations = {};

            if (rawMessages && Array.isArray(rawMessages)) {
                rawMessages.forEach(msg => {
                    const otherId = msg.senderId === currentUserId ? msg.receiverId : msg.senderId;
                    const convKey = `${otherId}_${msg.listingId || 'direct'}`;

                    if (!uniqueConversations[convKey] || new Date(msg.sentAt) > new Date(uniqueConversations[convKey].sentAt)) {
                        uniqueConversations[convKey] = {
                            otherUserId: otherId,
                            name: msg.otherUserName || `User ${otherId ? otherId.substring(0, 8) : 'ADMIN'}`,
                            preview: msg.content || msg.text || '',
                            time: new Date(msg.sentAt).toLocaleTimeString('az-AZ', { hour: '2-digit', minute: '2-digit' }),
                            sentAt: new Date(msg.sentAt),
                            listingId: msg.listingId,
                            isOnline: false,
                            unreadCount: 0,
                            property: msg.listingId ? { title: `Elan ${msg.listingId}`, price: msg.listingPrice || 'N/A' } : null,
                            isAdmin: otherId === null
                        };
                    }

                    if (!msg.isRead && msg.receiverId === currentUserId) {
                        uniqueConversations[convKey].unreadCount += 1;
                    }
                });
            }

            conversations = Object.values(uniqueConversations).sort((a, b) => new Date(b.sentAt) - new Date(a.sentAt));

            // Fetch listing titles for all conversations with listingId
            const listingFetchPromises = conversations.map(async (conv) => {
                if (conv.listingId) {
                    const listingDetails = await fetchListingTitle(conv.listingId);
                    if (listingDetails) {
                        conv.property = listingDetails;
                    }
                }
            });

            await Promise.all(listingFetchPromises);

            renderConversations();
        } catch (err) {
            console.error('Error loading conversations:', err);
            showError('Mesajları yükləyə bilmədik.');
            renderConversations();
        }
    }

    async function loadMessages(otherUserId, listingId) {
        try {
            showLoading(true);
            const listingQuery = listingId ? `?listingId=${listingId}` : '';
            const data = await apiRequest(`/Message/conversation/${otherUserId}${listingQuery}`);

            currentMessages = Array.isArray(data) ? data.map(mapMessageToUI) : [];
            currentMessages.sort((a, b) => a.sentAt - b.sentAt);
            renderMessagesToContainer();
            showLoading(false);
        } catch (err) {
            console.error('Error loading messages:', err);
            currentMessages = [];
            renderMessagesToContainer();
            showLoading(false);
        }
    }

    async function selectConversation(conv) {
        // Yoxlama: İstifadəçi özü ilə konversasiya aça bilməz
        if (conv.otherUserId && conv.otherUserId === currentUserId) {
            showError('Siz özünüzlə söhbət edə bilməzsiniz!');
            return;
        }

        // 1) Əvvəlki qrupdan çıx
        if (selectedConversationData) {
            await leaveConversationHub(selectedConversationData);
        }

        // selectedConversationData-ni update et
        const fullConvData = conversations.find(c => c.otherUserId === conv.otherUserId && String(c.listingId) === String(conv.listingId));
        selectedConversationData = fullConvData || conv;

        renderConversations();
        loadChatArea();

        // Əgər listingId varsa və property məlumatı yoxdursa, onu yüklə
        if (selectedConversationData.listingId && (!selectedConversationData.property || !selectedConversationData.property.title || selectedConversationData.property.title.includes('Elan ID') || selectedConversationData.property.title.includes('Elan Adı'))) {
            const listingDetails = await fetchListingTitle(selectedConversationData.listingId);
            if (listingDetails) {
                selectedConversationData.property = listingDetails;
                // Reload chat area to show updated listing info
                loadChatArea();
            }
        }

        // mesajları yüklə
        await loadMessages(selectedConversationData.otherUserId, selectedConversationData.listingId);

        // hub-ə qoşul
        await joinConversationHub();

        // oxundu kimi işarələ
        await markConversationAsRead(selectedConversationData.otherUserId);

        // conversations yenilə
        await loadConversations();
    }

    async function markConversationAsRead(otherUserId) {
        try {
            await apiRequest(`/Message/mark-conversation-read/${otherUserId}`, {
                method: 'POST'
            });
        } catch (err) {
            console.error('markConversationAsRead error', err);
        }
    }

    async function sendMessage() {
        const input = document.getElementById('messageInput');
        if (!input || !selectedConversationData) return;
        const content = input.value.trim();
        if (!content) return;

        const conv = selectedConversationData;

        // Yoxlama: İstifadəçi özünə mesaj göndərə bilməz
        if (conv.otherUserId && conv.otherUserId === currentUserId) {
            showError('Siz özünüzə mesaj göndərə bilməzsiniz!');
            return;
        }

        const sendButton = document.getElementById('sendButton');
        if (sendButton) sendButton.disabled = true;

        try {
            const requestBody = {
                content,
                receiverId: conv.isAdmin ? null : conv.otherUserId,
                listingId: conv.listingId || null
            };

            const sentMessage = await apiRequest('/Message/send', {
                method: 'POST',
                body: JSON.stringify(requestBody)
            });

            // serverdən gələn obyekt yoxdursa local görünüş əlavə et
            const localMsg = mapMessageToUI(sentMessage || {
                id: null,
                content,
                senderId: currentUserId,
                sentAt: new Date().toISOString(),
                isRead: false
            });

            currentMessages.push(localMsg);
            currentMessages.sort((a, b) => a.sentAt - b.sentAt);
            renderMessagesToContainer();
            input.value = '';
            input.style.height = '45px';
            scrollToBottom();
        } catch (err) {
            console.error('Error sending message:', err);
            showError('Mesaj göndərilmədi');
        } finally {
            if (sendButton) sendButton.disabled = false;
        }
    }

    // ======= UI HELPERS =======
    function scrollToBottom() {
        const container = document.getElementById('messagesContainer');
        if (!container) return;
        setTimeout(() => {
            container.scrollTop = container.scrollHeight;
        }, 50);
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

    function showError(message) {
        const chatArea = document.getElementById('chatArea');
        if (!chatArea) return;
        chatArea.innerHTML = `
            <div class="no-conversation-selected">
                <div class="empty-state">
                    <h3>Xəta</h3>
                    <p>${escapeHtml(message)}</p>
                </div>
        </div>
    `;
    }

    // ======= INITIALIZE =======
    async function initializeChat() {
        const token = getAuthToken();
        currentUserId = getUserIdFromToken();

        if (!token || !currentUserId) {
            alert('Sistəmə giriş etməlisiniz');
            window.location.href = './Login.html';
            return;
        }

        // 1) SignalR start
        await setupSignalR();

        // 2) Load conversations
        await loadConversations();

        // 3) URL və sessionStorage parametrlərini yoxla
        const urlParams = new URLSearchParams(window.location.search);
        const receiverIdFromUrl = urlParams.get('receiverId');
        const listingIdFromUrl = urlParams.get('listingId');

        const targetUserId = receiverIdFromUrl || sessionStorage.getItem('chat_otherUserId');
        const targetListingId = listingIdFromUrl || sessionStorage.getItem('chat_listingId');
        const targetListingTitle = sessionStorage.getItem('chat_listingTitle');

        // 4) sessionStorage-dakı köhnə məlumatları təmizlə
        sessionStorage.removeItem('chat_otherUserId');
        sessionStorage.removeItem('chat_listingId');
        sessionStorage.removeItem('chat_listingTitle');

        // 5) Əgər target mövcuddursa, avtomatik seç və qoşul
        if (targetUserId && targetListingId) {
            let conversationToOpen = conversations.find(c =>
                c.otherUserId === targetUserId && String(c.listingId) === String(targetListingId)
            );

            if (!conversationToOpen) {
                // Fetch listing details from API
                const listingDetails = await fetchListingTitle(parseInt(targetListingId));

                conversationToOpen = {
                    otherUserId: targetUserId,
                    listingId: targetListingId ? parseInt(targetListingId) : null,
                    name: `User ${String(targetUserId).substring(0, 8)}`,
                    property: listingDetails || { title: targetListingTitle || `Elan ${targetListingId}`, price: 'N/A' }
                };
            }

            await selectConversation(conversationToOpen);
            return;
        }

        // Əks halda boş ekran göstər
        showNoConversationSelected();
    }

    function showNoConversationSelected() {
        const chatArea = document.getElementById('chatArea');
        if (!chatArea) return;
        chatArea.innerHTML = `
            <div class="no-conversation-selected">
                <div class="empty-state">
                    <h3>Konversasiya seçin</h3>
                    <p>Soldakı siyahıdan konversasiya seçin vəya yeni mesajlaşma başladın</p>
                </div>
            </div>
        `;
    }

    // Logout funksiyası (istəyirsənsə istifadə et)
    function logout() {
        localStorage.removeItem('jwt');
        localStorage.removeItem('authToken');
        localStorage.removeItem('token');
        window.location.href = './Login.html';
    }

    // Public API (debug/istifadə üçün)
    window.chatApp = {
        initializeChat,
        logout,
        getUserIdFromToken,
        getAuthToken
    };

    // Auto-run
    document.addEventListener('DOMContentLoaded', () => {
        initializeChat().catch(err => console.error('initializeChat error', err));
    });

})();
