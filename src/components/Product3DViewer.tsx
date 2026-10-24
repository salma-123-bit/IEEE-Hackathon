import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { ContactShadows, OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import {
  ART_ORIGIN,
  PLANE_LOGICAL,
  isLightColor,
  kindOf,
  planeFor,
  type ProductKind,
  type SideId,
} from './previewConfig';

type Canvases = Partial<Record<SideId, HTMLCanvasElement | null>>;
type Textures = Partial<Record<SideId, THREE.Texture | null>>;

type ViewerProps = {
  productId: string;
  color: string;
  canvases: Canvases;
  /** Bumped by the parent every time any art canvas is redrawn. */
  version: number;
  side: SideId;
  autoRotate: boolean;
  onInteract: () => void;
  resetKey: number;
};

const CONFIG: Record<ProductKind, { camZ: number; camY: number; floor: number }> = {
  tee: { camZ: 8.2, camY: 0.4, floor: -1.5 },
  hoodie: { camZ: 9.2, camY: 0.4, floor: -1.64 },
  cap: { camZ: 6.4, camY: 1.2, floor: -0.55 },
  mug: { camZ: 6.4, camY: 1.0, floor: -1.35 },
  case: { camZ: 7.6, camY: 0.4, floor: -1.58 },
  stickers: { camZ: 6.4, camY: 0.2, floor: -1.28 },
};

/** Camera azimuth / polar angle that best shows each printable side. */
function viewFor(kind: ProductKind, side: SideId): { az: number; pol: number } {
  const back = Math.PI - 0.25;
  if (side === 'back') return { az: back, pol: 1.5 };
  if (side === 'sleeve') return { az: 1.3, pol: kind === 'tee' ? 1.15 : 1.45 };
  if (side === 'side') return { az: 1.35, pol: 1.35 };
  return { az: 0.25, pol: kind === 'cap' ? 1.35 : 1.5 };
}

/* ------------------------------------------------------------------ helpers */

function useArtTexture(canvas: HTMLCanvasElement | null | undefined, version: number) {
  const invalidate = useThree((s) => s.invalidate);
  const gl = useThree((s) => s.gl);

  const texture = useMemo(() => {
    if (!canvas) return null;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = Math.min(8, gl.capabilities.getMaxAnisotropy());
    return t;
  }, [canvas, gl]);

  useEffect(() => {
    if (!texture) return;
    texture.needsUpdate = true;
    invalidate();
  }, [texture, version, invalidate]);

  useEffect(() => () => texture?.dispose(), [texture]);
  return texture;
}

function roundedRectShape(w: number, h: number, r: number) {
  const s = new THREE.Shape();
  const x = -w / 2;
  const y = -h / 2;
  s.moveTo(x + r, y);
  s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r);
  s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

/** Extrudes a shape, centres it on the origin and reports the front face depth. */
function useExtrude(shape: THREE.Shape, depth: number, bevel: number) {
  const result = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shape, {
      depth,
      bevelEnabled: true,
      bevelThickness: bevel,
      bevelSize: bevel,
      bevelSegments: 4,
      curveSegments: 24,
    });
    g.computeBoundingBox();
    const bb = g.boundingBox as THREE.Box3;
    const cx = (bb.min.x + bb.max.x) / 2;
    const cy = (bb.min.y + bb.max.y) / 2;
    const cz = (bb.min.z + bb.max.z) / 2;
    g.translate(-cx, -cy, -cz);
    return { geometry: g, frontZ: (bb.max.z - bb.min.z) / 2, cx, cy };
  }, [shape, depth, bevel]);

  useEffect(() => () => result.geometry.dispose(), [result]);
  return result;
}

function DecalMaterial({ texture, roughness = 0.75 }: { texture: THREE.Texture; roughness?: number }) {
  return (
    <meshStandardMaterial
      map={texture}
      transparent
      roughness={roughness}
      metalness={0}
      depthWrite={false}
      side={THREE.DoubleSide}
      polygonOffset
      polygonOffsetFactor={-4}
    />
  );
}

