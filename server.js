const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'node_modules/leaflet/dist')));
app.use(express.static(path.join(__dirname, 'node_modules/jquery/dist')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.post('/api/calculatePVGISData', (req, res) => {
    const { latitude, longitude, angle, aspect } = req.body;

    const apiUrl = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${latitude}&lon=${longitude}&peakpower=1&loss=1&angle=${angle}&aspect=${aspect}`;

    https.get(apiUrl, (apiRes) => {
        let data = '';

        apiRes.on('data', (chunk) => {
            data += chunk;
        });

        apiRes.on('end', () => {
            res.send(data);
        });
    }).on('error', (err) => {
        console.error('Error:', err.message);
        res.status(500).send('Internal Server Error');
    });
});

app.post('/api/fetchOptimalValues', (req, res) => {
    const { latitude, longitude } = req.body;

    const apiUrl = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${latitude}&lon=${longitude}&raddatabase=PVGIS-SARAH2&userhorizon=&usehorizon=1&outputformat=json&js=1&select_database_grid=PVGIS-SARAH2&pvtechchoice=crystSi&peakpower=1.01&loss=21&mountingplace=free&optimalangles=1`;

    https.get(apiUrl, (apiRes) => {
        let data = '';

        apiRes.on('data', (chunk) => {
            data += chunk;
        });

        apiRes.on('end', () => {
            const jsonResponse = JSON.parse(data);
            const mountingSystem = jsonResponse.inputs.mounting_system;


            const optimalValues = {
                optimalAngle: mountingSystem.slope.optimal ? mountingSystem.slope.value : null,
                optimalAspect: mountingSystem.azimuth.optimal ? mountingSystem.azimuth.value : null
            };

            res.json(optimalValues);
        });
    }).on('error', (err) => {
        console.error('Error:', err.message);
        res.status(500).json({ error: 'Internal Server Error' });
    });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
