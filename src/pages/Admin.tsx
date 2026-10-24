import React, { useMemo, useState } from 'react';
import { 
  ArrowUpLeft, 
  Check, 
  ClipboardList, 
  LogOut, 
  LockKeyhole, 
  MessageSquareText, 
  PackageCheck, 
  X, 
  CheckCircle2, 
  XCircle, 
  Layers, 
  Truck, 
  Send,
  Sparkles,
  AlertCircle
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { galleryItems } from '../data/services';
import ProductCatalogManager from '../components/ProductCatalogManager';
import { useLanguage } from '../lib/language';
import { getOrders, statusLabels, updateOrder, type Order, type OrderStatus } from '../lib/storage';

const demoCode = 'YZ-ADMIN';

const statusBadgeStyles: Record<OrderStatus, string> = {
  pending: 'bg-[#eef3eb] text-[#4d6953] border-[#d3e0d2]',
  approved: 'bg-[#e5f1e7] text-[#2e623a] border-[#c0dcc5]',
  production: 'bg-[#e4eff3] text-[#23586b] border-[#bedae3]',
  delivery: 'bg-[#f5eedc] text-[#7d5f1f] border-[#e8d8b2]',
  completed: 'bg-[#dcecdc] text-[#0b3b32] border-[#b4d6b7]',
  rejected: 'bg-[#fbedea] text-[#933f34] border-[#f0c2bd]',
};

// Preset quick notes for the Decision Engine
const PRESET_DECISION_NOTES = [
  { ar: 'جودة الصورة ضعيفة، يرجى إعادة الرفع بدقة أعلى.', en: 'Poor image quality, please re-upload in high resolution.' },
  { ar: 'تم تأكيد المقاسات والتصميم، وبدأنا مرحلة الطباعة بأسوان.', en: 'Sizes and design confirmed, starting production in Aswan.' },
  { ar: 'تم اعتماد بروفة التصميم وجاهزة للتنفيذ فوراً.', en: 'Artwork proof approved by studio, ready for production.' },
  { ar: 'طلبك جاهز للتسليم في أسوان أو للشحن إلى عنوانك.', en: 'Your order is ready for delivery or pickup in Aswan.' },
  { ar: 'يرجى التواصل معنا عبر واتساب لتأكيد موضع الشعار.', en: 'Please reach out on WhatsApp to clarify logo position.' },
];

export default function Admin() {
  const { isEn } = useLanguage();
  const [unlocked, setUnlocked] = useState(() => sessionStorage.getItem('yuzersef.admin') === 'yes');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [orders, setOrders] = useState<Order[]>(getOrders());
  const [activeId, setActiveId] = useState<string | null>(orders[0]?.id || null);
  const [note, setNote] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [actionFeedback, setActionFeedback] = useState<string>('');
  const [dashboardTab, setDashboardTab] = useState<'orders' | 'products'>('orders');

  const activeOrder = useMemo(() => orders.find((order) => order.id === activeId) || null, [orders, activeId]);

  const enter = (event: React.FormEvent) => {
    event.preventDefault();
    if (code.trim() === demoCode) { 
      sessionStorage.setItem('yuzersef.admin', 'yes'); 
      setUnlocked(true); 
      setError(''); 
    } else {
      setError(isEn ? 'That demo code does not match. Use YZ-ADMIN' : 'رمز الدخول غير صحيح. الرمز التجريبي هو: YZ-ADMIN');
    }
  };

  const logout = () => { 
    sessionStorage.removeItem('yuzersef.admin'); 
    setUnlocked(false); 
  };

  const refresh = () => {
    const latest = getOrders();
    setOrders(latest);
  };

  const switchDashboardTab = (tab: 'orders' | 'products') => {
    setDashboardTab(tab);
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      document.getElementById('admin-dashboard-content')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  };

  // Decision Engine Status Mutation
  const executeDecision = (targetOrder: Order, nextStatus: OrderStatus, customLogMessage?: string) => {
    const statusText = statusLabels[nextStatus][isEn ? 'en' : 'ar'];
    const logNote = customLogMessage || (isEn ? `Status changed to: ${statusText}` : `تحديث الحالة إلى: ${statusText}`);

    const nextActions: Record<OrderStatus, { ar: string; en: string }> = {
      pending: { ar: 'الطلب قيد مراجعة المواصفات.', en: 'Reviewing order specifications.' },
      approved: { ar: 'تمت الموافقة، جاري تحضير الخامات للتنفيذ.', en: 'Approved, preparing workshop fabrics and materials.' },
      production: { ar: 'الطلب في خط الطباعة والتجفيف والكي.', en: 'Order is on the DTF printing line.' },
      delivery: { ar: 'الطلب خرج مع مندوب التوصيل في أسوان.', en: 'Dispatched with courier in Aswan.' },
      completed: { ar: 'تم تسليم الطلب للعميل بنجاح.', en: 'Delivered successfully to customer.' },
      rejected: { ar: 'يرجى التواصل مع الاستوديو لتصحيح الطلب.', en: 'Please consult with studio to resolve issue.' },
    };

    updateOrder(
      targetOrder.id,
      {
        status: nextStatus,
        ownerNote: note.trim() || targetOrder.ownerNote,
        nextAction: nextActions[nextStatus][isEn ? 'en' : 'ar'],
      },
      logNote
    );

    refresh();
    setActionFeedback(isEn ? `Order ${targetOrder.id} marked as ${statusText}` : `تم تحديث الطلب ${targetOrder.id} إلى: ${statusText}`);
    setTimeout(() => setActionFeedback(''), 3500);
  };

  const saveCustomerNote = (targetOrder: Order) => {
    if (!note.trim()) return;
    updateOrder(
      targetOrder.id,
      { ownerNote: note.trim() },
      isEn ? 'Studio note updated for customer' : 'تم إرفاق ملاحظة جديدة للعميل'
    );
    refresh();
    setActionFeedback(isEn ? 'Note saved and visible to customer' : 'تم حفظ الملاحظة وستظهر للعميل في صفحة التتبع');
    setTimeout(() => setActionFeedback(''), 3500);
  };

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    if (statusFilter === 'all') return orders;
    return orders.filter((o) => o.status === statusFilter);
  }, [orders, statusFilter]);

  // LOGIN GATE SCREEN
  if (!unlocked) {
    return (
      <div className="min-h-[65vh] pb-20">
        <section className="max-w-xl mx-auto py-16 px-4">
          <span className="w-12 h-12 rounded-full grid place-items-center bg-[#e4ece2] text-[#0b3b32] mb-5 shadow-xs">
            <LockKeyhole size={24} />
          </span>
          <div className="flex items-center gap-2 text-[9px] font-bold tracking-widest text-[#5c756a] uppercase">
            <span className="w-5 h-[1px] bg-[#99aa8d]" />
            {isEn ? 'STUDIO DECISION ENGINE' : 'لوحة تحكم استوديو يوزرسيف'}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold text-[#0b3b32] my-3 leading-tight">
            {isEn ? <>Manage requests,<br /><em className="not-italic text-[#6b8976]">behind the scenes.</em></> : <>إدارة الطلبات<br /><em className="not-italic text-[#6b8976]">ومحرك القرارات.</em></>}
          </h1>
          <p className="text-xs text-[#718277] leading-relaxed mb-6">
            {isEn 
              ? 'Authorized dashboard for approving, rejecting, or advancing custom printing jobs.' 
              : 'لوحة الإدارة المخصصة لاعتماد ورفض الطلبات، وتحديث الحالات وإرسال ملاحظات المتابعة للعملاء.'}
          </p>

          <form onSubmit={enter} className="bg-white border border-[#e3e9e2] p-6 rounded-lg shadow-sm">
            <label htmlFor="admin-code" className="block text-[10px] font-bold tracking-wider text-[#63776b] uppercase mb-2">
              {isEn ? 'ACCESS CODE' : 'رمز الدخول'}
            </label>
            <input
              id="admin-code"
              type="text"
              dir="ltr"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="YZ-ADMIN"
              className="w-full p-3 bg-[#fbfcfa] border border-[#dce4dc] rounded text-sm font-mono font-bold text-[#0b3b32] focus:outline-none focus:border-[#0b3b32] focus:ring-1 focus:ring-[#0b3b32]"
            />
            <small className="block text-[10px] text-[#7c8b80] mt-1.5 mb-4">
              {isEn ? 'Demo passcode: YZ-ADMIN' : 'رمز التجربة السريع: YZ-ADMIN'}
            </small>

            {error && (
              <span className="block mb-4 p-2.5 bg-[#fbefed] border border-[#f4c6c0] text-[#8e4339] text-xs rounded font-medium">
                {error}
              </span>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#0b3b32] text-white font-bold text-xs rounded hover:bg-[#154c41] transition-all flex items-center justify-center gap-2 shadow-xs"
            >
              <span>{isEn ? 'Open Control Dashboard' : 'دخول لوحة التحكم'}</span>
              <ArrowUpLeft size={16} />
            </button>
          </form>
        </section>
      </div>
    );
  }

  // MAIN ADMIN DASHBOARD
  return (
    <div className="min-h-[65vh] pb-20">
      <section className="pt-12 w-[min(1220px,calc(100%_-_48px))] mx-auto">
        {/* Header Bar */}
        <div className="flex flex-wrap justify-between items-start gap-4 pb-6 border-b border-[#dce3dc]">
          <div>
            <div className="flex items-center gap-2 text-[9px] font-bold tracking-widest text-[#5c756a] uppercase">
              <span className="w-5 h-[1px] bg-[#99aa8d]" />
              {isEn ? 'STUDIO DECISION ENGINE' : 'محرك القرارات ولوحة التشغيل'}
            </div>
            <h1 className="text-3xl md:text-5xl font-bold text-[#0b3b32] my-2 leading-tight">
              {isEn ? <>Customer orders,<br /><em className="not-italic text-[#6b8976]">in real-time.</em></> : <>إدارة ومراجعة<br /><em className="not-italic text-[#6b8976]">طلبات يوزرسيف.</em></>}
            </h1>
            <p className="text-xs text-[#718277]">
              {isEn 
                ? 'Review artwork, execute approval/rejection decisions, and communicate instant updates.' 
                : 'راجع التصاميم، اتخذ قرارات القبول والرفض، وأرفق ملاحظات واضحة تظهر للعميل في التتبع.'}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link
              to="/track"
              className="px-3.5 py-2 border border-[#dce4de] bg-white text-[#0b3b32] font-semibold text-xs rounded hover:bg-[#f5f8f5] flex items-center gap-1.5"
            >
              <span>{isEn ? 'Customer View' : 'صفحة تتبع العميل'}</span>
              <ArrowUpLeft size={14} />
            </Link>
            <button
              onClick={logout}
              className="px-3.5 py-2 border border-[#edd5d1] bg-white text-[#933f34] font-semibold text-xs rounded hover:bg-[#fbf2f1] flex items-center gap-1.5"
            >
              <LogOut size={14} />
              <span>{isEn ? 'Sign out' : 'خروج'}</span>
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {actionFeedback && (
          <div className="mt-4 p-3 bg-[#e6f4ea] border border-[#a8dab5] text-[#1b5e20] text-xs font-bold rounded flex items-center gap-2 shadow-2xs">
            <Check size={16} />
            <span>{actionFeedback}</span>
          </div>
        )}

        <div className="sticky top-0 z-20 -mx-2 mt-6 flex gap-2 border-b border-[#e5ebe4] bg-[#f8faf7]/95 px-2 py-3 backdrop-blur-sm">
          <button type="button" onClick={() => switchDashboardTab('orders')} className={`rounded px-4 py-2 text-xs font-bold ${dashboardTab === 'orders' ? 'bg-[#0b3b32] text-white' : 'border border-[#dfe5df] bg-white text-[#55695d]'}`}>{isEn ? 'Orders' : 'الطلبات'}</button>
          <button type="button" onClick={() => switchDashboardTab('products')} className={`rounded px-4 py-2 text-xs font-bold ${dashboardTab === 'products' ? 'bg-[#0b3b32] text-white' : 'border border-[#dfe5df] bg-white text-[#55695d]'}`}>{isEn ? 'Store products' : 'منتجات المتجر'}</button>
        </div>

        <div id="admin-dashboard-content" className="scroll-mt-20">
        {dashboardTab === 'orders' ? <>
        {/* Analytics Counter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-6">
          <div className="bg-[#eaf0e8] p-4 rounded-lg relative border border-[#d6dfd5]">
            <span className="text-[10px] uppercase font-bold text-[#677d70] block">
              {isEn ? 'TOTAL ORDERS' : 'إجمالي الطلبات'}
            </span>
            <strong className="text-2xl font-bold text-[#0b3b32] block mt-1">
              {orders.length}
            </strong>
          </div>
          <div className="bg-[#eef5ee] p-4 rounded-lg relative border border-[#cfdfd0]">
            <span className="text-[10px] uppercase font-bold text-[#447053] block">
              {isEn ? 'PENDING REVIEW' : 'بانتظار المراجعة'}
            </span>
            <strong className="text-2xl font-bold text-[#0b3b32] block mt-1">
              {orders.filter((o) => o.status === 'pending').length}
            </strong>
          </div>
          <div className="bg-[#e4eff3] p-4 rounded-lg relative border border-[#c3dde6]">
            <span className="text-[10px] uppercase font-bold text-[#276479] block">
              {isEn ? 'IN PRODUCTION' : 'قيد الإنتاج'}
            </span>
            <strong className="text-2xl font-bold text-[#0b3b32] block mt-1">
              {orders.filter((o) => o.status === 'production').length}
            </strong>
          </div>
          <div className="bg-[#dcecdc] p-4 rounded-lg relative border border-[#b8dab9]">
            <span className="text-[10px] uppercase font-bold text-[#0b3b32] block">
              {isEn ? 'COMPLETED' : 'مكتملة ومسلمة'}
            </span>
            <strong className="text-2xl font-bold text-[#0b3b32] block mt-1">
              {orders.filter((o) => o.status === 'completed').length}
            </strong>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-4 border-b border-[#e5ebe4]">
          {[
            { id: 'all', ar: 'الكل', en: 'All', count: orders.length },
            { id: 'pending', ar: 'قيد المراجعة', en: 'Pending', count: orders.filter((o) => o.status === 'pending').length },
            { id: 'approved', ar: 'معتمدة', en: 'Approved', count: orders.filter((o) => o.status === 'approved').length },
            { id: 'production', ar: 'قيد الإنتاج', en: 'In Production', count: orders.filter((o) => o.status === 'production').length },
            { id: 'delivery', ar: 'خرجت للتوصيل', en: 'Out for Delivery', count: orders.filter((o) => o.status === 'delivery').length },
            { id: 'completed', ar: 'مكتملة', en: 'Completed', count: orders.filter((o) => o.status === 'completed').length },
            { id: 'rejected', ar: 'مرفوضة', en: 'Rejected', count: orders.filter((o) => o.status === 'rejected').length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1.5 rounded text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                statusFilter === tab.id
                  ? 'bg-[#0b3b32] text-white shadow-xs'
                  : 'bg-white border border-[#dfe5df] text-[#55695d] hover:bg-[#f3f7f2]'
              }`}
            >
              <span>{isEn ? tab.en : tab.ar}</span>
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                statusFilter === tab.id ? 'bg-white/20 text-white' : 'bg-[#eaf0e8] text-[#0b3b32]'
              }`}>
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Main Orders & Decision Engine Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-6 items-start">
          {/* Orders List Sidebar */}
          <div className="space-y-2 max-h-[700px] overflow-y-auto pe-1">
            {filteredOrders.length === 0 ? (
              <div className="p-8 text-center bg-white border border-[#e5ebe4] rounded-lg text-xs text-[#7d8c81]">
                {isEn ? 'No orders match this status filter.' : 'لا توجد طلبات تطابق هذا التصنيف.'}
              </div>
            ) : (
              filteredOrders.map((order) => {
                const isSelected = activeId === order.id;
                return (
                  <button
                    key={order.id}
                    onClick={() => {
                      setActiveId(order.id);
                      setNote(order.ownerNote);
                    }}
                    className={`w-full text-start p-3.5 rounded-lg border transition-all ${
                      isSelected 
                        ? 'border-[#0b3b32] bg-[#f2f7f2] shadow-xs ring-1 ring-[#0b3b32]' 
                        : 'border-[#e2e7e1] bg-white hover:border-[#86aa91]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-mono text-xs font-bold text-[#0b3b32]" dir="ltr">
                        {order.id}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${statusBadgeStyles[order.status]}`}>
                        {statusLabels[order.status][isEn ? 'en' : 'ar']}
                      </span>
                    </div>
                    <strong className="text-xs text-[#203c2e] block">{order.name}</strong>
                    <div className="flex items-center justify-between text-[10px] text-[#738478] mt-1">
                      <span>{order.productName} ({order.quantity})</span>
                      <span>{new Date(order.createdAt).toLocaleDateString(isEn ? 'en-US' : 'ar-EG')}</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {/* Decision Engine Inspector Card */}
          {activeOrder ? (
            <div className="bg-white border border-[#dfe5df] rounded-lg shadow-sm p-6 md:p-8">
              {/* Order Header */}
              <div className="flex flex-wrap justify-between items-start gap-4 pb-5 border-b border-[#edf0ec]">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${statusBadgeStyles[activeOrder.status]}`}>
                      {statusLabels[activeOrder.status][isEn ? 'en' : 'ar']}
                    </span>
                    <span className="text-xs text-[#718278]">
                      {new Date(activeOrder.createdAt).toLocaleString(isEn ? 'en-US' : 'ar-EG')}
                    </span>
                  </div>
                  <h2 className="text-2xl font-bold text-[#0b3b32] mt-1">
                    {activeOrder.productName}
                  </h2>
                  <p className="text-xs text-[#62776a] mt-0.5">
                    <strong>{activeOrder.name}</strong> • <span dir="ltr">{activeOrder.phone}</span>
                    {activeOrder.phoneSecondary && <span> • {isEn ? 'Alt:' : 'بديل:'} <span dir="ltr">{activeOrder.phoneSecondary}</span></span>}
                    {activeOrder.email && <span> • <a href={`mailto:${activeOrder.email}`} className="underline text-[#0b3b32]">{activeOrder.email}</a></span>}
                  </p>
                  {activeOrder.address && (
                    <p className="text-xs text-[#446050] mt-1 font-medium">
                      📍 <strong>{isEn ? 'Delivery:' : 'عنوان الشحن:'}</strong> {activeOrder.address}
                    </p>
                  )}
                </div>

                <div className="text-end">
                  <span className="text-[10px] uppercase font-bold text-[#8a978d] block">
                    {isEn ? 'REFERENCE ID' : 'معرف الطلب'}
                  </span>
                  <span className="font-mono font-bold text-sm text-[#0b3b32]" dir="ltr">
                    {activeOrder.id}
                  </span>
                </div>
              </div>

              {/* Multi-Item Breakdown if present */}
              {activeOrder.items && activeOrder.items.length > 1 && (
                <div className="my-5 border border-[#d8e3d8] rounded-lg overflow-hidden bg-white shadow-2xs">
                  <div className="p-3 bg-[#eef4ee] border-b border-[#d8e3d8] flex items-center justify-between">
                    <span className="text-xs font-bold text-[#0b3b32]">
                      {isEn ? `Order Breakdown (${activeOrder.items.length} products):` : `تفصيل المنتجات في الطلب (${activeOrder.items.length} منتجات):`}
                    </span>
                    <span className="text-xs font-bold text-[#0b3b32] bg-[#dbe8dc] px-2.5 py-0.5 rounded-full">
                      {activeOrder.quantity} {isEn ? 'Total Items' : 'إجمالي القطع'}
                    </span>
                  </div>
                  <div className="divide-y divide-[#edf2ed]">
                    {activeOrder.items.map((it, idx) => (
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

              {/* Order Specifications Table */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 my-5 p-4 bg-[#f8faf7] border border-[#e4ebe3] rounded-lg text-xs">
                <div>
                  <span className="text-[#849589] text-[10px] block">{isEn ? 'Quantity' : 'الكمية'}</span>
                  <strong className="text-[#0b3b32]">{activeOrder.quantity} {isEn ? 'items' : 'قطعة'}</strong>
                </div>
                <div>
                  <span className="text-[#849589] text-[10px] block">{isEn ? 'Sizes' : 'المقاسات'}</span>
                  <strong className="text-[#0b3b32]">{activeOrder.sizes || '—'}</strong>
                </div>
                <div>
                  <span className="text-[#849589] text-[10px] block">{isEn ? 'Color Preference' : 'اللون'}</span>
                  <strong className="text-[#0b3b32]">{activeOrder.color || '—'}</strong>
                </div>
                <div>
                  <span className="text-[#849589] text-[10px] block">{isEn ? 'Print Placement' : 'موضع الطباعة'}</span>
                  <strong className="text-[#0b3b32]">{activeOrder.placement || '—'}</strong>
                </div>
                <div>
                  <span className="text-[#849589] text-[10px] block">{isEn ? 'Artwork / File' : 'الملف المرفق'}</span>
                  <strong className="text-[#0b3b32] truncate block" title={activeOrder.fileName}>
                    {activeOrder.fileName || (activeOrder.designHelp ? (isEn ? 'Design assistance requested' : 'طلب مساعدة تصميم') : '—')}
                  </strong>
                </div>
                <div>
                  <span className="text-[#849589] text-[10px] block">{isEn ? 'Gallery Reference' : 'مرجع المعرض'}</span>
                  <strong className="text-[#0b3b32]">
                    {galleryItems.find((g) => g.id === activeOrder.referenceId)?.title[isEn ? 'en' : 'ar'] || '—'}
                  </strong>
                </div>
              </div>

              {activeOrder.productVision && (
                <div className="mb-4 p-3.5 bg-[#f0f7f1] border border-[#cee2d0] rounded-lg text-xs">
                  <span className="font-bold text-[#0b3b32] block mb-1">
                    {isEn ? 'Customer Desired Product Vision (Output Wish):' : 'وصف شكل المنتج المطلوب من العميل:'}
                  </span>
                  <p className="text-[#3c5746] leading-relaxed font-medium">{activeOrder.productVision}</p>
                </div>
              )}

              {activeOrder.notes && (
                <div className="mb-5 p-3.5 bg-[#f5f8f5] border border-[#dbe4db] rounded text-xs">
                  <span className="font-bold text-[#0b3b32] block mb-1">
                    {isEn ? 'Customer Instructions & Notes:' : 'ملاحظات العميل الخاصة:'}
                  </span>
                  <p className="text-[#4e6758]">{activeOrder.notes}</p>
                </div>
              )}

              {/* -------------------------------------------------------------
                  DECISION ENGINE ACTION BUTTONS (المحرك التنفيذي)
                 ------------------------------------------------------------- */}
              <div className="my-6 p-5 bg-[#edf3ed] border border-[#d0ded0] rounded-xl">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles size={16} className="text-[#0b3b32]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-[#0b3b32]">
                    {isEn ? 'DECISION ENGINE: INSTANT STATUS ACTIONS' : 'محرك القرارات: اعتماد وتحديث الحالة فورياً'}
                  </h3>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                  {/* Approve */}
                  <button
                    type="button"
                    onClick={() => executeDecision(activeOrder, 'approved')}
                    className={`p-2.5 rounded-lg border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                      activeOrder.status === 'approved'
                        ? 'bg-[#0b3b32] text-white border-[#0b3b32] shadow-xs'
                        : 'bg-white border-[#c9d9cb] text-[#225830] hover:bg-[#e4efe6]'
                    }`}
                  >
                    <CheckCircle2 size={16} />
                    <span>{isEn ? 'Approve' : 'قبول الطلب'}</span>
                  </button>

                  {/* Production */}
                  <button
                    type="button"
                    onClick={() => executeDecision(activeOrder, 'production')}
                    className={`p-2.5 rounded-lg border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                      activeOrder.status === 'production'
                        ? 'bg-[#0b3b32] text-white border-[#0b3b32] shadow-xs'
                        : 'bg-white border-[#c3dde6] text-[#205b6e] hover:bg-[#e2eff3]'
                    }`}
                  >
                    <Layers size={16} />
                    <span>{isEn ? 'In Production' : 'بدء الإنتاج'}</span>
                  </button>

                  {/* Delivery */}
                  <button
                    type="button"
                    onClick={() => executeDecision(activeOrder, 'delivery')}
                    className={`p-2.5 rounded-lg border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                      activeOrder.status === 'delivery'
                        ? 'bg-[#0b3b32] text-white border-[#0b3b32] shadow-xs'
                        : 'bg-white border-[#e8d8b2] text-[#7d5f1f] hover:bg-[#f7f0e0]'
                    }`}
                  >
                    <Truck size={16} />
                    <span>{isEn ? 'Out for Delivery' : 'خرج للتوصيل'}</span>
                  </button>

                  {/* Completed */}
                  <button
                    type="button"
                    onClick={() => executeDecision(activeOrder, 'completed')}
                    className={`p-2.5 rounded-lg border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                      activeOrder.status === 'completed'
                        ? 'bg-[#0b3b32] text-white border-[#0b3b32] shadow-xs'
                        : 'bg-white border-[#b8dab9] text-[#0b3b32] hover:bg-[#e1efe2]'
                    }`}
                  >
                    <PackageCheck size={16} />
                    <span>{isEn ? 'Completed' : 'اكتمال الطلب'}</span>
                  </button>

                  {/* Reject */}
                  <button
                    type="button"
                    onClick={() => executeDecision(activeOrder, 'rejected')}
                    className={`p-2.5 rounded-lg border font-bold text-xs flex flex-col items-center justify-center gap-1 transition-all ${
                      activeOrder.status === 'rejected'
                        ? 'bg-[#984c40] text-white border-[#984c40] shadow-xs'
                        : 'bg-white border-[#f0c2bd] text-[#933f34] hover:bg-[#fcedeb]'
                    }`}
                  >
                    <XCircle size={16} />
                    <span>{isEn ? 'Reject' : 'رفض الطلب'}</span>
                  </button>
                </div>
              </div>

              {/* -------------------------------------------------------------
                  CUSTOMER NOTE ATTACHMENT WITH PRESETS
                 ------------------------------------------------------------- */}
              <div className="my-6">
                <label className="block text-xs font-bold text-[#0b3b32] mb-1.5">
                  {isEn ? 'Attach Studio Note to Customer:' : 'إرفاق ملاحظة تظهر للعميل في صفحة التتبع:'}
                </label>
                <div className="flex gap-2">
                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder={isEn ? 'e.g. Poor image quality, please re-upload...' : 'مثال: جودة الصورة ضعيفة، يرجى إعادة الرفع...'}
                    className="flex-1 p-2.5 bg-[#fbfcfa] border border-[#dce4dc] rounded text-xs text-[#0b3b32] focus:outline-none focus:border-[#0b3b32]"
                  />
                  <button
                    type="button"
                    onClick={() => saveCustomerNote(activeOrder)}
                    className="px-4 py-2 bg-[#0b3b32] text-white font-semibold text-xs rounded hover:bg-[#154c41] flex items-center gap-1.5 shrink-0"
                  >
                    <Send size={13} />
                    <span>{isEn ? 'Save Note' : 'حفظ وإرسال'}</span>
                  </button>
                </div>

                {/* Preset Note Quick Chips */}
                <div className="mt-2.5 flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] text-[#6d7e73] font-semibold">{isEn ? 'Presets:' : 'قوالب سريعة:'}</span>
                  {PRESET_DECISION_NOTES.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setNote(isEn ? preset.en : preset.ar)}
                      className="text-[10px] bg-[#f0f4ef] hover:bg-[#e4ede3] text-[#2c4b3a] border border-[#d2ded3] px-2 py-0.5 rounded transition-colors text-start"
                    >
                      {isEn ? preset.en : preset.ar}
                    </button>
                  ))}
                </div>
              </div>

              {/* Activity History Log */}
              <div className="mt-6 pt-5 border-t border-[#edf0ec]">
                <h4 className="text-[11px] font-bold uppercase tracking-wider text-[#6f8275] mb-2.5">
                  {isEn ? 'TIMELINE & ACTIVITY HISTORY' : 'سجل التحديثات للطلب'}
                </h4>
                <div className="space-y-1.5 max-h-40 overflow-y-auto">
                  {activeOrder.history.map((entry, index) => (
                    <div key={index} className="flex items-center justify-between text-xs text-[#486354] bg-[#f9faf8] p-2 rounded border border-[#edf1ec]">
                      <div className="flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#0b3b32]" />
                        <span className="font-medium">{entry.note}</span>
                      </div>
                      <span className="text-[10px] text-[#86968c]">
                        {new Date(entry.date).toLocaleString(isEn ? 'en-US' : 'ar-EG')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center bg-white border border-[#e2e7e1] rounded-lg text-sm text-[#77867d]">
              {isEn ? 'Select an order from the left list to review.' : 'اختر طلباً من القائمة لعرض تفاصيله واتخاذ القرار.'}
            </div>
          )}
        </div>
        </> : <ProductCatalogManager isEn={isEn} />}
        </div>
        <button type="button" onClick={() => switchDashboardTab(dashboardTab === 'orders' ? 'products' : 'orders')} className="fixed bottom-5 end-5 z-40 inline-flex items-center gap-2 rounded-full bg-[#0b3b32] px-5 py-3 text-xs font-bold text-white shadow-[0_8px_24px_rgba(8,45,39,.28)] transition hover:-translate-y-0.5 hover:bg-[#154c41] max-[720px]:bottom-4 max-[720px]:end-4 max-[720px]:px-4" aria-label={dashboardTab === 'orders' ? (isEn ? 'Open product management' : 'فتح إدارة المنتجات') : (isEn ? 'Return to orders' : 'العودة إلى الطلبات')}>
          {dashboardTab === 'orders' ? <PackageCheck size={16} /> : <ClipboardList size={16} />}
          <span>{dashboardTab === 'orders' ? (isEn ? 'Manage products' : 'إدارة المنتجات') : (isEn ? 'Back to orders' : 'العودة للطلبات')}</span>
        </button>
      </section>
    </div>
  );
}
