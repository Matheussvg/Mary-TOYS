/*
 * Mobília fora da TI, no mesmo formato de js/config/ti.js (wall + along, ou at + rot; medidas em metros a partir do centro da sala).
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
