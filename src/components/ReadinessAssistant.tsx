import { motion, AnimatePresence } from 'framer-motion';
import { Check, AlertCircle, ChevronLeft, Sparkles, ArrowRight, ShieldCheck } from 'lucide-react';
import { useLanguage } from '../lib/language';

export interface ReadinessItem {
  id: string;
  step: number;
  labelAr: string;
  labelEn: string;
  isReady: boolean;
  hintAr: string;
  hintEn: string;
}

interface ReadinessAssistantProps {
  items: ReadinessItem[];
  onJumpToStep: (step: number) => void;
  shakeTrigger?: boolean;
}

export default function ReadinessAssistant({
  items,
  onJumpToStep,
  shakeTrigger = false,
}: ReadinessAssistantProps) {
  const { isEn } = useLanguage();

  const completedCount = items.filter((item) => item.isReady).length;
  const percentage = Math.round((completedCount / items.length) * 100);
  const isFullyReady = percentage === 100;

  return (
    <motion.div
      animate={shakeTrigger ? { x: [-6, 6, -4, 4, -2, 2, 0] } : {}}
      transition={{ duration: 0.4 }}
      className={`rounded-lg p-4 md:p-5 border transition-all ${
        isFullyReady 
          ? 'bg-[#edf5ee] border-[#b5d5ba] shadow-xs' 
          : 'bg-[#eaf0e8] border-[#d5ded5]'
      }`}
    >
      {/* Header & Score Gauge */}
      <div className="flex items-center justify-between pb-3 border-b border-[#d7e2d6]">
        <div className="flex items-center gap-2.5">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${
            isFullyReady ? 'bg-[#0b3b32] text-white' : 'bg-[#d5e1d3] text-[#0b3b32]'
          }`}>
            {isFullyReady ? <ShieldCheck size={18} /> : <Sparkles size={17} />}
          </div>
          <div>
            <strong className="text-xs md:text-sm font-bold text-[#0b3b32] block leading-tight">
              {isEn ? 'Request-Readiness Assistant' : 'مساعد الجاهزية الذكي'}
            </strong>
            <small className="text-[10px] text-[#718277] block">
              {isFullyReady 
                ? (isEn ? 'All specifications complete!' : 'جميع المواصفات مكتملة وجاهزة!') 
                : (isEn ? 'Follow cues to complete request' : 'راجع الإرشادات لضمان سرعة التنفيذ')}
            </small>
          </div>
        </div>

        {/* Dynamic Percentage Badge */}
        <div className="text-right">
          <div className="flex items-baseline gap-1 justify-end">
            <span className="font-mono text-base md:text-lg font-extrabold text-[#0b3b32]">
              {percentage}%
            </span>
          </div>
          <span className="text-[9px] uppercase tracking-wider font-semibold text-[#667e6f]">
            {isEn ? 'Readiness' : 'نسبة الجاهزية'}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-[#dbe4db] h-1.5 rounded-full mt-3 overflow-hidden">
        <motion.div
          className={`h-full rounded-full ${isFullyReady ? 'bg-[#0b3b32]' : 'bg-[#407358]'}`}
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>

      {/* Itemized Visual Checklist */}
      <ul className="mt-3.5 space-y-2">
        <AnimatePresence>
          {items.map((item) => (
            <motion.li
              key={item.id}
              initial={{ opacity: 0, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-start justify-between gap-2 p-2 rounded-md transition-all text-xs cursor-pointer ${
                item.isReady
                  ? 'bg-white/60 hover:bg-white text-[#2f4f3c]'
                  : 'bg-[#faecea] border border-[#f2cfcb] text-[#8c3e35] shadow-2xs'
              }`}
              onClick={() => onJumpToStep(item.step)}
              title={isEn ? `Jump to Step ${item.step + 1}` : `الانتقال إلى خطوة ${item.step + 1}`}
            >
              <div className="flex items-start gap-2">
                <span className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                  item.isReady 
                    ? 'bg-[#0b3b32] text-white' 
                    : 'bg-[#984c40] text-white'
                }`}>
                  {item.isReady ? <Check size={11} /> : <AlertCircle size={11} />}
                </span>
                <div>
                  <span className={`font-semibold block ${item.isReady ? 'text-[#0b3b32]' : 'text-[#8c3e35]'}`}>
                    {isEn ? item.labelEn : item.labelAr}
                  </span>
                  {!item.isReady && (
                    <span className="text-[10px] text-[#9c5148] block mt-0.5 font-normal">
                      {isEn ? item.hintEn : item.hintAr}
                    </span>
                  )}
                </div>
              </div>

              {!item.isReady && (
                <span className="text-[10px] font-bold underline shrink-0 flex items-center gap-0.5 text-[#984c40]">
                  {isEn ? 'Fix' : 'تعديل'}
                  <ChevronLeft size={13} className="rtl:rotate-0 ltr:rotate-180" />
                </span>
              )}
            </motion.li>
          ))}
        </AnimatePresence>
      </ul>

      {/* Ready Banner */}
      {isFullyReady && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mt-3 p-2.5 bg-[#dcecdc] border border-[#b8dab9] rounded text-[11px] font-semibold text-[#0b3b32] flex items-center gap-2"
        >
          <Check size={16} className="text-[#0b3b32] shrink-0" />
          <span>
            {isEn 
              ? 'Awesome! Your request contains all specifications for immediate production.' 
              : 'ممتاز! كل تفاصيل طلبك جاهزة للمراجعة والبدء في الإنتاج مباشرة.'}
          </span>
        </motion.div>
      )}
    </motion.div>
  );
}
