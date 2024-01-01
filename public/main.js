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
    // Změňte zoom level na větší hodnotu (např. 10)
    map = L.map('map').setView([latitude, longitude], 7);

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
