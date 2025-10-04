const API_BASE_URL = 'https://localhost:7027/api';
let propertyData = null;

function getPropertyIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

async function fetchPropertyData(propertyId) {
    try {
        const response = await fetch(`${API_BASE_URL}/Listing/GetListingDetailById/${propertyId}`);

        if (!response.ok) {
            throw new Error(`HTTP xətası! Status: ${response.status}`);
        }

        const property = await response.json();
        
        if (!property) {
             throw new Error('Serverdən boş cavab alındı.');
        }
        
        return property;
        
    } catch (error) {
        console.error('Məlumat çəkilərkən xəta:', error);
        throw error;
    }
}

// ===============================================
// Xəritə Funksiyası (Leaflet)
// ===============================================

function initMiniMap(lat, lng) {
    if (typeof L === 'undefined') {
        console.warn('Leaflet kitabxanası yüklənməyib.');
        return;
    }

    const mapElement = document.getElementById('miniMap');
    if (!mapElement) return;

    const latFloat = parseFloat(lat);
    const lngFloat = parseFloat(lng);
    
    const map = L.map('miniMap', {
        zoomControl: false 
    }).setView([latFloat, lngFloat], 15);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    L.marker([latFloat, lngFloat])
        .addTo(map)
        .bindPopup(propertyData.title || "Mülkün Yeri") 
        .openPopup();
        
    setTimeout(() => { map.invalidateSize(); }, 300);
}

// ===============================================
// Köməkçi Funksiyalar (Helpers)
// ===============================================

function formatPrice(price) {
    if (price === null || price === undefined) return '-';
    return new Intl.NumberFormat('az-AZ').format(price) + ' AZN';
}

