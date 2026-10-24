import React, {
  Component,
  Suspense,
  lazy,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import {
  Box,
  Eye,
  Loader2,
  Palette,
  Pause,
  Play,
  RefreshCw,
  Rotate3d,
  SlidersHorizontal,
  Sparkles,
  Square,
  Upload,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useLanguage } from '../lib/language';
import { getCatalog } from '../lib/catalog';
import {
  ART_ORIGIN,
  PLANE_LOGICAL,
  SIDES,
  SIDE_LABEL,
  SLEEVE_VIEW,
  isLightColor,
  kindOf,
  originFor,
  planeFor,
  traceGarment,
  type ProductKind,
  type SideId,
} from './previewConfig';

const Product3DViewer = lazy(() => import('./Product3DViewer'));

interface LiveMockupPreviewProps {
  productId: string;
  productName: string;
  uploadedFile?: File | null;
  uploadedFileName?: string;
  onArtworkChange?: (fileName: string, dataUrl: string) => void;
  preferredColor?: string;
  availableProductIds?: string[];
  onSelectProduct?: (productId: string) => void;
}

/* ──────────────────────────────────────────────────────────────
   Per-side design state
   ────────────────────────────────────────────────────────────── */
type Design = {
  imageUrl: string;
  text: string;
  ink: string; // 'auto' | hex
  imgPos: { x: number; y: number };
  imgScale: number;
  txtPos: { x: number; y: number };
  txtScale: number;
};

const defaultText = (side: SideId): string =>
  side === 'front' ? 'خليك مختلف\nخليك يوزرسيف' : '';

const defaultImgScale = (side: SideId) =>
  side === 'sleeve' ? 0.35 : side === 'side' ? 0.5 : 1;

const defaultTxtScale = (side: SideId, kind?: ProductKind) => {
  if (side === 'sleeve') return 0.4;
  if (side === 'side') return 0.5;
  // Cap plane (110) is narrower than the 130-wide text box → scale down
  if (kind) return Math.min(1, planeFor(kind, side) / 140);
  return 1;
};

function blankDesign(side: SideId, kind?: ProductKind): Design {
  return {
    imageUrl: '',
    text: defaultText(side),
    ink: 'auto',
    imgPos: { x: 0, y: 0 },
    imgScale: defaultImgScale(side),
    txtPos: { x: 0, y: 0 },
    txtScale: defaultTxtScale(side, kind),
  };
}

/* ──────────────────────────────────────────────────────────────
   Constants
   ────────────────────────────────────────────────────────────── */
const GARMENT_COLORS = [
  { id: '#0b3b32', nameAr: 'أخضر يوزرسيف', nameEn: 'Yuzersef Green' },
  { id: '#ffffff', nameAr: 'أبيض ناصع', nameEn: 'Pure White' },
  { id: '#18181b', nameAr: 'أسود ملكي', nameEn: 'Royal Black' },
  { id: '#e5e7eb', nameAr: 'رمادي ميلانج', nameEn: 'Heather Grey' },
  { id: '#e8dec8', nameAr: 'رمال أسوان', nameEn: 'Aswan Sand' },
];

const INK_OPTIONS = [
  { id: 'auto', labelAr: 'تلقائي', labelEn: 'Auto' },
  { id: '#ffffff', labelAr: 'أبيض', labelEn: 'White' },
  { id: '#18181b', labelAr: 'أسود', labelEn: 'Black' },
  { id: '#0b3b32', labelAr: 'أخضر', labelEn: 'Green' },
  { id: '#c9a24b', labelAr: 'ذهبي', labelEn: 'Gold' },
  { id: '#b3261e', labelAr: 'أحمر', labelEn: 'Red' },
];

const PRESET_CHIPS = [
  { id: 'tagline', labelAr: 'شعار يوزرسيف', labelEn: 'Tagline', text: 'خليك مختلف\nخليك يوزرسيف' },
  { id: 'aswan', labelAr: 'أسوان', labelEn: 'Aswan', text: 'YUZERSEF\nASWAN · 2026' },
];

/* ──────────────────────────────────────────────────────────────
   Drawing helpers
   ────────────────────────────────────────────────────────────── */
const LW = 480;
const LH = 380;

const GUIDE: Record<ProductKind, [number, number] | null> = {
  tee: [160, 180],
  hoodie: [160, 160],
  cap: [120, 70],
  mug: [130, 140],
  case: [120, 150],
  stickers: null,
};

function resolveInk(ink: string, light: boolean): string {
  if (ink !== 'auto') return ink;
  return light ? '#0b3b32' : '#ffffff';
}

function drawLayers(
  ctx: CanvasRenderingContext2D,
  design: Design,
  img: HTMLImageElement | null,
  light: boolean,
  drawFrame: boolean,
) {
  const ink = resolveInk(design.ink, light);
  const maxDim = 120;

  if (img && img.naturalWidth > 0) {
    const r = Math.min(maxDim / img.naturalWidth, maxDim / img.naturalHeight, 1.5);
    const w = img.naturalWidth * r * design.imgScale;
    const h = img.naturalHeight * r * design.imgScale;
    ctx.save();
    ctx.translate(design.imgPos.x, design.imgPos.y);
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
    if (drawFrame) {
      ctx.strokeStyle = '#38a169';
      ctx.lineWidth = 1.5;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(-w / 2 - 4, -h / 2 - 4, w + 8, h + 8);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }

  const txt = design.text.trim();
  if (txt) {
    const lines = txt.split('\n');
    const ts = design.txtScale;
    ctx.save();
    ctx.translate(design.txtPos.x, design.txtPos.y);
    ctx.scale(ts, ts);
    ctx.fillStyle = ink;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    let fs = 14;
    ctx.font = `bold ${fs}px "IBM Plex Sans Arabic", Manrope, sans-serif`;
    const widest = Math.max(...lines.map((l) => ctx.measureText(l).width), 1);
    if (widest > 108) {
      fs = Math.max(6, (fs * 108) / widest);
      ctx.font = `bold ${fs}px "IBM Plex Sans Arabic", Manrope, sans-serif`;
    }
    const lineH = fs * 1.35;
    const boxH = Math.max(54, lines.length * lineH + 20);
    ctx.strokeStyle = ink.startsWith('#fff') ? 'rgba(255,255,255,0.55)' : 'rgba(11,59,50,0.35)';
    ctx.lineWidth = 1.5;
    ctx.strokeRect(-65, -boxH / 2, 130, boxH);
    lines.forEach((line, i) => {
      ctx.fillText(line, 0, (i - (lines.length - 1) / 2) * lineH);
    });
    if (drawFrame) {
      ctx.strokeStyle = '#38a169';
      ctx.lineWidth = 1.5 / ts;
      ctx.setLineDash([3, 3]);
      ctx.strokeRect(-70, -boxH / 2 - 4, 140, boxH + 8);
      ctx.setLineDash([]);
    }
    ctx.restore();
  }
}

function drawProductShape(ctx: CanvasRenderingContext2D, kind: ProductKind, color: string) {
  const light = isLightColor(color);
  ctx.beginPath();
  if (kind === 'cap') {
    ctx.moveTo(-110, 30);
    ctx.quadraticCurveTo(-115, -60, 0, -85);
    ctx.quadraticCurveTo(115, -60, 110, 30);
    ctx.quadraticCurveTo(140, 50, 130, 65);
    ctx.quadraticCurveTo(0, 85, -130, 65);
    ctx.quadraticCurveTo(-140, 50, -110, 30);
    ctx.closePath();
  } else if (kind === 'case') {
    ctx.roundRect(-75, -140, 150, 280, 26);
  } else if (kind === 'stickers') {
    ctx.roundRect(-115, -90, 230, 180, 24);
  } else if (kind === 'mug') {
    ctx.moveTo(-75, -95);
    ctx.lineTo(75, -95);
    ctx.quadraticCurveTo(75, 105, 65, 115);
    ctx.lineTo(-65, 115);
    ctx.quadraticCurveTo(-75, 105, -75, -95);
    ctx.closePath();
  } else if (kind === 'hoodie') {
    traceGarment(ctx, 'hoodie');
  } else {
    traceGarment(ctx, 'tee');
  }
  ctx.fillStyle = color;
  ctx.fill();
  const shade = ctx.createLinearGradient(-120, 0, 120, 0);
  shade.addColorStop(0, 'rgba(0,0,0,0.18)');
  shade.addColorStop(0.2, 'rgba(255,255,255,0.06)');
  shade.addColorStop(0.5, 'rgba(255,255,255,0.14)');
  shade.addColorStop(0.8, 'rgba(0,0,0,0.06)');
  shade.addColorStop(1, 'rgba(0,0,0,0.22)');
  ctx.fillStyle = shade;
  ctx.fill();

  ctx.lineWidth = 2.5;
  ctx.strokeStyle = light ? 'rgba(0,0,0,0.15)' : 'rgba(255,255,255,0.18)';
  if (kind === 'case') {
    ctx.fillStyle = light ? 'rgba(0,0,0,0.08)' : 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.roundRect(-60, -125, 48, 54, 12);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = light ? 'rgba(0,0,0,0.4)' : 'rgba(255,255,255,0.6)';
    ctx.beginPath();
    ctx.arc(-46, -110, 8, 0, Math.PI * 2);
    ctx.arc(-46, -88, 8, 0, Math.PI * 2);
    ctx.arc(-26, -99, 8, 0, Math.PI * 2);
    ctx.fill();
  } else if (kind === 'mug') {
    ctx.beginPath();
    ctx.lineWidth = 14;
    ctx.strokeStyle = color;
    ctx.arc(88, 10, 36, -Math.PI / 2.3, Math.PI / 2.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = light ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)';
    ctx.ellipse(0, -95, 75, 14, 0, 0, Math.PI * 2);
    ctx.stroke();
  } else if (kind === 'stickers') {
    ctx.setLineDash([4, 4]);
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = light ? '#0b3b32' : '#ffffff';
    ctx.beginPath();
    ctx.roundRect(-105, -80, 210, 160, 18);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (kind === 'cap') {
    ctx.beginPath();
    ctx.lineWidth = 1.5;
    ctx.moveTo(-118, 36);
    ctx.quadraticCurveTo(0, 62, 118, 36);
    ctx.stroke();
  } else {
    // tee / hoodie
    ctx.beginPath();
    ctx.ellipse(0, kind === 'hoodie' ? -150 : -155, 45, 15, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(0,0,0,0.2)';
    ctx.fill();
    if (kind === 'hoodie') {
      ctx.beginPath();
      ctx.lineWidth = 2;
      ctx.moveTo(-17, -140);
      ctx.lineTo(-17, -75);
      ctx.moveTo(17, -140);
      ctx.lineTo(17, -75);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-62, 135);
      ctx.lineTo(-46, 78);
      ctx.lineTo(46, 78);
      ctx.lineTo(62, 135);
      ctx.stroke();
    }
  }
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  kind: ProductKind,
  side: SideId,
  color: string,
  design: Design,
  img: HTMLImageElement | null,
) {
  const light = isLightColor(color);
  ctx.clearRect(0, 0, LW, LH);

  // Floor shadow
  const floor = ctx.createRadialGradient(LW / 2, LH - 28, 6, LW / 2, LH - 28, LW / 2.3);
  floor.addColorStop(0, 'rgba(0,0,0,0.18)');
  floor.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = floor;
  ctx.fillRect(0, LH - 70, LW, 60);

  if (side === 'sleeve' && (kind === 'tee' || kind === 'hoodie')) {
    /* ---- Sleeve view: zoom into sleeve area ---- */
    const sv = SLEEVE_VIEW[kind];
    ctx.save();
    ctx.translate(LW / 2, LH / 2 - 10);
    ctx.scale(1.8, 1.8);
    ctx.translate(-sv.c[0], -sv.c[1]);
    drawProductShape(ctx, kind, color);
    ctx.restore();

    // Art on sleeve (rotated)
    ctx.save();
    ctx.translate(LW / 2 + (sv.c[0] - LW / 2) * -0.8, LH / 2 - 10 + (sv.c[1] - LH / 2 + 10) * -0.8);
    ctx.save();
    ctx.rotate(sv.angle);
    drawLayers(ctx, design, img, light, true);
    ctx.restore();
    ctx.restore();
  } else if (side === 'back') {
    /* ---- Back view: flip horizontally ---- */
    ctx.save();
    ctx.translate(LW / 2, LH / 2 - 10);
    ctx.scale(-1, 1); // mirror for back
    drawProductShape(ctx, kind, color);

    // Print guide (back)
    const guide = GUIDE[kind];
    const [ox, oy] = originFor(kind, 'back');
    if (guide) {
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = light ? 'rgba(11,59,50,0.25)' : 'rgba(255,255,255,0.3)';
      ctx.strokeRect(
        ox - guide[0] / 2,
        oy - guide[1] / 2 + (kind === 'tee' || kind === 'hoodie' ? 35 : 0),
        guide[0],
        guide[1],
      );
      ctx.setLineDash([]);
    }
    ctx.restore();

    // Artwork (not mirrored) – translate to origin only; drawLayers handles per-layer offsets
    ctx.save();
    ctx.translate(LW / 2, LH / 2 - 10);
    ctx.translate(ox, oy);
    drawLayers(ctx, design, img, light, true);
    ctx.restore();
  } else if (side === 'side' && kind === 'cap') {
    /* ---- Cap side view ---- */
    ctx.save();
    ctx.translate(LW / 2, LH / 2 - 10);
    ctx.rotate(-0.3); // slight tilt to suggest perspective
    drawProductShape(ctx, kind, color);
    const [ox, oy] = originFor(kind, 'side');
    ctx.translate(ox, oy);
    drawLayers(ctx, design, img, light, true);
    ctx.restore();
  } else {
    /* ---- Front view (default) ---- */
    ctx.save();
    ctx.translate(LW / 2, LH / 2 - 10);
    drawProductShape(ctx, kind, color);

    // Print guide
    const guide = GUIDE[kind];
    const [ox, oy] = ART_ORIGIN[kind];
    if (guide) {
      ctx.setLineDash([4, 4]);
      ctx.lineWidth = 1;
      ctx.strokeStyle = light ? 'rgba(11,59,50,0.25)' : 'rgba(255,255,255,0.3)';
      ctx.strokeRect(
        ox - guide[0] / 2,
        oy - guide[1] / 2 + (kind === 'tee' || kind === 'hoodie' ? 35 : 0),
        guide[0],
        guide[1],
      );
      ctx.setLineDash([]);
    }
    // Translate to art origin only; drawLayers applies imgPos and txtPos independently
    ctx.translate(ox, oy);
    drawLayers(ctx, design, img, light, true);
    ctx.restore();
  }
}

/* ──────────────────────────────────────────────────────────────
   3-D decal canvas per side
   ────────────────────────────────────────────────────────────── */
function draw3dCanvas(
  c: HTMLCanvasElement,
  kind: ProductKind,
  side: SideId,
  design: Design,
  img: HTMLImageElement | null,
  color: string,
) {
  const ctx = c.getContext('2d');
  if (!ctx) return;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, 512, 512);
  const plane = planeFor(kind, side);
  const k = 512 / plane;
  ctx.save();
  ctx.translate(256, 256);
  if (side === 'sleeve') ctx.rotate(Math.PI / 2);
  // Clip to the visible texture area so art never bleeds beyond the decal bounds
  ctx.beginPath();
  ctx.rect(-256, -256, 512, 512);
  ctx.clip();
  ctx.scale(k, k);
  drawLayers(ctx, design, img, isLightColor(color), false);
  ctx.restore();
}

/* ──────────────────────────────────────────────────────────────
   WebGL helpers
   ────────────────────────────────────────────────────────────── */
function detectWebGL(): boolean {
  if (typeof document === 'undefined') return false;
  try {
    const c = document.createElement('canvas');
    const gl = (c.getContext('webgl2') || c.getContext('webgl')) as WebGLRenderingContext | null;
    if (!gl) return false;
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return true;
  } catch {
    return false;
  }
}

class GLBoundary extends Component<{ onError: () => void; children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch() {
    this.props.onError();
  }
  render() {
    return this.state.failed ? null : this.props.children;
  }
}

/* ──────────────────────────────────────────────────────────────
   MAIN COMPONENT
   ────────────────────────────────────────────────────────────── */
export default function LiveMockupPreview({
  productId,
  productName,
  uploadedFile,
  uploadedFileName,
  onArtworkChange,
  preferredColor,
  availableProductIds,
  onSelectProduct,
}: LiveMockupPreviewProps) {
  const [catalog] = useState(getCatalog);
  const { isEn } = useLanguage();
  const kind = kindOf(productId);
  const sides = SIDES[kind];

  // WebGL
  const [webglOk] = useState(detectWebGL);
  const [glFailed, setGlFailed] = useState(false);
  const can3D = webglOk && !glFailed;
  const [viewMode, setViewMode] = useState<'3d' | '2d'>(() =>
    detectWebGL() && typeof window !== 'undefined' && window.innerWidth >= 640 ? '3d' : '2d',
  );
  const mode = viewMode === '3d' && can3D ? '3d' : '2d';
  const [autoRotate, setAutoRotate] = useState<boolean>(
    () => !(typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches),
  );
  const [resetKey, setResetKey] = useState(0);

  // Colour
  const [selectedColor, setSelectedColor] = useState<string>(
    preferredColor && GARMENT_COLORS.some((c) => c.id === preferredColor) ? preferredColor : '#0b3b32',
  );
  useEffect(() => {
    if (preferredColor && GARMENT_COLORS.some((c) => c.id === preferredColor)) setSelectedColor(preferredColor);
  }, [preferredColor]);

  // Active side  (fall back to front if current side not in product)
  const [activeSide, setActiveSideRaw] = useState<SideId>('front');
  const activeSide_ = sides.includes(activeSide) ? activeSide : 'front';
  const setActiveSide = useCallback(
    (s: SideId) => {
      setActiveSideRaw(s);
      if (mode === '3d') setAutoRotate(false);
    },
    [mode],
  );

  // Per-side designs  (keyed by SideId, persists when product changes)
  const [designs, setDesigns] = useState<Partial<Record<SideId, Design>>>(() => ({
    front: blankDesign('front', kind),
  }));
  const ensureDesign = useCallback((s: SideId) => {
    setDesigns((prev) => {
      if (prev[s]) return prev;
      return { ...prev, [s]: blankDesign(s, kind) };
    });
  }, [kind]);
  useEffect(() => {
    ensureDesign(activeSide_);
  }, [activeSide_, ensureDesign]);
  const design = designs[activeSide_] ?? blankDesign(activeSide_);
  const updDesign = useCallback(
    (patch: Partial<Design>) => {
      setDesigns((prev) => ({ ...prev, [activeSide_]: { ...(prev[activeSide_] ?? blankDesign(activeSide_)), ...patch } }));
    },
    [activeSide_],
  );

  // Per-side loaded images
  const [imgs, setImgs] = useState<Partial<Record<SideId, HTMLImageElement | null>>>({});
  useEffect(() => {
    const url = design.imageUrl;
    if (!url) {
      setImgs((prev) => ({ ...prev, [activeSide_]: null }));
      return;
    }
    const im = new Image();
    im.onload = () => setImgs((prev) => ({ ...prev, [activeSide_]: im }));
    im.src = url;
  }, [design.imageUrl, activeSide_]);
  const activeImg = imgs[activeSide_] ?? null;

  // Keep onArtworkChange stable
  const onArtworkChangeRef = useRef(onArtworkChange);
  useEffect(() => {
    onArtworkChangeRef.current = onArtworkChange;
  }, [onArtworkChange]);

  // Upload file
  const readFile = useCallback(
    (file: File, side: SideId) => {
      if (!file.type.startsWith('image/')) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        const url = ev.target?.result as string;
        setDesigns((prev) => {
          const cur = prev[side] ?? blankDesign(side);
          const hasText = cur.text.trim().length > 0;
          return {
            ...prev,
            [side]: {
              ...cur,
              imageUrl: url,
              ...(hasText && cur.txtPos.x === 0 && cur.txtPos.y === 0
                ? { txtPos: { x: 0, y: 72 }, txtScale: 0.7 }
                : {}),
            },
          };
        });
        if (side === 'front') onArtworkChangeRef.current?.(file.name, url);
      };
      reader.readAsDataURL(file);
    },
    [],
  );

  // Propagate external uploadedFile to front side
  useEffect(() => {
    if (uploadedFile) readFile(uploadedFile, 'front');
  }, [uploadedFile, readFile]);

  /* ---- 2D canvas ---- */
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const scaleRef = useRef(1);
  const [size, setSize] = useState({ w: 480, h: 360 });

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setSize({ w: Math.round(r.width), h: Math.round(r.height) });
    };
    update();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', update);
      return () => window.removeEventListener('resize', update);
    }
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (mode !== '2d') return;
    const c = canvasRef.current;
    if (!c) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    c.width = Math.round(size.w * dpr);
    c.height = Math.round(size.h * dpr);
    const ctx = c.getContext('2d');
    if (!ctx) return;
    const s = Math.min(size.w / LW, size.h / LH);
    scaleRef.current = s;
    ctx.setTransform(dpr * s, 0, 0, dpr * s, ((size.w - LW * s) / 2) * dpr, ((size.h - LH * s) / 2) * dpr);
    drawScene(ctx, kind, activeSide_, selectedColor, design, activeImg);
  }, [mode, size, kind, activeSide_, selectedColor, design, activeImg]);

  // Drag on 2D canvas moves art position
  const [isDragging, setIsDragging] = useState(false);
  const dragRef = useRef({ startX: 0, startY: 0, initX: 0, initY: 0 });
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(true);
    dragRef.current = { startX: e.clientX, startY: e.clientY, initX: design.imgPos.x, initY: design.imgPos.y };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!isDragging) return;
    const s = scaleRef.current || 1;
    const nx = Math.max(-100, Math.min(100, dragRef.current.initX + (e.clientX - dragRef.current.startX) / s));
    const ny = Math.max(-100, Math.min(100, dragRef.current.initY + (e.clientY - dragRef.current.startY) / s));
    updDesign({ imgPos: { x: nx, y: ny } });
  };
  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    setIsDragging(false);
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* noop */ }
  };

  /* ---- 3D art canvases: one 512×512 per side ---- */
  const artCanvases = useMemo<Partial<Record<SideId, HTMLCanvasElement>>>(() => {
    if (typeof document === 'undefined') return {};
    const out: Partial<Record<SideId, HTMLCanvasElement>> = {};
    (['front', 'back', 'sleeve', 'side'] as SideId[]).forEach((s) => {
      const c = document.createElement('canvas');
      c.width = 512;
      c.height = 512;
      out[s] = c;
    });
    return out;
  }, []);

  const [artVersion, setArtVersion] = useState(0);

  // Redraw all side canvases when anything changes
  useEffect(() => {
    sides.forEach((s) => {
      const c = artCanvases[s];
      if (!c) return;
      const d = designs[s] ?? blankDesign(s);
      const im = imgs[s] ?? null;
      draw3dCanvas(c, kind, s, d, im, selectedColor);
    });
    setArtVersion((v) => v + 1);
  }, [artCanvases, sides, kind, designs, imgs, selectedColor]);

  /* ---- UI helpers ---- */
  const btn =
    'w-9 h-9 rounded-md bg-[#f4f7f3] hover:bg-[#0b3b32] hover:text-white text-[#0b3b32] flex items-center justify-center transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-[#0b3b32]';

  const hasArt = (s: SideId) => {
    const d = designs[s];
    return !!(d?.imageUrl || d?.text?.trim());
  };

  /* ── Text editor state ── */
  const [activeLayer, setActiveLayer] = useState<'img' | 'txt'>('txt');
  const layerHasBoth = !!(design.imageUrl && design.text.trim());
  const effectiveLayer = layerHasBoth ? activeLayer : design.imageUrl ? 'img' : 'txt';

  const stepScale = (delta: number) => {
    const cur = effectiveLayer === 'img' ? design.imgScale : design.txtScale;
    const next = Math.min(2.5, Math.max(0.2, Number((cur + delta).toFixed(2))));
    updDesign(effectiveLayer === 'img' ? { imgScale: next } : { txtScale: next });
  };
  const resetLayer = () => {
    updDesign(
      effectiveLayer === 'img'
        ? { imgPos: { x: 0, y: 0 }, imgScale: defaultImgScale(activeSide_) }
        : { txtPos: { x: 0, y: 0 }, txtScale: defaultTxtScale(activeSide_) },
    );
  };
  const curScale = effectiveLayer === 'img' ? design.imgScale : design.txtScale;

  return (
    <div className="w-full bg-[#f8faf7] border border-[#dce4dc] rounded-xl p-3 sm:p-4 md:p-5 mb-5 shadow-sm">
      {/* ── Header ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#e5ebe4]">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-full bg-[#0b3b32] text-white flex items-center justify-center shrink-0">
            {mode === '3d' ? <Rotate3d size={16} /> : <Eye size={16} />}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-[#0b3b32] leading-tight flex items-center flex-wrap gap-x-2 gap-y-1">
              {isEn ? 'Live Mockup Preview' : 'المعاينة الحية للمنتج'}
              {productName && (
                <span className="text-[11px] font-semibold bg-[#e4ede3] text-[#0b3b32] px-2 py-0.5 rounded-full truncate max-w-[200px]">
                  {productName}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-[#718277] leading-snug mt-0.5">
              {isEn
                ? 'Switch sides, toggle 2D/3D, drag artwork and edit text per side.'
                : 'اختار الوش / الضهر / الجنب، بدّل 2D و3D، واضبط التصميم والنص لكل ناحية.'}
            </p>
          </div>
        </div>

        {/* 2D / 3D toggle */}
        <div
          className="flex items-center bg-[#e8eee6] p-1 rounded-lg text-xs font-bold shrink-0"
          role="tablist"
          aria-label={isEn ? 'Preview mode' : 'وضع المعاينة'}
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === '2d'}
            onClick={() => setViewMode('2d')}
            className={`px-3.5 h-8 rounded-md flex items-center gap-1.5 transition-colors cursor-pointer ${
              mode === '2d' ? 'bg-[#0b3b32] text-white shadow-sm' : 'text-[#506357] hover:text-[#0b3b32]'
            }`}
          >
            <Square size={13} /><span>2D</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === '3d'}
            disabled={!can3D}
            onClick={() => setViewMode('3d')}
            title={!can3D ? (isEn ? '3D not supported' : '3D غير مدعوم') : undefined}
            className={`px-3.5 h-8 rounded-md flex items-center gap-1.5 transition-colors ${
              mode === '3d' ? 'bg-[#0b3b32] text-white shadow-sm' : 'text-[#506357] hover:text-[#0b3b32]'
            } ${can3D ? 'cursor-pointer' : 'opacity-40 cursor-not-allowed'}`}
          >
            <Box size={13} /><span>3D</span>
          </button>
        </div>
      </div>

      {/* ── Product switcher ── */}
      {availableProductIds && availableProductIds.length > 1 && (
        <div className="flex items-center gap-2 pt-2.5 pb-1 border-b border-[#e5ebe4]">
          <span className="text-[11px] font-bold text-[#0b3b32] flex items-center gap-1 shrink-0">
            <Eye size={13} />
            {isEn ? 'Preview on:' : 'عاين على:'}
          </span>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 -mb-0.5">
            {availableProductIds.map((pid) => {
              const s = catalog.find((srv) => srv.id === pid);
              const isActive = pid === productId;
              return (
                <button
                  key={pid}
                  type="button"
                  onClick={() => onSelectProduct?.(pid)}
                  className={`px-3 h-8 rounded-md text-xs font-semibold transition-all cursor-pointer shrink-0 whitespace-nowrap ${
                    isActive ? 'bg-[#0b3b32] text-white' : 'bg-white border border-[#d6dfd5] text-[#2d4b3b] hover:bg-[#edf3ed]'
                  }`}
                >
                  {s?.name[isEn ? 'en' : 'ar'] || pid}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Side chips (only if product has >1 side) ── */}
      {sides.length > 1 && (
        <div className="flex items-center gap-2 pt-2.5 pb-1">
          <span className="text-[11px] font-bold text-[#0b3b32] shrink-0">{isEn ? 'Side:' : 'الناحية:'}</span>
          <div className="flex items-center gap-1.5 flex-wrap">
            {sides.map((s) => {
              const label = isEn ? SIDE_LABEL[s].en : SIDE_LABEL[s].ar;
              const active = s === activeSide_;
              const dot = hasArt(s);
              return (
                <button
                  key={s}
                  type="button"
                  onClick={() => setActiveSide(s)}
                  className={`relative h-8 px-3 rounded-full text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                    active
                      ? 'bg-[#0b3b32] text-white shadow-sm'
                      : 'bg-white border border-[#d6dfd5] text-[#2d4b3b] hover:bg-[#edf3ed]'
                  }`}
                >
                  {label}
                  {dot && !active && (
                    <span className="absolute top-0.5 end-0.5 w-1.5 h-1.5 rounded-full bg-[#0b3b32]" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Viewport ── */}
      <div
        ref={wrapRef}
        className="relative mt-3 w-full aspect-[5/4] sm:aspect-[4/3] lg:aspect-[16/9] max-h-[540px] bg-gradient-to-b from-[#f3f6f2] to-[#e4eae2] rounded-lg overflow-hidden border border-[#d6dfd5] select-none"
      >
        {/* 2D */}
        <canvas
          ref={canvasRef}
          style={{ width: size.w, height: size.h, display: mode === '2d' ? 'block' : 'none' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          className={`touch-none ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          aria-label={isEn ? '2D product preview' : 'معاينة ثنائية الأبعاد'}
        />

        {/* 3D */}
        {mode === '3d' && (
          <div className="absolute inset-0 cursor-grab active:cursor-grabbing">
            <GLBoundary key={kind} onError={() => setGlFailed(true)}>
              <Suspense
                fallback={
                  <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-[#0b3b32] text-xs font-semibold">
                    <Loader2 size={22} className="animate-spin" />
                    <span>{isEn ? 'Loading 3D…' : 'جاري تحميل المجسم…'}</span>
                  </div>
                }
              >
                <Product3DViewer
                  productId={productId}
                  color={selectedColor}
                  canvases={artCanvases}
                  version={artVersion}
                  side={activeSide_}
                  autoRotate={autoRotate}
                  onInteract={() => setAutoRotate(false)}
                  resetKey={resetKey}
                />
              </Suspense>
            </GLBoundary>
          </div>
        )}

        {/* Side pill */}
        <div className="absolute top-2.5 start-2.5 bg-[#0b3b32]/85 backdrop-blur-sm text-white text-[11px] font-bold px-2.5 py-1 rounded-full pointer-events-none shadow-xs">
          {isEn ? SIDE_LABEL[activeSide_].en : SIDE_LABEL[activeSide_].ar}
        </div>

        {/* Floating toolbar */}
        <div className="absolute bottom-2.5 inset-x-0 flex justify-center pointer-events-none px-2">
          <div className="pointer-events-auto flex items-center gap-1 bg-white/92 backdrop-blur-sm p-1 rounded-xl border border-[#d6dfd5] shadow-sm">
            <button type="button" onClick={() => stepScale(-0.15)} className={btn} title={isEn ? 'Smaller' : 'تصغير'} aria-label={isEn ? 'Smaller' : 'تصغير'}>
              <ZoomOut size={15} />
            </button>
            <span className="text-[11px] font-mono font-bold text-[#0b3b32] min-w-[40px] text-center">
              {Math.round(curScale * 100)}%
            </span>
            <button type="button" onClick={() => stepScale(0.15)} className={btn} title={isEn ? 'Larger' : 'تكبير'} aria-label={isEn ? 'Larger' : 'تكبير'}>
              <ZoomIn size={15} />
            </button>
            <div className="w-px h-5 bg-[#d0dcd2] mx-0.5" />
            <button type="button" onClick={resetLayer} className={btn} title={isEn ? 'Centre' : 'توسيط'} aria-label={isEn ? 'Centre' : 'توسيط'}>
              <RefreshCw size={14} />
            </button>
            {mode === '3d' && (
              <>
                <div className="w-px h-5 bg-[#d0dcd2] mx-0.5" />
                <button
                  type="button"
                  onClick={() => setAutoRotate((v) => !v)}
                  className={btn}
                  aria-label={isEn ? 'Toggle rotation' : 'تبديل الدوران'}
                  aria-pressed={autoRotate}
                >
                  {autoRotate ? <Pause size={14} /> : <Play size={14} />}
                </button>
                <button type="button" onClick={() => setResetKey((k) => k + 1)} className={btn} aria-label={isEn ? 'Reset view' : 'إعادة الزاوية'}>
                  <Rotate3d size={14} />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {glFailed && (
        <p className="mt-2 text-[11px] text-[#8a5a2b] bg-[#fbf3e6] border border-[#efdcb8] rounded px-2.5 py-1.5">
          {isEn
            ? '3D preview is not available on this device, showing 2D instead.'
            : 'المعاينة ثلاثية الأبعاد غير متاحة، تم عرض ثنائية الأبعاد.'}
        </p>
      )}

      {/* ── Controls ── */}
      <div className="mt-4 grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Left: colour + sliders */}
        <div className="space-y-4">
          {/* Colours */}
          <div>
            <label className="text-[11px] font-bold text-[#0b3b32] flex items-center gap-1.5 mb-2">
              <Palette size={14} className="text-[#64846f]" />
              <span>{isEn ? 'Product Color' : 'لون المنتج'}</span>
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {GARMENT_COLORS.map((color) => {
                const active = selectedColor === color.id;
                const name = isEn ? color.nameEn : color.nameAr;
                return (
                  <button
                    key={color.id}
                    type="button"
                    onClick={() => setSelectedColor(color.id)}
                    title={name}
                    aria-label={name}
                    aria-pressed={active}
                    className={`flex items-center gap-1.5 pe-3 ps-1.5 h-9 rounded-full border text-[11px] transition-all cursor-pointer ${
                      active
                        ? 'border-[#0b3b32] bg-[#eef4ee] font-bold text-[#0b3b32] ring-1 ring-[#0b3b32]'
                        : 'border-[#dce4dc] bg-white text-[#55695d] hover:border-[#9ab4a1]'
                    }`}
                  >
                    <span className="w-6 h-6 rounded-full border border-black/15 shadow-inner" style={{ backgroundColor: color.id }} />
                    <span className="hidden sm:inline">{name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Position & size sliders */}
          <div>
            <div className="text-[11px] font-bold text-[#0b3b32] flex items-center gap-1.5 mb-2">
              <SlidersHorizontal size={14} className="text-[#64846f]" />
              <span>{isEn ? 'Position & Size' : 'الموضع والحجم'}</span>
              {/* Layer chip if both exist */}
              {layerHasBoth && (
                <div className="ms-auto flex items-center gap-1 bg-[#e8eee6] p-0.5 rounded-md text-[10px]">
                  <button
                    type="button"
                    onClick={() => setActiveLayer('txt')}
                    className={`px-2 h-6 rounded transition-colors cursor-pointer ${activeLayer === 'txt' ? 'bg-[#0b3b32] text-white' : 'text-[#506357]'}`}
                  >
                    {isEn ? 'Text' : 'نص'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveLayer('img')}
                    className={`px-2 h-6 rounded transition-colors cursor-pointer ${activeLayer === 'img' ? 'bg-[#0b3b32] text-white' : 'text-[#506357]'}`}
                  >
                    {isEn ? 'Image' : 'صورة'}
                  </button>
                </div>
              )}
            </div>
            <div className="space-y-2.5">
              {[
                {
                  key: 'size',
                  label: isEn ? 'Size' : 'الحجم',
                  min: 20,
                  max: 250,
                  value: Math.round(curScale * 100),
                  onChange: (v: number) => stepScale(v / 100 - curScale),
                  suffix: '%',
                },
                {
                  key: 'x',
                  label: isEn ? 'H. Position' : 'أفقي',
                  min: -100,
                  max: 100,
                  value: Math.round(effectiveLayer === 'img' ? design.imgPos.x : design.txtPos.x),
                  onChange: (v: number) =>
                    updDesign(effectiveLayer === 'img' ? { imgPos: { ...design.imgPos, x: v } } : { txtPos: { ...design.txtPos, x: v } }),
                  suffix: '',
                },
                {
                  key: 'y',
                  label: isEn ? 'V. Position' : 'رأسي',
                  min: -100,
                  max: 100,
                  value: Math.round(effectiveLayer === 'img' ? design.imgPos.y : design.txtPos.y),
                  onChange: (v: number) =>
                    updDesign(effectiveLayer === 'img' ? { imgPos: { ...design.imgPos, y: v } } : { txtPos: { ...design.txtPos, y: v } }),
                  suffix: '',
                },
              ].map((s) => (
                <label key={s.key} className="flex items-center gap-3 text-[11px] text-[#55695d]">
                  <span className="w-16 shrink-0 font-semibold">{s.label}</span>
                  <input
                    type="range"
                    min={s.min}
                    max={s.max}
                    value={s.value}
                    onChange={(e) => s.onChange(Number(e.target.value))}
                    className="flex-1 h-8 accent-[#0b3b32] cursor-pointer"
                  />
                  <span className="w-12 text-end font-mono font-bold text-[#0b3b32]" dir="ltr">
                    {s.value}{s.suffix}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Right: text + ink + image upload */}
        <div className="space-y-4">
          {/* Text editor */}
          <div>
            <label className="text-[11px] font-bold text-[#0b3b32] flex items-center gap-1.5 mb-2">
              <Sparkles size={14} className="text-[#64846f]" />
              <span>{isEn ? 'Print Text' : 'نص الطباعة'}</span>
              <span className="ms-auto text-[10px] font-semibold text-[#718277]">
                {isEn ? SIDE_LABEL[activeSide_].en : SIDE_LABEL[activeSide_].ar}
              </span>
            </label>
            {/* Preset chips */}
            <div className="flex items-center gap-1.5 flex-wrap mb-2">
              {PRESET_CHIPS.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => updDesign({ text: p.text })}
                  className="px-2.5 h-7 rounded-full border border-[#bcd2bf] bg-white text-[10px] text-[#2d4b3b] hover:bg-[#edf3ed] cursor-pointer transition-colors whitespace-nowrap"
                >
                  {isEn ? p.labelEn : p.labelAr}
                </button>
              ))}
              <button
                type="button"
                onClick={() => updDesign({ text: '' })}
                className="px-2.5 h-7 rounded-full border border-[#e0c0c0] bg-white text-[10px] text-[#8b4040] hover:bg-[#fdf0f0] cursor-pointer transition-colors whitespace-nowrap"
              >
                {isEn ? 'Clear' : 'مسح'}
              </button>
            </div>
            <textarea
              rows={2}
              maxLength={60}
              value={design.text}
              onChange={(e) => updDesign({ text: e.target.value })}
              placeholder={isEn ? 'Type text to print…' : 'اكتب النص المطلوب طباعته…'}
              className="w-full text-xs p-2.5 bg-white border border-[#dce4dc] rounded-md text-[#0b3b32] focus:outline-none focus:border-[#0b3b32] focus:ring-1 focus:ring-[#0b3b32] resize-none"
              dir="auto"
            />

            {/* Ink colour */}
            <div className="mt-2">
              <span className="text-[10px] font-bold text-[#718277] block mb-1">{isEn ? 'Ink Color' : 'لون الحبر'}</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {INK_OPTIONS.map((ink) => {
                  const active = design.ink === ink.id;
                  return (
                    <button
                      key={ink.id}
                      type="button"
                      onClick={() => updDesign({ ink: ink.id })}
                      title={isEn ? ink.labelEn : ink.labelAr}
                      aria-pressed={active}
                      className={`h-7 px-2 rounded-full border text-[10px] transition-all cursor-pointer flex items-center gap-1 ${
                        active ? 'border-[#0b3b32] ring-1 ring-[#0b3b32] bg-[#eef4ee] font-bold text-[#0b3b32]' : 'border-[#dce4dc] bg-white text-[#55695d] hover:border-[#9ab4a1]'
                      }`}
                    >
                      {ink.id !== 'auto' && (
                        <span
                          className="w-4 h-4 rounded-full border border-black/15"
                          style={{ backgroundColor: ink.id }}
                        />
                      )}
                      <span>{isEn ? ink.labelEn : ink.labelAr}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Image upload */}
          <div>
            <div className="text-[11px] font-bold text-[#0b3b32] flex items-center justify-between gap-2 mb-2">
              <span>{isEn ? 'Artwork Image' : 'صورة التصميم'}</span>
              <label className="text-[11px] text-[#0b3b32] font-semibold cursor-pointer flex items-center gap-1.5 h-9 px-3 rounded-full border border-[#bcd2bf] bg-white hover:bg-[#0b3b32] hover:text-white transition-colors">
                <Upload size={13} />
                <span>{isEn ? 'Upload' : 'رفع صورة'}</span>
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) readFile(f, activeSide_); }} className="hidden" />
              </label>
            </div>
            {design.imageUrl ? (
              <div className="flex items-center gap-2">
                <img
                  src={design.imageUrl}
                  alt=""
                  className="w-12 h-12 rounded-md object-cover border border-[#dce4dc]"
                />
                <span className="text-[11px] text-[#0b3b32] font-semibold truncate flex-1">
                  {activeSide_ === 'front' && uploadedFileName ? uploadedFileName : (isEn ? 'Custom Image' : 'صورتك')}
                </span>
                <button
                  type="button"
                  onClick={() => updDesign({ imageUrl: '' })}
                  className="w-7 h-7 rounded-full bg-[#f0e8e8] text-[#b3261e] flex items-center justify-center hover:bg-[#b3261e] hover:text-white transition-colors cursor-pointer"
                  aria-label={isEn ? 'Remove image' : 'حذف الصورة'}
                >
                  <X size={13} />
                </button>
              </div>
            ) : (
              <p className="text-[11px] text-[#718277]">{isEn ? 'No image uploaded for this side.' : 'لم يتم رفع صورة لهذه الناحية.'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
