// Servidor da conferência de pedidos Mery's Toys.
// Serve o simulador 3D da fábrica na raiz, o SAP em /sap/ (é ele que abre nos PCs da TI) e uma API JSON que todas as telas consultam a cada 2,5 s.
// Dados: Postgres quando DATABASE_URL existe (Render); senão, arquivo data.json (para testar no computador).
const http = require('http');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const F = require('./public/flow.js');

const PORT = Number(process.env.PORT) || 3000;
const MASTER_USER = process.env.ADMIN_USER || 'adm';
const MASTER_PASS = process.env.ADMIN_PASS || 'adm';
// Senha para limpar o histórico (aba só do dono do sistema, F.OWNER). Sem RESET_PASS, vale a senha do gerente master.
const RESET_PASS = process.env.RESET_PASS || MASTER_PASS;
// Senha de cada gerente de área: PASS_ADM_TI, PASS_ADM_PRODUCAO, ... ou MANAGER_PASS para todos (padrão "adm")
const managerPass = login => process.env[`PASS_${login.toUpperCase()}`] || process.env.MANAGER_PASS || 'adm';
const SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const MAX_BODY = 256 * 1024;
const COLLECTIONS = ['orders', 'checks'];

// ===== Sessões de gerente (token assinado) =====
const sign = s => crypto.createHmac('sha256', SECRET).update(s).digest('base64url');
const makeToken = session => { const p = Buffer.from(JSON.stringify(session)).toString('base64url'); return `${p}.${sign(p)}`; };
function readToken(req) {
  const h = req.headers.authorization || '';
  const t = h.startsWith('Bearer ') ? h.slice(7) : '';
  const [p, s] = t.split('.');
  if (!p || !s) return null;
  const good = sign(p);
  if (s.length !== good.length || !crypto.timingSafeEqual(Buffer.from(s), Buffer.from(good))) return null;
  try { return JSON.parse(Buffer.from(p, 'base64url').toString('utf8')); } catch { return null; }
}
const same = (a, b) => crypto.timingSafeEqual(crypto.createHash('sha256').update(String(a)).digest(), crypto.createHash('sha256').update(String(b)).digest());
// Gerente de área só mexe nos pedidos criados pela própria área; master mexe em todos
const canEditOrder = (who, order) => who.role === 'master' || (!!order?.createdBy && order.createdBy.role === 'manager' && order.createdBy.area === who.area);

// ===== Armazenamento =====
function pgStore(pool) {
  return {
    async init() {
      await pool.query(`create sequence if not exists docs_seq;
        create table if not exists docs(
          collection text not null, id text not null, data jsonb not null,
          seq bigint not null default nextval('docs_seq'), primary key(collection, id))`);
    },
    async rev() { return (await pool.query('select coalesce(max(seq),0)::text as r from docs')).rows[0].r; },
    async clear() { await pool.query('delete from docs'); },
    async all() { return (await pool.query('select collection, id, data from docs order by seq')).rows; },
    async get(c, id) { return (await pool.query('select data from docs where collection=$1 and id=$2', [c, id])).rows[0]?.data || null; },
    async create(c, id, data) {
      return (await pool.query('insert into docs(collection,id,data) values($1,$2,$3) on conflict do nothing returning id', [c, id, data])).rowCount === 1;
    },
    // Lê e grava o documento numa transação travada: duas decisões ao mesmo tempo nunca se misturam
    async mutate(c, id, fn) {
      const cl = await pool.connect();
      try {
        await cl.query('begin');
        const r = await cl.query('select data from docs where collection=$1 and id=$2 for update', [c, id]);
        const out = fn(r.rows[0]?.data || null);
        if (out.write) {
          await cl.query(`insert into docs(collection,id,data) values($1,$2,$3)
            on conflict (collection,id) do update set data=excluded.data, seq=nextval('docs_seq')`, [c, id, out.write]);
        }
        await cl.query('commit');
        return out;
      } catch (e) { await cl.query('rollback').catch(() => {}); throw e; } finally { cl.release(); }
    },
  };
}

