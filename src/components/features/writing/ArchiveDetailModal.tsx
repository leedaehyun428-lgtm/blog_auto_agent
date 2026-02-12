import type { ComponentType } from 'react';
import { X, Copy, CheckCircle2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ThemeType } from '../../../api';

export interface ArchiveDetailRow {
  id: number;
  keyword: string;
  content: string;
  theme: ThemeType;
  is_test_mode: boolean;
  tone_guide: string | null;
  created_at: string;
}

interface ArchiveDetailModalProps {
  isOpen: boolean;
  isLoading: boolean;
  detail: ArchiveDetailRow | null;
  themes: { id: ThemeType; label: string; icon: ComponentType<{ className?: string }> }[];
  isCopyDone: boolean;
  onClose: () => void;
  onReuse: () => void;
  onCopy: () => void;
}

export default function ArchiveDetailModal({
  isOpen,
  isLoading,
  detail,
  themes,
  isCopyDone,
  onClose,
  onReuse,
  onCopy,
}: ArchiveDetailModalProps) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[100] bg-black/60 flex items-center justify-center p-4 md:p-8"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-5xl h-[85vh] rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white shrink-0">
          <h2 className="text-lg font-bold text-slate-800">기록 상세</h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
            aria-label="닫기"
          >
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex items-center justify-center text-sm font-semibold text-slate-400">
            기록을 불러오는 중...
          </div>
        ) : !detail ? (
          <div className="flex-1 flex items-center justify-center text-sm font-semibold text-slate-400">
            상세 정보를 찾을 수 없습니다.
          </div>
        ) : (
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            <aside className="w-full md:w-80 bg-slate-50 border-b md:border-b-0 md:border-r overflow-y-auto shrink-0">
              <div className="p-6">
                <h3 className="text-sm font-black text-slate-700 mb-4">메타 정보</h3>

                <p className="text-xs text-slate-400 font-bold uppercase">Date</p>
                <p className="text-sm text-slate-800 font-medium mb-4">{new Date(detail.created_at).toLocaleString()}</p>

                <p className="text-xs text-slate-400 font-bold uppercase">Mode</p>
                <p className="text-sm text-slate-800 font-medium mb-4">
                  {detail.is_test_mode ? '일반 모드 (20V)' : '고성능 모드 (100V)'}
                </p>

                <p className="text-xs text-slate-400 font-bold uppercase">Theme</p>
                <p className="text-sm text-slate-800 font-medium mb-4">
                  {themes.find((theme) => theme.id === detail.theme)?.label ?? detail.theme}
                </p>

                <p className="text-xs text-slate-400 font-bold uppercase">Keyword</p>
                <p className="text-sm text-slate-800 font-medium mb-4 break-words">{detail.keyword}</p>

                <p className="text-xs text-slate-400 font-bold uppercase">Tone</p>
                <p className="text-sm text-slate-800 font-medium mb-6 whitespace-pre-wrap break-words">
                  {detail.tone_guide?.trim() ? detail.tone_guide : '저장된 말투 설정 없음'}
                </p>

                <button
                  type="button"
                  onClick={onReuse}
                  className="w-full rounded-xl bg-gradient-to-r from-violet-500 to-indigo-500 px-4 py-2.5 text-sm font-bold text-white shadow-md transition-all hover:from-violet-600 hover:to-indigo-600"
                >
                  이 설정으로 다시 쓰기
                </button>
              </div>
            </aside>

            <section className="flex-1 bg-white p-6 md:p-8 overflow-y-auto">
              <div className="sticky top-0 z-10 -mx-6 md:-mx-8 -mt-6 md:-mt-8 mb-5 flex justify-end border-b border-slate-100 bg-white/95 px-6 md:px-8 py-3 backdrop-blur-sm">
                <button
                  type="button"
                  onClick={onCopy}
                  className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition-colors ${
                    isCopyDone
                      ? 'bg-green-100 text-green-700'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {isCopyDone ? <CheckCircle2 className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {isCopyDone ? '복사 완료' : '복사하기'}
                </button>
              </div>

              <div className="prose prose-slate max-w-none leading-relaxed prose-headings:font-extrabold prose-headings:text-slate-900 prose-p:text-[15px] prose-p:leading-relaxed prose-strong:text-slate-900">
                <ReactMarkdown>{detail.content}</ReactMarkdown>
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
