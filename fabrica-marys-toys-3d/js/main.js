/* Inicialização: renderizador, luz de fim de tarde, montagem do mundo e laço principal. */
(async function () {
  const MT = window.MT;
  const $ = (id) => document.getElementById(id);
  const status = $('load-status');
  const showError = (msg) => {
    status.textContent = 'Erro: ' + msg;
    $('overlay').hidden = false;
  };
  addEventListener('error', (e) => showError(e.message));
  addEventListener('unhandledrejection', (e) => showError(String(e.reason && e.reason.message || e.reason)));

  if (!window.THREE) {
    status.textContent = 'Não foi possível carregar o Three.js. Verifique se a pasta js/lib está junto do index.html.';
    return;
  }

  // Espera as fontes para que placas e letreiros saiam com a tipografia certa
  status.textContent = 'Carregando fontes…';
  try {
    await Promise.race([
      Promise.all([
        document.fonts.load('400 64px "Alfa Slab One"'),
        document.fonts.load('700 64px "Barlow Condensed"'),
        document.fonts.load('600 64px "Barlow Condensed"'),
        document.fonts.load('500 32px "Barlow"'),
      ]),
      new Promise((r) => setTimeout(r, 3500)),
    ]);
  } catch (_) { /* segue com as fontes reserva */ }

  status.textContent = 'Montando a fábrica…';
  await new Promise((r) => setTimeout(r, 30));

  const stage = $('stage');
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75));
  renderer.setSize(stage.clientWidth, stage.clientHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 0.82;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  stage.appendChild(renderer.domElement);
  MT.maxAniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  scene.fog = new THREE.Fog(0xd9b9a0, 160, 600);
  const camera = new THREE.PerspectiveCamera(72, stage.clientWidth / stage.clientHeight, 0.05, 2000);

  // Luz: céu azul + sol baixo dourado vindo da frente, como na foto da fachada
  const hemi = new THREE.HemisphereLight(0xc4d4f2, 0x5a4a3a, 0.3);
  scene.add(hemi);
  const sun = new THREE.DirectionalLight(0xffcf9a, 1.7);
  sun.position.set(-85, 75, 95);
  sun.target.position.set(0, 0, -45);
  sun.castShadow = true;
  const maxTex = renderer.capabilities.maxTextureSize;
  sun.shadow.mapSize.set(Math.min(4096, maxTex), Math.min(4096, maxTex));
  Object.assign(sun.shadow.camera, { left: -150, right: 150, top: 150, bottom: -150, near: 10, far: 420 });
  sun.shadow.bias = -0.0008;
  sun.shadow.normalBias = 0.03;
  scene.add(sun, sun.target);

  MT.buildExterior(scene);
  MT.buildBuilding(scene);
  MT.buildFacade(scene);
  MT.buildTI(scene);

  // Reflexos suaves do céu (IBL) a partir de uma cena pequena com o mesmo degradê
  const pmrem = new THREE.PMREMGenerator(renderer);
  const envScene = new THREE.Scene();
  envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 32, 16), new THREE.MeshBasicMaterial({ map: MT.sky.material.map, side: THREE.BackSide })));
  scene.environment = pmrem.fromScene(envScene, 0.04).texture;

  const player = new MT.Player(camera, renderer.domElement);
  player.teleport(MT.LAYOUT.spawn.x, MT.LAYOUT.spawn.z, MT.LAYOUT.spawn.yaw);
  const hud = new MT.HUD(player);
  const pc = new MT.Computer(camera, player, renderer.domElement);

  // ---- menu / pausa ----
  const overlay = $('overlay');
  const enterBtn = $('enter');
  let suppressPause = false;
  status.textContent = 'Pronto. Clique em “Entrar na fábrica”.';
  enterBtn.disabled = false;
  document.body.classList.add('ready');

  const start = () => {
    overlay.hidden = true;
    player.enabled = true;
    if (!player.drone.on) player.lock();
  };
  const pause = () => {
    player.enabled = false;
    player.keys = {};
    overlay.hidden = false;
    enterBtn.textContent = 'Continuar';
    enterBtn.focus({ preventScroll: true });
  };
  enterBtn.addEventListener('click', start);
  // Clicar na cena volta a prender o mouse (por exemplo, depois de sair do PC com Esc)
  renderer.domElement.addEventListener('click', () => {
    if (player.enabled && !player.locked && !player.drone.on && !pc.busy) player.lock();
  });

  // Atalho do menu: vai direto para o PC principal da TI e abre o SAP
  const openSap = () => {
    const c = MT.computers.find((k) => k.main) || MT.computers[0];
    if (!c) return;
    if (player.drone.on) setDrone(false);
    overlay.hidden = true;
    pc.openNow(c);
  };
  $('go-sap').addEventListener('click', openSap);
  player.onLockChange = (locked) => {
    document.body.classList.toggle('locked', locked);
    if (!locked && player.enabled && !suppressPause) pause();
    suppressPause = false;
  };

  hud.onTeleport = (a) => {
    const [x1, x2, z1, z2] = a.rect;
    if (player.drone.on) setDrone(false);
    // entra pela porta: posiciona perto do lado de acesso, olhando para dentro
    const cx = (x1 + x2) / 2, cz = (z1 + z2) / 2;
    if (a.dept === 'ti') player.teleport(x2 - 1.5, cz, Math.PI / 2);
    else if (a.dept === 'comunicacao') player.teleport(x1 + 1.5, cz, -Math.PI / 2);
    else player.teleport(cx, z2 - 1.5, 0);
    player.pitch = 0.08;
    hud.toast('Você está em: ' + a.name);
    start();
  };

  // ---- teclas de visão ----
  let roofVisible = true;
  const setRoof = (v) => {
    roofVisible = v;
    MT.roof.visible = v;
  };
  const setDrone = (on) => {
    if (on && document.pointerLockElement) {
      suppressPause = true;
      document.exitPointerLock();
    }
    player.setDrone(on);
    MT.roof.visible = on ? false : roofVisible;
    for (const s of MT.signs) s.scale.multiplyScalar(on ? 3 : 1 / 3);
    document.body.classList.toggle('drone', on);
    if (!on && player.enabled) player.lock();
  };

  addEventListener('keydown', (e) => {
    if (e.repeat || pc.busy) return; // no PC as teclas são do SAP
    if (e.code === 'Escape' && !player.locked && player.enabled) { pause(); return; }
    if (!player.enabled) {
      if (e.code === 'Enter') start();
      return;
    }
    if (e.code === 'KeyT') {
      setRoof(!roofVisible);
      if (!player.drone.on) MT.roof.visible = roofVisible;
      hud.toast(roofVisible ? 'Telhado visível' : 'Telhado oculto (luz do sol entra)');
    } else if (e.code === 'KeyV') {
      setDrone(!player.drone.on);
      hud.toast(player.drone.on ? 'Vista aérea' : 'Primeira pessoa');
    } else if (e.code === 'KeyM') {
      const w = $('minimap-wrap');
      w.hidden = !w.hidden;
    } else if (e.code === 'KeyR') {
      player.teleport(MT.LAYOUT.spawn.x, MT.LAYOUT.spawn.z, MT.LAYOUT.spawn.yaw);
      hud.toast('De volta à calçada em frente à fábrica');
    }
  });

  // Atalhos por endereço: index.html#aerea abre na vista aérea, #tour entra direto
  if (location.hash === '#aerea') { start(); setDrone(true); }
  else if (location.hash === '#tour') start();
  else if (location.hash === '#sap') openSap();
  else if (location.hash.startsWith('#area-')) {
    const a = MT.LAYOUT.areas.find((x) => x.id === location.hash.slice(6));
    if (a) hud.onTeleport(a);
  }

  addEventListener('resize', () => {
    const w = stage.clientWidth, h = stage.clientHeight;
    renderer.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    pc.onResize();
  });

  // ---- laço principal ----
  const clock = new THREE.Clock();
  let t = 0;
  renderer.setAnimationLoop(() => {
    const dt = Math.min(clock.getDelta(), 0.05);
    t += dt;
    if (pc.busy) pc.update(dt);
    else {
      player.update(dt, t);
      pc.hoverCheck();
    }
    for (const fn of MT.animators) fn(dt, player, t);
    hud.update();
    if (pc.state !== 'using' || pc.redraw) renderer.render(scene, camera);
    pc.redraw = false;
  });
})();
