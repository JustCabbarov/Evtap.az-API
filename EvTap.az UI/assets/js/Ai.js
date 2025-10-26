 
        let selectedFunction = '';
        let selectedCategory = null;
        let debounceTimer = null;
        let userMarker = null;
        let placesMarkers = [];
        let map = null;
        let allPlaces = [];
        let currentPage = 1;
        const itemsPerPage = 8; // 4x2 grid


        
const LOGOUT_API = 'https://localhost:7027/api/Authorization/LogOut'; 



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

        // Cavabın statusundan asılı olmayaraq, Local Storage-i təmizlə
        localStorage.removeItem('jwt');
        
        // UI-ı yeniləyir və əsas səhifəyə yönləndirir
        updateAuthUI();
        window.location.href = '/'; 

    } catch (error) {
        localStorage.removeItem('jwt');
        updateAuthUI();
        console.error('Çıxış zamanı xəta:', error);
    }
};

const updateAuthUI = () => {
   
    
    const newListingLink = document.getElementById('newListing');
    const loginLink = document.getElementById('loginLink');
    const messagesLink = document.getElementById('messagesLink');
    
    const token = localStorage.getItem('jwt');

    if (!loginLink) return;

    if (token) {
        
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


document.addEventListener('DOMContentLoaded', () => {
     
    
    updateAuthUI(); 
});
        // Initialize map
        function initializeMap() {
            // Remove existing map if it exists
            if (map) {
                map.remove();
                map = null;
            }

            // Wait for DOM element to be available
            const mapElement = document.getElementById('map');
            if (!mapElement) {
                console.error('Map element not found');
                return;
            }

            map = L.map('map').setView([40.4093, 49.8671], 12);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '&copy; OpenStreetMap contributors'
            }).addTo(map);

            // Add click event to map
            map.on('click', (e) => {
                setUserMarker(e.latlng.lat, e.latlng.lng);
            });
        }

        // Google API key
        const apiKey = "AIzaSyBZTHDv7uLxgWbc-gkIGQUlGZOHMDn9eNM";

        function selectFunction(func) {
            selectedFunction = func;

            // Remove active class from all buttons
            document.querySelectorAll('.function-btn').forEach(btn => {
                btn.classList.remove('active');
            });

            // Add active class to selected button
            event.currentTarget.classList.add('active');

            // Get content area
            const contentArea = document.getElementById('contentArea');

            // Generate content based on function
            if (func === 'ai-analysis') {
                contentArea.innerHTML = `
                    <div class="query-section">
                        <h2 style="color: #1e293b; margin-bottom: 24px; font-weight: 600; font-size: 1.6em;">🤖 AI Analiz</h2>
                        <div style="display: grid; grid-template-columns: auto 1fr; gap: 24px; align-items: start;">
                            <div style="display: flex; flex-direction: column; gap: 16px;">
                                <button class="btn btn-success" onclick="fetchAIAnalysis()">AI Analiz Et</button>
                            </div>
                            <div>
                                <input type="text" class="location-input" id="aiAnalysisInput" placeholder="AI-dan analiz və tövsiyə almaq üçün mətninizi yazın...">
                                <div id="aiAnalysisResults" style="margin-top: 24px;"></div>
                            </div>
                        </div>
                    </div>
                `;
            } else if (func === 'evtap-statistics') {
                contentArea.innerHTML = `
                    <div class="query-section">
                        <h2 style="color: #1e293b; margin-bottom: 24px; font-weight: 600; font-size: 1.6em;">📊 EvTap Statistika</h2>
                        <div style="display: grid; grid-template-columns: auto 1fr; gap: 24px; align-items: start;">
                            <div style="display: flex; flex-direction: column; gap: 16px;">
                                <button class="btn btn-primary" onclick="fetchStats()">Axtar</button>
                            </div>
                            <div>
                                <input type="text" class="location-input" id="statisticsInput" placeholder="Məsələn: Nərimanov 2 otaqlı ev">
                                <div id="statisticsResults" style="margin-top: 24px;"></div>
                            </div>
                        </div>
                    </div>
                `;
            } else if (func === 'location-finder') {
                contentArea.innerHTML = `
                    <div class="query-section">
                        <h2 style="color: #1e293b; margin-bottom: 24px; font-weight: 600; font-size: 1.6em;">📍 Yer Tapıcı və Nearby Places</h2>
                        <div style="display: grid; grid-template-columns: auto 1fr; gap: 24px; align-items: start;">
                            <div style="display: flex; flex-direction: column; gap: 16px;">
                                <button class="btn btn-primary" onclick="getCoordinates()">Tap</button>
                            </div>
                            <div>
                                <input type="text" class="location-input" id="locationInput" placeholder="Məsələn: Yasamal, Bakı">
                                <p id="output" style="margin: 10px 0; font-weight: bold; color: #1e293b; display: none;"></p>
                                <div id="map" style="height: 300px; width: 100%; margin: 16px 0; border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);"></div>
                                <p style="text-align: center; color: #64748b; font-size: 14px; margin: 10px 0;">💡 Xəritəyə klikləyərək yer seçə bilərsiniz</p>
                                <div class="location-controls">
                                    <div class="radius-container">
                                        <label for="radius">Radius (metr):</label>
                                        <input type="range" id="radius" class="radius-slider" min="500" max="5000" value="1500" step="100">
                                        <span id="radiusValue">1500</span>
                                    </div>
                                </div>
                                <div class="categories-container">
                                    <button class="category-btn" data-type="grocery_or_supermarket">Market</button>
                                    <button class="category-btn" data-type="cafe">Kafe</button>
                                    <button class="category-btn" data-type="restaurant">Restoran</button>
                                    <button class="category-btn" data-type="lodging">Hotel</button>
                                    <button class="category-btn" data-type="hospital">Xəstəxana</button>
                                    <button class="category-btn" data-type="pharmacy">Eczaxana</button>
                                </div>
                                <div class="places-container" id="placesContainer"></div>
                            </div>
                        </div>
                    </div>
                `;

                // Initialize map after content is loaded
                setTimeout(() => {
                    initializeMap();
                    initializeLocationFinder();
                }, 100);
            }
        }

        function processQuery(func) {
            if (func === 'location-finder') {
                selectFunction('location-finder');
                return;
            }

            if (func === 'evtap-statistics') {
                selectFunction('evtap-statistics');
                return;
            }
        }


        function showResponse() {
            document.getElementById('responseArea').style.display = 'block';
            document.getElementById('responseArea').scrollIntoView({ behavior: 'smooth' });
        }

        function showLoading() {
            document.getElementById('loading').style.display = 'block';
            document.getElementById('responseContent').style.display = 'none';
        }

        function hideLoading() {
            document.getElementById('loading').style.display = 'none';
            document.getElementById('responseContent').style.display = 'block';
        }

        function showResponseContent(func, query) {
            const responseContent = document.getElementById('responseContent');

            const responses = {
                'ai-analysis': `
                    <h4>🤖 AI Analiz Nəticəsi:</h4>
                    <p>AI analizi üçün modal istifadə edin.</p>
                `,
            };

            responseContent.innerHTML = responses[func] || '<p>Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.</p>';
        }


        // Mobile menu toggle
        document.getElementById('hamburger').addEventListener('click', function () {
            const mobileMenu = document.getElementById('mobileMenu');
            mobileMenu.classList.toggle('hidden');
        });

        // Modal functions (removed - no longer needed)

        // AI Analysis Function
        async function fetchAIAnalysis() {
            const userInput = encodeURIComponent(document.getElementById('aiAnalysisInput').value);
            const url = `https://myworkflow123.app.n8n.cloud/webhook-test/Analiz?input=${userInput}`;
            const resultsContainer = document.getElementById('aiAnalysisResults');

            // Show loading spinner
            resultsContainer.innerHTML = `
                <div class="loading" style="display: block;">
                    <div class="spinner"></div>
                    <div class="loading-text">AI analizini hazırlayır...</div>
                </div>
            `;

            try {
                const response = await fetch(url);
                const data = await response.json();

                // AI-dan gələn mətn cavabı
                let aiResponse = '';

                if (Array.isArray(data) && data.length > 0) {
                    // Array formatında gələn cavab
                    aiResponse = data[0].text || data[0].message || data[0].analysis || 'AI cavabı alına bilmədi.';
                } else {
                    // Object formatında gələn cavab
                    aiResponse = data.result || data.message || data.analysis || data.text || 'AI cavabı alına bilmədi.';
                }

                // Markdown formatını HTML-ə çevir
                const formattedResponse = aiResponse
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br>')
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

                resultsContainer.innerHTML = `
                    <div style="background: linear-gradient(135deg, rgba(67, 233, 123, 0.1) 0%, rgba(56, 249, 215, 0.1) 100%); padding: 25px; border-radius: 20px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); border: 1px solid rgba(67, 233, 123, 0.2);">
                        <div style="display: flex; align-items: center; margin-bottom: 20px;">
                            <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #43e97b 0%, #38f9d7 100%); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                                <span style="font-size: 24px;">🤖</span>
                            </div>
                            <h3 style="color: #2d3748; margin: 0; font-size: 1.3em; font-weight: 600;">AI Analiz Nəticəsi</h3>
                        </div>
                        
                        <div style="background: rgba(255, 255, 255, 0.8); padding: 20px; border-radius: 15px; line-height: 1.8; color: #2d3748; font-size: 16px;">
                            ${formattedResponse}
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Xəta baş verdi:', error);
                const resultsContainer = document.getElementById('aiAnalysisResults');
                resultsContainer.innerHTML = `
                    <div style="background: linear-gradient(135deg, rgba(229, 62, 62, 0.1) 0%, rgba(245, 101, 101, 0.1) 100%); padding: 25px; border-radius: 20px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); text-align: center; border: 1px solid rgba(229, 62, 62, 0.2);">
                        <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #e53e3e 0%, #f56565 100%); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin: 0 auto 15px;">
                            <span style="font-size: 24px; color: white;">❌</span>
                        </div>
                        <h3 style="color: #e53e3e; margin: 0 0 10px 0; font-size: 1.2em; font-weight: 600;">Xəta baş verdi</h3>
                        <p style="color: #4a5568; margin: 0; line-height: 1.6;">AI analizini gətirərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.</p>
                    </div>
                `;
            }
        }

        // EvTap Statistics Function
        async function fetchStats() {
            const userInput = encodeURIComponent(document.getElementById('statisticsInput').value);
            const url = `https://myworkflow123.app.n8n.cloud/webhook-test/get-sql?input=${userInput}`;
            const resultsContainer = document.getElementById('statisticsResults');

            // Show loading spinner
            resultsContainer.innerHTML = `
                <div class="loading" style="display: block;">
                    <div class="spinner"></div>
                    <div class="loading-text">Statistikaları yükləyir...</div>
                </div>
            `;

            try {
                const response = await fetch(url);
                const data = await response.json();

                const result = data.result;

                resultsContainer.innerHTML = `
                    <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 25px; margin-top: 20px;">
                        <!-- Satılan Evlər -->
                        <div style="background: linear-gradient(135deg, rgba(102, 126, 234, 0.1) 0%, rgba(118, 75, 162, 0.1) 100%); padding: 25px; border-radius: 20px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); border: 1px solid rgba(102, 126, 234, 0.2);">
                            <div style="display: flex; align-items: center; margin-bottom: 20px;">
                                <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                                    <span style="font-size: 24px;">🏠</span>
                                </div>
                                <h3 style="color: #2d3748; margin: 0; font-size: 1.3em; font-weight: 600;">Satılan Evlər</h3>
                            </div>
                            
                            <div style="display: grid; gap: 15px;">
                                <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px; border-left: 4px solid #667eea;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: #4a5568; font-weight: 500;">Kvadrat metr başına orta qiymət</span>
                                        <span style="color: #2d3748; font-weight: 700; font-size: 1.1em;">${result.sold_stats.average_price_per_m2} ₼</span>
                                    </div>
                                </div>
                                
                                <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px; border-left: 4px solid #667eea;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: #4a5568; font-weight: 500;">Orta qiymət</span>
                                        <span style="color: #2d3748; font-weight: 700; font-size: 1.1em;">${result.sold_stats.average_price} ₼</span>
                                    </div>
                                </div>
                                
                                <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px; border-left: 4px solid #667eea;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: #4a5568; font-weight: 500;">Min qiymət</span>
                                        <span style="color: #38a169; font-weight: 700; font-size: 1.1em;">${result.sold_stats.min_price} ₼</span>
                                    </div>
                                </div>
                                
                                <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px; border-left: 4px solid #667eea;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: #4a5568; font-weight: 500;">Max qiymət</span>
                                        <span style="color: #e53e3e; font-weight: 700; font-size: 1.1em;">${result.sold_stats.max_price} ₼</span>
                                    </div>
                                </div>
                                
                                <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px; border-left: 4px solid #667eea;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: #4a5568; font-weight: 500;">Ümumi siyahı sayı</span>
                                        <span style="color: #2d3748; font-weight: 700; font-size: 1.1em;">${result.sold_stats.total_listings}</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Kirayə Evlər -->
                        <div style="background: linear-gradient(135deg, rgba(240, 147, 251, 0.1) 0%, rgba(245, 87, 108, 0.1) 100%); padding: 25px; border-radius: 20px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); border: 1px solid rgba(240, 147, 251, 0.2);">
                            <div style="display: flex; align-items: center; margin-bottom: 20px;">
                                <div style="width: 50px; height: 50px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); border-radius: 15px; display: flex; align-items: center; justify-content: center; margin-right: 15px;">
                                    <span style="font-size: 24px;">🏡</span>
                                </div>
                                <h3 style="color: #2d3748; margin: 0; font-size: 1.3em; font-weight: 600;">Kirayə Evlər</h3>
                            </div>
                            
                            <div style="display: grid; gap: 15px;">
                                <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px; border-left: 4px solid #f093fb;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: #4a5568; font-weight: 500;">Kvadrat metr başına orta qiymət</span>
                                        <span style="color: #2d3748; font-weight: 700; font-size: 1.1em;">${result.rented_stats.average_price_per_m2} ₼</span>
                                    </div>
                                </div>
                                
                                <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px; border-left: 4px solid #f093fb;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: #4a5568; font-weight: 500;">Orta qiymət</span>
                                        <span style="color: #2d3748; font-weight: 700; font-size: 1.1em;">${result.rented_stats.average_price} ₼</span>
                                    </div>
                                </div>
                                
                                <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px; border-left: 4px solid #f093fb;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: #4a5568; font-weight: 500;">Min qiymət</span>
                                        <span style="color: #38a169; font-weight: 700; font-size: 1.1em;">${result.rented_stats.min_price} ₼</span>
                                    </div>
                                </div>
                                
                                <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px; border-left: 4px solid #f093fb;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: #4a5568; font-weight: 500;">Max qiymət</span>
                                        <span style="color: #e53e3e; font-weight: 700; font-size: 1.1em;">${result.rented_stats.max_price} ₼</span>
                                    </div>
                                </div>
                                
                                <div style="background: rgba(255, 255, 255, 0.8); padding: 15px; border-radius: 12px; border-left: 4px solid #f093fb;">
                                    <div style="display: flex; justify-content: space-between; align-items: center;">
                                        <span style="color: #4a5568; font-weight: 500;">Ümumi siyahı sayı</span>
                                        <span style="color: #2d3748; font-weight: 700; font-size: 1.1em;">${result.rented_stats.total_listings}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                `;

            } catch (error) {
                console.error('Xəta baş verdi:', error);
                resultsContainer.innerHTML = `
                    <div style="background: linear-gradient(135deg, rgba(229, 62, 62, 0.1) 0%, rgba(245, 101, 101, 0.1) 100%); padding: 30px; border-radius: 20px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1); text-align: center; border: 1px solid rgba(229, 62, 62, 0.2); margin-top: 20px;">
                        <div style="width: 60px; height: 60px; background: linear-gradient(135deg, #e53e3e 0%, #f56565 100%); border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 20px;">
                            <span style="font-size: 30px; color: white;">❌</span>
                        </div>
                        <h3 style="color: #e53e3e; margin: 0 0 10px 0; font-size: 1.3em; font-weight: 600;">Xəta baş verdi</h3>
                        <p style="color: #4a5568; margin: 0; line-height: 1.6;">Statistikaları gətirərkən xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.</p>
                    </div>
                `;
            }
        }

        // Location Finder Functions
        function setUserMarker(lat, lng) {
            if (userMarker) userMarker.remove();
            userMarker = L.marker([lat, lng], {
                draggable: true,
                icon: L.icon({
                    iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                    iconSize: [32, 32]
                })
            }).addTo(map);
            map.setView([lat, lng], 14);

            userMarker.on('dragend', (e) => {
                const pos = e.target.getLatLng();
                document.getElementById('output').textContent = '';
                if (selectedCategory) fetchPlaces(pos.lat, pos.lng);
            });

            document.getElementById('output').textContent = '';
            if (selectedCategory) fetchPlaces(lat, lng);
        }

        function clearPlacesMarkers() {
            placesMarkers.forEach(m => map.removeLayer(m.marker));
            placesMarkers = [];
        }

        function focusPlace(marker) {
            map.setView(marker.getLatLng(), 16);
            marker.openPopup();
        }

        async function fetchPlaces(lat = null, lng = null) {
            if (!selectedCategory) return;

            lat = lat ?? (userMarker ? userMarker.getLatLng().lat : 40.4093);
            lng = lng ?? (userMarker ? userMarker.getLatLng().lng : 49.8671);
            const radius = document.getElementById("radius").value;

            try {
                const response = await fetch(`https://localhost:7027/api/Places/nearby?lat=${lat}&lng=${lng}&radius=${radius}&category=${selectedCategory}`);
                if (!response.ok) throw new Error("Network response was not ok");

                const places = await response.json();
                allPlaces = places || [];
                currentPage = 1;

                clearPlacesMarkers();
                displayPlaces();

            } catch (err) {
                console.error(err);
                alert("Yerləri yükləməkdə xəta baş verdi");
            }
        }

        function displayPlaces() {
            const container = document.getElementById("placesContainer");

            if (!allPlaces || allPlaces.length === 0) {
                container.innerHTML = "<p>Heç bir yer tapılmadı.</p>";
                return;
            }

            const startIndex = (currentPage - 1) * itemsPerPage;
            const endIndex = startIndex + itemsPerPage;
            const currentPlaces = allPlaces.slice(startIndex, endIndex);

            // Create grid container
            const gridContainer = document.createElement("div");
            gridContainer.className = "places-grid";

            currentPlaces.forEach(place => {
                const m = L.marker([place.latitude, place.longitude], {
                    icon: L.icon({
                        iconUrl: 'https://maps.google.com/mapfiles/ms/icons/blue-dot.png',
                        iconSize: [32, 32]
                    })
                }).addTo(map).bindPopup(`<b>${place.name}</b><br>Məsafə: ${place.distanceKm?.toFixed(2)} km<br>Reytinq: ${place.rating ?? 'N/A'}`);

                placesMarkers.push({ marker: m, id: place.name });

                const div = document.createElement("div");
                div.className = "place-item";
                div.innerHTML = `<p class="place-name">${place.name || "Naməlum"}</p>
                                 <p class="place-info">Məsafə: ${place.distanceKm?.toFixed(2) ?? "N/A"} km<br>Reytinq: ${place.rating ?? "N/A"}</p>`;
                div.addEventListener("click", () => focusPlace(m));
                gridContainer.appendChild(div);
            });

            container.innerHTML = "";
            container.appendChild(gridContainer);

            // Add pagination if needed
            if (allPlaces.length > itemsPerPage) {
                const pagination = createPagination();
                container.appendChild(pagination);
            }
        }

        function createPagination() {
            const totalPages = Math.ceil(allPlaces.length / itemsPerPage);
            const pagination = document.createElement("div");
            pagination.className = "pagination";

            // Previous button
            const prevBtn = document.createElement("button");
            prevBtn.className = "pagination-btn";
            prevBtn.textContent = "←";
            prevBtn.disabled = currentPage === 1;
            prevBtn.onclick = () => {
                if (currentPage > 1) {
                    currentPage--;
                    displayPlaces();
                }
            };
            pagination.appendChild(prevBtn);

            // Page numbers
            for (let i = 1; i <= totalPages; i++) {
                const pageBtn = document.createElement("button");
                pageBtn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;
                pageBtn.textContent = i;
                pageBtn.onclick = () => {
                    currentPage = i;
                    displayPlaces();
                };
                pagination.appendChild(pageBtn);
            }

            // Next button
            const nextBtn = document.createElement("button");
            nextBtn.className = "pagination-btn";
            nextBtn.textContent = "→";
            nextBtn.disabled = currentPage === totalPages;
            nextBtn.onclick = () => {
                if (currentPage < totalPages) {
                    currentPage++;
                    displayPlaces();
                }
            };
            pagination.appendChild(nextBtn);

            return pagination;
        }

        async function getCoordinates() {
            const address = document.getElementById('locationInput').value;
            const outputElement = document.getElementById('output');

            if (!address) {
                outputElement.textContent = "Zəhmət olmasa bir yer adı daxil edin.";
                return;
            }

            // Show loading message
            outputElement.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: center; gap: 10px; color: #3b82f6;">
                    <div class="spinner" style="width: 20px; height: 20px; border-width: 2px;"></div>
                    <span>Yer axtarılır...</span>
                </div>
            `;
            outputElement.style.display = 'block';

            const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=${apiKey}`;

            try {
                const response = await fetch(url);
                const data = await response.json();

                if (data.status === "OK") {
                    const loc = data.results[0].geometry.location;
                    setUserMarker(loc.lat, loc.lng);
                    outputElement.style.display = 'none';
                } else {
                    outputElement.innerHTML = `<span style="color: #e53e3e;">Xəta: ${data.status}</span>`;
                }
            } catch (err) {
                outputElement.innerHTML = `<span style="color: #e53e3e;">Xəta baş verdi: ${err}</span>`;
            }
        }

        // Modal close functionality removed

        // Initialize location finder functionality
        function initializeLocationFinder() {
            // Category buttons
            document.querySelectorAll(".category-btn").forEach(btn => {
                btn.addEventListener("click", () => {
                    selectedCategory = btn.getAttribute("data-type");
                    document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
                    btn.classList.add("active");
                    if (userMarker) fetchPlaces(userMarker.getLatLng().lat, userMarker.getLatLng().lng);
                });
            });

            // Radius slider
            const radiusInput = document.getElementById("radius");
            const radiusValue = document.getElementById("radiusValue");
            if (radiusInput && radiusValue) {
                radiusInput.addEventListener("input", () => {
                    radiusValue.textContent = radiusInput.value;
                    clearTimeout(debounceTimer);
                    debounceTimer = setTimeout(() => {
                        if (userMarker) fetchPlaces(userMarker.getLatLng().lat, userMarker.getLatLng().lng);
                    }, 500);
                });
            }
        }

        document.addEventListener('DOMContentLoaded', function () {
            // Initialize when page loads
        });

    