# Mary's Toys · Fábrica 3D com SAP

Simulador 3D da fábrica com o SAP da Mery's Toys (ME22N + conferência de pedidos por área) funcionando nos computadores da ala da TI.

| Pasta | O que tem |
|---|---|
| `fabrica-marys-toys-3d/` | Simulador 3D (Three.js), sem build: abre direto no navegador |
| `sap/` | SAP: servidor Node (`server.js`), tela (`public/index.html`) e fluxo de aprovação (`public/flow.js`). Detalhes em [`sap/README.md`](sap/README.md) |

## Usar o SAP dentro do simulador

1. Entre na fábrica e vá até a ala da TI, no lado oeste (ou use **Ir direto para uma área** no menu).
2. Mire na tela de um computador: aparece **Clique para acessar o SAP** com o nome do PC.
3. Clique (ou aperte **E**). A câmera senta na cadeira e se aproxima do monitor, e o SAP abre na tela.
4. **Levantar** (ou **Esc**) volta a andar. O SAP continua aberto: o login e o rascunho da ME22N ficam onde estavam.

Atalhos: o botão **Sentar num PC da TI e abrir o SAP** no menu, ou o endereço `/#sap`.
No celular, o SAP ocupa a tela inteira.

## Personagem e nome do jogador

Antes de entrar, cada pessoa digita o **nome** no menu (obrigatório). Ele fica acima da cabeça do personagem e fica salvo no navegador para a próxima vez.

- O personagem é montado a partir da skin `fabrica-marys-toys-3d/assets/personagem.png` (PNG de Minecraft 64 × 64): cada parte do boneco (cabeça, tronco, braços e pernas, mais a camada externa) recorta a região correspondente da imagem. Todos os jogadores usam essa skin.
- O jogo é em **primeira pessoa**: aparece o braço direito do personagem, como no Minecraft. **F** mostra o personagem de fora (terceira pessoa) e **V** mostra a vista aérea, onde dá para ver o nome.
- O código do personagem fica em `js/player/avatar.js` (`MT.Avatar`): cada novo jogador é um `new MT.Avatar(nome)`, o que já deixa pronto para mais de um usuário.
- Para trocar a skin, substitua o PNG e atualize `js/config/skin.js` (as instruções estão no começo do arquivo). A imagem fica embutida nesse arquivo para o jogo funcionar também abrindo o `index.html` direto do computador.

## Rodar no computador

```
npm install
npm start
```

| Endereço | O que abre |
|---|---|
| http://localhost:3000 | Simulador (os PCs da TI abrem o SAP deste servidor) |
| http://localhost:3000/sap/ | SAP sozinho |

Sem `DATABASE_URL`, os dados ficam em `sap/data.json`.

Também dá para abrir `fabrica-marys-toys-3d/index.html` direto, sem servidor. Nesse caso o SAP abre em modo local: os dados ficam só naquele navegador. Para os PCs usarem o SAP publicado, coloque o endereço dele em `sapUrl` no arquivo `fabrica-marys-toys-3d/js/config/ti.js`.

## Publicar no Render

O `render.yaml` da raiz cria o serviço web e o banco Postgres (**New → Blueprint**). Se preferir criar o Web Service à mão: deixe **Root Directory** vazio, Build `npm install`, Start `npm start`, e configure as variáveis descritas em [`sap/README.md`](sap/README.md).

O deploy deu certo se o log terminar com `rodando na porta … (Postgres) · simulador em / e SAP em /sap/`.

## Mobília da TI

Cada sala da TI é montada a partir de `fabrica-marys-toys-3d/js/config/ti.js`, com os modelos 3D de `js/models/`:

| Arquivo | Para quê |
|---|---|
| `js/config/ti.js` | O que vai em cada sala e onde (encostado numa parede ou a partir do centro da sala) |
| `js/models/office.js` | Modelos: estação de trabalho, ilha de mesas, mesas, estante, quadro, TV, sofá, plantas, racks, balcão de suporte, bancada com impressoras 3D |
| `js/models/screens.js` | O que aparece nas telas: SAP, código, design, CAD, plano do PCP, chamados, servidores e quadros |
| `js/world/ti.js` | Monta as salas, cria as colisões e registra cada tela de PC como computador clicável |
| `js/ui/computer.js` | Mira na tela, close-up até o monitor e o SAP sobre a tela |
| `js/player/avatar.js` | Personagem montado a partir da skin, com animação e o nome acima da cabeça |

| Sala | O que tem |
|---|---|
| Desenvolvimento do Software | 3 ilhas com 12 PCs (Matheus Fortunato e Eduarda Tomaz na primeira), quadros kanban, painel de deploy, estantes, mesas redondas e sofás |
| Design | 4 estações com mesa digitalizadora (Pietro, Ana Clara, Rayssa), mesa de criação, 2 ilhas, quadros de referências e estantes de protótipos |
| Modelagem 3D | 3 estações (Pedro Zanella), 6 impressoras 3D imprimindo, mesa de protótipos e estantes de filamento |
| PCP | Estações de Galdino e Valdecir, 2 ilhas, mesa de reunião com painel de indicadores e quadro do plano de produção |
| Suporte | Balcão de chamados, 8 racks de servidores com LEDs, estações (Letícia Nunes e monitoramento) e bancada de reparo |

Para colocar mais um PC, acrescente na sala um item `{ model: 'workstation', wall: 'W', along: 2, owner: 'Nome', screen: 'sap' }`. Toda tela de estação de trabalho abre o SAP.
