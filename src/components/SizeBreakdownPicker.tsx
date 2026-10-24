import { Minus, Plus } from 'lucide-react';

export const clothingSizes = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'] as const;

type SizeBreakdownPickerProps = {
  counts: Record<string, number>;
  total: number;
  isEn: boolean;
  onChange: (size: string, delta: number) => void;
};

export default function SizeBreakdownPicker({ counts, total, isEn, onChange }: SizeBreakdownPickerProps) {
  return (
    <section className={"[padding:18px] [background:#fff] [border:1px_solid_#e3e9e2] [&_>p]:[margin:7px_0_14px] [&_>p]:[color:#7a877f] [&_>p]:[font-size:10px] [&_>small]:[display:block] [&_>small]:[margin-top:11px] [&_>small]:[color:#859188] [&_>small]:[font-size:9px] max-[720px]:[padding:13px] [display:flex] [flex-direction:column] [gap:7px] [color:#486356] [font-size:10px] [font-weight:600] [&_input]:[width:100%] [&_input]:[border:1px_solid_#dce4dc] [&_input]:[background:#fbfcfa] [&_input]:[color:#213f34] [&_input]:[padding:11px_12px] [&_input]:[outline:0] [&_input]:[font-size:11px] [&_input]:[transition:border_.2s,box-shadow_.2s] [&_select]:[width:100%] [&_select]:[border:1px_solid_#dce4dc] [&_select]:[background:#fbfcfa] [&_select]:[color:#213f34] [&_select]:[padding:11px_12px] [&_select]:[outline:0] [&_select]:[font-size:11px] [&_select]:[transition:border_.2s,box-shadow_.2s] [&_textarea]:[width:100%] [&_textarea]:[border:1px_solid_#dce4dc] [&_textarea]:[background:#fbfcfa] [&_textarea]:[color:#213f34] [&_textarea]:[padding:11px_12px] [&_textarea]:[outline:0] [&_textarea]:[font-size:11px] [&_textarea]:[transition:border_.2s,box-shadow_.2s] [&_input:focus]:[border-color:#7d9d85] [&_input:focus]:[box-shadow:0_0_0_3px_rgba(118,151,125,.12)] [&_select:focus]:[border-color:#7d9d85] [&_select:focus]:[box-shadow:0_0_0_3px_rgba(118,151,125,.12)] [&_textarea:focus]:[border-color:#7d9d85] [&_textarea:focus]:[box-shadow:0_0_0_3px_rgba(118,151,125,.12)] [margin-top:17px] [&_small]:[font-size:9px] [&_small]:[color:#8b9790] [&_small]:[font-weight:400] [&_textarea]:[resize:vertical] [&_textarea]:[line-height:1.7] [&_select]:[appearance:auto] max-[720px]:[font-size:9px] max-[720px]:[&_input]:[font-size:10px] max-[720px]:[&_input]:[padding:10px] max-[720px]:[&_select]:[font-size:10px] max-[720px]:[&_select]:[padding:10px] max-[720px]:[&_textarea]:[font-size:10px] max-[720px]:[&_textarea]:[padding:10px]"} aria-label={isEn ? 'Choose clothing sizes' : 'اختيار مقاسات الملابس'}>
      <div className={"[display:flex] [justify-content:space-between] [align-items:center] [gap:12px] [color:#0b3b32] [&_strong]:[font-size:13px] [&_span]:[font-size:10px] [&_span]:[color:#66806f] [&_span]:[white-space:nowrap]"}>
        <strong>{isEn ? 'Choose sizes and quantities' : 'اختاري المقاسات والكمية لكل مقاس'}</strong>
        <span>{isEn ? `${total} pieces selected` : `${total} قطعة مختارة`}</span>
      </div>
      <p>{isEn ? 'All sizes are shown. Use + and − to set the quantity for each one.' : 'كل المقاسات ظاهرة؛ استخدمي + و− لتحديد عدد القطع من كل مقاس.'}</p>
      <div className={"[display:grid] [grid-template-columns:repeat(4,minmax(0,1fr))] [gap:8px] max-[720px]:[grid-template-columns:repeat(2,minmax(0,1fr))] max-[720px]:[gap:7px]"}>
        {clothingSizes.map((size) => {
          const count = counts[size] || 0;
          return (
            <div className={`[display:flex] [align-items:center] [justify-content:space-between] [gap:7px] [min-height:60px] [padding:8px] [border:1px_solid_#dce4dc] [background:#f8f9f5] [transition:background_.18s,border-color_.18s] [&_>strong]:[font:700_12px_Manrope,sans-serif] [&_>strong]:[color:#0b3b32] max-[720px]:[min-height:56px] ${count > 0 ? "[background:#eef5ed] [border-color:#6f9479]" : ''}`} key={size}>
              <strong>{size}</strong>
              <div className={"[display:flex] [align-items:center] [gap:5px] [&_button]:[width:25px] [&_button]:[height:25px] [&_button]:[display:grid] [&_button]:[place-items:center] [&_button]:[border:1px_solid_#d7e0d7] [&_button]:[background:#fff] [&_button]:[color:#0b3b32] [&_button]:[padding:0] [&_button:disabled]:[opacity:.4] [&_button:disabled]:[cursor:not-allowed] [&_>span]:[min-width:16px] [&_>span]:[text-align:center] [&_>span]:[font:700_11px_Manrope,sans-serif] [&_>span]:[color:#0b3b32]"}>
                <button
                  type="button"
                  aria-label={isEn ? `Remove one ${size}` : `تقليل مقاس ${size}`}
                  disabled={count === 0}
                  onClick={() => onChange(size, -1)}
                >
                  <Minus size={14} />
                </button>
                <span aria-live="polite">{count}</span>
                <button
                  type="button"
                  aria-label={isEn ? `Add one ${size}` : `إضافة قطعة مقاس ${size}`}
                  onClick={() => onChange(size, 1)}
                >
                  <Plus size={14} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
      <small>{isEn ? 'The total quantity is calculated automatically from your size selections.' : 'إجمالي الكمية بيتحسب تلقائيًا من المقاسات اللي اخترتيها.'}</small>
    </section>
  );
}
