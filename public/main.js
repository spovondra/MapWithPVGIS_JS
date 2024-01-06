let map;

$(document).ready(function () {
    // Výchozí hodnoty pro zeměpisnou šířku a délku
    const defaultLatitude = 49.744;
    const defaultLongitude = 15.339;
    initializeMap(defaultLatitude, defaultLongitude);

    // Nastavení akce po kliknutí na mapu
    map.on('click', function (e) {
        const clickedLatitude = e.latlng.lat;
        const clickedLongitude = e.latlng.lng;

        // Aktualizace políček s hodnotami zeměpisné šířky a délky
        $('#latitude').val(clickedLatitude.toFixed(3));
        $('#longitude').val(clickedLongitude.toFixed(3));

        // Aktualizace značky na mapě a přepočet dat
        updateWaypoint(clickedLatitude, clickedLongitude);
        calculatePVGISData();
    });
});

function initializeMap(latitude, longitude) {
    // Zaokrouhlené hodnoty zeměpisné šířky a délky pro počáteční umístění mapy
    const roundedLatitude = parseFloat(latitude).toFixed(3);
    const roundedLongitude = parseFloat(longitude).toFixed(3);

    // Inicializace mapy s výchozím umístěním
    map = L.map('map').setView([roundedLatitude, roundedLongitude], 7);

    // Přidání zdrojů z OpenStreetMap
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap přispěvatelé'
    }).addTo(map);

    // Inicializace počáteční značky
    updateWaypoint(latitude, longitude);
}

function updateWaypoint(latitude, longitude) {
    // Odstranění všech značek na mapě
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    // Přidání nové značky na zadané souřadnice
    L.marker([latitude, longitude]).addTo(map);
}

function searchLocation() {
    performSearch(); // Zahájení vyhledávání
}

$('#locationSearch').keyup(function (event) {
    if (event.key === 'Enter') { // Reakce na stisk klávesy Enter při psaní do pole pro vyhledávání
        performSearch();
    }
});

function performSearch() {
    // Získání hodnoty z pole pro vyhledávání
    const locationQuery = $('#locationSearch').val();
    if (locationQuery.trim() === "") {
        alert("Prosím zadejte místo"); // Upozornění na prázdný vstup
        return;
    }

    // AJAX požadavek pro geokódování místa
    $.ajax({
        url: 'https://nominatim.openstreetmap.org/search',
        method: 'GET',
        data: { q: locationQuery, format: 'json', limit: 1 },
        success: function (response) {
            if (response.length > 0) {
                // Získání prvního výsledku
                const result = response[0];
                const latitude = parseFloat(result.lat);
                const longitude = parseFloat(result.lon);

                // Aktualizace políček s novými hodnotami
                $('#latitude').val(latitude.toFixed(3));
                $('#longitude').val(longitude.toFixed(3));

                // Aktualizace značky na mapě a přepočet dat
                updateWaypoint(latitude, longitude);
                calculatePVGISData();
            } else {
                // Upozornění, že místo nebylo nalezeno
                alert("Místo nenalezeno");
            }
        },
        error: function (xhr) {
            // Zobrazení chyby při načítání dat
            console.error('Chyba:', xhr.status);
            alert("Chyba při načítání dat o místě");
        }
    });
}

function calculatePVGISData() {
    // Získání hodnot pro výpočet PVGIS dat
    const latitude = $('#latitude').val();
    const longitude = $('#longitude').val();
    const angle = $('#angle').val();
    const aspect = $('#aspect').val();

    // AJAX požadavek pro výpočet dat pomocí PVGIS
    $.ajax({
        url: '/api/calculatePVGISData',
        method: 'POST',
        data: { latitude, longitude, angle, aspect },
        success: function (response) {
            $('#pvgisData').val(response); // Aktualizace políček s výsledky
        },
        error: function (xhr) { // Zobrazení chyby při výpočtu dat
            console.error('Chyba:', xhr.status);
        }
    });
}

function useOptimalValues() {
    // Získání aktuálních hodnot zeměpisné šířky a délky
    const latitude = $('#latitude').val();
    const longitude = $('#longitude').val();

    // AJAX požadavek pro získání optimálních hodnot úhlu a orientace
    $.ajax({
        url: '/api/fetchOptimalValues',
        method: 'POST',
        data: { latitude, longitude },
        success: function (response) {
            // Získání optimálních hodnot a aktualizace formuláře
            const { optimalAngle, optimalAspect } = response;

            $('#angle').val(optimalAngle);
            $('#aspect').val(optimalAspect);

            // Aktualizace značky na mapě a přepočet dat
            updateWaypoint(latitude, longitude);
            calculatePVGISData();
        },
        error: function (xhr) { // Zobrazení chyby při načítání optimálních hodnot
            console.error('Chyba:', xhr.status);
        }
    });
}
