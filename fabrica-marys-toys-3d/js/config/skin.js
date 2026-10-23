/*
 * Skin do personagem (PNG de Minecraft 64 × 64). Fica embutida aqui para funcionar também abrindo o
 * index.html direto do computador: o navegador não deixa o WebGL usar imagens soltas de arquivos locais.
 * Original: assets/personagem.png. Para trocar a skin, substitua o PNG, rode no PowerShell (dentro desta pasta)
 *   [Convert]::ToBase64String([IO.File]::ReadAllBytes("assets\personagem.png")) | Set-Clipboard
 * e cole o resultado no lugar do texto depois de "base64," (até a aspa).
 */
(function () {
  const MT = (window.MT = window.MT || {});
  MT.SKIN = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAACVklEQVR4nO2aMUvDQBTHr9KiCCIFR3GyQzZFKC20k/Q7SEEhYynkAziUToIdu3S8oSBO7g5OdaoUxwgtqAULYhcX0UF0KIlN2rzLebm8hNxvSZPcXf795727I3cpwqCs7f6wykD0zFFKpL5sVrAFYKMMwBaAjTIAWwA2ygBsAdikb850cJxvdntgA83jMny/S8D2secJiY+AxBuQ9lPIK8xZ6REHfEVAsd4grUnJPm9NSqRYb0gTFSYpVicom8NTGp9OcDiekuF4KksLCr76AIvczpYsHWgshJ+2q4EpYY5MMGTb23D9+68PUBB9e+Zq390eq76bxA+DygBsAdik3Dnf72iOAvmaCTZQeHfmYPvi4O8kdzQ7Di/tS0Z14Ci/v7oOtq9TDbzPYqNyBfYJC6PAyfkneXh6FHoo1Wem6beu83/8GauuLGKXAqIR4YZrHsDNXOhHFakG8Iav9XZlh/08UlPA+kN+wlanGjGqA2JUB4GHOYRUA6w3GeYb5UVuH8AB1U17CA3TMKkG6FQjVDftI4tlZZalA0+KGBX4uels5ttx4fVlRLIZ3+2DBJEC/bvNYMR4EHgE5GsmIWuz39as0ppNdmomKQT9QEFiNxFSKBSKSHPd3PP8JgjdwyLxo4AyAFsANsoAbAHYKAOwBWCjDMAWgI2UL0JRnPEpPAh8e0rQ+wtE1/9ZJL4PUAZgC8BGOJ9E9xe4y/PCWv9nEfgwyLu/AHvZLHIpEObCKCERNCBslAHYArBRBmALwAZ9g4Ts9X8WwgaI7i+Qvf7PIvEpkHgDfgHnnKrTlBZWSAAAAABJRU5ErkJggg==';
})();
