import React, { useMemo, useState, useEffect } from 'react';
import { 
  ArrowLeft, 
  ArrowUpLeft, 
  Check, 
  CheckCircle2,
  ChevronLeft, 
  Copy,
  Eye, 
  FileUp, 
  Layers,
  PackageCheck, 
  Plus, 
  Minus,
  Sparkles, 
  Rotate3d,
  CheckSquare,
  Square,
  Sliders,
  X,
  AlertCircle
} from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { galleryItems, services, type Service } from '../data/services';
import { useCart } from '../lib/cart';
import { useLanguage } from '../lib/language';
import { generateOrderId, saveOrder, type Order, type OrderItem } from '../lib/storage';
import BrandedProductImage, { productPrintKindFor } from '../components/BrandedProductImage';
import SizeBreakdownPicker, { clothingSizes } from '../components/SizeBreakdownPicker';
import LiveMockupPreview from '../components/LiveMockupPreview';
import ReadinessAssistant, { type ReadinessItem } from '../components/ReadinessAssistant';
import RgbColorPicker, { normalizeColorToRgb } from '../components/RgbColorPicker';

export type ProductConfig = {
  productId: string;
  quantity: number;
  sizes: string;
  sizeCounts: Record<string, number>;
  color: string;
  placement: string;
};

type Draft = { 
  selectedProductIds: string[];
  activeProductId: string;
  productConfigs: Record<string, ProductConfig>;
  referenceId: string; 
  name: string; 
  phone: string; 
  phoneSecondary: string;
  email: string;
  address: string;
  productVision: string;
  notes: string; 
  fileName: string; 
  designHelp: boolean;
  artworkDataUrl?: string;
  isMultiSelectMode: boolean;
};

const stepTitles = { 
  ar: ['اختيار المنتج', 'تفاصيل التخصيص', 'التصميم والمرجع', 'المعاينة والمراجعة'], 
  en: ['Choose product(s)', 'Customization details', 'Artwork & reference', 'Preview & review'] 
};

export const hasClothingSizes = (productId: string) => productId === 'tee' || productId === 'hoodie';

export const getDefaultPlacement = (productId: string, isEn: boolean): string => {
  if (productId === 'mug') return isEn ? 'Wrap 360°' : 'كامل المنتج (Wrap 360°)';
  if (productId === 'cap') return isEn ? 'Front Center' : 'الجهة الأمامية (وسط)';
  if (productId === 'stickers') return isEn ? 'Die-Cut Individual' : 'قص دقيق منفصل (Die-Cut)';
  if (productId === 'case') return isEn ? 'Full Back Print' : 'الجهة الخلفية كاملة';
  return isEn ? 'Front Chest' : 'الصدر (الجهة الأمامية)';
};

export const getPlacementOptions = (productId: string, isEn: boolean) => {
  if (productId === 'mug') {
    return [
      { value: isEn ? 'Wrap 360°' : 'كامل المنتج (Wrap 360°)', label: isEn ? 'Wrap 360°' : 'كامل المنتج (Wrap 360°)' },
      { value: isEn ? 'One Side' : 'جهة واحدة', label: isEn ? 'One Side' : 'جهة واحدة' },
      { value: isEn ? 'Two Sides' : 'الجهتان معاً', label: isEn ? 'Two Sides' : 'الجهتان معاً' },
      { value: isEn ? 'Consult with Studio' : 'استشارة فريق الاستوديو', label: isEn ? 'Consult with Studio' : 'استشارة فريق الاستوديو' },
    ];
  }
  if (productId === 'cap') {
    return [
      { value: isEn ? 'Front Center' : 'الجهة الأمامية (وسط)', label: isEn ? 'Front Center' : 'الجهة الأمامية (وسط)' },
      { value: isEn ? 'Front & Side' : 'الأمام مع الجانب', label: isEn ? 'Front & Side' : 'الأمام مع الجانب' },
      { value: isEn ? 'Side / Temple' : 'الجانب فقط', label: isEn ? 'Side / Temple' : 'الجانب فقط' },
      { value: isEn ? 'Back Arch' : 'الجهة الخلفية', label: isEn ? 'Back Arch' : 'الجهة الخلفية' },
      { value: isEn ? 'Consult with Studio' : 'استشارة فريق الاستوديو', label: isEn ? 'Consult with Studio' : 'استشارة فريق الاستوديو' },
    ];
  }
  if (productId === 'stickers') {
    return [
      { value: isEn ? 'Die-Cut Individual' : 'قص دقيق منفصل (Die-Cut)', label: isEn ? 'Die-Cut Individual' : 'قص دقيق منفصل (Die-Cut)' },
      { value: isEn ? 'Kiss-Cut Sheet' : 'شيت ملصقات (Kiss-Cut Sheet)', label: isEn ? 'Kiss-Cut Sheet' : 'شيت ملصقات (Kiss-Cut Sheet)' },
      { value: isEn ? 'Waterproof Glossy' : 'مقاوم للماء بلمعة (Glossy)', label: isEn ? 'Waterproof Glossy' : 'مقاوم للماء بلمعة (Glossy)' },
      { value: isEn ? 'Waterproof Matte' : 'مقاوم للماء مطفي (Matte)', label: isEn ? 'Waterproof Matte' : 'مقاوم للماء مطفي (Matte)' },
      { value: isEn ? 'Consult with Studio' : 'استشارة فريق الاستوديو', label: isEn ? 'Consult with Studio' : 'استشارة فريق الاستوديو' },
    ];
  }
  if (productId === 'case') {
    return [
      { value: isEn ? 'Full Back Print' : 'الجهة الخلفية كاملة', label: isEn ? 'Full Back Print' : 'الجهة الخلفية كاملة' },
      { value: isEn ? 'Centered Logo' : 'شعار في المنتصف', label: isEn ? 'Centered Logo' : 'شعار في المنتصف' },
      { value: isEn ? 'Pattern / Collage' : 'نقش متكرر (Pattern)', label: isEn ? 'Pattern / Collage' : 'نقش متكرر (Pattern)' },
      { value: isEn ? 'Consult with Studio' : 'استشارة فريق الاستوديو', label: isEn ? 'Consult with Studio' : 'استشارة فريق الاستوديو' },
    ];
  }
  return [
    { value: isEn ? 'Front Chest' : 'الصدر (الجهة الأمامية)', label: isEn ? 'Front Chest' : 'الصدر (الجهة الأمامية)' },
    { value: isEn ? 'Back Print' : 'الظهر (الجهة الخلفية)', label: isEn ? 'Back Print' : 'الظهر (الجهة الخلفية)' },
    { value: isEn ? 'Front & Back' : 'الصدر والظهر معًا', label: isEn ? 'Front & Back' : 'الصدر والظهر معًا' },
    { value: isEn ? 'Sleeve / Side' : 'الكم / الجانب', label: isEn ? 'Sleeve / Side' : 'الكم / الجانب' },
    { value: isEn ? 'Wrap 360°' : 'كامل المنتج (Wrap 360°)', label: isEn ? 'Wrap 360°' : 'كامل المنتج (Wrap 360°)' },
    { value: isEn ? 'Consult with Studio' : 'استشارة فريق الاستوديو', label: isEn ? 'Consult with Studio' : 'استشارة فريق الاستوديو' },
  ];
};

const COLOR_PRESETS = [
  { hex: '#0b3b32', nameAr: 'أخضر يوزرسيف الملكي', nameEn: 'Yuzersef Forest Green' },
  { hex: '#ffffff', nameAr: 'أبيض ناصع', nameEn: 'Pure White' },
  { hex: '#18181b', nameAr: 'أسود ملكي', nameEn: 'Royal Black' },
  { hex: '#e5e7eb', nameAr: 'رمادي ميلانج', nameEn: 'Heather Grey' },
  { hex: '#e8dec8', nameAr: 'بيج رمال أسوان', nameEn: 'Aswan Sand (Beige)' },
];

export const createDefaultConfig = (productId: string, isEn: boolean, defaultColor = 'rgb(11, 59, 50)'): ProductConfig => ({
  productId,
  quantity: hasClothingSizes(productId) ? 0 : 1,
  sizes: '',
  sizeCounts: {},
  color: defaultColor,
  placement: getDefaultPlacement(productId, isEn),
});

