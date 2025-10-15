// API Configuration
const API_BASE_URL = 'https://localhost:7027/api';
const LOGOUT_API = `${API_BASE_URL}/Authorization/LogOut`;

// Global variables
let userListings = [];
let userId = null;

// =================================================================
// AUTHENTICATION FUNCTIONS
// =================================================================

function parseJwt(token) {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        return JSON.parse(jsonPayload);
    } catch (e) {
        console.error('JWT parse error:', e);
        return null;
    }
}

function getUserIdFromToken() {
    const token = localStorage.getItem('jwt');
    if (!token) return null;

    const payload = parseJwt(token);
    if (!payload) return null;

    // Different backends might use different claim names
    return payload.nameid || payload.nameId || payload.sub || payload.NameIdentifier || payload.nameidentifier || null;
}

const handleLogout = async () => {
    try {
        const token = localStorage.getItem('jwt');

        await fetch(LOGOUT_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });

        localStorage.removeItem('jwt');
        updateAuthUI();
        window.location.href = './index.html';

    } catch (error) {
        localStorage.removeItem('jwt');
        updateAuthUI();
        console.error('Çıxış zamanı xəta:', error);
        window.location.href = './index.html';
    }
};

const updateAuthUI = () => {
    const newListingLink = document.getElementById('newListing');
    const loginLink = document.getElementById('loginLink');
    const messagesLink = document.getElementById('messagesLink');
    const token = localStorage.getItem('jwt');

    if (!loginLink) return;

    if (token) {
        // User is logged in
        loginLink.outerHTML = `
            <button id="logoutBtn" class="border px-4 py-2 rounded-lg hover:bg-red-50 text-red-600 border-red-600 transition">
                Çıxış
            </button>
        `;
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', handleLogout);
        }

        if (newListingLink) {
            newListingLink.classList.remove('opacity-50', 'pointer-events-none');
            newListingLink.href = './Create.html';
        }
        if (messagesLink) {
            messagesLink.classList.remove('opacity-50', 'pointer-events-none');
            messagesLink.href = './Chat.html';
        }

    } else {
        // User is NOT logged in
        if (newListingLink) {
            newListingLink.classList.add('opacity-50', 'pointer-events-none');
            newListingLink.href = './Login.html';
        }
        if (messagesLink) {
            messagesLink.classList.add('opacity-50', 'pointer-events-none');
            messagesLink.href = './Login.html';
        }
    }
};

// =================================================================
// FETCH USER LISTINGS
// =================================================================

async function fetchUserListings() {
    const token = localStorage.getItem('jwt');
    if (!token || !userId) {
        Swal.fire({
            icon: 'warning',
            title: 'Giriş tələb olunur',
            text: 'Sistəmə daxil olmalısınız',
            confirmButtonText: 'Giriş et',
            confirmButtonColor: '#3b82f6'
        }).then(() => {
            window.location.href = './Login.html';
        });
        return;
    }

    try {
        const response = await fetch(`${API_BASE_URL}/Listing/GetListingByUserId?userId=${userId}`, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('jwt');
            window.location.href = './Login.html';
            return;
        }

        if (!response.ok) {
            throw new Error('Elanları yükləmək mümkün olmadı');
        }

        userListings = await response.json();
        displayStatistics();
        displayListings();

    } catch (error) {
        console.error('Error fetching listings:', error);
        showError('Elanları yükləyərkən xəta baş verdi');
    }
}

// =================================================================
// DISPLAY FUNCTIONS
// =================================================================

function displayStatistics() {
    const statsContainer = document.getElementById('statsContainer');

    const totalListings = userListings.length;
    const premiumListings = userListings.filter(l => l.isPremium).length;
    const totalViews = userListings.reduce((sum, l) => sum + (l.viewCount || 0), 0);

    statsContainer.innerHTML = `
        <!-- Total Listings -->
        <div class="stat-card">
            <div class="flex items-center justify-between mb-3">
                <div class="bg-blue-100 p-3 rounded-lg">
                    <i class="fas fa-home text-blue-600 text-2xl"></i>
                </div>
            </div>
            <h3 class="text-3xl font-bold text-gray-900">${totalListings}</h3>
            <p class="text-gray-600 text-sm mt-1">Ümumi elan</p>
        </div>

        <!-- Premium Listings -->
        <div class="stat-card">
            <div class="flex items-center justify-between mb-3">
                <div class="bg-purple-100 p-3 rounded-lg">
                    <i class="fas fa-star text-purple-600 text-2xl"></i>
                </div>
            </div>
            <h3 class="text-3xl font-bold text-gray-900">${premiumListings}</h3>
            <p class="text-gray-600 text-sm mt-1">Premium elan</p>
        </div>

        <!-- Total Views -->
        <div class="stat-card">
            <div class="flex items-center justify-between mb-3">
                <div class="bg-yellow-100 p-3 rounded-lg">
                    <i class="fas fa-eye text-yellow-600 text-2xl"></i>
                </div>
            </div>
            <h3 class="text-3xl font-bold text-gray-900">${totalViews}</h3>
            <p class="text-gray-600 text-sm mt-1">Baxış sayı</p>
        </div>
    `;
}

