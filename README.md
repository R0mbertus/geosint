# geosint

Platform to host panoramic streetview like (a.k.a. geoguessr) Geo OSINT CTF challenges with. *now with less google!*

## How it works

### Pulling challenge tiles

From the original repo:

> A big difference in how GeoGuessr runs things is how the panorama (Street View) is built. A normal sane person would
> just call the Google Maps JavaScript API, which runs on client-side, to gather the tiles and build the panorama all
> at once. The big issue there is that the user can easily fish the panoId from the network traffic. We don't want any
> cheaters around these parts :cowboy:.
>
> So instead, we can use `pull_challs.js` or `pull_challs_fast.js` which will query Google for the tile images and save
> them to ./public/img/chall*/ for all challenge information specified in challs.json.

**Do note**: this fork only kept the `pull_challs_fast.js`, renamed to `scripts/pull_challs.js`.

### Serving challenges

In the original repo the challenges were served using google maps api for both the panorama and the map. In this fork,
we use leaflet and leaflet-panojs to serve the panorama and leaflet with OpenStreetMap tiles for the map. This avoids
the need for Google Maps API keys and usage limits.

## Challenge format

The challenges are stored in `data/challs.json` in the following format:

```json
{
    "Challenges": {
        "<chall_name>": {"pano": 1, "lat": <latitude>, "lng": <longitude>, "maxZ": <max zoom [1-5]>, "flag": <flag for challenge>},
        ...
    }
}
```

## Running

### Docker

A `Dockerfile` and `docker-compose.yml` are provided. To build the Docker image, run:

```bash
docker compose build
# or
docker build -t geosint:latest .
```

Then, to run the container:

```bash
docker compose up -d
# or
docker run --rm -p 6958:6958 geosint:latest # or the port of your choice
```

### Local

To run the application locally, ensure Node.js >= 20 is installed. First, install the dependencies:

```bash
npm install
```

Then, pull the challenge tiles:

```bash
npm run pull
# or
node scripts/pull_challs.js
```

Finally, start the server on port 6958:

```bash
npm start
# or
node app.js
```

### Shoutout

Shoutout to [bensizelove](https://github.com/bensizelove/geoguessr) and [JustHackingCo](https://github.com/JustHackingCo/geosint)
