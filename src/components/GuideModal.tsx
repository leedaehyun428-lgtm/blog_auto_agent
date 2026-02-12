import { useMemo, useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Check,
  MousePointerClick,
  Search,
  SlidersHorizontal,
  Copy,
} from 'lucide-react';

interface GuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface GuideStep {
  id: number;
  title: string;
  description: string;
  icon: typeof MousePointerClick;
  accent: string;
}

const GUIDE_STEPS: GuideStep[] = [
  {
    id: 1,
    title: 'Step 1: 주제 선택',
    description: '원하는 주제를 클릭하세요. 맛집, 여행 등 다양한 주제가 준비되어 있습니다.',
    icon: MousePointerClick,
    accent: 'from-orange-400 to-amber-500',
  },
  {
    id: 2,
    title: 'Step 2: 키워드 입력',
    description: "핵심 키워드를 입력하세요. 예: '강남역 데이트', '제주도 흑돼지'",
    icon: Search,
    accent: 'from-blue-400 to-indigo-500',
  },
  {
    id: 3,
    title: 'Step 3: 옵션 설정',
    description: '원하는 말투와 모드(일반/고성능)를 선택하여 글의 퀄리티를 높이세요.',
    icon: SlidersHorizontal,
    accent: 'from-violet-400 to-purple-500',
  },
  {
    id: 4,
    title: 'Step 4: 생성 및 복사',
    description: '생성된 글을 확인하고, 버튼 한 번으로 블로그 서식 그대로 복사하세요!',
    icon: Copy,
    accent: 'from-emerald-400 to-teal-500',
  },
];

export default function GuideModal({ isOpen, onClose }: GuideModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  const isLastStep = currentStep === GUIDE_STEPS.length - 1;
  const step = useMemo(() => GUIDE_STEPS[currentStep], [currentStep]);
  const StepIcon = step.icon;

  const goPrev = () => setCurrentStep((prev) => Math.max(0, prev - 1));
  const goNext = () => setCurrentStep((prev) => Math.min(GUIDE_STEPS.length - 1, prev + 1));

  const handleClose = () => {
    setCurrentStep(0);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center bg-black/60 p-4"
      onClick={handleClose}
    >
      <div
        className="w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h3 className="text-lg font-bold text-slate-800">Briter AI 사용 가이드</h3>
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6">
          <div className="relative overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-white/40 blur-2xl" />
            <div className={`inline-flex rounded-2xl bg-gradient-to-r ${step.accent} p-4 text-white shadow-lg`}>
              <StepIcon className="h-8 w-8" />
            </div>
            <p className="mt-5 text-xl font-extrabold text-slate-900">{step.title}</p>
            <p className="mt-3 break-keep text-sm leading-relaxed text-slate-600">{step.description}</p>
          </div>

          <div className="mt-5 flex items-center justify-center gap-2">
            {GUIDE_STEPS.map((item, idx) => (
              <span
                key={item.id}
                className={`h-2.5 rounded-full transition-all ${
                  currentStep === idx ? 'w-6 bg-slate-800' : 'w-2.5 bg-slate-300'
                }`}
              />
            ))}
          </div>

          <div className="mt-6 flex items-center justify-between">
            <button
              type="button"
              onClick={goPrev}
              disabled={currentStep === 0}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold text-slate-600 transition-colors hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
              이전
            </button>

            {isLastStep ? (
              <button
                type="button"
                onClick={handleClose}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-slate-800"
              >
                <Check className="h-4 w-4" />
                시작하기
              </button>
            ) : (
              <button
                type="button"
                onClick={goNext}
                className="inline-flex items-center gap-1 rounded-xl bg-orange-500 px-4 py-2 text-sm font-bold text-white transition-colors hover:bg-orange-600"
              >
                다음
                <ChevronRight className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