function ArtDecal({
  texture,
  size,
  position,
  rotation,
}: {
  texture: THREE.Texture | null | undefined;
  size: number;
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  if (!texture) return null;
  return (
    <mesh position={position} rotation={rotation} renderOrder={2}>
      <planeGeometry args={[size, size]} />
      <DecalMaterial texture={texture} />
    </mesh>
  );
}

/** Open cylinder arc used to wrap artwork onto round surfaces. */
function useArc(rTop: number, rBot: number, h: number, thetaStart: number, arc: number, linearU?: 'front' | 'back') {
  const geo = useMemo(() => {
    const g = new THREE.CylinderGeometry(rTop, rBot, h, 48, 1, true, thetaStart, arc);
    if (linearU) {
      // Spread the texture evenly across x so artwork is not squashed at the edges.
      const rm = (rTop + rBot) / 2;
      const w = 2 * rm * Math.sin(arc / 2);
      const pos = g.attributes.position;
      const uv = g.attributes.uv;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i) / w;
        uv.setX(i, linearU === 'front' ? 0.5 + x : 0.5 - x);
      }
      uv.needsUpdate = true;
    }
    return g;
  }, [rTop, rBot, h, thetaStart, arc, linearU]);
  useEffect(() => () => geo.dispose(), [geo]);
  return geo;
}

/* ------------------------------------------------------------------ garments */

type GarmentSpec = {
  rt: number;
  rb: number;
  yt: number;
  yb: number;
  zs: number;
  chestY: number;
  backY: number;
  sleeve: { len: number; rt: number; rb: number; jx: number; jy: number; dx: number; dy: number; decalY: number };
};

const GARMENT: Record<'tee' | 'hoodie', GarmentSpec> = {
  tee: {
    rt: 1.0,
    rb: 0.96,
    yt: 1.3,
    yb: -1.45,
    zs: 0.36,
    chestY: 0.35,
    backY: 0.45,
    sleeve: { len: 0.85, rt: 0.36, rb: 0.3, jx: 0.98, jy: 1.2, dx: 0.866, dy: -0.5, decalY: 0.05 },
  },
  hoodie: {
    rt: 1.05,
    rb: 1.02,
    yt: 1.35,
    yb: -1.6,
    zs: 0.4,
    chestY: 0.4,
    backY: 0.5,
    sleeve: { len: 2.2, rt: 0.36, rb: 0.27, jx: 1.0, jy: 1.22, dx: 0.3, dy: -0.954, decalY: 0.3 },
  },
};

const DOME_RISE = 0.3;
const NECK_R = 0.34;

function TorsoDecal({
  g,
  texture,
  side,
}: {
  g: GarmentSpec;
  texture: THREE.Texture | null | undefined;
  side: 'front' | 'back';
}) {
  const h = 1.7;
  const rAt = (y: number) => g.rb + (g.rt - g.rb) * ((y - g.yb) / (g.yt - g.yb));
  const want = side === 'front' ? g.chestY : g.backY;
  const yc = Math.min(want, g.yt - 0.03 - h / 2);
  const rTop = rAt(yc + h / 2) + 0.06;
  const rBot = rAt(yc - h / 2) + 0.06;
  const rm = (rTop + rBot) / 2;
  const arc = 2 * Math.asin(Math.min(0.99, h / 2 / rm));
  const ts = side === 'front' ? -arc / 2 : Math.PI - arc / 2;
  const geo = useArc(rTop, rBot, h, ts, arc, side);
  if (!texture) return null;
  return (
    <mesh geometry={geo} position={[0, yc, 0]} scale={[1, 1, g.zs]} renderOrder={2}>
      <DecalMaterial texture={texture} />
    </mesh>
  );
}

