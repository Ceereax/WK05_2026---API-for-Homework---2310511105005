const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

// Use your helper module instead of MongoClient directly
const mongofunc = require('./mongofunc');

const PORT = process.env.PORT || 9888;

// We no longer need MongoClient, uri, or client here;
// mongofunc.js handles connect/insert/etc.

function startServer() {
    const server = http.createServer(onClientRequest);
    server.listen(PORT);
    console.log('The Loop API running on ' + PORT);
}

function onClientRequest(req, resp) {
    resp.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
    });

    const parsedUrl = url.parse(req.url, true);
    const pathname = parsedUrl.pathname;
    const query = parsedUrl.query; // to read ?playerId=...

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

    // CREATE TEST PLAYER (GET /api/create-test-player)
    if (req.method === 'GET' && pathname === '/api/create-test-player') {
        const testPlayer = {
            playerId: 'player-001',
            username: 'TestPlayer',
            coins: 100,
            skinsOwned: [],
            stats: {
                gamesPlayed: 0,
                highScore: 0
            },
            createdAt: new Date()
        };

        (async () => {
            try {
                // use mongofunc.insert instead of playersCollection.insertOne
                const result = await mongofunc.insert('theloop', 'players', testPlayer);
                resp.end(JSON.stringify({
                    success: true,
                    insertedId: result.insertedId || (result.insertedIds && result.insertedIds[0]),
                    player: testPlayer
                }));
            } catch (err) {
                console.error('Failed to create test player via mongofunc:', err);
                resp.end(JSON.stringify({ error: 'Failed to create test player' }));
            }
        })();

        return;
    }

    // GACHA API (POST or GET /api/gacha)
    if ((req.method === 'POST' || req.method === 'GET') && pathname === '/api/gacha') {
        const playerId = query.playerId || null;

        fs.readFile(path.join(process.cwd(), 'data/shop.json'), 'utf8')
            .then(async shopData => {
                const shop = JSON.parse(shopData);

                const rand = Math.random();
                const rarity = rand < 0.7 ? 'common' : rand < 0.9 ? 'rare' : 'epic';

                const skins = shop.skins.filter(skin => skin.rarity === rarity);
                if (skins.length === 0) {
                    resp.end(JSON.stringify({ error: `No skins with rarity ${rarity}` }));
                    return;
                }

                const skin = skins[Math.floor(Math.random() * skins.length)];

                const result = {
                    success: true,
                    playerId: playerId,   // can be null
                    skin: skin,
                    rarity: rarity,
                    message: `You got ${rarity} skin: ${skin.name}!`,
                    time: new Date()
                };

                try {
                    // log using mongofunc helper
                    await mongofunc.insert('theloop', 'gacha_logs', result);
                } catch (err) {
                    console.error('Failed to log gacha to MongoDB via mongofunc:', err);
                    // still respond success to the client
                }

                resp.end(JSON.stringify(result));
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
            'GACHA:  GET or POST /api/gacha?playerId=player-001',
            'PLAYER: GET /api/create-test-player'
        ]
    }));
}

startServer();