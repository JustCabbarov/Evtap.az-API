const API_BASE_URL = 'https://localhost:7027/api';
const LOGOUT_API = `${API_BASE_URL}/Authorization/LogOut`;
let propertyData = null;

// ===============================================
// URL və Fetch funksiyaları
// ===============================================
function getPropertyIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function fetchPropertyData(propertyId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Listing/GetListingDetailById/${propertyId}`);
        if (!response.ok) throw new Error(`HTTP xətası! Status: ${response.status}`);
        const property = await response.json();
        if (!property) throw new Error('Serverdən boş cavab alındı.');
        return property;
    } catch (error) {
        console.error('Məlumat çəkilərkən xəta:', error);
        throw error;
    }
}

// ===============================================
// Köməkçi Funksiyalar
// ===============================================
function formatPrice(price) {
    if (price == null) return '-';
    return new Intl.NumberFormat('az-AZ').format(price) + ' AZN';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('az-AZ');
}

function getAdvertTypeText(type) {
    const types = { 1: 'Alış', 2: 'Kirayə', 3: 'Günlük Kirayə' };
    return types[type] || 'Naməlum';
}

function getRenovationText(type) {
    const renovations = { 1: 'Yeni', 2: 'Orta', 3: 'Köhnə' };
    return renovations[type] || 'Naməlum';
}

function getCreatorTypeText(type) {
    const creators = { 0: 'Şəxsi', 1: 'Agentlik' };
    return creators[type] || 'Naməlum';
}

function showLoading() {
    ['propertyTitle', 'propertyPrice', 'propertyDescription'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = 'Məlumatlar yüklənir...';
    });
}

function showError(message) {
    const titleEl = document.getElementById('propertyTitle');
    const priceEl = document.getElementById('propertyPrice');
    const descEl = document.getElementById('propertyDescription');

    if (titleEl) titleEl.textContent = 'Məlumat Yüklənmə Xətası';
    if (priceEl) priceEl.textContent = '---';
    if (descEl) descEl.textContent = message || 'Əmlak məlumatları yüklənə bilmədi.';
}

// ===============================================
// Xəritə (Leaflet)
// ===============================================
function initMiniMap(lat, lng) {
    if (typeof L === 'undefined') {
        console.warn('Leaflet kitabxanası yüklənməyib.');
        return;
    }

    const mapEl = document.getElementById('miniMap');
    if (!mapEl) return;

    const map = L.map(mapEl, { zoomControl: false }).setView([lat, lng], 15);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    L.marker([lat, lng])
        .addTo(map)
        .bindPopup(propertyData?.title || 'Mülkün Yeri')
        .openPopup();

    setTimeout(() => map.invalidateSize(), 300);
}

// ===============================================
// Şəkillərin yüklənməsi
// ===============================================
function loadPropertyImages() {
    const container = document.querySelector('.image-placeholder');
    if (!container) return;

    // 1. API-dən gələn şəkil varsa, onu göstər
    const img = propertyData?.images?.find(i => i.isCover) || propertyData?.images?.[0];

    let imageUrl = null;

    if (img?.imageUrl) {
        // Əgər imageUrl nisbi yoldursa (məs: /uploads/img.jpg), onu tam URL-ə çevir
        if (img.imageUrl.startsWith('/')) {
            imageUrl = `${API_BASE_URL.replace('/api', '')}${img.imageUrl}`;
        } else {
            imageUrl = img.imageUrl;
        }
    }

    // 2. Əgər şəkil yoxdursa, placeholder qoy
    container.innerHTML = `
        <img src="${imageUrl || 'https://via.placeholder.com/600x400?text=Şəkil+yoxdur'}"
             alt="${propertyData.title || 'Mülk şəkli'}"
             style="width:100%; max-height:300px; object-fit:cover; border-radius:8px;">
    `;
}

// ===============================================
// Metro məlumatları
// ===============================================
function loadMetroStations() {
    const metroContainer = document.getElementById('metroStations');
    if (!metroContainer) return;

    const metros = propertyData?.listingMetros || [];
    if (metros.length === 0) {
        metroContainer.innerHTML =
            '<p style="color:#999; text-align:center;">Metro məlumatı yoxdur</p>';
        return;
    }

    metroContainer.innerHTML = '';
    metros.forEach(metro => {
        const metroName = metro.metroStation?.name || 'Naməlum Stansiya';
        const el = document.createElement('div');
        el.className =
            'metro-station px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium';
        el.innerHTML = `<i class="fas fa-subway mr-2"></i> ${metroName}`;
        metroContainer.appendChild(el);
    });
}

// ===============================================
// UI məlumatları yüklə
// ===============================================
function populatePropertyData() {
    if (!propertyData) {
        showError('Məlumat tapılmadı və ya yüklənmədi.');
        return;
    }

    const titleEl = document.getElementById('propertyTitle');
    const priceEl = document.getElementById('propertyPrice');
    const descEl = document.getElementById('propertyDescription');

    if (titleEl) titleEl.textContent = propertyData.title || 'Başlıq yoxdur';
    if (priceEl) priceEl.textContent = formatPrice(propertyData.price);
    if (descEl) descEl.textContent = propertyData.description || 'Açıqlama yoxdur';

    const advertTypeEl = document.getElementById('advertType');
    if (advertTypeEl) advertTypeEl.textContent = getAdvertTypeText(propertyData.advertType);

    const premiumBadge = document.getElementById('premiumBadge');
    const premiumExpire = document.getElementById('premiumExpireDate');
    if (premiumBadge && premiumExpire) {
        if (propertyData.isPremium) {
            premiumBadge.style.display = 'inline-block';
            premiumExpire.textContent = propertyData.premiumExpireDate
                ? `(Son: ${formatDate(propertyData.premiumExpireDate)})`
                : '';
        } else {
            premiumBadge.style.display = 'none';
        }
    }

    // Ətraflı sahələr
    const roomsEl = document.getElementById('rooms');
    const floorEl = document.getElementById('floor');
    const totalFloorsEl = document.getElementById('totalFloors');
    const areaEl = document.getElementById('area');
    const renovationEl = document.getElementById('renovation');
    const creatorTypeEl = document.getElementById('creatorType');
    const categoryEl = document.getElementById('category');
    const locationEl = document.getElementById('location');
    const createdAtEl = document.getElementById('createdAt');

    if (roomsEl) roomsEl.textContent = propertyData.rooms ?? '-';
    if (floorEl) floorEl.textContent = propertyData.floor ?? '-';
    if (totalFloorsEl) totalFloorsEl.textContent = propertyData.totalFloors ?? '-';
    if (areaEl) areaEl.textContent = propertyData.area ?? '-';
    if (renovationEl) renovationEl.textContent = getRenovationText(propertyData.renovation);
    if (creatorTypeEl) creatorTypeEl.textContent = getCreatorTypeText(propertyData.creatorType);
    if (categoryEl) categoryEl.textContent = propertyData.category?.name ?? '-';
    if (locationEl) locationEl.textContent = propertyData.location?.address ?? '-';
    if (createdAtEl) createdAtEl.textContent = formatDate(propertyData.createdAt);

    const lat = propertyData.location?.latitude;
    const lng = propertyData.location?.longitude;
    if (lat && lng) initMiniMap(lat, lng);

    loadPropertyImages();
    loadMetroStations();
}

// ===============================================
// VIP / Premium düyməsi
// ===============================================
function setupVipButton() {
    const vipBtn = document.getElementById('premiumBtn');
    if (!vipBtn) return;

    if (propertyData.isPremium) {
        vipBtn.style.display = 'none';
        return;
    }

    vipBtn.addEventListener('click', () => {
        if (!propertyData?.id) {
            alert('Elan məlumatları tapılmadı.');
            return;
        }
        window.location.href = `Payment.html?listingId=${propertyData.id}`;
    });
}

// ===============================================
// AUTHENTICATION
// ===============================================
const getAuthToken = () =>
    localStorage.getItem('jwt') || localStorage.getItem('authToken') || localStorage.getItem('token');

function getUserIdFromToken() {
    const token = getAuthToken();
    if (!token) return null;
    try {
        const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
        return JSON.parse(atob(base64)).nameid;
    } catch (e) {
        console.error('JWT tokenini oxumaq mümkün olmadı:', e);
        return null;
    }
}

async function handleLogout() {
    try {
        const token = localStorage.getItem('jwt');
        await fetch(LOGOUT_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });
    } catch (error) {
        console.error('Çıxış zamanı xəta:', error);
    } finally {
        localStorage.removeItem('jwt');
        updateAuthUI();
        window.location.href = '/';
    }
}

function updateAuthUI() {
    const newListingLink = document.getElementById('newListing');
    const loginLink = document.getElementById('loginLink');
    const userDropdown = document.getElementById('userDropdown');
    const token = localStorage.getItem('jwt');

    if (token) {
        // User is logged in
        // Hide login button
        if (loginLink) {
            loginLink.classList.add('hidden');
        }

        // Show user dropdown
        if (userDropdown) {
            userDropdown.classList.remove('hidden');
        }

        // Enable "Yeni elan" button
        if (newListingLink) {
            newListingLink.href = './Create.html';
            newListingLink.classList.remove('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
            newListingLink.classList.add('cursor-pointer');
            newListingLink.onclick = null; // Remove any previous click handler
        }
    } else {
        // User is NOT logged in
        // Show login button
        if (loginLink) {
            loginLink.classList.remove('hidden');
        }

        // Hide user dropdown
        if (userDropdown) {
            userDropdown.classList.add('hidden');
        }

        // Make "Yeni elan" button inactive
        if (newListingLink) {
            newListingLink.href = '#';
            newListingLink.classList.add('opacity-50', 'cursor-not-allowed', 'pointer-events-none');
            newListingLink.classList.remove('cursor-pointer');

            // Add click handler to redirect to login
            newListingLink.onclick = (e) => {
                e.preventDefault();
                window.location.href = './Login.html';
            };
        }
    }
}

// Initialize dropdown toggle functionality
function initializeDropdown() {
    const userDropdownBtn = document.getElementById('userDropdownBtn');
    const userDropdownMenu = document.getElementById('userDropdownMenu');
    const exitBtn = document.getElementById('exitBtn');

    // Toggle dropdown on button click
    if (userDropdownBtn && userDropdownMenu) {
        userDropdownBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            userDropdownMenu.classList.toggle('hidden');
        });

        // Close dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (!userDropdownBtn.contains(e.target) && !userDropdownMenu.contains(e.target)) {
                userDropdownMenu.classList.add('hidden');
            }
        });
    }

    // Handle exit button
    if (exitBtn) {
        exitBtn.addEventListener('click', handleLogout);
    }
}

function handleMessageClick() {
    if (!propertyData || !propertyData.id) {
        alert('Elan məlumatı tapılmadı.');
        return;
    }

    // Elan sahibinin ID-sini və listingId-ni ötürmək
    const receiverId = propertyData.createdById || propertyData.userId; // Backenddən hansı property ilə gəlirsə
    const listingId = propertyData.id;

    if (!receiverId) {
        alert('Elan sahibinin məlumatı tapılmadı.');
        return;
    }

    // Chat səhifəsinə yönləndir
    const url = `./Chat.html?receiverId=${receiverId}&listingId=${listingId}`;
    window.location.href = url;
}

// ===============================================
// INITIALIZATION
// ===============================================
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize authentication UI and dropdown
    updateAuthUI();
    initializeDropdown();

    // Get property ID from URL
    const propertyId = getPropertyIdFromUrl();
    if (!propertyId) {
        showError('Əmlak ID-si URL-də tapılmadı.');
        return;
    }

    // Load property data
    try {
        showLoading();
        propertyData = await fetchPropertyData(propertyId);
        populatePropertyData();
        setupVipButton();
    } catch (err) {
        showError('Məlumat yüklənə bilmədi: ' + err.message);
    }
});
