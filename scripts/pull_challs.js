const fs = require('fs');
const path = require('path');

const fetch = global.fetch.bind(global);

const repoRoot = path.join(__dirname, '..');
const coordsPath = path.join(repoRoot, 'data', 'challs.json');
const outputRoot = path.join(repoRoot, 'public', 'img');

const coords = require(coordsPath);

async function saveStreetViewTile(filePath, resp) {
    const contentType = resp.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
        return false;
    }

    const blob = await resp.blob();
    const ab = await blob.arrayBuffer();
    await fs.promises.writeFile(filePath, new Uint8Array(ab));
    return true;
}

async function pull() {
    for (const [comp, challs] of Object.entries(coords)) {
        for (const [name, { panoType, pano, maxZ }] of Object.entries(challs)) {
            const imgDir = path.join(outputRoot, name);
            await fs.promises.mkdir(imgDir, { recursive: true });

            for (let z = 0; z <= maxZ; z++) {
                for (let x = 0; x < 2 ** z; x++) {
                    for (let y = 0; y < 2 ** (z - 1); y++) {
                        const url =
                            panoType == 0
                                ? `https://lh3.ggpht.com/p/${pano}=x${x}-y${y}-z${z}`
                                : `https://streetviewpixels-pa.googleapis.com/v1/tile?cb_client=maps_sv.tactile&panoid=${pano}&output=tile&x=${x}&y=${y}&zoom=${z}&nbt=1&fover=2`;

                        const outFile = path.join(imgDir, `tile_${x}_${y}_${z}.jpeg`);

                        const resp = await fetch(url);
                        const ok = await saveStreetViewTile(outFile, resp);
                        if (ok) {
                            console.log(`Received ${name} Tile (${x}, ${y}, ${z})`);
                        } else {
                            console.log(`ERROR from ${name} Tile (${x}, ${y}, ${z})`);
                        }
                    }
                }
            }
        }
    }
}

pull().then(
    () => console.log('done'),
    (err) => {
        console.error(err);
        process.exitCode = 1;
    }
);
