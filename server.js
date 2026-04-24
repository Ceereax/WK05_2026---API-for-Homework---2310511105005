const http = require('http');
const fs = require('fs').promises;
const path = require('path');
const url = require('url');

// Mongo helper
const mongofunc = require('./mongofunc');

const PORT = process.env.PORT || 9888;

function startServer() {
  const server = http.createServer(onClientRequest);
  server.listen(PORT);
  console.log('The Loop API running on ' + PORT);
}

function onClientRequest(req, resp) {
  resp.writeHead(200, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    resp.end();
    return;
  }

  const parsedUrl = url.parse(req.url, true);
  const pathname = parsedUrl.pathname;
  const query = parsedUrl.query;

  // ---------------- SHOP API ----------------
  if (req.method === 'GET' && pathname === '/api/shop') {
    fs.readFile(path.join(process.cwd(), 'data/shop.json'), 'utf8')
      .then(data => resp.end(data))
      .catch(() => resp.end(JSON.stringify({ error: 'Shop not found' })));
    return;
  }

  // ---------------- STATS API ----------------
  if (req.method === 'GET' && pathname === '/api/stats') {
    fs.readFile(path.join(process.cwd(), 'data/stats.json'), 'utf8')
      .then(data => resp.end(data))
      .catch(() => resp.end(JSON.stringify({ error: 'Stats not found' })));
    return;
  }

  // --------- CREATE TEST PLAYER (one-time) ----------
  if (req.method === 'GET' && pathname === '/api/create-test-player') {
    const testPlayer = {
      playerId: 'player-001',
      username: 'TestPlayer',
      coins: 100,
      // no inventory, just currently equipped skin
      equippedSkin: 'skin_white',
      stats: {
        gamesPlayed: 0,
        highScore: 0
      },
      createdAt: new Date()
    };

    (async () => {
      try {
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

  // ---------------- PLAYER API ----------------
  // GET /api/player?playerId=player-001
  if (req.method === 'GET' && pathname === '/api/player') {
    const playerId = query.playerId;

    if (!playerId) {
      resp.end(JSON.stringify({ error: 'playerId is required' }));
      return;
    }

    (async () => {
      try {
        const player = await mongofunc.findOne('theloop', 'players', { playerId: playerId });

        if (!player) {
          resp.end(JSON.stringify({ error: 'Player not found' }));
          return;
        }

        resp.end(JSON.stringify({
          success: true,
          player: player
        }));
      } catch (err) {
        console.error('Failed to get player via mongofunc:', err);
        resp.end(JSON.stringify({ error: 'Failed to get player' }));
      }
    })();

    return;
  }

  // --------------- EQUIP SKIN API ----------------
  // POST /api/equip-skin  body: { "playerId": "player-001", "skinId": "skin_white" }
  if (req.method === 'POST' && pathname === '/api/equip-skin') {
    let body = '';

    req.on('data', chunk => {
      body += chunk.toString();
    });

    req.on('end', async () => {
      try {
        const data = JSON.parse(body);
        const playerId = data.playerId;
        const skinId = data.skinId;

        if (!playerId || !skinId) {
          resp.end(JSON.stringify({ error: 'playerId and skinId are required' }));
          return;
        }

        const result = await mongofunc.updateOne(
          'theloop',
          'players',
          { playerId: playerId },
          { $set: { equippedSkin: skinId, updatedAt: new Date() } }
        );

        resp.end(JSON.stringify({
          success: true,
          playerId: playerId,
          equippedSkin: skinId,
          modifiedCount: result.modifiedCount || 0,
          message: `Equipped ${skinId}`
        }));
      } catch (err) {
        console.error('Failed to equip skin via mongofunc:', err);
        resp.end(JSON.stringify({ error: 'Failed to equip skin' }));
      }
    });

    return;
  }

  // ---------------- GACHA API ----------------
  // GET or POST /api/gacha?playerId=player-001
  if ((req.method === 'POST' || req.method === 'GET') && pathname === '/api/gacha') {
    const playerId = query.playerId || null;

    fs.readFile(path.join(process.cwd(), 'data/shop.json'), 'utf8')
      .then(async shopData => {
        const shop = JSON.parse(shopData);

        // rarity selection: 70% common, 20% rare, 10% epic
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
          await mongofunc.insert('theloop', 'gacha_logs', result);
        } catch (err) {
          console.error('Failed to log gacha to MongoDB via mongofunc:', err);
          // still respond success
        }

        resp.end(JSON.stringify(result));
      })
      .catch(() => resp.end(JSON.stringify({ error: 'Gacha failed' })));

    return;
  }

  // ---------------- DEFAULT ----------------
  resp.end(JSON.stringify({
    message: 'The Loop Snake Game API - 2310511105005',
    info: [
      'SHOP:    GET /api/shop',
      'STATS:   GET /api/stats',
      'GACHA:   GET or POST /api/gacha?playerId=player-001',
      'PLAYER:  GET /api/player?playerId=player-001',
      'CREATE:  GET /api/create-test-player',
      'EQUIP:   POST /api/equip-skin  (JSON: { "playerId": "...", "skinId": "..." })'
    ]
  }));
}

startServer();