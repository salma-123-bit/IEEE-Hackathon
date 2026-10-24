import React, { useEffect, useState } from 'react';
import { 
  ArrowUpLeft, 
  Check, 
  CircleDashed, 
  PackageCheck, 
  Search, 
  Clock, 
  Truck, 
  CheckCircle2, 
  Layers, 
  AlertOctagon,
  MessageCircle,
  Copy,
  Sparkles
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useLanguage } from '../lib/language';
import { getOrders, statusLabels, type Order, type OrderStatus } from '../lib/storage';

const flow: { status: OrderStatus; icon: React.ReactNode; ar: string; en: string }[] = [
  { status: 'pending', icon: <Clock size={16} />, ar: 'قيد المراجعة', en: 'Pending Review' },
  { status: 'approved', icon: <Check size={16} />, ar: 'تمت الموافقة', en: 'Approved' },
  { status: 'production', icon: <Layers size={16} />, ar: 'قيد الإنتاج', en: 'In Production' },
  { status: 'delivery', icon: <Truck size={16} />, ar: 'خرج للتوصيل', en: 'Out for Delivery' },
  { status: 'completed', icon: <CheckCircle2 size={16} />, ar: 'تم التسليم', en: 'Completed' },
];

const statusBadgeStyles: Record<OrderStatus, string> = {
  pending: 'bg-[#eef3eb] text-[#4d6953] border-[#d3e0d2]',
  approved: 'bg-[#e5f1e7] text-[#2e623a] border-[#c0dcc5]',
  production: 'bg-[#e4eff3] text-[#23586b] border-[#bedae3]',
  delivery: 'bg-[#f5eedc] text-[#7d5f1f] border-[#e8d8b2]',
  completed: 'bg-[#dcecdc] text-[#0b3b32] border-[#b4d6b7]',
  rejected: 'bg-[#fbedea] text-[#933f34] border-[#f0c2bd]',
};

