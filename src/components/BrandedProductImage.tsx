import type { ReactNode } from 'react';

export type ProductPrintKind = 'tee' | 'hoodie' | 'cap' | 'mug' | 'sticker' | 'phone';

const printKinds: Record<string, ProductPrintKind> = {
  tee: 'tee',
  hoodie: 'hoodie',
  cap: 'cap',
  stickers: 'sticker',
  mug: 'mug',
  case: 'phone',
};

const printPlacement: Record<ProductPrintKind, string> = {
  tee: 'left-1/2 top-[40%] -translate-x-1/2 -translate-y-1/2',
  hoodie: 'left-1/2 top-[42%] -translate-x-1/2 -translate-y-1/2',
  cap: 'left-1/2 top-[38%] -translate-x-1/2 -translate-y-1/2',
  mug: 'left-[40%] top-[48%] -translate-x-1/2 -translate-y-1/2',
  sticker: 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2',
  phone: 'left-1/2 top-[52%] -translate-x-1/2 -translate-y-1/2',
};

export function productPrintKindFor(productId: string): ProductPrintKind {
  return printKinds[productId] || 'tee';
}

type BrandedProductImageProps = {
  src: string;
  alt: string;
  kind?: ProductPrintKind;
  className?: string;
  showBrand?: boolean;
  children?: ReactNode;
};

export default function BrandedProductImage({
  src,
  alt,
  kind = 'tee',
  className = '',
  showBrand = false,
  children,
}: BrandedProductImageProps) {
  const isCustomSized = className.includes('relative') || className.includes('w-') || className.includes('h-');
  const wrapperClass = isCustomSized ? className : `absolute inset-0 w-full h-full ${className}`;

  return (
    <span className={`block overflow-hidden ${wrapperClass}`}>
      <img
        className="block w-full h-full object-cover transition-transform duration-700 ease-out hover:scale-105"
        src={src}
        alt={alt}
        loading="lazy"
      />
      {showBrand && (
        <img
          className={`absolute z-10 w-8 h-auto rounded object-contain shadow-md pointer-events-none border border-white/60 ${printPlacement[kind] || 'left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2'}`}
          src="/assets/yuzersef-logo.jpg"
          alt=""
          aria-hidden="true"
        />
      )}
      {children}
    </span>
  );
}
