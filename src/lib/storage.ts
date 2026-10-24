export type OrderStatus = 'pending' | 'approved' | 'production' | 'delivery' | 'completed' | 'rejected';

export type OrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  sizes?: string;
  color?: string;
  placement?: string;
  notes?: string;
};

export type Order = {
  id: string;
  createdAt: string;
  name: string;
  phone: string;
  phoneSecondary?: string;
  email?: string;
  address?: string;
  productVision?: string;
  productId: string;
  productIds?: string[];
  items?: OrderItem[];
  referenceId: string;
  productName: string;
  quantity: number;
  sizes: string;
  color: string;
  placement: string;
  notes: string;
  fileName: string;
  designHelp: boolean;
  status: OrderStatus;
  ownerNote: string;
  nextAction: string;
  history: { status: OrderStatus; date: string; note: string }[];
};

const ORDER_KEY = 'yuzersef.orders.v1';

const defaultSeedOrders: Order[] = [

  {
    id: 'YZ-2026-MUG01',
    createdAt: new Date(Date.now() - 86400000 * 1).toISOString(),
    name: 'سارة محمود',
    phone: '01098765432',
    productId: 'mug',
    referenceId: 'g5',
    productName: 'مج سيراميك مخصص',
    quantity: 2,
    sizes: '',
    color: 'أبيض سيراميك ناصع',
    placement: 'كامل المنتج (Wrap 360°)',
    notes: 'مج هدية تخرج مع كتابة الاسم وتاريخ 2026',
    fileName: 'graduation-cup-design.png',
    designHelp: false,
    status: 'pending',
    ownerNote: 'طلبك قيد مراجعة درجات حرارة الطباعة والتأكد من مطابقة أبعاد الماكيت.',
    nextAction: 'سيتواصل معك فريق الاستوديو لتأكيد بروفة الماكيت ثلاثي الأبعاد.',
    history: [
      { status: 'pending', date: new Date(Date.now() - 86400000 * 1).toISOString(), note: 'تم استلام طلب المج السيراميك' },
    ],
  },
];

export function getOrders(): Order[] {
  try {
    const raw = localStorage.getItem(ORDER_KEY);
    if (!raw) {
      localStorage.setItem(ORDER_KEY, JSON.stringify(defaultSeedOrders));
      return defaultSeedOrders;
    }
    const parsed = JSON.parse(raw) as Order[];
    if (parsed.length === 0) {
      localStorage.setItem(ORDER_KEY, JSON.stringify(defaultSeedOrders));
      return defaultSeedOrders;
    }
    return parsed;
  } catch {
    return defaultSeedOrders;
  }
}

export function saveOrder(order: Order): void {
  const orders = getOrders();
  localStorage.setItem(ORDER_KEY, JSON.stringify([order, ...orders]));
}

export function updateOrder(id: string, patch: Partial<Order>, historyNote?: string): void {
  const orders = getOrders().map((order) => {
    if (order.id !== id) return order;
    const next = { ...order, ...patch };
    if (historyNote) next.history = [{ status: next.status, date: new Date().toISOString(), note: historyNote }, ...order.history];
    return next;
  });
  localStorage.setItem(ORDER_KEY, JSON.stringify(orders));
}

export function generateOrderId(): string {
  let candidate = '';
  do {
    const suffix = Math.random().toString(36).slice(2, 7).toUpperCase();
    candidate = `YZ-${new Date().getFullYear()}-${suffix}`;
  } while (getOrders().some((order) => order.id === candidate));
  return candidate;
}

export const statusLabels: Record<OrderStatus, { ar: string; en: string }> = {
  pending: { ar: 'قيد المراجعة', en: 'Pending review' },
  approved: { ar: 'تمت الموافقة', en: 'Approved' },
  production: { ar: 'قيد الإنتاج', en: 'In production' },
  delivery: { ar: 'خرج للتوصيل', en: 'Out for delivery' },
  completed: { ar: 'مكتمل', en: 'Completed' },
  rejected: { ar: 'مرفوض', en: 'Rejected' },
};