export default function Track() {
  const { isEn } = useLanguage();
  const location = useLocation();
  const [code, setCode] = useState(location.state?.trackingId || '');
  const [order, setOrder] = useState<Order | null>(null);
  const [searched, setSearched] = useState(false);
  const [copied, setCopied] = useState(false);

  // Available sample orders for instant testing
  const allOrders = getOrders();

  useEffect(() => {
    if (location.state?.trackingId) {
      const found = getOrders().find((item) => item.id.toLowerCase() === location.state.trackingId.toLowerCase()) || null;
      setOrder(found);
      setSearched(true);
    }
  }, [location.state]);

  const searchWithId = (searchId: string) => {
    setCode(searchId);
    const found = getOrders().find((item) => item.id.toLowerCase() === searchId.trim().toLowerCase()) || null;
    setOrder(found);
    setSearched(true);
  };

  const handleSearchSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    searchWithId(code);
  };

  const currentIndex = order ? (order.status === 'rejected' ? -1 : flow.findIndex((f) => f.status === order.status)) : -1;
  const progressPercent = currentIndex >= 0 ? Math.round((currentIndex / (flow.length - 1)) * 100) : 0;

  const copyId = () => {
    if (order) {
      navigator.clipboard?.writeText(order.id);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="min-h-[65vh] pb-20">
      {/* Page Header */}
      <section className="pt-16 pb-8 border-b border-[#dce3dc] w-[min(1220px,calc(100%_-_48px))] mx-auto">
        <div className="flex items-center gap-2 text-[9px] font-bold tracking-widest text-[#5c756a] uppercase">
          <span className="w-5 h-[1px] bg-[#99aa8d]" />
          {isEn ? 'REAL-TIME TIMELINE & STATUS' : 'المتابعة الحية وحالة الطلب'}
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-[#0b3b32] my-4 leading-tight">
          {isEn ? <>A little closer<br /><em className="not-italic text-[#688573]">to the finish.</em></> : <>خطوة بخطوة،<br /><em className="not-italic text-[#688573]">لحد ما توصلك.</em></>}
        </h1>
        <p className="text-sm text-[#6f7d75] max-w-lg leading-relaxed">
          {isEn 
            ? 'Track your personalized printing order in real time from workshop review to final delivery in Aswan.' 
            : 'تابع مراحل تصنيع وطباعة طلبك مباشرة من مراجعة التصميم وحتى اكتمال التوصيل في أسوان.'}
        </p>
      </section>

      {/* Search Input Section */}
      <section className="max-w-4xl mx-auto pt-8 px-4">
        <form onSubmit={handleSearchSubmit} className="bg-[#eaf0e8] border border-[#d6dfd5] p-5 md:p-6 rounded-lg shadow-xs">
          <label htmlFor="tracking-code" className="block text-[10px] font-bold tracking-widest uppercase text-[#526a5b] mb-2">
            {isEn ? 'ENTER YOUR TRACKING NUMBER' : 'اكتب رقم تتبع طلبك'}
          </label>
          <div className="flex gap-2.5 flex-col sm:flex-row">
            <input
              id="tracking-code"
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="YZ-2026-XXXXX"
              className="flex-1 bg-white border border-[#cfdad0] px-4 py-3 text-sm font-mono font-bold text-[#0b3b32] rounded focus:outline-none focus:border-[#0b3b32] focus:ring-1 focus:ring-[#0b3b32]"
            />
            <button
              type="submit"
              className="px-6 py-3 bg-[#0b3b32] text-white font-bold text-xs rounded hover:bg-[#154c41] transition-all flex items-center justify-center gap-2 shadow-xs shrink-0"
            >
              <Search size={16} />
              <span>{isEn ? 'Track Order' : 'تتبع الطلب'}</span>
            </button>
          </div>

          {/* Quick Demo ID selector chips */}
          <div className="mt-3.5 pt-3 border-t border-[#d8e2d8] flex items-center gap-2 flex-wrap">
            <span className="text-[10px] text-[#697d70] font-medium flex items-center gap-1">
              <Sparkles size={12} className="text-[#0b3b32]" />
              {isEn ? 'Try instant demo orders:' : 'جرّب نماذج طلبات فورية:'}
            </span>
            {allOrders.slice(0, 3).map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => searchWithId(item.id)}
                className={`text-[10px] font-mono px-2 py-0.5 rounded border transition-colors ${
                  code === item.id 
                    ? 'bg-[#0b3b32] text-white border-[#0b3b32]' 
                    : 'bg-white/80 hover:bg-white text-[#0b3b32] border-[#ccd8ce]'
                }`}
              >
                {item.id} ({statusLabels[item.status][isEn ? 'en' : 'ar']})
              </button>
            ))}
          </div>
        </form>

        {/* Not Found View */}
        {searched && !order && (
          <div className="mt-8 p-10 text-center bg-white border border-[#e2e7e1] rounded-lg shadow-xs">
            <span className="w-12 h-12 rounded-full bg-[#f8ecea] text-[#9b493e] grid place-items-center mx-auto mb-3">
              <CircleDashed size={26} />
            </span>
            <h2 className="text-lg font-bold text-[#0b3b32]">
              {isEn ? 'Order code not found in records' : 'لم نتمكن من العثور على هذا الطلب'}
            </h2>
            <p className="text-xs text-[#78867e] max-w-md mx-auto mt-1 mb-4 leading-relaxed">
              {isEn 
                ? 'Please check the spelling of your code (e.g. YZ-2026-ASWAN) or make a new request via our wizard.' 
                : 'تأكد من كتابة الرقم بشكل صحيح أو اضغط على أحد أرقام الطلبات التجريبية بالأعلى.'}
            </p>
            <Link
              to="/request"
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0b3b32] text-white text-xs font-semibold rounded hover:bg-[#154c41]"
            >
              {isEn ? 'Start a new request' : 'بدء طلب جديد'}
              <ArrowUpLeft size={14} />
            </Link>
          </div>
        )}

        {/* Order Tracking Dashboard View */}
        {order && (
          <div className="mt-8 bg-white border border-[#dfe5df] rounded-lg shadow-sm overflow-hidden">
            {/* Header Strip */}
            <div className="p-5 md:p-6 bg-[#fbfcfa] border-b border-[#e9eee8] flex flex-wrap justify-between items-start gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border ${statusBadgeStyles[order.status]}`}>
                    {statusLabels[order.status][isEn ? 'en' : 'ar']}
                  </span>
                  <span className="text-xs text-[#718278]">
                    {new Date(order.createdAt).toLocaleDateString(isEn ? 'en-US' : 'ar-EG')}
                  </span>
                </div>
                <h2 className="text-xl md:text-2xl font-bold text-[#0b3b32]">
                  {order.productName}
                </h2>
                <p className="text-xs text-[#62776a] mt-0.5">
                  {order.quantity} {isEn ? 'items' : 'قطعة'}
                  {order.color && ` • ${order.color}`}
                  {order.placement && ` • ${order.placement}`}
                </p>
              </div>

              {/* ID Box */}
              <div className="flex flex-col items-end gap-1">
                <span className="text-[9px] uppercase font-bold tracking-wider text-[#8a978d]">
                  {isEn ? 'TRACKING NUMBER' : 'رقم المتابعة'}
                </span>
                <div className="flex items-center gap-2 bg-[#f0f4ef] px-3 py-1.5 rounded border border-[#d6dfd5]">
                  <strong dir="ltr" className="font-mono text-sm font-bold text-[#0b3b32]">
                    {order.id}
                  </strong>
                  <button
                    type="button"
                    onClick={copyId}
                    className="text-[#557864] hover:text-[#0b3b32] transition-colors"
                    title={isEn ? 'Copy' : 'نسخ'}
                  >
                    <Copy size={13} />
                  </button>
                </div>
                {copied && (
                  <span className="text-[10px] text-[#2e623a] font-semibold">
                    {isEn ? 'Copied to clipboard' : 'تم النسخ للحافظة'}
                  </span>
                )}
              </div>
            </div>

            {/* DYNAMIC VISUAL TIMELINE */}
            {order.status === 'rejected' ? (
              <div className="p-6 bg-[#fff6f5] border-b border-[#f3d7d3] flex items-start gap-3">
                <AlertOctagon size={24} className="text-[#a43c32] shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-[#8c352c]">
                    {isEn ? 'This request was rejected by the studio' : 'تم رفض هذا الطلب من قبل الاستوديو'}
                  </h3>
                  <p className="text-xs text-[#9d4d44] mt-1 leading-relaxed">
                    {order.ownerNote || (isEn ? 'Please contact our workshop on WhatsApp to clarify requirements.' : 'يرجى مراجعة تفاصيل التصميم والتواصل مع فريق الاستوديو لإعادة تقديمه.')}
                  </p>
                </div>
              </div>
            ) : (
              <div className="p-6 md:p-8 border-b border-[#e9eee8] bg-white">
                <div className="relative">
                  {/* Background Progress Track */}
                  <div className="hidden sm:block absolute top-4 inset-x-8 h-1 bg-[#e0eae0] -z-0">
                    <div
                      className="h-full bg-[#0b3b32] transition-all duration-700"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Flow Steps */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 relative z-10">
                    {flow.map((step, idx) => {
                      const isPast = idx <= currentIndex;
                      const isCurrent = idx === currentIndex;
                      const historyEntry = order.history.find((h) => h.status === step.status);

                      return (
                        <div
                          key={step.status}
                          className="flex flex-col items-center text-center group"
                        >
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                            isCurrent
                              ? 'bg-[#0b3b32] text-white ring-4 ring-[#d8eade] scale-110 shadow-sm'
                              : isPast
                              ? 'bg-[#0b3b32] text-white'
                              : 'bg-white text-[#9eb0a2] border-2 border-[#d5ded5]'
                          }`}>
                            {isPast ? <Check size={16} /> : step.icon}
                          </div>

                          <strong className={`text-xs mt-2.5 block leading-tight ${
                            isCurrent ? 'text-[#0b3b32] font-bold' : isPast ? 'text-[#355342] font-semibold' : 'text-[#8b9c90]'
                          }`}>
                            {isEn ? step.en : step.ar}
                          </strong>

                          {historyEntry && (
                            <span className="text-[10px] text-[#788a7e] block mt-1 leading-tight">
                              {new Date(historyEntry.date).toLocaleDateString(isEn ? 'en-US' : 'ar-EG')}
                            </span>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Note from Studio & Next Action */}
            <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x rtl:md:divide-x-reverse divide-[#e9eee8] border-b border-[#e9eee8] bg-[#fdfdfc]">
              <div className="p-5 md:p-6">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#798d80] block mb-1.5">
                  {isEn ? 'A NOTE FROM THE ASWAN STUDIO' : 'ملاحظة مباشرة من استوديو أسوان'}
                </span>
                <p className="text-xs text-[#334d3f] leading-relaxed font-medium">
                  {order.ownerNote || (isEn ? 'Your order is progressing smoothly.' : 'طلبك قيد المتابعة وفق جدول التشغيل.')}
                </p>
              </div>

              <div className="p-5 md:p-6">
                <span className="text-[10px] uppercase font-bold tracking-wider text-[#798d80] block mb-1.5">
                  {isEn ? 'WHAT HAPPENS NEXT' : 'الخطوة القادمة'}
                </span>
                <p className="text-xs text-[#334d3f] leading-relaxed font-medium">
                  {order.nextAction || (isEn ? 'We will update this timeline as soon as status changes.' : 'سيتم تحديث هذه الصفحة فور الانتقال للمرحلة التالية.')}
                </p>
              </div>
            </div>

            {/* Order Specification Breakdown */}
            <div className="p-5 md:p-6 border-b border-[#e9eee8]">
              <h3 className="text-xs font-bold text-[#0b3b32] uppercase tracking-wider mb-3">
                {isEn ? 'SPECIFICATION SUMMARY' : 'تفاصيل ومواصفات الطلب'}
              </h3>

              {/* Multi-Item Breakdown if present */}
              {order.items && order.items.length > 1 && (
                <div className="mb-4 bg-white border border-[#dfe7df] rounded-lg overflow-hidden">
                  <div className="p-3 bg-[#f5f9f5] border-b border-[#dfe7df] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0b3b32]">
                      {isEn ? `Order Items (${order.items.length} products):` : `المنتجات في هذا الطلب (${order.items.length} منتجات):`}
                    </span>
                    <span className="text-xs font-bold text-[#0b3b32] bg-[#e2ebe2] px-2.5 py-0.5 rounded-full">
                      {order.quantity} {isEn ? 'Total Pieces' : 'إجمالي القطع'}
                    </span>
                  </div>
                  <div className="divide-y divide-[#edf2ed]">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="p-3 flex items-center justify-between gap-3 text-xs">
                        <div>
                          <strong className="text-[#0b3b32] font-semibold block">{it.productName}</strong>
                          <span className="text-[11px] text-[#718278]">
                            {it.placement} {it.color ? `· ${it.color}` : ''}
                          </span>
                        </div>
                        <div className="text-end">
                          <strong className="text-[#0b3b32] font-bold block">{it.quantity} {isEn ? 'pcs' : 'قطعة'}</strong>
                          {it.sizes && <span className="text-[10px] text-[#4f735d]">{it.sizes}</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 bg-[#f8faf7] p-4 rounded-lg border border-[#e6ede5] text-xs">
                <div>
                  <span className="text-[#849589] text-[10px] block">{isEn ? 'Customer' : 'العميل'}</span>
                  <strong className="text-[#0b3b32] font-semibold">{order.name}</strong>
                </div>
                <div>
                  <span className="text-[#849589] text-[10px] block">{isEn ? 'Contact Phone' : 'أرقام الهاتف'}</span>
                  <strong className="text-[#0b3b32] font-semibold" dir="ltr">
                    {order.phone}{order.phoneSecondary ? ` / ${order.phoneSecondary}` : ''}
                  </strong>
                </div>
                <div>
                  <span className="text-[#849589] text-[10px] block">{isEn ? 'Email' : 'البريد الإلكتروني'}</span>
                  <strong className="text-[#0b3b32] font-semibold truncate block" title={order.email}>{order.email || '—'}</strong>
                </div>
                <div>
                  <span className="text-[#849589] text-[10px] block">{isEn ? 'Delivery Address' : 'عنوان الشحن'}</span>
                  <strong className="text-[#0b3b32] font-semibold truncate block" title={order.address}>{order.address || '—'}</strong>
                </div>
                <div>
                  <span className="text-[#849589] text-[10px] block">{isEn ? 'Sizes & Breakdown' : 'المقاسات والكميات'}</span>
                  <strong className="text-[#0b3b32] font-semibold">{order.sizes || '—'}</strong>
                </div>
                <div>
                  <span className="text-[#849589] text-[10px] block">{isEn ? 'Artwork File' : 'ملف التصميم'}</span>
                  <strong className="text-[#0b3b32] font-semibold truncate block" title={order.fileName}>
                    {order.fileName || (order.designHelp ? (isEn ? 'Design assistance' : 'مساعدة تصميم') : '—')}
                  </strong>
                </div>
                {order.productVision && (
                  <div className="col-span-2 sm:col-span-3 md:col-span-4 p-2.5 bg-[#edf5ee] border border-[#d2e2d4] rounded text-xs mt-1">
                    <span className="text-[#0b3b32] font-bold block mb-0.5">
                      {isEn ? 'Product Vision / Desired Final Look:' : 'وصف شكل المنتج المطلوب من العميل:'}
                    </span>
                    <p className="text-[#486354]">{order.productVision}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Activity History Logs */}
            <div className="p-5 md:p-6 bg-[#fafcfa]">
              <h3 className="text-xs font-bold text-[#0b3b32] uppercase tracking-wider mb-3">
                {isEn ? 'ACTIVITY LOG' : 'سجل التحديثات الزمني'}
              </h3>
              <div className="space-y-2">
                {order.history.map((log, i) => (
                  <div key={i} className="flex items-start gap-2.5 text-xs text-[#486354]">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#0b3b32] mt-1.5 shrink-0" />
                    <span className="font-medium">{log.note}</span>
                    <span className="text-[10px] text-[#86968c] ms-auto">
                      {new Date(log.date).toLocaleString(isEn ? 'en-US' : 'ar-EG')}
                    </span>
                  </div>
                ))}
              </div>

              {/* WhatsApp direct support button */}
              <div className="mt-5 pt-4 border-t border-[#e5ebe4] flex items-center justify-between flex-wrap gap-3">
                <span className="text-xs text-[#687c6f]">
                  {isEn ? 'Have questions regarding this order?' : 'هل لديك أي استفسار حول هذا الطلب؟'}
                </span>
                <a
                  href={`https://wa.me/201116891025?text=${encodeURIComponent(`مرحباً يوزرسيف، أستفسر عن طلبي رقم: ${order.id}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#0b3b32] text-white text-xs font-semibold rounded hover:bg-[#154c41] transition-colors"
                >
                  <MessageCircle size={15} />
                  <span>{isEn ? 'Chat via WhatsApp' : 'استفسر عبر واتساب'}</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