function fileStore(file) {
  let db = { seq: 0, docs: {} };
  try { db = JSON.parse(fs.readFileSync(file, 'utf8')); } catch {}
  const key = (c, id) => `${c}/${id}`;
  const save = () => fs.writeFileSync(file, JSON.stringify(db));
  return {
    async init() {},
    async rev() { return String(db.seq); },
    async clear() { db = { seq: db.seq + 1, docs: {} }; save(); },
    async all() { return Object.values(db.docs); },
    async get(c, id) { return db.docs[key(c, id)]?.data || null; },
    async create(c, id, data) { if (db.docs[key(c, id)]) return false; db.docs[key(c, id)] = { collection: c, id, data, seq: ++db.seq }; save(); return true; },
    async mutate(c, id, fn) {
      const out = fn(db.docs[key(c, id)]?.data || null);
      if (out.write) { db.docs[key(c, id)] = { collection: c, id, data: out.write, seq: ++db.seq }; save(); }
      return out;
    },
  };
}

let store;
if (process.env.DATABASE_URL) {
  const { Pool } = require('pg');
  store = pgStore(new Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.PGSSL === 'require' ? { rejectUnauthorized: false } : false }));
} else {
  store = fileStore(path.join(__dirname, 'data.json'));
}

// ===== Página =====
const pub = f => path.join(__dirname, 'public', f);
// O index.html é o mesmo arquivo publicado no claude.ai (sem <html>/<head>); aqui ele ganha o esqueleto e o endereço da API.
// O <!doctype html> do topo serve para quando o arquivo é aberto direto (simulador sem servidor) e sai daqui.
const page = () => `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#173c32"><script>window.MT_API="/api"</script></head><body>${fs.readFileSync(pub('index.html'), 'utf8').replace(/^<!doctype html>\s*/i, '')}</body></html>`;

// ===== Simulador 3D =====
// A pasta da fábrica fica ao lado de sap/. O index.html dela recebe o endereço do SAP que os PCs da TI abrem.
const SIM_DIR = path.join(__dirname, '..', 'fabrica-marys-toys-3d');
// Com SAP_URL (ex.: o SAP online no Render), este servidor só publica o simulador: /sap leva para lá e a API fica desligada
const SAP_URL = process.env.SAP_URL || '';
const HAS_SIM = fs.existsSync(path.join(SIM_DIR, 'index.html'));
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.glb': 'model/gltf-binary',
  '.gltf': 'model/gltf+json', '.bin': 'application/octet-stream', '.woff2': 'font/woff2',
};
async function sendSim(res, pathname) {
  if (pathname === '/' || pathname === '/index.html') {
    const html = fs.readFileSync(path.join(SIM_DIR, 'index.html'), 'utf8').replace('</head>', `<script>window.MT_SAP_URL=${JSON.stringify(SAP_URL || '/sap/')}</script>\n</head>`);
    return send(res, 200, html, 'text/html; charset=utf-8');
  }
  const file = path.resolve(SIM_DIR, '.' + decodeURIComponent(pathname));
  const type = TYPES[path.extname(file).toLowerCase()];
  if (!type || !file.startsWith(SIM_DIR + path.sep)) return send(res, 404, 'Página não encontrada', 'text/plain; charset=utf-8');
  let body;
  try { body = await fs.promises.readFile(file); } catch { return send(res, 404, 'Página não encontrada', 'text/plain; charset=utf-8'); }
  res.writeHead(200, { 'content-type': type, 'cache-control': 'public, max-age=300', 'x-content-type-options': 'nosniff' });
  res.end(body);
}

// ===== HTTP =====
const send = (res, status, body, type = 'application/json; charset=utf-8') => {
  res.writeHead(status, { 'content-type': type, 'cache-control': 'no-store', 'x-content-type-options': 'nosniff' });
  res.end(type.startsWith('application/json') ? JSON.stringify(body) : body);
};
const readJson = req => new Promise((resolve, reject) => {
  let size = 0; const chunks = [];
  req.on('data', c => { size += c.length; if (size > MAX_BODY) { reject(Object.assign(new Error('Pedido grande demais'), { status: 413 })); req.destroy(); } else chunks.push(c); });
  req.on('end', () => { try { resolve(chunks.length ? JSON.parse(Buffer.concat(chunks).toString('utf8')) : {}); } catch { reject(Object.assign(new Error('JSON inválido'), { status: 400 })); } });
  req.on('error', reject);
});
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
const ID_RE = { orders: /^OC-\d{4}-\d{4}$/, checks: /^c\d{10,16}$/ };
const text = (v, max) => typeof v === 'string' && v.trim().length > 0 && v.length <= max;