export default function Request() {
  const { isEn } = useLanguage();
  const { items, add, remove, setAll, clear } = useCart();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [step, setStep] = useState(0);
  const [showLivePreviewModal, setShowLivePreviewModal] = useState(false);
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const [uploadedFileObj, setUploadedFileObj] = useState<File | null>(null);

  // Initialize draft from navigation state or query parameters
  const initialProductId = location.state?.serviceId || searchParams.get('product') || items[0] || 'tee';
  const initialReferenceId = location.state?.referenceId || searchParams.get('ref') || '';

  const [draft, setDraft] = useState<Draft>(() => {
    // Multi-select is OFF by default: always start with a single product
    const preselectedIds = [initialProductId];
    
    const configs: Record<string, ProductConfig> = {};
    services.forEach((s) => {
      configs[s.id] = createDefaultConfig(s.id, isEn);
    });

    return {
      selectedProductIds: preselectedIds,
      activeProductId: initialProductId,
      productConfigs: configs,
      referenceId: initialReferenceId,
      name: '',
      phone: '',
      phoneSecondary: '',
      email: '',
      address: '',
      productVision: '',
      notes: '',
      fileName: '',
      designHelp: false,
      artworkDataUrl: '',
      isMultiSelectMode: false,
    };
  });

  const [notice, setNotice] = useState('');
  const [copySuccessNotice, setCopySuccessNotice] = useState('');
  const [submitted, setSubmitted] = useState<Order | null>(null);

  const activeProductId = draft.activeProductId || draft.selectedProductIds[0] || 'tee';
  const selectedService = services.find((service) => service.id === activeProductId);
  const reference = galleryItems.find((item) => item.id === draft.referenceId);
  const labels = stepTitles[isEn ? 'en' : 'ar'];

  // Handle external prefill from state/params if they change
  useEffect(() => {
    if (location.state?.referenceId) {
      const targetServiceId = location.state.serviceId || activeProductId;
      setDraft((curr) => {
        const nextIds = curr.selectedProductIds.includes(targetServiceId)
          ? curr.selectedProductIds
          : [...curr.selectedProductIds, targetServiceId];
        return {
          ...curr,
          referenceId: location.state.referenceId,
          activeProductId: targetServiceId,
          selectedProductIds: nextIds,
        };
      });
    }
  }, [location.state]);

  // Sync cart items with selected products
  useEffect(() => {
    if (draft.selectedProductIds.length > 0) {
      setAll(draft.selectedProductIds);
    }
  }, [draft.selectedProductIds, setAll]);

  // Total quantity across all selected products
  const totalQuantity = useMemo(() => {
    return draft.selectedProductIds.reduce((sum, pid) => {
      const cfg = draft.productConfigs[pid];
      return sum + (cfg?.quantity || 0);
    }, 0);
  }, [draft.selectedProductIds, draft.productConfigs]);

  // Check if every selected product is fully configured
  const areAllProductsConfigured = useMemo(() => {
    if (draft.selectedProductIds.length === 0) return false;
    return draft.selectedProductIds.every((pid) => {
      const cfg = draft.productConfigs[pid];
      if (!cfg) return false;
      if (hasClothingSizes(pid)) {
        return Boolean(cfg.sizes && cfg.quantity > 0);
      }
      return cfg.quantity > 0;
    });
  }, [draft.selectedProductIds, draft.productConfigs]);

  // First unconfigured product if any
  const firstUnconfiguredProductId = useMemo(() => {
    return draft.selectedProductIds.find((pid) => {
      const cfg = draft.productConfigs[pid];
      if (!cfg) return true;
      if (hasClothingSizes(pid)) {
        return !Boolean(cfg.sizes && cfg.quantity > 0);
      }
      return !Boolean(cfg.quantity > 0);
    });
  }, [draft.selectedProductIds, draft.productConfigs]);

  // Dynamic Readiness Evaluation
  const readinessItems: ReadinessItem[] = useMemo(() => {
    const selectedCount = draft.selectedProductIds.length;
    const isSingle = selectedCount <= 1;

    let qtySizesReady = areAllProductsConfigured;
    let qtySizesHintAr = 'حدد مقاسًا واحدًا على الأقل بالعدد المطلوب';
    let qtySizesHintEn = 'Select at least one clothing size breakdown';

    if (selectedCount > 1) {
      if (areAllProductsConfigured) {
        qtySizesHintAr = `تم ضبط كميات ومقاسات كافة المنتجات المحددة (${totalQuantity} قطعة)`;
        qtySizesHintEn = `All ${selectedCount} products configured (${totalQuantity} total items)`;
      } else {
        const unready = services.find((s) => s.id === firstUnconfiguredProductId);
        const name = unready?.name[isEn ? 'en' : 'ar'] || '';
        qtySizesHintAr = `يرجى ضبط المقاسات أو الكمية لـ: ${name}`;
        qtySizesHintEn = `Please specify sizes/quantities for: ${name}`;
      }
    } else if (draft.selectedProductIds[0]) {
      const pid = draft.selectedProductIds[0];
      const cfg = draft.productConfigs[pid];
      if (!hasClothingSizes(pid)) {
        qtySizesReady = Boolean(cfg && cfg.quantity > 0);
        qtySizesHintAr = 'حدد كمية لا تقل عن قطعة واحدة';
        qtySizesHintEn = 'Set a quantity of at least 1';
      }
    }

    const allHavePlacement = draft.selectedProductIds.every((pid) => {
      return Boolean(draft.productConfigs[pid]?.placement);
    });

    const selectedNames = draft.selectedProductIds
      .map((pid) => services.find((s) => s.id === pid)?.name[isEn ? 'en' : 'ar'] || pid)
      .join('، ');

    return [
      {
        id: 'product',
        step: 0,
        labelAr: selectedCount > 1 ? `اختيار المنتجات (${selectedCount} منتجات)` : 'اختيار المنتج المطلوب',
        labelEn: selectedCount > 1 ? `Selected products (${selectedCount} items)` : 'Select target product',
        isReady: selectedCount > 0,
        hintAr: selectedCount > 1 ? `المنتجات المحددة: ${selectedNames}` : 'يرجى اختيار منتج أو عدة منتجات من القائمة',
        hintEn: selectedCount > 1 ? `Selected: ${selectedNames}` : 'Please select a product from the list',
      },
      {
        id: 'contact',
        step: 0,
        labelAr: 'بيانات التواصل والعنوان والبريد (*)',
        labelEn: 'Contact, Address & Email (*)',
        isReady: Boolean(
          draft.name.trim() && 
          draft.phone.trim().length >= 8 && 
          draft.email.trim() && 
          draft.email.includes('@') && 
          draft.address.trim()
        ),
        hintAr: 'يرجى إكمال الاسم، الهاتف، البريد الإلكتروني (*) والعنوان',
        hintEn: 'Enter name, phone, valid email (*), and address',
      },
      {
        id: 'quantity_sizes',
        step: 1,
        labelAr: selectedCount > 1 ? 'توزيع المقاسات والكميات للمنتجات' : (hasClothingSizes(activeProductId) ? 'توزيع المقاسات والكمية' : 'تحديد الكمية المطلوبة'),
        labelEn: selectedCount > 1 ? 'Size breakdown & quantities' : (hasClothingSizes(activeProductId) ? 'Size breakdown & quantity' : 'Desired quantity'),
        isReady: qtySizesReady,
        hintAr: qtySizesHintAr,
        hintEn: qtySizesHintEn,
      },
      {
        id: 'placement',
        step: 1,
        labelAr: 'تحديد موضع الطباعة',
        labelEn: 'Print placement position',
        isReady: allHavePlacement,
        hintAr: 'اختر مكان الطباعة (أمام، خلف، كامل المنتج)',
        hintEn: 'Select where on the product the print should be placed',
      },
      {
        id: 'artwork',
        step: 2,
        labelAr: 'ملف التصميم أو المرجع أو طلب مساعدة',
        labelEn: 'Artwork, reference, or design help',
        isReady: Boolean(draft.fileName || draft.designHelp || draft.referenceId),
        hintAr: 'ارفع ملف التصميم أو اختر مرجعًا أو اطلب مساعدة المصمم',
        hintEn: 'Upload design file, pick gallery reference, or request design help',
      },
    ];
  }, [draft, areAllProductsConfigured, totalQuantity, firstUnconfiguredProductId, activeProductId, isEn]);

  const set = (patch: Partial<Draft>) => setDraft((current) => ({ ...current, ...patch }));

  // Modify clothing size count for a specific product
  const changeSizeCountForProduct = (productId: string, size: string, delta: number) => {
    setDraft((curr) => {
      const prevConfig = curr.productConfigs[productId] || createDefaultConfig(productId, isEn);
      const prevCounts = prevConfig.sizeCounts || {};
      const updatedCounts = { ...prevCounts, [size]: Math.max(0, (prevCounts[size] || 0) + delta) };
      const quantity = clothingSizes.reduce((total, option) => total + (updatedCounts[option] || 0), 0);
      const sizes = clothingSizes
        .filter((option) => updatedCounts[option] > 0)
        .map((option) => `${option} × ${updatedCounts[option]}`)
        .join(', ');

      return {
        ...curr,
        productConfigs: {
          ...curr.productConfigs,
          [productId]: {
            ...prevConfig,
            quantity,
            sizes,
            sizeCounts: updatedCounts,
          },
        },
      };
    });
  };

  // Update a single product's configuration
  const updateProductConfig = (productId: string, patch: Partial<ProductConfig>) => {
    setDraft((curr) => {
      const prevConfig = curr.productConfigs[productId] || createDefaultConfig(productId, isEn);
      return {
        ...curr,
        productConfigs: {
          ...curr.productConfigs,
          [productId]: {
            ...prevConfig,
            ...patch,
          },
        },
      };
    });
  };

  // Toggle multi-select mode
  const toggleMultiSelectMode = () => {
    setDraft((curr) => {
      const nextMode = !curr.isMultiSelectMode;
      if (!nextMode && curr.selectedProductIds.length > 1) {
        // Resetting back to single selection: keep current active product
        return {
          ...curr,
          isMultiSelectMode: false,
          selectedProductIds: [curr.activeProductId],
        };
      }
      return {
        ...curr,
        isMultiSelectMode: nextMode,
      };
    });
  };

  // Toggle product selection in multi-select mode
  const toggleProductSelection = (productId: string) => {
    setDraft((curr) => {
      const isAlreadySelected = curr.selectedProductIds.includes(productId);
      if (isAlreadySelected) {
        if (curr.selectedProductIds.length === 1) {
          triggerValidationAlert(
            isEn ? 'You must keep at least one product in your order.' : 'يجب الإبقاء على منتج واحد على الأقل في الطلب.'
          );
          return curr;
        }
        const remaining = curr.selectedProductIds.filter((id) => id !== productId);
        return {
          ...curr,
          selectedProductIds: remaining,
          activeProductId: curr.activeProductId === productId ? remaining[0] : curr.activeProductId,
        };
      } else {
        const updated = [...curr.selectedProductIds, productId];
        return {
          ...curr,
          selectedProductIds: updated,
          activeProductId: productId,
          isMultiSelectMode: true,
        };
      }
    });
  };

  // Select a single product (used in single mode or when explicitly choosing one)
  const selectSingleProduct = (productId: string) => {
    setDraft((curr) => ({
      ...curr,
      selectedProductIds: [productId],
      activeProductId: productId,
    }));
  };

  // Select all products helper
  const selectAllProducts = () => {
    const allIds = services.map((s) => s.id);
    setDraft((curr) => ({
      ...curr,
      selectedProductIds: allIds,
      isMultiSelectMode: true,
    }));
  };

  // Apply color and placement to all selected products
  const applyColorAndPlacementToAll = (sourceProductId: string) => {
    const sourceConfig = draft.productConfigs[sourceProductId];
    if (!sourceConfig) return;

    setDraft((curr) => {
      const updatedConfigs = { ...curr.productConfigs };
      curr.selectedProductIds.forEach((pid) => {
        if (updatedConfigs[pid]) {
          updatedConfigs[pid] = {
            ...updatedConfigs[pid],
            color: sourceConfig.color,
            placement: sourceConfig.placement,
          };
        }
      });
      return {
        ...curr,
        productConfigs: updatedConfigs,
      };
    });

    setCopySuccessNotice(
      isEn 
        ? 'Applied color & placement across all selected products! ✓' 
        : 'تم تطبيق درجة اللون وموضع الطباعة على كافة المنتجات المختارة بنجاح! ✓'
    );
    setTimeout(() => setCopySuccessNotice(''), 3500);
  };

  const handleFileSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileObj(file);
      set({ fileName: file.name });
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (ev) => {
          set({ artworkDataUrl: ev.target?.result as string });
        };
        reader.readAsDataURL(file);
      }
    }
  };

  const triggerValidationAlert = (msg: string, targetStep?: number) => {
    setNotice(msg);
    setShakeTrigger(true);
    setTimeout(() => setShakeTrigger(false), 500);
    if (typeof targetStep === 'number') {
      setStep(targetStep);
    }
  };

  const validateStep = (currentStep: number) => {
    setNotice('');
    if (currentStep === 0) {
      if (draft.selectedProductIds.length === 0) {
        triggerValidationAlert(isEn ? 'Please choose at least one product.' : 'يرجى اختيار منتج واحد على الأقل للمتابعة.');
        return false;
      }
      if (!draft.name.trim()) {
        triggerValidationAlert(isEn ? 'Please enter your name.' : 'يرجى كتابة الاسم للمتابعة.');
        return false;
      }
      if (!draft.phone.trim() || draft.phone.trim().length < 8) {
        triggerValidationAlert(isEn ? 'Please enter a valid phone number.' : 'يرجى كتابة رقم الهاتف للمتابعة.');
        return false;
      }
      if (!draft.email.trim() || !draft.email.includes('@')) {
        triggerValidationAlert(isEn ? 'Please enter a valid email address (*).' : 'يرجى إدخال بريد إلكتروني صحيح (*).');
        return false;
      }
      if (!draft.address.trim()) {
        triggerValidationAlert(isEn ? 'Please enter your delivery address.' : 'يرجى كتابة العنوان بالتفصيل للشحن والتوصيل.');
        return false;
      }
    } else if (currentStep === 1) {
      // Validate all selected products
      for (const pid of draft.selectedProductIds) {
        const cfg = draft.productConfigs[pid];
        const s = services.find((item) => item.id === pid);
        const pName = s?.name[isEn ? 'en' : 'ar'] || pid;

        if (hasClothingSizes(pid)) {
          if (!cfg || !cfg.sizes.trim() || cfg.quantity < 1) {
            setDraft((curr) => ({ ...curr, activeProductId: pid }));
            triggerValidationAlert(
              isEn ? `Please choose sizes for: ${pName}` : `يرجى تحديد المقاسات والكمية المطلوبة لمنتج: ${pName}`
            );
            return false;
          }
        } else {
          if (!cfg || !cfg.quantity || cfg.quantity < 1) {
            setDraft((curr) => ({ ...curr, activeProductId: pid }));
            triggerValidationAlert(
              isEn ? `Please enter quantity for: ${pName}` : `حدد كمية لا تقل عن قطعة واحدة لمنتج: ${pName}`
            );
            return false;
          }
        }

        if (!cfg || !cfg.placement) {
          setDraft((curr) => ({ ...curr, activeProductId: pid }));
          triggerValidationAlert(
            isEn ? `Please choose print placement for: ${pName}` : `يرجى تحديد موضع الطباعة لمنتج: ${pName}`
          );
          return false;
        }
      }
    } else if (currentStep === 2) {
      if (!draft.fileName && !draft.designHelp && !draft.referenceId) {
        triggerValidationAlert(
          isEn 
            ? 'Please attach artwork, choose a gallery reference, or request design help.' 
            : 'يرجى رفع تصميم، أو اختيار مرجع من المعرض، أو طلب مساعدة في التصميم.'
        );
        return false;
      }
    }
    return true;
  };

  const next = () => {
    if (validateStep(step)) {
      setStep((current) => Math.min(3, current + 1));
    }
  };

  const createRequest = () => {
    // Check all readiness items
    const unready = readinessItems.find((item) => !item.isReady);
    if (unready) {
      triggerValidationAlert(
        isEn ? `Please complete: ${unready.labelEn}` : `يرجى استكمال: ${unready.labelAr}`,
        unready.step
      );
      return;
    }

    const id = generateOrderId();
    const now = new Date().toISOString();

    const orderItems: OrderItem[] = draft.selectedProductIds.map((pid) => {
      const s = services.find((item) => item.id === pid);
      const cfg = draft.productConfigs[pid] || createDefaultConfig(pid, isEn);
      return {
        productId: pid,
        productName: s?.name[isEn ? 'en' : 'ar'] || pid,
        quantity: cfg.quantity,
        sizes: cfg.sizes,
        color: cfg.color,
        placement: cfg.placement,
      };
    });

    const isMulti = draft.selectedProductIds.length > 1;
    const combinedProductName = isMulti
      ? draft.selectedProductIds
          .map((pid) => services.find((s) => s.id === pid)?.name[isEn ? 'en' : 'ar'] || pid)
          .join(' + ') + ` (${draft.selectedProductIds.length} ${isEn ? 'products' : 'منتجات'})`
      : services.find((s) => s.id === draft.selectedProductIds[0])?.name[isEn ? 'en' : 'ar'] || '';

    const combinedSizes = orderItems
      .map((item) => item.sizes ? `${item.productName}: ${item.sizes}` : `${item.productName}: ${item.quantity} ${isEn ? 'pcs' : 'قطعة'}`)
      .join(' | ');

    const combinedColors = Array.from(new Set(orderItems.map((item) => item.color).filter(Boolean))).join(', ');
    const combinedPlacements = Array.from(new Set(orderItems.map((item) => item.placement).filter(Boolean))).join(' | ');

    const order: Order = {
      id,
      createdAt: now,
      name: draft.name.trim(),
      phone: draft.phone.trim(),
      phoneSecondary: draft.phoneSecondary.trim() || undefined,
      email: draft.email.trim(),
      address: draft.address.trim(),
      productVision: draft.productVision.trim() || undefined,
      productId: draft.selectedProductIds[0] || 'tee',
      productIds: draft.selectedProductIds,
      items: orderItems,
      referenceId: draft.referenceId,
      productName: combinedProductName,
      quantity: totalQuantity,
      sizes: combinedSizes,
      color: combinedColors,
      placement: combinedPlacements,
      notes: draft.notes,
      fileName: draft.fileName,
      designHelp: draft.designHelp,
      status: 'pending',
      ownerNote: isEn 
        ? `Your request (${draft.selectedProductIds.length} items) has been received and added to our review queue in Aswan.` 
        : `وصلنا طلبك بنجاح لعدد ${draft.selectedProductIds.length} منتجات، وهو الآن في قائمة مراجعة استوديو يوزرسيف بأسوان.`,
      nextAction: isEn 
        ? 'The team will inspect artwork specifications for all items and confirm production.' 
        : 'سيتواصل معك فريق الاستوديو لتأكيد بروفة التصميم وبدء التنفيذ لكافة القطع.',
      history: [
        { 
          status: 'pending', 
          date: now, 
          note: isEn 
            ? `Request created via online wizard for ${draft.selectedProductIds.length} products (${totalQuantity} total pieces)` 
            : `تم إنشاء الطلب عبر المعالج الإلكتروني لعدد ${draft.selectedProductIds.length} منتجات بإجمالي ${totalQuantity} قطعة` 
        }
      ],
    };

    saveOrder(order);
    clear();
    setSubmitted(order);
  };

  // Active product config
  const activeConfig = draft.productConfigs[activeProductId] || createDefaultConfig(activeProductId, isEn);
  const activeHasClothingSizes = hasClothingSizes(activeProductId);

  // Submission Confirmation View
  if (submitted) {
    return (
      <div className="min-h-[65vh] pb-20">
        <section className="py-20 text-center max-w-[760px] mx-auto px-4">
          <span className="w-16 h-16 rounded-full bg-[#dcecdc] text-[#0b3b32] grid place-items-center mx-auto mb-6 shadow-xs">
            <PackageCheck size={36} />
          </span>
          <div className="flex items-center justify-center gap-2 text-[10px] font-bold tracking-widest text-[#5c756a] uppercase">
            <span className="w-5 h-[1px] bg-[#99aa8d]" />
            {isEn ? 'REQUEST RECEIVED & READY' : 'تم استلام وتوثيق طلبك'}
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-[#0b3b32] my-4 leading-tight">
            {isEn ? 'Your custom collection is in motion.' : 'فكرتك بدأت تتحول لواقع.'}
          </h1>
          <p className="text-sm text-[#6f7e74] leading-relaxed max-w-lg mx-auto">
            {isEn 
              ? 'Your specifications and live mockup have been recorded. Keep your unique tracking code below.' 
              : 'تم حفظ كافة المواصفات والمنتجات بنجاح. احتفظ برقم التتبع لمتابعة مراحل الإنتاج والتسليم.'}
          </p>

          <div className="max-w-md mx-auto my-7 p-6 border border-[#dce4dc] bg-white rounded-lg shadow-xs flex flex-col items-center gap-2">
            <span className="text-[10px] uppercase font-bold tracking-wider text-[#8a978d]">
              {isEn ? 'YOUR TRACKING NUMBER' : 'رقم تتبع طلبك الفريد'}
            </span>
            <strong dir="ltr" className="font-mono text-2xl font-bold text-[#0b3b32] tracking-wider select-all">
              {submitted.id}
            </strong>
            <button
              onClick={() => navigator.clipboard?.writeText(submitted.id)}
              className="text-xs text-[#4c735a] font-semibold underline hover:text-[#0b3b32] mt-1 cursor-pointer"
            >
              {isEn ? 'Copy tracking code' : 'نسخ رقم التتبع'}
            </button>
          </div>

          {/* Itemized Order Receipt */}
          {submitted.items && submitted.items.length > 0 && (
            <div className="max-w-xl mx-auto mb-8 bg-white border border-[#dce4dc] rounded-lg p-5 text-start shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-[#edf0ec] mb-3">
                <span className="text-xs font-bold text-[#0b3b32]">
                  {isEn ? `Included Products (${submitted.items.length}):` : `المنتجات المتضمنة في هذا الطلب (${submitted.items.length}):`}
                </span>
                <span className="text-xs font-bold text-[#0b3b32] bg-[#eef5ee] px-2.5 py-0.5 rounded-full">
                  {submitted.quantity} {isEn ? 'Total Pieces' : 'إجمالي القطع'}
                </span>
              </div>
              <div className="divide-y divide-[#edf0ec]">
                {submitted.items.map((item, idx) => {
                  const s = services.find((x) => x.id === item.productId);
                  return (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-10 h-10 rounded overflow-hidden bg-[#e4ede4] shrink-0">
                          {s && (
                            <BrandedProductImage
                              src={s.image}
                              alt=""
                              kind={productPrintKindFor(s.id)}
                              showBrand={false}
                            />
                          )}
                        </div>
                        <div>
                          <strong className="text-[#0b3b32] block font-semibold">{item.productName}</strong>
                          <span className="text-[11px] text-[#718277]">
                            {item.placement} {item.color ? `· ${item.color}` : ''}
                          </span>
                        </div>
                      </div>
                      <div className="text-end">
                        <strong className="text-[#0b3b32] block font-bold">
                          {item.quantity} {isEn ? 'pcs' : 'قطعة'}
                        </strong>
                        {item.sizes && (
                          <span className="text-[10px] text-[#527461]">{item.sizes}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex justify-center items-center gap-4 flex-wrap">
            <button
              className="min-h-[42px] px-6 bg-[#0b3b32] text-white hover:bg-[#154c41] rounded font-semibold text-xs transition-all flex items-center gap-2 shadow-xs cursor-pointer"
              onClick={() => navigate('/track', { state: { trackingId: submitted.id } })}
            >
              {isEn ? 'Track this request live' : 'تابع حالة الطلب الآن'}
              <ArrowUpLeft size={16} />
            </button>
            <Link
              className="text-xs font-bold text-[#0b3b32] hover:underline flex items-center gap-1.5"
              to="/"
            >
              {isEn ? 'Back to homepage' : 'العودة للرئيسية'}
              <ArrowUpLeft size={15} />
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="min-h-[65vh] pb-20">
      {/* Page Hero */}
      <section className="pt-16 pb-8 border-b border-[#dce3dc] w-[min(1220px,calc(100%_-_48px))] mx-auto">
        <div className="flex items-center gap-2.5 text-[9px] font-bold tracking-widest text-[#5c756a] uppercase">
          <span className="w-5 h-[1px] bg-[#99aa8d]" />
          {isEn ? 'CUSTOM PRINT WIZARD & LIVE MOCKUP' : 'معالج الطلب والمعاينة الحية'}
        </div>
        <h1 className="text-4xl md:text-6xl font-bold text-[#0b3b32] my-4 leading-tight">
          {isEn ? <>Let’s make<br /><em className="not-italic text-[#688573]">your idea real.</em></> : <>يلا نبدأ<br /><em className="not-italic text-[#688573]">طلبك سوا.</em></>}
        </h1>
        <div className="flex flex-wrap justify-between items-end gap-4">
          <p className="text-sm text-[#6f7d75] max-w-lg leading-relaxed">
            {isEn 
              ? 'Select one or multiple items, customize colors and placements, inspect your live 3D/2D mockup, and track with ease.' 
              : 'حدد منتجك أو اختر تشكيلة منتجات معاً، اضبط الألوان والمقاسات، عاين تصميمك في ماكيت تفاعلي ثلاثي الأبعاد، وأرسل طلبك بدقة.'}
          </p>
          
          {/* Quick Mockup Launcher Button */}
          <button
            type="button"
            onClick={() => setShowLivePreviewModal(!showLivePreviewModal)}
            className="inline-flex items-center gap-2 px-3.5 py-2 border border-[#0b3b32] bg-[#f0f6f1] text-[#0b3b32] font-bold text-xs rounded hover:bg-[#0b3b32] hover:text-white transition-all shadow-2xs cursor-pointer"
          >
            <Rotate3d size={16} />
            <span>{showLivePreviewModal ? (isEn ? 'Hide Live Mockup' : 'إخفاء المعاينة') : (isEn ? 'Live 3D/2D Mockup' : 'المعاينة الحية')}</span>
          </button>
        </div>
      </section>

      {/* Embedded Live Mockup Section (if toggled or on step 2 & 3) */}
      {(showLivePreviewModal || step >= 2) && (
        <section className="pt-6 w-[min(1220px,calc(100%_-_48px))] mx-auto">
          <LiveMockupPreview
            productId={activeProductId}
            productName={selectedService?.name[isEn ? 'en' : 'ar'] || ''}
            uploadedFile={uploadedFileObj}
            uploadedFileName={draft.fileName}
            preferredColor={activeConfig.color}
            availableProductIds={draft.selectedProductIds}
            onSelectProduct={(pid) => setDraft((curr) => ({ ...curr, activeProductId: pid }))}
            onArtworkChange={(fileName, dataUrl) => {
              set({ fileName, artworkDataUrl: dataUrl });
            }}
          />
        </section>
      )}

      {/* Step Indicators */}
      <section className="pt-8 w-[min(1220px,calc(100%_-_48px))] mx-auto">
        <div className="flex items-center justify-between mb-8 max-w-3xl overflow-x-auto pb-2 gap-2">
          {labels.map((label, index) => {
            const isCurrent = step === index;
            const isCompleted = step > index;
            return (
              <button
                key={label}
                onClick={() => index < step && setStep(index)}
                disabled={index > step}
                className={`flex items-center gap-2 text-xs transition-colors shrink-0 ${
                  isCurrent 
                    ? 'font-bold text-[#0b3b32]' 
                    : isCompleted 
                    ? 'text-[#527461] hover:text-[#0b3b32] cursor-pointer' 
                    : 'text-[#9aa79d] cursor-default'
                }`}
              >
                <span className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-all ${
                  isCurrent 
                    ? 'bg-[#0b3b32] text-white shadow-xs' 
                    : isCompleted 
                    ? 'bg-[#dcecdc] text-[#0b3b32]' 
                    : 'bg-[#ebeee9] text-[#86968a]'
                }`}>
                  {isCompleted ? <Check size={14} /> : `0${index + 1}`}
                </span>
                <span className="hidden sm:inline">{label}</span>
              </button>
            );
          })}
        </div>

        {/* Wizard Layout: Form Steps (Left) + Readiness Assistant (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_310px] gap-8 items-start">
          <div className="min-w-0">
            {/* STEP 0: Product & Contact */}
            {step === 0 && (
              <div className="bg-white border border-[#e5eae4] rounded-lg p-6 md:p-8 shadow-xs">
                <div className="flex justify-between items-start pb-5 mb-5 border-b border-[#edf0ec]">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-[#91a196]">STEP 01 / 04</span>
                    <h2 className="text-xl md:text-2xl font-bold text-[#0b3b32] mt-1">
                      {isEn ? 'What are we making?' : 'عايزين نعمل إيه؟'}
                    </h2>
                    <p className="text-xs text-[#77857d] mt-1">
                      {isEn 
                        ? 'Select one or more items to customize, and share your contact info.' 
                        : 'اختار منتجًا أو حدد عدة منتجات معًا، واكتب بياناتك للبدء.'}
                    </p>
                  </div>
                  <span className="font-mono text-3xl font-light text-[#dfe7dd]">01</span>
                </div>

                {/* Multi-Product Selection Mode Banner */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-[#f3f7f3] border border-[#d2e2d3] rounded-lg mb-5 transition-all">
                  <div className="flex items-center gap-3">
                    <span className="w-8 h-8 rounded-full bg-[#0b3b32] text-white flex items-center justify-center shrink-0 shadow-2xs">
                      <Layers size={17} />
                    </span>
                    <div>
                      <strong className="text-xs md:text-sm font-bold text-[#0b3b32] block">
                        {isEn ? 'Select multiple products together?' : 'عايز تختار كذا منتج مع بعض؟'}
                      </strong>
                      <span className="text-[11px] text-[#5e7466] block">
                        {isEn 
                          ? 'Choose any combination of T-shirts, Hoodies, Caps, Mugs, or Stickers in one order.' 
                          : 'يمكنك اختيار أكثر من منتج دفعة واحدة وتحديد مقاسات وكميات كل منتج برقم تتبع موحد.'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={toggleMultiSelectMode}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-2 cursor-pointer shadow-2xs ${
                        draft.isMultiSelectMode 
                          ? 'bg-[#0b3b32] text-white' 
                          : 'bg-white text-[#0b3b32] border border-[#bcd2bf] hover:bg-[#eaf2ea]'
                      }`}
                    >
                      <CheckSquare size={14} />
                      <span>
                        {draft.isMultiSelectMode 
                          ? (isEn ? 'Multi-Select Active ✓' : 'الاختيار المتعدد مفعّل ✓') 
                          : (isEn ? 'Enable Multi-Select' : 'تفعيل اختيار كذا منتج')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Multi-Select Active Action Strip */}
                {draft.isMultiSelectMode && (
                  <div className="mb-5 p-3 bg-[#eaf3ea] border border-[#cbe0cc] rounded-md flex flex-wrap items-center justify-between gap-2.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-[#0b3b32]">
                        {isEn ? `Selected (${draft.selectedProductIds.length}):` : `المنتجات المختارة (${draft.selectedProductIds.length}):`}
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {draft.selectedProductIds.map((pid) => {
                          const s = services.find((x) => x.id === pid);
                          return (
                            <span
                              key={pid}
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white border border-[#b8d4bb] text-[11px] font-semibold text-[#0b3b32] shadow-2xs"
                            >
                              <span>{s?.name[isEn ? 'en' : 'ar'] || pid}</span>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleProductSelection(pid);
                                }}
                                className="text-[#89443c] hover:text-[#b03020] ml-0.5 cursor-pointer"
                                title={isEn ? 'Remove' : 'إزالة'}
                              >
                                <X size={12} />
                              </button>
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 text-xs">
                      {draft.selectedProductIds.length < services.length ? (
                        <button
                          type="button"
                          onClick={selectAllProducts}
                          className="text-xs font-bold text-[#0b3b32] underline hover:text-[#185347] cursor-pointer"
                        >
                          {isEn ? 'Select all 6 products' : 'تحديد كل المنتجات'}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setDraft((curr) => ({ ...curr, selectedProductIds: ['tee'], activeProductId: 'tee', isMultiSelectMode: false }))}
                          className="text-xs font-bold text-[#738578] underline hover:text-[#0b3b32] cursor-pointer"
                        >
                          {isEn ? 'Reset to single' : 'الرجوع لمنتج واحد'}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {/* Gallery Reference Banner if active */}
                {reference && (
                  <div className="mb-5 p-3 bg-[#eef5ee] border border-[#d2e4d4] rounded flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="w-8 h-8 rounded bg-[#0b3b32] text-white flex items-center justify-center shrink-0">
                        <Sparkles size={16} />
                      </span>
                      <div className="text-xs">
                        <strong className="text-[#0b3b32] block">
                          {isEn ? `Reference selected: ${reference.title.en}` : `مرجع ملهم: ${reference.title.ar}`}
                        </strong>
                        <span className="text-[#647c6d] text-[11px]">
                          {isEn ? 'We pre-filled the corresponding product category for you.' : 'تم تحديد فئة المنتج المناسبة لمرجعك تلقائيًا.'}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => set({ referenceId: '' })}
                      className="text-[11px] text-[#93483f] font-semibold hover:underline cursor-pointer"
                    >
                      {isEn ? 'Remove' : 'إزالة'}
                    </button>
                  </div>
                )}

                {/* Product Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {services.map((service: Service) => {
                    const isSelected = draft.selectedProductIds.includes(service.id);
                    return (
                      <div
                        key={service.id}
                        onClick={() => {
                          if (draft.isMultiSelectMode) {
                            toggleProductSelection(service.id);
                          } else {
                            selectSingleProduct(service.id);
                          }
                        }}
                        className={`text-start p-2.5 rounded-lg border transition-all relative overflow-hidden flex flex-col justify-between cursor-pointer select-none ${
                          isSelected 
                            ? 'border-[#0b3b32] bg-[#f2f7f2] shadow-xs ring-2 ring-[#0b3b32]' 
                            : 'border-[#e4e9e3] bg-white hover:border-[#86aa91] hover:bg-[#fafcfa]'
                        }`}
                      >
                        <div className="relative w-full h-32 rounded-md overflow-hidden mb-2 bg-[#dce4dc]">
                          <BrandedProductImage
                            src={service.image}
                            alt={service.name[isEn ? 'en' : 'ar']}
                            kind={productPrintKindFor(service.id)}
                            showBrand={false}
                          />
                        </div>

                        <div className="px-1">
                          <strong className="text-xs font-bold text-[#0b3b32] block leading-tight">
                            {service.name[isEn ? 'en' : 'ar']}
                          </strong>
                          <small className="text-[10px] text-[#7d8c82] block mt-0.5">
                            {service.short[isEn ? 'en' : 'ar']}
                          </small>
                        </div>

                        {/* Top corner toggle button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (draft.isMultiSelectMode) {
                              toggleProductSelection(service.id);
                            } else {
                              // If in single mode, clicking '+' activates multi-select and adds it
                              if (!isSelected) {
                                setDraft((curr) => ({
                                  ...curr,
                                  isMultiSelectMode: true,
                                  selectedProductIds: [...curr.selectedProductIds, service.id],
                                  activeProductId: service.id,
                                }));
                              } else {
                                // already selected, toggle multi mode
                                toggleMultiSelectMode();
                              }
                            }
                          }}
                          className={`absolute top-2.5 inset-inline-start-2.5 px-2 py-0.5 rounded-full flex items-center gap-1 text-[10px] font-bold shadow-xs cursor-pointer transition-all ${
                            isSelected 
                              ? 'bg-[#0b3b32] text-white ring-1 ring-white/50' 
                              : 'bg-white/90 text-[#0b3b32] hover:bg-[#0b3b32] hover:text-white border border-[#cbd8cd]'
                          }`}
                          title={isSelected ? (isEn ? 'Selected' : 'محدد') : (isEn ? 'Add to selection' : 'إضافة للطلب')}
                        >
                          {isSelected ? <Check size={12} /> : <Plus size={12} />}
                          <span>{isSelected ? (isEn ? 'Selected' : 'محدد') : (isEn ? 'Add' : 'إضافة')}</span>
                        </button>
                      </div>
                    );
                  })}
                </div>

                {/* Customer Contact & Delivery Details */}
                <div className="mt-6 pt-6 border-t border-[#edf0ec]">
                  <div className="mb-4">
                    <h3 className="text-xs font-bold text-[#0b3b32] uppercase tracking-wider">
                      {isEn ? 'CONTACT & DELIVERY INFORMATION' : 'بيانات التواصل والشحن والتسليم'}
                    </h3>
                    <p className="text-[11px] text-[#718278] mt-0.5">
                      {isEn 
                        ? 'Please enter your shipping address and contact info to track production.' 
                        : 'يرجى كتابة عنوان التوصيل وبيانات التواصل لربط طلبك برقم التتبع ومتابعة التوصيل.'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <label className="text-xs font-bold text-[#0b3b32] flex flex-col gap-1.5">
                      <span className="flex items-center gap-1">
                        <span>{isEn ? 'Your Name' : 'اسمك الكريم'}</span>
                        <span className="text-[#a43c32] font-bold">*</span>
                      </span>
                      <input
                        value={draft.name}
                        onChange={(e) => set({ name: e.target.value })}
                        placeholder={isEn ? 'Full name' : 'الاسم ثلاثي أو ثنائي'}
                        className="p-2.5 bg-[#fbfcfa] border border-[#dce4dc] rounded text-xs text-[#0b3b32] focus:outline-none focus:border-[#0b3b32] focus:ring-1 focus:ring-[#0b3b32]"
                      />
                    </label>

                    {/* Primary Phone */}
                    <label className="text-xs font-bold text-[#0b3b32] flex flex-col gap-1.5">
                      <span className="flex items-center gap-1">
                        <span>{isEn ? 'Primary Phone (WhatsApp)' : 'رقم التليفون الأساسي / واتساب'}</span>
                        <span className="text-[#a43c32] font-bold">*</span>
                      </span>
                      <input
                        value={draft.phone}
                        onChange={(e) => set({ phone: e.target.value })}
                        placeholder="01x xxxx xxxx"
                        inputMode="tel"
                        className="p-2.5 bg-[#fbfcfa] border border-[#dce4dc] rounded text-xs text-[#0b3b32] focus:outline-none focus:border-[#0b3b32] focus:ring-1 focus:ring-[#0b3b32]"
                      />
                    </label>

                    {/* Secondary Phone (رقم هاتف آخر) */}
                    <label className="text-xs font-bold text-[#0b3b32] flex flex-col gap-1.5">
                      <span className="flex items-center justify-between">
                        <span>{isEn ? 'Alternative Phone Number' : 'رقم هاتف آخر (بديل)'}</span>
                        <small className="text-[10px] text-[#788a7e] font-normal">{isEn ? '(Optional)' : '(اختياري)'}</small>
                      </span>
                      <input
                        value={draft.phoneSecondary}
                        onChange={(e) => set({ phoneSecondary: e.target.value })}
                        placeholder="01x xxxx xxxx"
                        inputMode="tel"
                        className="p-2.5 bg-[#fbfcfa] border border-[#dce4dc] rounded text-xs text-[#0b3b32] focus:outline-none focus:border-[#0b3b32] focus:ring-1 focus:ring-[#0b3b32]"
                      />
                    </label>

                    {/* Email * (البريد الإلكتروني *) */}
                    <label className="text-xs font-bold text-[#0b3b32] flex flex-col gap-1.5">
                      <span className="flex items-center gap-1">
                        <span>{isEn ? 'Email Address' : 'البريد الإلكتروني'}</span>
                        <span className="text-[#a43c32] font-bold">*</span>
                      </span>
                      <input
                        type="email"
                        value={draft.email}
                        onChange={(e) => set({ email: e.target.value })}
                        placeholder="example@gmail.com"
                        className="p-2.5 bg-[#fbfcfa] border border-[#dce4dc] rounded text-xs text-[#0b3b32] focus:outline-none focus:border-[#0b3b32] focus:ring-1 focus:ring-[#0b3b32]"
                      />
                    </label>

                    {/* Delivery Address (العنوان) */}
                    <label className="text-xs font-bold text-[#0b3b32] flex flex-col gap-1.5 sm:col-span-2">
                      <span className="flex items-center gap-1">
                        <span>{isEn ? 'Delivery Address (City, Area, Street)' : 'العنوان بالتفصيل (المحافظة، المدينة، الحي، الشارع)'}</span>
                        <span className="text-[#a43c32] font-bold">*</span>
                      </span>
                      <input
                        value={draft.address}
                        onChange={(e) => set({ address: e.target.value })}
                        placeholder={isEn ? 'e.g. Aswan, Corniche El Nil, Building 14, Apt 3' : 'مثال: أسوان، طريق السادات، عمارة 8، شقة 4 بجوار كذا...'}
                        className="p-2.5 bg-[#fbfcfa] border border-[#dce4dc] rounded text-xs text-[#0b3b32] focus:outline-none focus:border-[#0b3b32] focus:ring-1 focus:ring-[#0b3b32]"
                      />
                    </label>

                    {/* Product Vision (وصف المنتج الي حابب يطلع بيه اوبشنال) */}
                    <label className="text-xs font-bold text-[#0b3b32] flex flex-col gap-1.5 sm:col-span-2">
                      <span className="flex items-center justify-between">
                        <span>{isEn ? 'Product Vision / Desired Final Look' : 'وصف شكل المنتج اللي حابب يطلع بيه'}</span>
                        <span className="text-[10px] text-[#2e5e3c] bg-[#eef5ee] px-2 py-0.5 rounded-full font-medium">
                          {isEn ? 'Optional' : 'اختياري'}
                        </span>
                      </span>
                      <textarea
                        rows={2}
                        value={draft.productVision}
                        onChange={(e) => set({ productVision: e.target.value })}
                        placeholder={isEn 
                          ? 'Describe your ideal final look (e.g. oversize fit, muted minimal chest badge, glossy ceramic finish, packaging suited for gift...)' 
                          : 'احكيلنا في خيالك المنتج حابب يطلع شكله إزاي (مثال: قصة أوفر سايز، طباعة هادية ناعمة على الصدر، ألوان دافية، تغليف ينفع هدية تخرج...)'}
                        className="p-2.5 bg-[#fbfcfa] border border-[#dce4dc] rounded text-xs text-[#0b3b32] focus:outline-none focus:border-[#0b3b32] focus:ring-1 focus:ring-[#0b3b32]"
                      />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 1: Details & Sizes */}
            {step === 1 && (
              <div className="bg-white border border-[#e5eae4] rounded-lg p-6 md:p-8 shadow-xs">
                <div className="flex justify-between items-start pb-5 mb-5 border-b border-[#edf0ec]">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-[#91a196]">STEP 02 / 04</span>
                    <h2 className="text-xl md:text-2xl font-bold text-[#0b3b32] mt-1">
                      {isEn ? 'Customization details' : 'نظبط التفاصيل'}
                    </h2>
                    <p className="text-xs text-[#77857d] mt-1">
                      {isEn 
                        ? 'Specify quantities, sizes, print position, and colors for each selected product.' 
                        : 'حدد المقاسات والكمية وموضع الطباعة والألوان لكل منتج من المنتجات المختارة.'}
                    </p>
                  </div>
                  <span className="font-mono text-3xl font-light text-[#dfe7dd]">02</span>
                </div>

                {/* Multi-Product Switcher Tabs if multiple products selected */}
                {draft.selectedProductIds.length > 1 && (
                  <div className="mb-6">
                    <div className="flex items-center justify-between gap-2 mb-2">
                      <span className="text-xs font-bold text-[#0b3b32] flex items-center gap-1.5">
                        <Sliders size={14} />
                        {isEn ? 'Select product to configure:' : 'اختر المنتج لضبط تفاصيله ومقاساته:'}
                      </span>
                      <span className="text-[11px] font-bold text-[#0b3b32] bg-[#edf4ed] px-2.5 py-0.5 rounded-full">
                        {isEn ? `Total: ${totalQuantity} pieces` : `إجمالي الطلب: ${totalQuantity} قطعة`}
                      </span>
                    </div>

                    <div className="flex items-center gap-2 overflow-x-auto pb-2">
                      {draft.selectedProductIds.map((pid) => {
                        const s = services.find((x) => x.id === pid);
                        const cfg = draft.productConfigs[pid];
                        const isCurrent = pid === activeProductId;
                        const isApparel = hasClothingSizes(pid);
                        const isReady = isApparel ? Boolean(cfg?.sizes && cfg.quantity > 0) : Boolean(cfg && cfg.quantity > 0);

                        return (
                          <button
                            key={pid}
                            type="button"
                            onClick={() => setDraft((curr) => ({ ...curr, activeProductId: pid }))}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-xs font-bold transition-all shrink-0 cursor-pointer ${
                              isCurrent 
                                ? 'bg-[#0b3b32] text-white border-[#0b3b32] shadow-xs' 
                                : 'bg-[#fbfcfa] border-[#d8e2d8] text-[#2c4739] hover:bg-[#edf5ee]'
                            }`}
                          >
                            <span className={`w-2 h-2 rounded-full ${isReady ? 'bg-[#46bd72]' : 'bg-[#e5a044]'}`} />
                            <span>{s?.name[isEn ? 'en' : 'ar'] || pid}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded ${isCurrent ? 'bg-white/20 text-white' : 'bg-[#e2ebe2] text-[#0b3b32]'}`}>
                              {cfg?.quantity ? `${cfg.quantity} ${isEn ? 'pcs' : 'قطعة'}` : (isEn ? 'Required' : 'مطلوب')}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Active Product Card Banner */}
                <div className="p-3 bg-[#f5f9f5] border border-[#d6e4d6] rounded-md mb-5 flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded bg-[#0b3b32] text-white flex items-center justify-center text-xs font-bold">
                      ✓
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-[#0b3b32]">
                        {isEn ? `Configuring: ${selectedService?.name.en}` : `تخصيص: ${selectedService?.name.ar}`}
                      </strong>
                      <span className="text-[11px] text-[#5e7466] block">
                        {selectedService?.short[isEn ? 'en' : 'ar']}
                      </span>
                    </div>
                  </div>

                  {draft.selectedProductIds.length > 1 && (
                    <button
                      type="button"
                      onClick={() => applyColorAndPlacementToAll(activeProductId)}
                      className="px-2.5 py-1 bg-white border border-[#bcd2bf] text-[#0b3b32] hover:bg-[#0b3b32] hover:text-white rounded text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shrink-0"
                      title={isEn ? 'Apply current color and placement to all other selected products' : 'تطبيق نفس اللون والموضع على كل المنتجات الأخرى'}
                    >
                      <Sparkles size={12} />
                      <span>{isEn ? 'Apply to all products' : 'تطبيق اللون والموضع على الكل'}</span>
                    </button>
                  )}
                </div>

                {/* Copy success alert */}
                {copySuccessNotice && (
                  <div className="mb-4 p-2.5 bg-[#eaf7ec] border border-[#b2ddb7] rounded text-xs text-[#20632d] font-semibold flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    <span>{copySuccessNotice}</span>
                  </div>
                )}

                {/* Clothing Size Breakdown if applicable */}
                {activeHasClothingSizes ? (
                  <div className="mb-6">
                    <SizeBreakdownPicker
                      counts={activeConfig.sizeCounts || {}}
                      total={activeConfig.quantity || 0}
                      isEn={isEn}
                      onChange={(size, delta) => changeSizeCountForProduct(activeProductId, size, delta)}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                    <label className="text-xs font-bold text-[#0b3b32] flex flex-col gap-1.5">
                      <span>{isEn ? 'Quantity' : 'الكمية المطلوبة'}</span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => updateProductConfig(activeProductId, { quantity: Math.max(1, (activeConfig.quantity || 1) - 1) })}
                          className="w-10 h-10 rounded border border-[#dce4dc] bg-white text-[#0b3b32] font-bold flex items-center justify-center hover:bg-[#edf5ee] cursor-pointer"
                        >
                          <Minus size={16} />
                        </button>
                        <input
                          type="number"
                          min={1}
                          value={activeConfig.quantity || 1}
                          onChange={(e) => updateProductConfig(activeProductId, { quantity: Math.max(1, Number(e.target.value)) })}
                          className="p-2.5 flex-1 text-center bg-[#fbfcfa] border border-[#dce4dc] rounded text-xs text-[#0b3b32] font-bold focus:outline-none focus:border-[#0b3b32]"
                        />
                        <button
                          type="button"
                          onClick={() => updateProductConfig(activeProductId, { quantity: (activeConfig.quantity || 1) + 1 })}
                          className="w-10 h-10 rounded border border-[#dce4dc] bg-white text-[#0b3b32] font-bold flex items-center justify-center hover:bg-[#edf5ee] cursor-pointer"
                        >
                          <Plus size={16} />
                        </button>
                      </div>
                    </label>

                    <RgbColorPicker
                      label={isEn ? 'Color Preference' : 'درجة اللون المفضلة'}
                      value={activeConfig.color}
                      onChange={(color) => updateProductConfig(activeProductId, { color })}
                      isEn={isEn}
                    />
                  </div>
                )}

                {/* Print Placement & Color Swatches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <label className="text-xs font-bold text-[#0b3b32] flex flex-col gap-1.5">
                    <span>{isEn ? 'Print Placement' : 'موضع ومكان الطباعة'}</span>
                    <select
                      value={activeConfig.placement}
                      onChange={(e) => updateProductConfig(activeProductId, { placement: e.target.value })}
                      className="p-2.5 bg-[#fbfcfa] border border-[#dce4dc] rounded text-xs text-[#0b3b32] focus:outline-none focus:border-[#0b3b32]"
                    >
                      <option value="">{isEn ? 'Choose placement...' : 'اختار مكان الطباعة...'}</option>
                      {getPlacementOptions(activeProductId, isEn).map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </label>

                  <RgbColorPicker
                    label={isEn ? 'Color / Base Material' : 'لون المنتج الأساسي'}
                    value={activeConfig.color}
                    onChange={(color) => updateProductConfig(activeProductId, { color })}
                    isEn={isEn}
                  />
                </div>

                {/* Color Preset Palette */}
                <div className="mb-5 p-3 bg-[#fbfcfa] border border-[#e8eee8] rounded-md">
                  <span className="text-[10px] font-bold text-[#718578] uppercase tracking-wider block mb-2">
                    {isEn ? 'Recommended Palette Colors:' : 'درجات ألوان مقترحة:'}
                  </span>
                  <div className="flex items-center gap-2 flex-wrap">
                    {COLOR_PRESETS.map((preset) => (
                      <button
                        key={preset.hex}
                        type="button"
                        onClick={() => updateProductConfig(activeProductId, { color: normalizeColorToRgb(preset.hex) })}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer ${
                          activeConfig.color === normalizeColorToRgb(preset.hex)
                            ? 'bg-[#0b3b32] text-white border-[#0b3b32]' 
                            : 'bg-white text-[#2c4739] border-[#d4ded5] hover:bg-[#edf5ee]'
                        }`}
                      >
                        <span 
                          className="w-3.5 h-3.5 rounded-full border border-black/15 shadow-xs" 
                          style={{ backgroundColor: preset.hex }} 
                        />
                        <span>{isEn ? preset.nameEn : preset.nameAr}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Summary Table of all Selected Products in this order */}
                {draft.selectedProductIds.length > 1 && (
                  <div className="mt-6 pt-5 border-t border-[#edf0ec]">
                    <span className="text-xs font-bold text-[#0b3b32] block mb-2.5">
                      {isEn ? 'Order Products Summary' : 'ملخص مواصفات المنتجات في هذا الطلب:'}
                    </span>
                    <div className="border border-[#e5eae4] rounded-lg overflow-hidden divide-y divide-[#edf0ec]">
                      {draft.selectedProductIds.map((pid) => {
                        const s = services.find((x) => x.id === pid);
                        const cfg = draft.productConfigs[pid];
                        const isApparel = hasClothingSizes(pid);
                        const isReady = isApparel ? Boolean(cfg?.sizes && cfg.quantity > 0) : Boolean(cfg && cfg.quantity > 0);

                        return (
                          <div key={pid} className="p-3 bg-white flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2.5">
                              <span className={`w-2 h-2 rounded-full shrink-0 ${isReady ? 'bg-[#3bb768]' : 'bg-[#e5a044]'}`} />
                              <div>
                                <strong className="text-[#0b3b32] block font-semibold">
                                  {s?.name[isEn ? 'en' : 'ar'] || pid}
                                </strong>
                                <span className="text-[11px] text-[#718277]">
                                  {cfg?.placement || (isEn ? 'Placement not set' : 'لم يتم تحديد الموضع')} {cfg?.color ? `· ${cfg.color}` : ''}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <div className="text-end">
                                <strong className="text-[#0b3b32] block font-bold">
                                  {cfg?.quantity ? `${cfg.quantity} ${isEn ? 'pcs' : 'قطعة'}` : (isEn ? '0 pcs' : '0 قطعة')}
                                </strong>
                                {cfg?.sizes && (
                                  <span className="text-[10px] text-[#4f735d]">{cfg.sizes}</span>
                                )}
                              </div>
                              <button
                                type="button"
                                onClick={() => setDraft((curr) => ({ ...curr, activeProductId: pid }))}
                                className="text-xs text-[#0b3b32] font-bold underline hover:text-[#185347] cursor-pointer"
                              >
                                {isEn ? 'Edit' : 'تعديل'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Additional Notes */}
                <label className="text-xs font-bold text-[#0b3b32] flex flex-col gap-1.5 mt-5">
                  <span>{isEn ? 'Additional Specifications or Event Details' : 'ملاحظات إضافية أو تفاصيل المناسبة'}</span>
                  <textarea
                    rows={3}
                    value={draft.notes}
                    onChange={(e) => set({ notes: e.target.value })}
                    placeholder={isEn ? 'Tell us about the occasion, deadline, or special instructions...' : 'اكتب أي فكرة أو تفاصيل تخص موعد التسليم أو المناسبة...'}
                    className="p-2.5 bg-[#fbfcfa] border border-[#dce4dc] rounded text-xs text-[#0b3b32] focus:outline-none focus:border-[#0b3b32]"
                  />
                </label>
              </div>
            )}

            {/* STEP 2: Artwork & Reference */}
            {step === 2 && (
              <div className="bg-white border border-[#e5eae4] rounded-lg p-6 md:p-8 shadow-xs">
                <div className="flex justify-between items-start pb-5 mb-6 border-b border-[#edf0ec]">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-[#91a196]">STEP 03 / 04</span>
                    <h2 className="text-xl md:text-2xl font-bold text-[#0b3b32] mt-1">
                      {isEn ? 'Artwork or design help?' : 'معاك تصميم ولا محتاج مساعدة؟'}
                    </h2>
                    <p className="text-xs text-[#77857d] mt-1">
                      {isEn ? 'Upload your file or request creative assistance.' : 'ارفع تصميمك الخاص أو اطلب مساعدة استوديو التصميم.'}
                    </p>
                  </div>
                  <span className="font-mono text-3xl font-light text-[#dfe7dd]">03</span>
                </div>

                {draft.selectedProductIds.length > 1 && (
                  <div className="mb-4 p-3 bg-[#f0f6f0] border border-[#cbe0cb] rounded text-xs text-[#0b3b32] flex items-center gap-2">
                    <Sparkles size={16} className="shrink-0" />
                    <span>
                      {isEn 
                        ? `The uploaded artwork will be applied across all ${draft.selectedProductIds.length} selected products. You can switch between products on the live preview above.` 
                        : `سيتم استخدام نفس التصميم على كافة المنتجات المختارة (${draft.selectedProductIds.length} منتجات). يمكنك التبديل بين المنتجات لمعاينتها بالأعلى.`}
                    </span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => set({ designHelp: false })}
                    className={`p-4 rounded-lg border text-start transition-all flex flex-col gap-2 cursor-pointer ${
                      !draft.designHelp 
                        ? 'border-[#0b3b32] bg-[#f2f7f2] shadow-xs ring-1 ring-[#0b3b32]' 
                        : 'border-[#e4e9e3] bg-white'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-[#dbe8dc] text-[#0b3b32] grid place-items-center">
                      <FileUp size={18} />
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-[#0b3b32] block">
                        {isEn ? 'I have artwork / file' : 'عندي تصميم جاهز'}
                      </strong>
                      <small className="text-[10px] text-[#718277] block mt-0.5">
                        {isEn ? 'Upload vector, PNG, or image file below' : 'ارفع ملف فيكتور أو صورة أو PDF'}
                      </small>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => set({ designHelp: true, fileName: '' })}
                    className={`p-4 rounded-lg border text-start transition-all flex flex-col gap-2 cursor-pointer ${
                      draft.designHelp 
                        ? 'border-[#0b3b32] bg-[#f2f7f2] shadow-xs ring-1 ring-[#0b3b32]' 
                        : 'border-[#e4e9e3] bg-white'
                    }`}
                  >
                    <span className="w-8 h-8 rounded-full bg-[#dbe8dc] text-[#0b3b32] grid place-items-center">
                      <Sparkles size={18} />
                    </span>
                    <div>
                      <strong className="text-xs font-bold text-[#0b3b32] block">
                        {isEn ? 'I need design help' : 'محتاج مساعدة في التصميم'}
                      </strong>
                      <small className="text-[10px] text-[#718277] block mt-0.5">
                        {isEn ? 'Our designer will create it for you' : 'فريق الاستوديو هيصمم فكرتك من الصفر'}
                      </small>
                    </div>
                  </button>
                </div>

                {!draft.designHelp && (
                  <label className="border-2 border-dashed border-[#b6ccba] bg-[#f8faf7] hover:bg-[#f1f6ef] rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer transition-colors text-center mb-4">
                    <input
                      type="file"
                      accept="image/*,.pdf,.ai,.psd,.svg"
                      onChange={handleFileSelection}
                      className="hidden"
                    />
                    <FileUp size={28} className="text-[#0b3b32] mb-2" />
                    <strong className="text-xs font-bold text-[#0b3b32]">
                      {draft.fileName || (isEn ? 'Click or drag artwork here' : 'اضغط لاختيار ملف التصميم من جهازك')}
                    </strong>
                    <small className="text-[10px] text-[#718277] mt-1">
                      {isEn ? 'Supports PNG, JPG, SVG, PDF up to 25MB' : 'يدعم صور عالية الجودة وPDF وفيكتور'}
                    </small>
                  </label>
                )}

                {/* Live Mockup reminder card */}
                <div className="p-3.5 bg-[#eaf0e8] border border-[#d5ded5] rounded flex items-center justify-between gap-3 text-xs">
                  <div className="flex items-center gap-2 text-[#0b3b32]">
                    <Rotate3d size={18} className="shrink-0" />
                    <span>
                      {isEn ? 'Your artwork appears directly on the live mockup preview above.' : 'تصميمك يظهر مباشرة على مجسم المعاينة التفاعلي بالأعلى.'}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowLivePreviewModal(true)}
                    className="underline font-bold text-[#0b3b32] hover:text-[#185347] shrink-0 cursor-pointer"
                  >
                    {isEn ? 'Inspect Mockup' : 'فتح المعاينة'}
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Preview & Review */}
            {step === 3 && (
              <div className="bg-white border border-[#e5eae4] rounded-lg p-6 md:p-8 shadow-xs">
                <div className="flex justify-between items-start pb-5 mb-6 border-b border-[#edf0ec]">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-[#91a196]">STEP 04 / 04</span>
                    <h2 className="text-xl md:text-2xl font-bold text-[#0b3b32] mt-1">
                      {isEn ? 'Final Review & Confirmation' : 'مراجعة وتأكيد الطلب'}
                    </h2>
                    <p className="text-xs text-[#77857d] mt-1">
                      {isEn ? 'Check all specifications before generating your tracking number.' : 'راجع جميع المواصفات قبل إصدار رقم التتبع الرسمي.'}
                    </p>
                  </div>
                  <span className="font-mono text-3xl font-light text-[#dfe7dd]">04</span>
                </div>

                {/* Review Summary Grid */}
                <div className="border border-[#e5eae4] rounded-lg overflow-hidden divide-y divide-[#edf0ec]">
                  {/* Selected Products List */}
                  <div className="p-4 bg-[#fbfcfa]">
                    <div className="flex items-center justify-between mb-3">
                      <small className="text-[10px] uppercase font-bold text-[#8a988e]">
                        {isEn ? `SELECTED PRODUCTS (${draft.selectedProductIds.length})` : `المنتجات المحددة (${draft.selectedProductIds.length})`}
                      </small>
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="text-xs text-[#486e56] font-semibold underline cursor-pointer"
                      >
                        {isEn ? 'Change Products' : 'تعديل المنتجات'}
                      </button>
                    </div>

                    <div className="divide-y divide-[#edf0ec]">
                      {draft.selectedProductIds.map((pid) => {
                        const s = services.find((x) => x.id === pid);
                        const cfg = draft.productConfigs[pid];

                        return (
                          <div key={pid} className="py-3 flex items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-3">
                              <div className="relative w-14 h-12 rounded overflow-hidden flex-shrink-0 bg-[#dce4dc]">
                                <BrandedProductImage
                                  src={s?.image || ''}
                                  alt=""
                                  kind={productPrintKindFor(pid)}
                                  showBrand={false}
                                />
                              </div>
                              <div>
                                <strong className="text-xs font-bold text-[#0b3b32] block">
                                  {s?.name[isEn ? 'en' : 'ar']}
                                </strong>
                                <span className="text-[11px] text-[#6d7f73] block mt-0.5">
                                  {cfg?.placement} {cfg?.color ? `· ${cfg.color}` : ''}
                                </span>
                              </div>
                            </div>

                            <div className="text-end">
                              <strong className="text-xs font-bold text-[#0b3b32] block">
                                {cfg?.quantity || 1} {isEn ? 'pieces' : 'قطعة'}
                              </strong>
                              {cfg?.sizes && (
                                <span className="text-[10px] text-[#426b52] block">{cfg.sizes}</span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="mt-3 pt-3 border-t border-[#edf0ec] flex items-center justify-between">
                      <span className="text-xs font-bold text-[#0b3b32]">
                        {isEn ? 'Total Order Quantity:' : 'إجمالي كمية الطلب:'}
                      </span>
                      <strong className="text-sm font-bold text-[#0b3b32] bg-[#edf4ed] px-3 py-1 rounded-full">
                        {totalQuantity} {isEn ? 'Pieces' : 'قطعة'}
                      </strong>
                    </div>
                  </div>

                  {/* Customer & Shipping Details */}
                  <div className="p-4 bg-[#fdfefd]">
                    <small className="text-[9px] uppercase font-bold text-[#8a988e] block mb-2">
                      {isEn ? 'CUSTOMER & SHIPPING INFORMATION' : 'بيانات العميل والشحن'}
                    </small>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-[#768a7c] block">{isEn ? 'Name:' : 'الاسم:'}</span>
                        <strong className="text-[#0b3b32] font-semibold">{draft.name}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#768a7c] block">{isEn ? 'Phones:' : 'أرقام الهاتف:'}</span>
                        <strong className="text-[#0b3b32] font-semibold" dir="ltr">
                          {draft.phone} {draft.phoneSecondary ? ` / ${draft.phoneSecondary}` : ''}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#768a7c] block">{isEn ? 'Email:' : 'البريد الإلكتروني:'}</span>
                        <strong className="text-[#0b3b32] font-semibold">{draft.email}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#768a7c] block">{isEn ? 'Address:' : 'عنوان الشحن:'}</span>
                        <strong className="text-[#0b3b32] font-semibold">{draft.address}</strong>
                      </div>
                    </div>

                    {/* Product Vision if specified */}
                    {draft.productVision && (
                      <div className="mt-3 p-2.5 bg-[#f0f7f1] border border-[#cee2d0] rounded text-xs">
                        <span className="font-bold text-[#0b3b32] block mb-0.5">
                          {isEn ? 'Product Vision / Desired Look:' : 'وصف شكل المنتج المطلوب:'}
                        </span>
                        <p className="text-[#3c5746] leading-relaxed">{draft.productVision}</p>
                      </div>
                    )}
                  </div>

                  {/* Artwork status */}
                  <div className="p-4">
                    <small className="text-[9px] uppercase font-bold text-[#8a988e]">
                      {isEn ? 'ARTWORK STATUS' : 'حالة التصميم والمرفقات'}
                    </small>
                    <strong className="text-xs font-semibold text-[#0b3b32] block mt-1">
                      {draft.designHelp
                        ? (isEn ? 'Design help requested from Yuzersef team' : 'طلب مساعدة تصميم من استوديو يوزرسيف')
                        : draft.fileName || (isEn ? 'Reference chosen' : 'مرجع مختار من المعرض')}
                    </strong>
                    {draft.notes && (
                      <p className="text-xs text-[#627368] mt-2 bg-[#f4f7f3] p-2 rounded">
                        <span className="font-bold">{isEn ? 'Notes: ' : 'ملاحظات: '}</span>
                        {draft.notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Validation Notice Banner */}
            {notice && (
              <div
                className="mt-4 p-3 bg-[#fdf0ee] border border-[#f5c7c2] rounded text-xs text-[#984c40] font-semibold flex items-center justify-between"
                role="alert"
              >
                <span>{notice}</span>
                <button type="button" onClick={() => setNotice('')} className="cursor-pointer">
                  <X size={14} />
                </button>
              </div>
            )}

            {/* Wizard Navigation Buttons */}
            <div className="flex items-center justify-between mt-6">
              {step > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setNotice('');
                    setStep((curr) => curr - 1);
                  }}
                  className="px-5 py-2.5 border border-[#dce3dc] bg-white text-[#0b3b32] font-semibold text-xs rounded hover:bg-[#f5f8f5] transition-all flex items-center gap-1.5 cursor-pointer"
                >
                  <ArrowLeft size={15} />
                  {isEn ? 'Back' : 'السابق'}
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={next}
                  className="px-6 py-2.5 bg-[#0b3b32] text-white font-semibold text-xs rounded hover:bg-[#154c41] transition-all flex items-center gap-2 shadow-xs cursor-pointer"
                >
                  {isEn ? 'Continue' : 'متابعة'}
                  <ArrowUpLeft size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={createRequest}
                  className="px-7 py-3 bg-[#0b3b32] text-white font-bold text-xs rounded hover:bg-[#154c41] transition-all flex items-center gap-2 shadow-sm cursor-pointer"
                >
                  {isEn ? 'Submit Request & Get Tracking' : 'تأكيد وإرسال الطلب'}
                  <ArrowUpLeft size={17} />
                </button>
              )}
            </div>
          </div>

          {/* Right Column: Request-Readiness Assistant (مساعد الجاهزية) */}
          <aside className="space-y-4">
            <ReadinessAssistant
              items={readinessItems}
              onJumpToStep={(s) => setStep(s)}
              shakeTrigger={shakeTrigger}
            />

            {/* Studio Support Card */}
            <div className="bg-[#0b3b32] text-white rounded-lg p-5 shadow-xs">
              <span className="font-extrabold text-xl text-[#bfd0a9] block">Y.</span>
              <strong className="text-xs font-bold block mt-2">
                {isEn ? 'Questions about sizes or prints?' : 'عندك استفسار عن الخامات والطباعة؟'}
              </strong>
              <p className="text-[11px] text-[#c4d4ca] leading-relaxed mt-1 mb-3">
                {isEn 
                  ? 'Our Aswan workshop is available directly on WhatsApp to guide your design choices.' 
                  : 'فريق ورشة أسوان متاح دائمًا لمساعدتك في اختيار أنسب مقاس وخامة.'}
              </p>
              <a
                href="https://wa.me/201116891025"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 text-xs text-[#dcecdc] font-bold hover:underline"
              >
                <span>{isEn ? 'Chat: 01116891025' : 'واتساب: 01116891025'}</span>
                <ArrowUpLeft size={14} />
              </a>
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}
