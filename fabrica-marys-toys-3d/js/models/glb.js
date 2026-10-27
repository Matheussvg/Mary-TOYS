/*
 * Leitura de modelos .glb com o GLTFLoader do three.js r128 (js/lib/GLTFLoader.js).
 * O r128 não conhece duas extensões usadas pelos GLB exportados pelo three.js mais novo; elas são tratadas aqui:
 *   EXT_mesh_gpu_instancing         (obrigatória) a mesma peça repetida muitas vezes vira um InstancedMesh
 *   KHR_materials_emissive_strength intensidade do brilho dos materiais
 * Os GLB ficam embutidos em base64 (js/config/*.glb.js) para o jogo funcionar também abrindo o index.html direto do computador.
 */
(function () {
  const MT = (window.MT = window.MT || {});
  MT.GLB = MT.GLB || {};

  class MeshGpuInstancing {
    constructor(parser) {
      this.name = 'EXT_mesh_gpu_instancing';
      this.parser = parser;
    }

    createNodeMesh(nodeIndex) {
      const parser = this.parser;
      const nodeDef = parser.json.nodes[nodeIndex];
      const ext = nodeDef.extensions && nodeDef.extensions[this.name];
      if (!ext || nodeDef.mesh === undefined) return null;
      const keys = Object.keys(ext.attributes);
      const pending = keys.map((k) => parser.getDependency('accessor', ext.attributes[k]));
      pending.push(parser.createNodeMesh(nodeIndex));
      return Promise.all(pending).then((results) => {
        const node = results.pop();
        const attr = {};
        keys.forEach((k, i) => { attr[k] = results[i]; });
        const count = results[0].count;
        const m = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3();
        const make = (mesh) => {
          const im = new THREE.InstancedMesh(mesh.geometry, mesh.material, count);
          for (let i = 0; i < count; i++) {
            const T = attr.TRANSLATION, R = attr.ROTATION, S = attr.SCALE;
            p.set(T ? T.getX(i) : 0, T ? T.getY(i) : 0, T ? T.getZ(i) : 0);
            q.set(R ? R.getX(i) : 0, R ? R.getY(i) : 0, R ? R.getZ(i) : 0, R ? R.getW(i) : 1);
            s.set(S ? S.getX(i) : 1, S ? S.getY(i) : 1, S ? S.getZ(i) : 1);
            im.setMatrixAt(i, m.compose(p, q, s));
          }
          THREE.Object3D.prototype.copy.call(im, mesh, false);
          return im;
        };
        if (!node.isGroup) return make(node);
        const meshes = node.children.slice();
        for (const mesh of meshes) node.remove(mesh);
        meshes.forEach((mesh) => node.add(make(mesh)));
        return node;
      });
    }
  }

  class EmissiveStrength {
    constructor(parser) {
      this.name = 'KHR_materials_emissive_strength';
      this.parser = parser;
    }

    extendMaterialParams(materialIndex, params) {
      const def = this.parser.json.materials[materialIndex];
      const ext = def.extensions && def.extensions[this.name];
      if (ext && ext.emissiveStrength !== undefined) params.emissiveIntensity = ext.emissiveStrength;
      return Promise.resolve();
    }
  }

  // Lê o GLB embutido com esse nome e devolve uma Promise com o resultado do GLTFLoader
  MT.loadGLB = function (name) {
    const b64 = MT.GLB[name];
    if (!b64) return Promise.reject(new Error('Modelo ' + name + ' não encontrado (faltou o js/config/' + name + '.glb.js?)'));
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const loader = new THREE.GLTFLoader();
    loader.register((parser) => new MeshGpuInstancing(parser));
    loader.register((parser) => new EmissiveStrength(parser));
    return new Promise((resolve, reject) => loader.parse(bytes.buffer, '', resolve, reject));
  };
})();
