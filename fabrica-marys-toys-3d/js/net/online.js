/*
 * Jogadores online: cada pessoa que entra no simulador aparece para as outras, com o personagem e o nome
 * acima da cabeça. Conversa por WebSocket com <servidor>/online (sap/online.js): manda a própria posição
 * 10 vezes por segundo e recebe a de todos. Os outros personagens andam suavizados entre uma notícia e outra.
 */
(function () {
  const MT = (window.MT = window.MT || {});

  const SEND_MS = 100;
  const IDLE_MS = 1000; // parado, a posição é reenviada só uma vez por segundo (mantém a presença)

  MT.Online = class {
    constructor(scene, player, hud) {
      this.scene = scene;
      this.player = player;
      this.hud = hud;
      this.ws = null;
      this.id = null;
      this.name = '';
      this.others = new Map(); // id → { avatar, cur, target, speed }
      this.far = false;
      this.retry = 0;
      this.last = '';
      this.lastTime = 0;
      this.el = document.getElementById('online');
      hud.others = this.others;
      const base = window.MT_ONLINE ? location.origin : (MT.ONLINE && MT.ONLINE.servidor) || '';
      this.url = /^https?:/.test(base) ? base.replace(/^http/, 'ws').replace(/\/$/, '') + '/online' : '';
      setInterval(() => this.send(), SEND_MS);
    }

    // Entra (ou troca de nome) depois que a pessoa digita o nome no menu
    start(name) {
      this.name = name;
      if (this.ws) this.raw({ t: 'hello', name });
      else if (!this.timer) this.connect();
    }

    connect() {
      this.timer = null;
      if (!this.url) return;
      this.show('Conectando…', '');
      let ws;
      try { ws = new WebSocket(this.url); } catch (_) { this.again(); return; }
      this.ws = ws;
      ws.onopen = () => {
        this.retry = 0;
        this.last = '';
        this.raw({ t: 'hello', name: this.name });
      };
      ws.onmessage = (e) => this.receive(e.data);
      ws.onclose = () => {
        this.ws = null;
        this.id = null;
        this.joined = false;
        for (const id of [...this.others.keys()]) this.remove(id);
        this.again();
      };
    }

    // tenta de novo (o servidor gratuito do Render pode levar até 1 minuto para acordar)
    again() {
      this.show('Sem conexão · tentando de novo…', 'off');
      this.timer = setTimeout(() => this.connect(), Math.min(15000, 2000 * ++this.retry));
    }

    raw(m) {
      if (this.ws && this.ws.readyState === 1) this.ws.send(JSON.stringify(m));
    }

    send() {
      if (!this.ws || this.ws.readyState !== 1 || !this.name) return;
      const p = this.player, r = (v) => Math.round(v * 100) / 100;
      const msg = JSON.stringify({ t: 'pos', x: r(p.pos.x), y: r(p.pos.y), z: r(p.pos.z), yaw: r(p.yaw), pitch: r(p.pitch), c: r(p.crouchAmount()), g: p.onGround ? 1 : 0 });
      if (msg === this.last && Date.now() - this.lastTime < IDLE_MS) return;
      this.last = msg;
      this.lastTime = Date.now();
      this.ws.send(msg);
    }

    receive(data) {
      let m;
      try { m = JSON.parse(data); } catch (_) { return; }
      if (m.t === 'welcome') { this.id = m.id; return; }
      if (m.t !== 'state' || !Array.isArray(m.p)) return;
      const seen = new Set();
      for (const s of m.p) {
        if (s.id === this.id) continue;
        seen.add(s.id);
        let o = this.others.get(s.id);
        if (!o) {
          o = { avatar: new MT.Avatar(s.n), cur: { x: s.x, y: s.y, z: s.z, yaw: s.yaw, pitch: s.pitch }, target: s, speed: 0 };
          o.avatar.setFar(this.far);
          this.scene.add(o.avatar.group);
          this.others.set(s.id, o);
          if (this.joined) this.hud.toast(s.n + ' entrou na fábrica');
        }
        o.avatar.setName(s.n);
        o.target = s;
      }
      for (const [id, o] of this.others) {
        if (seen.has(id)) continue;
        this.hud.toast(o.avatar.name + ' saiu');
        this.remove(id);
      }
      this.joined = true; // da segunda lista em diante, avisa quem entra
      const n = this.others.size + 1;
      const names = [this.name, ...[...this.others.values()].map((o) => o.avatar.name)];
      this.show(n === 1 ? 'Só você online' : `${n} jogadores online`, 'on', names.join('\n'));
    }

    remove(id) {
      const o = this.others.get(id);
      if (!o) return;
      this.scene.remove(o.avatar.group);
      o.avatar.dispose();
      this.others.delete(id);
    }

    // Vista aérea: nomes legíveis de longe
    setFar(on) {
      this.far = on;
      for (const o of this.others.values()) o.avatar.setFar(on);
    }

    update(dt, t) {
      const k = 1 - Math.exp(-12 * dt); // segue a posição recebida em ~0,1 s
      for (const o of this.others.values()) {
        const c = o.cur, s = o.target;
        const px = c.x, pz = c.z;
        if (Math.hypot(s.x - c.x, s.z - c.z) > 8) Object.assign(c, { x: s.x, y: s.y, z: s.z }); // teleporte
        else {
          c.x += (s.x - c.x) * k;
          c.y += (s.y - c.y) * k;
          c.z += (s.z - c.z) * k;
        }
        const dyaw = Math.atan2(Math.sin(s.yaw - c.yaw), Math.cos(s.yaw - c.yaw));
        c.yaw += dyaw * k;
        c.pitch += (s.pitch - c.pitch) * k;
        // velocidade pelo deslocamento suavizado: dá o balanço de braços e pernas
        const v = dt > 0 ? Math.hypot(c.x - px, c.z - pz) / dt : 0;
        o.speed += (v - o.speed) * Math.min(1, dt * 8);
        o.avatar.update(dt, t, { x: c.x, y: c.y, z: c.z, yaw: c.yaw, pitch: c.pitch, speed: o.speed, onGround: s.g !== 0, crouch: s.c || 0 });
        // some quando a câmera fica dentro dele (dois jogadores no mesmo lugar)
        const cam = this.player.camera.position;
        o.avatar.group.visible = !(Math.hypot(cam.x - c.x, cam.z - c.z) < 0.4 && cam.y > c.y && cam.y < c.y + 2);
      }
    }

    show(text, state, title) {
      if (!this.el) return;
      this.el.hidden = false;
      this.el.className = 'hud-panel ' + state;
      this.el.querySelector('span').textContent = text;
      this.el.title = title || '';
    }
  };
})();