function SleeveDecal({
  g,
  texture,
}: {
  g: GarmentSpec['sleeve'];
  texture: THREE.Texture | null | undefined;
}) {
  const h = 0.6;
  const rAt = (y: number) => g.rb + (g.rt - g.rb) * ((y + g.len / 2) / g.len);
  const rTop = rAt(g.decalY + h / 2) + 0.03;
  const rBot = rAt(g.decalY - h / 2) + 0.03;
  const arc = h / ((rTop + rBot) / 2);
  const geo = useArc(rTop, rBot, h, Math.PI / 2 - arc / 2, arc);
  if (!texture) return null;
  return (
    <mesh geometry={geo} position={[0, g.decalY, 0]} scale={[1, 1, 0.9]} renderOrder={2}>
      <DecalMaterial texture={texture} />
    </mesh>
  );
}

function Garment({
  kind,
  color,
  textures,
}: {
  kind: 'tee' | 'hoodie';
  color: string;
  textures: Textures;
}) {
  const g = GARMENT[kind];
  const s = g.sleeve;
  const light = isLightColor(color);
  const darker = useMemo(() => new THREE.Color(color).multiplyScalar(0.8), [color]);
  const inner = useMemo(() => new THREE.Color(color).multiplyScalar(0.45), [color]);

  const torso = useMemo(() => {
    const H = g.yt - g.yb;
    const geo = new THREE.CylinderGeometry(g.rt, g.rb, H, 72, 30, true, Math.PI, Math.PI * 2);
    geo.translate(0, (g.yt + g.yb) / 2, 0);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      const z = pos.getZ(i);
      const ang = Math.atan2(x, z);
      const rr = Math.hypot(x, z);
      const d = 0.012 * Math.sin(y * 8 + ang * 3) + 0.008 * Math.sin(y * 17 - ang * 6);
      const f = (rr + d) / rr;
      pos.setXYZ(i, x * f, y, z * f);
    }
    geo.computeVertexNormals();
    return geo;
  }, [g]);
  useEffect(() => () => torso.dispose(), [torso]);

  // Sleeve placement: top end sits on the shoulder joint, axis follows (dx, dy).
  const rz = Math.atan2(s.dx, -s.dy);
  const sx = s.jx + (s.dx * s.len) / 2;
  const sy = s.jy + (s.dy * s.len) / 2;
  const neckCut = Math.asin(NECK_R); // sphere polar angle where the neck opening sits
  const neckY = g.yt + DOME_RISE * Math.cos(neckCut);

  const fabric = { color, roughness: 0.93, metalness: 0, side: THREE.DoubleSide } as const;

  return (
    <group>
      {/* Torso */}
      <mesh geometry={torso} scale={[1, 1, g.zs]}>
        <meshStandardMaterial {...fabric} />
      </mesh>

      {/* Shoulder dome with open neck */}
      <mesh position={[0, g.yt, 0]} scale={[g.rt, DOME_RISE, g.rt * g.zs]}>
        <sphereGeometry args={[1, 56, 20, 0, Math.PI * 2, neckCut, Math.PI / 2 - neckCut]} />
        <meshStandardMaterial {...fabric} />
      </mesh>

      {/* Hem */}
      <mesh position={[0, g.yb + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, g.zs, 1]}>
        <torusGeometry args={[g.rb, 0.035, 10, 72]} />
        <meshStandardMaterial color={kind === 'hoodie' ? darker : color} roughness={0.95} />
      </mesh>

      {kind === 'tee' ? (
        <>
          {/* Ribbed collar + dark neck interior */}
          <mesh position={[0, neckY, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, g.zs * 1.05, 1]}>
            <torusGeometry args={[NECK_R + 0.01, 0.06, 12, 48]} />
            <meshStandardMaterial color={darker} roughness={0.95} />
          </mesh>
          <mesh position={[0, neckY - 0.06, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[1, g.zs * 1.05, 1]}>
            <circleGeometry args={[NECK_R, 32]} />
            <meshStandardMaterial color={inner} roughness={1} side={THREE.DoubleSide} />
          </mesh>
        </>
      ) : (
        <>
          {/* Hood: back shell + rolled front rim + dark opening */}
          <mesh position={[0, g.yt + 0.42, -0.06]} scale={[0.7, 0.78, 0.62]}>
            <sphereGeometry args={[1, 40, 28, Math.PI, Math.PI]} />
            <meshStandardMaterial {...fabric} />
          </mesh>
          <mesh position={[0, g.yt + 0.42, -0.06]} scale={[0.7, 0.78, 0.5]} rotation={[0, 0, 0]}>
            <sphereGeometry args={[0.97, 32, 20, Math.PI, Math.PI]} />
            <meshStandardMaterial color={inner} roughness={1} side={THREE.BackSide} />
          </mesh>
          <mesh position={[0, g.yt + 0.42, -0.06]} scale={[0.7, 0.78, 1]}>
            <torusGeometry args={[1, 0.11, 14, 56]} />
            <meshStandardMaterial color={darker} roughness={0.95} />
          </mesh>

          {/* Kangaroo pocket */}
          <HoodiePocket g={g} color={darker} />

          {/* Drawcords */}
          {[-0.2, 0.2].map((x) => (
            <mesh key={x} position={[x, g.yt - 0.5, g.zs * Math.sqrt(g.rt * g.rt - x * x) + 0.015]}>
              <cylinderGeometry args={[0.022, 0.022, 0.8, 10]} />
              <meshStandardMaterial color={light ? '#0b3b32' : '#f4f1e8'} roughness={0.6} />
            </mesh>
          ))}
        </>
      )}

      {/* Sleeves (+ cuffs) */}
      {[1, -1].map((m) => (
        <group key={m} position={[m * sx, sy, 0]} rotation={[0, 0, m * rz]}>
          <mesh scale={[1, 1, 0.9]}>
            <cylinderGeometry args={[s.rt, s.rb, s.len, 36, 6, true]} />
            <meshStandardMaterial {...fabric} />
          </mesh>
          <mesh position={[0, -s.len / 2 + 0.01, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.9, 1]}>
            <torusGeometry args={[s.rb, kind === 'hoodie' ? 0.05 : 0.03, 10, 40]} />
            <meshStandardMaterial color={kind === 'hoodie' ? darker : color} roughness={0.95} />
          </mesh>
          <mesh position={[0, -s.len / 2 + 0.02, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.9, 1]}>
            <circleGeometry args={[s.rb - 0.01, 24]} />
            <meshStandardMaterial color={inner} roughness={1} side={THREE.DoubleSide} />
          </mesh>
          {m === 1 && <SleeveDecal g={s} texture={textures.sleeve} />}
        </group>
      ))}

      <TorsoDecal g={g} texture={textures.front} side="front" />
      <TorsoDecal g={g} texture={textures.back} side="back" />
    </group>
  );
}

