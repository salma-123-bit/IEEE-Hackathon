import { useState } from 'react';
import { ArrowDown, ArrowUpLeft, Check, ChevronLeft, CirclePlay } from 'lucide-react';
import { Link } from 'react-router-dom';
import BrandedProductImage from '../components/BrandedProductImage';
import ServiceCard from '../components/ServiceCard';
import { getStoreCatalog } from '../lib/catalog';
import { useLanguage } from '../lib/language';

export default function Home() {
  const { isEn } = useLanguage();
  const [services] = useState(getStoreCatalog);

  const steps = isEn ? [
    ['01', 'Share your idea', 'Tell us what you have in mind, even if it is only a starting point.'],
    ['02', 'Choose the details', 'Pick your item, quantity, colors, sizes, and print placement.'],
    ['03', 'Review together', 'We check the specifications and confirm the next step with you.'],
    ['04', 'Made for you', 'Once approved, your custom order moves into production.'],
  ] : [
    ['01', 'احكيلنا فكرتك', 'ابدأ من أي فكرة، حتى لو كانت لسه مجرد تصور.'],
    ['02', 'اختار التفاصيل', 'حدد المنتج والكمية والألوان والمقاسات وموضع الطباعة.'],
    ['03', 'نراجعها سوا', 'نتأكد من المواصفات ونوضح لك الخطوة اللي بعدها.'],
    ['04', 'تتعمل مخصوص', 'بعد الموافقة، طلبك يدخل مرحلة الإنتاج.'],
  ];

  return <>
    {/* Hero Section */}
    <section className="
      relative overflow-hidden flex items-center justify-center text-center
      min-h-[min(720px,calc(100vh-112px))] h-[680px] bg-[#0b3b32] text-white
      after:content-[''] after:absolute after:inset-0 after:z-1 after:pointer-events-none
      after:bg-gradient-to-t after:from-[rgba(4,31,25,0.4)] after:to-transparent
      max-[720px]:h-auto max-[720px]:min-h-[calc(100svh-90px)] max-[720px]:pb-[50px]
    ">
      
      {/* Background Image */}
      <div className="
        absolute inset-0 w-full h-full opacity-80
        [&_img]:h-full [&_img]:w-full [&_img]:object-cover [&_img]:object-center
      ">
        <img 
          src="/assets/Gemini_Generated_Image_qp0du5qp0du5qp0d.jpg" 
          alt={isEn ? 'Official Yuzersef cover showing printed products' : 'غلاف يوزرسيف يظهر المنتجات المطبوعة'} 
        />
      </div>

      {/* Radial Gradient Overlay */}
      <div className="
        absolute inset-0 z-1
        bg-[radial-gradient(circle_at_center,rgba(7,39,33,.88)_0%,rgba(7,39,33,.94)_65%,rgba(7,39,33,.98)_100%)]
      " />
      
      {/* Hero Content Container */}
      <div className="
        relative z-2 mx-auto flex flex-col items-center justify-center text-center
        w-[min(1220px,calc(100%-72px))]
        max-[1000px]:w-[min(100%-48px,900px)]
        max-[720px]:w-[calc(100%-38px)] max-[720px]:pt-[35px]
      ">
        
        <div className="
          flex flex-col items-center py-7 pb-5 max-w-[760px]
          [&_h1]:text-[clamp(45px,6.4vw,83px)] [&_h1]:line-height-[1.08] [&_h1]:tracking-[-0.04em] [&_h1]:my-6 [&_h1]:font-semibold
          [&_h1_em]:not-italic [&_h1_em]:text-[#b9c9a0]
          [&_>p]:max-w-[520px] [&_>p]:text-[15px] [&_>p]:leading-[1.95] [&_>p]:text-[#d4dfd8] [&_>p]:mb-7
          max-[720px]:[&_h1]:text-[clamp(42px,11vw,65px)] max-[720px]:[&_h1]:my-4
          max-[720px]:[&_>p]:text-[13px] max-[720px]:[&_>p]:max-w-[340px] max-[720px]:[&_>p]:leading-[1.8] max-[720px]:[&_>p]:mb-5
        ">
          
          {/* Eyebrow Badge */}
          <div className="
            inline-flex items-center gap-2.5 font-bold text-[9px] tracking-[0.16em] text-[#d2ded2]
            [&_>span]:inline-block [&_>span]:w-5 [&_>span]:h-[1px] [&_>span]:bg-[#c5d4bc]
          ">
            <span />
            {isEn ? 'PRINTING · PERSONALIZATION · ASWAN' : 'طباعة · تخصيص · أسوان'}
            <span />
          </div>
          
          {/* Main Title */}
          <h1>
            {isEn ? <>Make it yours.<br /><em>Make it Yuzersef.</em></> : <>خليك مختلف ..<br /><em>خليك يوزرسيف</em></>}
          </h1>
          
          {/* Subtitle */}
          <p>
            {isEn ? 'A little detail can say a lot. Turn your idea into something you can wear, hold, or share — with instant live 3D & 2D previews.' : 'تفصيلة صغيرة ممكن تحكي كتير. حوّل فكرتك لحاجة تلبسها، تمسكها، أو تهديها — مع معاينة حية ثلاثية الأبعاد قبل التنفيذ.'}
          </p>
          
          {/* Buttons CTA */}
          <div className="flex items-center justify-center gap-4.5 flex-wrap max-[720px]:gap-3">
            <Link 
              to="/request"
              className="
                inline-flex items-center justify-center gap-2.5 min-h-[48px] px-8
                border border-transparent text-[12px] font-bold whitespace-nowrap shadow-sm rounded
                bg-[#f8f8f1] text-[#0b3b32] transition-all hover:-translate-y-0.5 hover:bg-[#dfe9df]
              "
            >
              {isEn ? 'Start your request' : 'ابدأ طلبك الآن'}
              <ArrowUpLeft size={17} />
            </Link>

            <Link 
              to="/services"
              className="
                inline-flex items-center gap-2 text-[12px] text-white hover:underline
                [&_svg]:text-[#c3d2b2]
              "
            >
              <CirclePlay size={16} />
              {isEn ? 'Explore services' : 'اكتشف خدماتنا'}
            </Link>
          </div>

          {/* Trust Badges */}
          <div className="
            flex items-center justify-center gap-6 mt-9 text-[#d1ded5] text-[10px]
            [&_span]:flex [&_span]:items-center [&_span]:gap-1.5 [&_svg]:text-[#b9c9d]
            max-[720px]:gap-3 max-[720px]:mt-5.5 max-[720px]:text-[8px] max-[720px]:flex-wrap
          ">
            <span><Check size={14} />{isEn ? 'Live 3D & 2D Mockup' : 'معاينة ثلاثية الأبعاد'}</span>
            <span><Check size={14} />{isEn ? 'Crafted in Aswan' : 'ورشة متخصصة بأسوان'}</span>
            <span><Check size={14} />{isEn ? 'Real-time order tracking' : 'تتبع فوري لمراحل طلبك'}</span>
          </div>
        </div>

        {/* Scroll Indicator */}
        <a 
          href="#services"
          className="
            absolute -bottom-[40px] flex items-center gap-3 font-bold text-[8px] tracking-[0.15em] text-[#d2ded2]
            max-[720px]:hidden
          "
        >
          <span>{isEn ? 'SCROLL TO EXPLORE' : 'اسحب واكتشف'}</span>
          <ArrowDown size={15} />
        </a>
      </div>
    </section>

    {/* Intro Strip */}
    <section className="bg-[#e8ede5] py-7 max-[720px]:py-4.5">
      <div className="
        mx-auto flex items-center justify-between gap-6
        w-[min(1220px,calc(100%-72px))]
        max-[1000px]:w-[min(100%-48px,900px)]
        max-[720px]:w-[calc(100%-38px)]
        max-[390px]:w-[calc(100%-30px)]
        [&_>p]:m-0 [&_>p]:text-[17px] [&_>p]:font-semibold [&_>p]:text-[#0b3b32]
        [&_>div]:flex [&_>div]:items-center [&_>div]:gap-2.5 [&_>div]:text-[#7b8a80] [&_>div]:font-bold [&_>div]:text-[8px] [&_>div]:tracking-[0.14em]
        max-[720px]:[&_>p]:text-[13px] max-[720px]:[&_>div]:text-[7px]
      ">
        <p>{isEn ? 'A blank canvas is just the beginning.' : 'كل منتج فاضي هو بداية حكاية.'}</p>
        <div>
          <span className="w-[42px] h-[1px] bg-[#9eae9c] max-[720px]:w-[22px]" />
          <span>{isEn ? 'BUILT AROUND YOUR IDEA' : 'فكرتك هي البداية'}</span>
        </div>
      </div>
    </section>

    {/* Services Preview Section */}
    <section id="services" className="
      py-[102px] max-[720px]:py-[66px] mx-auto
      w-[min(1220px,calc(100%-72px))]
      max-[1000px]:w-[min(100%-48px,900px)]
      max-[720px]:w-[calc(100%-38px)]
      max-[390px]:w-[calc(100%-30px)]
    ">
      <div className="
        flex justify-between items-end gap-10 mb-[43px]
        [&_h2]:text-[clamp(36px,4.4vw,57px)] [&_h2]:leading-[1.17] [&_h2]:tracking-[-0.04em] [&_h2]:mt-4 [&_h2]:mb-0 [&_h2]:text-[#0b3b32] [&_h2]:font-semibold
        [&_h2_em]:not-italic [&_h2_em]:text-[#688573]
        max-[720px]:items-start max-[720px]:flex-col max-[720px]:gap-3 max-[720px]:mb-6
        max-[720px]:[&_h2]:text-[39px] max-[720px]:[&_h2]:mt-3
      ">
        <div>
          <div className="
            flex items-center gap-2.5 font-bold text-[9px] tracking-[0.16em] text-[#5c756a] justify-center
            [&_>span]:inline-block [&_>span]:w-5 [&_>span]:h-[1px] [&_>span]:bg-[#99aa8d]
          ">
            <span />
            {isEn ? 'MADE TO FEEL LIKE YOU' : 'تفاصيل شبهك'}
          </div>
          <h2>
            {isEn ? <>Objects with<br /><em>a point of view.</em></> : <>حاجات عادية،<br /><em>بطابعك أنت.</em></>}
          </h2>
        </div>
        
        <div className="
          max-w-[340px] pb-1
          [&_p]:text-[13px] [&_p]:leading-[1.9] [&_p]:text-[#6d7a73] [&_p]:mb-4 [&_p]:mt-0
          max-[720px]:max-w-full max-[720px]:[&_p]:text-[11px] max-[720px]:[&_p]:mb-2.5
        ">
          <p>{isEn ? 'From everyday favorites to gifts worth keeping — make the little things unmistakably yours.' : 'من حاجاتك اليومية لهدايا تفضل فاكرها.. خلّي التفاصيل تبقى شبهك.'}</p>
          <Link 
            to="/services" 
            className="
              inline-flex items-center justify-center gap-2 p-0 border-0 bg-transparent text-[#0b3b32]
              text-[10px] font-bold mb-1 transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5
              max-[720px]:text-[8px] max-[720px]:gap-1
            "
          >
            {isEn ? 'View all services' : 'كل الخدمات'}
            <ArrowUpLeft size={15} />
          </Link>
        </div>
      </div>

      <div className="
        grid grid-cols-3 gap-4
        max-[1000px]:grid-cols-2 max-[720px]:gap-2.5
      ">
        {services.map((service) => (
          <ServiceCard key={service.id} service={service} compact />
        ))}
      </div>
    </section>

    {/* Split Feature Section */}
    <section className="
      grid grid-cols-2 min-h-[515px] bg-[#0b3b32] text-white
      max-[720px]:grid-cols-1
    ">
      <div className="
        relative min-h-full overflow-hidden
        [&_img]:w-full [&_img]:h-full [&_img]:absolute [&_img]:inset-0 [&_img]:object-cover [&_img]:object-center
        after:content-[''] after:absolute after:inset-0 after:bg-gradient-to-t after:from-[rgba(3,35,29,0.45)] after:to-transparent
        max-[720px]:min-h-[285px]
      ">
        <BrandedProductImage 
          className="" 
          src="/assets/Tee.jpeg" 
          alt={isEn ? 'Custom apparel and print materials' : 'ملابس وخامات للطباعة المخصصة'} 
          kind="tee" 
        />
        <span className="absolute bottom-6 inset-s-8 z-2 font-bold text-[9px] tracking-[0.16em] text-white">
          01 — 06
        </span>
      </div>

      <div className="
        flex flex-col items-start justify-center py-[82px] px-[clamp(38px,8vw,130px)] pl-[60px]
        [&_h2]:text-[clamp(36px,4vw,54px)] [&_h2]:leading-[1.2] [&_h2]:tracking-[-0.04em] [&_h2]:my-4.5 [&_h2]:font-semibold
        [&_h2_em]:not-italic [&_h2_em]:text-[#c6d1a9]
        [&_>p]:max-w-[390px] [&_>p]:text-[#d0dfd5] [&_>p]:text-[13px] [&_>p]:leading-[2] [&_>p]:mb-6 [&_>p]:mt-0
        max-[1000px]:py-[65px] max-[1000px]:px-[45px]
        max-[720px]:py-10 max-[720px]:px-[22px]
        max-[720px]:[&_h2]:text-[41px] max-[720px]:[&_h2]:my-3 max-[720px]:[&_>p]:text-[11px]
      ">
        <div className="
          flex items-center gap-2.5 font-bold text-[9px] tracking-[0.16em] text-[#d2ded2] justify-center
          [&_>span]:inline-block [&_>span]:w-5 [&_>span]:h-[1px] [&_>span]:bg-[#c5d4bc]
        ">
          <span />
          {isEn ? 'YOUR IDEA, IN GOOD HANDS' : 'فكرتك في أيد أمينة'}
        </div>

        <h2>
          {isEn ? <>Not just print.<br /><em>A personal touch.</em></> : <>مش مجرد طباعة،<br /><em>دي لمستك الخاصة.</em></>}
        </h2>

        <p>
          {isEn ? 'We bring your colors, words, and moments to everyday products — with the details considered from the first request.' : 'بنحوّل ألوانك وكلماتك ولحظاتك لمنتجات تستخدمها كل يوم، مع اهتمام بالتفاصيل من أول الطلب.'}
        </p>

        <Link 
          to="/gallery"
          className="
            inline-flex items-center justify-center gap-2.5 min-h-[40px] min-w-[180px] px-5 mt-4
            border border-white/45 bg-transparent text-white text-[10px] font-semibold whitespace-nowrap
            transition-all hover:-translate-y-0.5 hover:bg-white hover:text-[#0b3b32]
            max-[720px]:min-h-[39px] max-[720px]:px-2.5 max-[720px]:text-[9px]
          "
        >
          {isEn ? 'See the collection' : 'شوف المعرض'}
          <ArrowUpLeft size={16} />
        </Link>

        <div className="
          mt-10.5 pt-5 border-t border-white/20 flex items-center gap-3.5 w-[min(360px,100%)]
          [&_>span]:font-extrabold [&_>span]:text-[19px] [&_>span]:text-[#c5d1a8]
          [&_p]:text-[10px] [&_p]:text-[#d1ded6] [&_p]:m-0
          max-[720px]:mt-7
        ">
          <span>Y.</span>
          <p>{isEn ? 'Designed around you. Printed in Aswan.' : 'فكرة شبهك، وطباعة من أسوان.'}</p>
        </div>
      </div>
    </section>

    {/* Process Section */}
    <section className="
      py-[108px] max-[720px]:py-[66px] mx-auto
      w-[min(1220px,calc(100%-72px))]
      max-[1000px]:w-[min(100%-48px,900px)]
      max-[720px]:w-[calc(100%-38px)]
      max-[390px]:w-[calc(100%-30px)]
    ">
      <div className="
        flex justify-between items-end mb-[47px]
        [&_h2]:text-[clamp(36px,4.4vw,57px)] [&_h2]:leading-[1.17] [&_h2]:tracking-[-0.04em] [&_h2]:mt-4 [&_h2]:mb-0 [&_h2]:text-[#0b3b32] [&_h2]:font-semibold
        [&_h2_em]:not-italic [&_h2_em]:text-[#688573]
        [&_>p]:max-w-[255px] [&_>p]:mb-1.5 [&_>p]:text-[#718078] [&_>p]:text-[12px] [&_>p]:leading-[1.8]
        max-[720px]:block max-[720px]:mb-6
        max-[720px]:[&_h2]:text-[39px] max-[720px]:[&_h2]:mt-3
        max-[720px]:[&_>p]:max-w-[350px] max-[720px]:[&_>p]:mt-3 max-[720px]:[&_>p]:text-[11px]
      ">
        <div>
          <div className="
            flex items-center gap-2.5 font-bold text-[9px] tracking-[0.16em] text-[#5c756a] justify-center
            [&_>span]:inline-block [&_>span]:w-5 [&_>span]:h-[1px] [&_>span]:bg-[#99aa8d]
          ">
            <span />
            {isEn ? 'A SIMPLE PROCESS' : 'خطوات سهلة'}
          </div>
          <h2>
            {isEn ? <>From first thought<br />to <em>finished piece.</em></> : <>من أول فكرة<br /><em>لآخر تفصيلة.</em></>}
          </h2>
        </div>
        <p>{isEn ? 'You lead the idea. We make the process clear, step by step.' : 'فكرتك تقود، وإحنا نخلي الطريق واضح خطوة بخطوة.'}</p>
      </div>

      <div className="
        grid grid-cols-4 border-t border-[#d6ded6]
        max-[720px]:grid-cols-2
      ">
        {steps.map(([num, title, body]) => (
          <article 
            key={num}
            className="
              relative p-6 pr-2 border-s border-[#d6ded6] min-h-[206px]
              [&_h3]:text-[16px] [&_h3]:mb-2 [&_h3]:text-[#0b3b32]
              [&_p]:text-[11px] [&_p]:leading-[1.8] [&_p]:text-[#78857d] [&_p]:m-0 [&_p]:max-w-[205px]
              max-[720px]:p-4 max-[720px]:px-3.5 max-[720px]:min-h-[170px] max-[720px]:border-b max-[720px]:border-[#d6ded6]
              max-[720px]:[&_h3]:text-[13px] max-[720px]:[&_p]:text-[9px]
            "
          >
            <span className="font-bold text-[11px] text-[#8a9a8f]">{num}</span>
            <span className="block h-[1px] w-[31px] bg-[#9aae9f] my-5 max-[720px]:my-3" />
            <h3>{title}</h3>
            <p>{body}</p>
            <ChevronLeft size={17} className="absolute bottom-5 inset-e-5 text-[#91a092] max-[720px]:bottom-3 max-[720px]:inset-e-3" />
          </article>
        ))}
      </div>

      <Link 
        to="/request"
        className="
          inline-flex items-center justify-center gap-2.5 min-h-[40px] min-w-[180px] px-5 mt-6
          border border-transparent bg-[#0b3b32] text-white text-[10px] font-semibold whitespace-nowrap
          transition-all hover:-translate-y-0.5 hover:bg-[#164c40]
          max-[720px]:min-h-[39px] max-[720px]:px-2.5 max-[720px]:text-[9px]
        "
      >
        {isEn ? 'Let’s get started' : 'يلا نبدأ طلبك'}
        <ArrowUpLeft size={16} />
      </Link>
    </section>

    {/* Testimonials / Voice Section */}
    <section className="bg-[#092f28] text-white py-[85px] max-[720px]:py-[58px]">
      <div className="
        mx-auto
        w-[min(1220px,calc(100%-72px))]
        max-[1000px]:w-[min(100%-48px,900px)]
        max-[720px]:w-[calc(100%-38px)]
        max-[390px]:w-[calc(100%-30px)]
        [&_>h2]:text-center [&_>h2]:text-[clamp(30px,4vw,48px)] [&_>h2]:font-medium [&_>h2]:my-8 [&_>h2]:mb-10 [&_>h2]:tracking-[-0.035em]
        max-[720px]:[&_>h2]:text-[29px] max-[720px]:[&_>h2]:my-4 max-[720px]:[&_>h2]:mb-6
      ">
        <div className="
          flex items-center gap-2.5 font-bold text-[9px] tracking-[0.16em] text-[#d2ded2] justify-center
          [&_>span]:inline-block [&_>span]:w-5 [&_>span]:h-[1px] [&_>span]:bg-[#c5d4bc]
        ">
          <span />
          {isEn ? 'THE PERSONAL PART' : 'اللمسة الشخصية'}
        </div>

        <h2>{isEn ? 'Good design feels like you.' : 'التصميم الحلو هو اللي يشبهك.'}</h2>

        <div className="
          grid grid-cols-2 gap-4.5 max-w-[840px] mx-auto
          [&_blockquote]:m-0 [&_blockquote]:p-7 [&_blockquote]:bg-white/7 [&_blockquote]:border [&_blockquote]:border-white/13
          [&_blockquote>span]:font-bold [&_blockquote>span]:text-[34px] [&_blockquote>span]:text-[#c1cfaa]
          [&_blockquote_p]:text-[16px] [&_blockquote_p]:leading-[1.6] [&_blockquote_p]:my-2 [&_blockquote_p]:mb-5
          [&_blockquote_footer]:text-[9px] [&_blockquote_footer]:text-[#adbbb1]
          max-[720px]:grid-cols-1 max-[720px]:gap-2.5
          max-[720px]:[&_blockquote]:p-4 max-[720px]:[&_blockquote_p]:text-[13px] max-[720px]:[&_blockquote_p]:mb-3
        ">
          <blockquote>
            <span>“</span>
            <p>{isEn ? 'A small idea can become something you keep close.' : 'فكرة بسيطة ممكن تبقى حاجة قريبة منك.'}</p>
            <footer>{isEn ? 'Sample copy · replace with a real customer quote' : 'نص تجريبي · يُستبدل برأي عميل حقيقي'}</footer>
          </blockquote>

          <blockquote>
            <span>“</span>
            <p>{isEn ? 'Your favorite things, with a detail nobody else has.' : 'حاجاتك المفضلة، بتفصيلة مش عند حد تاني.'}</p>
            <footer>{isEn ? 'Sample copy · replace with a real customer quote' : 'نص تجريبي · يُستبدل برأي عميل حقيقي'}</footer>
          </blockquote>
        </div>

        <Link 
          to="/contact" 
          className="mt-7 mx-auto flex w-max items-center gap-2 text-[11px] text-[#dae5d6] hover:underline"
        >
          {isEn ? 'Have something in mind? Talk to us.' : 'عندك حاجة في بالك؟ كلمنا.'}
          <ArrowUpLeft size={16} />
        </Link>
      </div>
    </section>

    {/* Closing CTA */}
    <section className="py-[85px] bg-[#e6ece3] max-[720px]:py-[54px]">
      <div className="
        mx-auto flex justify-between items-center gap-[35px]
        w-[min(1220px,calc(100%-72px))]
        max-[1000px]:w-[min(100%-48px,900px)]
        max-[720px]:w-[calc(100%-38px)]
        max-[390px]:w-[calc(100%-30px)]
        [&_h2]:text-[clamp(36px,4.4vw,57px)] [&_h2]:leading-[1.17] [&_h2]:tracking-[-0.04em] [&_h2]:mt-4 [&_h2]:mb-0 [&_h2]:text-[#0b3b32] [&_h2]:font-semibold
        [&_h2_em]:not-italic [&_h2_em]:text-[#688573]
        max-[720px]:[&_h2]:text-[39px] max-[720px]:[&_h2]:mt-3
        max-[720px]:items-start max-[720px]:flex-col max-[720px]:gap-5.5
      ">
        <div>
          <div className="
            flex items-center gap-2.5 font-bold text-[9px] tracking-[0.16em] text-[#5c756a] justify-center
            [&_>span]:inline-block [&_>span]:w-5 [&_>span]:h-[1px] [&_>span]:bg-[#99aa8d]
          ">
            <span />
            {isEn ? 'LET’S MAKE SOMETHING PERSONAL' : 'يلا نعمل حاجة شبهك'}
          </div>
          <h2>
            {isEn ? <>Your idea deserves<br /><em>to be out there.</em></> : <>فكرتك تستاهل<br /><em>تبقى حقيقة.</em></>}
          </h2>
        </div>

        <Link 
          to="/request"
          className="
            inline-flex items-center justify-center gap-2.5 min-h-[40px] min-w-[180px] px-5
            border border-transparent bg-[#0b3b32] text-white text-[10px] font-semibold whitespace-nowrap
            transition-all hover:-translate-y-0.5 hover:bg-[#164c40]
          "
        >
          {isEn ? 'Start a request' : 'ابدأ طلبك الآن'}
          <ArrowUpLeft size={17} />
        </Link>
      </div>
    </section>
  </>;
}