async function handle(req, res) {
  const url = new URL(req.url, 'http://localhost');
  const parts = url.pathname.split('/').filter(Boolean).map(decodeURIComponent);

  if (req.method === 'GET' && url.pathname === '/healthz') return send(res, 200, { ok: true });
  // SAP em /sap/; sem o simulador ao lado, continua também na raiz
  if (SAP_URL && (url.pathname === '/sap' || url.pathname.startsWith('/sap/'))) { res.writeHead(302, { location: SAP_URL }); return res.end(); }
  if (SAP_URL && parts[0] === 'api') return send(res, 404, { error: `O SAP fica em ${SAP_URL}` });
  if (req.method === 'GET' && url.pathname === '/sap') { res.writeHead(301, { location: '/sap/' }); return res.end(); }
  const sapPath = url.pathname.startsWith('/sap/') ? url.pathname.slice(4) : HAS_SIM ? null : url.pathname;
  if (req.method === 'GET' && (sapPath === '/' || sapPath === '/index.html')) return send(res, 200, page(), 'text/html; charset=utf-8');
  if (req.method === 'GET' && sapPath === '/flow.js') return send(res, 200, fs.readFileSync(pub('flow.js'), 'utf8'), 'text/javascript; charset=utf-8');
  if (req.method === 'GET' && HAS_SIM && parts[0] !== 'api') return sendSim(res, url.pathname);
  if (parts[0] !== 'api') return send(res, 404, 'Página não encontrada', 'text/plain; charset=utf-8');
  const [, a, b, c] = parts;

  // Estado completo; "unchanged" quando nada mudou desde a última consulta
  if (req.method === 'GET' && a === 'state') {
    const rev = await store.rev();
    if (url.searchParams.get('rev') === rev) return send(res, 200, { rev, unchanged: true });
    const out = { rev, orders: [], checks: [] };
    for (const row of await store.all()) if (out[row.collection]) out[row.collection].push({ id: row.id, ...row.data });
    return send(res, 200, out);
  }
  if (req.method === 'GET' && a === 'doc' && COLLECTIONS.includes(b) && c) return send(res, 200, { data: await store.get(b, c) });

  // Login de gerente: "adm" (master, escolhe o nome) ou "adm_<área>"
  if (req.method === 'POST' && a === 'login') {
    const { user, pass, name } = await readJson(req);
    const u = String(user || '').trim().toLowerCase();
    if (same(u, MASTER_USER) && same(pass, MASTER_PASS)) {
      if (!F.MASTERS.includes(name)) return send(res, 400, { error: 'Escolha qual gerente master você é' });
      const session = { role: 'master', name, area: null };
      return send(res, 200, { token: makeToken(session), session });
    }
    const area = Object.keys(F.AREAS).find(k => F.AREAS[k].login === u);
    if (area && same(pass, managerPass(u))) {
      const session = { role: 'manager', area, name: F.AREAS[area].manager.name };
      return send(res, 200, { token: makeToken(session), session });
    }
    return send(res, 401, { error: 'Usuário ou senha inválidos' });
  }

  // Dono do sistema: apaga todos os pedidos e conferências (aba "Limpar histórico")
  if (req.method === 'POST' && a === 'reset' && !b) {
    const who = readToken(req);
    if (!who || who.role !== 'master' || who.name !== F.OWNER) return send(res, 403, { error: `Só ${F.OWNER} pode limpar o histórico` });
    const { pass } = await readJson(req);
    if (!same(pass, RESET_PASS)) return send(res, 403, { error: 'Senha incorreta' });
    await store.clear();
    console.log(`Histórico limpo por ${who.name}`);
    return send(res, 200, { ok: true });
  }

  // Gerentes: salvar pedido
  if (req.method === 'PUT' && a === 'orders' && b && !c) {
    const who = readToken(req);
    if (!who) return send(res, 401, { error: 'Entre como gerente' });
    if (!ID_RE.orders.test(b)) return send(res, 400, { error: 'Número de pedido inválido' });
    const { data } = await readJson(req);
    if (!isObj(data) || data.no !== b || !isObj(data.header) || !Array.isArray(data.items)) return send(res, 400, { error: 'Pedido inválido' });
    const out = await store.mutate('orders', b, cur => {
      if (cur && !canEditOrder(who, cur)) return { status: 403, body: { error: 'Este pedido pertence a outra área' } };
      const createdBy = cur?.createdBy || { role: who.role, area: who.area || null, name: who.name };
      return { status: 200, body: { ok: true }, write: { ...data, createdBy, updatedAt: new Date().toISOString() } };
    });
    return send(res, out.status, out.body);
  }

  // Gerentes: enviar pedido para conferência (o servidor monta as etapas do fluxo)
  if (req.method === 'POST' && a === 'checks' && b && !c) {
    const who = readToken(req);
    if (!who) return send(res, 401, { error: 'Entre como gerente' });
    if (!ID_RE.checks.test(b)) return send(res, 400, { error: 'Identificador inválido' });
    const { data } = await readJson(req);
    if (!isObj(data) || !ID_RE.orders.test(data.orderNo) || !isObj(data.nf) || !isObj(data.rec)) return send(res, 400, { error: 'Conferência inválida' });
    const order = await store.get('orders', data.orderNo);
    if (!order) return send(res, 400, { error: 'Salve o pedido antes de enviar' });
    if (!canEditOrder(who, order)) return send(res, 403, { error: 'Este pedido pertence a outra área' });
    const at = new Date().toISOString();
    const doc = {
      orderNo: data.orderNo, nf: data.nf, rec: data.rec, tamper: typeof data.tamper === 'string' ? data.tamper : null, round: Number(data.round) || 0,
      stages: F.buildStages(F.startAreaFor(order.createdBy)), stageIdx: 0, status: 'pending', history: [],
      sentAt: at, stageSince: at, sentBy: { role: who.role, area: who.area || null, name: who.name },
    };
    if (!(await store.create('checks', b, doc))) return send(res, 409, { error: 'Já existe' });
    return send(res, 200, { ok: true });
  }

  // Colaboradores: aprovar ou rejeitar a etapa atual
  if (req.method === 'POST' && a === 'checks' && b && c === 'decide') {
    const body = await readJson(req);
    if (!['done', 'adjust'].includes(body.decision)) return send(res, 400, { error: 'Decisão inválida' });
    const area = String(body.area || '');
    if (!F.AREAS[area] || !F.AREAS[area].members.some(m => m.name === body.name)) return send(res, 400, { error: 'Colaborador não encontrado nesta área' });
    if (body.decision === 'adjust' && (!text(body.reason, 1000) || body.reason.trim().length < 5)) return send(res, 400, { error: 'Informe o motivo' });
    const out = await store.mutate('checks', b, cur => {
      if (!cur) return { status: 404, body: { ok: false, error: 'Pedido não encontrado' } };
      if (cur.status !== 'pending' || cur.stageIdx !== body.stageIdx) return { status: 409, body: { ok: false, current: cur } };
      if (!F.canApprove(cur.stages[cur.stageIdx], body.name, area)) return { status: 403, body: { ok: false, current: cur, error: 'Esta etapa não é sua' } };
      const next = F.decide(cur, { decision: body.decision, name: body.name, reason: String(body.reason || '').trim(), at: new Date().toISOString() });
      return { status: 200, body: { ok: true, current: next }, write: next };
    });
    return send(res, out.status, out.body);
  }

  return send(res, 404, { error: 'Rota não encontrada' });
}

store.init().then(() => {
  http.createServer((req, res) => {
    handle(req, res).catch(e => {
      console.error(e);
      if (!res.headersSent) send(res, e.status || 500, { error: e.status ? e.message : 'Erro no servidor' });
    });
  }).listen(PORT, () => console.log(`Mery's Toys conferência rodando na porta ${PORT} (${process.env.DATABASE_URL ? 'Postgres' : 'data.json'})${HAS_SIM ? ' · simulador em / e SAP em /sap/' : ''}`));
}).catch(e => { console.error('Falha ao preparar o banco:', e); process.exit(1); });
