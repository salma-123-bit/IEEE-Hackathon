import { useEffect, useState } from 'react';

type RGB = { r: number; g: number; b: number };

function parseColor(value: string): RGB | null {
  const rgb = value.match(/^\s*rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)\s*$/i);
  if (rgb) {
    const [, r, g, b] = rgb;
    const channels = [Number(r), Number(g), Number(b)];
    if (channels.every((channel) => channel <= 255)) return { r: channels[0], g: channels[1], b: channels[2] };
  }
  const hex = value.trim().match(/^#?([\da-f]{3}|[\da-f]{6})$/i);
  if (hex) {
    const digits = hex[1].length === 3 ? [...hex[1]].map((digit) => digit + digit).join('') : hex[1];
    return { r: parseInt(digits.slice(0, 2), 16), g: parseInt(digits.slice(2, 4), 16), b: parseInt(digits.slice(4, 6), 16) };
  }
  return null;
}

export function normalizeColorToRgb(value: string) {
  const color = parseColor(value) || { r: 11, g: 59, b: 50 };
  return `rgb(${color.r}, ${color.g}, ${color.b})`;
}

function toHex(color: RGB) {
  return `#${[color.r, color.g, color.b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;
}

export default function RgbColorPicker({
  label,
  value,
  onChange,
  isEn,
}: {
  label: string;
  value: string;
  onChange: (color: string) => void;
  isEn: boolean;
}) {
  const [rgbText, setRgbText] = useState(() => normalizeColorToRgb(value));
  const parsedValue = parseColor(value) || { r: 11, g: 59, b: 50 };

  useEffect(() => setRgbText(normalizeColorToRgb(value)), [value]);

  const updateFromPicker = (hex: string) => {
    const color = normalizeColorToRgb(hex);
    setRgbText(color);
    onChange(color);
  };

  return <label className="text-xs font-bold text-[#0b3b32] flex flex-col gap-1.5">
    <span>{label}</span>
    <div className="flex min-w-0 items-center gap-2 rounded border border-[#dce4dc] bg-[#fbfcfa] p-2">
      <input
        type="color"
        value={toHex(parsedValue)}
        onChange={(event) => updateFromPicker(event.target.value)}
        aria-label={isEn ? 'Open color wheel' : 'افتح عجلة الألوان'}
        title={isEn ? 'Choose a custom color' : 'اختار درجة مخصصة من عجلة الألوان'}
        className="h-10 w-12 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0"
      />
      <input
        type="text"
        value={rgbText}
        onChange={(event) => {
          const next = event.target.value;
          setRgbText(next);
          const parsed = parseColor(next);
          if (parsed) onChange(`rgb(${parsed.r}, ${parsed.g}, ${parsed.b})`);
        }}
        onBlur={() => setRgbText(normalizeColorToRgb(value))}
        placeholder="rgb(11, 59, 50)"
        aria-label={isEn ? `${label} in RGB format` : `${label} بصيغة RGB`}
        dir="ltr"
        className="min-w-0 flex-1 bg-transparent px-2 py-2 font-mono text-xs text-[#0b3b32] outline-none"
      />
    </div>
    <span className="text-[10px] font-normal text-[#718277]">{isEn ? 'Pick a color or enter RGB values (0–255).' : 'اختار من عجلة الألوان أو اكتب قيم RGB من 0 إلى 255.'}</span>
  </label>;
}
