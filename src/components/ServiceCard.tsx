import { ArrowUpLeft, Check, Shirt, Coffee, Smartphone, Sparkles, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import type { Service } from '../data/services';
import { useLanguage } from '../lib/language';
import { useCart } from '../lib/cart';
import BrandedProductImage, { type ProductPrintKind } from './BrandedProductImage';

const icons = { shirt: Shirt, cap: Tag, sparkles: Sparkles, cup: Coffee, phone: Smartphone, tag: Tag } as const;
const printKinds: Record<string, ProductPrintKind> = {
  tee: 'tee',
  hoodie: 'hoodie',
  cap: 'cap',
  stickers: 'sticker',
  mug: 'mug',
  case: 'phone',
};

export default function ServiceCard({ service, compact = false }: { service: Service; compact?: boolean }) {
  const { isEn } = useLanguage();
  const { items, add } = useCart();
  const Icon = icons[service.icon as keyof typeof icons] || Sparkles;
  const added = items.includes(service.id);

  return (
    <article className={`[background:#fff] [min-width:0] [transition:transform_.25s_cubic-bezier(.2,.75,.2,1),box-shadow_.25s] hover:[transform:translateY(-4px)] hover:[box-shadow:0_17px_35px_rgba(20,49,37,.08)] rounded-md overflow-hidden border border-[#e2e9e2] ${compact ? "[&>a]:[height:220px] max-[1000px]:[&>a]:[height:240px] max-[720px]:[&>a]:[height:165px] max-[390px]:[&>a]:[height:140px]" : ''}`}>
      <Link
        to="/request"
        state={{ serviceId: service.id }}
        className={"[height:270px] [display:block] [position:relative] [overflow:hidden] [background:#dce4dc] max-[1000px]:[height:260px] max-[720px]:[height:180px] max-[390px]:[height:150px] group"}
        aria-label={isEn ? `Request ${service.name.en}` : `اطلب ${service.name.ar}`}
      >
        <BrandedProductImage
          src={service.image}
          alt={isEn ? service.name.en : service.name.ar}
          kind={printKinds[service.id] || 'tee'}
        />
        <span className={"[position:absolute] [inset-inline-start:14px] [top:14px] [width:35px] [height:35px] [display:grid] [place-items:center] [background:rgba(255,255,255,.91)] [color:#0b3b32] [border-radius:50%] shadow-sm max-[720px]:[width:29px] max-[720px]:[height:29px] max-[720px]:[inset-inline-start:8px] max-[720px]:[top:8px]"}>
          <Icon size={18} />
        </span>
        <span className={"[position:absolute] [bottom:13px] [inset-inline-end:13px] [width:32px] [height:32px] [background:#fff] [color:#0b3b32] [display:grid] [place-items:center] [border-radius:50%] shadow-sm transition-transform duration-200 group-hover:scale-110"}>
          <ArrowUpLeft size={17} />
        </span>
      </Link>
      <div className={"[padding:15px_15px_17px] [&_p]:[font-size:11px] [&_p]:[color:#738079] [&_p]:[line-height:1.7] [&_p]:[margin:7px_0_15px] [&_p]:[min-height:19px] max-[720px]:[padding:12px_10px_14px] max-[720px]:[&_p]:[font-size:9px] max-[720px]:[&_p]:[min-height:30px] max-[390px]:[&_p]:[min-height:40px]"}>
        <div className={"[display:flex] [justify-content:space-between] [align-items:center] [gap:12px] [&_h3]:[font-size:15px] [&_h3]:[color:#0b3b32] [&_h3]:[margin:0] [&_h3]:[font-weight:600] [&_>span]:[font:600_9px_Manrope,sans-serif] [&_>span]:[color:#9caa9e] max-[720px]:[&_h3]:[font-size:12px] max-[720px]:[&_>span]:[font-size:8px]"}>
          <h3>{isEn ? service.name.en : service.name.ar}</h3>
          <span>0{service.id.length % 8 + 1}</span>
        </div>
        <p>{isEn ? service.short.en : service.short.ar}</p>
        <button
          type="button"
          className={`[padding:0] [border:0] [background:transparent] [color:#0b3b32] [display:inline-flex] [align-items:center] [gap:8px] [font-size:10px] [font-weight:700] [&_svg]:[transition:transform_.2s] hover:[transform:translate(-3px,-3px)] [margin-bottom:3px] [justify-content:center] max-[720px]:[font-size:8px] max-[720px]:[gap:4px] cursor-pointer ${added ? "[color:#42715c]" : ''}`}
          onClick={() => add(service.id)}
        >
          {added ? (isEn ? 'Added to your request' : 'أُضيف لطلبك') : (isEn ? 'Add to request' : 'أضف إلى طلبك')}
          {added ? <Check size={15} /> : <ArrowUpLeft size={15} />}
        </button>
      </div>
    </article>
  );
}
