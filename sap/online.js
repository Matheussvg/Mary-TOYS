// Jogadores online no simulador: WebSocket em /online.
// Cada jogador manda o nome ("hello") e a posição ("pos"); 10 vezes por segundo o servidor manda para todos
// a lista de quem está na fábrica ("state"). Fica tudo na memória: quem fecha a página some para os outros.
const { WebSocketServer } = require('ws');

const MAX_PLAYERS = 60;
const TICK_MS = 100;
const TIMEOUT_MS = 30000; // sem notícias por 30 s, o jogador sai
const LIMIT = 500; // coordenadas aceitas (metros)

const num = (v, lo, hi) => (Number.isFinite(v) ? Math.round(Math.min(hi, Math.max(lo, v)) * 100) / 100 : null);
const cleanName = (v) => String(v || '').replace(/[\u0000-\u001f\u007f]/g, '').replace(/\s+/g, ' ').trim().slice(0, 20);

function cleanState(m) {
  const s = { x: num(m.x, -LIMIT, LIMIT), y: num(m.y, -10, 60), z: num(m.z, -LIMIT, LIMIT), yaw: num(m.yaw, -1e4, 1e4), pitch: num(m.pitch, -2, 2) };
  if (Object.values(s).some((v) => v === null)) return null;
  s.c = num(m.c, 0, 1) || 0; // agachado
  s.g = m.g ? 1 : 0; // no chão
  return s;
}

exports.attach = function (server) {
  const wss = new WebSocketServer({ server, path: '/online', maxPayload: 2048 });
  const players = new Map();
  let next = 1;

  wss.on('connection', (ws) => {
    if (players.size >= MAX_PLAYERS) { ws.close(1013, 'Fábrica cheia'); return; }
    const p = { id: String(next++), name: '', s: null, ws, seen: Date.now() };
    players.set(p.id, p);
    ws.send(JSON.stringify({ t: 'welcome', id: p.id }));
    ws.on('message', (data) => {
      let m;
      try { m = JSON.parse(data); } catch { return; }
      p.seen = Date.now();
      if (m.t === 'hello') p.name = cleanName(m.name);
      else if (m.t === 'pos') p.s = cleanState(m) || p.s;
    });
    ws.on('close', () => players.delete(p.id));
    ws.on('error', () => players.delete(p.id));
  });

  setInterval(() => {
    const now = Date.now();
    for (const p of players.values()) {
      if (now - p.seen > TIMEOUT_MS) { p.ws.terminate(); players.delete(p.id); }
    }
    const list = [];
    for (const p of players.values()) if (p.name && p.s) list.push({ id: p.id, n: p.name, ...p.s });
    const msg = JSON.stringify({ t: 'state', p: list });
    for (const p of players.values()) if (p.ws.readyState === 1) p.ws.send(msg);
  }, TICK_MS);

  // ping de tempos em tempos para a conexão não cair por inatividade no proxy do Render
  setInterval(() => { for (const p of players.values()) if (p.ws.readyState === 1) p.ws.ping(); }, 25000);
  return wss;
};
