import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Briefcase,
  Check,
  ChevronDown,
  MessageCircleHeart,
  Sparkles,
  User,
} from 'lucide-react';

interface ToneOption {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}

const RECOMMENDED_TONES: ToneOption[] = [
  { id: 'preset_reviewer', label: '[기본] 친근한 리뷰어', icon: MessageCircleHeart },
  { id: 'preset_analyst', label: '[기본] 전문적인 분석가', icon: Briefcase },
  { id: 'preset_insta', label: '[기본] 감성 인스타그래머', icon: Sparkles },
];

const MY_TONES: ToneOption[] = [
  { id: 'my_foodie', label: '내 맛집 전용 말투', icon: User },
  { id: 'my_travel', label: '여행 블로그 말투', icon: User },
];

export default function ToneSelector() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTone, setSelectedTone] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = useMemo(() => {
    const all = [...RECOMMENDED_TONES, ...MY_TONES];
    const found = all.find((item) => item.id === selectedTone);
    return found?.label ?? '저장된 말투 불러오기...';
  }, [selectedTone]);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (!containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
    };
  }, [isOpen]);

  const handleSelectTone = (toneId: string) => {
    setSelectedTone(toneId);
    setIsOpen(false);
  };

  const renderToneItem = (item: ToneOption) => {
    const isSelected = selectedTone === item.id;
    const Icon = item.icon;

    return (
      <button
        key={item.id}
        type="button"
        onClick={() => handleSelectTone(item.id)}
        className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-left transition-all hover:bg-orange-50"
      >
        <span className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-orange-500" />
          <span className={`text-sm ${isSelected ? 'font-bold text-slate-800' : 'text-slate-600'}`}>{item.label}</span>
        </span>
        {isSelected && <Check className="h-4 w-4 text-orange-500" />}
      </button>
    );
  };

  return (
    <div className="relative w-full" ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex w-full items-center justify-between rounded-xl border border-slate-200 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-orange-200"
      >
        <span className={`truncate text-sm ${selectedTone ? 'font-semibold text-slate-700' : 'text-slate-400'}`}>
          {selectedLabel}
        </span>
        <ChevronDown
          className={`h-4 w-4 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : 'rotate-0'}`}
        />
      </button>

      <div
        className={`absolute left-0 right-0 top-[calc(100%+8px)] z-50 rounded-xl border border-slate-200 bg-white p-2 shadow-xl transition-all duration-200 ${
          isOpen ? 'pointer-events-auto translate-y-0 opacity-100' : 'pointer-events-none -translate-y-1 opacity-0'
        }`}
      >
        <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">✨ Briter AI 추천</div>
        <div className="space-y-1">{RECOMMENDED_TONES.map(renderToneItem)}</div>

        <div className="my-2 border-t border-slate-100" />

        <div className="px-2 py-1 text-[11px] font-bold uppercase tracking-wide text-slate-400">👤 내가 저장한 말투</div>
        <div className="space-y-1">{MY_TONES.map(renderToneItem)}</div>
      </div>
    </div>
  );
}

