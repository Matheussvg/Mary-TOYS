/* Texturas geradas em canvas: placas, letreiros, pisos e faixas. */
(function () {
  const MT = (window.MT = window.MT || {});

  MT.FONTS = {
    display: '"Alfa Slab One", "Rockwell", Georgia, serif',
    label: '"Barlow Condensed", "Arial Narrow", Arial, sans-serif',
    body: '"Barlow", "Segoe UI", Arial, sans-serif',
  };

  MT.canvasTexture = function (w, h, draw, opts = {}) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    draw(g, w, h);
    const t = new THREE.CanvasTexture(c);
    t.encoding = THREE.sRGBEncoding;
    t.anisotropy = MT.maxAniso || 4;
    if (opts.repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(opts.repeat[0], opts.repeat[1]);
    }
    return t;
  };

  // Reduz a fonte até o texto caber na largura
  MT.fitFont = function (g, text, weight, size, family, maxW) {
    let s = size;
    do {
      g.font = `${weight} ${s}px ${family}`;
      if (g.measureText(text).width <= maxW) break;
      s -= 2;
    } while (s > 10);
    return s;
  };

  MT.wrapLines = function (g, text, maxW) {
    const words = text.split(' ');
    const lines = [];
    let line = '';
    for (const w of words) {
      const test = line ? line + ' ' + w : w;
      if (g.measureText(test).width > maxW && line) {
        lines.push(line);
        line = w;
      } else line = test;
    }
    if (line) lines.push(line);
    return lines;
  };

  function roundRect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y);
    g.arcTo(x + w, y, x + w, y + h, r);
    g.arcTo(x + w, y + h, x, y + h, r);
    g.arcTo(x, y + h, x, y, r);
    g.arcTo(x, y, x + w, y, r);
    g.closePath();
  }
  MT.roundRect = roundRect;

  MT.areaSize = function (a) {
    const [x1, x2, z1, z2] = a.rect;
    const w = Math.abs(x2 - x1);
    const d = Math.abs(z2 - z1);
    return { w, d, m2: w * d };
  };

  MT.fmt = (n) => (Number.isInteger(n) ? String(n) : n.toFixed(1).replace('.', ','));

  // Placa creme como na planta: nome em caixa alta, responsáveis e metragem
  MT.signTexture = function (area, dept) {
    const W = 1024, Hh = 400;
    return MT.canvasTexture(W, Hh, (g) => {
      g.shadowColor = 'rgba(0,0,0,0.35)';
      g.shadowBlur = 18;
      g.fillStyle = '#f4ead2';
      roundRect(g, 16, 16, W - 32, Hh - 32, 28);
      g.fill();
      g.shadowBlur = 0;
      g.lineWidth = 6;
      g.strokeStyle = '#b8862f';
      g.stroke();

      g.fillStyle = dept.color;
      roundRect(g, 16, 16, W - 32, 26, 12);
      g.fill();

      g.textAlign = 'center';
      g.textBaseline = 'alphabetic';
      g.fillStyle = '#22170f';
      const title = area.name.toUpperCase();
      g.font = `700 86px ${MT.FONTS.label}`;
      const lines = MT.wrapLines(g, title, W - 110).slice(0, 2);
      let y = lines.length > 1 ? 130 : 150;
      for (const l of lines) {
        MT.fitFont(g, l, 700, 86, MT.FONTS.label, W - 110);
        g.fillText(l, W / 2, y);
        y += 80;
      }
      if (area.sub) {
        g.font = `500 44px ${MT.FONTS.body}`;
        g.fillStyle = '#5b4a38';
        MT.fitFont(g, area.sub, 500, 44, MT.FONTS.body, W - 110);
        g.fillText(area.sub, W / 2, y - 22);
        y += 30;
      }
      if (area.people) {
        g.fillStyle = '#3a2c20';
        MT.fitFont(g, area.people, 500, 56, MT.FONTS.body, W - 110);
        g.fillText(area.people, W / 2, Math.max(y + 6, 262));
      }
      const s = MT.areaSize(area);
      g.font = `600 40px ${MT.FONTS.label}`;
      g.fillStyle = dept.color;
      g.fillText(`${MT.fmt(s.w)} × ${MT.fmt(s.d)} m  ·  ${MT.fmt(s.m2)} m²`, W / 2, Hh - 48);
    });
  };

  // Piso da área: cor do setor, grade de 1 m, faixa de segurança e nome
  MT.floorTexture = function (area, dept) {
    const s = MT.areaSize(area);
    const ppm = Math.min(24, 2048 / Math.max(s.w, s.d));
    const W = Math.round(s.w * ppm), Hh = Math.round(s.d * ppm);
    const industrial = area.dept === 'producao' || area.dept === 'logistica' || area.dept === 'circulacao';
    return MT.canvasTexture(W, Hh, (g) => {
      g.fillStyle = dept.floor;
      g.fillRect(0, 0, W, Hh);

      // leve variação para não parecer chapado
      for (let i = 0; i < (W * Hh) / 900; i++) {
        g.fillStyle = `rgba(${Math.random() < 0.5 ? '0,0,0' : '255,255,255'},${Math.random() * 0.035})`;
        g.fillRect(Math.random() * W, Math.random() * Hh, 2 + Math.random() * 6, 2 + Math.random() * 6);
      }

      g.strokeStyle = 'rgba(40,30,20,0.12)';
      g.lineWidth = 1;
      for (let x = 0; x <= s.w; x++) {
        g.beginPath(); g.moveTo(x * ppm, 0); g.lineTo(x * ppm, Hh); g.stroke();
      }
      for (let z = 0; z <= s.d; z++) {
        g.beginPath(); g.moveTo(0, z * ppm); g.lineTo(W, z * ppm); g.stroke();
      }

      if (industrial && !area.minor) {
        // faixa zebrada amarela/preta delimitando a área
        const b = Math.max(6, ppm * 0.3);
        g.save();
        g.beginPath();
        g.rect(0, 0, W, Hh);
        g.rect(b, b, W - 2 * b, Hh - 2 * b);
        g.clip('evenodd');
        g.fillStyle = '#e8b81a';
        g.fillRect(0, 0, W, Hh);
        g.fillStyle = '#1d1a16';
        for (let i = -Hh; i < W + Hh; i += b * 2) {
          g.beginPath();
          g.moveTo(i, 0); g.lineTo(i + b, 0); g.lineTo(i + b - Hh, Hh); g.lineTo(i - Hh, Hh);
          g.fill();
        }
        g.restore();
      } else {
        g.strokeStyle = dept.color;
        g.lineWidth = Math.max(4, ppm * 0.18);
        g.strokeRect(g.lineWidth / 2, g.lineWidth / 2, W - g.lineWidth, Hh - g.lineWidth);
      }

      if (!area.minor) {
        g.textAlign = 'center';
        g.textBaseline = 'middle';
        g.fillStyle = 'rgba(30,22,15,0.55)';
        const name = area.name.toUpperCase();
        const fs = MT.fitFont(g, name, 700, Math.min(Hh * 0.22, ppm * 2.6), MT.FONTS.label, W * 0.8);
        g.fillText(name, W / 2, Hh / 2 - fs * 0.2);
        g.font = `600 ${Math.round(fs * 0.42)}px ${MT.FONTS.label}`;
        g.fillText(`${MT.fmt(s.w)} × ${MT.fmt(s.d)} m · ${MT.fmt(s.m2)} m²`, W / 2, Hh / 2 + fs * 0.62);
      }
    });
  };

  // Faixa de departamento (vermelha/verde/azul com bordas douradas)
  MT.bannerTexture = function (text, color) {
    const W = 1024, Hh = 220;
    return MT.canvasTexture(W, Hh, (g) => {
      g.fillStyle = '#d9a441';
      roundRect(g, 0, 0, W, Hh, 26);
      g.fill();
      g.fillStyle = color;
      roundRect(g, 12, 12, W - 24, Hh - 24, 20);
      g.fill();
      g.strokeStyle = 'rgba(255,220,150,0.6)';
      g.lineWidth = 3;
      roundRect(g, 26, 26, W - 52, Hh - 52, 14);
      g.stroke();
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = '#fff4dc';
      MT.fitFont(g, text, 400, 120, MT.FONTS.display, W - 140);
      g.fillText(text, W / 2, Hh / 2 + 6);
    });
  };

  // Letreiro principal da fachada (fundo transparente)
  MT.logoTexture = function () {
    const W = 1600, Hh = 560;
    return MT.canvasTexture(W, Hh, (g) => {
      g.textAlign = 'center';
      g.textBaseline = 'alphabetic';
      const draw = (txt, size, y, spacing) => {
        g.font = `400 ${size}px ${MT.FONTS.display}`;
        if ('letterSpacing' in g) g.letterSpacing = spacing;
        g.lineJoin = 'round';
        g.strokeStyle = '#4a0b0d';
        g.lineWidth = size * 0.16;
        g.strokeText(txt, W / 2, y + 10);
        g.strokeStyle = '#b8862f';
        g.lineWidth = size * 0.1;
        g.strokeText(txt, W / 2, y);
        const grad = g.createLinearGradient(0, y - size, 0, y);
        grad.addColorStop(0, '#fffaf0');
        grad.addColorStop(1, '#f2dfb4');
        g.fillStyle = grad;
        g.fillText(txt, W / 2, y);
      };
      draw("MARY'S", 250, 290, '6px');
      draw('TOYS', 170, 500, '14px');
      g.fillStyle = '#f4d27a';
      const star = (cx, cy, r) => {
        g.beginPath();
        for (let i = 0; i < 10; i++) {
          const rr = i % 2 ? r * 0.45 : r;
          const a = -Math.PI / 2 + (i * Math.PI) / 5;
          g.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr);
        }
        g.closePath();
        g.fill();
      };
      star(W / 2 - 330, 440, 34);
      star(W / 2 - 430, 450, 22);
      star(W / 2 + 330, 440, 34);
      star(W / 2 + 430, 450, 22);
    });
  };

  // Estandarte vertical com texto empilhado
  MT.verticalBannerTexture = function (lines, withGear) {
    const W = 360, Hh = 1100;
    return MT.canvasTexture(W, Hh, (g) => {
      g.fillStyle = '#9e1418';
      g.beginPath();
      g.moveTo(0, 0); g.lineTo(W, 0); g.lineTo(W, Hh - 90); g.lineTo(W / 2, Hh); g.lineTo(0, Hh - 90);
      g.closePath();
      g.fill();
      g.strokeStyle = '#d9a441';
      g.lineWidth = 14;
      g.stroke();
      g.lineWidth = 4;
      g.strokeRect(26, 26, W - 52, Hh - 170);
      g.fillStyle = '#d9a441';
      g.fillRect(0, 0, W, 34);

      if (withGear) MT.drawGear(g, W / 2, lines.length ? 230 : Hh / 2 - 60, 90, '#e6b65a');
      g.textAlign = 'center';
      g.fillStyle = '#fff1d6';
      let y = withGear ? 470 : 380;
      for (const l of lines) {
        MT.fitFont(g, l, 700, 74, MT.FONTS.label, W - 70);
        g.fillText(l, W / 2, y);
        y += 92;
      }
    });
  };

  MT.drawGear = function (g, cx, cy, r, color) {
    g.save();
    g.translate(cx, cy);
    g.fillStyle = color;
    g.beginPath();
    const teeth = 10;
    for (let i = 0; i < teeth * 2; i++) {
      const a0 = (i / (teeth * 2)) * Math.PI * 2;
      const a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
      const rr = i % 2 ? r * 0.8 : r;
      g.arc(0, 0, rr, a0, a1);
    }
    g.closePath();
    g.fill();
    g.globalCompositeOperation = 'destination-out';
    g.beginPath();
    g.arc(0, 0, r * 0.38, 0, Math.PI * 2);
    g.fill();
    g.restore();
    g.save();
    g.strokeStyle = color;
    g.lineWidth = r * 0.08;
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      g.beginPath();
      g.moveTo(cx, cy);
      g.lineTo(cx + Math.cos(a) * r * 0.75, cy + Math.sin(a) * r * 0.75);
      g.stroke();
    }
    g.restore();
  };

  MT.plainTextTexture = function (lines, opts = {}) {
    const W = opts.w || 1024, Hh = opts.h || 512;
    return MT.canvasTexture(W, Hh, (g) => {
      g.fillStyle = opts.bg || '#9e1418';
      g.fillRect(0, 0, W, Hh);
      g.strokeStyle = opts.border || '#d9a441';
      g.lineWidth = 18;
      g.strokeRect(9, 9, W - 18, Hh - 18);
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      g.fillStyle = opts.fg || '#fff1d6';
      const lh = (Hh - 80) / lines.length;
      lines.forEach((l, i) => {
        MT.fitFont(g, l, 700, Math.min(lh * 0.8, 120), MT.FONTS.label, W - 90);
        g.fillText(l, W / 2, 40 + lh * (i + 0.5));
      });
    });
  };

  // Rosto do boneco
  MT.faceTexture = function () {
    return MT.canvasTexture(512, 256, (g, W, Hh) => {
      g.fillStyle = '#f4c51c';
      g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#1a1208';
      g.beginPath(); g.ellipse(W / 2 - 34, 100, 9, 13, 0, 0, Math.PI * 2); g.fill();
      g.beginPath(); g.ellipse(W / 2 + 34, 100, 9, 13, 0, 0, Math.PI * 2); g.fill();
      g.lineWidth = 8;
      g.strokeStyle = '#1a1208';
      g.beginPath(); g.arc(W / 2, 128, 46, 0.2 * Math.PI, 0.8 * Math.PI); g.stroke();
    });
  };

  // Lateral do caminhão
  MT.truckTexture = function () {
    return MT.canvasTexture(2048, 512, (g, W, Hh) => {
      g.fillStyle = '#f3f1ec';
      g.fillRect(0, 0, W, Hh);
      g.strokeStyle = 'rgba(0,0,0,0.08)';
      for (let x = 0; x < W; x += 64) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, Hh); g.stroke(); }
      g.fillStyle = '#9e1418';
      MT.roundRect(g, W / 2 - 420, 120, 840, 280, 60);
      g.fill();
      g.strokeStyle = '#d9a441';
      g.lineWidth = 14;
      g.stroke();
      g.textAlign = 'center';
      g.fillStyle = '#fff1d6';
      g.font = `400 150px ${MT.FONTS.display}`;
      g.fillText("MARY'S", W / 2, 270);
      g.font = `400 96px ${MT.FONTS.display}`;
      g.fillText('TOYS', W / 2, 370);
      g.fillStyle = '#9e1418';
      g.fillRect(0, Hh - 26, W, 26);
    });
  };

  // Janelas da fachada com luz quente interna
  MT.windowTexture = function () {
    return MT.canvasTexture(512, 512, (g, W, Hh) => {
      g.fillStyle = '#8f1216';
      g.fillRect(0, 0, W, Hh);
      g.fillStyle = '#d9a441';
      g.fillRect(28, 28, W - 56, Hh - 56);
      const grad = g.createLinearGradient(0, 40, 0, Hh - 40);
      grad.addColorStop(0, '#ffe9b8');
      grad.addColorStop(1, '#f2b866');
      g.fillStyle = grad;
      g.fillRect(40, 40, W - 80, Hh - 80);
      g.fillStyle = '#6b5a40';
      g.fillRect(W / 2 - 6, 40, 12, Hh - 80);
      g.fillRect(40, Hh / 2 - 6, W - 80, 12);
      g.fillStyle = 'rgba(255,255,255,0.25)';
      g.beginPath(); g.moveTo(40, 40); g.lineTo(200, 40); g.lineTo(40, 200); g.fill();
    });
  };

  MT.brickTexture = function () {
    return MT.canvasTexture(512, 512, (g, W, Hh) => {
      g.fillStyle = '#7d1014';
      g.fillRect(0, 0, W, Hh);
      const bh = 32, bw = 96;
      for (let r = 0; r < Hh / bh; r++) {
        const off = r % 2 ? bw / 2 : 0;
        for (let c = -1; c < W / bw + 1; c++) {
          const l = 38 + Math.random() * 10;
          g.fillStyle = `hsl(${357 + Math.random() * 6}, 70%, ${l}%)`;
          g.fillRect(c * bw + off + 3, r * bh + 3, bw - 6, bh - 6);
        }
      }
    }, { repeat: [1, 1] });
  };

  MT.skyTexture = function () {
    return MT.canvasTexture(16, 512, (g, W, Hh) => {
      const grad = g.createLinearGradient(0, 0, 0, Hh);
      grad.addColorStop(0.0, '#2e5aa8');
      grad.addColorStop(0.32, '#6f95d2');
      grad.addColorStop(0.45, '#b9c3e0');
      grad.addColorStop(0.5, '#f3c39c');
      grad.addColorStop(0.53, '#e9a77e');
      grad.addColorStop(1.0, '#3b3530');
      g.fillStyle = grad;
      g.fillRect(0, 0, W, Hh);
    });
  };
})();
