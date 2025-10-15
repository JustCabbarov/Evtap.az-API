document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("wizardForm");
    const dynamicFields = document.getElementById("dynamicFields");
    const nextBtns = document.querySelectorAll(".next-btn");
    const prevBtns = document.querySelectorAll(".prev-btn");
    const steps = document.querySelectorAll(".step");
    const stepContents = document.querySelectorAll(".step-content");
    const progressBar = document.getElementById("progressBar");

    let currentStep = 1;
    const totalSteps = stepContents.length;
    let map = null;
    let userMarker = null;

    // Kategoriya konfiqurasiyası - Sadəcə Listing entity propertiləri
    const categoryConfig = {
        2: { // Yeni tikili
            name: "Yeni tikili",
            fields: [
                { name: "rooms", label: "Otaq sayı", type: "number", min: 1, max: 10 },
                { name: "floor", label: "Mərtəbə", type: "number", min: 1 },
                { name: "totalFloors", label: "Ümumi mərtəbə", type: "number", min: 1 },
                {
                    name: "renovation", label: "Təmir vəziyyəti", type: "select",
                    options: [
                        { value: "1", text: "Yeni təmir" },


                        { value: "2", text: "Təmir olunmayıb" }
                    ]
                }
            ]
        },
        3: { // Köhnə tikili
            name: "Köhnə tikili",
            fields: [
                { name: "rooms", label: "Otaq sayı", type: "number", min: 1, max: 10 },
                { name: "floor", label: "Mərtəbə", type: "number", min: 1 },
                { name: "totalFloors", label: "Ümumi mərtəbə", type: "number", min: 1 },
                {
                    name: "renovation", label: "Təmir vəziyyəti", type: "select",
                    options: [
                        { value: "1", text: "Yeni təmir" },


                        { value: "2", text: "Təmir olunmayıb" }
                    ]
                }
            ]
        },
        4: { // Həyət evi / Bağ evi
            name: "Həyət evi / Bağ evi",
            fields: [
                { name: "rooms", label: "Otaq sayı", type: "number", min: 1, max: 20 }

            ]
        },
        5: { // Ofis
            name: "Ofis",
            fields: [
                { name: "floor", label: "Mərtəbə", type: "number", min: 1 },
                { name: "totalFloors", label: "Ümumi mərtəbə", type: "number", min: 1 },
            ]
        },
        6: { // Qaraj
            name: "Qaraj",
            fields: [
                // Qaraj üçün xüsusi sahələr yoxdur, sadəcə sahə və digər ümumi sahələr
            ]
        },
        7: { // Torpaq
            name: "Torpaq",
            fields: [
                // Torpaq üçün xüsusi sahələr yoxdur, sadəcə sahə və digər ümumi sahələr
            ]
        },
        10: { // Torpaq
            name: "Villa",
            fields: [
                { name: "rooms", label: "Otaq sayı", type: "number", min: 1, max: 20 }
            ]
        },
        8: { // Obyekt
            name: "Obyekt",
            fields: [
                { name: "floor", label: "Mərtəbə", type: "number", min: 1 },
                { name: "totalFloors", label: "Ümumi mərtəbə", type: "number", min: 1 },
                {
                    name: "renovation", label: "Təmir vəziyyəti", type: "select",
                    options: [
                        { value: "1", text: "Yeni təmir" },


                        { value: "2", text: "Təmir olunmayıb" }
                    ]
                }
            ]
        }
    };

    // Step navigation functions
    function updateProgress() {
        const progress = (currentStep / totalSteps) * 100;
        progressBar.style.width = `${progress}%`;
    }

    function showStep(step) {
        stepContents.forEach(sc => {
            if (parseInt(sc.getAttribute("data-step")) === step) {
                sc.style.display = "block";
            } else {
                sc.style.display = "none";
            }
        });

        steps.forEach(s => {
            const sStep = parseInt(s.getAttribute("data-step"));
            s.classList.remove("active", "completed");
            if (sStep === step) {
                s.classList.add("active");
            } else if (sStep < step) {
                s.classList.add("completed");
            }
        });

        updateProgress();
    }

    // Geocoding function to convert address to coordinates
    async function geocodeAddress(address) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&countrycodes=az`);
            const data = await response.json();

            if (data && data.length > 0) {
                const result = data[0];
                const lat = parseFloat(result.lat);
                const lng = parseFloat(result.lon);

                // Update hidden inputs
                document.getElementById('latitude').value = lat;
                document.getElementById('longitude').value = lng;

                // Update map and marker
                if (map) {
                    map.setView([lat, lng], 15);

                    if (userMarker) {
                        userMarker.setLatLng([lat, lng]);
                    } else {
                        userMarker = L.marker([lat, lng], {
                            draggable: true,
                            icon: L.icon({
                                iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                                iconSize: [32, 32]
                            })
                        }).addTo(map);

                        // Add drag event
                        userMarker.on('dragend', function (e) {
                            const pos = e.target.getLatLng();
                            document.getElementById('latitude').value = pos.lat;
                            document.getElementById('longitude').value = pos.lng;
                            reverseGeocode(pos.lat, pos.lng);
                        });
                    }
                }
            }
        } catch (error) {
            console.error('Geocoding error:', error);
        }
    }

    // Reverse geocoding function to convert coordinates to address
    async function reverseGeocode(lat, lng) {
        try {
            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=18&addressdetails=1`);
            const data = await response.json();

            if (data && data.display_name) {
                // Update address field with the found address
                document.getElementById('address').value = data.display_name;
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
        }
    }

    // Initialize map
    function initializeMap() {
        if (map) return; // Already initialized

        map = L.map('map').setView([40.4093, 49.8671], 12);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors'
        }).addTo(map);

        // Add click event to map
        map.on('click', function (e) {
            const lat = e.latlng.lat;
            const lng = e.latlng.lng;

            // Update hidden inputs
            document.getElementById('latitude').value = lat;
            document.getElementById('longitude').value = lng;

            // Reverse geocode to get address
            reverseGeocode(lat, lng);

            // Add/update marker
            if (userMarker) {
                userMarker.setLatLng([lat, lng]);
            } else {
                userMarker = L.marker([lat, lng], {
                    draggable: true,
                    icon: L.icon({
                        iconUrl: 'https://maps.google.com/mapfiles/ms/icons/red-dot.png',
                        iconSize: [32, 32]
                    })
                }).addTo(map);

                // Add drag event
                userMarker.on('dragend', function (e) {
                    const pos = e.target.getLatLng();
                    document.getElementById('latitude').value = pos.lat;
                    document.getElementById('longitude').value = pos.lng;
                    reverseGeocode(pos.lat, pos.lng);
                });
            }
        });
    }

    // Fetch districts from backend
    async function fetchDistricts() {
        try {
            const response = await fetch("https://localhost:7027/api/Dictrict/GetAll");
            if (!response.ok) {
                throw new Error("Rayonlar yüklənə bilmədi");
            }
            const districts = await response.json();

            const districtSelect = document.getElementById('districtId');
            districtSelect.innerHTML = '<option value="">Rayon seçin</option>';

            districts.forEach(district => {
                const option = document.createElement('option');
                option.value = district.id;
                option.textContent = district.name;
                districtSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Rayonlar yükləmə xətası:", error);
            const districtSelect = document.getElementById('districtId');
            districtSelect.innerHTML = '<option value="">Xəta: Rayonlar yüklənə bilmədi</option>';
        }
    }

    // Fetch metro stations from backend
    async function fetchMetroStations() {
        try {
            const response = await fetch("https://localhost:7027/api/MetroStation/GetAll");
            if (!response.ok) {
                throw new Error("Metro stansiyaları yüklənə bilmədi");
            }
            const metros = await response.json();

            const metroSelect = document.getElementById('metroIds');
            metroSelect.innerHTML = '<option value="">Seçin (İstəyə bağlı)</option>';

            metros.forEach(metro => {
                const option = document.createElement('option');
                option.value = metro.id;
                option.textContent = metro.name;
                metroSelect.appendChild(option);
            });
        } catch (error) {
            console.error("Metro stansiyaları yükləmə xətası:", error);
            const metroSelect = document.getElementById('metroIds');
            metroSelect.innerHTML = '<option value="">Xəta: Metro stansiyaları yüklənə bilmədi</option>';
        }
    }

    function generateDynamicFields(categoryId) {
        const config = categoryConfig[categoryId];
        if (!config) return;

        dynamicFields.innerHTML = '';

        config.fields.forEach(field => {
            const fieldDiv = document.createElement('div');
            fieldDiv.className = 'form-group';

            const label = document.createElement('label');
            label.textContent = field.label;
            label.setAttribute('for', field.name);

            let input;

            switch (field.type) {
                case 'select':
                    input = document.createElement('select');
                    input.name = field.name;
                    input.id = field.name;

                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'Seçin';
                    input.appendChild(defaultOption);

                    field.options.forEach(option => {
                        const opt = document.createElement('option');
                        opt.value = option.value || option;
                        opt.textContent = option.text || option;
                        input.appendChild(opt);
                    });
                    break;

                default:
                    input = document.createElement('input');
                    input.type = field.type;
                    input.name = field.name;
                    input.id = field.name;
                    if (field.min !== undefined) input.min = field.min;
                    if (field.max !== undefined) input.max = field.max;
                    if (field.step !== undefined) input.step = field.step;
            }

            fieldDiv.appendChild(label);
            fieldDiv.appendChild(input);
            dynamicFields.appendChild(fieldDiv);
        });
    }

    // Kategoriya seçimi dinləyicisi
    document.addEventListener('change', (e) => {
        if (e.target.name === 'categoryId' && e.target.value) {
            generateDynamicFields(parseInt(e.target.value));
        }
    });

    // Fetch agencies from backend
    async function fetchAgencies() {
        try {
            const response = await fetch("https://localhost:7027/api/Agency/GetAll");
            if (!response.ok) {
                throw new Error("Agentliklər yüklənə bilmədi");
            }
            const agencies = await response.json();

            const agencySelect = document.getElementById('agencyId');
            agencySelect.innerHTML = '<option value="">Agentlik seçin</option>';

            agencies.forEach(agency => {
                const option = document.createElement('option');
                option.value = agency.id;
                option.textContent = agency.name;
                agencySelect.appendChild(option);
            });
        } catch (error) {
            console.error("Agentliklər yükləmə xətası:", error);
            const agencySelect = document.getElementById('agencyId');
            agencySelect.innerHTML = '<option value="">Xəta: Agentliklər yüklənə bilmədi</option>';
        }
    }

    // Creator type seçimi zamanı agentlik ID sahəsini göstər/gizlə
    document.addEventListener('change', (e) => {
        if (e.target.name === 'creatorType') {
            const agencySelectGroup = document.getElementById('agencySelectGroup');
            const agencySelect = document.getElementById('agencyId');

            if (e.target.value === '1') { // Agentlik
                agencySelectGroup.style.display = 'block';
                agencySelect.setAttribute('required', 'required');
                fetchAgencies();
            } else {
                agencySelectGroup.style.display = 'none';
                agencySelect.removeAttribute('required');
                agencySelect.value = '';
            }
        }
    });

    // Step navigation event listeners
    nextBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            // Validate current step
            const currentDiv = document.querySelector(`.step-content[data-step="${currentStep}"]`);
            const requiredInputs = currentDiv.querySelectorAll("input[required], select[required]");

            let isValid = true;
            let errorMessage = "";

            // Special validation for step 2 (category selection)
            if (currentStep === 2) {
                const categorySelected = document.querySelector('input[name="categoryId"]:checked');
                if (!categorySelected) {
                    errorMessage = "Zəhmət olmasa kategoriya seçin.";
                    isValid = false;
                }
            }

            // General validation for required fields
            for (let inp of requiredInputs) {
                if (!inp.value) {
                    inp.style.borderColor = '#e53e3e';
                    isValid = false;
                    if (!errorMessage) {
                        errorMessage = "Bütün məcburi sahələri doldurun.";
                    }
                } else {
                    inp.style.borderColor = '#e2e8f0';
                }
            }

            if (!isValid) {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: errorMessage,
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                return;
            }

            if (currentStep < totalSteps) {
                currentStep += 1;
                showStep(currentStep);

                // Fetch metro stations when reaching step 4
                if (currentStep === 4) {
                    fetchMetroStations();
                }

                // Initialize map and fetch districts when reaching step 3
                if (currentStep === 3) {
                    setTimeout(() => {
                        initializeMap();
                    }, 100);

                    // Fetch districts
                    fetchDistricts();

                    const selectedCategory = document.querySelector('input[name="categoryId"]:checked');
                    if (selectedCategory) {
                        generateDynamicFields(parseInt(selectedCategory.value));
                    }
                }
            }
        });
    });

    prevBtns.forEach(btn => {
        btn.addEventListener("click", () => {
            if (currentStep > 1) {
                currentStep -= 1;
                showStep(currentStep);
            }
        });
    });

    // Category selection handler for dynamic fields
    document.addEventListener('change', (e) => {
        if (e.target.name === 'categoryId') {
            generateDynamicFields(parseInt(e.target.value));
        }
    });

    // Input sahələrinin focus olması zamanı border rəngini düzəlt
    document.addEventListener('focusin', (e) => {
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
            e.target.style.borderColor = '#e2e8f0';
        }
    });

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // Son validasiya
        const requiredInputs = form.querySelectorAll("input[required], select[required]");
        let isValid = true;
        let errorMessage = "";

        // Check category selection
        const categorySelected = document.querySelector('input[name="categoryId"]:checked');
        if (!categorySelected) {
            errorMessage = "Zəhmət olmasa kategoriya seçin.";
            isValid = false;
        }

        // Check advert type selection
        const advertTypeSelected = document.querySelector('input[name="advertType"]:checked');
        if (!advertTypeSelected) {
            errorMessage = "Zəhmət olmasa elan növünü seçin.";
            isValid = false;
        }

        // Check required fields
        requiredInputs.forEach(inp => {
            if (!inp.value) {
                inp.style.borderColor = '#e53e3e';
                isValid = false;
                if (!errorMessage) {
                    errorMessage = "Bütün məcburi sahələri doldurun.";
                }
            } else {
                inp.style.borderColor = '#e2e8f0';
            }
        });

        if (!isValid) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: errorMessage,
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });
            return;
        }

        const formData = new FormData();
        const submitBtn = form.querySelector('button[type="submit"]');

        // Get JWT token and extract userId
        const jwtToken = localStorage.getItem('jwt');
        console.log('JWT token from localStorage:', jwtToken);

        let userId = null;

        if (jwtToken) {
            try {
                // Decode JWT token to get userId
                const payload = JSON.parse(atob(jwtToken.split('.')[1]));
                console.log('JWT payload:', payload);
                console.log('All payload keys:', Object.keys(payload));

                // Extract Id claim from JWT payload
                // ClaimTypes.NameIdentifier maps to "nameid" in JWT
                userId = payload.nameid || payload.Id || payload.id || payload.userId || payload.sub;
                console.log('Extracted userId from NameIdentifier claim:', userId);
            } catch (error) {
                console.error('JWT decode error:', error);
                console.error('Token parts:', jwtToken.split('.'));
            }
        } else {
            console.log('No token found in localStorage');
            console.log('All localStorage keys:', Object.keys(localStorage));
        }

        // If no userId found, show error
        if (!userId) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'İstifadəçi məlumatı tapılmadı. Zəhmət olmasa yenidən giriş edin.',
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true
            });
            return;
        }

        // Basic listing data
        formData.append('Title', document.getElementById('title').value);
        formData.append('Description', document.getElementById('description').value);
        formData.append('Price', document.getElementById('price').value);
        formData.append('Area', document.getElementById('area').value);
        formData.append('CategoryId', document.querySelector('input[name="categoryId"]:checked').value);

        // AdvertType validation and conversion
        const advertTypeValue = document.querySelector('input[name="advertType"]:checked').value;
        let advertType = advertTypeValue;

        // Convert to backend expected values (enum values)
        if (advertTypeValue === 'Satiram') {
            advertType = '0'; // Sale enum value
        } else if (advertTypeValue === 'KirayeVerirem') {
            advertType = '1'; // Rent enum value
        }

        formData.append('AdvertType', advertType);

        const creatorType = document.getElementById('creatorType').value;
        formData.append('CreatorType', creatorType);

        // Validate and add agencyId if creator type is Agency
        if (creatorType === '1') {
            const agencyId = document.getElementById('agencyId').value;
            if (!agencyId || agencyId === '') {
                Swal.fire({
                    toast: true,
                    position: 'top-end',
                    icon: 'error',
                    title: 'Zəhmət olmasa agentlik seçin.',
                    showConfirmButton: false,
                    timer: 3000,
                    timerProgressBar: true
                });
                return;
            }
            const agencyIdInt = parseInt(agencyId);
            if (!isNaN(agencyIdInt) && agencyIdInt > 0) {
                formData.append('AgencyId', agencyIdInt);
            }
        }

        // Add userId (required)
        formData.append('UserId', userId);

        // Location data validation
        const address = document.getElementById('address').value;
        const latitude = document.getElementById('latitude').value;
        const longitude = document.getElementById('longitude').value;
        const districtId = document.getElementById('districtId').value;

       

        if (!address || !latitude || !longitude || !districtId) {
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Zəhmət olmasa rayon seçin, xəritədə yerləşim seçin və ya ünvan yazın.',
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true
            });
            return;
        }

        const locationData = {
            Address: address,                    // From Ünvan input
            Latitude: parseFloat(latitude),      // From map coordinates
            Longitude: parseFloat(longitude),    // From map coordinates
            DistrictId: parseInt(districtId)     // From Rayon select
        };

        console.log('Location data object:', locationData);
        console.log('Location JSON string:', JSON.stringify(locationData));
        console.log('=== END LOCATION DEBUG ===');

        // Send Location as individual fields for LocationDTO
        formData.append('Location.Address', locationData.Address);
        formData.append('Location.Latitude', locationData.Latitude.toString());
        formData.append('Location.Longitude', locationData.Longitude.toString());
        formData.append('Location.DistrictId', locationData.DistrictId.toString());

        // Metro ID (optional) - as List<int>
        const metroSelect = document.getElementById('metroIds');
        const selectedMetro = metroSelect.value;
        if (selectedMetro) {
            formData.append('MetroIds', selectedMetro);
        }

        // Dynamic fields based on category (Rooms, Floor, TotalFloors, Renovation)
        const categoryId = parseInt(document.querySelector('input[name="categoryId"]:checked').value);
        const config = categoryConfig[categoryId];
        if (config) {
            config.fields.forEach(field => {
                const fieldElement = document.getElementById(field.name);
                if (fieldElement && fieldElement.value) {
                    // Map field names to DTO property names
                    let dtoFieldName = field.name;
                    if (field.name === 'renovation') {
                        dtoFieldName = 'Renovation';
                    }
                    formData.append(dtoFieldName, fieldElement.value);
                }
            });
        }

      // Images (optional) - as List<IFormFile>
      // Validate image sizes before submission
      const imageFiles = document.getElementById('image').files;
      if (imageFiles && imageFiles.length > 0) {
        const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
        const oversizedImages = [];
        
        for (let file of imageFiles) {
          if (file.size > maxSizeInBytes) {
            oversizedImages.push(file.name);
          }
        }
        
        if (oversizedImages.length > 0) {
          Swal.fire({
            icon: 'error',
            title: 'Şəkil ölçüsü çox böyükdür',
            html: `Aşağıdaki şəkillər 2MB-dan böyükdür:<br><br><strong>${oversizedImages.join('<br>')}</strong><br><br>Zəhmət olmasa həmin şəkilləri silin və daha kiçik ölçülü şəkillər yükləyin.`,
            confirmButtonText: 'Bağla',
            confirmButtonColor: '#667eea'
          });
          submitBtn.disabled = false;
          submitBtn.textContent = 'Elanı göndər';
          return;
        }
        
        for (let file of imageFiles) {
          formData.append('Image', file);
        }
      }

        // Debug: Log all FormData entries
        console.log('FormData entries:');
        for (let [key, value] of formData.entries()) {
            console.log(`${key}:`, value);
        }

        // Debug: Check if Location field exists
        const locationExists = formData.has('Location');
        console.log('Location field exists in FormData:', locationExists);

        if (locationExists) {
            const locationValue = formData.get('Location');
            console.log('Location field value:', locationValue);
            console.log('Location field type:', typeof locationValue);
        }

        // Loading state
        submitBtn.disabled = true;
        submitBtn.textContent = 'Göndərilir...';

        try {
            const headers = {};

            // Add Authorization header if JWT token exists
            if (jwtToken) {
                headers['Authorization'] = `Bearer ${jwtToken}`;
            }

            console.log('Sending request to:', "https://localhost:7027/api/Listing/CreateListing");
            console.log('Request headers:', headers);
            console.log('FormData size:', formData.entries().length);

            const resp = await fetch("https://localhost:7027/api/Listing/CreateListing", {
                method: "POST",
                headers: headers,
                body: formData
            });

            if (!resp.ok) {
                const err = await resp.text();
                throw new Error(err || "Server error");
            }

            const result = await resp.json();
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Elan yaradıldı!',
                showConfirmButton: false,
                timer: 3000,
                timerProgressBar: true
            });


            // Formu sıfırla
            form.reset();
            window.location.href = 'index.html';

        } catch (error) {
            console.error("Xəta:", error);
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'error',
                title: 'Xəta: ' + error.message,
                showConfirmButton: false,
                timer: 4000,
                timerProgressBar: true
            });
        } finally {
            submitBtn.disabled = false;
            submitBtn.textContent = 'Elanı göndər';
        }
    });

    // Address input functionality with geocoding
    document.addEventListener('input', (e) => {
        if (e.target.id === 'address') {
            const address = e.target.value;
            if (address.length > 3) {
                // Debounce the geocoding request
                clearTimeout(window.geocodeTimeout);
                window.geocodeTimeout = setTimeout(() => {
                    geocodeAddress(address);
                }, 1000);
            }
        }
    });

    // Image upload functionality
    const imageInput = document.getElementById('image');
    const imageUploadArea = document.getElementById('imageUploadArea');
    const imagePreviewContainer = document.getElementById('imagePreviewContainer');
    const selectImagesBtn = document.querySelector('.select-images-btn');
    let selectedFiles = [];

    // Click to select images
    selectImagesBtn.addEventListener('click', (e) => {
        e.preventDefault();
        imageInput.click();
    });

    imageUploadArea.addEventListener('click', (e) => {
        if (e.target === imageUploadArea || e.target.classList.contains('upload-icon') || e.target.tagName === 'P') {
            imageInput.click();
        }
    });

    // Drag and drop functionality
    imageUploadArea.addEventListener('dragover', (e) => {
        e.preventDefault();
        imageUploadArea.style.borderColor = '#667eea';
        imageUploadArea.style.background = '#f0f4ff';
    });

    imageUploadArea.addEventListener('dragleave', (e) => {
        e.preventDefault();
        imageUploadArea.style.borderColor = '#e2e8f0';
        imageUploadArea.style.background = '#f7fafc';
    });

    imageUploadArea.addEventListener('drop', (e) => {
        e.preventDefault();
        imageUploadArea.style.borderColor = '#e2e8f0';
        imageUploadArea.style.background = '#f7fafc';

        const files = Array.from(e.dataTransfer.files).filter(file => file.type.startsWith('image/'));
        handleImageSelection(files);
    });

    // Handle file input change
    imageInput.addEventListener('change', (e) => {
        const files = Array.from(e.target.files);
        handleImageSelection(files);
    });

    function handleImageSelection(newFiles) {
      // Validate image sizes (max 2MB per image)
      const maxSizeInBytes = 2 * 1024 * 1024; // 2MB
      const invalidFiles = [];
      const validFiles = [];

      newFiles.forEach(file => {
        if (file.size > maxSizeInBytes) {
          invalidFiles.push(file.name);
        } else {
          validFiles.push(file);
        }
      });

      // Show error if any files are too large
      if (invalidFiles.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Şəkil ölçüsü çox böyükdür',
          html: `Aşağıdaki şəkillər 2MB-dan böyükdür:<br><br><strong>${invalidFiles.join('<br>')}</strong><br><br>Zəhmət olmasa daha kiçik şəkillər seçin.`,
          confirmButtonText: 'Bağla',
          confirmButtonColor: '#667eea'
        });
      }

      // Add only valid files to selection
      if (validFiles.length > 0) {
        selectedFiles = [...selectedFiles, ...validFiles];
        displayImagePreviews();
      }
    }

    function displayImagePreviews() {
        imagePreviewContainer.innerHTML = '';

        selectedFiles.forEach((file, index) => {
            const reader = new FileReader();

            reader.onload = (e) => {
                const previewDiv = document.createElement('div');
                previewDiv.className = 'image-preview-item';

                previewDiv.innerHTML = `
            <img src="${e.target.result}" alt="Preview ${index + 1}">
            <button type="button" class="remove-image-btn" data-index="${index}">×</button>
          `;

                imagePreviewContainer.appendChild(previewDiv);
            };

            reader.readAsDataURL(file);
        });

        // Update the hidden file input with selected files
        const dataTransfer = new DataTransfer();
        selectedFiles.forEach(file => {
            dataTransfer.items.add(file);
        });
        imageInput.files = dataTransfer.files;
    }

    // Remove image functionality
    imagePreviewContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-image-btn')) {
            const index = parseInt(e.target.getAttribute('data-index'));
            selectedFiles.splice(index, 1);
            displayImagePreviews();
        }
    });

    // Initialize wizard
    showStep(currentStep);
});