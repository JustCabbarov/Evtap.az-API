// =================================================================
// API CONFIGURATION
// =================================================================
const API_BASE_URL = 'https://localhost:7027/api';
const LOGOUT_API = 'https://localhost:7027/api/Authorization/LogOut';

// =================================================================
// INITIALIZATION
// =================================================================
document.addEventListener('DOMContentLoaded', async () => {
    await loadAgencies();
    updateAuthUI();
    initializeDropdown();
});

async function loadAgencies() {
    const agencyGrid = document.getElementById('AgencyGrid');

    agencyGrid.innerHTML = '<div class="col-span-full text-center py-8"><div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div><p class="mt-4 text-gray-600">Agentliklər yüklənir...</p></div>';

    try {
        const response = await fetch(`${API_BASE_URL}/Agency/GetAll`);

        if (!response.ok) {
            throw new Error('Agentliklər yüklənə bilmədi');
        }

        const agencies = await response.json();

        if (!agencies || agencies.length === 0) {
            agencyGrid.innerHTML = '<div class="col-span-full text-center py-12"><p class="text-gray-500 text-lg">Heç bir agentlik tapılmadı</p></div>';
            return;
        }

        agencyGrid.innerHTML = '';

        agencies.forEach(agency => {
            const agencyCard = createAgencyCard(agency);
            agencyGrid.appendChild(agencyCard);
        });

    } catch (error) {
        console.error('Error loading agencies:', error);
        agencyGrid.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-exclamation-triangle text-red-500 text-4xl mb-4"></i>
                <p class="text-red-600 text-lg">Agentliklər yüklənərkən xəta baş verdi</p>
                <button onclick="loadAgencies()" class="mt-4 bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition">
                    Yenidən cəhd et
                </button>
            </div>
        `;
    }
}

function createAgencyCard(agency) {
    const card = document.createElement('div');
    card.className = 'agency-card bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-blue-400 cursor-pointer transform hover:-translate-y-2 hover:scale-105';

    const listingsCount = agency.listings ? agency.listings.length : 0;

    card.innerHTML = `
        <div class="agency-card-header bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-4 relative overflow-hidden">
            <div class="absolute top-0 right-0 w-32 h-32 bg-white opacity-10 rounded-full -mr-16 -mt-16"></div>
            <div class="absolute bottom-0 left-0 w-24 h-24 bg-white opacity-10 rounded-full -ml-12 -mb-12"></div>
            
            <div class="relative z-10 flex items-center justify-between mb-2">
                <div class="bg-white bg-opacity-20 backdrop-blur-sm rounded-full p-3 shadow-lg">
                    <i class="fas fa-building text-white text-2xl"></i>
                </div>
                <div class="agency-badge bg-gradient-to-r from-green-400 to-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md flex items-center gap-1.5">
                    <i class="fas fa-home text-xs"></i>
                    <span>${listingsCount}</span>
                </div>
            </div>
            
            <h3 class="text-xl font-bold text-white mb-0.5 line-clamp-1 relative z-10">${escapeHtml(agency.name)}</h3>
            <p class="text-blue-100 text-xs relative z-10">Əmlak Agentliyi</p>
        </div>
        
        <div class="p-4">
            <p class="text-gray-600 text-sm mb-3 line-clamp-2 min-h-[40px] leading-relaxed">
                ${agency.description ? escapeHtml(agency.description) : 'Təsvir yoxdur'}
            </p>
            
            <div class="space-y-2 mb-3">
                ${agency.phoneNumber ? `
                    <div class="flex items-center text-gray-700 text-sm hover:text-blue-600 transition group">
                        <div class="bg-blue-100 group-hover:bg-blue-200 rounded-lg p-1.5 transition">
                            <i class="fas fa-phone text-blue-600 w-3.5 text-center text-xs"></i>
                        </div>
                        <span class="ml-2 font-medium text-xs">${escapeHtml(agency.phoneNumber)}</span>
                    </div>
                ` : ''}
                
                ${agency.email ? `
                    <div class="flex items-center text-gray-700 text-sm hover:text-blue-600 transition group">
                        <div class="bg-blue-100 group-hover:bg-blue-200 rounded-lg p-1.5 transition">
                            <i class="fas fa-envelope text-blue-600 w-3.5 text-center text-xs"></i>
                        </div>
                        <span class="ml-2 truncate font-medium text-xs">${escapeHtml(agency.email)}</span>
                    </div>
                ` : ''}
                
                ${agency.address ? `
                    <div class="flex items-center text-gray-700 text-sm hover:text-blue-600 transition group">
                        <div class="bg-blue-100 group-hover:bg-blue-200 rounded-lg p-1.5 transition">
                            <i class="fas fa-map-marker-alt text-blue-600 w-3.5 text-center text-xs"></i>
                        </div>
                        <span class="ml-2 line-clamp-1 font-medium text-xs">${escapeHtml(agency.address)}</span>
                    </div>
                ` : ''}
            </div>
            
            <button class="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-2 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 shadow-md hover:shadow-lg transform hover:scale-105 text-sm">
                <i class="fas fa-arrow-right"></i>
                <span>Elanları gör</span>
            </button>
        </div>
    `;

    card.addEventListener('click', () => showAgencyListings(agency));

    return card;
}

async function showAgencyListings(agency) {
    const modal = document.createElement('div');
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4';
    modal.innerHTML = `
        <div class="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden shadow-2xl">
            <div class="bg-gradient-to-r from-blue-600 to-blue-700 p-6 text-white">
                <div class="flex items-start justify-between">
                    <div>
                        <h2 class="text-2xl font-bold mb-2">${escapeHtml(agency.name)}</h2>
                        <p class="text-blue-100 text-sm">${agency.listings ? agency.listings.length : 0} elan mövcuddur</p>
                    </div>
                    <button onclick="this.closest('.fixed').remove()" class="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition">
                        <i class="fas fa-times text-xl"></i>
                    </button>
                </div>
            </div>
            
            <div class="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div id="agencyListingsContainer" class="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div class="col-span-full text-center py-8">
                        <div class="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
                        <p class="mt-4 text-gray-600">Elanlar yüklənir...</p>
                    </div>
                </div>
            </div>
        </div>
    `;

    document.body.appendChild(modal);

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.remove();
        }
    });

    await loadAgencyListings(agency);
}

async function loadAgencyListings(agency) {
    const container = document.getElementById('agencyListingsContainer');

    if (!agency.listings || agency.listings.length === 0) {
        container.innerHTML = `
            <div class="col-span-full text-center py-12">
                <i class="fas fa-home text-gray-300 text-5xl mb-4"></i>
                <p class="text-gray-500 text-lg">Bu agentlikdə elan yoxdur</p>
            </div>
        `;
        return;
    }

    container.innerHTML = '';

    for (const listing of agency.listings) {
        const listingCard = await createListingCard(listing);
        container.appendChild(listingCard);
    }
}

async function createListingCard(listing) {
    const card = document.createElement('div');
    card.className = 'bg-gray-50 rounded-lg p-4 hover:bg-gray-100 transition-colors border border-gray-200';

    card.innerHTML = `
        <div class="flex items-center justify-between gap-3">
            <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                    <i class="fas fa-home text-blue-600"></i>
                    <h3 class="font-semibold text-gray-900 line-clamp-1">${escapeHtml(listing.title)}</h3>
                </div>
            </div>
            <button onclick="viewListing(${listing.id})" class="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition flex items-center gap-2 flex-shrink-0">
                <i class="fas fa-arrow-right"></i>
                Bax
            </button>
        </div>
    `;

    return card;
}

function viewListing(listingId) {
    window.location.href = `property.html?id=${listingId}`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// =================================================================
// AUTHENTICATION & UI MANAGEMENT (Giriş/Çıxış İdarəetməsi)
// =================================================================

const handleLogout = async () => {
    try {
        const token = localStorage.getItem('jwt');

        const response = await fetch(LOGOUT_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                ...(token && { 'Authorization': `Bearer ${token}` })
            }
        });

        // Clear localStorage
        localStorage.removeItem('jwt');

        // Update UI and redirect
        updateAuthUI();
        window.location.href = './index.html';

    } catch (error) {
        localStorage.removeItem('jwt');
        updateAuthUI();
        console.error('Çıxış zamanı xəta:', error);
    }
};

const updateAuthUI = () => {
    const newListingBtn = document.getElementById('newListing');
    const loginLink = document.getElementById('loginLink');
    const userDropdown = document.getElementById('userDropdown');

    const token = localStorage.getItem('jwt');

    if (!newListingBtn) return;

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
        newListingBtn.classList.remove('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
        newListingBtn.classList.add('cursor-pointer');
        newListingBtn.href = './Create.html';

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

        // Disable "Yeni elan" button (make it look inactive)
        newListingBtn.classList.add('opacity-50', 'pointer-events-none', 'cursor-not-allowed');
        newListingBtn.classList.remove('cursor-pointer');
        newListingBtn.href = '#';
    }
};

// Initialize dropdown toggle functionality
const initializeDropdown = () => {
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
};


