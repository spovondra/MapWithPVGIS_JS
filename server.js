const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const https = require('https');

const app = express();
const PORT = process.env.PORT || 3000; // Zvolený port

// Nastavení middleware pro zpracování URL-encoded a JSON dat (pro práci s klientem)
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

// Nastavení statických adresářů pro Leaflet a veřejné
app.use(express.static(path.join(__dirname, 'node_modules/leaflet/dist')));
app.use(express.static(path.join(__dirname, 'public')));

// Konfigurace cesty pro zobrazení hlavní stránky
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// API pro výpočet PVGIS dat na základě zadaných parametrů
app.post('/api/calculatePVGISData', async (req, res) => {
    try {
        // Získání parametrů
        const { latitude, longitude, angle, aspect } = req.body;
        const apiUrl = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${latitude}&lon=${longitude}&peakpower=1&loss=1&angle=${angle}&aspect=${aspect}`;

        // Volání funkce pro načtení dat z externího API
        const apiRes = await fetchData(apiUrl);
        res.send(apiRes);
    } catch (error) { // Zpracování chyby při výpočtu dat
        console.error('Chyba:', error.message);
        res.status(503).send('Služba nedostupná');
    }
});

// API pro získání optimálních hodnot úhlu a orientace panelů
app.post('/api/fetchOptimalValues', async (req, res) => {
    try {
        // Získání parametrů
        const { latitude, longitude } = req.body;
        const apiUrl = `https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=${latitude}&lon=${longitude}&raddatabase=PVGIS-SARAH2&userhorizon=&usehorizon=1&outputformat=json&js=1&select_database_grid=PVGIS-SARAH2&pvtechchoice=crystSi&peakpower=1.01&loss=21&mountingplace=free&optimalangles=1`;

        // Volání funkce pro načtení dat z externího API
        const apiRes = await fetchData(apiUrl);
        const jsonResponse = JSON.parse(apiRes);

        // Zpracování odpovědi a získání optimálních hodnot
        const mountingSystem = jsonResponse.inputs["mounting_system"].fixed;
        const optimalValues = {
            optimalAngle: mountingSystem.slope["optimal"] ? mountingSystem.slope.value : null,
            optimalAspect: mountingSystem.azimuth["optimal"] ? mountingSystem.azimuth.value : null
        };

        res.json(optimalValues); // Odeslání odpovědi v JSON formátu
    } catch (error) { // Zpracování chyby při získávání optimálních hodnot
        console.error('Chyba:', error.message);
        res.status(503).json({ error: 'Služba nedostupná' });
    }
});

// Asynchronní funkce pro načtení dat z API
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

// Spuštění lokálního serveru na zadaném portu (viz nahoře)
app.listen(PORT, () => {
    console.log(`Server běží na http://localhost:${PORT}`);
});
