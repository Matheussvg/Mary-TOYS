/* Imagens das telas da TI (canvas): SAP, código, design, CAD, PCP, chamados, painéis e quadros. */
(function () {
  const MT = (window.MT = window.MT || {});

  // Paleta do SAP da Mery's Toys (a mesma de sap/public/index.html)
  const SAP = { green: '#173c32', green2: '#245849', dark: '#0f2a22', gold: '#bd9351', gold2: '#e2c784', cream: '#faf6ec', bg: '#f6f7f4', red: '#b6504b', ok: '#3b8b62', ink: '#24332e', muted: '#6f7c75', line: '#cfd8d1' };

  // Aleatório com semente: a mesma tela sai sempre igual
  const seeded = (s) => () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;

  // Tamanho do canvas: telas 16:9; quadros de parede mais largos
  const SIZE = { sap: [1024, 576], kanban: [1024, 440], moodboard: [1024, 440], plan: [1024, 440] };
  const cache = new Map();
  MT.screenTexture = function (kind, variant = 0) {
    const key = kind + ':' + variant;
    if (!cache.has(key)) {
      const draw = DRAW[kind] || DRAW.sap;
      const [w, h] = SIZE[kind] || [640, 360];
      cache.set(key, MT.canvasTexture(w, h, (g, cw, ch) => draw(g, cw, ch, seeded(17 + variant * 7919))));
    }
    return cache.get(key);
  };

  const R = MT.roundRect;
  const font = (g, weight, px, fam) => { g.font = `${weight} ${Math.round(px)}px ${MT.FONTS[fam || 'body']}`; };

  function brand(g, x, y, px, light) {
    font(g, 700, px, 'label');
    g.textBaseline = 'middle';
    g.fillStyle = SAP.gold2;
    g.fillText('✦', x, y);
    g.fillStyle = light ? '#fff' : SAP.green;
    g.fillText("Mery's Toys", x + px * 0.95, y);
  }

  const DRAW = {
    // Launchpad do SAP: é o que aparece quando você mira num PC
    sap(g, w, h) {
      g.fillStyle = SAP.bg;
      g.fillRect(0, 0, w, h);
      g.fillStyle = SAP.dark;
      g.fillRect(0, 0, w, 52);
      brand(g, 24, 27, 26, true);
      font(g, 600, 17, 'label');
      g.textAlign = 'right';
      g.fillStyle = '#c9d8d0';
      g.fillText('SAP S/4 · mts-s4p (100)', w - 24, 27);
      g.textAlign = 'left';
      const band = g.createLinearGradient(0, 52, 0, 160);
      band.addColorStop(0, SAP.green);
      band.addColorStop(1, SAP.green2);
      g.fillStyle = band;
      g.fillRect(0, 52, w, 108);
      font(g, 700, 34, 'label');
      g.fillStyle = '#fff';
      g.fillText('Pedidos e conferência por área', 32, 96);
      font(g, 500, 18);
      g.fillStyle = '#c0d0c7';
      g.fillText('TI → Produção → PCP → Comunicação → Logística', 32, 132);
      g.fillStyle = SAP.red;
      g.fillRect(0, 160, w, 4);

      const tiles = [
        ['ME22N', 'Modificar pedido', '12', SAP.green],
        ['Conferência', 'Pedidos na sua etapa', '3', SAP.gold],
        ['Fluxo de áreas', 'Onde cada pedido está', '5', SAP.green2],
        ['Resultados', 'Conferências corretas', '92%', SAP.ok],
      ];
      const tw = (w - 32 * 2 - 18 * 3) / 4, th = 190, ty = 200;
      tiles.forEach(([t, s, n, c], i) => {
        const x = 32 + i * (tw + 18);
        g.fillStyle = '#fff';
        R(g, x, ty, tw, th, 12);
        g.fill();
        g.strokeStyle = SAP.line;
        g.lineWidth = 1.5;
        g.stroke();
        g.fillStyle = c;
        R(g, x, ty, tw, 8, 4);
        g.fill();
        font(g, 700, 26, 'label');
        g.fillStyle = SAP.ink;
        g.fillText(t, x + 18, ty + 46);
        font(g, 500, 16);
        g.fillStyle = SAP.muted;
        g.fillText(s, x + 18, ty + 76);
        font(g, 700, 54, 'label');
        g.fillStyle = c;
        g.fillText(n, x + 18, ty + th - 42);
      });

      g.fillStyle = SAP.green;
      R(g, w / 2 - 190, 440, 380, 64, 32);
      g.fill();
      font(g, 700, 26, 'label');
      g.textAlign = 'center';
      g.fillStyle = '#fff';
      g.fillText('CLIQUE NA TELA PARA ENTRAR', w / 2, 473);
      g.textAlign = 'left';
      font(g, 500, 15);
      g.fillStyle = SAP.muted;
      g.fillText('Temporada de boas ideias', 32, h - 24);
    },

    code(g, w, h, rnd) {
      g.fillStyle = '#1d1f24';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#16181c';
      g.fillRect(0, 0, 120, h);
      g.fillStyle = '#2a2d34';
      g.fillRect(0, 0, w, 26);
      const files = ['server.js', 'flow.js', 'index.html', 'pedidos.sql'];
      font(g, 500, 12);
      g.textBaseline = 'middle';
      files.forEach((f, i) => {
        g.fillStyle = i === 0 ? '#1d1f24' : '#2a2d34';
        g.fillRect(120 + i * 96, 0, 94, 26);
        g.fillStyle = i === 0 ? '#e8e8e8' : '#8c919b';
        g.fillText(f, 130 + i * 96, 13);
      });
      ['src', '  api', '  public', '  sap', 'test', 'README.md'].forEach((f, i) => {
        g.fillStyle = '#9aa0aa';
        g.fillText(f, 12, 44 + i * 20);
      });
      const colors = ['#c678dd', '#61afef', '#98c379', '#e5c07b', '#abb2bf', '#56b6c2', '#e06c75'];
      for (let i = 0, y = 40; y < h - 10; i++, y += 15) {
        g.fillStyle = '#4b5263';
        g.fillText(String(i + 1).padStart(3, ' '), 128, y);
        let x = 160 + Math.floor(rnd() * 4) * 18;
        const n = 1 + Math.floor(rnd() * 5);
        for (let k = 0; k < n && x < w - 30; k++) {
          const len = 20 + rnd() * 90;
          g.fillStyle = colors[Math.floor(rnd() * colors.length)];
          g.fillRect(x, y - 4, len, 8);
          x += len + 8;
        }
      }
      g.fillStyle = '#528bff';
      g.fillRect(0, h - 18, w, 18);
    },

    design(g, w, h, rnd) {
      g.fillStyle = '#2c2e33';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#3a3d44';
      g.fillRect(0, 0, w, 24);
      g.fillRect(0, 24, 44, h);
      g.fillRect(w - 130, 24, 130, h);
      for (let i = 0; i < 8; i++) {
        g.fillStyle = '#5a5e68';
        R(g, 10, 36 + i * 34, 24, 24, 5);
        g.fill();
      }
      // prancheta com o desenho de um brinquedo
      const ax = 60, ay = 38, aw = w - 206, ah = h - 56;
      g.fillStyle = '#fbf8f1';
      g.fillRect(ax, ay, aw, ah);
      const cx = ax + aw / 2, cy = ay + ah / 2 + 10;
      g.fillStyle = '#c0161d';
      R(g, cx - 70, cy - 20, 140, 90, 10);
      g.fill();
      g.fillStyle = '#f4c51c';
      g.beginPath(); g.arc(cx, cy - 58, 40, 0, Math.PI * 2); g.fill();
      g.fillStyle = '#1d1a16';
      g.beginPath(); g.arc(cx - 13, cy - 64, 5, 0, Math.PI * 2); g.arc(cx + 13, cy - 64, 5, 0, Math.PI * 2); g.fill();
      g.strokeStyle = '#1d1a16';
      g.lineWidth = 3;
      g.beginPath(); g.arc(cx, cy - 56, 18, 0.2, Math.PI - 0.2); g.stroke();
      g.strokeStyle = '#2a7de1';
      g.setLineDash([6, 5]);
      g.strokeRect(cx - 92, cy - 112, 184, 210);
      g.setLineDash([]);
      // paleta de cores
      const sw = ['#a3161c', '#d9a441', '#f4c51c', '#2a4b9b', '#1f6b3a', '#f4ead2', '#8e1b2a', '#56b6c2'];
      sw.forEach((c, i) => {
        g.fillStyle = c;
        R(g, w - 118 + (i % 2) * 56, 40 + Math.floor(i / 2) * 46, 48, 38, 6);
        g.fill();
      });
      g.fillStyle = '#5a5e68';
      for (let i = 0; i < 5; i++) g.fillRect(w - 118, 240 + i * 20, 60 + rnd() * 44, 8);
    },

    cad(g, w, h, rnd) {
      const bg = g.createLinearGradient(0, 0, 0, h);
      bg.addColorStop(0, '#3d4450');
      bg.addColorStop(1, '#1f232a');
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#2a2f37';
      g.fillRect(0, 0, w, 24);
      g.fillRect(0, 24, 40, h);
      for (let i = 0; i < 9; i++) {
        g.fillStyle = i === 2 ? '#e8a33a' : '#5d6470';
        g.fillRect(10, 34 + i * 30, 20, 20);
      }
      // grade do piso em perspectiva
      const hx = w / 2 + 20, hy = h * 0.42;
      g.strokeStyle = 'rgba(160,175,195,0.25)';
      g.lineWidth = 1;
      for (let i = -12; i <= 12; i++) {
        g.beginPath(); g.moveTo(hx + i * 12, hy); g.lineTo(hx + i * 70, h); g.stroke();
      }
      for (let k = 0; k < 9; k++) {
        const y = hy + (h - hy) * Math.pow(k / 8, 1.8);
        g.beginPath(); g.moveTo(40, y); g.lineTo(w, y); g.stroke();
      }
      // peça de montar em arame (isométrica)
      const iso = (x, y, z) => [hx + (x - z) * 0.87, h * 0.62 + (x + z) * 0.5 - y];
      const box = (x, y, z, a, b, c, col) => {
        const P = [[0, 0, 0], [a, 0, 0], [a, 0, c], [0, 0, c], [0, b, 0], [a, b, 0], [a, b, c], [0, b, c]].map(([u, v, t]) => iso(x + u, y + v, z + t));
        g.strokeStyle = col;
        g.lineWidth = 2;
        for (const [i, j] of [[0, 1], [1, 2], [2, 3], [3, 0], [4, 5], [5, 6], [6, 7], [7, 4], [0, 4], [1, 5], [2, 6], [3, 7]]) {
          g.beginPath(); g.moveTo(...P[i]); g.lineTo(...P[j]); g.stroke();
        }
      };
      box(-80, 0, -40, 160, 60, 80, '#e8a33a');
      for (let i = 0; i < 4; i++) for (let k = 0; k < 2; k++) box(-70 + i * 40, 60, -30 + k * 40, 20, 14, 20, '#ffd27a');
      g.fillStyle = '#2a2f37';
      g.fillRect(w - 150, 24, 150, h);
      font(g, 500, 12);
      g.textBaseline = 'middle';
      ['Peça 2×4', 'Extrusão', 'Filete 0,5', 'Pinos ×8', 'Molde'].forEach((t, i) => {
        g.fillStyle = i === 3 ? '#e8a33a' : '#aab2bf';
        g.fillText(t, w - 138, 46 + i * 24);
      });
      for (let i = 0; i < 6; i++) {
        g.fillStyle = '#4a515d';
        g.fillRect(w - 138, 180 + i * 22, 50 + rnd() * 70, 8);
      }
    },

    pcp(g, w, h, rnd) {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, w, h);
      g.fillStyle = SAP.green;
      g.fillRect(0, 0, w, 30);
      font(g, 700, 16, 'label');
      g.textBaseline = 'middle';
      g.fillStyle = '#fff';
      g.fillText('PLANO DE PRODUÇÃO · SEMANA 43', 12, 15);
      const rows = ['Injetora 01', 'Injetora 02', 'Injetora 03', 'Laminação', 'Montagem', 'Embalagem', 'Expedição'];
      const x0 = 120, colW = (w - x0 - 10) / 7;
      font(g, 600, 12, 'label');
      ['SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB', 'DOM'].forEach((d, i) => {
        g.fillStyle = i % 2 ? '#f3f7f4' : '#fff';
        g.fillRect(x0 + i * colW, 30, colW, h - 30);
        g.fillStyle = SAP.muted;
        g.fillText(d, x0 + i * colW + 6, 44);
      });
      const cols = [SAP.green, SAP.gold, SAP.red, '#2a4b9b', SAP.ok];
      rows.forEach((r, i) => {
        const y = 62 + i * 40;
        font(g, 600, 13);
        g.fillStyle = SAP.ink;
        g.fillText(r, 10, y + 12);
        let x = x0 + rnd() * colW;
        while (x < w - 40) {
          const len = colW * (0.6 + rnd() * 1.6);
          g.fillStyle = cols[Math.floor(rnd() * cols.length)];
          R(g, x, y, Math.min(len, w - 14 - x), 24, 5);
          g.fill();
          x += len + 8 + rnd() * 20;
        }
      });
      g.strokeStyle = SAP.red;
      g.lineWidth = 2;
      g.beginPath(); g.moveTo(x0 + colW * 2.4, 30); g.lineTo(x0 + colW * 2.4, h); g.stroke();
    },

    tickets(g, w, h) {
      g.fillStyle = '#f4f6f8';
      g.fillRect(0, 0, w, h);
      g.fillStyle = '#2a4b9b';
      g.fillRect(0, 0, w, 34);
      font(g, 700, 17, 'label');
      g.textBaseline = 'middle';
      g.fillStyle = '#fff';
      g.fillText('SUPORTE TI · CHAMADOS', 12, 17);
      const list = [
        ['#1042', 'Impressora da Expedição sem papel', 'Aberto', SAP.red],
        ['#1041', 'Acesso ao SAP · novo colaborador', 'Em andamento', SAP.gold],
        ['#1039', 'Troca de teclado · Recebimento', 'Em andamento', SAP.gold],
        ['#1037', 'VPN do PCP', 'Resolvido', SAP.ok],
        ['#1036', 'Leitor de código de barras', 'Resolvido', SAP.ok],
        ['#1033', 'Backup do servidor de arquivos', 'Resolvido', SAP.ok],
        ['#1030', 'Senha do adm_logistica', 'Resolvido', SAP.ok],
      ];
      list.forEach(([id, t, s, c], i) => {
        const y = 44 + i * 44;
        g.fillStyle = '#fff';
        R(g, 10, y, w - 20, 38, 6);
        g.fill();
        g.fillStyle = c;
        g.fillRect(10, y, 5, 38);
        font(g, 700, 13, 'label');
        g.fillStyle = '#5b6470';
        g.fillText(id, 24, y + 19);
        font(g, 500, 14);
        g.fillStyle = '#20262e';
        g.fillText(t, 80, y + 19);
        font(g, 700, 12, 'label');
        g.textAlign = 'right';
        g.fillStyle = c;
        g.fillText(s.toUpperCase(), w - 22, y + 19);
        g.textAlign = 'left';
      });
    },

    infra(g, w, h, rnd) {
      g.fillStyle = '#121519';
      g.fillRect(0, 0, w, h);
      font(g, 700, 16, 'label');
      g.textBaseline = 'middle';
      g.fillStyle = '#8fd19e';
      g.fillText('SERVIDORES · TODOS OPERANDO', 14, 18);
      const panels = [['CPU', '#61afef'], ['Memória', '#e5c07b'], ['Rede', '#98c379'], ['Banco SAP', '#c678dd']];
      panels.forEach(([t, c], i) => {
        const x = 14 + (i % 2) * (w / 2 - 7), y = 40 + Math.floor(i / 2) * ((h - 50) / 2);
        const pw = w / 2 - 21, ph = (h - 50) / 2 - 10;
        g.fillStyle = '#1b2026';
        R(g, x, y, pw, ph, 6);
        g.fill();
        font(g, 600, 13, 'label');
        g.fillStyle = '#aab2bf';
        g.fillText(t, x + 10, y + 14);
        g.strokeStyle = c;
        g.lineWidth = 2;
        g.beginPath();
        let v = 0.5;
        for (let k = 0; k <= 40; k++) {
          v = Math.min(0.95, Math.max(0.1, v + (rnd() - 0.5) * 0.25));
          const px = x + 10 + (k / 40) * (pw - 20), py = y + ph - 10 - v * (ph - 34);
          if (k) g.lineTo(px, py); else g.moveTo(px, py);
        }
        g.stroke();
      });
    },

    // Telas de parede e quadros
    deploy(g, w, h) {
      g.fillStyle = '#14181d';
      g.fillRect(0, 0, w, h);
      font(g, 700, 26, 'label');
      g.textBaseline = 'middle';
      g.fillStyle = '#fff';
      g.fillText('SAP · MERY\'S TOYS · PRODUÇÃO', 20, 30);
      const steps = [['Testes', 'OK'], ['Build', 'OK'], ['Deploy Render', 'OK'], ['Saúde /healthz', 'OK']];
      steps.forEach(([t, s], i) => {
        const y = 70 + i * 66;
        g.fillStyle = '#1e252d';
        R(g, 20, y, w - 40, 54, 8);
        g.fill();
        g.fillStyle = '#3b8b62';
        g.beginPath(); g.arc(50, y + 27, 13, 0, Math.PI * 2); g.fill();
        font(g, 600, 22, 'label');
        g.fillStyle = '#e8edf2';
        g.fillText(t, 78, y + 27);
        g.textAlign = 'right';
        g.fillStyle = '#8fd19e';
        g.fillText(s, w - 40, y + 27);
        g.textAlign = 'left';
      });
    },

    dashboard(g, w, h, rnd) {
      g.fillStyle = SAP.bg;
      g.fillRect(0, 0, w, h);
      g.fillStyle = SAP.green;
      g.fillRect(0, 0, w, 44);
      font(g, 700, 22, 'label');
      g.textBaseline = 'middle';
      g.fillStyle = '#fff';
      g.fillText('PCP · INDICADORES DO DIA', 16, 22);
      const kpis = [['Peças/h', '1.240', SAP.green], ['Eficiência', '87%', SAP.ok], ['Refugo', '2,1%', SAP.red], ['Pedidos', '18', SAP.gold]];
      const kw = (w - 16 * 5) / 4;
      kpis.forEach(([t, v, c], i) => {
        const x = 16 + i * (kw + 16);
        g.fillStyle = '#fff';
        R(g, x, 58, kw, 82, 8);
        g.fill();
        font(g, 500, 14);
        g.fillStyle = SAP.muted;
        g.fillText(t, x + 12, 76);
        font(g, 700, 34, 'label');
        g.fillStyle = c;
        g.fillText(v, x + 12, 114);
      });
      const bx = 16, by = 156, bw = w - 32, bh = h - by - 16;
      g.fillStyle = '#fff';
      R(g, bx, by, bw, bh, 8);
      g.fill();
      for (let i = 0; i < 14; i++) {
        const v = 0.3 + rnd() * 0.65;
        g.fillStyle = i === 13 ? SAP.gold : SAP.green2;
        g.fillRect(bx + 16 + i * ((bw - 32) / 14), by + bh - 12 - v * (bh - 30), (bw - 32) / 14 - 8, v * (bh - 30));
      }
    },

    kanban(g, w, h, rnd) {
      board(g, w, h);
      const cols = ['A FAZER', 'FAZENDO', 'FEITO'];
      const notes = ['#ffe36e', '#ffb3c7', '#9ad8ff', '#b6f0a8'];
      font(g, 700, 30, 'label');
      g.textBaseline = 'middle';
      cols.forEach((c, i) => {
        const x = 30 + i * ((w - 60) / 3);
        g.fillStyle = '#2a4b9b';
        g.fillText(c, x + 10, 40);
        if (i) {
          g.strokeStyle = 'rgba(40,40,60,0.5)';
          g.lineWidth = 3;
          g.beginPath(); g.moveTo(x - 6, 20); g.lineTo(x - 6, h - 20); g.stroke();
        }
        const n = 3 + Math.floor(rnd() * 3);
        for (let k = 0; k < n; k++) note(g, x + 14 + (k % 2) * 104, 70 + Math.floor(k / 2) * 100, 90, notes[Math.floor(rnd() * notes.length)], rnd);
      });
    },

    moodboard(g, w, h, rnd) {
      board(g, w, h);
      font(g, 700, 30, 'label');
      g.textBaseline = 'middle';
      g.fillStyle = '#a3161c';
      g.fillText('COLEÇÃO DE NATAL · REFERÊNCIAS', 30, 40);
      const sw = ['#a3161c', '#d9a441', '#f4c51c', '#2a4b9b', '#1f6b3a', '#f4ead2'];
      sw.forEach((c, i) => {
        g.fillStyle = c;
        g.fillRect(30 + i * 62, h - 90, 54, 54);
      });
      for (let i = 0; i < 6; i++) {
        const x = 30 + (i % 3) * 150 + rnd() * 20, y = 74 + Math.floor(i / 3) * 110 + rnd() * 10;
        g.save();
        g.translate(x + 60, y + 45);
        g.rotate((rnd() - 0.5) * 0.12);
        g.fillStyle = '#fff';
        g.fillRect(-64, -46, 128, 92);
        g.fillStyle = sw[i % sw.length];
        g.globalAlpha = 0.75;
        g.beginPath(); g.arc(0, 0, 26, 0, Math.PI * 2); g.fill();
        g.fillRect(-48, 14, 96, 20);
        g.restore();
      }
      note(g, w - 140, 80, 110, '#ffe36e', rnd);
      note(g, w - 140, 210, 110, '#9ad8ff', rnd);
    },

    plan(g, w, h, rnd) {
      board(g, w, h);
      font(g, 700, 30, 'label');
      g.textBaseline = 'middle';
      g.fillStyle = '#1f6b3a';
      g.fillText('PLANEJAMENTO · OUTUBRO', 30, 40);
      g.strokeStyle = '#2b2b33';
      g.lineWidth = 2;
      for (let i = 0; i <= 6; i++) {
        const y = 70 + i * 44;
        g.beginPath(); g.moveTo(30, y); g.lineTo(w - 30, y); g.stroke();
      }
      const marker = ['#2a4b9b', '#a3161c', '#1f6b3a'];
      for (let i = 0; i < 6; i++) {
        const x = 150 + rnd() * 200, len = 120 + rnd() * 280;
        g.strokeStyle = marker[i % 3];
        g.lineWidth = 14;
        g.lineCap = 'round';
        g.beginPath(); g.moveTo(x, 92 + i * 44); g.lineTo(Math.min(w - 50, x + len), 92 + i * 44); g.stroke();
        scribble(g, 40, 92 + i * 44, 90, '#2b2b33', rnd);
      }
    },
  };

  // Moldura branca de quadro com reflexo leve
  function board(g, w, h) {
    g.fillStyle = '#f7f7f2';
    g.fillRect(0, 0, w, h);
    const sh = g.createLinearGradient(0, 0, w, h);
    sh.addColorStop(0, 'rgba(255,255,255,0)');
    sh.addColorStop(0.5, 'rgba(255,255,255,0.5)');
    sh.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = sh;
    g.fillRect(0, 0, w, h);
  }
  function note(g, x, y, s, color, rnd) {
    g.save();
    g.translate(x + s / 2, y + s / 2);
    g.rotate((rnd() - 0.5) * 0.15);
    g.fillStyle = 'rgba(0,0,0,0.15)';
    g.fillRect(-s / 2 + 3, -s / 2 + 4, s, s);
    g.fillStyle = color;
    g.fillRect(-s / 2, -s / 2, s, s);
    for (let i = 0; i < 3; i++) scribble(g, -s / 2 + 10, -s / 2 + 22 + i * 22, s - 24, '#3b3b46', rnd);
    g.restore();
  }
  function scribble(g, x, y, len, color, rnd) {
    g.strokeStyle = color;
    g.lineWidth = 2.5;
    g.lineCap = 'round';
    g.beginPath();
    g.moveTo(x, y);
    for (let k = 1; k <= 8; k++) g.lineTo(x + (k / 8) * len * (0.6 + rnd() * 0.4), y + (rnd() - 0.5) * 6);
    g.stroke();
  }

  // Tela de carregamento enquanto a câmera se aproxima (redesenhada a cada quadro)
  MT.bootScreen = function () {
    const c = document.createElement('canvas');
    c.width = 1024;
    c.height = 576;
    const g = c.getContext('2d');
    const tex = new THREE.CanvasTexture(c);
    tex.encoding = THREE.sRGBEncoding;
    tex.draw = (p) => {
      const w = c.width, h = c.height;
      const bg = g.createRadialGradient(w * 0.2, h * 0.1, 0, w * 0.5, h * 0.5, w * 0.8);
      bg.addColorStop(0, SAP.green2);
      bg.addColorStop(0.45, SAP.green);
      bg.addColorStop(1, '#0f2a22');
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      font(g, 700, 64, 'label');
      g.fillStyle = SAP.gold2;
      g.fillText("✦ Mery's Toys", w / 2, h / 2 - 50);
      font(g, 500, 26);
      g.fillStyle = '#c0d0c7';
      g.fillText('Conectando ao SAP…', w / 2, h / 2 + 18);
      g.fillStyle = 'rgba(255,255,255,0.15)';
      R(g, w / 2 - 200, h / 2 + 64, 400, 10, 5);
      g.fill();
      g.fillStyle = SAP.gold2;
      R(g, w / 2 - 200, h / 2 + 64, 400 * Math.max(0.03, Math.min(1, p)), 10, 5);
      g.fill();
      g.textAlign = 'left';
      tex.needsUpdate = true;
    };
    tex.draw(0);
    return tex;
  };
})();
