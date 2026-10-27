/*
 * Mobília fora da TI (RH, ADM, salas da Produção e logística), no mesmo formato de js/config/ti.js
 * (wall + along, ou at + rot; medidas em metros a partir do centro da sala).
 * Toda estação de trabalho ('workstation' ou 'pod') vira um PC que abre o SAP.
 * Corredores que ficam livres na logística: do portão do corredor até a doca (dx −2 a 2) e entre as salas (dz −2,5 a 2,5).
 */
(function () {
  const MT = (window.MT = window.MT || {});

  MT.MOBILIA = {
    rooms: [
      {
        area: 'rh', // RH · 26 × 45 m · porta na parede oeste (W), no centro
        items: [
          { model: 'pod', at: [-4, -8], chair: 'wine', seats: [
            { owner: 'Neon Gustavo', role: 'RH', dual: true, screen: 'rh', screen2: 'sap', main: true },
            { owner: 'Gabriel da Rosa', role: 'RH', dual: true, screen: 'sap', screen2: 'rh' },
            { owner: 'Ana Karolina', role: 'Gerente de Comunicação', dual: true, screen: 'sap', screen2: 'rh' },
            { label: 'Recrutamento', screen: 'rh' },
          ] },
          { model: 'pod', at: [4, -8], chair: 'wine', seats: [{ label: 'Folha de pagamento', screen: 'sap' }, { screen: 'rh' }, { screen: 'rh' }, { screen: 'sap' }] },
          { model: 'pod', at: [-4, 8], chair: 'wine', seats: [{ label: 'Treinamentos', screen: 'rh' }, { screen: 'sap' }, { screen: 'sap' }, { screen: 'rh' }] },
          { model: 'pod', at: [4, 8], chair: 'wine', seats: [{ screen: 'sap' }, { screen: 'rh' }, { screen: 'rh' }, { screen: 'sap' }] },
          { model: 'meetingTable', at: [7.5, 15], chairs: 6, chair: 'wine' },
          { model: 'board', wall: 'E', along: -8, y: 0.9, w: 3.0, h: 1.3, kind: 'plan' },
          { model: 'shelf', wall: 'N', along: -5, fill: 'binders' },
          { model: 'shelf', wall: 'N', along: -3, fill: 'binders' },
          { model: 'shelf', wall: 'S', along: 2, fill: 'binders' },
          { model: 'shelf', wall: 'S', along: 4, fill: 'boxes' },
          { model: 'sofa', wall: 'W', along: 7 },
          { model: 'coffeeTable', at: [-10.9, 7], rot: 90 },
          { model: 'cooler', wall: 'W', along: -6 },
          { model: 'copier', wall: 'E', along: 12 },
          { model: 'plant', at: [-12.4, -21.8] },
          { model: 'plant', at: [12.3, -21.8] },
          { model: 'plant', at: [-12.4, 21.9] },
          { model: 'plant', at: [12.3, 21.9] },
          { model: 'plant', at: [-12.4, 3] },
        ],
      },
      {
        area: 'adm', // ADM · 26 × 45 m · porta na parede oeste (W), no centro · gerência no fundo, reuniões ao lado
        items: [
          { model: 'workstation', at: [-8, -18], owner: 'Arthur', role: 'ADM · Gerência', dual: true, screen: 'sap', screen2: 'financeiro', chair: 'wine' },
          { model: 'workstation', at: [-3.6, -18], owner: 'Talles', role: 'ADM · Gerência', dual: true, screen: 'financeiro', screen2: 'sap', chair: 'wine' },
          { model: 'shelf', wall: 'N', along: -8, fill: 'binders' },
          { model: 'shelf', wall: 'N', along: -3.6, fill: 'binders' },
          { model: 'meetingTable', at: [7.5, -16], w: 4, d: 1.4, chairs: 8, chair: 'wine' },
          { model: 'tv', wall: 'E', along: -16, y: 1.1, w: 2.2, h: 1.24, kind: 'financeiro' },
          { model: 'pod', at: [-4, -7], chair: 'wine', seats: [
            { label: 'Compras', screen: 'sap' }, { label: 'Contas a pagar', screen: 'financeiro' },
            { label: 'Contas a receber', screen: 'financeiro' }, { label: 'Faturamento', screen: 'sap' },
          ] },
          { model: 'pod', at: [5, -7], chair: 'wine', seats: [{ label: 'Fiscal', screen: 'sap' }, { screen: 'financeiro' }, { screen: 'sap' }, { label: 'Contabilidade', screen: 'financeiro' }] },
          { model: 'pod', at: [-4, 7], chair: 'wine', seats: [{ label: 'Custos', screen: 'financeiro' }, { screen: 'sap' }, { screen: 'sap' }, { screen: 'financeiro' }] },
          { model: 'pod', at: [5, 7], chair: 'wine', seats: [{ label: 'Jurídico', screen: 'sap' }, { screen: 'financeiro' }, { screen: 'sap' }, { screen: 'sap' }] },
          { model: 'pod', at: [-4, 15], chair: 'wine', seats: [{ label: 'Departamento Pessoal', screen: 'sap' }, { screen: 'sap' }, { screen: 'financeiro' }, { screen: 'sap' }] },
          { model: 'pod', at: [5, 15], chair: 'wine', seats: [{ label: 'Comercial', screen: 'sap' }, { screen: 'financeiro' }, { screen: 'sap' }, { label: 'Atendimento', screen: 'sap' }] },
          { model: 'workstation', at: [-9.5, 3.5], rot: 90, label: 'Recepção do ADM', screen: 'sap', chair: 'wine' },
          { model: 'board', wall: 'E', along: 7, y: 0.9, w: 3.0, h: 1.3, kind: 'plan' },
          { model: 'shelf', wall: 'S', along: -4, fill: 'binders' },
          { model: 'shelf', wall: 'S', along: -2, fill: 'boxes' },
          { model: 'roundTable', at: [9.5, 19.5], chairs: 4, chair: 'wine' },
          { model: 'sofa', wall: 'W', along: -7 },
          { model: 'coffeeTable', at: [-10.9, -7], rot: 90 },
          { model: 'cooler', wall: 'W', along: 6 },
          { model: 'copier', wall: 'E', along: 13 },
          { model: 'copier', wall: 'N', along: 2 },
          { model: 'plant', at: [-12.4, -21.8] },
          { model: 'plant', at: [12.3, -21.8] },
          { model: 'plant', at: [-12.4, 21.9] },
          { model: 'plant', at: [12.3, 21.9] },
          { model: 'plant', at: [-12.4, -3] },
        ],
      },
      // Salas da Produção · 13 × 10 m · porta na parede sul (S), no centro: o meio da parede sul fica livre
      {
        area: 'metrologia', // Metrologia e Qualidade (Henry)
        items: [
          { model: 'cmm', at: [-2.2, -1.2] },
          { model: 'workstation', wall: 'N', along: 3.4, owner: 'Henry', role: 'Metrologia e Qualidade', dual: true, screen: 'sap', screen2: 'qualidade', chair: 'red' },
          { model: 'workstation', wall: 'E', along: -1, label: 'Inspeção de lotes', screen: 'qualidade', chair: 'red' },
          { model: 'inspectionBench', wall: 'W', along: 1.6 },
          { model: 'shelf', wall: 'N', along: -5.2 },
          { model: 'shelf', wall: 'N', along: 0.6, fill: 'binders' },
          { model: 'board', wall: 'E', along: 2.6, y: 1.0, w: 2.6, h: 1.1, kind: 'cep' },
          { model: 'roundTable', at: [2.4, 1.8], chairs: 3, chair: 'red' },
          { model: 'extinguisher', wall: 'S', along: -2.4 },
          { model: 'plant', at: [5.8, 4.3] },
        ],
      },
      {
        area: 'laminacao', // Laminação, Refugo e Sucata (Joci / Lucas)
        items: [
          { model: 'laminator', at: [-1.6, -2.9] },
          { model: 'granulator', at: [3.6, -3.4] },
          { model: 'scrapBin', wall: 'W', along: 0.6, kind: 'refugo' },
          { model: 'scrapBin', wall: 'W', along: 1.9, kind: 'sucata' },
          { model: 'scrapBin', wall: 'W', along: 3.2, kind: 'moido' },
          { model: 'workstation', wall: 'E', along: -0.4, owner: 'Joci', role: 'Laminação, Refugo e Sucata', dual: true, screen: 'sap', screen2: 'refugo', chair: 'red' },
          { model: 'workstation', wall: 'E', along: 1.4, owner: 'Lucas', role: 'Laminação, Refugo e Sucata', dual: true, screen: 'refugo', screen2: 'sap', chair: 'red' },
          { model: 'tv', wall: 'N', along: 3.6, y: 1.95, w: 1.4, h: 0.79, kind: 'refugo' },
          { model: 'bigBag', at: [2.3, 3.85] },
          { model: 'bigBag', at: [3.6, 3.85], label: 'MOÍDO ABS · 500 KG' },
          { model: 'extinguisher', wall: 'S', along: -2.4 },
        ],
      },
      {
        area: 'operacao', // Operação das Máquinas (Alisson / Pedro Henrique / Rayanne / Milena) · sala de controle
        items: [
          { model: 'tv', wall: 'N', along: -2.2, y: 1.3, w: 2.0, h: 1.12, kind: 'dashboard' },
          { model: 'tv', wall: 'N', along: 0, y: 1.3, w: 2.0, h: 1.12, kind: 'maquinas' },
          { model: 'tv', wall: 'N', along: 2.2, y: 1.3, w: 2.0, h: 1.12, kind: 'pcp' },
          { model: 'workstation', at: [-2.4, -1.4], owner: 'Alisson', role: 'Gerente de Produção', dual: true, screen: 'sap', screen2: 'maquinas', chair: 'red' },
          { model: 'workstation', at: [-0.8, -1.4], owner: 'Pedro Henrique', role: 'Operação das Máquinas', dual: true, screen: 'maquinas', screen2: 'sap', chair: 'red' },
          { model: 'workstation', at: [0.8, -1.4], owner: 'Rayanne', role: 'Operação das Máquinas', dual: true, screen: 'sap', screen2: 'maquinas', chair: 'red' },
          { model: 'workstation', at: [2.4, -1.4], owner: 'Milena', role: 'Operação das Máquinas', dual: true, screen: 'maquinas', screen2: 'sap', chair: 'red' },
          { model: 'meetingTable', at: [-3.6, 2.9], w: 2.4, d: 1.0, chairs: 4, chair: 'red' },
          { model: 'board', wall: 'E', along: 1.5, y: 1.0, w: 2.6, h: 1.1, kind: 'turnos' },
          { model: 'shelf', wall: 'E', along: -3.4, fill: 'binders' },
          { model: 'cooler', wall: 'W', along: -2.5 },
          { model: 'extinguisher', wall: 'S', along: 2.4 },
          { model: 'plant', at: [5.8, 4.3] },
        ],
      },
      {
        area: 'manutencao', // Manutenção e Segurança do Trabalho (terceirizado)
        items: [
          { model: 'toolBench', wall: 'N', along: -3.4 },
          { model: 'toolChest', wall: 'N', along: -0.9 },
          { model: 'shelf', wall: 'N', along: 1.6, fill: 'boxes' },
          { model: 'shelf', wall: 'N', along: 3.6, fill: 'boxes' },
          { model: 'palletRack', wall: 'E', along: -2.6, bays: 1 },
          { model: 'workstation', wall: 'E', along: 1.8, label: 'Manutenção · Terceirizado', dual: true, screen: 'manutencao', screen2: 'sap', chair: 'red' },
          { model: 'epiCabinet', wall: 'W', along: -2.2 },
          { model: 'board', wall: 'W', along: 1.4, y: 1.0, w: 2.6, h: 1.1, kind: 'seguranca' },
          { model: 'firstAid', wall: 'W', along: 3.6 },
          { model: 'ladder', at: [1.6, -2.6], rot: 20 },
          { model: 'extinguisher', wall: 'S', along: 2.4 },
        ],
      },
      {
        area: 'recebimento', // Recebimento (Flávia) · doca no fundo (N) · posto da Flávia junto à placa, no centro da sala
        items: [
          { model: 'workstation', at: [4.2, 3.2], rot: -90, owner: 'Flávia Luhiza', role: 'Recebimento', dual: true, screen: 'sap', screen2: 'tickets', main: true },
          { model: 'workstation', at: [4.2, -3.2], rot: -90, label: 'Conferência de NF', screen: 'sap' },
          { model: 'palletRack', wall: 'W', along: -10, bays: 2 },
          { model: 'palletRack', wall: 'W', along: 10, bays: 2 },
          { model: 'palletRack', wall: 'E', along: -10, bays: 2 },
          { model: 'palletRack', wall: 'E', along: 10, bays: 2 },
          { model: 'pallet', at: [-3.8, -14.5], layers: 3 },
          { model: 'pallet', at: [-3.8, -12.2], layers: 2 },
          { model: 'pallet', at: [3.8, -14.5], layers: 3, wrap: true },
          { model: 'pallet', at: [3.8, -12.2], layers: 1 },
          { model: 'pallet', at: [-4, 15.5], layers: 2 },
        ],
      },
      {
        area: 'almoxarifado', // Almoxarifado · porta-paletes nas paredes e estantes de aço no meio
        items: [
          { model: 'palletRack', wall: 'W', along: -10.5, bays: 3 },
          { model: 'palletRack', wall: 'W', along: 9.5, bays: 3 },
          { model: 'palletRack', wall: 'E', along: -10.5, bays: 3 },
          { model: 'palletRack', wall: 'E', along: 9.5, bays: 3 },
          { model: 'shelf', at: [-2.8, -12.6], rot: 90, fill: 'boxes' },
          { model: 'shelf', at: [-2.8, -10.7], rot: 90, fill: 'boxes' },
          { model: 'shelf', at: [-2.8, -8.8], rot: 90, fill: 'binders' },
          { model: 'shelf', at: [2.8, -12.6], rot: -90, fill: 'boxes' },
          { model: 'shelf', at: [2.8, -10.7], rot: -90, fill: 'binders' },
          { model: 'shelf', at: [2.8, -8.8], rot: -90, fill: 'boxes' },
          { model: 'shelf', at: [-2.8, 8.8], rot: 90, fill: 'boxes' },
          { model: 'shelf', at: [-2.8, 10.7], rot: 90, fill: 'boxes' },
          { model: 'shelf', at: [2.8, 8.8], rot: -90, fill: 'boxes' },
          { model: 'shelf', at: [2.8, 10.7], rot: -90, fill: 'binders' },
          { model: 'pallet', at: [-3.6, 15.6], layers: 2 },
          { model: 'pallet', at: [3.6, 15.6], layers: 3 },
        ],
      },
      {
        area: 'estoque', // Estoque · fileiras de porta-paletes com corredores e empilhadeira
        items: [
          { model: 'palletRack', wall: 'W', along: -10.5, bays: 3 },
          { model: 'palletRack', wall: 'W', along: 9.5, bays: 3 },
          { model: 'palletRack', wall: 'E', along: -10.5, bays: 3 },
          { model: 'palletRack', wall: 'E', along: 9.5, bays: 3 },
          { model: 'palletRack', at: [-4.2, -10.5], rot: 90, bays: 3 },
          { model: 'palletRack', at: [-3.05, -10.5], rot: -90, bays: 3 },
          { model: 'palletRack', at: [3.05, -10.5], rot: 90, bays: 3 },
          { model: 'palletRack', at: [4.2, -10.5], rot: -90, bays: 3 },
          { model: 'palletRack', at: [-4.2, 9.5], rot: 90, bays: 3 },
          { model: 'palletRack', at: [-3.05, 9.5], rot: -90, bays: 3 },
          { model: 'palletRack', at: [3.05, 9.5], rot: 90, bays: 3 },
          { model: 'palletRack', at: [4.2, 9.5], rot: -90, bays: 3 },
          { model: 'forklift', at: [0, -9], rot: 0, load: true },
          { model: 'pallet', at: [-3.5, 16], layers: 3 },
          { model: 'pallet', at: [3.5, 16], layers: 2 },
        ],
      },
      {
        area: 'expedicao', // Expedição · pallets embalados esperando o caminhão na doca
        items: [
          { model: 'palletRack', wall: 'W', along: -10, bays: 2 },
          { model: 'palletRack', wall: 'W', along: 10, bays: 2, wrap: true },
          { model: 'palletRack', wall: 'E', along: -10, bays: 2, wrap: true },
          { model: 'palletRack', wall: 'E', along: 10, bays: 2 },
          { model: 'pallet', at: [-3.8, -14.5], layers: 3, wrap: true },
          { model: 'pallet', at: [-3.8, -12.2], layers: 3, wrap: true },
          { model: 'pallet', at: [3.8, -14.5], layers: 2, wrap: true },
          { model: 'pallet', at: [3.8, -12.2], layers: 3, wrap: true },
          { model: 'forklift', at: [3.8, -7.5], rot: 180 },
          { model: 'workTable', at: [-4, 5], rot: 90, chairs: 0 },
          { model: 'pallet', at: [3.8, 15], layers: 2 },
        ],
      },
    ],
  };
})();
