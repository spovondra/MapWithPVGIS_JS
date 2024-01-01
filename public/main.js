let map;

$(document).ready(function () {
    const defaultLatitude = 49.744;
    const defaultLongitude = 15.339;
    initMap(defaultLatitude, defaultLongitude);

    map.on('click', function (e) {
        const clickedLatitude = e.latlng.lat.toFixed(3);
        const clickedLongitude = e.latlng.lng.toFixed(3);

        $('#latitude').val(clickedLatitude);
        $('#longitude').val(clickedLongitude);

        // Update waypoint and recalculate data
        updateWaypoint(clickedLatitude, clickedLongitude);
        calculatePVGISData();
    });
});

function initMap(latitude, longitude) {
    const roundedLatitude = parseFloat(latitude).toFixed(3);
    const roundedLongitude = parseFloat(longitude).toFixed(3);

    map = L.map('map').setView([roundedLatitude, roundedLongitude], 7);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Initial waypoint
    updateWaypoint(latitude, longitude);
}


function updateWaypoint(latitude, longitude) {
    map.eachLayer(function (layer) {
        if (layer instanceof L.Marker) {
            map.removeLayer(layer);
        }
    });

    L.marker([latitude, longitude]).addTo(map);
}

function searchLocation() {
    performSearch();
}

$('#locationSearch').keyup(function (event) {
    if (event.key === 'Enter') {
        performSearch();
    }
});


function performSearch() {
    const locationQuery = $('#locationSearch').val();
    if (locationQuery.trim() === "") {
        alert("Please enter a location");
        return;
    }

    $.ajax({
        url: 'https://nominatim.openstreetmap.org/search',
        method: 'GET',
        data: { q: locationQuery, format: 'json', limit: 1 },
        success: function (response) {
            if (response.length > 0) {
                const result = response[0];
                const latitude = parseFloat(result.lat).toFixed(3);
                const longitude = parseFloat(result.lon).toFixed(3);

                $('#latitude').val(latitude);
                $('#longitude').val(longitude);

                // Update waypoint and recalculate data
                updateWaypoint(latitude, longitude);
                calculatePVGISData();
            } else {
                alert("Location not found");
            }
        },
        error: function (xhr) {
            console.error('Error:', xhr.status);
            alert("Error fetching location data");
        }
    });
}

function calculatePVGISData() {
    const latitude = $('#latitude').val();
    const longitude = $('#longitude').val();
    const angle = $('#angle').val();
    const aspect = $('#aspect').val();

    $.ajax({
        url: '/api/calculatePVGISData',
        method: 'POST',
        data: { latitude, longitude, angle, aspect },
        success: function (response) {
            $('#pvgisData').val(response);
        },
        error: function (xhr) {
            console.error('Error:', xhr.status);
        }
    });
}

function useOptimalValues() {
    const latitude = $('#latitude').val();
    const longitude = $('#longitude').val();

    $.ajax({
        url: '/api/fetchOptimalValues',
        method: 'POST',
        data: { latitude, longitude },
        success: function (response) {
            const { optimalAngle, optimalAspect } = response;

            $('#angle').val(optimalAngle);
            $('#aspect').val(optimalAspect);

            updateWaypoint(latitude, longitude);
            calculatePVGISData();
        },
        error: function (xhr) {
            console.error('Error:', xhr.status);
        }
    });
}
