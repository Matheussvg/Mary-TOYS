# Mary's Toys · Fábrica 3D com SAP

Simulador 3D da fábrica com o SAP da Mery's Toys (ME22N + conferência de pedidos por área) funcionando nos computadores da TI, do RH e do Recebimento, injetoras funcionando na área de produção e a logística com estantes porta-palete.

| Pasta | O que tem |
|---|---|
| `fabrica-marys-toys-3d/` | Simulador 3D (Three.js), sem build: abre direto no navegador |
| `sap/` | SAP: servidor Node (`server.js`), tela (`public/index.html`) e fluxo de aprovação (`public/flow.js`). Detalhes em [`sap/README.md`](sap/README.md) |

## SAP online, o mesmo para todos

Todos os PCs do simulador abrem o **SAP online** (https://merys-toys-conferencia.onrender.com), que guarda os pedidos no Postgres do Render. Assim, quem estiver no simulador, em qualquer computador e até abrindo o `index.html` direto, vê e mexe nos mesmos pedidos e conferências. O endereço fica em `sapUrl`, no arquivo `fabrica-marys-toys-3d/js/config/ti.js`. Deixando vazio, os PCs usam o SAP do próprio servidor (`/sap/`) ou, sem servidor, uma cópia local que não compartilha os dados.

- Precisa de internet para abrir o SAP nos PCs.
- O Render (plano gratuito) desliga o serviço depois de 15 minutos sem uso: o primeiro acesso pode levar até 1 minuto, com a tela "Conectando ao SAP online…".
- O SAP online é publicado a partir do repositório **SAP** (branch `master`, pasta `merys-toys-conferencia`). Mudanças na tela do SAP precisam ir para lá também.

## Usar o SAP dentro do simulador

1. Vá até a ala da TI (lado oeste), o RH (lado leste) ou o Recebimento da Flávia (logística), ou use **Ir direto para uma área** no menu.
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
| http://localhost:3000 | Simulador (os PCs abrem o SAP online de `sapUrl`) |
| http://localhost:3000/sap/ | SAP sozinho |

Sem `DATABASE_URL`, os dados ficam em `sap/data.json`.

Também dá para abrir `fabrica-marys-toys-3d/index.html` direto, sem servidor: o jogo inteiro funciona assim, e os PCs abrem o SAP online.

## Publicar no Render

Publicado hoje:

| Serviço no Render | Endereço | De onde vem |
|---|---|---|
| `marys-toys-simulador` | https://marys-toys-simulador.onrender.com | este repositório (branch `claude/clever-ptolemy-nnnat8`), com `SAP_URL` apontando para o SAP online |
| `merys-toys-conferencia` | https://merys-toys-conferencia.onrender.com | repositório SAP (branch `master`), com o Postgres `merys-toys-db` |

Com a variável `SAP_URL`, o servidor deste repositório só publica o simulador: `/sap` leva para o SAP online e a API dele fica desligada, para existir um SAP só. Os dois serviços publicam sozinhos a cada push no branch configurado. Se este branch for juntado ao `master`, troque o branch do `marys-toys-simulador` em **Settings → Build & Deploy**.

Para publicar tudo num serviço só (simulador + SAP + banco), o `render.yaml` da raiz cria o serviço web e o banco Postgres (**New → Blueprint**). Se preferir criar o Web Service à mão: deixe **Root Directory** vazio, Build `npm install`, Start `npm start`, e configure as variáveis descritas em [`sap/README.md`](sap/README.md).

O deploy deu certo se o log terminar com `rodando na porta … (Postgres) · simulador em / e SAP em /sap/`.

## Área de produção (Injetoras)

As injetoras são o modelo `fabrica-marys-toys-3d/assets/fabrica-blocos.glb`: 8 máquinas em duas fileiras, viradas para o corredor do meio, com corredores livres entre a recepção, a Passagem e as portas laterais. Elas funcionam o tempo todo: engrenagens girando, molde fechando e abrindo, atuador injetando, misturador e grânulos girando no funil, ponteiros dos manômetros e um bloco colorido saindo pela esteira a cada 6 segundos para a caixa ao lado. Cada máquina tem faixa amarela de segurança no piso e não deixa o jogador atravessar.

- Posição de cada máquina, cores dos blocos e tempo do ciclo: `js/config/producao.js`.
- Montagem e animação: `js/world/producao.js`. As 8 máquinas são desenhadas juntas (cada peça vira uma malha repetida), então pesam quase o mesmo que uma.
- O GLB é lido com o GLTFLoader do three.js r128 (`js/lib/GLTFLoader.js`) mais `js/models/glb.js`, que trata as extensões do arquivo. Ele fica embutido em `js/config/fabrica-blocos.glb.js` para o jogo funcionar abrindo o `index.html` direto; para trocar o modelo, veja as instruções no começo desse arquivo.

## Logística

Almoxarifado, Recebimento, Estoque e Expedição têm estantes porta-palete com pallets e caixas, pallets soltos perto das docas (embalados na Expedição) e empilhadeiras no Estoque e na Expedição. Os corredores entre o portão e a doca e entre as salas ficam livres. Os modelos ficam em `js/models/logistica.js` e a posição de cada item em `js/config/mobilia.js`.

## Mobília das salas

Cada sala é montada a partir de `fabrica-marys-toys-3d/js/config/ti.js` (TI) e `js/config/mobilia.js` (RH, Recebimento e logística), com os modelos 3D de `js/models/`:

| Arquivo | Para quê |
|---|---|
| `js/config/ti.js` | O que vai em cada sala da TI e onde (encostado numa parede ou a partir do centro da sala), e o endereço do SAP |
| `js/config/mobilia.js` | O mesmo para o RH, o Recebimento e as salas da logística |
| `js/models/office.js` | Modelos: estação de trabalho, ilha de mesas, mesas, estante, quadro, TV, sofá, plantas, racks, balcão de suporte, bancada com impressoras 3D |
| `js/models/screens.js` | O que aparece nas telas: SAP, código, design, CAD, plano do PCP, chamados, servidores e quadros |
| `js/models/logistica.js` | Modelos: estante porta-palete, pallet com caixas e empilhadeira |
| `js/world/mobilia.js` | Monta as salas, cria as colisões e registra cada tela de PC como computador clicável |
| `js/ui/computer.js` | Mira na tela, close-up até o monitor e o SAP sobre a tela |
| `js/player/avatar.js` | Personagem montado a partir da skin, com animação e o nome acima da cabeça |

| Sala | O que tem |
|---|---|
| Desenvolvimento do Software | 3 ilhas com 12 PCs (Matheus Fortunato e Eduarda Tomaz na primeira), quadros kanban, painel de deploy, estantes, mesas redondas e sofás |
| Design | 4 estações com mesa digitalizadora (Pietro, Ana Clara, Rayssa), mesa de criação, 2 ilhas, quadros de referências e estantes de protótipos |
| Modelagem 3D | 3 estações (Pedro Zanella), 6 impressoras 3D imprimindo, mesa de protótipos e estantes de filamento |
| PCP | Estações de Galdino e Valdecir, 2 ilhas, mesa de reunião com painel de indicadores e quadro do plano de produção |
| Suporte | Balcão de chamados, 8 racks de servidores com LEDs, estações (Letícia Nunes e monitoramento) e bancada de reparo |
| RH | 4 ilhas com 16 PCs (Neon Gustavo, Gabriel da Rosa e Ana Karolina na primeira), mesa de reunião, arquivos, sofá de espera e quadro |
| Recebimento | Posto da Flávia Luhiza (2 telas) e posto de conferência de NF junto à placa da sala, porta-paletes e pallets chegando pela doca |

Para colocar mais um PC, acrescente na sala um item `{ model: 'workstation', wall: 'W', along: 2, owner: 'Nome', screen: 'sap' }`. Toda tela de estação de trabalho abre o SAP.
