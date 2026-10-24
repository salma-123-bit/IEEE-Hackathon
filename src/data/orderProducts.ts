import { getStoreCatalog } from '../lib/catalog';
import type { Service } from './services';

export type StoreProduct = {
  id: string;
  name: string;
  basePrice: number;
  description: string;
  category: string;
  image: string;
};

// Prices are checkout settings. Product names, categories, and mockup images always come from the admin-managed store catalog.
export const defaultBasePrices: Record<string, number> = {
  tee: 150,
  hoodie: 200,
  cap: 130,
  stickers: 100,
  mug: 120,
  case: 160,
};

export function getProductBasePrice(product: Pick<Service, 'id' | 'basePrice'>) {
  return product.basePrice ?? defaultBasePrices[product.id] ?? 150;
}

const categoryNames: Record<Service['category'], string> = {
  apparel: 'ملابس',
  accessories: 'إكسسوارات',
  prints: 'طباعة',
  gifts: 'هدايا',
};

export function getOrderProducts(): StoreProduct[] {
  return getStoreCatalog().map((product) => ({
    id: product.id,
    name: product.name.ar,
    basePrice: getProductBasePrice(product),
    description: product.short.ar,
    category: categoryNames[product.category],
    image: product.image,
  }));
}

export const ORDER_SETTINGS = {
  currency: 'ج.م',
  rushFeePercent: 20,
  urgentEstimate: 'التجهيز خلال 2–3 أيام عمل بعد تأكيد التفاصيل.',
  storeAddress: 'أسوان، مصر',
  storeHours: 'يوميًا من 10 صباحًا إلى 8 مساءً',
  tiers: [
    { min: 1, max: 20, discount: 0 },
    { min: 21, max: 49, discount: 10 },
    { min: 50, max: 99, discount: 20 },
    { min: 100, max: 199, discount: 30 },
    { min: 200, max: Infinity, discount: 40 },
  ],
};
