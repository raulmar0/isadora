import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

type Point = readonly [number, number, number];

const palette = {
  limestone: '#eadfc5', edge: '#d5c9ad', ivory: '#fff1cf', cream: '#f6e8ca',
  coral: '#d48768', ochre: '#d8a343', blue: '#245574', teal: '#397570',
  dark: '#244843', tower: '#ac7647', tree: '#728852', leaf: '#879761',
  water: '#81b9c0', waterLight: '#c2dcd4', white: '#fff8e9', trunk: '#8a6651',
};

/** A tiny, handmade francophone world. All of its silhouettes are real geometry. */
export function createWorld(onInvalidate?: () => void) {
  const root = new THREE.Group();
  const materials = new Map<string, THREE.MeshStandardMaterial>();
  const geometries = new Set<THREE.BufferGeometry>();
  const textures = new Set<THREE.Texture>();
  let disposed = false;

  function material(color: string, roughness = 0.86) {
    const key = `${color}:${roughness}`;
    if (!materials.has(key)) materials.set(key, new THREE.MeshStandardMaterial({ color, roughness }));
    return materials.get(key)!;
  }

  function mesh(geometry: THREE.BufferGeometry, color: string, parent: THREE.Object3D, p: Point = [0, 0, 0]) {
    geometries.add(geometry);
    const object = new THREE.Mesh(geometry, material(color));
    object.position.set(...p);
    object.castShadow = true;
    object.receiveShadow = true;
    parent.add(object);
    return object;
  }

  function box(w: number, h: number, d: number, color: string, parent: THREE.Object3D, p: Point, radius = 0.025) {
    return mesh(new RoundedBoxGeometry(w, h, d, 1, Math.min(radius, w / 4, h / 4, d / 4)), color, parent, p);
  }

  function ball(radius: number, color: string, parent: THREE.Object3D, p: Point, scale: Point = [1, 1, 1]) {
    const object = mesh(new THREE.SphereGeometry(radius, 16, 12), color, parent, p);
    object.scale.set(...scale);
    return object;
  }

  function cylinder(top: number, bottom: number, h: number, color: string, parent: THREE.Object3D, p: Point, segments = 24) {
    return mesh(new THREE.CylinderGeometry(top, bottom, h, segments), color, parent, p);
  }

  function beam(from: Point, to: Point, width: number, color: string, parent: THREE.Object3D) {
    const start = new THREE.Vector3(...from);
    const end = new THREE.Vector3(...to);
    const object = cylinder(width, width, start.distanceTo(end), color, parent, [0, 0, 0], 6);
    object.position.copy(start).add(end).multiplyScalar(0.5);
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.sub(start).normalize());
    return object;
  }

  function group(parent: THREE.Object3D, p: Point, rotation = 0) {
    const object = new THREE.Group();
    object.position.set(...p);
    object.rotation.y = rotation;
    parent.add(object);
    return object;
  }

  // A gently bevelled, layered stone plinth gives the miniature a tangible edge.
  const lower = cylinder(3.9, 3.68, 0.29, palette.edge, root, [0, -0.41, 0], 96);
  lower.scale.z = 0.77;
  const rim = cylinder(4.02, 3.92, 0.13, palette.cream, root, [0, -0.21, 0], 96);
  rim.scale.z = 0.77;
  const ground = cylinder(3.97, 4.02, 0.17, palette.limestone, root, [0, -0.075, 0], 96);
  ground.scale.z = 0.77;
  const groundMaterial = material(palette.limestone);
  new THREE.TextureLoader().load(`${import.meta.env.BASE_URL}images/limestone-texture.webp`, (texture) => {
    if (disposed) { texture.dispose(); return; }
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
    texture.repeat.set(2.5, 2.5);
    texture.anisotropy = 4;
    groundMaterial.map = texture;
    groundMaterial.needsUpdate = true;
    textures.add(texture);
    onInvalidate?.();
  }, undefined, () => { /* The scene keeps its warm stone material if the texture is unavailable. */ });

  function lawn(x: number, z: number, sx: number, sz: number) {
    const patch = cylinder(1, 1, 0.045, '#b3bd88', root, [x, 0.035, z], 48);
    patch.scale.set(sx, 1, sz);
    return patch;
  }
  lawn(-1.8, -0.75, 1.25, 1.45);
  lawn(2.5, -1.0, 0.91, 1.05);
  lawn(-2.8, 0.6, 0.65, 0.7);

  // The winding river is a ribbon, inset between two narrow pale stone banks.
  const riverCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-3.69, 0.035, 0.8), new THREE.Vector3(-2.1, 0.035, 1.22),
    new THREE.Vector3(-0.5, 0.035, 1.48), new THREE.Vector3(1.3, 0.035, 1.0),
    new THREE.Vector3(3.65, 0.035, 0.45),
  ]);
  function ribbon(width: number, y: number, color: string) {
    const positions: number[] = [];
    const indices: number[] = [];
    for (let i = 0; i <= 100; i++) {
      const t = i / 100;
      const p = riverCurve.getPoint(t);
      const direction = riverCurve.getTangent(t);
      const taperedWidth = width * (0.7 + 0.3 * Math.pow(Math.sin(Math.PI * t), 0.25));
      const normal = new THREE.Vector3(-direction.z, 0, direction.x).normalize().multiplyScalar(taperedWidth / 2);
      positions.push(p.x + normal.x, y, p.z + normal.z, p.x - normal.x, y, p.z - normal.z);
      if (i < 100) {
        const v = i * 2;
        indices.push(v, v + 2, v + 1, v + 1, v + 2, v + 3);
      }
    }
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    return mesh(geometry, color, root);
  }
  ribbon(0.99, 0.065, '#f9ebcd');
  const river = ribbon(0.79, 0.077, palette.water);
  river.material = material(palette.water, 0.43);
  river.castShadow = false;
  for (let i = 0; i < 12; i++) {
    const t = (i + 0.7) / 13;
    const p = riverCurve.getPoint(t);
    const ripple = box(0.18 + (i % 3) * 0.045, 0.008, 0.012, palette.waterLight, root,
      [p.x, 0.086, p.z + (i % 2 ? 0.13 : -0.17)], 0.006);
    ripple.rotation.y = -0.14;
    ripple.castShadow = false;
  }

  // Bridge with a real open arch, pale parapets and small cut-stone joints.
  const bridge = group(root, [0.52, 0.0, 1.22], 0.18);
  const arch = new THREE.Shape();
  arch.moveTo(-0.89, 0.02);
  arch.lineTo(-0.89, 0.32);
  arch.quadraticCurveTo(0, 0.85, 0.89, 0.32);
  arch.lineTo(0.89, 0.02);
  arch.lineTo(0.62, 0.02);
  arch.quadraticCurveTo(0, 0.60, -0.62, 0.02);
  arch.closePath();
  const archMesh = mesh(new THREE.ExtrudeGeometry(arch, { depth: 0.66, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.025, bevelSegments: 2, steps: 1 }), palette.cream, bridge, [0, 0, 0]);
  archMesh.rotation.y = Math.PI / 2;
  archMesh.position.x = -0.33;
  for (const side of [-1, 1]) {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(side * 0.39, 0.38, -0.88), new THREE.Vector3(side * 0.39, 1.13, 0), new THREE.Vector3(side * 0.39, 0.38, 0.88));
    mesh(new THREE.TubeGeometry(curve, 24, 0.055, 8, false), '#e2d1ac', bridge);
    for (let i = 0; i < 9; i++) {
      const t = i / 8;
      const point = curve.getPoint(t);
      box(0.07, 0.19, 0.085, palette.ivory, bridge, [point.x, point.y - 0.09, point.z], 0.009);
    }
  }

  // Eiffel tower: four flared legs, cross braces, two galleries, and a slender spire.
  const tower = group(root, [-1.31, 0.095, -0.71], -0.02);
  const levels = [
    { y: 0, r: 0.77 }, { y: 0.92, r: 0.46 }, { y: 1.25, r: 0.39 },
    { y: 2.12, r: 0.245 }, { y: 2.37, r: 0.205 }, { y: 3.28, r: 0.075 },
    { y: 3.61, r: 0.042 },
  ];
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    box(0.32, 0.1, 0.32, palette.cream, tower, [sx * 0.77, 0.035, sz * 0.77], 0.025);
    for (let i = 0; i < levels.length - 1; i++) {
      const a = levels[i], b = levels[i + 1];
      beam([sx * a.r, a.y, sz * a.r], [sx * b.r, b.y, sz * b.r], i < 2 ? 0.043 : 0.028, palette.tower, tower);
    }
  }
  for (let level = 0; level < levels.length - 1; level++) {
    const a = levels[level], b = levels[level + 1];
    const divisions = level === 0 ? 3 : level === 2 || level === 4 ? 3 : 1;
    for (let section = 0; section < divisions; section++) {
      const f1 = section / divisions, f2 = (section + 1) / divisions;
      const y1 = THREE.MathUtils.lerp(a.y, b.y, f1), y2 = THREE.MathUtils.lerp(a.y, b.y, f2);
      const r1 = THREE.MathUtils.lerp(a.r, b.r, f1), r2 = THREE.MathUtils.lerp(a.r, b.r, f2);
      // Keep the ground-level arch open, with braces following each leg's taper.
      if (level === 0) {
        for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
          const inset = 0.13;
          beam([sx * r1, y1, sz * r1], [sx * r2, y2, sz * (r2 - inset)], 0.014, palette.tower, tower);
          beam([sx * r1, y1, sz * (r1 - inset)], [sx * r2, y2, sz * r2], 0.014, palette.tower, tower);
        }
      } else {
        for (const side of [-1, 1]) {
          beam([-r1, y1, side * r1], [r2, y2, side * r2], 0.013, palette.tower, tower);
          beam([r1, y1, side * r1], [-r2, y2, side * r2], 0.013, palette.tower, tower);
          beam([side * r1, y1, -r1], [side * r2, y2, r2], 0.013, palette.tower, tower);
          beam([side * r1, y1, r1], [side * r2, y2, -r2], 0.013, palette.tower, tower);
        }
      }
    }
  }
  for (const [y, width] of [[1.04, 1.06], [2.17, 0.64], [3.4, 0.24]]) {
    box(width, 0.09, width, palette.tower, tower, [0, y, 0], 0.012);
    for (const side of [-1, 1]) {
      beam([-width / 2, y + 0.14, side * width / 2], [width / 2, y + 0.14, side * width / 2], 0.018, palette.tower, tower);
      beam([side * width / 2, y + 0.14, -width / 2], [side * width / 2, y + 0.14, width / 2], 0.018, palette.tower, tower);
      for (let p = -3; p <= 3; p++) {
        beam([p * width / 6, y + 0.04, side * width / 2], [p * width / 6, y + 0.14, side * width / 2], 0.009, palette.tower, tower);
      }
    }
  }
  for (const side of [-1, 1]) {
    const curve = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-0.66, 0.17, side * 0.64), new THREE.Vector3(0, 1.32, side * 0.44), new THREE.Vector3(0.66, 0.17, side * 0.64));
    mesh(new THREE.TubeGeometry(curve, 20, 0.03, 6, false), palette.tower, tower);
  }
  cylinder(0.024, 0.055, 0.55, palette.tower, tower, [0, 3.74, 0], 8);
  ball(0.035, palette.ochre, tower, [0, 4.04, 0]);

  function window(parent: THREE.Object3D, x: number, y: number, z: number, shutters = false) {
    box(0.235, 0.36, 0.028, palette.ivory, parent, [x, y, z], 0.016);
    box(0.165, 0.28, 0.028, palette.blue, parent, [x, y, z + 0.018], 0.007);
    box(0.018, 0.28, 0.014, palette.cream, parent, [x, y, z + 0.038], 0.002);
    box(0.18, 0.018, 0.014, palette.cream, parent, [x, y + 0.015, z + 0.038], 0.002);
    box(0.28, 0.047, 0.09, palette.ivory, parent, [x, y - 0.2, z + 0.02], 0.005);
    if (shutters) for (const side of [-1, 1]) {
      box(0.082, 0.29, 0.025, palette.teal, parent, [x + side * 0.152, y, z + 0.026], 0.003);
      for (let i = 0; i < 4; i++) box(0.071, 0.007, 0.015, '#71948a', parent, [x + side * 0.152, y - 0.085 + i * 0.055, z + 0.045], 0.001);
    }
  }

  function building(p: Point, width: number, height: number, color: string, roofColor: string, rotation: number, cafe: boolean) {
    const house = group(root, p, rotation);
    const depth = 0.81;
    box(width, height, depth, color, house, [0, height / 2, 0], 0.04);
    box(width + 0.1, 0.09, depth + 0.09, palette.cream, house, [0, height - 0.035, 0], 0.015);
    box(width + 0.055, 0.13, depth + 0.025, palette.cream, house, [0, 0.08, 0], 0.015);
    const roof = cylinder(0.46, 0.63, 0.46, roofColor, house, [0, height + 0.22, 0], 4);
    roof.rotation.y = Math.PI / 4;
    roof.scale.set((width + 0.1) / 0.89, 1, (depth + 0.12) / 0.89);
    box(width * 0.72, 0.045, depth * 0.71, roofColor, house, [0, height + 0.465, 0], 0.012);
    box(0.11, 0.32, 0.12, palette.coral, house, [width * 0.24, height + 0.5, -0.1], 0.014);
    box(0.145, 0.04, 0.15, palette.ivory, house, [width * 0.24, height + 0.67, -0.1], 0.005);
    const columns = width > 1.05 ? [-0.32, 0.32] : [0];
    for (const x of columns) {
      for (const y of [height - 0.38, height - 0.92]) if (y > 0.74) window(house, x, y, depth / 2 + 0.014, true);
      box(0.225, 0.24, 0.19, palette.cream, house, [x, height + 0.12, depth / 2 - 0.06], 0.01);
      box(0.13, 0.16, 0.023, palette.blue, house, [x, height + 0.125, depth / 2 + 0.048], 0.003);
      box(0.28, 0.045, 0.24, roofColor, house, [x, height + 0.26, depth / 2 - 0.03], 0.01);
    }
    // Side-facing windows stay visible as the world turns.
    const side = group(house, [width / 2 + 0.013, 0, 0], Math.PI / 2);
    window(side, 0, height - 0.44, 0);
    box(width - 0.22, 0.55, 0.035, palette.dark, house, [0, 0.38, depth / 2 + 0.026], 0.025);
    box(0.035, 0.54, 0.035, palette.cream, house, [0, 0.38, depth / 2 + 0.052], 0.004);
    if (cafe) {
      const awning = group(house, [0, 0.88, depth / 2 + 0.26]);
      awning.rotation.x = 0.20;
      const stripeWidth = (width + 0.15) / 9;
      for (let i = 0; i < 9; i++) {
        const color = i % 2 === 0 ? palette.coral : palette.white;
        box(stripeWidth + 0.002, 0.045, 0.5, color, awning, [(i - 4) * stripeWidth, 0, 0], 0.01);
        box(stripeWidth + 0.002, 0.115, 0.045, color, awning, [(i - 4) * stripeWidth, -0.055, 0.23], 0.015);
      }
      const sign = box(0.52, 0.16, 0.05, palette.teal, house, [0, 1.12, depth / 2 + 0.04], 0.01);
      // Tiny brass storefront lettering-like details, with no unreadable canvas text.
      for (let i = 0; i < 4; i++) box(0.048, 0.055, 0.007, palette.ivory, sign, [-0.13 + i * 0.085, 0, 0.028], 0.004);
    }
    return house;
  }

  building([0.78, 0.08, -0.77], 1.16, 1.96, palette.cream, palette.blue, -0.08, true);
  building([1.98, 0.08, -0.78], 1.01, 1.63, palette.coral, palette.teal, -0.11, false);

  // A bright Québec timber house, with gable roof and a small front porch.
  const quebec = group(root, [2.56, 0.09, -1.84], -0.30);
  box(0.86, 1.15, 0.77, '#deb852', quebec, [0, 0.57, 0], 0.04);
  for (let i = 0; i < 8; i++) box(0.87, 0.014, 0.015, '#c99f45', quebec, [0, 0.13 + i * 0.12, 0.39], 0.002);
  const gable = new THREE.Shape();
  gable.moveTo(-0.44, 0); gable.lineTo(0.44, 0); gable.lineTo(0, 0.56); gable.closePath();
  mesh(new THREE.ExtrudeGeometry(gable, { depth: 0.77, bevelEnabled: false }), '#deb852', quebec, [0, 1.1, -0.385]);
  for (const side of [-1, 1]) {
    const panel = box(0.72, 0.065, 0.97, palette.blue, quebec, [side * 0.25, 1.4, 0], 0.018);
    panel.rotation.z = side * -0.87;
  }
  window(quebec, -0.23, 0.71, 0.398);
  box(0.24, 0.57, 0.03, palette.teal, quebec, [0.2, 0.36, 0.407], 0.014);
  box(0.36, 0.1, 0.26, palette.cream, quebec, [0.2, 0.08, 0.55], 0.025);
  ball(0.07, palette.cream, quebec, [0, 1.27, 0.413], [1, 1, 0.25]);

  function tree(p: Point, size: number, color = palette.tree, kind: 'round' | 'cypress' = 'round') {
    const object = group(root, p);
    cylinder(0.035 * size, 0.06 * size, 0.54 * size, palette.trunk, object, [0, 0.27 * size, 0], 8);
    if (kind === 'cypress') {
      ball(0.26 * size, color, object, [0, 0.78 * size, 0], [0.76, 2.2, 0.76]);
    } else {
      ball(0.33 * size, color, object, [-0.07 * size, 0.70 * size, 0], [1.04, 1.16, 1]);
      ball(0.25 * size, palette.leaf, object, [0.16 * size, 0.73 * size, 0.05 * size]);
      ball(0.21 * size, color, object, [0.01 * size, 0.97 * size, -0.015 * size]);
    }
    return object;
  }
  tree([-2.65, 0.08, -1.50], 1.05, palette.tree, 'cypress');
  tree([-0.12, 0.08, -1.91], 1.01, '#7a915a', 'cypress');
  tree([3.15, 0.08, -0.77], 0.95);
  tree([2.88, 0.08, 0.08], 0.75, '#82955f', 'cypress');
  tree([-2.95, 0.08, -0.5], 0.71);

  // A sculptural baobab recalls Dakar and the broader francophone world.
  const baobab = group(root, [-2.70, 0.09, 0.51], 0.15);
  cylinder(0.18, 0.32, 0.93, '#b58861', baobab, [0, 0.45, 0], 10);
  for (const [x, y, z, radius] of [[-0.37, 1.2, 0, 0.39], [0.33, 1.31, 0.09, 0.42], [0, 1.47, -0.22, 0.42], [-0.08, 1.21, 0.30, 0.34]]) {
    beam([0, 0.61, 0], [x, y - 0.13, z], 0.078, '#b58861', baobab);
    ball(radius, '#879251', baobab, [x, y, z], [1.18, 0.65, 1]);
  }
  for (const [x, z] of [[-0.25, 0.1], [0.21, 0.14], [0, -0.22]]) beam([0, 0.24, 0], [x, 0.025, z], 0.075, '#b58861', baobab);

  // Terracotta steps and pots near the water lend a warm, lived-in scale.
  for (const [x, z, size] of [[-2.08, 0.45, 0.18], [2.71, 0.5, 0.14], [1.96, 0.2, 0.13]]) {
    cylinder(size * 0.85, size * 0.62, size * 1.5, palette.coral, root, [x, size * 0.75 + 0.08, z], 16);
    cylinder(size, size, 0.055, '#ce805d', root, [x, size * 1.5 + 0.08, z], 16);
    ball(size * 0.88, palette.tree, root, [x, size * 2 + 0.09, z], [1, 0.7, 1]);
  }

  function cafeTable(x: number, z: number) {
    const table = group(root, [x, 0.1, z]);
    cylinder(0.18, 0.18, 0.045, palette.ivory, table, [0, 0.35, 0], 24);
    cylinder(0.026, 0.035, 0.34, palette.dark, table, [0, 0.17, 0], 8);
    cylinder(0.1, 0.1, 0.025, palette.dark, table, [0, 0.015, 0], 12);
    for (const side of [-1, 1]) {
      const chair = group(table, [side * 0.27, 0, 0.03], side * -Math.PI / 2);
      box(0.17, 0.035, 0.17, palette.ochre, chair, [0, 0.19, 0], 0.018);
      box(0.17, 0.16, 0.035, palette.ochre, chair, [0, 0.29, -0.065], 0.025);
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) beam([sx * 0.065, 0.02, sz * 0.065], [sx * 0.055, 0.2, sz * 0.055], 0.011, palette.dark, chair);
    }
    cylinder(0.033, 0.027, 0.044, palette.white, table, [0.07, 0.393, 0], 10);
  }
  cafeTable(0.36, 0.34);
  cafeTable(1.28, 0.28);

  function lamp(x: number, z: number) {
    const lamp = group(root, [x, 0.08, z]);
    cylinder(0.024, 0.045, 0.71, palette.dark, lamp, [0, 0.35, 0], 8);
    box(0.14, 0.21, 0.14, '#ffdfa0', lamp, [0, 0.77, 0], 0.015);
    const cap = cylinder(0, 0.13, 0.095, palette.dark, lamp, [0, 0.92, 0], 4);
    cap.rotation.y = Math.PI / 4;
    for (const side of [-1, 1]) beam([side * 0.065, 0.67, 0.06], [side * 0.065, 0.875, 0.06], 0.009, palette.dark, lamp);
    box(0.17, 0.025, 0.17, palette.dark, lamp, [0, 0.66, 0], 0.01);
  }
  lamp(-0.48, 0.52);
  lamp(1.74, 0.64);

  const boat = group(root, [-1.35, 0.105, 1.40], -0.18);
  const hull = ball(0.28, palette.ivory, boat, [0, 0, 0], [1.7, 0.34, 0.57]);
  hull.receiveShadow = false;
  box(0.44, 0.055, 0.17, palette.ochre, boat, [0, 0.07, 0], 0.07);
  box(0.035, 0.19, 0.22, palette.white, boat, [0.03, 0.15, 0], 0.012);

  // The balloon's alternating fabric gores are separate curved surfaces.
  const balloon = group(root, [2.30, 3.87, -0.70], -0.15);
  const balloonColors = [palette.ochre, palette.ivory, palette.blue, palette.ivory];
  for (let i = 0; i < 12; i++) {
    const gore = mesh(new THREE.SphereGeometry(0.53, 5, 18, i * Math.PI / 6, Math.PI / 6, 0, Math.PI * 0.92), balloonColors[i % 4], balloon);
    gore.scale.y = 1.2;
  }
  cylinder(0.15, 0.11, 0.15, palette.ochre, balloon, [0, -0.59, 0], 12);
  cylinder(0.15, 0.13, 0.18, '#b48250', balloon, [0, -0.97, 0], 12);
  cylinder(0.165, 0.165, 0.035, '#d2a779', balloon, [0, -0.87, 0], 12);
  for (const x of [-1, 1]) for (const z of [-1, 1]) beam([x * 0.095, -0.62, z * 0.095], [x * 0.105, -0.88, z * 0.105], 0.009, '#ae8b63', balloon);

  function cloud(p: Point, size: number) {
    const cloud = group(root, p);
    ball(0.29 * size, palette.white, cloud, [-0.3 * size, 0, 0], [1.2, 0.83, 0.8]);
    ball(0.38 * size, palette.white, cloud, [0, 0.1 * size, 0], [1, 0.93, 0.82]);
    ball(0.25 * size, palette.white, cloud, [0.34 * size, -0.015 * size, 0], [1.15, 0.88, 0.8]);
    return cloud;
  }
  const cloudLeft = cloud([-3.12, 2.94, -0.91], 0.77);
  const cloudRight = cloud([3.38, 2.44, -1.72], 0.66);
  const cloudBack = cloud([0.44, 3.13, -2.13], 0.42);

  // Bake stationary details into material batches. This keeps the tiny furniture
  // and tower braces affordable on phones without changing their geometry.
  const animatedObjects = new Set<THREE.Object3D>([balloon, boat, cloudLeft, cloudRight, cloudBack]);
  const batches = new Map<string, { geometries: THREE.BufferGeometry[]; material: THREE.Material; castShadow: boolean; receiveShadow: boolean }>();
  root.updateMatrixWorld(true);
  for (const child of [...root.children]) {
    if (animatedObjects.has(child)) continue;
    child.traverse((object) => {
      if (!(object instanceof THREE.Mesh) || Array.isArray(object.material)) return;
      const key = `${object.material.uuid}:${object.castShadow}:${object.receiveShadow}`;
      if (!batches.has(key)) batches.set(key, { geometries: [], material: object.material, castShadow: object.castShadow, receiveShadow: object.receiveShadow });
      const geometry = object.geometry.index ? object.geometry.toNonIndexed() : object.geometry.clone();
      geometry.applyMatrix4(object.matrixWorld);
      batches.get(key)!.geometries.push(geometry);
      geometries.delete(object.geometry);
      object.geometry.dispose();
    });
    root.remove(child);
  }
  for (const batch of batches.values()) {
    const combined = mergeGeometries(batch.geometries, false);
    if (combined) {
      geometries.add(combined);
      const object = new THREE.Mesh(combined, batch.material);
      object.castShadow = batch.castShadow;
      object.receiveShadow = batch.receiveShadow;
      root.add(object);
    }
    batch.geometries.forEach((geometry) => geometry.dispose());
  }

  return {
    root,
    animate(time: number, motion: boolean) {
      balloon.position.y = 3.87 + (motion ? Math.sin(time * 0.65) * 0.09 : 0);
      balloon.rotation.z = motion ? Math.sin(time * 0.41) * 0.035 : 0;
      cloudLeft.position.x = -3.12 + (motion ? Math.sin(time * 0.22) * 0.065 : 0);
      cloudRight.position.y = 2.44 + (motion ? Math.sin(time * 0.35 + 1) * 0.045 : 0);
      cloudBack.position.x = 0.44 + (motion ? Math.sin(time * 0.27 + 1) * 0.045 : 0);
      boat.position.x = -1.35 + (motion ? Math.sin(time * 0.28) * 0.12 : 0);
    },
    dispose() {
      disposed = true;
      geometries.forEach((geometry) => geometry.dispose());
      materials.forEach((entry) => entry.dispose());
      textures.forEach((texture) => texture.dispose());
    },
  };
}
