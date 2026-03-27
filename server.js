const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

const PORT = process.env.PORT || 9888;

function onClientRequest(req, resp) {
    resp.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;

    // SHOP API (GET /api/shop)
    if (req.method === 'GET' && pathname === '/api/shop') {
        fs.readFile(path.join(process.cwd(), 'data/shop.json'), 'utf8')
            .then(data => resp.end(data))
            .catch(() => resp.end(JSON.stringify({ error: 'Shop not found' })));
        return;
    }

    // STATS API (GET /api/stats)
    if (req.method === 'GET' && pathname === '/api/stats') {
        fs.readFile(path.join(process.cwd(), 'data/stats.json'), 'utf8')
            .then(data => resp.end(data))
            .catch(() => resp.end(JSON.stringify({ error: 'Stats not found' })));
        return;
    }

    // GACHA API (POST or GET /api/gacha)
    if ((req.method === 'POST' || req.method === 'GET') && pathname === '/api/gacha') {
        fs.readFile(path.join(process.cwd(), 'data/shop.json'), 'utf8')
            .then(shopData => {
                const shop = JSON.parse(shopData);

                // assume shop.skins exists: { skins: [ { name, rarity }, ... ] }
                const rand = Math.random();
                const rarity = rand < 0.7 ? 'common' : rand < 0.9 ? 'rare' : 'epic';

                const skins = shop.skins.filter(skin => skin.rarity === rarity);
                if (skins.length === 0) {
                    resp.end(JSON.stringify({ error: `No skins with rarity ${rarity}` }));
                    return;
                }

                const skin = skins[Math.floor(Math.random() * skins.length)];
                resp.end(JSON.stringify({
                    success: true,
                    skin: skin,
                    message: `You got ${rarity} skin: ${skin.name}!`
                }));
            })
            .catch(() => resp.end(JSON.stringify({ error: 'Gacha failed' })));
        return;
    }

    // DEFAULT
    resp.end(JSON.stringify({
        message: 'The Loop Snake Game API - 2310511105005',
        info: [
            'SHOP:   GET /api/shop',
            'STATS:  GET /api/stats',
            'GACHA:  GET or POST /api/gacha'
        ]
    }));
}

const server = http.createServer(onClientRequest);
server.listen(PORT);
console.log('The Loop API running on ' + PORT);