function HoodiePocket({ g, color }: { g: GarmentSpec; color: THREE.Color }) {
  const h = 0.8;
  const yc = -0.9;
  const rAt = (y: number) => g.rb + (g.rt - g.rb) * ((y - g.yb) / (g.yt - g.yb));
  const rTop = rAt(yc + h / 2) + 0.05;
  const rBot = rAt(yc - h / 2) + 0.05;
  const arc = 2 * Math.asin(Math.min(0.99, 0.55 / ((rTop + rBot) / 2)));
  const geo = useArc(rTop, rBot, h, -arc / 2, arc);
  return (
    <mesh geometry={geo} position={[0, yc, 0]} scale={[1, 1, g.zs]}>
      <meshStandardMaterial color={color} roughness={0.95} side={THREE.DoubleSide} />
    </mesh>
  );
}

/* ------------------------------------------------------------------ other products */

function Mug({ color, textures }: { color: string; textures: Textures }) {
  const handleGeometry = useMemo(() => {
    const curve = new THREE.CubicBezierCurve3(
      new THREE.Vector3(1.18, 0.75, 0),
      new THREE.Vector3(2.35, 0.75, 0),
      new THREE.Vector3(2.35, -0.75, 0),
      new THREE.Vector3(1.14, -0.75, 0),
    );
    return new THREE.TubeGeometry(curve, 40, 0.17, 16, false);
  }, []);
  useEffect(() => () => handleGeometry.dispose(), [handleGeometry]);

  const arc = 2.2;
  return (
    <group>
      <mesh>
        <cylinderGeometry args={[1.2, 1.15, 2.6, 64, 1, true]} />
        <meshPhysicalMaterial
          color={color}
          roughness={0.18}
          clearcoat={0.9}
          clearcoatRoughness={0.1}
          side={THREE.DoubleSide}
        />
      </mesh>
      {/* Artwork wrapped on the curved surface (front and back) */}
      {([
        ['front', -arc / 2],
        ['back', Math.PI - arc / 2],
      ] as const).map(([sd, ts]) =>
        textures[sd] ? (
          <mesh key={sd} renderOrder={2}>
            <cylinderGeometry args={[1.207, 1.157, 2.6, 64, 1, true, ts, arc]} />
            <DecalMaterial texture={textures[sd] as THREE.Texture} roughness={0.3} />
          </mesh>
        ) : null,
      )}
      {/* Inner wall */}
      <mesh position={[0, 0.08, 0]}>
        <cylinderGeometry args={[1.12, 1.07, 2.46, 48, 1, true]} />
        <meshPhysicalMaterial color={color} roughness={0.25} side={THREE.DoubleSide} />
      </mesh>
      {/* Lip */}
      <mesh position={[0, 1.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.16, 0.045, 16, 64]} />
        <meshPhysicalMaterial color={color} roughness={0.2} clearcoat={0.8} />
      </mesh>
      {/* Bottom & inner floor */}
      <mesh position={[0, -1.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.15, 48]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh position={[0, -1.15, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.07, 48]} />
        <meshStandardMaterial color={color} roughness={0.4} />
      </mesh>
      <mesh geometry={handleGeometry}>
        <meshPhysicalMaterial color={color} roughness={0.18} clearcoat={0.9} />
      </mesh>
    </group>
  );
}

function Cap({ color, textures }: { color: string; textures: Textures }) {
  const brim = useMemo(() => new THREE.Color(color).multiplyScalar(0.9), [color]);
  return (
    <group position={[0, -0.5, 0]}>
      <mesh scale={[1, 0.95, 1.05]}>
        <sphereGeometry args={[1.2, 56, 36, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color={color} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* Brim */}
      <mesh position={[0, 0.01, 0.5]} rotation={[0.1, 0, 0]} scale={[1, 1, 1.5]}>
        <cylinderGeometry args={[1.1, 1.1, 0.07, 48, 1, false, -Math.PI / 2, Math.PI]} />
        <meshStandardMaterial color={brim} roughness={0.85} />
      </mesh>
      {/* Top button */}
      <mesh position={[0, 1.14, 0]}>
        <sphereGeometry args={[0.07, 16, 12]} />
        <meshStandardMaterial color={brim} roughness={0.7} />
      </mesh>
      <ArtDecal
        texture={textures.front}
        size={planeFor('cap', 'front') / 100}
        position={[0, 0.45, 1.125]}
        rotation={[-0.46, 0, 0]}
      />
      <group rotation={[0, Math.PI / 2, 0]}>
        <ArtDecal
          texture={textures.side}
          size={planeFor('cap', 'side') / 100}
          position={[0, 0.4, 1.09]}
          rotation={[-0.46, 0, 0]}
        />
      </group>
      <group rotation={[0, Math.PI, 0]}>
        <ArtDecal
          texture={textures.back}
          size={planeFor('cap', 'back') / 100}
          position={[0, 0.45, 1.06]}
          rotation={[-0.46, 0, 0]}
        />
      </group>
    </group>
  );
}

function PhoneCase({ color, texture }: { color: string; texture: THREE.Texture | null | undefined }) {
  const bodyShape = useMemo(() => roundedRectShape(1.5, 3.0, 0.28), []);
  const islandShape = useMemo(() => roundedRectShape(0.64, 0.68, 0.16), []);
  const { geometry, frontZ } = useExtrude(bodyShape, 0.1, 0.05);
  const island = useExtrude(islandShape, 0.03, 0.015);
  const light = isLightColor(color);
  const size = PLANE_LOGICAL.case / 100;
  const [, oy] = ART_ORIGIN.case;
  const lenses: [number, number][] = [
    [-0.54, 1.08],
    [-0.54, 0.82],
    [-0.28, 0.95],
  ];

  return (
    <group rotation={[0, -0.3, 0]}>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial color={color} roughness={0.35} clearcoat={0.5} clearcoatRoughness={0.25} />
      </mesh>
      <mesh geometry={island.geometry} position={[-0.41, 0.95, frontZ + 0.03]}>
        <meshStandardMaterial color={light ? '#cfd4cf' : '#14201c'} roughness={0.4} metalness={0.2} />
      </mesh>
      {lenses.map(([x, y]) => (
        <mesh key={`${x}-${y}`} position={[x, y, frontZ + 0.07]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.1, 0.1, 0.05, 24]} />
          <meshStandardMaterial color="#0b0d0c" roughness={0.2} metalness={0.6} />
        </mesh>
      ))}
      <ArtDecal texture={texture} size={size} position={[0, -oy / 100, frontZ + 0.02]} />
    </group>
  );
}

function Sticker({ color, texture }: { color: string; texture: THREE.Texture | null | undefined }) {
  const bodyShape = useMemo(() => roundedRectShape(2.3, 1.8, 0.24), []);
  const sheetShape = useMemo(() => roundedRectShape(3.2, 2.5, 0.14), []);
  const { geometry, frontZ } = useExtrude(bodyShape, 0.02, 0.012);
  const size = PLANE_LOGICAL.stickers / 100;

  return (
    <group rotation={[0, -0.25, 0.04]}>
      <mesh position={[0, 0, -0.06]}>
        <shapeGeometry args={[sheetShape]} />
        <meshStandardMaterial color="#eef1ec" roughness={0.9} />
      </mesh>
      <mesh geometry={geometry}>
        <meshPhysicalMaterial color={color} roughness={0.25} clearcoat={1} clearcoatRoughness={0.08} />
      </mesh>
      <ArtDecal texture={texture} size={size} position={[0, 0, frontZ + 0.01]} />
    </group>
  );
}

/* ------------------------------------------------------------------- scene */

/** Smoothly swings the camera around to the selected print side. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CameraRig({ kind, side, controls }: { kind: ProductKind; side: SideId; controls: MutableRefObject<any> }) {
  const camera = useThree((s) => s.camera);
  const invalidate = useThree((s) => s.invalidate);
  const goal = useRef<{ az: number; pol: number } | null>(null);
  const first = useRef(true);

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    goal.current = viewFor(kind, side);
    invalidate();
  }, [kind, side, invalidate]);

  useEffect(() => {
    const c = controls.current;
    if (!c?.addEventListener) return;
    const stop = () => {
      goal.current = null;
    };
    c.addEventListener('start', stop);
    return () => c.removeEventListener?.('start', stop);
  }, [controls]);

  useFrame(() => {
    const g = goal.current;
    if (!g) return;
    const p = camera.position;
    const r = Math.hypot(p.x, p.y, p.z);
    const az = Math.atan2(p.x, p.z);
    const pol = Math.acos(Math.max(-1, Math.min(1, p.y / r)));
    const da = Math.atan2(Math.sin(g.az - az), Math.cos(g.az - az));
    const dp = g.pol - pol;
    if (Math.abs(da) < 0.004 && Math.abs(dp) < 0.004) {
      goal.current = null;
      return;
    }
    const naz = az + da * 0.14;
    const npol = pol + dp * 0.14;
    p.set(r * Math.sin(npol) * Math.sin(naz), r * Math.cos(npol), r * Math.sin(npol) * Math.cos(naz));
    controls.current?.update?.();
    invalidate();
  });

  return null;
}

function Scene({
  kind,
  color,
  canvases,
  version,
  side,
  autoRotate,
  onInteract,
}: {
  kind: ProductKind;
  color: string;
  canvases: Canvases;
  version: number;
  side: SideId;
  autoRotate: boolean;
  onInteract: () => void;
}) {
  const textures: Textures = {
    front: useArtTexture(canvases.front, version),
    back: useArtTexture(canvases.back, version),
    sleeve: useArtTexture(canvases.sleeve, version),
    side: useArtTexture(canvases.side, version),
  };
  const cfg = CONFIG[kind];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const controls = useRef<any>(null);

  // Let vertical swipes scroll the page on touch devices; horizontal swipes rotate.
  useEffect(() => {
    const el: HTMLElement | undefined = controls.current?.domElement;
    if (el) el.style.touchAction = 'pan-y';
  }, []);

  return (
    <>
      <ambientLight intensity={0.6} />
      <hemisphereLight args={['#ffffff', '#c7d1c7', 0.6]} />
      <directionalLight position={[4, 6, 6]} intensity={1.7} />
      <directionalLight position={[-5, 2, -4]} intensity={0.7} color="#d9ecdf" />
      <directionalLight position={[0, 3, -6]} intensity={0.6} />
      <directionalLight position={[0, 2, -7]} intensity={0.5} />

      {kind === 'mug' && <Mug color={color} textures={textures} />}
      {(kind === 'tee' || kind === 'hoodie') && <Garment kind={kind} color={color} textures={textures} />}
      {kind === 'cap' && <Cap color={color} textures={textures} />}
      {kind === 'case' && <PhoneCase color={color} texture={textures.front} />}
      {kind === 'stickers' && <Sticker color={color} texture={textures.front} />}

      <ContactShadows
        position={[0, cfg.floor, 0]}
        opacity={0.32}
        scale={9}
        blur={2.6}
        far={3.2}
        resolution={512}
        frames={1}
      />

      <OrbitControls
        ref={controls}
        enablePan={false}
        enableZoom={false}
        enableDamping
        dampingFactor={0.08}
        rotateSpeed={0.9}
        minPolarAngle={0.9}
        maxPolarAngle={Math.PI / 1.9}
        autoRotate={autoRotate}
        autoRotateSpeed={1.6}
        onStart={onInteract}
      />
      <CameraRig kind={kind} side={side} controls={controls} />
    </>
  );
}

export default function Product3DViewer({
  productId,
  color,
  canvases,
  version,
  side,
  autoRotate,
  onInteract,
  resetKey,
}: ViewerProps) {
  const kind = kindOf(productId);
  const cfg = CONFIG[kind];

  return (
    <Canvas
      key={`${kind}-${resetKey}`}
      flat
      dpr={[1, 1.75]}
      frameloop={autoRotate ? 'always' : 'demand'}
      camera={{ position: [cfg.camZ * 0.22, cfg.camY, cfg.camZ], fov: 38, near: 0.1, far: 60 }}
      gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
      style={{ touchAction: 'pan-y' }}
    >
      <Scene
        kind={kind}
        color={color}
        canvases={canvases}
        version={version}
        side={side}
        autoRotate={autoRotate}
        onInteract={onInteract}
      />
    </Canvas>
  );
}
