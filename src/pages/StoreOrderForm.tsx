import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Check, Clock3, Eye, Minus, Plus, Search, ShoppingCart, Store, Trash2, Truck, X } from 'lucide-react';
import { getOrderProducts, ORDER_SETTINGS, type StoreProduct } from '../data/orderProducts';
import LiveMockupPreview from '../components/LiveMockupPreview';

type CartLine = { productId: string; qty: number; note: string };
type Customer = { fullName: string; phone: string; alternatePhone: string; email: string; notes: string };
type DeliveryMethod = 'delivery' | 'pickup';
type SubmittedItem = { productId: string; name: string; qty: number; unitPrice: number; lineTotal: number; note: string };
export type OrderPayload = {
  customer: Customer;
  items: SubmittedItem[];
  deliveryMethod: DeliveryMethod;
  address: string;
  urgent: boolean;
  subtotal: number;
  discount: number;
  subtotalAfterDiscount: number;
  rushFee: number;
  total: number;
};

const CART_KEY = 'yuzersef.checkout-cart';
const initialCustomer: Customer = { fullName: '', phone: '', alternatePhone: '', email: '', notes: '' };

// This mock submit handler is the single point to connect to an API, WhatsApp, or email later.
export async function submitOrder(order: OrderPayload): Promise<{ orderNumber: string }> {
  void order;
  return { orderNumber: `YZ-${Date.now().toString().slice(-7)}` };
}

function readCart(validProductIds: Set<string>): CartLine[] {
  try {
    const saved = JSON.parse(localStorage.getItem(CART_KEY) || '[]');
    return Array.isArray(saved) ? saved.filter((line) => line && typeof line.productId === 'string' && validProductIds.has(line.productId) && Number(line.qty) > 0).map((line) => ({ productId: line.productId, qty: Math.max(1, Math.floor(Number(line.qty))), note: String(line.note || '') })) : [];
  } catch { return []; }
}

function formatPrice(value: number) {
  const rounded = Math.round(value * 100) / 100;
  return `${rounded.toLocaleString('ar-EG', { maximumFractionDigits: 2 })} ${ORDER_SETTINGS.currency}`;
}

function tierFor(quantity: number) {
  return ORDER_SETTINGS.tiers.find((tier) => quantity >= tier.min && quantity <= tier.max) || ORDER_SETTINGS.tiers[0];
}

function unitPrice(product: StoreProduct, quantity: number) {
  return product.basePrice * (1 - tierFor(quantity).discount / 100);
}

function validateEgyptianPhone(value: string) {
  const phone = value.replace(/[\s()-]/g, '');
  return /^(?:(?:\+20|0020)0?|0)?1[0125]\d{8}$/.test(phone);
}

