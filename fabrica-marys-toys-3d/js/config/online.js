/*
 * Jogadores online: quem entra no simulador aparece para os outros (personagem e nome).
 * Aberto pelo servidor (Render ou npm start), o jogo usa o próprio endereço. Aberto direto do arquivo,
 * conecta neste servidor, que é o simulador publicado no Render.
 */
(function () {
  const MT = (window.MT = window.MT || {});

  MT.ONLINE = {
    servidor: 'https://marys-toys-simulador.onrender.com',
  };
})();
