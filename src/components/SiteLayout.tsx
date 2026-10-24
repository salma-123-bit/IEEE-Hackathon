import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { ArrowUpLeft, Menu, X } from 'lucide-react';
import { useLanguage } from '../lib/language';

const links = [
  { to: '/', ar: 'الرئيسية', en: 'Home' },
  { to: '/services', ar: 'الخدمات', en: 'Services' },
  { to: '/gallery', ar: 'معرض الأعمال', en: 'Gallery' },
  { to: '/track', ar: 'تتبع طلبك', en: 'Track an order' },
  { to: '/contact', ar: 'تواصل معنا', en: 'Contact' },
];

function Brand({ footer = false }: { footer?: boolean }) {
  return <Link to="/" className={`inline-flex min-w-[184px] items-center gap-[10px] max-[720px]:min-w-0 ${footer ? '[&>span>strong]:text-white [&>span>small]:text-[#b8c7bb]' : ''}`} aria-label="Yuzersef home">
    <img className={footer ? 'block h-[54px] w-auto shrink-0 object-contain rounded max-[720px]:h-[46px]' : 'block h-[48px] w-auto shrink-0 object-contain rounded max-[1000px]:h-[42px] max-[720px]:h-[36px]'} src="/assets/yuzersef-logo.jpg" alt="يوزرسيف" />
    <span className={"flex flex-col leading-[1.1] [&>strong]:text-[18px] [&>strong]:font-bold [&>strong]:tracking-[-.04em] [&>small]:mt-[5px] [&>small]:font-[700_7px_Manrope,sans-serif] [&>small]:tracking-[.16em] [&>small]:text-[#83918a] max-[720px]:[&>strong]:text-[16px] max-[720px]:[&>small]:text-[6px]"}><strong>يوزرسيف</strong><small>YUZERSEF · ASWAN</small></span>
  </Link>;
}

