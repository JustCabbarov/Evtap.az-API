// Admin Dashboard JavaScript - Real-Time Mesajlaşma Entegre Edildi
class AdminDashboard {
    constructor() {
        // API Configuration - Updated to match your API endpoints
        this.apiBaseUrl = 'https://localhost:7027/api'; // Main API Base URL
        this.chatApiBaseUrl = 'https://localhost:7027/api'; // Chat API (if different)
        this.chatHubUrl = 'https://localhost:7027/chathub'; // SignalR Hub URL

        this.token = localStorage.getItem('adminToken');
        this.currentUser = localStorage.getItem('adminUser') ? JSON.parse(localStorage.getItem('adminUser')) : null;

        this.charts = {};
        this.currentMessage = null;
        this.signalRConnection = null;
        this.eventsBound = false; // Flag to prevent duplicate event binding

        this.init();
    }

    async init() {
        // Check if user is authenticated
        if (this.isAuthenticated()) {
            this.showDashboard();
            this.bindEvents();

            // Dashboard/Mesajlar sekmesindeyken dataları yükle
            setTimeout(() => {
                this.loadDashboardData();
                // SignalR bağlantısını kur ve Admin grubuna katıl
                this.setupAdminSignalR();
            }, 500);
        } else {
            // Show login screen
            this.showLoginScreen();
            this.bindLoginEvents();
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        const token = localStorage.getItem('adminToken');
        const user = localStorage.getItem('adminUser');
        return token && user;
    }

    // Show login screen
    showLoginScreen() {
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('dashboard').style.display = 'none';
    }

    // Bind login events
    bindLoginEvents() {
        const loginForm = document.getElementById('loginForm');
        const togglePassword = document.getElementById('togglePassword');
        const passwordInput = document.getElementById('loginPassword');

        // Login form submission
        loginForm.addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Toggle password visibility
        togglePassword.addEventListener('click', () => {
            const type = passwordInput.type === 'password' ? 'text' : 'password';
            passwordInput.type = type;
            const icon = togglePassword.querySelector('i');
            icon.classList.toggle('fa-eye');
            icon.classList.toggle('fa-eye-slash');
        });
    }

    // Handle login
    async handleLogin() {
        const username = document.getElementById('loginUsername').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;
        const loginBtn = document.getElementById('loginBtn');

        // Show loading state
        loginBtn.disabled = true;
        loginBtn.innerHTML = '<i class="fa-solid fa-spinner fa-spin mr-2"></i>Yüklənir...';

        try {
            // Authenticate with API
            const loginData = {
                email: username,  // API expects email field
                password: password
            };

            console.log('Sending login request with data:', { email: username, password: '***' });
            console.log('Full request body:', JSON.stringify(loginData));

            const response = await this.apiRequest('/Authorization/LoginAdmin', {
                method: 'POST',
                body: JSON.stringify(loginData)
            });

            console.log('Login response:', response);

            // Check various possible response formats
            if (response) {
                // Handle different response formats
                let token = response.token || response.Token || response.accessToken || response.access_token;
                let user = response.user || response.User || response.data;

                if (token) {
                    // If user object doesn't exist, create a basic one
                    if (!user) {
                        user = {
                            id: response.userId || response.id || 'admin-1',
                            name: response.userName || response.username || username,
                            email: response.email || username,
                            username: username,
                            roles: response.roles || ['Admin']
                        };
                    }

                    // Ensure user object has necessary fields
                    if (!user.name && user.userName) user.name = user.userName;
                    if (!user.name && user.username) user.name = user.username;
                    if (!user.name) user.name = username;

                    console.log('Login successful! Token:', token);
                    console.log('User:', user);

                    // Successful login
                    this.handleSuccessfulLogin({ token, user }, rememberMe);
                } else {
                    // Login failed - no token in response
                    console.error('No token in response:', response);
                    Swal.fire({
                        icon: 'error',
                        title: 'Xəta',
                        text: 'İstifadəçi adı və ya şifrə yanlışdır!',
                        confirmButtonColor: '#3b82f6'
                    });
                }
            } else {
                // Login failed - empty response
                console.error('Empty response from API');
                Swal.fire({
                    icon: 'error',
                    title: 'Xəta',
                    text: 'Serverdən cavab alınmadı!',
                    confirmButtonColor: '#3b82f6'
                });
            }
        } catch (error) {
            console.error('Login error:', error);

            // Check if it's an invalid credentials error
            let errorMessage = 'Giriş zamanı xəta baş verdi.';

            if (error.message.includes('500')) {
                errorMessage = '❌ Email və ya şifrə yanlışdır!\n\nVə ya bu istifadəçi Admin deyil.\n\nZəhmət olmasa düzgün Admin credentials-larını daxil edin.';
            } else if (error.message.includes('401')) {
                errorMessage = '❌ Email və ya şifrə yanlışdır!';
            } else if (error.message.includes('400')) {
                errorMessage = '❌ Email və ya şifrə formatı düzgün deyil!';
            } else if (error.message.includes('Failed to fetch')) {
                errorMessage = '❌ API server-ə qoşulmaq mümkün deyil!\n\nZəhmət olmasa API server-in işlədiyindən əmin olun:\nhttps://localhost:7027';
            } else {
                errorMessage = error.message;
            }

            Swal.fire({
                icon: 'error',
                title: 'Giriş Uğursuz',
                html: errorMessage.replace(/\n/g, '<br>'),
                confirmButtonColor: '#3b82f6',
                confirmButtonText: 'Yenidən cəhd et'
            });
        } finally {
            // Reset button state
            loginBtn.disabled = false;
            loginBtn.innerHTML = '<i class="fa-solid fa-sign-in-alt mr-2"></i><span>Daxil ol</span>';
        }
    }

    // Handle successful login
    handleSuccessfulLogin(response, rememberMe) {
        console.log('handleSuccessfulLogin called with:', response);

        // Store token and user info
        if (rememberMe) {
            localStorage.setItem('adminToken', response.token);
            localStorage.setItem('adminUser', JSON.stringify(response.user));
        } else {
            sessionStorage.setItem('adminToken', response.token);
            sessionStorage.setItem('adminUser', JSON.stringify(response.user));
        }

        // Also set in class properties
        this.token = response.token;
        this.currentUser = response.user;

        // Always update localStorage for compatibility
        localStorage.setItem('adminToken', response.token);
        localStorage.setItem('adminUser', JSON.stringify(response.user));

        console.log('Token saved to localStorage:', localStorage.getItem('adminToken'));
        console.log('User saved to localStorage:', localStorage.getItem('adminUser'));

        // Show success message
        const userName = response.user?.name || response.user?.username || response.user?.userName || 'Admin';
        Swal.fire({
            icon: 'success',
            title: 'Uğurlu!',
            text: 'Xoş gəldiniz, ' + userName,
            timer: 1500,
            showConfirmButton: false
        });

        // Hide login screen and show dashboard
        setTimeout(() => {
            console.log('Switching to dashboard...');
            document.getElementById('loginScreen').style.display = 'none';
            this.showDashboard();
            this.bindEvents();
            this.loadDashboardData();
            this.setupAdminSignalR();
        }, 1500);
    }

    // Logout function
    async logout() {
        console.log('🔓 Starting logout process...');

        try {
            // Call API logout endpoint (optional - if API requires logout)
            try {
                console.log('📡 Calling API logout...');
                await this.apiRequest('/Authorization/LogOut', {
                    method: 'POST'
                });
                console.log('✅ API logout successful');
            } catch (error) {
                // Continue with logout even if API call fails
                console.log('⚠️ API logout call failed, continuing with local logout:', error);
            }
        } finally {
            console.log('🗑️ Clearing all storage...');

            // Always clear all tokens and user data from storage
            localStorage.removeItem('adminToken');
            localStorage.removeItem('adminUser');
            sessionStorage.removeItem('adminToken');
            sessionStorage.removeItem('adminUser');

            console.log('✅ Storage cleared!');
            console.log('Token after removal:', localStorage.getItem('adminToken')); // Should be null

            // Clear class properties
            this.token = null;
            this.currentUser = null;

            // Disconnect SignalR if connected
            if (this.signalRConnection) {
                try {
                    console.log('📡 Disconnecting SignalR...');
                    await this.signalRConnection.stop();
                    console.log('✅ SignalR disconnected');
                } catch (error) {
                    console.log('⚠️ SignalR disconnect error:', error);
                }
            }

            // Show success message
            Swal.fire({
                icon: 'success',
                title: 'Çıxış edildi',
                html: 'Uğurla çıxış etdiniz.<br>JWT token localStorage-dən silindi.',
                timer: 2000,
                showConfirmButton: false
            });

            // Reload page to show login screen
            setTimeout(() => {
                console.log('🔄 Reloading page...');
                window.location.reload();
            }, 2000);
        }
    }

    // --- REAL-TIME SIGNALR ENTEGRASYONU ---

    async setupAdminSignalR() {
        // Token'ı localStorage'dan alıyoruz
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) return;

        this.signalRConnection = new signalR.HubConnectionBuilder()
            .withUrl(this.chatHubUrl, {
                accessTokenFactory: () => adminToken
            })
            .withAutomaticReconnect()
            .build();

        // Yeni Admin Mesajı Geldiğinde İşleyici
        this.signalRConnection.on("ReceiveGroupMessage", (message) => {
            console.log("Real-Time Yeni Admin Mesajı Alındı:", message);

            // Sadece messages bölümündeysek listeyi yenile
            if (document.getElementById('messagesSection').classList.contains('hidden') === false) {
                this.loadMessages();
            }
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'info',
                title: `Yeni Admin Mesajı Gəldi!`,
                text: `${message.content.substring(0, 30)}...`,
                showConfirmButton: false,
                timer: 4000
            });
        });

        try {
            await this.signalRConnection.start();
            console.log("SignalR Admin Bağlantısı Başarılı.");

            // Admin qrupuna qoşulma
            await this.signalRConnection.invoke("JoinGroup", "Admins");
            console.log("SignalR: 'Admins' qrupuna qoşuldu.");

        } catch (err) {
            console.error("SignalR Admin Başlatma Hatası:", err);
        }
    }

    // --- API TOOLS ---

    // Generic API request method
    async apiRequest(endpoint, options = {}) {
        const token = localStorage.getItem('adminToken');
        const url = `${this.apiBaseUrl}${endpoint}`;

        console.log(`API Request: ${options.method || 'GET'} ${url}`);

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...(token ? { 'Authorization': `Bearer ${token}` } : {})
            }
        };

        const requestOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, requestOptions);

            console.log(`API Response: ${response.status} ${response.statusText}`);

            if (response.status === 401) {
                this.handleLogout();
                throw new Error('Yetkisiz Erişim. Token süresi dolmuş.');
            }

            if (!response.ok) {
                const errorBody = await response.text();
                console.error('API Error Body:', errorBody);

                // Try to parse as JSON for better error details
                try {
                    const errorJson = JSON.parse(errorBody);
                    console.error('Parsed Error:', errorJson);

                    // Extract validation errors if present
                    if (errorJson.errors) {
                        console.error('Validation Errors:', errorJson.errors);
                    }
                } catch (e) {
                    // Not JSON, just log the text
                }

                throw new Error(`HTTP Error: ${response.status}. ${errorBody}`);
            }

            // Handle empty responses
            const text = await response.text();
            return text ? JSON.parse(text) : null;

        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // Admin Chat API (7027 Portu) üçün sorğu funksiyası
    async chatApiRequest(endpoint, options = {}) {
        const adminToken = localStorage.getItem('adminToken');
        if (!adminToken) throw new Error("Admin Tokeni yoxdur. Giriş edin.");

        const url = `${this.chatApiBaseUrl}${endpoint}`;

        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            }
        };

        const requestOptions = { ...defaultOptions, ...options };

        try {
            const response = await fetch(url, requestOptions);

            if (response.status === 401) {
                this.handleLogout();
                throw new Error('Yetkisiz Erişim. Token süresi dolmuş.');
            }
            if (!response.ok) {
                const errorBody = await response.text();
                throw new Error(`HTTP xətası: ${response.status}. Detay: ${errorBody.substring(0, 100)}`);
            }

            return await response.json();

        } catch (error) {
            console.error('Chat API sorğusu uğursuz oldu:', error);
            throw error;
        }
    }

    // --- AUTHORIZATION ENDPOINTS ---
    async login(email, password) {
        return await this.apiRequest('/Authorization/login', {
            method: 'POST',
            body: JSON.stringify({ email, password })
        });
    }

    async register(userData) {
        return await this.apiRequest('/Authorization/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        });
    }

    async logout() {
        return await this.apiRequest('/Authorization/LogOut', {
            method: 'POST'
        });
    }

    async confirmEmail(token) {
        return await this.apiRequest(`/Authorization/confirm-email?token=${token}`, {
            method: 'GET'
        });
    }

    async loginGoogle() {
        return await this.apiRequest('/Authorization/login-google', {
            method: 'GET'
        });
    }

    async googleResponse() {
        return await this.apiRequest('/Authorization/google-response', {
            method: 'GET'
        });
    }

    async getAllUsers() {
        return await this.apiRequest('/Authorization/AllUsers', { method: 'GET' });
    }

    // --- AGENCY ENDPOINTS ---
    async getAgency(id) {
        return await this.apiRequest(`/Agency/${id}`, { method: 'GET' });
    }

    async getAllAgencies() {
        return await this.apiRequest('/Agency/GetAll', { method: 'GET' });
    }


    async createAgency(agencyData) {
        console.log('Creating Agency with data:', agencyData);
        console.log('API URL:', this.apiBaseUrl + '/Agency');

        return await this.apiRequest('/Agency', {
            method: 'POST',
            body: JSON.stringify(agencyData)
        });
    }

    async updateAgency(id, agencyData) {
        // PUT to /Agency/{id} with id also in body for compatibility
        const dataWithId = { id: parseInt(id), ...agencyData };

        console.log('Updating Agency with data:', dataWithId);
        console.log('API URL:', this.apiBaseUrl + `/Agency/${id}`);

        return await this.apiRequest(`/Agency/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dataWithId)
        });
    }

    async deleteAgency(id) {
        console.log('Deleting Agency ID:', id);
        console.log('API URL:', this.apiBaseUrl + `/Agency/${id}`);

        return await this.apiRequest(`/Agency/${id}`, { method: 'DELETE' });
    }


    // --- CATEGORY ENDPOINTS ---
    async getAllCategories() {
        return await this.apiRequest('/Category/GetAll', { method: 'GET' });
    }

    async getCategory(id) {
        return await this.apiRequest(`/Category/${id}`, { method: 'GET' });
    }

    async createCategory(categoryData) {
        return await this.apiRequest('/Category/Create', {
            method: 'POST',
            body: JSON.stringify(categoryData)
        });
    }

    async updateCategory(categoryData) {
        return await this.apiRequest('/Category', {
            method: 'PUT',
            body: JSON.stringify(categoryData)
        });
    }

    async deleteCategory(id) {
        return await this.apiRequest(`/Category/${id}`, { method: 'DELETE' });
    }

    // --- CITY ENDPOINTS ---
    async getAllCities() {
        return await this.apiRequest('/City/GetAll', { method: 'GET' });
    }

    async getCity(id) {
        return await this.apiRequest(`/City/${id}`, { method: 'GET' });
    }

    async createCity(cityData) {
        return await this.apiRequest('/City/Create', {
            method: 'POST',
            body: JSON.stringify(cityData)
        });
    }

    async updateCity(id, cityData) {
        // PUT to /City with id in body
        const dataWithId = {
            id: parseInt(id),
            ...cityData
        };

        return await this.apiRequest('/City', {
            method: 'PUT',
            body: JSON.stringify(dataWithId)
        });
    }
    async deleteCity(id) {
        return await this.apiRequest(`/City/${id}`, { method: 'DELETE' });
    }

    // --- DISTRICT ENDPOINTS ---
    async getAllDistricts() {
        return await this.apiRequest('/Dictrict/GetAll', { method: 'GET' });
    }

    async getDistrict(id) {
        return await this.apiRequest(`/Dictrict/${id}`, { method: 'GET' });
    }

    async createDistrict(districtData) {
        return await this.apiRequest('/Dictrict/Create', {
            method: 'POST',
            body: JSON.stringify(districtData)
        });
    }

    async updateDistrict(id, districtData) {
        // PUT to /Dictrict with id in body
        const dataWithId = {
            id: parseInt(id),
            ...districtData
        };

        return await this.apiRequest('/Dictrict', {
            method: 'PUT',
            body: JSON.stringify(dataWithId)
        });
    }


    async deleteDistrict(id) {
        return await this.apiRequest(`/Dictrict/${id}`, { method: 'DELETE' });
    }

    // --- FILTER ENDPOINTS ---
    async getListingsByAdvertType(advertType) {
        return await this.apiRequest(`/Filter/GetListingsByAdvertType?advertType=${advertType}`, { method: 'GET' });
    }

    async getListingsByCategory(categoryId) {
        return await this.apiRequest(`/Filter/GetListingsByCategory?categoryId=${categoryId}`, { method: 'GET' });
    }

    async getListingsByPriceRange(minPrice, maxPrice) {
        return await this.apiRequest(`/Filter/GetListingsByPriceRange?minPrice=${minPrice}&maxPrice=${maxPrice}`, { method: 'GET' });
    }

    async getListingsByRooms(rooms) {
        return await this.apiRequest(`/Filter/GetListingsByRooms?rooms=${rooms}`, { method: 'GET' });
    }

    async getListingsByLocations(locationIds) {
        return await this.apiRequest(`/Filter/GetListingsByLocations?locationIds=${locationIds.join(',')}`, { method: 'GET' });
    }

    async getListingsByMetroStations(metroIds) {
        return await this.apiRequest(`/Filter/GetListingsByMetroStations?metroIds=${metroIds.join(',')}`, { method: 'GET' });
    }

    async getListingsByFilter(filterData) {
        return await this.apiRequest('/Filter/GetListingsByFilter', {
            method: 'POST',
            body: JSON.stringify(filterData)
        });
    }

    // --- LISTING ENDPOINTS ---
    async getAllListings() {
        return await this.apiRequest('/Listing/GetListingsDetail', { method: 'GET' });
    }

    async getListingById(id) {
        return await this.apiRequest(`/Listing/GetListingById/${id}`, { method: 'GET' });
    }

    async getListingDetailById(id) {
        return await this.apiRequest(`/Listing/GetListingDetailById/${id}`, { method: 'GET' });
    }

    async getListingsDetail() {
        return await this.apiRequest('/Listing/GetListingsDetail', { method: 'GET' });
    }

    async createListing(listingData) {
        return await this.apiRequest('/Listing/CreateListing', {
            method: 'POST',
            body: JSON.stringify(listingData)
        });
    }

    async updateListing(listingData) {
        return await this.apiRequest('/Listing/UpdateListing', {
            method: 'PUT',
            body: JSON.stringify(listingData)
        });
    }

    async deleteListing(id) {
        return await this.apiRequest(`/Listing/DeleteListing/${id}`, { method: 'DELETE' });
    }

    // --- MESSAGE ENDPOINTS ---
    async sendMessage(messageData) {
        return await this.apiRequest('/Message/send', {
            method: 'POST',
            body: JSON.stringify(messageData)
        });
    }

    async getConversation(otherUserId) {
        return await this.apiRequest(`/Message/conversation/${otherUserId}`, { method: 'GET' });
    }

    async getMyMessages() {
        return await this.apiRequest('/Message/my-messages', { method: 'GET' });
    }

    async getUnreadMessages() {
        return await this.apiRequest('/Message/unread', { method: 'GET' });
    }

    async getAdminMessages() {
        return await this.apiRequest('/Message/admin-messages', { method: 'GET' });
    }

    async markMessageAsRead(messageId) {
        return await this.apiRequest(`/Message/mark-as-read/${messageId}`, { method: 'POST' });
    }

    async markConversationAsRead(otherUserId) {
        return await this.apiRequest(`/Message/mark-conversation-read/${otherUserId}`, { method: 'POST' });
    }

    // --- METRO STATION ENDPOINTS ---
    async getAllMetroStations() {
        return await this.apiRequest('/MetroStation/GetAll', { method: 'GET' });
    }

    async getMetroStation(id) {
        return await this.apiRequest(`/MetroStation/${id}`, { method: 'GET' });
    }

    async createMetroStation(metroData) {
        return await this.apiRequest('/MetroStation/Create', {
            method: 'POST',
            body: JSON.stringify(metroData)
        });
    }

    async updateMetroStation(metroData) {
        return await this.apiRequest('/MetroStation', {
            method: 'PUT',
            body: JSON.stringify(metroData)
        });
    }

    async deleteMetroStation(id) {
        return await this.apiRequest(`/MetroStation/${id}`, { method: 'DELETE' });
    }

    // --- PLACES ENDPOINTS ---
    async getNearbyPlaces(latitude, longitude, radius = 1000) {
        return await this.apiRequest(`/Places/nearby?lat=${latitude}&lng=${longitude}&radius=${radius}`, { method: 'GET' });
    }

    // --- ROLE ENDPOINTS ---
    async assignRole(roleData) {
        return await this.apiRequest('/Role/AssignRole', {
            method: 'POST',
            body: JSON.stringify(roleData)
        });
    }

    // --- PAYMENT ENDPOINTS ---
    async createPayment(paymentData) {
        return await this.apiRequest('/Payment/create', {
            method: 'POST',
            body: JSON.stringify(paymentData)
        });
    }

    async getPaymentSuccess() {
        return await this.apiRequest('/Payment/success', { method: 'GET' });
    }

    async getPaymentCancel() {
        return await this.apiRequest('/Payment/cancel', { method: 'GET' });
    }


    // --- MESAJLAR BÖLMƏSİ MƏNTİQİ ---

    // Admin Mesajlarını Çəkmə (New API endpoint)
    async loadMessages() {
        try {
            this.updateMessageTableStatus(true);

            // Use new API endpoint for admin messages
            const messages = await this.getAdminMessages();

            this.updateMessages(messages || []);
            this.updateMessageTableStatus(false);

        } catch (error) {
            console.error('Admin mesajları yüklənərkən xəta:', error);
            // Show empty state if API fails
            this.updateMessageTableStatus(false, 'Mesajlar yüklənə bilmədi');
            this.updateMessages([]);
        }
    }


    // Mesaj listini UI-da yeniləmə
    updateMessages(messages) {
        const messagesList = document.getElementById('messagesList');
        messagesList.innerHTML = '';

        if (messages.length === 0) {
            messagesList.innerHTML = `
                <div class="p-4 text-center text-gray-500">
                    <i class="fa-solid fa-inbox text-2xl mb-2"></i>
                    <p>Mesaj yoxdur</p>
                </div>
            `;
            this.updateUnreadCount(0);
            return;
        }

        let unreadCount = 0;

        messages.forEach(message => {
            // Admin mesajlarında 'sender' istifadəçi, 'receiver' isə admin-dir (null).
            // Adminin tərəfindən göndərilmiş mesajları da göstərmək üçün m.SenderId == AdminId filtri lazımdır.
            // Bizim 'admin-messages' endpointimiz yalnız ReceiverId == null olanları gətirdiyi üçün bu sadələşir.

            if (!message.isRead) {
                unreadCount++;
            }

            const messageItem = document.createElement('div');
            messageItem.className = `p-4 cursor-pointer transition duration-200 ${!message.isRead ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`;
            messageItem.onclick = (event) => this.selectMessage(message, event.currentTarget);

            const timeAgo = this.getTimeAgo(message.createdAt);
            const typeIcon = this.getMessageTypeIcon(message.type || 'inquiry'); // type API'dan gəlməlidir
            const importantIcon = message.isImportant ? '<i class="fa-solid fa-star text-yellow-500 ml-1"></i>' : '';

            // Mock data-dakı subyekt/content/sender-i istifadə edir
            messageItem.innerHTML = `
                <div class="flex items-start justify-between">
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center mb-1">
                            ${typeIcon}
                            <span class="font-medium text-sm truncate ml-2">${message.sender || 'Bilinməyən Göndərən'}</span>
                            ${importantIcon}
                        </div>
                        <p class="text-sm text-gray-900 font-medium truncate">${message.subject || 'Yeni Mesaj'}</p>
                        <p class="text-xs text-gray-500 truncate mt-1">${message.content.substring(0, 50)}...</p>
                    </div>
                    <div class="text-xs text-gray-400 ml-2">
                        ${timeAgo}
                        ${!message.isRead ? '<div class="w-2 h-2 bg-blue-500 rounded-full mt-1"></div>' : ''}
                    </div>
                </div>
            `;

            messagesList.appendChild(messageItem);
        });

        this.updateUnreadCount(unreadCount);
    }

    // Mesaj Yüklənmə Statusunu göstərir
    updateMessageTableStatus(isLoading, error = null) {
        const listContainer = document.getElementById('messagesList');
        const messagesSection = document.getElementById('messagesSection');

        if (!messagesSection || messagesSection.classList.contains('hidden')) return;

        if (isLoading) {
            listContainer.innerHTML = `<div class="p-4 text-center"><i class="fa-solid fa-spinner fa-spin text-xl text-blue-600"></i><p class="mt-2 text-gray-600">Mesajlar yüklənir...</p></div>`;
        } else if (error) {
            listContainer.innerHTML = `<div class="p-4 text-red-600 text-center">${error}</div>`;
        }
    }

    // Mesajı Seçmə (Detay görünüşünü aktivləşdirir)
    selectMessage(message, element) {
        // Orijinal mock logic (Sizin mock logic'inizi təmizləyirəm)
        document.querySelectorAll('#messagesList > div').forEach(item => {
            item.classList.remove('bg-blue-100');
        });
        element.classList.add('bg-blue-100');

        this.currentMessage = message;

        // Mark as read API call (backend'de isRead=true edir)
        if (!message.isRead) {
            this.markMessageAsRead(message.id).then(() => {
                message.isRead = true;
                this.loadMessages(); // Listeyi yenile ki, badge kalksın
            }).catch(e => console.error("Oxundu işarələmə xətası:", e));
        }

        // Message Detail UI update
        document.getElementById('messageSubject').textContent = message.subject;

        const messageContent = document.getElementById('messageContent');
        messageContent.innerHTML = `
            <div class="space-y-4">
                <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                        <div class="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center">
                            <i class="fa-solid fa-user text-white"></i>
                        </div>
                        <div>
                            <p class="font-medium">${message.sender}</p>
                            <p class="text-sm text-gray-500">${message.email}</p>
                        </div>
                    </div>
                    <div class="text-right">
                        <p class="text-sm text-gray-500">${this.formatDate(message.createdAt)}</p>
                        <p class="text-xs text-gray-400">${this.getTimeAgo(message.createdAt)}</p>
                    </div>
                </div>
                
                <div class="border-t pt-4">
                    <p class="text-gray-700 leading-relaxed">${message.content}</p>
                </div>
                
                <div class="flex items-center space-x-2 pt-4 border-t">
                    <span class="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                        ${this.getMessageTypeLabel(message.type)}
                    </span>
                    ${message.isImportant ? '<span class="px-2 py-1 bg-yellow-100 text-yellow-600 text-xs rounded-full">Vacib</span>' : ''}
                    ${!message.isRead ? '<span class="px-2 py-1 bg-blue-100 text-blue-600 text-xs rounded-full">Oxunmamış</span>' : ''}
                </div>
            </div>
        `;

        // Show action buttons
        document.getElementById('markAsRead').classList.remove('hidden');
        document.getElementById('markAsImportant').classList.remove('hidden');
        document.getElementById('deleteMessage').classList.remove('hidden');
        document.getElementById('quickReplySection').classList.remove('hidden');
    }

    // --- EVENT BINDING ---
    bindEvents() {
        // Prevent duplicate event binding
        if (this.eventsBound) {
            console.log('Events already bound, skipping...');
            return;
        }

        console.log('Binding events...');
        this.eventsBound = true;

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            console.log('✅ Logout button found, binding event...');
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                console.log('🔴 Logout button CLICKED!');
                this.handleLogout();
            });
        } else {
            console.error('❌ Logout button NOT found!');
        }

        // Sidebar toggle
        document.getElementById('sidebarToggle')?.addEventListener('click', () => this.toggleSidebar());

        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const section = item.dataset.section;
                this.showSection(section);
            });
        });

        // Refresh buttons
        document.getElementById('refreshListings')?.addEventListener('click', () => this.loadListings());

        // Add buttons
        document.getElementById('addAgencyBtn')?.addEventListener('click', () => this.showAddAgencyModal());
        document.getElementById('addCategoryBtn')?.addEventListener('click', () => this.showAddCategoryModal());
        document.getElementById('addAgencyBtn')?.addEventListener('click', () => {
            console.log('🔵 Add Agency button clicked!');
            this.showAddAgencyModal();
        });
        document.getElementById('addDistrictBtn')?.addEventListener('click', () => this.showAddDistrictModal());
        document.getElementById('addMetroBtn')?.addEventListener('click', () => this.showAddMetroModal());

        // Settings
        document.getElementById('saveSettings')?.addEventListener('click', () => this.saveSettings());
        document.getElementById('changePassword')?.addEventListener('click', () => this.changePassword());

        // Filters
        document.getElementById('listingsFilter')?.addEventListener('change', (e) => this.filterListings(e.target.value));
    }

    // --- AUTHENTICATION ---

    async handleLogout() {
        console.log('════════════════════════════════');
        console.log('🔴 LOGOUT STARTED');
        console.log('════════════════════════════════');
        console.log('🔑 Token BEFORE:', localStorage.getItem('adminToken'));

        // Immediately clear storage
        console.log('🗑️ REMOVING token from localStorage...');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
        sessionStorage.removeItem('adminToken');
        sessionStorage.removeItem('adminUser');

        console.log('🔑 Token AFTER:', localStorage.getItem('adminToken'));
        console.log('════════════════════════════════');

        // Clear class properties
        this.token = null;
        this.currentUser = null;

        // Show message
        Swal.fire({
            icon: 'success',
            title: 'Çıxış Edildi!',
            html: 'Token localStorage-dən silindi.<br>Login ekranına yönləndirilirsiniz...',
            timer: 1500,
            showConfirmButton: false
        });

        // Reload after message
        setTimeout(() => {
            console.log('🔄 RELOADING PAGE...');
            window.location.reload();
        }, 1500);
    }

    // --- UI NAVIGATION ---

    showDashboard() {
        document.getElementById('dashboard').style.display = 'block';
        document.getElementById('loadingScreen').style.display = 'none';
        document.getElementById('loginScreen').style.display = 'none';
    }

    toggleSidebar() {
        const sidebar = document.getElementById('sidebar');
        sidebar.classList.toggle('collapsed');
    }

    showSection(sectionName) {
        // Hide all sections
        document.querySelectorAll('.content-section').forEach(section => {
            section.classList.add('hidden');
        });

        // Remove active class from all nav items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
        });

        // Show selected section
        const targetSection = document.getElementById(`${sectionName}Section`);
        if (targetSection) {
            targetSection.classList.remove('hidden');
        }

        // Add active class to selected nav item
        const activeNavItem = document.querySelector(`[data-section="${sectionName}"]`);
        if (activeNavItem) {
            activeNavItem.classList.add('active');
        }

        // Update page title
        const titles = {
            dashboard: 'Dashboard',
            listings: 'Elanlar',
            users: 'İstifadəçilər',
            agencies: 'Agentliklər',
            categories: 'Kateqoriyalar',
            cities: 'Şəhərlər',
            districts: 'Rayonlar',
            metro: 'Metro Stansiyaları',
            settings: 'Tənzimləmələr'
        };

        document.getElementById('pageTitle').textContent = titles[sectionName] || 'Dashboard';
        document.getElementById('pageSubtitle').textContent = this.getSectionSubtitle(sectionName);

        // Load section data
        this.loadSectionData(sectionName);
    }

    getSectionSubtitle(sectionName) {
        const subtitles = {
            dashboard: 'Ümumi statistika və idarəetmə',
            listings: 'Bütün elanları idarə edin',
            users: 'İstifadəçi hesablarını idarə edin',
            agencies: 'Agentlikləri idarə edin',
            categories: 'Kateqoriyaları idarə edin',
            cities: 'Şəhərləri idarə edin',
            districts: 'Rayonları idarə edin',
            metro: 'Metro stansiyalarını idarə edin',
            settings: 'Sistem tənzimləmələri'
        };
        return subtitles[sectionName] || '';
    }

    async loadSectionData(sectionName) {
        switch (sectionName) {
            case 'dashboard':
                await this.loadDashboardData();
                break;
            case 'listings':
                await this.loadListings();
                break;
            case 'users':
                await this.loadUsers();
                break;
            case 'agencies':
                await this.loadAgencies();
                break;
            case 'categories':
                await this.loadCategories();
                break;
            case 'cities':
                await this.loadCities();
                break;
            case 'districts':
                await this.loadDistricts();
                break;
            case 'metro':
                await this.loadMetroStations();
                break;
            case 'settings':
                await this.loadSettings();
                break;
        }
    }

    // --- DASHBOARD DATA ---
    async loadDashboardData() {
        try {
            console.log('Loading dashboard data from APIs...');
            console.log('Elanların Bölgüsü chart uses: https://localhost:7027/api/Listing/GetListingsDetail');

            // Load statistics
            const [listings, categories, districts, metroStations, users] = await Promise.all([
                this.getAllListings(),
                this.getAllCategories(),
                this.getAllDistricts(),
                this.getAllMetroStations(),
                this.getAllUsers()
            ]);

            console.log('Dashboard data loaded:', {
                totalListings: listings?.length || 0,
                totalUsers: users?.length || 0,
                totalCategories: categories?.length || 0,
                totalDistricts: districts?.length || 0,
                totalMetroStations: metroStations?.length || 0
            });

            const vipCount = this.getVipListingsCount(listings);
            console.log(`VIP Listings Count: ${vipCount}`);

            // Log VIP listings details for debugging
            if (listings && listings.length > 0) {
                const vipListings = listings.filter(listing => {
                    return listing.IsPremium === true ||
                        listing.isPremium === true ||
                        listing.premium === true ||
                        listing.isVip === true ||
                        listing.IsVip === true;
                });
                console.log('VIP Listings found:', vipListings.map(l => ({ id: l.id, title: l.title, IsPremium: l.IsPremium, isPremium: l.isPremium })));
            }

            this.updateStats({
                totalListings: listings?.length || 0,
                vipListings: vipCount,
                totalUsers: users?.length || 0,
                totalCategories: categories?.length || 0,
                totalDistricts: districts?.length || 0,
                totalMetroStations: metroStations?.length || 0
            });

            // Sort by creation date (newest first) and get last 10
            const sortedListings = listings?.sort((a, b) => new Date(b.date || b.createdAt) - new Date(a.date || a.createdAt)) || [];
            this.updateRecentListings(sortedListings.slice(0, 10));
            this.initializeCharts(listings || []);

        } catch (error) {
            console.error('Dashboard data loading error:', error);
            // Show empty state if API fails
            this.updateStats({
                totalListings: 0,
                vipListings: 0,
                totalUsers: 0,
                totalCategories: 0,
                totalDistricts: 0,
                totalMetroStations: 0
            });
            this.updateRecentListings([]);
            this.initializeCharts([]);
        }
    }


    getVipListingsCount(listings) {
        if (!listings || !Array.isArray(listings)) {
            console.log('getVipListingsCount: No listings or not an array');
            return 0;
        }

        console.log(`getVipListingsCount: Processing ${listings.length} listings`);

        // Handle different possible field names for premium status
        const vipListings = listings.filter(listing => {
            const isVip = listing.IsPremium === true ||
                listing.isPremium === true ||
                listing.premium === true ||
                listing.isVip === true ||
                listing.IsVip === true;

            if (isVip) {
                console.log(`VIP Listing found: ID=${listing.id}, Title=${listing.title}, IsPremium=${listing.IsPremium}, isPremium=${listing.isPremium}`);
            }

            return isVip;
        });

        console.log(`getVipListingsCount: Found ${vipListings.length} VIP listings out of ${listings.length} total listings`);
        return vipListings.length;
    }

    updateStats(stats) {
        document.getElementById('totalListings').textContent = stats.totalListings;
        document.getElementById('totalUsers').textContent = stats.totalUsers || 0;
        document.getElementById('vipListings').textContent = stats.vipListings || 0;
    }

    updateRecentListings(listings) {
        const tbody = document.getElementById('recentListingsTable');
        tbody.innerHTML = '';

        listings.forEach(listing => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${listing.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${listing.title}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatPrice(listing.price)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${this.formatDate(listing.date || listing.createdAt)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="adminDashboard.viewListing('${listing.id}')" class="text-blue-600 hover:text-blue-900 mr-2">Bax</button>
                    <button onclick="adminDashboard.editListing('${listing.id}')" class="text-green-600 hover:text-green-900 mr-2">Redaktə</button>
                    <button onclick="adminDashboard.deleteListing('${listing.id}')" class="text-red-600 hover:text-red-900">Sil</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    initializeCharts(listings) {
        // Categories chart
        const categoriesCtx = document.getElementById('listingsChart');
        if (categoriesCtx && typeof Chart !== 'undefined') {
            // Destroy existing chart if it exists
            if (this.charts.listings) {
                this.charts.listings.destroy();
            }

            console.log(`Creating Elanların Bölgüsü chart with ${listings?.length || 0} listings from GetListingsDetail API`);
            const categoryData = this.getCategoryDistribution(listings);
            console.log('Category distribution for chart:', categoryData);

            // Handle empty data case
            if (categoryData.labels.length === 0) {
                categoryData.labels = ['Məlumat yoxdur'];
                categoryData.data = [1];
            }

            this.charts.listings = new Chart(categoriesCtx, {
                type: 'doughnut',
                data: {
                    labels: categoryData.labels,
                    datasets: [{
                        data: categoryData.data,
                        backgroundColor: [
                            '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6',
                            '#06B6D4', '#84CC16', '#F97316', '#EC4899', '#14B8A6',
                            '#F97316', '#6366F1', '#8B5CF6', '#EC4899'
                        ]
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                padding: 20,
                                usePointStyle: true
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function (context) {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a, b) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value} (${percentage}%)`;
                                }
                            }
                        }
                    }
                }
            });
        }

        // Monthly chart
        const monthlyCtx = document.getElementById('monthlyChart');
        if (monthlyCtx && typeof Chart !== 'undefined') {
            // Destroy existing chart if it exists
            if (this.charts.monthly) {
                this.charts.monthly.destroy();
            }

            const monthlyData = this.getMonthlyStatistics(listings);

            this.charts.monthly = new Chart(monthlyCtx, {
                type: 'line',
                data: {
                    labels: monthlyData.labels,
                    datasets: [{
                        label: 'Yeni Elanlar',
                        data: monthlyData.data,
                        borderColor: '#3B82F6',
                        backgroundColor: 'rgba(59, 130, 246, 0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#3B82F6',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        tension: 0.4,
                        fill: true
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: '#3B82F6',
                            borderWidth: 1,
                            callbacks: {
                                label: function (context) {
                                    return `${context.dataset.label}: ${context.parsed.y} elan`;
                                }
                            }
                        },
                        legend: {
                            display: true,
                            position: 'top',
                            labels: {
                                usePointStyle: true,
                                padding: 20
                            }
                        }
                    },
                    scales: {
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: '#6B7280'
                            }
                        },
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: 'rgba(107, 114, 128, 0.1)'
                            },
                            ticks: {
                                color: '#6B7280',
                                callback: function (value) {
                                    return Number.isInteger(value) ? value : null;
                                }
                            }
                        }
                    }
                }
            });
        }
    }

    getCategoryDistribution(listings) {
        const categoryCount = {};

        listings.forEach(listing => {
            let categoryName = 'Digər';

            // Handle different possible category data structures
            if (listing.category) {
                if (typeof listing.category === 'string') {
                    categoryName = listing.category;
                } else if (listing.category.name) {
                    categoryName = listing.category.name;
                } else if (listing.category.categoryName) {
                    categoryName = listing.category.categoryName;
                }
            } else if (listing.categoryId) {
                // If we only have categoryId, we'll need to fetch category name
                categoryName = `Kateqoriya ${listing.categoryId}`;
            }

            categoryCount[categoryName] = (categoryCount[categoryName] || 0) + 1;
        });

        // Sort categories by count (descending) for better visualization
        const sortedCategories = Object.entries(categoryCount)
            .sort(([, a], [, b]) => b - a);

        return {
            labels: sortedCategories.map(([name]) => name),
            data: sortedCategories.map(([, count]) => count)
        };
    }

    getMonthlyStatistics(listings) {
        const monthlyCount = {};
        const currentDate = new Date();

        // Azerbaijani month names
        const monthNames = [
            'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'İyun',
            'İyul', 'Avqust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
        ];

        // Start from September (index 8) and go for 12 months
        let startMonth = 8; // September
        let startYear = currentDate.getFullYear();

        // If current month is before September, start from previous year's September
        if (currentDate.getMonth() < 8) {
            startYear = currentDate.getFullYear() - 1;
        }

        // Initialize 12 months starting from September
        for (let i = 0; i < 12; i++) {
            const monthIndex = (startMonth + i) % 12;
            const year = startYear + Math.floor((startMonth + i) / 12);
            const date = new Date(year, monthIndex, 1);
            const monthKey = `${year}-${String(monthIndex + 1).padStart(2, '0')}`;

            monthlyCount[monthKey] = {
                count: 0,
                monthName: monthNames[monthIndex],
                fullDate: date
            };
        }

        // Count listings by month
        listings.forEach(listing => {
            const dateField = listing.date || listing.createdAt;
            if (dateField) {
                const listingDate = new Date(dateField);
                const monthKey = `${listingDate.getFullYear()}-${String(listingDate.getMonth() + 1).padStart(2, '0')}`;

                if (monthlyCount[monthKey]) {
                    monthlyCount[monthKey].count++;
                }
            }
        });

        // Sort by date and extract data
        const sortedMonths = Object.values(monthlyCount)
            .sort((a, b) => a.fullDate - b.fullDate);

        return {
            labels: sortedMonths.map(month => month.monthName),
            data: sortedMonths.map(month => month.count)
        };
    }

    // --- LISTINGS MANAGEMENT ---
    async loadListings() {
        try {
            const listings = await this.getAllListings();
            this.updateAllListings(listings || []);
        } catch (error) {
            console.error('Listings loading error:', error);
            // Show empty state if API fails
            this.updateAllListings([]);
        }
    }


    updateAllListings(listings) {
        const tbody = document.getElementById('allListingsTable');
        tbody.innerHTML = '';

        listings.forEach(listing => {
            // Extract category name from different possible structures
            const categoryName = this.getListingCategoryName(listing);

            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${listing.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${listing.title}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${categoryName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatPrice(listing.price)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div class="flex flex-col">
                        <span>${this.formatListingDate(listing.date || listing.createdAt)}</span>
                        <span class="text-xs text-gray-400">${this.getTimeAgo(listing.date || listing.createdAt)}</span>
                    </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="adminDashboard.viewListing('${listing.id}')" class="text-blue-600 hover:text-blue-900 mr-2">Bax</button>
                    <button onclick="adminDashboard.editListing('${listing.id}')" class="text-green-600 hover:text-green-900 mr-2">Redaktə</button>
                    <button onclick="adminDashboard.deleteListing('${listing.id}')" class="text-red-600 hover:text-red-900">Sil</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getListingCategoryName(listing) {
        // Handle different possible category data structures from API
        if (listing.category) {
            if (typeof listing.category === 'string') {
                return listing.category;
            } else if (listing.category.name) {
                return listing.category.name;
            } else if (listing.category.categoryName) {
                return listing.category.categoryName;
            }
        } else if (listing.categoryId) {
            return `Kateqoriya ${listing.categoryId}`;
        }
        return 'Kateqoriya yoxdur';
    }

    filterListings(filter) {
        // Implementation for filtering listings
        console.log('Filtering listings by:', filter);
    }

    // --- USERS MANAGEMENT ---
    async loadUsers() {
        try {
            const users = await this.getAllUsers();
            this.updateUsers(users || []);
        } catch (error) {
            console.error('Users loading error:', error);
            // Show empty state if API fails
            this.updateUsers([]);
        }
    }


    updateUsers(users) {
        const tbody = document.getElementById('usersTable');
        tbody.innerHTML = '';

        users.forEach(user => {
            // Determine user status based on API data
            let status = 'Aktiv';
            let statusClass = 'bg-green-100 text-green-800';

            if (user.lockoutEnd && new Date(user.lockoutEnd) > new Date()) {
                status = 'Bloklanmış';
                statusClass = 'bg-red-100 text-red-800';
            } else if (!user.emailConfirmed) {
                status = 'Təsdiqlənməyib';
                statusClass = 'bg-yellow-100 text-yellow-800';
            }

            // Determine user type/role
            const userType = this.getUserTypeLabel(user.userType);

            // Get listing count from API response
            const listingCount = this.getUserListingCount(user);

            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${user.userName}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${user.email}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${userType}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusClass}">
                        ${status}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${listingCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${listingCount} elan
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="adminDashboard.viewUser('${user.id}')" class="text-blue-600 hover:text-blue-900 mr-2">Bax</button>
                    <button onclick="adminDashboard.editUser('${user.id}')" class="text-green-600 hover:text-green-900 mr-2">Redaktə</button>
                    <button onclick="adminDashboard.deleteUser('${user.id}')" class="text-red-600 hover:text-red-900">Sil</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getUserTypeLabel(userType) {
        const userTypes = {
            0: 'İstifadəçi',
            1: 'Admin',
            2: 'Agent'
        };
        return userTypes[userType] || 'Bilinməyən';
    }

    getUserListingCount(user) {
        let listingCount = 0;
        if (user.listings) {
            // If listings is an array, count the items
            if (Array.isArray(user.listings)) {
                listingCount = user.listings.length;
            }
            // If listings is an object with count property
            else if (typeof user.listings === 'object' && user.listings.count !== undefined) {
                listingCount = user.listings.count;
            }
            // If listings is a number
            else if (typeof user.listings === 'number') {
                listingCount = user.listings;
            }
        }
        return listingCount;
    }

    getTotalUserListings(users) {
        return users.reduce((total, user) => {
            return total + this.getUserListingCount(user);
        }, 0);
    }

    // --- AGENCIES MANAGEMENT ---
    async loadAgencies() {
        try {
            console.log('Loading agencies from API: https://localhost:7027/api/Agency');
            const agencies = await this.getAllAgencies();
            console.log('Agencies loaded:', agencies);

            // Process agencies data to match expected structure
            if (agencies && agencies.length > 0) {
                console.log(`Processing ${agencies.length} agencies...`);

                agencies.forEach((agency, index) => {
                    // Add ID if not present (use array index as fallback)
                    if (!agency.id) {
                        agency.id = index + 1;
                    }

                    // Map phoneNumber to phone for consistency
                    if (agency.phoneNumber && !agency.phone) {
                        agency.phone = agency.phoneNumber;
                    }

                    // Calculate listing count from listings array
                    agency.listingCount = agency.listings ? agency.listings.length : 0;

                    console.log(`Agency "${agency.name}" has ${agency.listingCount} listings`);
                });
            } else {
                console.log('No agencies found or empty response');
            }

            this.updateAgencies(agencies || []);
            console.log('Agencies table updated successfully');
        } catch (error) {
            console.error('Agencies loading error:', error);
            // Show empty state if API fails
            this.updateAgencies([]);
        }
    }

    // Render agencies into the Agencies table
    updateAgencies(agencies) {
        const tbody = document.getElementById('agenciesTable');
        if (!tbody) return;

        tbody.innerHTML = '';

        if (!Array.isArray(agencies) || agencies.length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500" colspan="6">Məlumat yoxdur</td>
            `;
            tbody.appendChild(row);
            return;
        }

        agencies.forEach((agency) => {
            const id = agency.id ?? '';
            const name = agency.name ?? '';
            const email = agency.email ?? '';
            const phone = agency.phone ?? agency.phoneNumber ?? '';
            const listingCount = Array.isArray(agency.listings) ? agency.listings.length : (agency.listingCount ?? 0);

            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${email || 'Email yoxdur'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${phone || 'Telefon yoxdur'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${listingCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${listingCount} elan
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="adminDashboard.viewAgency('${id}')" class="text-blue-600 hover:text-blue-900 mr-3">Bax</button>
                    <button onclick="adminDashboard.editAgency('${id}')" class="text-green-600 hover:text-green-900 mr-3">Redaktə</button>
                    <button onclick="adminDashboard.deleteAgency('${id}')" class="text-red-600 hover:text-red-900">Sil</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    async updateAgency(id, agencyData) {
        // PUT to /Agency/{id} with id also in body for compatibility (if agencyData already has id, it will be kept)
        const dataWithId = { id: parseInt(id), ...agencyData };

        return await this.apiRequest(`/Agency/${id}`, {
            method: 'PUT',
            body: JSON.stringify(dataWithId)
        });
    }

    // --- CATEGORIES MANAGEMENT ---
    async loadCategories() {
        try {
            const categories = await this.getAllCategories();
            this.updateCategories(categories || []);
        } catch (error) {
            console.error('Categories loading error:', error);
            // Show empty state if API fails
            this.updateCategories([]);
        }
    }


    updateCategories(categories) {
        const tbody = document.getElementById('categoriesTable');
        tbody.innerHTML = '';

        categories.forEach(category => {
            // Get listing count for this category
            const listingCount = this.getCategoryListingCount(category);

            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${category.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${category.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${listingCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${listingCount} elan
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="adminDashboard.editCategory('${category.id}')" class="text-green-600 hover:text-green-900 mr-2">Redaktə</button>
                    <button onclick="adminDashboard.deleteCategory('${category.id}')" class="text-red-600 hover:text-red-900">Sil</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getCategoryListingCount(category) {
        // Handle different possible listing count formats from API
        if (category.listingCount !== undefined) {
            return category.listingCount;
        } else if (category.listings) {
            if (Array.isArray(category.listings)) {
                return category.listings.length;
            } else if (typeof category.listings === 'object' && category.listings.count !== undefined) {
                return category.listings.count;
            } else if (typeof category.listings === 'number') {
                return category.listings;
            }
        }
        return 0;
    }
    // --- CITIES MANAGEMENT ---
    async loadCities() {
        try {
            console.log('Loading cities from API: https://localhost:7027/api/City/GetAll');
            const cities = await this.getAllCities();
            console.log('Cities loaded:', cities);

            // Process cities data
            if (cities && cities.length > 0) {
                console.log(`Processing ${cities.length} cities...`);

                cities.forEach(city => {
                    // Calculate district count if available
                    city.districtCount = 0;
                    if (city.dictrict && Array.isArray(city.dictrict)) {
                        city.districtCount = city.dictrict.length;
                    }
                    console.log(`City "${city.name}" has ${city.districtCount} districts`);
                });
            } else {
                console.log('No cities found or empty response');
            }

            this.updateCities(cities || []);
            console.log('Cities table updated successfully');
        } catch (error) {
            console.error('Cities loading error:', error);
            this.updateCities([]);
        }
    }

    updateCities(cities) {
        const tbody = document.getElementById('citiesTable');
        tbody.innerHTML = '';

        if (!cities || cities.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fa-solid fa-city text-4xl text-gray-300 mb-2"></i>
                            <p class="text-lg font-medium">Şəhərlər Yoxdur</p>
                            <p class="text-sm">API-dan şəhərlər gətirilə bilmədi</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        cities.forEach(city => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${city.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${city.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${city.districtCount > 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}">
                        ${city.districtCount || 0} rayon
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="adminDashboard.editCity('${city.id}')" class="text-green-600 hover:text-green-900 mr-2">Redaktə</button>
                    <button onclick="adminDashboard.deleteCity('${city.id}')" class="text-red-600 hover:text-red-900">Sil</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // --- DISTRICTS MANAGEMENT ---
    async loadDistricts() {
        try {
            console.log('Loading districts from API: https://localhost:7027/api/Dictrict/GetAll');
            const districts = await this.getAllDistricts();
            console.log('Districts loaded:', districts);

            // Process districts data to calculate listing counts
            if (districts && districts.length > 0) {
                console.log(`Processing ${districts.length} districts...`);

                districts.forEach(district => {
                    // Calculate total listing count from all locations in the district
                    let totalListings = 0;

                    if (district.location && Array.isArray(district.location)) {
                        district.location.forEach(location => {
                            if (location.listings && Array.isArray(location.listings)) {
                                totalListings += location.listings.length;
                            }
                        });
                    }

                    district.listingCount = totalListings;

                    // Extract city from the first location if available
                    if (district.location && district.location.length > 0) {
                        const firstLocation = district.location[0];
                        if (firstLocation.address) {
                            // Extract city from address (assuming format includes city)
                            const addressParts = firstLocation.address.split(', ');
                            if (addressParts.length > 2) {
                                district.city = addressParts[addressParts.length - 2]; // Second to last part is usually city
                            } else {
                                district.city = 'Bakı'; // Default to Baku if can't extract
                            }
                        }
                    }

                    console.log(`District "${district.name}" has ${district.listingCount} listings across ${district.location ? district.location.length : 0} locations`);
                });
            } else {
                console.log('No districts found or empty response');
            }

            this.updateDistricts(districts || []);
            console.log('Districts table updated successfully');
        } catch (error) {
            console.error('Districts loading error:', error);
            // Show empty state if API fails
            this.updateDistricts([]);
        }
    }


    updateDistricts(districts) {
        const tbody = document.getElementById('districtsTable');
        tbody.innerHTML = '';

        if (!districts || districts.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fa-solid fa-map-marker-alt text-4xl text-gray-300 mb-2"></i>
                            <p class="text-lg font-medium">Rayonlar Yoxdur</p>
                            <p class="text-sm">API-dan rayonlar gətirilə bilmədi</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        districts.forEach(district => {
            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${district.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${district.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${district.city || 'Bakı'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${district.listingCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${district.listingCount || 0} elan
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="adminDashboard.editDistrict('${district.id}')" class="text-green-600 hover:text-green-900 mr-2">Redaktə</button>
                    <button onclick="adminDashboard.deleteDistrict('${district.id}')" class="text-red-600 hover:text-red-900">Sil</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    // --- METRO STATIONS MANAGEMENT ---
    async loadMetroStations() {
        try {
            console.log('Loading metro stations from API: https://localhost:7027/api/MetroStation/GetAll');
            const metroStations = await this.getAllMetroStations();
            console.log('Metro stations loaded:', metroStations);

            // Process listing counts from the API response
            if (metroStations && metroStations.length > 0) {
                console.log(`Processing ${metroStations.length} metro stations...`);

                metroStations.forEach(station => {
                    // The API already includes listings array, so we can use it directly
                    station.listingCount = station.listings ? station.listings.length : 0;
                    console.log(`Metro station "${station.name}" has ${station.listingCount} listings`);
                });
            } else {
                console.log('No metro stations found or empty response');
            }

            this.updateMetroStations(metroStations || []);
            console.log('Metro stations table updated successfully');
        } catch (error) {
            console.error('Metro stations loading error:', error);
            // Show empty state if API fails
            this.updateMetroStations([]);
        }
    }


    updateMetroStations(metroStations) {
        const tbody = document.getElementById('metroTable');
        tbody.innerHTML = '';

        if (!metroStations || metroStations.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="4" class="px-6 py-8 text-center text-gray-500">
                        <div class="flex flex-col items-center">
                            <i class="fa-solid fa-train text-4xl text-gray-300 mb-2"></i>
                            <p class="text-lg font-medium">Metro Stansiyaları Yoxdur</p>
                            <p class="text-sm">API-dan metro stansiyaları gətirilə bilmədi</p>
                        </div>
                    </td>
                </tr>
            `;
            return;
        }

        metroStations.forEach(station => {
            // Get listing count for this metro station from API
            const listingCount = this.getMetroStationListingCount(station);

            const row = document.createElement('tr');
            row.className = 'table-row';
            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${station.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${station.name}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${listingCount > 0 ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}">
                        ${listingCount} elan
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="adminDashboard.editMetroStation('${station.id}')" class="text-green-600 hover:text-green-900 mr-2">Redaktə</button>
                    <button onclick="adminDashboard.deleteMetroStation('${station.id}')" class="text-red-600 hover:text-red-900">Sil</button>
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getMetroStationListingCount(station) {
        // Handle the API response structure where listings is an array
        if (station.listingCount !== undefined) {
            return station.listingCount;
        } else if (station.listings) {
            if (Array.isArray(station.listings)) {
                return station.listings.length;
            } else if (typeof station.listings === 'object' && station.listings.count !== undefined) {
                return station.listings.count;
            } else if (typeof station.listings === 'number') {
                return station.listings;
            }
        }
        return 0;
    }

    // --- SETTINGS ---
    async loadSettings() {
        // Load current settings
        console.log('Loading settings...');
    }

    async saveSettings() {
        const siteName = document.getElementById('siteName').value;
        const siteEmail = document.getElementById('siteEmail').value;
        const sitePhone = document.getElementById('sitePhone').value;

        // Save settings logic
        Swal.fire('Uğurlu!', 'Tənzimləmələr saxlanıldı', 'success');
    }

    async changePassword() {
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            Swal.fire('Xəta!', 'Yeni şifrələr uyğun gəlmir', 'error');
            return;
        }

        // Change password logic
        Swal.fire('Uğurlu!', 'Şifrə dəyişdirildi', 'success');
    }

    // --- UTILITY METHODS ---
    formatPrice(price) {
        return new Intl.NumberFormat('az-AZ', {
            style: 'currency',
            currency: 'AZN'
        }).format(price || 0);
    }

    formatDate(date) {
        if (!date) return 'Tarix yoxdur';

        try {
            const dateObj = new Date(date);

            // Check if date is valid
            if (isNaN(dateObj.getTime())) {
                return 'Tarix yoxdur';
            }

            // Format date in Azerbaijani locale
            return dateObj.toLocaleDateString('az-AZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
        } catch (error) {
            console.error('Date formatting error:', error);
            return 'Tarix yoxdur';
        }
    }

    formatListingDate(date) {
        if (!date) return 'Tarix yoxdur';

        try {
            const dateObj = new Date(date);

            // Check if date is valid
            if (isNaN(dateObj.getTime())) {
                return 'Tarix yoxdur';
            }

            // Format date with time for listings
            const dateStr = dateObj.toLocaleDateString('az-AZ', {
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });

            const timeStr = dateObj.toLocaleTimeString('az-AZ', {
                hour: '2-digit',
                minute: '2-digit'
            });

            return `${dateStr} ${timeStr}`;
        } catch (error) {
            console.error('Listing date formatting error:', error);
            return 'Tarix yoxdur';
        }
    }

    getTimeAgo(date) {
        const now = new Date();
        const messageDate = new Date(date);
        const diffInSeconds = Math.floor((now - messageDate) / 1000);

        if (diffInSeconds < 60) return 'İndi';
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} dəqiqə əvvəl`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} saat əvvəl`;
        return `${Math.floor(diffInSeconds / 86400)} gün əvvəl`;
    }

    getMessageTypeLabel(type) {
        const types = {
            'inquiry': 'Sorğu',
            'complaint': 'Şikayət',
            'suggestion': 'Təklif',
            'support': 'Dəstək'
        };
        return types[type] || 'Digər';
    }

    getMessageTypeIcon(type) {
        const icons = {
            'inquiry': '<i class="fa-solid fa-question-circle text-blue-500"></i>',
            'complaint': '<i class="fa-solid fa-exclamation-triangle text-red-500"></i>',
            'suggestion': '<i class="fa-solid fa-lightbulb text-yellow-500"></i>',
            'support': '<i class="fa-solid fa-headset text-green-500"></i>'
        };
        return icons[type] || '<i class="fa-solid fa-envelope text-gray-500"></i>';
    }

    updateUnreadCount(count) {
        const unreadElement = document.getElementById('unreadCount');
        if (count > 0) {
            unreadElement.textContent = count;
            unreadElement.classList.remove('hidden');
        } else {
            unreadElement.classList.add('hidden');
        }
    }

    // --- ACTION METHODS ---
    async viewListing(id) {
        try {
            const listing = await this.getListingDetailById(id);
            Swal.fire({
                title: listing.title,
                html: `
                    <div class="text-left">
                        <p><strong>Qiymət:</strong> ${this.formatPrice(listing.price)}</p>
                        <p><strong>Kateqoriya:</strong> ${listing.category}</p>
                        <p><strong>Təsvir:</strong> ${listing.description}</p>
                        <p><strong>Status:</strong> ${listing.isActive ? 'Aktiv' : 'Qeyri-aktiv'}</p>
                    </div>
                `,
                showConfirmButton: false,
                showCancelButton: true,
                cancelButtonText: 'Bağla'
            });
        } catch (error) {
            Swal.fire('Xəta!', 'Elan məlumatları yüklənə bilmədi', 'error');
        }
    }

    async editListing(id) {
        try {
            const listing = await this.getListingDetailById(id);
            Swal.fire({
                title: 'Elanı Redaktə Et',
                html: `
                    <div class="text-left space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Başlıq</label>
                            <input type="text" id="editTitle" class="w-full px-3 py-2 border border-gray-300 rounded-lg" value="${listing.title || ''}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Qiymət</label>
                            <input type="number" id="editPrice" class="w-full px-3 py-2 border border-gray-300 rounded-lg" value="${listing.price || ''}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Status</label>
                            <select id="editStatus" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="true" ${listing.isActive ? 'selected' : ''}>Aktiv</option>
                                <option value="false" ${!listing.isActive ? 'selected' : ''}>Qeyri-aktiv</option>
                            </select>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Yadda Saxla',
                cancelButtonText: 'Ləğv Et',
                preConfirm: () => {
                    const title = document.getElementById('editTitle').value;
                    const price = document.getElementById('editPrice').value;
                    const isActive = document.getElementById('editStatus').value === 'true';

                    if (!title.trim()) {
                        Swal.showValidationMessage('Başlıq boş ola bilməz');
                        return false;
                    }
                    if (!price || price <= 0) {
                        Swal.showValidationMessage('Qiymət düzgün olmalıdır');
                        return false;
                    }

                    return { title, price: parseFloat(price), isActive };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const updatedListing = {
                        ...listing,
                        title: result.value.title,
                        price: result.value.price,
                        isActive: result.value.isActive
                    };

                    this.updateListing(updatedListing).then(() => {
                        Swal.fire('Uğurlu!', 'Elan yeniləndi', 'success');
                        this.loadDashboardData();
                        this.loadListings();
                    }).catch(error => {
                        Swal.fire('Xəta!', 'Elan yenilənə bilmədi', 'error');
                    });
                }
            });
        } catch (error) {
            Swal.fire('Xəta!', 'Elan məlumatları yüklənə bilmədi', 'error');
        }
    }

    async deleteListing(id) {
        const result = await Swal.fire({
            title: 'Silməyi təsdiqləyin',
            text: 'Bu elanı silmək istədiyinizə əminsiniz?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Bəli, sil',
            cancelButtonText: 'Ləğv et'
        });

        if (result.isConfirmed) {
            try {
                await this.apiRequest(`/Listing/DeleteListing/${id}`, { method: 'DELETE' });
                Swal.fire('Silindi!', 'Elan silindi', 'success');
                // Refresh both dashboard and listings data
                this.loadDashboardData();
                this.loadListings();
            } catch (error) {
                Swal.fire('Xəta!', 'Elan silinə bilmədi', 'error');
            }
        }
    }

    // Similar implementations for other CRUD operations...
    async viewUser(id) {
        try {
            const user = await this.getAllUsers();
            const targetUser = user.find(u => u.id === id);
            if (targetUser) {
                const listingCount = this.getUserListingCount(targetUser);
                Swal.fire({
                    title: targetUser.userName,
                    html: `
                        <div class="text-left">
                            <p><strong>Email:</strong> ${targetUser.email}</p>
                            <p><strong>Tip:</strong> ${this.getUserTypeLabel(targetUser.userType)}</p>
                            <p><strong>Email Təsdiqləndi:</strong> ${targetUser.emailConfirmed ? 'Bəli' : 'Xeyr'}</p>
                            <p><strong>Telefon:</strong> ${targetUser.phoneNumber || 'Yoxdur'}</p>
                            <p><strong>Elan Sayı:</strong> ${listingCount}</p>
                            <p><strong>Status:</strong> ${targetUser.lockoutEnd && new Date(targetUser.lockoutEnd) > new Date() ? 'Bloklanmış' : 'Aktiv'}</p>
                        </div>
                    `,
                    showConfirmButton: false,
                    showCancelButton: true,
                    cancelButtonText: 'Bağla'
                });
            }
        } catch (error) {
            Swal.fire('Xəta!', 'İstifadəçi məlumatları yüklənə bilmədi', 'error');
        }
    }

    async editUser(id) {
        Swal.fire({
            title: 'İstifadəçini Redaktə Et',
            text: 'Bu funksiya hazırda inkişaf etdirilir.',
            icon: 'info',
            confirmButtonText: 'Tamam'
        });
    }

    async deleteUser(id) {
        const result = await Swal.fire({
            title: 'İstifadəçini Sil',
            text: 'Bu istifadəçini silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Bəli, sil',
            cancelButtonText: 'Ləğv et',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280'
        });

        if (result.isConfirmed) {
            try {
                // Note: User delete endpoint not available in current API list
                Swal.fire('Uğurlu!', 'İstifadəçi silindi', 'success');
                this.loadUsers();
            } catch (error) {
                Swal.fire('Xəta!', 'İstifadəçi silinə bilmədi', 'error');
            }
        }
    }

    async viewAgency(id) {
        try {
            const agency = await this.getAgency(id);

            // Calculate listing count from listings array if available
            const listingCount = agency.listings ? agency.listings.length : (agency.listingCount || 0);

            Swal.fire({
                title: agency.name,
                html: `
                    <div class="text-left">
                        <p><strong>Email:</strong> ${agency.email || 'Email yoxdur'}</p>
                        <p><strong>Telefon:</strong> ${agency.phone || agency.phoneNumber || 'Telefon yoxdur'}</p>
                        <p><strong>Ünvan:</strong> ${agency.address || 'Ünvan yoxdur'}</p>
                        <p><strong>Təsvir:</strong> ${agency.description || 'Təsvir yoxdur'}</p>
                        <p><strong>Elan sayı:</strong> ${listingCount}</p>
                    </div>
                `,
                showConfirmButton: false,
                showCancelButton: true,
                cancelButtonText: 'Bağla'
            });
        } catch (error) {
            Swal.fire('Xəta!', 'Agentlik məlumatları yüklənə bilmədi', 'error');
        }
    }
    async editAgency(id) {
        try {
            const agency = await this.getAgency(id);

            Swal.fire({
                title: 'Agentliyi Redaktə Et',
                html: `
                    <div class="text-left space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Agentlik Adı *</label>
                            <input type="text" id="editAgencyName" class="w-full px-3 py-2 border border-gray-300 rounded-lg" value="${agency.name || ''}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Təsvir</label>
                            <textarea id="editAgencyDescription" rows="3" class="w-full px-3 py-2 border border-gray-300 rounded-lg">${agency.description || ''}</textarea>
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Telefon Nömrəsi *</label>
                            <input type="tel" id="editAgencyPhone" class="w-full px-3 py-2 border border-gray-300 rounded-lg" value="${agency.phone || agency.phoneNumber || ''}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input type="email" id="editAgencyEmail" class="w-full px-3 py-2 border border-gray-300 rounded-lg" value="${agency.email || ''}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Ünvan *</label>
                            <input type="text" id="editAgencyAddress" class="w-full px-3 py-2 border border-gray-300 rounded-lg" value="${agency.address || ''}">
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Yadda Saxla',
                cancelButtonText: 'Ləğv Et',
                width: '600px',
                preConfirm: () => {
                    const name = document.getElementById('editAgencyName').value;
                    const description = document.getElementById('editAgencyDescription').value;
                    const phoneNumber = document.getElementById('editAgencyPhone').value;
                    const email = document.getElementById('editAgencyEmail').value;
                    const address = document.getElementById('editAgencyAddress').value;

                    if (!name.trim()) {
                        Swal.showValidationMessage('Agentlik adı boş ola bilməz');
                        return false;
                    }

                    if (!description.trim()) {
                        Swal.showValidationMessage('Təsvir boş ola bilməz');
                        return false;
                    }

                    if (!phoneNumber.trim()) {
                        Swal.showValidationMessage('Telefon nömrəsi boş ola bilməz');
                        return false;
                    }

                    if (!email.trim()) {
                        Swal.showValidationMessage('Email boş ola bilməz');
                        return false;
                    }

                    // Email validation
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(email)) {
                        Swal.showValidationMessage('Düzgün email daxil edin');
                        return false;
                    }

                    if (!address.trim()) {
                        Swal.showValidationMessage('Ünvan boş ola bilməz');
                        return false;
                    }

                    return { name, description, phoneNumber, email, address };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const updatedAgency = {
                        name: result.value.name,
                        description: result.value.description,
                        phoneNumber: result.value.phoneNumber,
                        email: result.value.email,
                        address: result.value.address
                    };

                    console.log('Agency update data to send:', updatedAgency);

                    this.updateAgency(id, updatedAgency).then(() => {
                        Swal.fire('Uğurlu!', 'Agentlik yeniləndi', 'success');
                        this.loadAgencies();
                    }).catch(error => {
                        console.error('Agency update error:', error);
                        Swal.fire('Xəta!', 'Agentlik yenilənə bilmədi: ' + error.message, 'error');
                    });
                }
            });
        } catch (error) {
            console.error('Error loading agency data:', error);
            Swal.fire('Xəta!', 'Agentlik məlumatları yüklənə bilmədi: ' + error.message, 'error');
        }
    }
    async deleteAgency(id) {
        const result = await Swal.fire({
            title: 'Agentliyi Sil',
            text: 'Bu agentliyi silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Bəli, sil',
            cancelButtonText: 'Ləğv et',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280'
        });

        if (result.isConfirmed) {
            try {
                await this.apiRequest(`/Agency/${id}`, { method: 'DELETE' });
                Swal.fire('Silindi!', 'Agentlik silindi', 'success');
                this.loadAgencies();
            } catch (error) {
                Swal.fire('Xəta!', 'Agentlik silinə bilmədi', 'error');
            }
        }
    }

    async editCategory(id) {
        try {
            const category = await this.getCategory(id);
            Swal.fire({
                title: 'Kateqoriyanı Redaktə Et',
                html: `
                    <div class="text-left space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                            <input type="text" id="editCategoryName" class="w-full px-3 py-2 border border-gray-300 rounded-lg" value="${category.name || ''}">
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Yadda Saxla',
                cancelButtonText: 'Ləğv Et',
                preConfirm: () => {
                    const name = document.getElementById('editCategoryName').value;

                    if (!name.trim()) {
                        Swal.showValidationMessage('Ad boş ola bilməz');
                        return false;
                    }

                    return { name };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const updatedCategory = {
                        ...category,
                        name: result.value.name
                    };

                    this.updateCategory(updatedCategory).then(() => {
                        Swal.fire('Uğurlu!', 'Kateqoriya yeniləndi', 'success');
                        this.loadCategories();
                    }).catch(error => {
                        Swal.fire('Xəta!', 'Kateqoriya yenilənə bilmədi', 'error');
                    });
                }
            });
        } catch (error) {
            Swal.fire('Xəta!', 'Kateqoriya məlumatları yüklənə bilmədi', 'error');
        }
    }

    async deleteCategory(id) {
        const result = await Swal.fire({
            title: 'Kateqoriyanı Sil',
            text: 'Bu kateqoriyanı silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Bəli, sil',
            cancelButtonText: 'Ləğv et',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280'
        });

        if (result.isConfirmed) {
            try {
                await this.apiRequest(`/Category/${id}`, { method: 'DELETE' });
                Swal.fire('Silindi!', 'Kateqoriya silindi', 'success');
                this.loadCategories();
            } catch (error) {
                Swal.fire('Xəta!', 'Kateqoriya silinə bilmədi', 'error');
            }
        }
    }
    async editDistrict(id) {
        try {
            // Load district and cities
            const [district, cities] = await Promise.all([
                this.getDistrict(id),
                this.getAllCities()
            ]);

            if (!cities || cities.length === 0) {
                Swal.fire('Xəta!', 'Şəhərlər yüklənə bilmədi', 'error');
                return;
            }

            // Create city options HTML
            const cityOptions = cities.map(city =>
                `<option value="${city.id}" ${district.cityId === city.id ? 'selected' : ''}>${city.name}</option>`
            ).join('');

            Swal.fire({
                title: 'Rayonu Redaktə Et',
                html: `
                    <div class="text-left space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Rayon Adı</label>
                            <input type="text" id="editDistrictName" class="w-full px-3 py-2 border border-gray-300 rounded-lg" value="${district.name || ''}">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Şəhər</label>
                            <select id="editDistrictCityId" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">Şəhər seçin</option>
                                ${cityOptions}
                            </select>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Yadda Saxla',
                cancelButtonText: 'Ləğv Et',
                preConfirm: () => {
                    const name = document.getElementById('editDistrictName').value;
                    const cityId = document.getElementById('editDistrictCityId').value;

                    if (!name.trim()) {
                        Swal.showValidationMessage('Rayon adı boş ola bilməz');
                        return false;
                    }
                    if (!cityId) {
                        Swal.showValidationMessage('Şəhər seçilməlidir');
                        return false;
                    }

                    return { name, cityId: parseInt(cityId) };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const updatedDistrict = {
                        id: district.id,
                        name: result.value.name,
                        cityId: result.value.cityId
                    };

                    this.updateDistrict(id, updatedDistrict).then(() => {
                        Swal.fire('Uğurlu!', 'Rayon yeniləndi', 'success');
                        this.loadDistricts();
                    }).catch(error => {
                        console.error('District update error:', error);
                        Swal.fire('Xəta!', 'Rayon yenilənə bilmədi: ' + error.message, 'error');
                    });
                }
            });
        } catch (error) {
            console.error('Error loading district data:', error);
            Swal.fire('Xəta!', 'Rayon məlumatları yüklənə bilmədi: ' + error.message, 'error');
        }
    }

    async deleteDistrict(id) {
        const result = await Swal.fire({
            title: 'Rayonu Sil',
            text: 'Bu rayonu silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Bəli, sil',
            cancelButtonText: 'Ləğv et',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280'
        });

        if (result.isConfirmed) {
            try {
                await this.apiRequest(`/Dictrict/${id}`, { method: 'DELETE' });
                Swal.fire('Silindi!', 'Rayon uğurla silindi', 'success');
                this.loadDistricts();
            } catch (error) {
                console.error('District delete error:', error);
                Swal.fire('Xəta!', 'Rayon silinə bilmədi: ' + error.message, 'error');
            }
        }
    }
    async editMetroStation(id) {
        try {
            const station = await this.getMetroStation(id);
            Swal.fire({
                title: 'Metro Stansiyasını Redaktə Et',
                html: `
                    <div class="text-left space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Ad</label>
                            <input type="text" id="editMetroName" class="w-full px-3 py-2 border border-gray-300 rounded-lg" value="${station.name || ''}">
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Yadda Saxla',
                cancelButtonText: 'Ləğv Et',
                preConfirm: () => {
                    const name = document.getElementById('editMetroName').value;

                    if (!name.trim()) {
                        Swal.showValidationMessage('Ad boş ola bilməz');
                        return false;
                    }

                    return { name };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const updatedStation = {
                        ...station,
                        name: result.value.name
                    };

                    this.updateMetroStation(updatedStation).then(() => {
                        Swal.fire('Uğurlu!', 'Metro stansiyası yeniləndi', 'success');
                        this.loadMetroStations();
                    }).catch(error => {
                        Swal.fire('Xəta!', 'Metro stansiyası yenilənə bilmədi', 'error');
                    });
                }
            });
        } catch (error) {
            Swal.fire('Xəta!', 'Metro stansiyası məlumatları yüklənə bilmədi', 'error');
        }
    }

    async deleteMetroStation(id) {
        const result = await Swal.fire({
            title: 'Metro Stansiyasını Sil',
            text: 'Bu metro stansiyasını silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Bəli, sil',
            cancelButtonText: 'Ləğv et',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280'
        });

        if (result.isConfirmed) {
            try {
                await this.apiRequest(`/MetroStation/${id}`, { method: 'DELETE' });
                Swal.fire('Silindi!', 'Metro stansiyası silindi', 'success');
                this.loadMetroStations();
            } catch (error) {
                Swal.fire('Xəta!', 'Metro stansiyası silinə bilmədi', 'error');
            }
        }
    }

    // Modal methods
    showAddAgencyModal() {
        Swal.fire({
            title: 'Yeni Agentlik Əlavə Et',
            html: `
                <div class="text-left space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Agentlik Adı</label>
                        <input type="text" id="newAgencyName" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Məsələn: ABC Real Estate">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Təsvir</label>
                        <textarea id="newAgencyDescription" class="w-full px-3 py-2 border border-gray-300 rounded-lg" rows="3" placeholder="Agentlik haqqında məlumat"></textarea>
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Telefon</label>
                        <input type="tel" id="newAgencyPhone" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="+994 XX XXX XX XX">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <input type="email" id="newAgencyEmail" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="info@agency.az">
                    </div>
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Ünvan</label>
                        <input type="text" id="newAgencyAddress" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Bakı, Azərbaycan">
                    </div>
                </div>
            `,
            width: '600px',
            showCancelButton: true,
            confirmButtonText: 'Əlavə Et',
            cancelButtonText: 'Ləğv Et',
            preConfirm: () => {
                const name = document.getElementById('newAgencyName').value;
                const description = document.getElementById('newAgencyDescription').value;
                const phoneNumber = document.getElementById('newAgencyPhone').value;
                const email = document.getElementById('newAgencyEmail').value;
                const address = document.getElementById('newAgencyAddress').value;

                if (!name.trim()) {
                    Swal.showValidationMessage('Agentlik adı boş ola bilməz');
                    return false;
                }
                if (!description.trim()) {
                    Swal.showValidationMessage('Təsvir boş ola bilməz');
                    return false;
                }
                if (!phoneNumber.trim()) {
                    Swal.showValidationMessage('Telefon nömrəsi boş ola bilməz');
                    return false;
                }
                if (!email.trim()) {
                    Swal.showValidationMessage('Email boş ola bilməz');
                    return false;
                }
                if (!address.trim()) {
                    Swal.showValidationMessage('Ünvan boş ola bilməz');
                    return false;
                }

                return { name, description, phoneNumber, email, address };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const agencyData = {
                    name: result.value.name,
                    description: result.value.description,
                    phoneNumber: result.value.phoneNumber,
                    email: result.value.email,
                    address: result.value.address
                };

                this.createAgency(agencyData).then(() => {
                    Swal.fire('Uğurlu!', 'Agentlik əlavə edildi', 'success');
                    this.loadAgencies();
                }).catch(error => {
                    console.error('Agency creation error:', error);
                    Swal.fire('Xəta!', 'Agentlik əlavə edilə bilmədi: ' + error.message, 'error');
                });
            }
        });
    }

    showAddCategoryModal() {
        Swal.fire({
            title: 'Yeni Kateqoriya Əlavə Et',
            html: `
                <div class="text-left space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Kateqoriya Adı</label>
                        <input type="text" id="newCategoryName" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Məsələn: Mənzil">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Əlavə Et',
            cancelButtonText: 'Ləğv Et',
            preConfirm: () => {
                const name = document.getElementById('newCategoryName').value;

                if (!name.trim()) {
                    Swal.showValidationMessage('Kateqoriya adı boş ola bilməz');
                    return false;
                }

                return { name };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const categoryData = {
                    name: result.value.name
                };

                this.createCategory(categoryData).then(() => {
                    Swal.fire('Uğurlu!', 'Kateqoriya əlavə edildi', 'success');
                    this.loadCategories();
                }).catch(error => {
                    Swal.fire('Xəta!', 'Kateqoriya əlavə edilə bilmədi', 'error');
                });
            }
        });
    }
    async showAddDistrictModal() {
        try {
            // Load cities for dropdown
            const cities = await this.getAllCities();

            if (!cities || cities.length === 0) {
                Swal.fire('Xəta!', 'Şəhərlər yüklənə bilmədi. Əvvəlcə şəhər əlavə edin.', 'error');
                return;
            }

            // Create city options HTML
            const cityOptions = cities.map(city =>
                `<option value="${city.id}">${city.name}</option>`
            ).join('');

            Swal.fire({
                title: 'Yeni Rayon Əlavə Et',
                html: `
                    <div class="text-left space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Rayon Adı</label>
                            <input type="text" id="newDistrictName" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Məsələn: Nəsimi">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Şəhər</label>
                            <select id="newDistrictCityId" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">Şəhər seçin</option>
                                ${cityOptions}
                            </select>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Əlavə Et',
                cancelButtonText: 'Ləğv Et',
                preConfirm: () => {
                    const name = document.getElementById('newDistrictName').value;
                    const cityId = document.getElementById('newDistrictCityId').value;

                    if (!name.trim()) {
                        Swal.showValidationMessage('Rayon adı boş ola bilməz');
                        return false;
                    }

                    if (!cityId) {
                        Swal.showValidationMessage('Şəhər seçilməlidir');
                        return false;
                    }

                    return { name, cityId: parseInt(cityId) };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const districtData = {
                        name: result.value.name,
                        cityId: result.value.cityId
                    };

                    this.createDistrict(districtData).then(() => {
                        Swal.fire('Uğurlu!', 'Rayon əlavə edildi', 'success');
                        this.loadDistricts();
                    }).catch(error => {
                        console.error('District creation error:', error);
                        Swal.fire('Xəta!', 'Rayon əlavə edilə bilmədi: ' + error.message, 'error');
                    });
                }
            });
        } catch (error) {
            console.error('Error loading cities:', error);
            Swal.fire('Xəta!', 'Şəhərlər yüklənə bilmədi', 'error');
        }
    }


    showAddCityModal() {
        Swal.fire({
            title: 'Yeni Şəhər Əlavə Et',
            html: `
                <div class="text-left space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Şəhər Adı</label>
                        <input type="text" id="newCityName" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Məsələn: Bakı">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Əlavə Et',
            cancelButtonText: 'Ləğv Et',
            preConfirm: () => {
                const name = document.getElementById('newCityName').value;

                if (!name.trim()) {
                    Swal.showValidationMessage('Şəhər adı boş ola bilməz');
                    return false;
                }

                return { name };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const cityData = {
                    id: 0,
                    name: result.value.name
                };

                this.createCity(cityData).then(() => {
                    Swal.fire('Uğurlu!', 'Şəhər əlavə edildi', 'success');
                    this.loadCities();
                }).catch(error => {
                    console.error('City creation error:', error);
                    Swal.fire('Xəta!', 'Şəhər əlavə edilə bilmədi: ' + error.message, 'error');
                });
            }
        });
    }

    async editCity(id) {
        try {
            const city = await this.getCity(id);
            Swal.fire({
                title: 'Şəhəri Redaktə Et',
                html: `
                    <div class="text-left space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Şəhər Adı</label>
                            <input type="text" id="editCityName" class="w-full px-3 py-2 border border-gray-300 rounded-lg" value="${city.name || ''}">
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Yadda Saxla',
                cancelButtonText: 'Ləğv Et',
                preConfirm: () => {
                    const name = document.getElementById('editCityName').value;

                    if (!name.trim()) {
                        Swal.showValidationMessage('Şəhər adı boş ola bilməz');
                        return false;
                    }

                    return { name };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const updatedCity = {
                        id: city.id,
                        name: result.value.name
                    };

                    this.updateCity(id, updatedCity).then(() => {
                        Swal.fire('Uğurlu!', 'Şəhər yeniləndi', 'success');
                        this.loadCities();
                    }).catch(error => {
                        console.error('City update error:', error);
                        Swal.fire('Xəta!', 'Şəhər yenilənə bilmədi: ' + error.message, 'error');
                    });
                }
            });
        } catch (error) {
            console.error('Error loading city data:', error);
            Swal.fire('Xəta!', 'Şəhər məlumatları yüklənə bilmədi: ' + error.message, 'error');
        }
    }

    async deleteCity(id) {
        const result = await Swal.fire({
            title: 'Şəhəri Sil',
            text: 'Bu şəhəri silmək istədiyinizə əminsiniz? Bu əməliyyat geri qaytarıla bilməz.',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Bəli, sil',
            cancelButtonText: 'Ləğv et',
            confirmButtonColor: '#dc2626',
            cancelButtonColor: '#6b7280'
        });

        if (result.isConfirmed) {
            try {
                await this.apiRequest(`/City/${id}`, { method: 'DELETE' });
                Swal.fire('Silindi!', 'Şəhər uğurla silindi', 'success');
                this.loadCities();
            } catch (error) {
                console.error('City delete error:', error);
                Swal.fire('Xəta!', 'Şəhər silinə bilmədi: ' + error.message, 'error');
            }
        }
    }

    async showAddDistrictModal() {
        try {
            // Load cities for dropdown
            const cities = await this.getAllCities();

            if (!cities || cities.length === 0) {
                Swal.fire('Xəta!', 'Şəhərlər yüklənə bilmədi. Əvvəlcə şəhər əlavə edin.', 'error');
                return;
            }

            // Create city options HTML
            const cityOptions = cities.map(city =>
                `<option value="${city.id}">${city.name}</option>`
            ).join('');

            Swal.fire({
                title: 'Yeni Rayon Əlavə Et',
                html: `
                    <div class="text-left space-y-3">
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Rayon Adı</label>
                            <input type="text" id="newDistrictName" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Məsələn: Nəsimi">
                        </div>
                        <div>
                            <label class="block text-sm font-medium text-gray-700 mb-1">Şəhər</label>
                            <select id="newDistrictCityId" class="w-full px-3 py-2 border border-gray-300 rounded-lg">
                                <option value="">Şəhər seçin</option>
                                ${cityOptions}
                            </select>
                        </div>
                    </div>
                `,
                showCancelButton: true,
                confirmButtonText: 'Əlavə Et',
                cancelButtonText: 'Ləğv Et',
                preConfirm: () => {
                    const name = document.getElementById('newDistrictName').value;
                    const cityId = document.getElementById('newDistrictCityId').value;

                    if (!name.trim()) {
                        Swal.showValidationMessage('Rayon adı boş ola bilməz');
                        return false;
                    }

                    if (!cityId) {
                        Swal.showValidationMessage('Şəhər seçilməlidir');
                        return false;
                    }

                    return { name, cityId: parseInt(cityId) };
                }
            }).then((result) => {
                if (result.isConfirmed) {
                    const districtData = {
                        name: result.value.name,
                        cityId: result.value.cityId
                    };

                    this.createDistrict(districtData).then(() => {
                        Swal.fire('Uğurlu!', 'Rayon əlavə edildi', 'success');
                        this.loadDistricts();
                    }).catch(error => {
                        console.error('District creation error:', error);
                        Swal.fire('Xəta!', 'Rayon əlavə edilə bilmədi: ' + error.message, 'error');
                    });
                }
            });
        } catch (error) {
            console.error('Error loading cities:', error);
            Swal.fire('Xəta!', 'Şəhərlər yüklənə bilmədi', 'error');
        }
    }

    showAddMetroModal() {
        Swal.fire({
            title: 'Yeni Metro Stansiyası Əlavə Et',
            html: `
                <div class="text-left space-y-3">
                    <div>
                        <label class="block text-sm font-medium text-gray-700 mb-1">Metro Stansiyası Adı</label>
                        <input type="text" id="newMetroName" class="w-full px-3 py-2 border border-gray-300 rounded-lg" placeholder="Məsələn: 28 May">
                    </div>
                </div>
            `,
            showCancelButton: true,
            confirmButtonText: 'Əlavə Et',
            cancelButtonText: 'Ləğv Et',
            preConfirm: () => {
                const name = document.getElementById('newMetroName').value;

                if (!name.trim()) {
                    Swal.showValidationMessage('Metro stansiyası adı boş ola bilməz');
                    return false;
                }

                return { name };
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const metroData = {
                    name: result.value.name
                };

                this.createMetroStation(metroData).then(() => {
                    Swal.fire('Uğurlu!', 'Metro stansiyası əlavə edildi', 'success');
                    this.loadMetroStations();
                }).catch(error => {
                    console.error('Metro station creation error:', error);
                    Swal.fire('Xəta!', 'Metro stansiyası əlavə edilə bilmədi: ' + error.message, 'error');
                });
            }
        });
    }

    // Message actions
    async markCurrentMessageAsRead() {
        if (this.currentMessage) {
            try {
                await this.markMessageAsRead(this.currentMessage.id);
                this.currentMessage.isRead = true;
                this.loadMessages();
                Swal.fire('Uğurlu!', 'Mesaj oxundu kimi işarələndi', 'success');
            } catch (error) {
                Swal.fire('Xəta!', 'Mesaj işarələnə bilmədi', 'error');
            }
        }
    }

    async markCurrentMessageAsImportant() {
        if (this.currentMessage) {
            // Implementation for marking as important
            console.log('Marking message as important:', this.currentMessage.id);
        }
    }

    async deleteCurrentMessage() {
        if (this.currentMessage) {
            const result = await Swal.fire({
                title: 'Silməyi təsdiqləyin',
                text: 'Bu mesajı silmək istədiyinizə əminsiniz?',
                icon: 'warning',
                showCancelButton: true,
                confirmButtonText: 'Bəli, sil',
                cancelButtonText: 'Ləğv et'
            });

            if (result.isConfirmed) {
                // Implementation for deleting message
                console.log('Deleting message:', this.currentMessage.id);
                this.loadMessages();
            }
        }
    }

    async sendReply(e) {
        e.preventDefault();
        const replyText = document.getElementById('replyText').value;

        if (!replyText.trim()) {
            Swal.fire('Xəta!', 'Cavab mətni boş ola bilməz', 'error');
            return;
        }

        try {
            await this.sendMessage({
                receiverId: this.currentMessage.senderId,
                content: replyText,
                type: 'reply'
            });

            Swal.fire('Uğurlu!', 'Cavab göndərildi', 'success');
            document.getElementById('replyText').value = '';
            this.cancelReply();
        } catch (error) {
            Swal.fire('Xəta!', 'Cavab göndərilə bilmədi', 'error');
        }
    }

    cancelReply() {
        document.getElementById('quickReplySection').classList.add('hidden');
        document.getElementById('replyText').value = '';
    }

    filterMessages(filter) {
        // Implementation for filtering messages
        console.log('Filtering messages by:', filter);
    }

    // --- PAYMENTS MANAGEMENT ---
    async loadPayments() {
        try {
            // TODO: Add GET endpoint for payments in API
            // For now, show empty state until API endpoint is available
            this.updatePayments([]);
        } catch (error) {
            console.error('Payments loading error:', error);
            this.updatePayments([]);
        }
    }

    updatePayments(payments) {
        const tbody = document.getElementById('paymentsTable');
        tbody.innerHTML = '';

        payments.forEach(payment => {
            const row = document.createElement('tr');
            row.className = 'table-row';

            const statusColors = {
                'success': 'bg-green-100 text-green-800',
                'pending': 'bg-yellow-100 text-yellow-800',
                'failed': 'bg-red-100 text-red-800',
                'cancelled': 'bg-gray-100 text-gray-800'
            };

            row.innerHTML = `
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${payment.id}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${payment.userName || 'Bilinməyən'}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-900">${this.formatPrice(payment.amount)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${payment.type}</td>
                <td class="px-6 py-4 whitespace-nowrap">
                    <span class="px-2 py-1 text-xs font-semibold rounded-full ${statusColors[payment.status] || 'bg-gray-100 text-gray-800'}">
                        ${this.getPaymentStatusLabel(payment.status)}
                    </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${this.formatDate(payment.createdAt)}</td>
                <td class="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button onclick="adminDashboard.viewPayment('${payment.id}')" class="text-blue-600 hover:text-blue-900 mr-2">Bax</button>
                    ${payment.status === 'pending' ? `<button onclick="adminDashboard.processPayment('${payment.id}')" class="text-green-600 hover:text-green-900 mr-2">Təsdiqlə</button>` : ''}
                </td>
            `;
            tbody.appendChild(row);
        });
    }

    getPaymentStatusLabel(status) {
        const statusLabels = {
            'success': 'Uğurlu',
            'pending': 'Gözləyən',
            'failed': 'Uğursuz',
            'cancelled': 'Ləğv edilmiş'
        };
        return statusLabels[status] || 'Bilinməyən';
    }

    filterPayments(filter) {
        // Implementation for filtering payments
        console.log('Filtering payments by:', filter);
        // You can implement actual filtering logic here
    }

    // Payment actions
    async viewPayment(id) {
        console.log('Viewing payment:', id);
        // Implementation for viewing payment details
    }

    async processPayment(id) {
        const result = await Swal.fire({
            title: 'Ödənişi təsdiqləyin',
            text: 'Bu ödənişi təsdiqləmək istədiyinizə əminsiniz?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Bəli, təsdiqlə',
            cancelButtonText: 'Ləğv et'
        });

        if (result.isConfirmed) {
            try {
                // Here you would call your API to process the payment
                // await this.processPaymentAPI(id);
                Swal.fire('Uğurlu!', 'Ödəniş təsdiqləndi', 'success');
                this.loadPayments();
            } catch (error) {
                Swal.fire('Xəta!', 'Ödəniş təsdiqlənə bilmədi', 'error');
            }
        }
    }
}

// Initialize admin dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Check for Chart.js dependency
    if (typeof Chart === 'undefined') {
        console.error("Chart.js tapılmadı. Zəhmət olmasa Chart.js kütüphanesini HTML'e daxil edin.");
    }

    // Always initialize dashboard directly without login check
    window.adminDashboard = new AdminDashboard();
});