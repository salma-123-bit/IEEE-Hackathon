import { useMemo, useState, type FormEvent } from 'react';
import { Archive, Eye, EyeOff, ImagePlus, Pencil, Plus, RotateCcw, Save, X } from 'lucide-react';
import { categories, type Service, type ServiceCategory } from '../data/services';
import { getCatalog, saveCatalog } from '../lib/catalog';
import { getProductBasePrice } from '../data/orderProducts';

type ProductDraft = Service;
const blankProduct = (): ProductDraft => ({
  id: '', category: 'apparel', name: { ar: '', en: '' }, short: { ar: '', en: '' },
  details: { ar: '', en: '' }, image: '', icon: 'shirt', basePrice: 150, active: true, archived: false,
});
const categoryNames: Record<Exclude<ServiceCategory, 'all'>, { ar: string; en: string }> = {
  apparel: { ar: 'ملابس', en: 'Apparel' }, accessories: { ar: 'إكسسوارات وكابات', en: 'Accessories & Caps' },
  prints: { ar: 'طباعة وملصقات', en: 'Prints & Stickers' }, gifts: { ar: 'هدايا وأكواب', en: 'Gifts & Mugs' },
};

export default function ProductCatalogManager({ isEn }: { isEn: boolean }) {
  const [products, setProducts] = useState<Service[]>(getCatalog);
  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [filter, setFilter] = useState<'all' | 'published' | 'archived'>('all');
  const [feedback, setFeedback] = useState('');
  const visibleProducts = useMemo(() => products.filter((product) => filter === 'all' || (filter === 'archived' ? product.archived : !product.archived)), [products, filter]);
  const text = (ar: string, en: string) => isEn ? en : ar;
  const update = (next: Service[]) => { setProducts(next); saveCatalog(next); };
  const edit = (product: Service) => {
    setDraft({ ...product, basePrice: getProductBasePrice(product), active: product.active !== false, archived: product.archived === true });
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      document.getElementById('product-editor')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }));
  };
  const add = () => setDraft(blankProduct());
  const save = (event: FormEvent) => {
    event.preventDefault();
    if (!draft) return;
    const product = { ...draft, id: draft.id || `item-${Date.now().toString(36)}` };
    const next = draft.id ? products.map((item) => item.id === product.id ? product : item) : [product, ...products];
    update(next);
    setDraft(null);
    setFeedback(text('تم حفظ بيانات المنتج.', 'Product saved.'));
    window.setTimeout(() => setFeedback(''), 2500);
  };
  const patchDraft = (patch: Partial<ProductDraft>) => setDraft((current) => current ? { ...current, ...patch } : current);
  const patchLocale = (key: 'name' | 'short' | 'details', locale: 'ar' | 'en', value: string) => setDraft((current) => current ? { ...current, [key]: { ...current[key], [locale]: value } } : current);
  const togglePublished = (product: Service) => update(products.map((item) => item.id === product.id ? { ...item, active: item.active === false } : item));
  const toggleArchived = (product: Service) => update(products.map((item) => item.id === product.id ? { ...item, archived: !item.archived, active: item.archived ? true : false } : item));

  const inputClass = 'w-full rounded border border-[#dce4dc] bg-[#fbfcfa] p-2.5 text-xs text-[#0b3b32] outline-none focus:border-[#0b3b32]';
  return <section className="mt-6">
    <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
      <div><h2 className="text-xl font-bold text-[#0b3b32]">{text('كتالوج المنتجات', 'Product catalog')}</h2><p className="mt-1 text-xs text-[#718277]">{text('عدّل المنتجات المعروضة في المتجر، أضف منتجات جديدة، أو أخفها وأرشفها.', 'Edit store products, add new ones, publish or hide them, and archive old listings.')}</p></div>
      <button type="button" onClick={add} className="inline-flex items-center gap-2 rounded bg-[#0b3b32] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#154c41]"><Plus size={15} />{text('إضافة منتج', 'Add product')}</button>
    </div>
    {feedback && <div className="mb-4 rounded border border-[#a8dab5] bg-[#e6f4ea] p-3 text-xs font-bold text-[#1b5e20]">{feedback}</div>}
    <div className="mb-4 flex gap-2 border-b border-[#e5ebe4] pb-3">
      {(['all', 'published', 'archived'] as const).map((item) => <button key={item} type="button" onClick={() => setFilter(item)} className={`rounded px-3 py-2 text-xs font-semibold ${filter === item ? 'bg-[#0b3b32] text-white' : 'border border-[#dfe5df] bg-white text-[#55695d]'}`}>{item === 'all' ? text('كل المنتجات', 'All products') : item === 'published' ? text('النشطة والمخفية', 'Active & hidden') : text('الأرشيف', 'Archived')}</button>)}
    </div>

    {draft && <form id="product-editor" onSubmit={save} className="mb-6 scroll-mt-24 grid gap-5 rounded-lg border border-[#cddbcf] bg-white p-4 shadow-sm md:grid-cols-[minmax(0,1fr)_260px] md:p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between"><h3 className="font-bold text-[#0b3b32]">{draft.id ? text('تعديل المنتج', 'Edit product') : text('منتج جديد', 'New product')}</h3><button type="button" onClick={() => setDraft(null)} aria-label={text('إغلاق', 'Close')} className="rounded p-1 text-[#718277] hover:bg-[#f1f5f0]"><X size={18} /></button></div>
        <label className="block text-[11px] font-bold text-[#52685a]">{text('القسم', 'Category')}<select required value={draft.category} onChange={(e) => patchDraft({ category: e.target.value as ProductDraft['category'] })} className={`${inputClass} mt-1`}>{categories.filter((category) => category.id !== 'all').map((category) => <option key={category.id} value={category.id}>{category.label[isEn ? 'en' : 'ar']}</option>)}</select></label>
        <div className="grid gap-3 sm:grid-cols-2">{(['ar', 'en'] as const).map((locale) => <label key={`name-${locale}`} className="text-[11px] font-bold text-[#52685a]">{locale === 'ar' ? 'الاسم بالعربية' : 'Name in English'}<input required dir={locale === 'ar' ? 'rtl' : 'ltr'} value={draft.name[locale]} onChange={(e) => patchLocale('name', locale, e.target.value)} className={`${inputClass} mt-1`} /></label>)}</div>
        <div className="grid gap-3 sm:grid-cols-2">{(['ar', 'en'] as const).map((locale) => <label key={`short-${locale}`} className="text-[11px] font-bold text-[#52685a]">{locale === 'ar' ? 'وصف مختصر بالعربية' : 'Short description in English'}<textarea required dir={locale === 'ar' ? 'rtl' : 'ltr'} rows={2} value={draft.short[locale]} onChange={(e) => patchLocale('short', locale, e.target.value)} className={`${inputClass} mt-1 resize-y`} /></label>)}</div>
        <label className="block text-[11px] font-bold text-[#52685a]">{text('السعر الأساسي (جنيه مصري)', 'Base price (EGP)')}<input required type="number" min={100} max={200} step={1} value={draft.basePrice ?? 150} onChange={(e) => patchDraft({ basePrice: Number(e.target.value) })} className={`${inputClass} mt-1`} /><span className="mt-1 block text-[10px] font-normal text-[#839087]">{text('خصومات الكمية تُحسب تلقائياً في صفحة الطلب.', 'Quantity discounts are calculated automatically on the order page.')}</span></label>
        <div className="grid gap-3 sm:grid-cols-2">{(['ar', 'en'] as const).map((locale) => <label key={`details-${locale}`} className="text-[11px] font-bold text-[#52685a]">{locale === 'ar' ? 'التفاصيل بالعربية' : 'Details in English'}<textarea required dir={locale === 'ar' ? 'rtl' : 'ltr'} rows={3} value={draft.details[locale]} onChange={(e) => patchLocale('details', locale, e.target.value)} className={`${inputClass} mt-1 resize-y`} /></label>)}</div>
        <div className="grid gap-3 sm:grid-cols-2"><label className="text-[11px] font-bold text-[#52685a]">{text('مسار أو رابط صورة المنتج / الموكاب', 'Product mockup path or URL')}<input required dir="ltr" type="text" value={draft.image} onChange={(e) => patchDraft({ image: e.target.value })} placeholder="/assets/product.jpg or https://…" className={`${inputClass} mt-1`} /></label><label className="text-[11px] font-bold text-[#52685a]">{text('نوع الأيقونة', 'Icon type')}<select value={draft.icon} onChange={(e) => patchDraft({ icon: e.target.value })} className={`${inputClass} mt-1`}>{['shirt', 'cap', 'sparkles', 'cup', 'phone', 'tag'].map((icon) => <option key={icon}>{icon}</option>)}</select></label></div>
        <label className="flex items-center gap-2 text-xs font-semibold text-[#52685a]"><input type="checkbox" checked={draft.active !== false} onChange={(e) => patchDraft({ active: e.target.checked })} />{text('عرض المنتج في المتجر', 'Publish this product in the store')}</label>
        <div className="flex flex-wrap gap-2"><button type="submit" className="inline-flex items-center gap-2 rounded bg-[#0b3b32] px-4 py-2.5 text-xs font-bold text-white"><Save size={14} />{text('حفظ المنتج', 'Save product')}</button><button type="button" onClick={() => setDraft(null)} className="rounded border border-[#dce4dc] px-4 py-2.5 text-xs font-semibold text-[#52685a]">{text('إلغاء', 'Cancel')}</button></div>
      </div>
      <div><p className="mb-2 text-[11px] font-bold text-[#52685a]">{text('معاينة الموكاب', 'Mockup preview')}</p><div className="aspect-square overflow-hidden rounded-lg border border-[#e2e9e2] bg-[#edf2ed]">{draft.image ? <img src={draft.image} alt={draft.name[isEn ? 'en' : 'ar'] || 'Product mockup'} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.style.opacity = '0.25'; }} /> : <div className="grid h-full place-items-center text-[#83918a]"><ImagePlus size={34} /></div>}</div></div>
    </form>}

    {visibleProducts.length === 0 ? <div className="rounded-lg border border-dashed border-[#dce4dc] bg-white p-10 text-center text-xs text-[#718277]">{text('لا توجد منتجات في هذا القسم.', 'No products in this view.')}</div> : <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{visibleProducts.map((product) => <article key={product.id} className="overflow-hidden rounded-lg border border-[#e1e8e1] bg-white">
      <div className="relative aspect-[4/3] bg-[#edf2ed]"><img src={product.image} alt={product.name[isEn ? 'en' : 'ar']} className="h-full w-full object-cover" /><span className="absolute start-2 top-2 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold text-[#0b3b32]">{product.archived ? text('مؤرشف', 'Archived') : product.active === false ? text('مخفي', 'Hidden') : text('منشور', 'Published')}</span></div>
      <div className="p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="text-sm font-bold text-[#0b3b32]">{product.name[isEn ? 'en' : 'ar']}</h3><p className="mt-1 text-[10px] text-[#7b8980]">{categoryNames[product.category][isEn ? 'en' : 'ar']}</p><strong className="mt-1 block text-xs text-[#2e684c]">{getProductBasePrice(product).toLocaleString(isEn ? 'en-US' : 'ar-EG')} {isEn ? 'EGP' : 'ج.م'}</strong></div><span className="text-[10px] text-[#87948b]" dir="ltr">{product.id}</span></div><p className="mt-2 line-clamp-2 min-h-8 text-[11px] leading-5 text-[#718277]">{product.short[isEn ? 'en' : 'ar']}</p>
        <div className="mt-4 flex flex-wrap gap-2"><button type="button" onClick={() => edit(product)} className="inline-flex items-center gap-1.5 rounded border border-[#dce4dc] px-3 py-2 text-[11px] font-semibold text-[#0b3b32]"><Pencil size={13} />{text('تعديل', 'Edit')}</button>{!product.archived && <button type="button" onClick={() => togglePublished(product)} className="inline-flex items-center gap-1.5 rounded border border-[#dce4dc] px-3 py-2 text-[11px] font-semibold text-[#52685a]">{product.active === false ? <Eye size={13} /> : <EyeOff size={13} />}{product.active === false ? text('نشر', 'Publish') : text('إخفاء', 'Hide')}</button>}<button type="button" onClick={() => toggleArchived(product)} className="inline-flex items-center gap-1.5 rounded border border-[#edd5d1] px-3 py-2 text-[11px] font-semibold text-[#933f34]">{product.archived ? <RotateCcw size={13} /> : <Archive size={13} />}{product.archived ? text('استعادة', 'Restore') : text('أرشفة', 'Archive')}</button></div>
      </div>
    </article>)}</div>}
  </section>;
}