export default function SiteLayout() {
  const { isEn, toggle } = useLanguage();
  const [open, setOpen] = useState(false);
  const location = useLocation();
  const langLabel = isEn ? 'العربية' : 'EN';

  return <>
    <div className={"[height:31px] [display:flex] [align-items:center] [justify-content:center] [gap:9px] [background:#082d27] [color:#c9d9d1] [font-size:10px] [letter-spacing:.08em] max-[720px]:[font-size:8px] max-[720px]:[letter-spacing:.04em]"}><span className={"[width:5px] [height:5px] [border-radius:50%] [background:#b6c991]"} />{isEn ? 'Made personal in Aswan — every detail starts with your idea' : 'من أسوان — كل تفصيلة تبدأ من فكرتك'}</div>
    <header className={"[height:82px] [background:#fff] [position:relative] [z-index:30] [border-bottom:1px_solid_#e9ede8] max-[720px]:[height:69px]"}>
      <div className={"[height:100%]  [align-items:center]  [gap:30px] max-[720px]: [width:min(1220px,calc(100%_-_72px))] [margin-inline:auto] [display:flex] [justify-content:space-between] [gap:12px] max-[1000px]:[width:min(100%_-_48px,900px)] max-[720px]:[width:calc(100%_-_38px)]   max-[390px]:[width:calc(100%_-_30px)]"}>
        <Brand />
        <nav className={`[display:flex] [align-items:center] [gap:33px] [font-size:13px] [color:#50615a] [&_a]:[transition:color_.2s] [&_a:hover]:[color:#0b3b32] [&_a:hover]:[font-weight:600] max-[1000px]:[gap:20px] max-[720px]:[display:none] max-[720px]:[position:absolute] max-[720px]:[top:69px] max-[720px]:[inset-inline:0] max-[720px]:[background:#fff] max-[720px]:[padding:13px_19px_18px] max-[720px]:[box-shadow:0_14px_18px_rgba(13,45,35,.12)] max-[720px]:[flex-direction:column] max-[720px]:[align-items:stretch] max-[720px]:[gap:0] data-[open=true]:[display:flex] ${open ? "max-[720px]:[display:flex]" : ''}`} data-open={open} aria-label={isEn ? 'Main navigation' : 'التنقل الرئيسي'}>
          {links.map((link) => <NavLink key={link.to} to={link.to} end={link.to === '/'} onClick={() => setOpen(false)} className="max-[720px]:py-[13px] max-[720px]:border-b max-[720px]:border-[#eef1ed]">{isEn ? link.en : link.ar}</NavLink>)}
          <Link className={"[display:none] max-[720px]:[&>a:not(.nav-mobile-cta)]:[padding:13px_4px] max-[720px]:[&>a:not(.nav-mobile-cta)]:[border-bottom:1px_solid_#eef1ed] max-[720px]:[display:flex] max-[720px]:[align-items:center] max-[720px]:[justify-content:space-between] max-[720px]:[background:#0b3b32] max-[720px]:[color:#fff] max-[720px]:[padding:13px_14px] max-[720px]:[margin-top:13px] max-[720px]:[font-size:11px]"} to="/request" onClick={() => setOpen(false)}>{isEn ? 'Start a request' : 'ابدأ طلبك الآن'} <ArrowUpLeft size={15} /></Link>
        </nav>
        <div className={"[display:flex] [align-items:center] [gap:13px] max-[720px]:[gap:11px]"}>
          <button className={"[border:0] [background:none] [color:#0b3b32] [font:700_11px_Manrope,sans-serif] [min-width:36px] max-[720px]:[min-width:29px] max-[720px]:[font-size:10px]"} type="button" onClick={toggle} aria-label={isEn ? 'Switch to Arabic' : 'Switch to English'}>{langLabel}</button>
          <Link className={"[min-height:40px] [padding:0_21px] [border:1px_solid_transparent] [display:inline-flex] [align-items:center] [justify-content:center] [gap:11px] [font-size:10px] [font-weight:600] [transition:transform_.25s_cubic-bezier(.2,.75,.2,1),background_.25s,color_.25s,border_.25s] [white-space:nowrap] hover:[transform:translateY(-2px)] [min-width:180px] [margin-inline-start:auto] [align-self:flex-start] [margin-top:15px] [padding-inline:12px] max-[720px]:[min-height:39px] max-[720px]:[padding-inline:10px] max-[720px]:[margin-inline-start:0] max-[720px]:[font-size:9px] max-[720px]:[align-self:flex-start] [min-height:38px] [padding-inline:15px] [font-size:11px] max-[1000px]:[display:none]"} to="/request">{isEn ? 'Start your request' : 'ابدأ طلبك'}<ArrowUpLeft size={15} /></Link>
          <button className={"[display:none] [border:0] [background:transparent] [color:#0b3b32] [padding:4px] max-[720px]:[display:grid] max-[720px]:[place-items:center] max-[720px]:[&_svg]:[width:20px]"} type="button" aria-label={open ? 'Close menu' : 'Open menu'} onClick={() => setOpen(!open)}>{open ? <X /> : <Menu />}</button>
        </div>
      </div>
    </header>
    {location.pathname === '/admin' && <div className={"[background:#ece6d5] [color:#625631] [text-align:center] [padding:9px_12px] [font-size:11px] [font-weight:600]"}>{isEn ? 'Demo admin — changes are saved only in this browser.' : 'لوحة تجريبية — التغييرات محفوظة في هذا المتصفح فقط.'}</div>}
    <main><Outlet /></main>
    <footer className={"[background:#092f28] [color:#fff]"}>
      <div className={"[padding-block:53px_45px] [display:grid] [grid-template-columns:1.4fr_.8fr_.9fr_1.2fr] [gap:34px] max-[1000px]:[grid-template-columns:1.2fr_.7fr_.8fr] max-[1000px]:[gap:30px] max-[720px]:[grid-template-columns:1fr_1fr] max-[720px]:[gap:28px_18px] max-[720px]:[padding-block:39px_31px] [width:min(1220px,calc(100%_-_72px))] [margin-inline:auto]    max-[1000px]:[width:min(100%_-_48px,900px)] max-[720px]:[width:calc(100%_-_38px)]   max-[390px]:[width:calc(100%_-_30px)]"}>
        <div className={"[&_>p]:[max-width:235px] [&_>p]:[font-size:10px] [&_>p]:[line-height:1.8] [&_>p]:[color:#c3d4c9] [&_>p]:[margin:16px_0_0] max-[720px]:[grid-column:1/-1]"}><Brand footer /><p>{isEn ? 'Print it your way. Personal touches, made in Aswan.' : 'اطبعها بطريقتك. لمسات مخصصة من أسوان.'}</p></div>
        <div className={"[display:flex] [flex-direction:column] [align-items:flex-start] [gap:10px] [&_h3]:[font-size:11px] [&_h3]:[margin:2px_0_6px] [&_h3]:[color:#fff] [&_a]:[font-size:10px] [&_a]:[color:#c1d1c6] [&_a:hover]:[color:#fff]"}><h3>{isEn ? 'Explore' : 'تصفّح'}</h3><Link to="/services">{isEn ? 'Services' : 'الخدمات'}</Link><Link to="/gallery">{isEn ? 'Gallery' : 'معرض الأعمال'}</Link><Link to="/track">{isEn ? 'Track an order' : 'تتبع طلبك'}</Link></div>
        <div className={"[display:flex] [flex-direction:column] [align-items:flex-start] [gap:10px] [&_h3]:[font-size:11px] [&_h3]:[margin:2px_0_6px] [&_h3]:[color:#fff] [&_a]:[font-size:10px] [&_a]:[color:#c1d1c6] [&_>span]:[font-size:10px] [&_>span]:[color:#c1d1c6] [&_a:hover]:[color:#fff]"}>
          <h3>{isEn ? 'Say hello' : 'خلّينا نتكلم'}</h3>
          <a href="https://wa.me/201116891025" target="_blank" rel="noreferrer" className="flex items-center gap-1.5 hover:text-white">
            <span>WhatsApp: 01116891025</span>
          </a>
          <a href="https://www.instagram.com/yuzersef___/" target="_blank" rel="noreferrer" className="hover:text-white">
            Instagram: @yuzersef___
          </a>
          <a href="https://www.facebook.com/search/top/?q=%D9%8A%D9%88%D8%B2%D8%B1%D8%B3%D9%8A%D9%81" target="_blank" rel="noreferrer" className="hover:text-white">
            Facebook: يوزرسيف
          </a>
          <a href="https://www.tiktok.com/search?q=%D9%8A%D9%88%D8%B2%D8%B1%D8%B3%D9%8A%D9%81" target="_blank" rel="noreferrer" className="hover:text-white">
            TikTok: يوزرسيف
          </a>
          <span>{isEn ? 'Aswan, Egypt' : 'أسوان، مصر'}</span>
        </div>
        <div className={"max-[1000px]:[grid-column:1/-1] max-[720px]:[grid-column:1/-1]"}><Link className={"[display:flex] [align-items:center] [justify-content:space-between] [gap:15px] [border-bottom:1px_solid_rgba(255,255,255,.35)] [padding:8px_0_14px] [color:#fff] [font-size:12px]"} to="/request">{isEn ? 'Have an idea? Let’s print it.' : 'عندك فكرة؟ يلا نطبعها.'}<ArrowUpLeft size={17} /></Link></div>
      </div>
      <div className={"[border-top:1px_solid_rgba(255,255,255,.13)] [padding-block:13px] [color:#93a89b] [font:500_8px_Manrope,sans-serif] [letter-spacing:.05em] [&>div]:[display:flex] [&>div]:[justify-content:space-between] [&>div]:[gap:12px] max-[720px]:[&>div]:[font-size:7px] max-[720px]:[&>div>span:last-child]:[display:none]"}><div className={"[width:min(1220px,calc(100%_-_72px))] [margin-inline:auto] max-[1000px]:[width:min(100%_-_48px,900px)] max-[720px]:[width:calc(100%_-_38px)] max-[390px]:[width:calc(100%_-_30px)]"}><span>© {new Date().getFullYear()} Yuzersef · Aswan</span><span>{isEn ? 'Made with care, printed with purpose.' : 'صُنع بعناية، وطُبع بفكرة.'}</span></div></div>
    </footer>
  </>;
}