function displayListings() {
    const container = document.getElementById('listingsContainer');

    if (!userListings || userListings.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <i class="fas fa-home"></i>
                <h3 class="text-2xl font-bold text-gray-700 mb-2">Hələ elanınız yoxdur</h3>
                <p class="text-gray-500 mb-6">İlk elanınızı yaradaraq başlayın</p>
                <a href="./Create.html" class="inline-block bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-semibold transition">
                    <i class="fas fa-plus mr-2"></i>Yeni elan yarat
                </a>
            </div>
        `;
        return;
    }

    const grid = document.createElement('div');
    grid.className = 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6';

    userListings.forEach(listing => {
        const card = createListingCard(listing);
        grid.appendChild(card);
    });

    container.innerHTML = '';
    container.appendChild(grid);
}

function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'listing-card bg-white rounded-xl overflow-hidden shadow-md';

    // Get cover image or first image
    const coverImage = listing.images?.find(img => img.isCover) || listing.images?.[0];
    let imageUrl = 'https://via.placeholder.com/400x300?text=Şəkil+yoxdur';

    if (coverImage?.imageUrl) {
        if (coverImage.imageUrl.startsWith('/')) {
            imageUrl = `${API_BASE_URL.replace('/api', '')}${coverImage.imageUrl}`;
        } else {
            imageUrl = coverImage.imageUrl;
        }
    }

    // Format price
    const formattedPrice = listing.price
        ? `${listing.price.toLocaleString('az-AZ')} ₼`
        : 'Qiymət yoxdur';

    // Get advert type text
    const advertTypes = {
        1: 'Alış',
        2: 'Kirayə',
        3: 'Günlük Kirayə'
    };
    const advertTypeText = advertTypes[listing.advertType] || 'Naməlum';

    // Get category name
    const categoryName = listing.category?.name || 'Kateqoriya yoxdur';

    card.innerHTML = `
        <div class="relative">
            <img src="${imageUrl}" alt="${escapeHtml(listing.title)}" 
                 class="w-full h-48 object-cover">
            
            <!-- Badges -->
            <div class="absolute top-3 left-3 flex flex-col gap-2">
                <span class="badge bg-blue-600 text-white">${advertTypeText}</span>
                ${listing.isPremium ? '<span class="badge badge-premium"><i class="fas fa-star mr-1"></i>Premium</span>' : ''}
            </div>
        </div>

        <div class="p-4">
            <!-- Category -->
            <div class="flex items-center text-sm text-gray-600 mb-2">
                <i class="fas fa-tag mr-2 text-blue-600"></i>
                <span class="font-semibold">${escapeHtml(categoryName)}</span>
            </div>

            <!-- Title -->
            <h3 class="text-lg font-bold text-gray-900 mb-3 line-clamp-2 min-h-[56px]">
                ${escapeHtml(listing.title)}
            </h3>

            <!-- Details -->
            <div class="grid grid-cols-3 gap-2 mb-4 text-sm text-gray-600">
                ${listing.rooms ? `
                    <div class="flex items-center">
                        <i class="fas fa-bed mr-1 text-gray-400"></i>
                        <span>${listing.rooms}</span>
                    </div>
                ` : ''}
                
                ${listing.area ? `
                    <div class="flex items-center">
                        <i class="fas fa-ruler-combined mr-1 text-gray-400"></i>
                        <span>${listing.area} m²</span>
                    </div>
                ` : ''}
                
                ${listing.floor ? `
                    <div class="flex items-center">
                        <i class="fas fa-layer-group mr-1 text-gray-400"></i>
                        <span>${listing.floor}/${listing.totalFloors || '?'}</span>
                    </div>
                ` : ''}
            </div>

            <!-- Location -->
            ${listing.location?.address ? `
                <div class="flex items-center text-sm text-gray-600 mb-4">
                    <i class="fas fa-map-marker-alt mr-2 text-red-500"></i>
                    <span class="line-clamp-1">${escapeHtml(listing.location.address)}</span>
                </div>
            ` : ''}

            <!-- Price -->
            <div class="text-2xl font-bold text-green-600 mb-4">
                ${formattedPrice}
            </div>

            <!-- Views and Date -->
            <div class="flex items-center justify-between text-xs text-gray-500 mb-4 pb-4 border-b">
                <div class="flex items-center">
                    <i class="fas fa-eye mr-1"></i>
                    <span>${listing.viewCount || 0} baxış</span>
                </div>
                <div class="flex items-center">
                    <i class="fas fa-calendar mr-1"></i>
                    <span>${formatDate(listing.createdAt)}</span>
                </div>
            </div>

            <!-- Action Buttons -->
            <div class="grid grid-cols-3 gap-2">
                <button onclick="viewListing(${listing.id})" 
                        class="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1">
                    <i class="fas fa-eye"></i>
                    <span>Bax</span>
                </button>
                
                <button onclick="editListing(${listing.id})" 
                        class="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1">
                    <i class="fas fa-edit"></i>
                    <span>Düzəliş</span>
                </button>
                
                <button onclick="deleteListing(${listing.id})" 
                        class="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm font-semibold transition flex items-center justify-center gap-1">
                    <i class="fas fa-trash"></i>
                    <span>Sil</span>
                </button>
            </div>
        </div>
    `;

    return card;
}

// =================================================================
// HELPER FUNCTIONS
// =================================================================

function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('az-AZ', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

function showError(message) {
    const container = document.getElementById('listingsContainer');
    container.innerHTML = `
        <div class="empty-state">
            <i class="fas fa-exclamation-triangle" style="color: #ef4444;"></i>
            <h3 class="text-2xl font-bold text-red-600 mb-2">Xəta</h3>
            <p class="text-gray-600">${message}</p>
        </div>
    `;
}

function viewListing(listingId) {
    window.location.href = `property.html?id=${listingId}`;
}

function editListing(listingId) {
    window.location.href = `Edit.html?id=${listingId}`;
}

// =================================================================
// DELETE LISTING
// =================================================================

async function deleteListing(listingId) {
    const result = await Swal.fire({
        title: 'Elanı silmək istədiyinizdən əminsiniz?',
        text: "Bu əməliyyatı geri qaytarmaq mümkün olmayacaq!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Bəli, sil!',
        cancelButtonText: 'Ləğv et'
    });

    if (!result.isConfirmed) {
        return;
    }

    const token = localStorage.getItem('jwt');
    if (!token) {
        Swal.fire({
            icon: 'warning',
            title: 'Giriş tələb olunur',
            text: 'Sistəmə daxil olmalısınız',
            confirmButtonColor: '#3b82f6'
        });
        return;
    }

    // Show loading
    Swal.fire({
        title: 'Silinir...',
        text: 'Zəhmət olmasa gözləyin',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    try {
        const response = await fetch(`${API_BASE_URL}/Listing/DeleteListing/${listingId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.status === 401) {
            localStorage.removeItem('jwt');
            Swal.fire({
                icon: 'error',
                title: 'Sessiya bitdi',
                text: 'Yenidən giriş etməlisiniz',
                confirmButtonColor: '#3b82f6'
            }).then(() => {
                window.location.href = './Login.html';
            });
            return;
        }

        if (!response.ok) {
            throw new Error('Elanı silmək mümkün olmadı');
        }

        // Remove from local array
        userListings = userListings.filter(l => l.id !== listingId);

        // Refresh display
        displayStatistics();
        displayListings();

        // Show success message
        Swal.fire({
            icon: 'success',
            title: 'Uğurla silindi!',
            text: 'Elan uğurla silindi',
            confirmButtonColor: '#10b981',
            timer: 2000,
            showConfirmButton: false
        });

    } catch (error) {
        console.error('Error deleting listing:', error);
        Swal.fire({
            icon: 'error',
            title: 'Xəta!',
            text: 'Elanı silərkən xəta baş verdi',
            confirmButtonColor: '#ef4444'
        });
    }
}

// =================================================================
// SUCCESS MESSAGE (using SweetAlert2)
// =================================================================

function showSuccessMessage(message) {
    Swal.fire({
        icon: 'success',
        title: 'Uğurlu!',
        text: message,
        confirmButtonColor: '#10b981',
        timer: 2000,
        showConfirmButton: false
    });
}

// =================================================================
// HAMBURGER MENU
// =================================================================

document.getElementById('hamburger')?.addEventListener('click', function () {
    const mobileMenu = document.getElementById('mobileMenu');
    mobileMenu.classList.toggle('hidden');
});

// =================================================================
// INITIALIZATION
// =================================================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check authentication
    const token = localStorage.getItem('jwt');
    if (!token) {
        window.location.href = './Login.html';
        return;
    }

    // Get user ID from token
    userId = getUserIdFromToken();
    if (!userId) {
        Swal.fire({
            icon: 'error',
            title: 'Xəta!',
            text: 'İstifadəçi məlumatı tapılmadı',
            confirmButtonColor: '#ef4444'
        }).then(() => {
            window.location.href = './Login.html';
        });
        return;
    }

    // Update auth UI
    updateAuthUI();

    // Fetch user listings
    await fetchUserListings();
});

