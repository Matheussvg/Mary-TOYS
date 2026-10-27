/*
 * Área de produção (Injetoras): injetoras de blocos do modelo assets/fabrica-blocos.glb.
 * Cada máquina: centro (x, z) em metros na planta e rot em graus (0 = frente com os manômetros virada para +z,
 * esteira de saída para −x; 180 = frente para −z, esteira para +x).
 * Corredores livres: central (x de −7 a 7, da recepção até a Passagem) e transversal (z ≈ −25, portas laterais).
 */
(function () {
  const MT = (window.MT = window.MT || {});

  MT.PRODUCAO = {
    modelo: 'fabrica-blocos',
    ciclo: 6, // segundos para injetar um bloco
    cores: ['#c0161d', '#f4c51c', '#2a4b9b', '#1f6b3a', '#e86f1c', '#f6f3ea'], // cores dos blocos que saem na esteira
    maquinas: [
      // fileira da frente (perto da recepção), virada para o corredor transversal
      { x: -21, z: -18, rot: 180 },
      { x: -10.5, z: -18, rot: 180 },
      { x: 10.5, z: -18, rot: 180 },
      { x: 21, z: -18, rot: 180 },
      // fileira do fundo (perto das salas da Produção), virada para o mesmo corredor
      { x: -21, z: -32, rot: 0 },
      { x: -10.5, z: -32, rot: 0 },
      { x: 10.5, z: -32, rot: 0 },
      { x: 21, z: -32, rot: 0 },
    ],
  };
})();
