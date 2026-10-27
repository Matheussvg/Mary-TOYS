/* HUD: área atual, minimapa com a planta e lista de áreas para teletransporte. */
(function () {
  const MT = (window.MT = window.MT || {});

  const BOUNDS = { x1: -108, x2: 82, z1: -124, z2: 24 };

  MT.HUD = class {
    constructor(player) {
      this.player = player;
      this.el = {
        area: document.getElementById('area-card'),
        chip: document.getElementById('area-dept'),
        name: document.getElementById('area-name'),
        people: document.getElementById('area-people'),
        size: document.getElementById('area-size'),
        map: document.getElementById('minimap'),
        mapWrap: document.getElementById('minimap-wrap'),
        coords: document.getElementById('coords'),
        list: document.getElementById('area-list'),
        toast: document.getElementById('toast'),
      };
      this.lastArea = undefined;
      this.others = null; // jogadores online (MT.Online preenche)
      this.base = this.drawBase();
      this.buildList();
    }

    worldToMap(x, z, W, H) {
      const s = Math.min(W / (BOUNDS.x2 - BOUNDS.x1), H / (BOUNDS.z2 - BOUNDS.z1));
      const ox = (W - (BOUNDS.x2 - BOUNDS.x1) * s) / 2;
      const oz = (H - (BOUNDS.z2 - BOUNDS.z1) * s) / 2;
      return [ox + (x - BOUNDS.x1) * s, oz + (z - BOUNDS.z1) * s, s];
    }

    drawBase() {
      const cv = this.el.map;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      const W = cv.clientWidth || 260, H = cv.clientHeight || 203;
      cv.width = W * dpr;
      cv.height = H * dpr;
      const off = document.createElement('canvas');
      off.width = cv.width;
      off.height = cv.height;
      const g = off.getContext('2d');
      g.scale(dpr, dpr);
      const L = MT.LAYOUT;
      const rect = (x1, x2, z1, z2, fill, stroke) => {
        const [a, b] = this.worldToMap(x1, z1, W, H);
        const [c, d] = this.worldToMap(x2, z2, W, H);
        if (fill) { g.fillStyle = fill; g.fillRect(a, b, c - a, d - b); }
        if (stroke) { g.strokeStyle = stroke; g.strokeRect(a, b, c - a, d - b); }
      };
      g.fillStyle = '#2b3a24';
      g.fillRect(0, 0, W, H);
      // ruas e pátios
      for (const r of [[-200, 200, 11, 19], [63, 73, -120, 11], [-46, 73, -120, -90], [-104, -64, -70, 0]]) rect(...r, '#45423e');
      rect(-200, 200, 8.5, 11, '#77716a');
      rect(-60, 60, -90, 0, '#d9cdb4');
      for (const a of L.areas) {
        const dept = L.departments[a.dept];
        rect(...a.rect, a.minor ? 'rgba(120,110,95,0.55)' : dept.color + 'cc');
      }
      g.lineWidth = 1;
      g.strokeStyle = 'rgba(255,244,220,0.85)';
      const line = (x1, z1, x2, z2) => {
        const [a, b] = this.worldToMap(x1, z1, W, H);
        const [c, d] = this.worldToMap(x2, z2, W, H);
        g.beginPath(); g.moveTo(a, b); g.lineTo(c, d); g.stroke();
      };
      const walls = (spec) => {
        const ops = (spec.openings || []).map((o) => [o.c - o.w / 2, o.c + o.w / 2]).sort((p, q) => p[0] - q[0]);
        let cur = spec.from;
        const seg = (a, b) => (spec.axis === 'x' ? line(a, spec.at, b, spec.at) : line(spec.at, a, spec.at, b));
        for (const [a, b] of ops) { seg(cur, a); cur = b; }
        seg(cur, spec.to);
      };
      L.interior.forEach(walls);
      g.lineWidth = 2;
      g.strokeStyle = '#f4d27a';
      L.perimeter.forEach(walls);
      // entrada
      const [ex, ez] = this.worldToMap(0, 6, W, H);
      g.fillStyle = '#f4d27a';
      g.beginPath(); g.arc(ex, ez, 2.5, 0, Math.PI * 2); g.fill();
      g.font = `600 9px ${MT.FONTS.label}`;
      g.fillStyle = 'rgba(255,244,220,0.9)';
      g.textAlign = 'center';
      g.fillText('ENTRADA', ex, ez + 11);
      const [px, pz] = this.worldToMap(0, -25, W, H);
      g.fillText('PRODUÇÃO', px, pz);
      const [lx, lz] = this.worldToMap(0, -72, W, H);
      g.fillText('LOGÍSTICA', lx, lz);
      return { off, W, H, dpr };
    }

    buildList() {
      const L = MT.LAYOUT;
      const groups = {};
      for (const a of L.areas) {
        if (a.minor) continue;
        (groups[a.dept] = groups[a.dept] || []).push(a);
      }
      const order = ['recepcao', 'producao', 'logistica', 'ti', 'comunicacao'];
      const frag = document.createDocumentFragment();
      for (const d of order) {
        const dept = L.departments[d];
        const sec = document.createElement('section');
        sec.className = 'dept';
        sec.style.setProperty('--dept', dept.color);
        const h = document.createElement('h3');
        h.textContent = dept.name;
        sec.appendChild(h);
        const ul = document.createElement('ul');
        for (const a of groups[d] || []) {
          const li = document.createElement('li');
          const b = document.createElement('button');
          b.type = 'button';
          b.id = 'go-' + a.id;
          const s = MT.areaSize(a);
          b.innerHTML = `<span class="n"></span><span class="m">${MT.fmt(s.m2)} m²</span>`;
          b.querySelector('.n').textContent = a.name;
          b.addEventListener('click', () => this.onTeleport && this.onTeleport(a));
          li.appendChild(b);
          ul.appendChild(li);
        }
        sec.appendChild(ul);
        frag.appendChild(sec);
      }
      this.el.list.appendChild(frag);
    }

    toast(msg) {
      const t = this.el.toast;
      t.textContent = msg;
      t.hidden = false;
      t.classList.remove('show');
      void t.offsetWidth;
      t.classList.add('show');
      clearTimeout(this._tt);
      this._tt = setTimeout(() => { t.hidden = true; }, 2200);
    }

    update() {
      const p = this.player;
      const drone = p.drone.on;
      const a = drone ? null : MT.areaAt(p.pos.x, p.pos.z);
      const key = drone ? 'drone' : a ? a.id : 'fora';
      if (key !== this.lastArea) {
        this.lastArea = key;
        const L = MT.LAYOUT;
        if (drone) {
          this.setCard('Vista aérea', "Mary's Toys", 'Arraste para girar · roda do mouse para zoom · WASD move', '120 × 90 m · 10.800 m²', '#b8862f');
        } else if (a) {
          const dept = L.departments[a.dept];
          const s = MT.areaSize(a);
          this.setCard(dept.name, a.name + (a.sub ? ' – ' + a.sub : ''), a.people || '—', `${MT.fmt(s.w)} × ${MT.fmt(s.d)} m · ${MT.fmt(s.m2)} m²`, dept.color);
        } else {
          this.setCard('Área externa', "Mary's Toys", 'Siga pela escadaria até a entrada principal', 'Fábrica: 120 × 90 m', '#b8862f');
        }
      }

      const { off, W, H, dpr } = this.base;
      const g = this.el.map.getContext('2d');
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.drawImage(off, 0, 0);
      g.scale(dpr, dpr);
      if (this.others) {
        g.fillStyle = '#3ccf6e';
        g.strokeStyle = '#1c1210';
        g.lineWidth = 1.5;
        for (const o of this.others.values()) {
          const [ox, oy] = this.worldToMap(o.cur.x, o.cur.z, W, H);
          g.beginPath(); g.arc(ox, oy, 3.5, 0, Math.PI * 2); g.fill(); g.stroke();
        }
      }
      const at = drone ? p.drone.target : p.pos;
      const [x, y] = this.worldToMap(at.x, at.z, W, H);
      const yaw = drone ? p.drone.theta : p.yaw;
      g.save();
      g.translate(x, y);
      g.rotate(-yaw);
      g.fillStyle = 'rgba(255,240,200,0.18)';
      g.beginPath(); g.moveTo(0, 0); g.arc(0, 0, 22, -Math.PI / 2 - 0.5, -Math.PI / 2 + 0.5); g.closePath(); g.fill();
      g.fillStyle = '#fff4dc';
      g.strokeStyle = '#1c1210';
      g.lineWidth = 1.5;
      g.beginPath(); g.moveTo(0, -7); g.lineTo(5, 5); g.lineTo(0, 2.5); g.lineTo(-5, 5); g.closePath();
      g.fill(); g.stroke();
      g.restore();
      this.el.coords.textContent = `x ${p.pos.x.toFixed(1)}  z ${p.pos.z.toFixed(1)}`;
    }

    setCard(dept, name, people, size, color) {
      this.el.chip.textContent = dept;
      this.el.area.style.setProperty('--dept', color);
      this.el.name.textContent = name;
      this.el.people.textContent = people;
      this.el.size.textContent = size;
      this.el.area.classList.remove('flip');
      void this.el.area.offsetWidth;
      this.el.area.classList.add('flip');
    }
  };
})();