function CartContents({
  cart, products, updateQty, updateNote, removeItem, clearCart, subtotal, discount, afterDiscount, rushFee, total, urgent, onUrgent,
  deliveryMethod, setDeliveryMethod, customer, setCustomer, address, setAddress, errors, onReview, onPreview, isMobile = false, closeMobile,
}: {
  cart: CartLine[]; products: StoreProduct[]; updateQty: (id: string, qty: number) => void; updateNote: (id: string, note: string) => void;
  removeItem: (id: string) => void; clearCart: () => void; subtotal: number; discount: number; afterDiscount: number;
  rushFee: number; total: number; urgent: boolean; onUrgent: (value: boolean) => void; deliveryMethod: DeliveryMethod;
  setDeliveryMethod: (method: DeliveryMethod) => void; customer: Customer; setCustomer: (customer: Customer) => void;
  address: string; setAddress: (address: string) => void; errors: Record<string, string>; onReview: () => void;
  onPreview: (product: StoreProduct) => void;
  isMobile?: boolean; closeMobile?: () => void;
}) {
  const productFor = (id: string) => products.find((product) => product.id === id);
  const classInput = 'w-full rounded-lg border border-[#dce4dc] bg-white px-3.5 py-3 text-sm text-[#173b32] outline-none transition focus:border-[#799681] focus:ring-2 focus:ring-[#799681]/15';
  const updateCustomer = (key: keyof Customer, value: string) => setCustomer({ ...customer, [key]: value });
  const quantityTotal = cart.reduce((sum, line) => sum + line.qty, 0);

  return <div className={`rounded-2xl border border-[#e0e8df] bg-white shadow-[0_10px_35px_rgba(16,52,38,.06)] ${isMobile ? 'max-h-[90dvh] overflow-y-auto rounded-t-3xl' : 'max-h-[calc(100vh-32px)] overflow-y-auto'}`}>
    <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[#edf1ec] bg-white/95 px-5 py-4 backdrop-blur">
      <div className="flex items-center gap-2.5"><span className="grid h-9 w-9 place-items-center rounded-full bg-[#eaf1e8] text-[#0b3b32]"><ShoppingCart size={18} /></span><div><h2 className="font-bold text-[#0b3b32]">السلة</h2><p className="text-[11px] text-[#7a897e]">{quantityTotal} قطعة · {cart.length} منتج</p></div></div>
      <div className="flex items-center gap-2">{cart.length > 0 && <button type="button" onClick={clearCart} className="text-[11px] font-semibold text-[#9b4d42] hover:underline">تفريغ السلة</button>}{isMobile && <button type="button" onClick={closeMobile} aria-label="إغلاق السلة" className="grid h-9 w-9 place-items-center rounded-full bg-[#f3f6f2] text-[#456456]"><X size={18} /></button>}</div>
    </div>

    <div className="space-y-3 px-4 py-4">
      {cart.length === 0 ? <div className="rounded-xl border border-dashed border-[#d7e1d6] bg-[#fafcf9] px-4 py-8 text-center"><ShoppingCart size={27} className="mx-auto mb-2 text-[#9bad9e]" /><p className="text-sm font-semibold text-[#65796c]">السلة فاضية</p><p className="mt-1 text-xs text-[#91a096]">اختار منتجات من القائمة لإضافتها هنا.</p></div> : cart.map((line) => {
        const product = productFor(line.productId);
        if (!product) return null;
        const price = unitPrice(product, line.qty);
        const lineTotal = price * line.qty;
        const savings = (product.basePrice - price) * line.qty;
        const tier = tierFor(line.qty);
        const nextTier = ORDER_SETTINGS.tiers.find((candidate) => candidate.min > line.qty);
        return <article key={line.productId} className="rounded-xl border border-[#e7ece6] bg-[#fcfdfb] p-3.5">
          <div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-[#183d32]">{product.name}</h3><p className="mt-0.5 text-[11px] text-[#829087]">{product.category}</p><button type="button" onClick={() => onPreview(product)} className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-[#52745d] hover:underline"><Eye size={12} />معاينة</button></div><button type="button" onClick={() => removeItem(line.productId)} aria-label={`حذف ${product.name}`} className="grid h-8 w-8 shrink-0 place-items-center rounded-lg text-[#a04c42] hover:bg-[#fbeeed]"><Trash2 size={15} /></button></div>
          <div className="mt-3 flex items-center justify-between gap-3"><div className="flex items-center gap-1.5"><button type="button" onClick={() => updateQty(line.productId, line.qty - 1)} aria-label="تقليل الكمية" className="grid h-8 w-8 place-items-center rounded-lg border border-[#dce5dc] bg-white text-[#365848]"><Minus size={14} /></button><input type="number" min={1} value={line.qty} onChange={(event) => updateQty(line.productId, Number(event.target.value) || 1)} aria-label={`كمية ${product.name}`} className="h-8 w-[60px] rounded-lg border border-[#dce5dc] bg-white text-center text-sm font-bold text-[#173b32] outline-none focus:border-[#799681]" /><button type="button" onClick={() => updateQty(line.productId, line.qty + 1)} aria-label="زيادة الكمية" className="grid h-8 w-8 place-items-center rounded-lg border border-[#dce5dc] bg-white text-[#365848]"><Plus size={14} /></button></div><div className="text-end"><p className="text-[11px] text-[#839087]">{formatPrice(price)} / قطعة</p><strong className="text-sm text-[#173b32]">{formatPrice(lineTotal)}</strong></div></div>
          <div className="mt-2 flex justify-between text-[11px]"><span className="text-[#607867]">خصم {tier.discount}%</span><span className="font-semibold text-[#3c8260]">وفرت {formatPrice(savings)}</span></div>
          {nextTier ? <p className="mt-2 rounded-lg bg-[#eff5ed] px-2.5 py-2 text-[10px] leading-5 text-[#54735e]">أضف {nextTier.min - line.qty} قطعة كمان واحصل على خصم {nextTier.discount}%</p> : <p className="mt-2 rounded-lg bg-[#eff5ed] px-2.5 py-2 text-[10px] text-[#54735e]">وصلت لأعلى خصم: 40%</p>}
          <label className="mt-3 block text-[11px] font-semibold text-[#5d7466]">وصف شكل المنتج<textarea rows={2} value={line.note} onChange={(event) => updateNote(line.productId, event.target.value)} placeholder="لون أو طباعة أو تفاصيل إضافية للمنتج" className="mt-1.5 w-full resize-y rounded-lg border border-[#dce4dc] bg-white p-2.5 text-xs font-normal text-[#173b32] outline-none focus:border-[#799681]" /></label>
        </article>;
      })}
      {errors.cart && <p className="text-xs font-semibold text-[#ad4e43]">{errors.cart}</p>}
    </div>

    <div className="border-t border-[#edf1ec] px-4 py-4">
      <h3 className="mb-3 text-sm font-bold text-[#173b32]">طريقة الاستلام</h3>
      <div className="grid grid-cols-2 gap-2"><label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-xs font-semibold ${deliveryMethod === 'delivery' ? 'border-[#648c72] bg-[#f1f6ef] text-[#174536]' : 'border-[#e1e8e1] text-[#64766a]'}`}><input type="radio" name="delivery-method" checked={deliveryMethod === 'delivery'} onChange={() => setDeliveryMethod('delivery')} className="accent-[#0b3b32]" /><Truck size={15} />توصيل لمكانك</label><label className={`flex cursor-pointer items-center gap-2 rounded-xl border p-3 text-xs font-semibold ${deliveryMethod === 'pickup' ? 'border-[#648c72] bg-[#f1f6ef] text-[#174536]' : 'border-[#e1e8e1] text-[#64766a]'}`}><input type="radio" name="delivery-method" checked={deliveryMethod === 'pickup'} onChange={() => setDeliveryMethod('pickup')} className="accent-[#0b3b32]" /><Store size={15} />استلام من المحل</label></div>
      {deliveryMethod === 'delivery' ? <label className="mt-3 block text-xs font-semibold text-[#274c3d]">العنوان بالتفصيل (المحافظة، المدينة، الحي، الشارع) <span className="text-[#bd574c]">*</span><textarea required rows={3} value={address} onChange={(event) => setAddress(event.target.value)} placeholder="اكتب المحافظة والمدينة والحي والشارع ورقم العقار" className={`${classInput} mt-1.5 resize-y`} />{errors.address && <span className="mt-1 block text-[11px] font-medium text-[#ad4e43]">{errors.address}</span>}</label> : <div className="mt-3 rounded-xl bg-[#f5f8f3] p-3.5 text-xs leading-6 text-[#546d5d]"><p className="flex items-center gap-2 font-bold text-[#244937]"><Store size={15} />عنوان المحل</p><p>{ORDER_SETTINGS.storeAddress}</p><p className="flex items-center gap-2"><Clock3 size={14} />مواعيد العمل: {ORDER_SETTINGS.storeHours}</p></div>}
    </div>

    <div className="border-t border-[#edf1ec] px-4 py-4">
      <h3 className="mb-3 text-sm font-bold text-[#173b32]">بيانات العميل</h3>
      <div className="space-y-3">
        <label className="block text-xs font-semibold text-[#274c3d]">اسمك الكريم <span className="text-[#bd574c]">*</span><input required autoComplete="name" value={customer.fullName} onChange={(event) => updateCustomer('fullName', event.target.value)} className={`${classInput} mt-1.5`} placeholder="الاسم بالكامل" />{errors.fullName && <span className="mt-1 block text-[11px] font-medium text-[#ad4e43]">{errors.fullName}</span>}</label>
        <label className="block text-xs font-semibold text-[#274c3d]">رقم التليفون الأساسي / واتساب <span className="text-[#bd574c]">*</span><input required autoComplete="tel" inputMode="tel" dir="ltr" value={customer.phone} onChange={(event) => updateCustomer('phone', event.target.value)} className={`${classInput} mt-1.5 text-left`} placeholder="01x xxxx xxxx" />{errors.phone && <span className="mt-1 block text-[11px] font-medium text-[#ad4e43]">{errors.phone}</span>}</label>
        <label className="block text-xs font-semibold text-[#274c3d]">رقم هاتف آخر (بديل)<input autoComplete="tel-national" inputMode="tel" dir="ltr" value={customer.alternatePhone} onChange={(event) => updateCustomer('alternatePhone', event.target.value)} className={`${classInput} mt-1.5 text-left`} placeholder="01x xxxx xxxx" />{errors.alternatePhone && <span className="mt-1 block text-[11px] font-medium text-[#ad4e43]">{errors.alternatePhone}</span>}</label>
        <label className="block text-xs font-semibold text-[#274c3d]">البريد الإلكتروني <span className="text-[#bd574c]">*</span><input required autoComplete="email" type="email" dir="ltr" value={customer.email} onChange={(event) => updateCustomer('email', event.target.value)} className={`${classInput} mt-1.5 text-left`} placeholder="name@example.com" />{errors.email && <span className="mt-1 block text-[11px] font-medium text-[#ad4e43]">{errors.email}</span>}</label>
        <label className="block text-xs font-semibold text-[#274c3d]">وصف شكل المنتج اللي حابب يطلع بيه<textarea rows={3} value={customer.notes} onChange={(event) => updateCustomer('notes', event.target.value)} placeholder="اكتب تفاصيل عامة عن الشكل أو الفكرة" className={`${classInput} mt-1.5 resize-y`} /></label>
      </div>
    </div>

    <div className="border-t border-[#edf1ec] px-4 py-4">
      <label className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3.5 ${urgent ? 'border-[#e3c894] bg-[#fff9eb]' : 'border-[#e5ebe4] bg-[#fcfdfb]'}`}><input type="checkbox" checked={urgent} onChange={(event) => onUrgent(event.target.checked)} className="mt-0.5 h-4 w-4 accent-[#0b3b32]" /><span className="flex-1"><strong className="block text-xs text-[#56472b]">طلب مستعجل</strong><small className="mt-1 block leading-5 text-[#8c7953]">رسوم إضافية {ORDER_SETTINGS.rushFeePercent}% من قيمة المنتجات بعد الخصم. {ORDER_SETTINGS.urgentEstimate}</small></span></label>
      <div className="mt-4 space-y-2 text-xs"><div className="flex justify-between text-[#65776a]"><span>الإجمالي قبل الخصم</span><span>{formatPrice(subtotal)}</span></div><div className="flex justify-between text-[#3f8560]"><span>إجمالي التوفير</span><span>− {formatPrice(discount)}</span></div><div className="flex justify-between text-[#65776a]"><span>الإجمالي بعد الخصم</span><span>{formatPrice(afterDiscount)}</span></div>{urgent && <div className="flex justify-between text-[#8d6b2b]"><span>رسوم الطلب المستعجل ({ORDER_SETTINGS.rushFeePercent}%)</span><span>{formatPrice(rushFee)}</span></div>}<div className="mt-2 flex justify-between border-t border-[#e7ece6] pt-3 text-sm font-bold text-[#123b2f]"><span>الإجمالي النهائي</span><span>{formatPrice(total)}</span></div></div>
      <button type="button" onClick={onReview} disabled={cart.length === 0} className="mt-4 w-full rounded-xl bg-[#0b3b32] px-4 py-3.5 text-sm font-bold text-white transition hover:bg-[#174c40] disabled:cursor-not-allowed disabled:bg-[#a9b6ab]">تأكيد الطلب</button>
    </div>
  </div>;
}

export default function StoreOrderForm() {
  const [products] = useState<StoreProduct[]>(getOrderProducts);
  const [cart, setCart] = useState<CartLine[]>(() => readCart(new Set(products.map((product) => product.id))));
  const [customer, setCustomer] = useState<Customer>(initialCustomer);
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('delivery');
  const [address, setAddress] = useState('');
  const [urgent, setUrgent] = useState(false);
  const [mobileCartOpen, setMobileCartOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [previewProduct, setPreviewProduct] = useState<StoreProduct | null>(null);
  const [successOrder, setSuccessOrder] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('الكل');
  const [productQty, setProductQty] = useState<Record<string, number>>({});

  useEffect(() => {
    try { localStorage.setItem(CART_KEY, JSON.stringify(cart)); } catch { /* Keep cart in memory when storage is unavailable. */ }
  }, [cart]);

  const categories = useMemo(() => ['الكل', ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  const filteredProducts = useMemo(() => products.filter((product) => (category === 'الكل' || product.category === category) && `${product.name} ${product.description}`.toLowerCase().includes(search.trim().toLowerCase())), [category, search, products]);
  const totals = useMemo(() => {
    const subtotal = cart.reduce((sum, line) => sum + (products.find((product) => product.id === line.productId)?.basePrice || 0) * line.qty, 0);
    const discount = cart.reduce((sum, line) => {
      const product = products.find((entry) => entry.id === line.productId);
      return sum + (product ? (product.basePrice - unitPrice(product, line.qty)) * line.qty : 0);
    }, 0);
    const afterDiscount = subtotal - discount;
    const rushFee = urgent ? Math.round(afterDiscount * ORDER_SETTINGS.rushFeePercent) / 100 : 0;
    return { subtotal, discount, afterDiscount, rushFee, total: afterDiscount + rushFee };
  }, [cart, urgent, products]);
  const quantityTotal = cart.reduce((sum, line) => sum + line.qty, 0);
  const updateQty = (id: string, qty: number) => setCart((current) => current.map((line) => line.productId === id ? { ...line, qty: Math.max(1, Math.floor(Number.isFinite(qty) ? qty : 1)) } : line));
  const addToCart = (product: StoreProduct) => {
    const qty = Math.max(1, Math.floor(productQty[product.id] || 1));
    setCart((current) => current.some((line) => line.productId === product.id)
      ? current.map((line) => line.productId === product.id ? { ...line, qty: line.qty + qty } : line)
      : [...current, { productId: product.id, qty, note: '' }]);
    setErrors((current) => ({ ...current, cart: '' }));
  };
  const updateNote = (id: string, note: string) => setCart((current) => current.map((line) => line.productId === id ? { ...line, note } : line));
  const removeItem = (id: string) => setCart((current) => current.filter((line) => line.productId !== id));
  const clearCart = () => setCart([]);

  const getPayload = (): OrderPayload => ({
    customer,
    items: cart.flatMap((line) => {
      const product = products.find((entry) => entry.id === line.productId);
      if (!product) return [];
      const price = unitPrice(product, line.qty);
      return [{ productId: product.id, name: product.name, qty: line.qty, unitPrice: price, lineTotal: price * line.qty, note: line.note }];
    }),
    deliveryMethod,
    address: deliveryMethod === 'delivery' ? address.trim() : '',
    urgent,
    subtotal: totals.subtotal,
    discount: totals.discount,
    subtotalAfterDiscount: totals.afterDiscount,
    rushFee: totals.rushFee,
    total: totals.total,
  });

  const validate = () => {
    const next: Record<string, string> = {};
    if (!customer.fullName.trim()) next.fullName = 'اكتب اسمك الكريم.';
    if (!customer.phone.trim()) next.phone = 'رقم التليفون الأساسي مطلوب.';
    else if (!validateEgyptianPhone(customer.phone)) next.phone = 'اكتب رقم موبايل مصري صحيح، مثل 01012345678.';
    if (customer.alternatePhone.trim() && !validateEgyptianPhone(customer.alternatePhone)) next.alternatePhone = 'اكتب رقم موبايل مصري صحيح أو اترك الحقل فارغًا.';
    if (!customer.email.trim()) next.email = 'البريد الإلكتروني مطلوب.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(customer.email.trim())) next.email = 'اكتب بريدًا إلكترونيًا صحيحًا.';
    if (deliveryMethod === 'delivery' && !address.trim()) next.address = 'العنوان مطلوب لتوصيل الطلب.';
    if (cart.length === 0) next.cart = 'أضف منتجًا واحدًا على الأقل قبل تأكيد الطلب.';
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleReview = (event?: FormEvent) => {
    event?.preventDefault();
    if (validate()) setReviewOpen(true);
    else document.getElementById('checkout-panel')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  const confirmOrder = async () => {
    const result = await submitOrder(getPayload());
    try { localStorage.removeItem(CART_KEY); } catch { /* Memory cart will still be cleared. */ }
    setCart([]);
    setReviewOpen(false);
    setMobileCartOpen(false);
    setSuccessOrder(result.orderNumber);
  };

  const panelProps = {
    cart, products, updateQty, updateNote, removeItem, clearCart,
    subtotal: totals.subtotal, discount: totals.discount, afterDiscount: totals.afterDiscount,
    rushFee: totals.rushFee, total: totals.total, urgent, onUrgent: setUrgent,
    deliveryMethod, setDeliveryMethod, customer, setCustomer, address, setAddress,
    errors, onReview: handleReview, onPreview: setPreviewProduct,
  };

  return <main dir="rtl" style={{ fontFamily: "'IBM Plex Sans Arabic', sans-serif" }} className="min-h-screen bg-[#f6f8f4] pb-24 text-[#173b32]">
    <header className="border-b border-[#e2e9e1] bg-[radial-gradient(ellipse_at_top_right,_#e8f0e5,_transparent_60%)] px-4 py-10 sm:px-6 lg:py-14">
      <div className="mx-auto max-w-[1320px]"><p className="text-xs font-bold tracking-[.18em] text-[#62806c]">YUZERSEF · ASWAN</p><h1 className="mt-3 text-3xl font-bold leading-tight text-[#123b2f] sm:text-5xl">اطلب منتجاتك بسهولة</h1><p className="mt-3 max-w-2xl text-sm leading-7 text-[#6d7f73]">اختار المنتجات والكميات، شوف خصم الكمية مباشرة، واكتب تفاصيل التوصيل والتصميم في مكان واحد.</p></div>
    </header>

    <form noValidate onSubmit={handleReview} className="mx-auto grid max-w-[1320px] grid-cols-1 gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[minmax(0,1fr)_390px] lg:items-start lg:gap-8 lg:py-9">
      <section>
        <div className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><h2 className="text-xl font-bold text-[#173b32]">اختار المنتجات</h2><p className="mt-1 text-xs text-[#839087]">أسعار القطعة تقل تلقائيًا مع زيادة كمية كل منتج.</p></div><label className="relative block w-full sm:max-w-[310px]"><Search size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#829187]" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="ابحث عن منتج..." className="w-full rounded-xl border border-[#dce5dc] bg-white py-3 pe-10 ps-3 text-sm outline-none focus:border-[#789681]" /></label></div>
        <div className="mb-5 flex gap-2 overflow-x-auto pb-1">{categories.map((item) => <button key={item} type="button" onClick={() => setCategory(item)} className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition ${category === item ? 'bg-[#0b3b32] text-white' : 'border border-[#dce5dc] bg-white text-[#5e7465] hover:border-[#9bb39e]'}`}>{item}</button>)}</div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">{filteredProducts.map((product) => {
          const cartLine = cart.find((line) => line.productId === product.id);
          const selectedTier = cartLine ? tierFor(cartLine.qty) : null;
          return <article key={product.id} className="flex flex-col overflow-hidden rounded-2xl border border-[#e1e8e0] bg-white shadow-[0_5px_20px_rgba(16,52,38,.035)] transition hover:-translate-y-0.5 hover:shadow-[0_10px_25px_rgba(16,52,38,.08)]">
            <div className="relative aspect-[4/3] overflow-hidden bg-[#f1eee4]"><img src={product.image} alt={product.name} loading="lazy" className="h-full w-full object-cover transition duration-500 hover:scale-[1.03]" /><button type="button" onClick={() => setPreviewProduct(product)} className="absolute bottom-3 start-3 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-2 text-[11px] font-bold text-[#123b2f] shadow-md transition hover:bg-[#0b3b32] hover:text-white"><Eye size={14} />معاينة</button></div>
            <div className="flex flex-1 flex-col p-4">
            <div className="flex items-start justify-between gap-3"><div><span className="rounded-full bg-[#eef4ec] px-2.5 py-1 text-[10px] font-semibold text-[#5f7d67]">{product.category}</span><h3 className="mt-3 text-base font-bold text-[#173b32]">{product.name}</h3></div>{cartLine && <span className="rounded-full bg-[#e1f1e3] px-2 py-1 text-[10px] font-bold text-[#348055]">في السلة · {cartLine.qty}</span>}</div>
            <p className="mt-2 min-h-10 text-xs leading-5 text-[#78877d]">{product.description}</p>
            <div className="mt-4 rounded-xl bg-[#f8faf7] p-3"><div className="mb-2 flex items-center justify-between"><span className="text-[10px] font-bold text-[#718578]">سعر القطعة حسب الكمية</span><span className="text-[10px] text-[#8b978e]">السعر الأساسي {formatPrice(product.basePrice)}</span></div><div className="grid grid-cols-5 gap-1 text-center">{ORDER_SETTINGS.tiers.map((tier) => {
              const active = selectedTier?.min === tier.min;
              return <div key={tier.min} className={`rounded-lg px-1 py-2 ${active ? 'bg-[#0b3b32] text-white' : 'bg-white text-[#617367]'}`}><span className="block text-[9px]">{tier.min === 1 ? '1–20' : tier.min === 21 ? '21–49' : `${tier.min}+`}</span><strong className="mt-1 block text-[10px]">{formatPrice(product.basePrice * (1 - tier.discount / 100))}</strong><small className="mt-0.5 block text-[8px] opacity-75">{tier.discount ? `−${tier.discount}%` : 'بدون خصم'}</small></div>;
            })}</div></div>
            <div className="mt-4 flex items-center gap-2"><label className="text-[10px] font-semibold text-[#65796b]">الكمية<input type="number" min={1} value={productQty[product.id] ?? 1} onChange={(event) => setProductQty((current) => ({ ...current, [product.id]: Math.max(1, Math.floor(Number(event.target.value) || 1)) }))} className="mt-1 block h-10 w-[78px] rounded-lg border border-[#dce5dc] bg-white text-center text-sm font-bold text-[#173b32] outline-none focus:border-[#789681]" /></label><button type="button" onClick={() => addToCart(product)} className="mt-5 flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-[#e8f0e7] text-xs font-bold text-[#174536] transition hover:bg-[#dce9dc]"><Plus size={15} />أضف للسلة</button></div>
            </div>
          </article>;
        })}</div>
        {filteredProducts.length === 0 && <div className="rounded-2xl border border-dashed border-[#d8e2d7] bg-white p-10 text-center text-sm text-[#7b8c80]">مفيش منتجات مطابقة للبحث.</div>}
      </section>

      <aside id="checkout-panel" className="hidden lg:sticky lg:top-4 lg:block"><CartContents {...panelProps} /></aside>
    </form>

    {previewProduct && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a271e]/60 p-2 sm:p-5" onClick={() => setPreviewProduct(null)}><section role="dialog" aria-modal="true" aria-label={`معاينة ${previewProduct.name}`} dir="rtl" className="max-h-[96dvh] w-full max-w-5xl overflow-y-auto rounded-2xl bg-white p-3 shadow-2xl sm:p-5" onClick={(event) => event.stopPropagation()}><div className="sticky top-0 z-10 mb-2 flex items-center justify-between rounded-xl bg-white/95 px-1 py-2 backdrop-blur"><div><h2 className="font-bold text-[#123b2f]">معاينة المنتج</h2><p className="mt-0.5 text-xs text-[#7b8b7f]">{previewProduct.name}</p></div><button type="button" onClick={() => setPreviewProduct(null)} aria-label="إغلاق المعاينة" className="grid h-10 w-10 place-items-center rounded-full bg-[#f1f5ef] text-[#426152]"><X size={18} /></button></div><LiveMockupPreview productId={previewProduct.id} productName={previewProduct.name} /></section></div>}

    <button type="button" onClick={() => setMobileCartOpen(true)} className="fixed bottom-4 end-4 z-30 flex h-14 items-center gap-2 rounded-full bg-[#0b3b32] px-5 text-sm font-bold text-white shadow-[0_8px_25px_rgba(8,45,39,.32)] lg:hidden" aria-label="افتح السلة"><ShoppingCart size={20} /><span>السلة</span><span className="grid min-h-6 min-w-6 place-items-center rounded-full bg-white px-1 text-[11px] font-extrabold text-[#0b3b32]">{quantityTotal}</span></button>
    {mobileCartOpen && <div className="fixed inset-0 z-40 flex items-end bg-[#0a271e]/45 lg:hidden" onClick={() => setMobileCartOpen(false)}><div className="w-full" onClick={(event) => event.stopPropagation()}><CartContents {...panelProps} isMobile closeMobile={() => setMobileCartOpen(false)} /></div></div>}

    {reviewOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a271e]/55 p-3 sm:p-6" onClick={() => setReviewOpen(false)}><section role="dialog" aria-modal="true" aria-labelledby="order-review-title" className="max-h-[92dvh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
      <div className="sticky top-0 flex items-center justify-between border-b border-[#edf1ec] bg-white px-5 py-4"><div><h2 id="order-review-title" className="text-lg font-bold text-[#123b2f]">مراجعة الطلب</h2><p className="mt-1 text-xs text-[#7d8c81]">راجع التفاصيل قبل التأكيد النهائي.</p></div><button type="button" onClick={() => setReviewOpen(false)} aria-label="إغلاق" className="grid h-9 w-9 place-items-center rounded-full bg-[#f2f6f1] text-[#476354]"><X size={18} /></button></div>
      <div className="space-y-5 p-5"><div className="grid gap-3 rounded-xl bg-[#f8faf7] p-4 text-xs sm:grid-cols-2"><p><strong>الاسم:</strong> {customer.fullName}</p><p dir="ltr" className="text-right"><strong>رقم الهاتف:</strong> {customer.phone}</p>{customer.alternatePhone && <p dir="ltr" className="text-right"><strong>رقم بديل:</strong> {customer.alternatePhone}</p>}<p dir="ltr" className="text-right"><strong>البريد:</strong> {customer.email}</p><p className="sm:col-span-2"><strong>طريقة الاستلام:</strong> {deliveryMethod === 'delivery' ? 'توصيل لمكانك' : 'استلام من المحل'}</p>{deliveryMethod === 'delivery' ? <p className="sm:col-span-2"><strong>العنوان:</strong> {address}</p> : <p className="sm:col-span-2"><strong>عنوان الاستلام:</strong> {ORDER_SETTINGS.storeAddress} · {ORDER_SETTINGS.storeHours}</p>}{customer.notes && <p className="sm:col-span-2"><strong>ملاحظات عامة:</strong> {customer.notes}</p>}<p className="sm:col-span-2"><strong>طلب مستعجل:</strong> {urgent ? 'نعم' : 'لا'}</p></div>
        <div className="space-y-2">{getPayload().items.map((item) => <div key={item.productId} className="rounded-xl border border-[#e6ece5] p-3"><div className="flex justify-between gap-3 text-xs"><strong>{item.name} × {item.qty}</strong><span>{formatPrice(item.lineTotal)}</span></div><p className="mt-1 text-[10px] text-[#7b8b7f]">سعر القطعة بعد الخصم: {formatPrice(item.unitPrice)}</p>{item.note && <p className="mt-1 text-[11px] text-[#627768]">تفاصيل المنتج: {item.note}</p>}</div>)}</div>
        <div className="space-y-2 rounded-xl bg-[#f8faf7] p-4 text-xs"><div className="flex justify-between"><span>الإجمالي قبل الخصم</span><span>{formatPrice(totals.subtotal)}</span></div><div className="flex justify-between text-[#3f8560]"><span>التوفير</span><span>− {formatPrice(totals.discount)}</span></div><div className="flex justify-between"><span>بعد الخصم</span><span>{formatPrice(totals.afterDiscount)}</span></div>{urgent && <div className="flex justify-between"><span>رسوم الاستعجال</span><span>{formatPrice(totals.rushFee)}</span></div>}<div className="flex justify-between border-t border-[#dfe8de] pt-3 text-sm font-bold"><span>الإجمالي النهائي</span><span>{formatPrice(totals.total)}</span></div></div>
        <div className="flex flex-col-reverse gap-2 sm:flex-row"><button type="button" onClick={() => setReviewOpen(false)} className="flex-1 rounded-xl border border-[#dce5dc] px-4 py-3 text-sm font-semibold text-[#506b59]">الرجوع للتعديل</button><button type="button" onClick={confirmOrder} className="flex-1 rounded-xl bg-[#0b3b32] px-4 py-3 text-sm font-bold text-white">تأكيد وإرسال الطلب</button></div>
      </div>
    </section></div>}

    {successOrder && <div className="fixed inset-0 z-50 grid place-items-center bg-[#0a271e]/55 p-4"><section role="dialog" aria-modal="true" className="w-full max-w-md rounded-2xl bg-white p-7 text-center shadow-2xl"><span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[#e3f2e5] text-[#358055]"><Check size={27} /></span><h2 className="mt-4 text-xl font-bold text-[#123b2f]">تم استلام طلبك بنجاح</h2><p className="mt-2 text-sm text-[#6c7e72]">رقم الطلب</p><strong dir="ltr" className="mt-1 inline-block font-mono text-xl text-[#0b3b32]">{successOrder}</strong><p className="mt-3 text-xs leading-6 text-[#849087]">احتفظ برقم الطلب لمتابعة حالته. شكرًا لاختيارك يوزرسيف.</p><button type="button" onClick={() => setSuccessOrder(null)} className="mt-5 w-full rounded-xl bg-[#0b3b32] px-4 py-3 text-sm font-bold text-white">تم</button></section></div>}
  </main>;
}
