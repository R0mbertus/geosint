/* jshint esversion: 6 */
/* jshint node: true */
'use strict';

let PSV = {
    Viewer: null,
    EquirectangularTilesAdapter: null,
};

let map;
let marker;
let guess_coordinates = [];
let check_count = 0;

let pano_width = 32;
let pano_height = 16;
let heading = 0;

// list of icon names
const iconNames = [
    'cat.ico',
    'gamer.ico',
    'hacker.ico',
    'pizza.ico',
    'taco.ico',
    'galaxy_brain.ico',
    'frogchamp.ico',
    'hamhands.ico',
    'justin.ico',
    'caleb.ico',
];

// Get challName
const link = document.location.href.split('/');
let challComp;
if (link[link.length - 1].length === 0) {
    challComp = link[link.length - 2];
} else {
    challComp = link[link.length - 1];
}
const parts = challComp.split('-');
const compName = parts[0];
const challName = parts[1];

function getCookie(name) {
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
        const [k, v] = cookie.split('=');
        if (k === name) return v;
    }
    return null;
}

function updateSubmitButtonReady() {
    const sb = document.getElementById('submit');
    sb.style.backgroundColor = 'rgb(109, 185, 52)';
    sb.style.color = 'black';
    sb.innerHTML = 'Submit';
}

function placeMarker(latlng) {
    if (marker) {
        marker.remove();
        marker = null;
    }

    guess_coordinates = [latlng.lat, latlng.lng];

    let icon = getCookie('icon') || 'hacker.ico';
    if (!iconNames.includes(icon)) {
        icon = 'hacker.ico';
    }

    const leafletIcon = L.icon({
        iconUrl: `/img/icons/${icon}`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
    });

    marker = L.marker([latlng.lat, latlng.lng], { icon: leafletIcon }).addTo(map);

    if (check_count === 0) {
        check_count += 1;
        updateSubmitButtonReady();
    }
}

function initMap() {
    map = L.map('map', {
        zoomControl: true,
        attributionControl: false,
        worldCopyJump: true,
    }).setView([0, 0], 1);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
    }).addTo(map);

    map.getContainer().style.cursor = 'crosshair';

    map.on('click', (event) => {
        placeMarker(event.latlng);
    });
}

function initPanorama() {
    if (!PSV.Viewer) {
        throw new Error('Photo Sphere Viewer not configured.');
    }
    if (!PSV.EquirectangularTilesAdapter) {
        throw new Error('EquirectangularTilesAdapter not configured.');
    }

    const tileSize = 512;
    const maxZ = Math.max(0, Math.round(Math.log2(pano_width)));

    // Uses the highest zoom tiles already downloaded by pull_challs.js
    const origin = document.location.origin;
    const panorama = {
        width: tileSize * pano_width,
        cols: pano_width,
        rows: pano_height,
        tileUrl: (col, row) => `${origin}/img/${compName}/${challName}/tile_${col}_${row}_${maxZ}.jpeg`,
    };

    // eslint-disable-next-line no-new
    new PSV.Viewer({
        container: document.querySelector('#pano'),
        adapter: PSV.EquirectangularTilesAdapter,
        panorama,
        navbar: false,
        defaultYaw: `${heading}deg`,
        mousewheelCtrlKey: false,
    });
}

async function initialize() {
    check_count = 0;

    // GET info.json
    const resp = await fetch('/info.json');
    if (resp.ok) {
        const infoJson = await resp.json();
        if (infoJson.hasOwnProperty(compName) && infoJson[compName].hasOwnProperty(challName)) {
            const panoInfo = infoJson[compName][challName];
            if (panoInfo.hasOwnProperty('width') && panoInfo.hasOwnProperty('height')) {
                pano_width = panoInfo.width;
                pano_height = panoInfo.height;
            }
            if (panoInfo.hasOwnProperty('heading')) {
                heading = panoInfo.heading;
            }
        }
    }

    document.getElementById('chall-title').innerHTML = '<h2>' + challName + '</h2>';
    document.getElementById('chall-result').innerHTML = 'Result: ';

    initMap();
    initPanorama();
}

// Expose submit() for the inline onclick in chall.html
async function submit() {
    const json = JSON.stringify(guess_coordinates);

    const resp = await fetch(document.location.href + '/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: json,
    });

    const text = await resp.text();
    document.getElementById('chall-result').innerHTML = text;
}

export function boot({ Viewer, EquirectangularTilesAdapter }) {
    PSV = { Viewer, EquirectangularTilesAdapter };

    // keep the inline onclick working
    window.submit = submit;

    window.addEventListener('load', () => {
        initialize().catch((err) => {
            console.error(err);
            document.getElementById('chall-result').innerHTML = 'Error: ' + err.message;
        });
    });
}
