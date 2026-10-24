/**
 * Shared configuration for the 2D canvas mockup and the 3D viewer so both
 * previews place artwork at the same spot on every product.
 */

export type ProductKind = 'tee' | 'hoodie' | 'cap' | 'stickers' | 'mug' | 'case';

const KINDS: readonly ProductKind[] = ['tee', 'hoodie', 'cap', 'stickers', 'mug', 'case'];

/** Unknown / custom catalog products fall back to the T-shirt model. */
export const kindOf = (id: string): ProductKind =>
  (KINDS as readonly string[]).includes(id) ? (id as ProductKind) : 'tee';

/** Size (in 2D "logical" units) of the square artwork area mapped onto the 3D decal. */
export const PLANE_LOGICAL: Record<ProductKind, number> = {
  tee: 170,
  hoodie: 170,
  cap: 110,
  stickers: 230,
  mug: 264,
  case: 150,
};

/** Default artwork centre (logical units, y grows downward, relative to product centre). */
export const ART_ORIGIN: Record<ProductKind, [number, number]> = {
  tee: [0, -35],
  hoodie: [0, -35],
  cap: [0, -20],
  stickers: [0, 0],
  mug: [0, 0],
  case: [0, 25],
};

export type PathLike = {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cx: number, cy: number, x: number, y: number): void;
  closePath(): void;
};

/**
 * Traces the T-shirt / hoodie silhouette on either a Canvas2D context or a
 * THREE.Shape so the flat and 3D versions always match.
 */
export function traceGarment(p: PathLike, kind: 'tee' | 'hoodie', scale = 1, flipY = false): void {
  const f = flipY ? -1 : 1;
  const m = (x: number, y: number): [number, number] => [x * scale, y * scale * f];
  const mv = (x: number, y: number) => p.moveTo(...m(x, y));
  const ln = (x: number, y: number) => p.lineTo(...m(x, y));
  const qd = (cx: number, cy: number, x: number, y: number) => {
    const [a, b] = m(cx, cy);
    const [c, d] = m(x, y);
    p.quadraticCurveTo(a, b, c, d);
  };

  if (kind === 'hoodie') {
    mv(-50, -160);
    qd(0, -122, 50, -160);
    ln(138, -118);
    ln(190, 10);
    ln(155, 28);
    ln(115, -60);
    ln(100, 150);
    qd(0, 162, -100, 150);
    ln(-115, -60);
    ln(-155, 28);
    ln(-190, 10);
    ln(-138, -118);
  } else {
    mv(-45, -165);
    qd(0, -125, 45, -165);
    ln(135, -115);
    ln(175, -55);
    ln(140, -35);
    ln(110, -75);
    ln(95, 145);
    qd(0, 157, -95, 145);
    ln(-110, -75);
    ln(-140, -35);
    ln(-175, -55);
    ln(-135, -115);
  }
  p.closePath();
}

/** True when the colour is light enough that dark artwork/text should be used. */
export function isLightColor(hex: string): boolean {
  const h = hex.replace('#', '');
  const full = h.length === 3 ? h.split('').map((c) => c + c).join('') : h;
  const n = parseInt(full, 16);
  if (Number.isNaN(n)) return false;
  const r = (n >> 16) & 255;
  const g = (n >> 8) & 255;
  const b = n & 255;
  return 0.299 * r + 0.587 * g + 0.114 * b > 150;
}

/* ------------------------------------------------------------------ print sides */

export type SideId = 'front' | 'back' | 'sleeve' | 'side';

/** Printable areas offered for each product. */
export const SIDES: Record<ProductKind, SideId[]> = {
  tee: ['front', 'back', 'sleeve'],
  hoodie: ['front', 'back', 'sleeve'],
  cap: ['front', 'side', 'back'],
  mug: ['front', 'back'],
  case: ['front'],
  stickers: ['front'],
};

export const SIDE_LABEL: Record<SideId, { ar: string; en: string }> = {
  front: { ar: 'الوش', en: 'Front' },
  back: { ar: 'الضهر', en: 'Back' },
  sleeve: { ar: 'الجنب (الكم)', en: 'Side (sleeve)' },
  side: { ar: 'الجنب', en: 'Side' },
};

/** Logical size of the square artwork area for a given product side. */
export const planeFor = (kind: ProductKind, side: SideId): number =>
  side === 'sleeve' ? 60 : side === 'side' ? 70 : PLANE_LOGICAL[kind];

/** Default artwork centre for a given product side (2D logical units). */
export const originFor = (kind: ProductKind, side: SideId): [number, number] => {
  if (side === 'back') {
    if (kind === 'tee' || kind === 'hoodie') return [0, -50];
    if (kind === 'cap') return [0, -15];
    return ART_ORIGIN[kind];
  }
  if (side === 'side') return [10, -15];
  if (side === 'sleeve') return [0, 0];
  return ART_ORIGIN[kind];
};

/** Where the printable sleeve sits in the flat 2D garment and its slope (radians). */
export const SLEEVE_VIEW: Record<'tee' | 'hoodie', { c: [number, number]; angle: number }> = {
  tee: { c: [150, -70], angle: 0.52 },
  hoodie: { c: [158, -25], angle: 1.2 },
};
