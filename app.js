const path = require('path');

const express = require('express');
const bodyParser = require('body-parser');
const compression = require('compression');

const app = express();
const port = process.env.PORT ? Number(process.env.PORT) : 6958;

const publicDir = path.join(__dirname, 'public');
const challViewPath = path.join(__dirname, 'views', 'chall.html');

// Enable gzip compression for all responses
app.use(compression());

// Cache images for 7 days (images don't change)
app.use('/img', (req, res, next) => {
    res.set('Cache-Control', 'public, max-age=604800');
    next();
});

// Cache other static assets for 1 day
app.use(express.static(publicDir, {
    maxAge: '1d',
    etag: false,
}));
app.use(bodyParser.json());

const coords = require(path.join(__dirname, 'data', 'challs.json'));

for (const [comp, challs] of Object.entries(coords)) {
    for (const [name, { lat, lng, flag }] of Object.entries(challs)) {
        app.get(`/${name}`, function (req, res) {
            res.sendFile(challViewPath);
        });

        app.post(`/${name}/submit`, (req, res) => {
            const [guess_lat, guess_lng] = req.body;
            const dist = distance(guess_lat, guess_lng, lat, lng, 'K');
            console.log(`Distance guess for ${name}: ${dist} km`);
            if (dist < 0.1) {
                res.send('yes, ' + flag);
            } else {
                res.send('not here');
            }
        });
    }
}

// Honestly no idea if this is accurate or not :shrug:
function distance(lat1, lon1, lat2, lon2, unit) {
    if (lat1 == lat2 && lon1 == lon2) {
        return 0;
    }

    let radlat1 = Math.PI * lat1 / 180;
    let radlat2 = Math.PI * lat2 / 180;
    let theta = lon1 - lon2;
    let radtheta = Math.PI * theta / 180;

    let dist =
        Math.sin(radlat1) * Math.sin(radlat2) +
        Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);

    if (dist > 1) {
        dist = 1;
    }

    dist = Math.acos(dist);
    dist = dist * 180 / Math.PI;
    dist = dist * 60 * 1.1515;
    if (unit == 'K') {
        dist = dist * 1.609344;
    }
    if (unit == 'N') {
        dist = dist * 0.8684;
    }

    return (dist / 1.609).toFixed(1);
}

app.listen(port, () => console.log(`geosint listening on port ${port}`));
