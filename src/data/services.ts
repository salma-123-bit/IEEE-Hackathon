export type Locale = 'ar' | 'en';
export type ServiceCategory = 'all' | 'apparel' | 'prints' | 'gifts' | 'accessories';

export type Service = {
  id: string;
  category: Exclude<ServiceCategory, 'all'>;
  name: Record<Locale, string>;
  short: Record<Locale, string>;
  image: string;
  icon: string;
  details: Record<Locale, string>;
  basePrice?: number;
  active?: boolean;
  archived?: boolean;
};

export const categories: { id: ServiceCategory; label: Record<Locale, string> }[] = [
  { id: 'all', label: { ar: 'كل المنتجات', en: 'All products' } },
  { id: 'apparel', label: { ar: 'ملابس', en: 'Apparel' } },
  { id: 'accessories', label: { ar: 'إكسسوارات وكابات', en: 'Accessories & Caps' } },
  { id: 'prints', label: { ar: 'طباعة وملصقات', en: 'Prints & Stickers' } },
  { id: 'gifts', label: { ar: 'أكواب مخصصة', en: 'Custom Mugs' } },
];

export const services: Service[] = [
  {
    id: 'tee',
    category: 'apparel',
    name: { ar: 'تيشيرتات مطبوعة', en: 'Printed T-shirts' },
    short: { ar: 'قطعة أساسية بخامة قطنية وطباعة مخصصة بطابعك.', en: 'Everyday cotton essential with custom print.' },
    image: '/assets/Tee.jpeg',
    icon: 'shirt',
    details: { ar: 'اختر اللون والمقاس ومكان الطباعة، وارسل تصميمك أو اطلب المساعدة.', en: 'Choose color, size, and print placement. Bring your design or ask us to help.' },
  },
  {
    id: 'hoodie',
    category: 'apparel',
    name: { ar: 'هوديز وسويت شيرت', en: 'Hoodies & Sweatshirts' },
    short: { ar: 'دفء وراحة خامة قطنية فاخرة مع تصميمك ورسالتك.', en: 'Premium warmth, comfort, and your custom design.' },
    image: '/assets/hodie.png',
    icon: 'shirt',
    details: { ar: 'تخصيص الألوان والمقاسات وموضع الطباعة حسب فكرتك ورؤيتك.', en: 'Customize colors, sizing, and placement to fit your idea.' },
  },
  {
    id: 'cap',
    category: 'accessories',
    name: { ar: 'كابات مطبوعة ومطرزة', en: 'Custom Caps' },
    short: { ar: 'تفصيلة أنيقة تكمل إطلالتك وتبرز شعارك بجودة عالية.', en: 'A sleek detail that highlights your logo in high quality.' },
    image: '/assets/cap.jpeg',
    icon: 'cap',
    details: { ar: 'أضف شعارك أو رسمة مميزة بطباعة وتطريز متقن مناسب للخامة.', en: 'Add your logo or graphic with refined print and embroidery suited to the fabric.' },
  },
  {
    id: 'stickers',
    category: 'prints',
    name: { ar: 'ستيكرز وملصقات', en: 'Stickers & Labels' },
    short: { ar: 'للتغليف واللابتوب والمشاريع واللمسات الشخصية المقاومة للماء.', en: 'For packaging, laptops, businesses, and waterproof personal touches.' },
    image: '/assets/Stickers.jpeg',
    icon: 'sparkles',
    details: { ar: 'حدّد المقاس والكمية والشكل، مع خامات عالية الجودة وقص دقيق ومقاوم للخدش.', en: 'Choose size, quantity, and shape, printed with precision die-cut and scratch resistance.' },
  },
  {
    id: 'mug',
    category: 'gifts',
    name: { ar: 'أكواب سيراميك مخصصة', en: 'Custom Mugs' },
    short: { ar: 'مج سيراميك فاخر بطباعة حرارية تدوم مع معاينة ثلاثية الأبعاد.', en: 'Premium ceramic mug with vivid, durable print and 3D preview.' },
    image: '/assets/mug.jpeg',
    icon: 'cup',
    details: { ar: 'أرسل صورة أو عبارة أو شعارًا ليظهر على كوبك بثبات ألوان فائق وآمن للغسيل.', en: 'Send a photo, message, or logo with dishwasher-safe, vibrant colors.' },
  },
  {
    id: 'case',
    category: 'accessories',
    name: { ar: 'كفرات وأغطية هواتف', en: 'Custom Phone Cases' },
    short: { ar: 'حماية متينة وتصميم يرافقك كل يوم لمختلف موديلات الهواتف.', en: 'Durable protection and personalized design that goes everywhere with you.' },
    image: '/assets/Case.jpeg',
    icon: 'phone',
    details: { ar: 'اختر تصميمك واكتب نوع هاتفك للحصول على كفر أنيق ومقاوم للصدمات.', en: 'Pick your design and include your phone model for shock-resistant sleek protection.' },
  },
];

export const galleryItems = [
  { id: 'g1', title: { ar: 'تيشيرت يوزرسيف باللون الأخضر الملكي', en: 'Yuzersef Royal Green T-Shirt' }, category: 'apparel' as const, image: '/assets/Tee.jpeg', label: { ar: 'تيشيرتات', en: 'T-Shirts' } },
  { id: 'g2', title: { ar: 'هودي يوزرسيف القطني الدافئ', en: 'Yuzersef Warm Cotton Hoodie' }, category: 'apparel' as const, image: '/assets/hodie.png', label: { ar: 'هوديز', en: 'Hoodies' } },
  { id: 'g3', title: { ar: 'كاب يوزرسيف المطرز بالهوية', en: 'Yuzersef Embroidered Cap' }, category: 'accessories' as const, image: '/assets/cap.jpeg', label: { ar: 'كابات', en: 'Caps' } },
  { id: 'g4', title: { ar: 'تشكيلة ستيكرز وملصقات تغليف مميزة', en: 'Die-cut Stickers & Packaging Labels' }, category: 'prints' as const, image: '/assets/Stickers.jpeg', label: { ar: 'ستيكرز', en: 'Stickers' } },
  { id: 'g5', title: { ar: 'أكواب سيراميك بهوية يوزرسيف', en: 'Yuzersef Signature Ceramic Mugs' }, category: 'gifts' as const, image: '/assets/mug.jpeg', label: { ar: 'أكواب', en: 'Mugs' } },
  { id: 'g6', title: { ar: 'كفرات هواتف بألوان وأشكال متنوعة', en: 'Custom Protective Phone Cases' }, category: 'accessories' as const, image: '/assets/Case.jpeg', label: { ar: 'كفرات هواتف', en: 'Phone Cases' } },
];
