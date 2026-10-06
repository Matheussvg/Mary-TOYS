/*
 * Planta da fábrica Mary's Toys (unidades em metros).
 * Eixo X: oeste (-) → leste (+). Eixo Z: fundo (-) → fachada (+).
 * A fachada fica em z = 0; a Produção vem logo após a recepção e a
 * Logística fica no final da fábrica, com as docas no muro dos fundos.
 */
(function () {
  const MT = (window.MT = window.MT || {});

  const F = 0.45; // altura do piso interno (3 degraus de 15 cm)
  const H = 8;    // pé-direito

  MT.LAYOUT = {
    F,
    H,
    building: { x1: -60, x2: 60, z1: -90, z2: 0 },

    departments: {
      recepcao:   { name: 'Recepção',    color: '#b8862f', floor: '#d9cdb4' },
      producao:   { name: 'Produção',    color: '#a3161c', floor: '#a9a49a' },
      circulacao: { name: 'Circulação',  color: '#7a6a55', floor: '#b9b2a4' },
      logistica:  { name: 'Logística',   color: '#1f6b3a', floor: '#9aa39a' },
      ti:         { name: 'TI',          color: '#2a4b9b', floor: '#aab3c4' },
      comunicacao:{ name: 'Comunicação', color: '#8e1b2a', floor: '#c9b49c' },
    },

    // rect = [x1, x2, z1, z2]
    areas: [
      // Recepção
      { id: 'hall', dept: 'recepcao', name: 'Recepção', people: 'Hall de entrada', rect: [-30, 30, -10, 0] },

      // Produção (frente)
      { id: 'injetoras',  dept: 'producao', name: 'Injetoras', people: 'Área das máquinas injetoras', rect: [-30, 30, -40, -10] },
      { id: 'metrologia', dept: 'producao', name: 'Metrologia e Qualidade', people: 'Henry', rect: [-30, -17, -50, -40] },
      { id: 'laminacao',  dept: 'producao', name: 'Laminação, Refugo e Sucata', people: 'Joci / Lucas', rect: [-17, -4, -50, -40] },
      { id: 'passagem',   dept: 'producao', name: 'Passagem', people: '', rect: [-4, 4, -50, -40], minor: true },
      { id: 'operacao',   dept: 'producao', name: 'Operação das Máquinas', people: 'Alisson / Pedro Henrique / Rayanne / Milena', rect: [4, 17, -50, -40] },
      { id: 'manutencao', dept: 'producao', name: 'Manutenção e Segurança do Trabalho', people: 'Terceirizado', rect: [17, 30, -50, -40] },

      // Corredor entre Produção e Logística
      { id: 'corredor', dept: 'circulacao', name: 'Corredor de circulação', people: '', rect: [-30, 30, -54, -50], minor: true },

      // Logística (fundo)
      { id: 'almoxarifado', dept: 'logistica', name: 'Almoxarifado', people: 'Rafael e João', rect: [-30, -16, -90, -54] },
      { id: 'recebimento',  dept: 'logistica', name: 'Recebimento', people: 'Flávia', rect: [-16, -2, -90, -54] },
      { id: 'estoque',      dept: 'logistica', name: 'Estoque', people: 'Jonatas / Pedro E', rect: [-2, 16, -90, -54] },
      { id: 'expedicao',    dept: 'logistica', name: 'Expedição', people: 'Maria', rect: [16, 30, -90, -54] },

      // Ala TI (oeste)
      { id: 'dev',       dept: 'ti', name: 'Desenvolvimento do Software', people: 'Matheus F / Eduarda', rect: [-60, -34, -90, -68] },
      { id: 'design',    dept: 'ti', name: 'Design', people: 'Pietro / Ana Clara / Rayssa', rect: [-60, -34, -68, -48] },
      { id: 'modelagem', dept: 'ti', name: 'Modelagem 3D', people: 'Zanella', rect: [-60, -34, -48, -32] },
      { id: 'pcp',       dept: 'ti', name: 'PCP', sub: 'Planejamento e Controle da Produção', people: 'Galdino / Valdecir', rect: [-60, -34, -32, -16] },
      { id: 'suporte',   dept: 'ti', name: 'Suporte', people: 'Letícia Nunes', rect: [-60, -34, -16, 0] },
      { id: 'corredor-ti', dept: 'ti', name: 'Corredor TI', people: '', rect: [-34, -30, -90, 0], minor: true },

      // Ala Comunicação (leste)
      { id: 'rh',  dept: 'comunicacao', name: 'RH', people: 'Neon / Gabriel / Ana K', rect: [34, 60, -90, -45] },
      { id: 'adm', dept: 'comunicacao', name: 'ADM', people: 'Arthur e Talles', rect: [34, 60, -45, 0] },
      { id: 'corredor-com', dept: 'comunicacao', name: 'Corredor Comunicação', people: '', rect: [30, 34, -90, 0], minor: true },
    ],

    /*
     * Paredes: axis 'x' corre ao longo de X numa linha z = at;
     *          axis 'z' corre ao longo de Z numa linha x = at.
     * openings: c = centro, w = largura, h = altura do vão.
     * outward: lado externo das paredes do perímetro.
     */
    perimeter: [
      { axis: 'x', at: 0,   from: -60, to: 60, outward: '+z', openings: [{ c: 0, w: 6, h: 3.2, door: 'slide' }] },
      { axis: 'x', at: -90, from: -60, to: 60, outward: '-z', openings: [
        { c: -9, w: 4, h: 4.2, door: 'roll' },
        { c: 23, w: 4, h: 4.2, door: 'roll' },
      ] },
      { axis: 'z', at: -60, from: -90, to: 0, outward: '-x', openings: [] },
      { axis: 'z', at: 60,  from: -90, to: 0, outward: '+x', openings: [] },
    ],

    interior: [
      // Divisas entre alas e bloco central
      { axis: 'z', at: -30, from: -90, to: 0, openings: [{ c: -5, w: 2.4 }, { c: -25, w: 2.4 }, { c: -52, w: 2.4 }, { c: -72, w: 2.4 }] },
      { axis: 'z', at: 30,  from: -90, to: 0, openings: [{ c: -5, w: 2.4 }, { c: -25, w: 2.4 }, { c: -52, w: 2.4 }, { c: -72, w: 2.4 }] },

      // Ala TI: corredor + salas
      { axis: 'z', at: -34, from: -90, to: 0, openings: [{ c: -79, w: 1.6 }, { c: -58, w: 1.6 }, { c: -40, w: 1.6 }, { c: -24, w: 1.6 }, { c: -8, w: 1.6 }] },
      { axis: 'x', at: -68, from: -60, to: -34 },
      { axis: 'x', at: -48, from: -60, to: -34 },
      { axis: 'x', at: -32, from: -60, to: -34 },
      { axis: 'x', at: -16, from: -60, to: -34 },

      // Ala Comunicação
      { axis: 'z', at: 34, from: -90, to: 0, openings: [{ c: -67.5, w: 1.8 }, { c: -22.5, w: 1.8 }] },
      { axis: 'x', at: -45, from: 34, to: 60 },

      // Recepção → Produção
      { axis: 'x', at: -10, from: -30, to: 30, openings: [{ c: 0, w: 6, h: 3.6 }, { c: -20, w: 3, h: 3 }, { c: 20, w: 3, h: 3 }] },

      // Salas da Produção
      { axis: 'x', at: -40, from: -30, to: -4, openings: [{ c: -23.5, w: 2 }, { c: -10.5, w: 2 }] },
      { axis: 'x', at: -40, from: 4, to: 30, openings: [{ c: 10.5, w: 2 }, { c: 23.5, w: 2 }] },
      { axis: 'x', at: -50, from: -30, to: -4 },
      { axis: 'x', at: -50, from: 4, to: 30 },
      { axis: 'z', at: -17, from: -50, to: -40 },
      { axis: 'z', at: -4,  from: -50, to: -40 },
      { axis: 'z', at: 4,   from: -50, to: -40 },
      { axis: 'z', at: 17,  from: -50, to: -40 },

      // Corredor → Logística
      { axis: 'x', at: -54, from: -30, to: 30, openings: [{ c: -23, w: 4, h: 4.2 }, { c: -9, w: 4, h: 4.2 }, { c: 7, w: 4, h: 4.2 }, { c: 23, w: 4, h: 4.2 }] },
      { axis: 'z', at: -16, from: -90, to: -54, openings: [{ c: -72, w: 4, h: 4.2 }] },
      { axis: 'z', at: -2,  from: -90, to: -54, openings: [{ c: -72, w: 4, h: 4.2 }] },
      { axis: 'z', at: 16,  from: -90, to: -54, openings: [{ c: -72, w: 4, h: 4.2 }] },
    ],

    // Faixas de departamento penduradas nas paredes (como na planta)
    banners: [
      { dept: 'producao',    text: 'PRODUÇÃO',    pos: [0, F + 4.4, -9.88],  rotY: 0, w: 11 },
      { dept: 'logistica',   text: 'LOGÍSTICA',   pos: [0, F + 5.0, -53.88], rotY: 0, w: 11 },
      { dept: 'ti',          text: 'TI',          pos: [-29.88, F + 4.2, -5], rotY: Math.PI / 2, w: 6 },
      { dept: 'comunicacao', text: 'COMUNICAÇÃO', pos: [29.88, F + 4.2, -5], rotY: -Math.PI / 2, w: 8 },
    ],

    spawn: { x: 0, z: 20, yaw: 0 },
  };

  MT.areaAt = function (x, z) {
    // Áreas nomeadas têm prioridade sobre corredores
    let fallback = null;
    for (const a of MT.LAYOUT.areas) {
      const [x1, x2, z1, z2] = a.rect;
      if (x >= x1 && x <= x2 && z >= z1 && z <= z2) {
        if (!a.minor) return a;
        fallback = fallback || a;
      }
    }
    return fallback;
  };
})();