function formatDate(dateString) {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('az-AZ');
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

// ===============================================
// UX/UI Funksiyaları
// ===============================================

function showLoading() {
    const elements = ['propertyTitle', 'propertyPrice', 'propertyDescription'];
    elements.forEach(id => {
        const element = document.getElementById(id);
        if (element) {
            element.textContent = 'Məlumatlar yüklənir...';
        }
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

function loadPropertyImages() {
    const imageContainer = document.querySelector('.image-placeholder');
    if (!imageContainer) return;

    if (propertyData?.images && propertyData.images.length > 0) {
        imageContainer.innerHTML = `
            <img src="${propertyData.images[0].url}" alt="${propertyData.title || 'Mülk şəkli'}" 
                 style="width: 100%; height: 100%; object-fit: cover; border-radius: 8px;">
        `;
    } else {
        imageContainer.innerHTML = `
            <div style="text-align: center; padding: 50px;">
                <i class="fas fa-home fa-3x" style="color: #ccc;"></i>
                <p style="color: #999; margin-top: 10px;">Şəkil yoxdur</p>
            </div>
        `;
    }
}

function loadMetroStations() {
    const metroContainer = document.getElementById('metroStations');

    if (!metroContainer) return;
    
    if (propertyData?.listingMetros && propertyData.listingMetros.length > 0) {
        metroContainer.innerHTML = '';
        propertyData.listingMetros.forEach(metro => {
            const metroStation = document.createElement('div');
            metroStation.className = 'metro-station px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium';
            
            const metroName = metro.metroStation?.name || 'Naməlum Stansiya'; 
            
            metroStation.innerHTML = `<i class="fas fa-subway mr-2"></i> ${metroName}`;
            metroContainer.appendChild(metroStation);
        });
    } else {
        metroContainer.innerHTML = '<p style="color: #999; padding: 20px; text-align: center;">Metro stansiyası məlumatı yoxdur</p>';
    }
}

function populatePropertyData() {
    if (!propertyData) {
        showError('Məlumat tapılmadı və ya yüklənmədi.');
        return;
    }

    document.getElementById('propertyTitle').textContent = propertyData.title || 'Başlıq yoxdur';
    document.getElementById('propertyPrice').textContent = formatPrice(propertyData.price);
    document.getElementById('propertyDescription').textContent = propertyData.description || 'Açıqlama yoxdur';

    const advertTypeEl = document.getElementById('advertType');
    if (advertTypeEl) {
        advertTypeEl.textContent = getAdvertTypeText(propertyData.advertType);
        advertTypeEl.className = propertyData.advertType === 1 
            ? 'advert-type bg-red-100 text-red-800' 
            : 'advert-type bg-blue-100 text-blue-800';
    }

    if (propertyData.isPremium) {
        const premiumBadgeEl = document.getElementById('premiumBadge');
        const premiumExpireEl = document.getElementById('premiumExpireDate');
        if (premiumBadgeEl) premiumBadgeEl.style.display = 'inline-block';
        if (premiumExpireEl) {
            premiumExpireEl.textContent = propertyData.premiumExpireDate 
                ? `(Son: ${formatDate(propertyData.premiumExpireDate)})` 
                : '';
        }
    } else {
         const premiumBadgeEl = document.getElementById('premiumBadge');
         if (premiumBadgeEl) premiumBadgeEl.style.display = 'none';
    }

    // Detaylar Cədvəli: Dəyəri olmayanları gizlədir
    const detailFields = [
        { id: 'rooms', rowId: 'rooms-row', value: propertyData.rooms, isZeroValid: false },
        { id: 'floor', rowId: 'floor-row', value: propertyData.floor, isZeroValid: false },
        { id: 'totalFloors', rowId: 'totalFloors-row', value: propertyData.totalFloors, isZeroValid: false },
        { id: 'area', rowId: 'area-row', value: propertyData.area, isZeroValid: false },
        { id: 'renovation', rowId: 'renovation-row', value: getRenovationText(propertyData.renovation), isZeroValid: true },
        { id: 'createdAt', rowId: 'createdAt-row', value: formatDate(propertyData.createdAt), isZeroValid: true },
        { id: 'creatorType', rowId: 'creatorType-row', value: getCreatorTypeText(propertyData.creatorType), isZeroValid: true },
        { id: 'category', rowId: 'category-row', value: propertyData.category?.name, isZeroValid: true }, 
        { id: 'location', rowId: 'location-row', value: propertyData.location?.address, isZeroValid: true } 
    ];

    detailFields.forEach(({ id, rowId, value, isZeroValid }) => {
        const element = document.getElementById(id);
        const rowElement = document.getElementById(rowId);
        
        let isValid = false;
        
        if (typeof value === 'number') {
            isValid = isZeroValid ? true : (value > 0);
        } else {
            isValid = !!value && value !== '-' && value !== 'Naməlum';
        }

        if (isValid) {
            if (element) {
                element.textContent = value;
            }
            if (rowElement) {
                rowElement.style.display = ''; 
            }
        } else {
            if (rowElement) {
                rowElement.style.display = 'none';
            }
        }
    });

    const locationDescEl = document.getElementById('locationDescription');
    if (locationDescEl) {
        const locationAddress = propertyData.location?.address || 'Naməlum ünvanda';
        locationDescEl.textContent = `Bu mülk: ${locationAddress} ünvanında yerləşir.`;
    }

    const lat = propertyData.location?.latitude;
    const lng = propertyData.location?.longitude;
    if (lat && lng) {
        const mapContainer = document.getElementById('miniMap');
        if (mapContainer) {
            initMiniMap(lat, lng); 
        }
    }

    loadPropertyImages();
    loadMetroStations();
}

function getAuthToken() {
    return localStorage.getItem('jwt') || localStorage.getItem('authToken') || localStorage.getItem('token');
}

function getUserIdFromToken() {
    const token = getAuthToken();
    if (!token) return null;
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const payload = JSON.parse(atob(base64));
        return payload.nameid; 
    } catch (e) {
        console.error("JWT tokenini oxumaq mümkün olmadı:", e);
        return null;
    }
}

function handleMessageClick() {
    // 1. Məlumatların tam yükləndiyini yoxlayırıq
    if (!propertyData || !propertyData.userId || !propertyData.id) {
        alert('Məlumat tam yüklənməyib və ya elan sahibi ID-si yoxdur.');
        return;
    }

    // 2. İstifadəçinin öz elanına mesaj yazmasını yoxlayırıq
    const currentUserId = getUserIdFromToken();
    if (!currentUserId) {
        alert('Mesaj yazmaq üçün sistemə daxil olmalısınız.');
        // Login səhifəsinə yönləndirmə əlavə edə bilərsiniz
        // window.location.href = '/Login.html';
        return;
    }

    if (currentUserId === propertyData.userId) {
        alert('Öz elanınıza mesaj göndərə bilməzsiniz.');
        return;
    }

    // 3. Məlumatları sessionStorage-da saxlayırıq
    sessionStorage.setItem('chat_otherUserId', propertyData.userId);
    sessionStorage.setItem('chat_listingId', propertyData.id);
    sessionStorage.setItem('chat_listingTitle', propertyData.title); // Elanın adını da göndərək

    // 4. İstifadəçini chat səhifəsinə yönləndiririk
    window.location.href = '/Chat.html'; 
}

function togglePhoneNumber() {
    const btnText = document.getElementById('phoneBtnText');
    const phoneNumber = document.getElementById('phoneNumber');

    if (btnText && phoneNumber) {
        if (btnText.style.display !== 'none') {
            btnText.style.display = 'none';
            phoneNumber.style.display = 'inline';
            phoneNumber.textContent = propertyData?.user?.phoneNumber || propertyData?.agency?.phoneNumber || '+994 XX XXX XX XX'; 
        } else {
            btnText.style.display = 'inline';
            phoneNumber.style.display = 'none';
        }
    }
}


document.addEventListener('DOMContentLoaded', async function () {
    const propertyId = getPropertyIdFromUrl();

    if (!propertyId) {
        showError('Əmlak ID-si URL-də tapılmadı.');
        return;
    }

    try {
        showLoading();
        propertyData = await fetchPropertyData(propertyId);
        populatePropertyData();
    } catch (error) {
        showError('Məlumat yüklənmədi: ' + error.message);
    }
});