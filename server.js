const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'node_modules/leaflet/dist')));
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.post('/api/calculatePVGISData', async (req, res) => {
    try {
        const { latitude, longitude, angle, aspect } = req.body;
        const apiUrl = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${latitude}&lon=${longitude}&peakpower=1&loss=1&angle=${angle}&aspect=${aspect}`;

        const apiRes = await fetchData(apiUrl);
        res.send(apiRes);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(503).send('Service Unavailable');
    }
});

app.post('/api/fetchOptimalValues', async (req, res) => {
    try {
        const { latitude, longitude } = req.body;
        const apiUrl = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${latitude}&lon=${longitude}&raddatabase=PVGIS-SARAH2&userhorizon=&usehorizon=1&outputformat=json&js=1&select_database_grid=PVGIS-SARAH2&pvtechchoice=crystSi&peakpower=1.01&loss=21&mountingplace=free&optimalangles=1`;

        const apiRes = await fetchData(apiUrl);
        const jsonResponse = JSON.parse(apiRes);
        const mountingSystem = jsonResponse.inputs.mounting_system.fixed;

        const optimalValues = {
            optimalAngle: mountingSystem.slope.optimal ? mountingSystem.slope.value : null,
            optimalAspect: mountingSystem.azimuth.optimal ? mountingSystem.azimuth.value : null
        };

        res.json(optimalValues);
    } catch (error) {
        console.error('Error:', error.message);
        res.status(503).json({ error: 'Service Unavailable' });
    }
});

async function fetchData(apiUrl) {
    return new Promise((resolve, reject) => {
        https.get(apiUrl, (apiRes) => {
            let data = '';

            apiRes.on('data', (chunk) => {
                data += chunk;
            });

            apiRes.on('end', () => {
                resolve(data);
            });
        }).on('error', (err) => {
            reject(err);
        });
    });
}

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
