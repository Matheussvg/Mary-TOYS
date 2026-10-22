/*
 * Mobília da ala da TI (unidades em metros), sala por sala.
 * Cada item usa um modelo de js/models/office.js e fica:
 *   - encostado numa parede: wall 'N' (fundo), 'S' (fachada), 'W' (oeste) ou 'E' (corredor)
 *     e along = deslocamento ao longo da parede a partir do centro da sala;
 *   - ou solto: at = [dx, dz] a partir do centro da sala, rot em graus.
 * As telas das estações de trabalho abrem o SAP (ver js/ui/computer.js).
 * A porta de cada sala fica na parede E, no centro: deixe livre a faixa dz −1,5…1,5 perto dela.
 */
(function () {
  const MT = (window.MT = window.MT || {});

  MT.TI = {
    // Endereço do SAP aberto nos PCs. Vazio: usa o do servidor (sap/server.js) ou a cópia em ../sap/public.
    // Para usar o simulador hospedado em outro lugar com o SAP publicado no Render, coloque aqui a URL (ex.: 'https://….onrender.com/sap/').
    sapUrl: '',

    // Distância máxima (m) entre os olhos e a tela para aparecer a opção de usar o PC
    reach: 2.6,

    rooms: [
      {
        area: 'dev', // Desenvolvimento do Software · 26 × 22 m: três ilhas de PCs, reunião e descanso
        items: [
          { model: 'pod', at: [-8.5, -6], seats: [
            { owner: 'Matheus Fortunato', role: 'Gerente de TI', dual: true, screen: 'sap', screen2: 'code', main: true },
            { owner: 'Eduarda Tomaz', role: 'Desenvolvimento de Software', dual: true, screen: 'code', screen2: 'sap' },
            { label: 'Estação de testes', screen: 'code' },
            { label: 'Integração SAP', screen: 'sap' },
          ] },
          { model: 'pod', at: [-2.5, -6], seats: [
            { label: 'Banco de dados', screen: 'code' },
            { label: 'Build e deploy', screen: 'code' },
            { screen: 'sap' },
            { screen: 'code' },
          ] },
          { model: 'pod', at: [3.5, -6], seats: [{ screen: 'code' }, { screen: 'sap' }, { screen: 'sap' }, { screen: 'code' }] },
          { model: 'board', wall: 'N', along: -5.5, y: 0.9, w: 3.2, h: 1.3, kind: 'kanban' },
          { model: 'tv', wall: 'N', along: 0.5, y: 1.3, w: 1.8, h: 1.0, kind: 'deploy' },
          { model: 'board', wall: 'N', along: 6, y: 0.9, w: 3.0, h: 1.3, kind: 'kanban', variant: 1 },
          { model: 'shelf', wall: 'W', along: 2.6, fill: 'binders' },
          { model: 'shelf', wall: 'W', along: 4.6, fill: 'boxes' },
          { model: 'shelf', wall: 'W', along: 6.6, fill: 'binders' },
          { model: 'roundTable', at: [-6.5, 5.5], chairs: 4 },
          { model: 'roundTable', at: [-2, 5.5], chairs: 4 },
          { model: 'sofa', wall: 'S', along: 5.5 },
          { model: 'sofa', wall: 'S', along: 9.2 },
          { model: 'coffeeTable', at: [5.5, 8.9] },
          { model: 'coffeeTable', at: [9.2, 8.9] },
          { model: 'copier', wall: 'E', along: 6 },
          { model: 'cooler', wall: 'E', along: -6 },
          { model: 'plant', at: [-12.3, -10.3] },
          { model: 'plant', at: [12.4, -10.3] },
          { model: 'plant', at: [-12.3, 10.4] },
          { model: 'plant', at: [3, 10.4] },
          { model: 'plant', at: [12.4, 10.4] },
        ],
      },
      {
        area: 'design', // Design · 26 × 20 m: estações na parede, mesa de criação e duas ilhas
        items: [
          { model: 'workstation', wall: 'W', along: -5.4, owner: 'Pietro Macedo', role: 'Design', screen: 'design', big: true, tablet: true, main: true },
          { model: 'workstation', wall: 'W', along: -1.8, owner: 'Ana Clara', role: 'Design', screen: 'design', big: true, tablet: true },
          { model: 'workstation', wall: 'W', along: 1.8, owner: 'Rayssa', role: 'Design', dual: true, screen: 'design', screen2: 'sap', tablet: true },
          { model: 'workstation', wall: 'W', along: 5.4, screen: 'design', big: true, tablet: true },
          { model: 'workTable', at: [-3.5, 0], rot: 90, chairs: 4 },
          { model: 'pod', at: [4.5, -5.5], seats: [{ screen: 'design' }, { screen: 'sap' }, { screen: 'design' }, { screen: 'design' }] },
          { model: 'pod', at: [4.5, 5.5], seats: [{ screen: 'sap' }, { screen: 'design' }, { screen: 'design' }, { screen: 'sap' }] },
          { model: 'board', wall: 'N', along: -4, y: 1.0, w: 3.0, h: 1.4, kind: 'moodboard' },
          { model: 'shelf', wall: 'N', along: 0.5, fill: 'toys' },
          { model: 'shelf', wall: 'N', along: 2.5, fill: 'toys' },
          { model: 'shelf', wall: 'S', along: -4, fill: 'toys' },
          { model: 'shelf', wall: 'S', along: -2, fill: 'toys', minifig: true },
          { model: 'board', wall: 'S', along: 2.5, y: 0.9, w: 3.0, h: 1.3, kind: 'moodboard', variant: 1 },
          { model: 'plant', at: [-12.3, -9.4] },
          { model: 'plant', at: [12.4, -9.4] },
          { model: 'plant', at: [-12.3, 9.4] },
          { model: 'plant', at: [12.4, 9.4] },
        ],
      },
      {
        area: 'modelagem', // Modelagem 3D · 26 × 16 m: estações, impressoras 3D e protótipos
        items: [
          { model: 'workstation', wall: 'W', along: -4, owner: 'Pedro Zanella', role: 'Modelagem 3D', dual: true, screen: 'cad', screen2: 'sap', main: true },
          { model: 'workstation', wall: 'W', along: 0, label: 'Estação de render', screen: 'cad' },
          { model: 'workstation', wall: 'W', along: 4, dual: true, screen: 'cad', screen2: 'sap' },
          { model: 'printerBench', wall: 'N', along: -5.5, printers: 3 },
          { model: 'printerBench', wall: 'N', along: -1.5, printers: 3 },
          { model: 'workTable', at: [1, 1.8], chairs: 4 },
          { model: 'pod', at: [6.5, -5], seats: [{ screen: 'cad' }, { screen: 'sap' }] },
          { model: 'shelf', wall: 'S', along: -4.5, fill: 'toys', minifig: true },
          { model: 'shelf', wall: 'S', along: -2.5, fill: 'filament' },
          { model: 'shelf', wall: 'S', along: -0.5, fill: 'toys' },
          { model: 'board', wall: 'S', along: 4, y: 0.9, w: 3.0, h: 1.3, kind: 'kanban', variant: 1 },
          { model: 'plant', at: [-12.3, 7.4] },
          { model: 'plant', at: [12.4, -7.4] },
          { model: 'plant', at: [12.4, 7.4] },
        ],
      },
      {
        area: 'pcp', // PCP · 26 × 16 m: estações, sala de reunião com painel e quadro do plano
        items: [
          { model: 'workstation', wall: 'W', along: -4, owner: 'Galdino', role: 'Planejamento e PCP', dual: true, screen: 'pcp', screen2: 'sap', main: true },
          { model: 'workstation', wall: 'W', along: 0, owner: 'Valdecir', role: 'Gerente PCP', dual: true, screen: 'sap', screen2: 'pcp' },
          { model: 'workstation', wall: 'W', along: 4, screen: 'pcp' },
          { model: 'meetingTable', at: [2.5, 0], chairs: 6 },
          { model: 'pod', at: [-5, 5], seats: [{ screen: 'pcp' }, { screen: 'sap' }] },
          { model: 'pod', at: [-5, -5], seats: [{ screen: 'sap' }, { screen: 'pcp' }] },
          { model: 'tv', wall: 'N', along: 2.5, y: 1.2, w: 1.8, h: 1.0, kind: 'dashboard' },
          { model: 'board', wall: 'S', along: 2.5, y: 0.9, w: 3.0, h: 1.3, kind: 'plan' },
          { model: 'shelf', wall: 'N', along: 6.5, fill: 'binders' },
          { model: 'shelf', wall: 'S', along: 6.5, fill: 'binders' },
          { model: 'copier', wall: 'E', along: 5 },
          { model: 'plant', at: [-12.3, 7.4] },
          { model: 'plant', at: [12.4, -7.4] },
          { model: 'plant', at: [12.4, 7.4] },
        ],
      },
      {
        area: 'suporte', // Suporte · 26 × 16 m: balcão de chamados, servidores e bancada de reparo
        items: [
          { model: 'racks', wall: 'N', along: -7, n: 4 },
          { model: 'racks', wall: 'N', along: -2.5, n: 4 },
          { model: 'workstation', wall: 'W', along: -2.4, label: 'Estação livre', screen: 'sap' },
          { model: 'workstation', wall: 'W', along: 1.2, owner: 'Letícia Nunes', role: 'Suporte', dual: true, screen: 'tickets', screen2: 'sap', main: true },
          { model: 'workstation', wall: 'W', along: 4.8, label: 'Monitoramento', dual: true, screen: 'infra', screen2: 'tickets' },
          { model: 'pod', at: [2.5, 3.5], seats: [{ screen: 'tickets' }, { screen: 'sap' }] },
          { model: 'helpdesk', at: [8.5, -3.5], rot: 90 },
          { model: 'repairBench', wall: 'S', along: -4.5 },
          { model: 'shelf', wall: 'S', along: -1.8, fill: 'boxes' },
          { model: 'shelf', wall: 'S', along: 0.2, fill: 'boxes' },
          { model: 'cooler', wall: 'E', along: 5 },
          { model: 'plant', at: [-12.3, 7.2] },
          { model: 'plant', at: [12.4, 7.2] },
          { model: 'plant', at: [12.4, -7.4] },
        ],
      },
      {
        area: 'corredor-ti',
        items: [
          { model: 'plant', at: [-1.5, 43.9] },
          { model: 'plant', at: [-1.5, -43.9] },
          { model: 'cooler', wall: 'E', along: 32 },
        ],
      },
    ],
  };
})();
