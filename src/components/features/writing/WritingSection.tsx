import { useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  Search,
  Copy,
  Clock,
  CheckCircle,
  RotateCcw,
  X,
  AlignLeft,
  Smartphone,
  Monitor,
  Download,
  Image as ImageIcon,
  PenLine,
  Save,
  XCircle,
  BarChart3,
  MessageSquarePlus,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { ThemeType, GenerateMode } from '../../../api';
interface ThemeStyles {
  ring: string;
  iconBg: string;
  border: string;
  focusRing: string;
  button: string;
  accentText: string;
  subText: string;
  lightBg: string;
}

interface AnalysisItem {
  keyword: string;
  totalSearch: number;
  totalClick: string;
  compIdx: string;
}

interface AnalysisData {
  main: AnalysisItem;
  recommendations: AnalysisItem[];
}

interface ExposureGuide {
  charCount: number;
  imgCount: number;
  keywordCount: number;
}

interface PromptItem {
  id: string;
  title: string;
  system_prompt: string;
}

interface HistoryItem {
  id: number;
  keyword: string;
  content: string;
  date: string;
  theme: ThemeType;
  mode: GenerateMode;
  toneGuide?: string | null;
}

interface WritingSectionProps {
  step: 'idle' | 'searching' | 'writing' | 'done';
  isLoading: boolean;
  isAnalyzing: boolean;
  mode: GenerateMode;
  setMode: (value: GenerateMode) => void;
  resultMode: GenerateMode;
  isMobileView: boolean;
  isEditing: boolean;
  keyword: string;
  keywordError: string;
  setKeyword: (value: string) => void;
  selectedTheme: ThemeType;
  setSelectedTheme: (theme: ThemeType) => void;
  themeStyles: ThemeStyles;
  themes: { id: ThemeType; label: string; icon: ComponentType<{ className?: string }> }[];
  handleAnalyze: () => void;
  handleGenerate: () => void;
  analysisData: AnalysisData | null;
  exposureGuide: ExposureGuide | null;
  useGuide: boolean;
  setUseGuide: (value: boolean) => void;
  selectedPromptId: string;
  setSelectedPromptId: (value: string) => void;
  prompts: PromptItem[];
  defaultPrompts: PromptItem[];
  guide: string;
  setGuide: (value: string) => void;
  handleDeletePrompt: () => void;
  setIsPromptModalOpen: (value: boolean) => void;
  isPromptModalOpen: boolean;
  newPromptTitle: string;
  setNewPromptTitle: (value: string) => void;
  handleSavePrompt: () => void;
  history: HistoryItem[];
  loadFromHistory: (item: HistoryItem) => void;
  deleteHistoryItem: (e: React.MouseEvent, itemId: number) => void;
  resetToHome: () => void;
  cancelEditing: () => void;
  saveEditing: () => void;
  startEditing: () => void;
  setIsMobileView: (value: boolean) => void;
  handleDownloadThumbnail: () => void;
  handleDownloadFile: () => void;
  handleCopyCleanText: () => void;
  copyStatus: string;
  result: string;
  editableResult: string;
  setEditableResult: (value: string) => void;
}

export default function WritingSection({
  step,
  isLoading,
  isAnalyzing,
  mode,
  setMode,
  resultMode,
  isMobileView,
  isEditing,
  keyword,
  keywordError,
  setKeyword,
  selectedTheme,
  setSelectedTheme,
  themeStyles,
  themes,
  handleAnalyze,
  handleGenerate,
  analysisData,
  exposureGuide,
  useGuide,
  setUseGuide,
  selectedPromptId,
  setSelectedPromptId,
  prompts,
  defaultPrompts,
  guide,
  setGuide,
  handleDeletePrompt,
  setIsPromptModalOpen,
  isPromptModalOpen,
  newPromptTitle,
  setNewPromptTitle,
  handleSavePrompt,
  history,
  loadFromHistory,
  deleteHistoryItem,
  resetToHome,
  cancelEditing,
  saveEditing,
  startEditing,
  setIsMobileView,
  handleDownloadThumbnail,
  handleDownloadFile,
  handleCopyCleanText,
  copyStatus,
  result,
  editableResult,
  setEditableResult,
}: WritingSectionProps) {
  const isBasicMode = mode === 'basic';
  const isResultBasicMode = resultMode === 'basic';
  const [historyView, setHistoryView] = useState<'recent' | 'archive'>('recent');
  const [isArchiveOpen, setIsArchiveOpen] = useState(true);
  const [archivePage, setArchivePage] = useState(1);
  const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
  const ARCHIVE_PAGE_SIZE = 7;

  const loadingMessages = useMemo(
    () =>
      mode === 'pro'
        ? [
            '맛집 키워드 분석 중...',
            '네이버 상위 노출 로직 대입 중...',
            '매력적인 제목 뽑는 중...',
            '원고 작성 마무리 중...',
          ]
        : [
            '키워드 핵심 문맥 정리 중...',
            '기본 노출 구조 적용 중...',
            '읽기 쉬운 문장 흐름 구성 중...',
            '완성도 체크 및 정리 중...',
          ],
    [mode],
  );

  useEffect(() => {
    if (!isLoading) {
      setLoadingMessageIndex(0);
      return;
    }

    setLoadingMessageIndex(0);
    const timer = setInterval(() => {
      setLoadingMessageIndex((prev) => (prev + 1) % loadingMessages.length);
    }, 3000);

    return () => clearInterval(timer);
  }, [isLoading, loadingMessages]);

  const currentLoadingMessage = loadingMessages[loadingMessageIndex] ?? '';
  const totalArchivePages = Math.max(1, Math.ceil(history.length / ARCHIVE_PAGE_SIZE));
  const displayedHistory =
    historyView === 'recent'
      ? history.slice(0, ARCHIVE_PAGE_SIZE)
      : history.slice((archivePage - 1) * ARCHIVE_PAGE_SIZE, archivePage * ARCHIVE_PAGE_SIZE);

  useEffect(() => {
    setArchivePage(1);
  }, [historyView, history.length]);

  return (
                <div className="p-4 md:p-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          
          {step !== 'done' && (
            <div className="w-full max-w-2xl mx-auto mt-4 transition-all duration-500">
              
              {/* 테마 선택 */}
              <div className="mb-8">
                <p className="text-center text-sm font-medium text-slate-400 mb-4">오늘의 포스팅 주제는 무엇인가요?</p>
                <div className="mb-4 flex justify-center">
                  <div className="inline-grid grid-cols-2 gap-1 rounded-2xl bg-slate-100 p-1 shadow-inner">
                    <button
                      type="button"
                      onClick={() => setMode('basic')}
                      className={`rounded-xl px-4 py-2 text-xs md:text-sm font-bold transition-all active:scale-95 ${
                        isBasicMode ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      ⚡ 일반 (20V)
                    </button>
                    <button
                      type="button"
                      onClick={() => setMode('pro')}
                      className={`rounded-xl px-4 py-2 text-xs md:text-sm font-bold transition-all active:scale-95 ${
                        !isBasicMode ? 'bg-white text-violet-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5">
                        <span>🚀 고성능 (100V)</span>
                        <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-black text-violet-600">Premium</span>
                      </span>
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                  {themes.map((theme) => {
                    const Icon = theme.icon;
                    const isSelected = selectedTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`flex flex-col items-center justify-center gap-2 p-2 md:p-3 rounded-2xl transition-all duration-300 ${
                          isSelected
                            ? `bg-white shadow-lg shadow-slate-200 ring-2 ${themeStyles.ring} -translate-y-1`
                            : 'bg-white/40 hover:bg-white/80 hover:shadow-md text-slate-400'
                        }`}
                      >
                        <div className={`p-2 rounded-full transition-colors ${isSelected ? themeStyles.iconBg : 'bg-slate-100 text-slate-400'}`}>
                          <Icon className="w-4 h-4 md:w-5 md:h-5" />
                        </div>
                        <span className={`text-[10px] md:text-[11px] font-semibold ${isSelected ? 'text-slate-700' : 'text-slate-400'}`}>
                          {theme.label.split('/')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

             {/* 검색창 & 분석 버튼 영역 */}
              <div className="space-y-6 mb-10">
                {/* flex-col: 모바일에서는 세로 배치 (검색창 위, 버튼 아래)
                    md:flex-row: PC에서는 가로 배치 (한 줄)
                */}
                <div className="flex flex-col md:flex-row gap-3 relative z-10">
                  
                  {/* 검색창 영역 */}
                  <div className="relative flex-1 group w-full">
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${isBasicMode ? 'from-orange-300 to-yellow-400' : 'from-sky-300 to-blue-400'} blur opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                    <input 
                      type="text" 
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder={`${themes.find(t=>t.id===selectedTheme)?.label.split('/')[0]} 키워드 입력`}
                      className={`relative w-full px-6 py-4 text-lg bg-white border rounded-2xl focus:outline-none focus:ring-4 shadow-lg text-slate-700 placeholder:text-slate-300 transition-all ${themeStyles.border} ${themeStyles.focusRing}`}
                      onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
                    />
                    {keywordError && (
                      <p className="mt-2 pl-2 text-xs font-medium text-red-500">{keywordError}</p>
                    )}
                  </div>
                  
                  {/* 버튼 영역 (모바일은 가로 꽉 차게, PC는 내용물 크기) */}
                  <div className="flex gap-2 w-full md:w-auto">
                      {/* 분석 버튼 (모바일 반반 분할) */}
                      <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || isLoading}
                        className="flex-1 md:flex-none px-4 py-4 bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-700 active:scale-95 disabled:opacity-50 transition-all flex flex-col items-center justify-center min-w-[80px]"
                      >
                        {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <BarChart3 className="w-6 h-6" />}
                        <span className="text-[10px] mt-1 font-medium">분석</span>
                      </button>

                      {/* 생성 버튼 (모바일 반반 분할) */}
                      <button 
                        onClick={handleGenerate}
                        disabled={isLoading}
                        className={`flex-1 md:flex-none px-6 py-4 text-white rounded-2xl font-bold shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 transition-all flex flex-col items-center justify-center min-w-[80px] ${themeStyles.button}`}
                      >
                        {isLoading ? <Sparkles className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                        <span className="text-[10px] mt-1 font-medium">생성</span>
                      </button>
                  </div>
                </div>

                {/* 분석 결과 리포트 */}
                <AnimatePresence>
                  {analysisData && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, height: 0 }} 
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                        
                        {/* 1. 현재 키워드 진단 */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Current Keyword</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-lg font-bold text-slate-800">{analysisData.main.keyword}</span>
                              {analysisData.main.compIdx === 'HIGH' && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">경쟁 높음</span>}
                              {analysisData.main.compIdx === 'MID' && <span className="text-[10px] font-bold bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">경쟁 중간</span>}
                              {analysisData.main.compIdx === 'LOW' && <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">경쟁 낮음</span>}
                            </div>
                          </div>
                          <div className="flex gap-4 text-right">
                            <div>
                              <p className="text-xs text-slate-400 mb-0.5">월간 검색수</p>
                              <p className="font-bold text-slate-700">{analysisData.main.totalSearch.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-0.5">월간 클릭수</p>
                              <p className="font-bold text-slate-700">{analysisData.main.totalClick}</p>
                            </div>
                          </div>
                        </div>

                        {/* 2. 연관 키워드 추천 */}
                        <div>
                           <div className="flex items-center gap-2 mb-3">
                             <Sparkles className="w-4 h-4 text-yellow-500" />
                             <span className="text-sm font-bold text-slate-600">AI 추천 연관 키워드 (클릭하여 교체)</span>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                             {analysisData.recommendations.length > 0 ? (
                               analysisData.recommendations.map((item, idx) => (
                                 <button 
                                   key={idx}
                                   onClick={() => {
                                     setKeyword(item.keyword);
                                     handleAnalyze();
                                   }}
                                   className="flex items-center justify-between p-3 rounded-xl bg-slate-50 hover:bg-blue-50 hover:ring-1 ring-blue-200 transition-all group text-left"
                                 >
                                   <div>
                                     <div className="flex items-center gap-2">
                                       <span className="text-sm font-bold text-slate-700 group-hover:text-blue-600">{item.keyword}</span>
                                       {item.totalSearch >= 1000 && item.totalSearch <= 30000 && (
                                         <span className="text-[9px] font-bold bg-green-100 text-green-600 px-1.5 py-0.5 rounded">Green Zone</span>
                                       )}
                                     </div>
                                     <div className="text-[10px] text-slate-400 mt-1 flex gap-2">
                                       <span>검색 {item.totalSearch.toLocaleString()}</span>
                                       <span>•</span>
                                       <span>클릭 {item.totalClick}</span>
                                     </div>
                                   </div>
                                   <div className={`text-[10px] font-bold px-2 py-1 rounded-lg ${
                                     item.compIdx === 'LOW' ? 'bg-green-100 text-green-600' : 
                                     item.compIdx === 'MID' ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-500'
                                   }`}>
                                     {item.compIdx}
                                   </div>
                                 </button>
                               ))
                             ) : (
                               <div className="col-span-2 text-center py-4 text-sm text-slate-400 bg-slate-50 rounded-xl">
                                 추천할 만한 연관 키워드가 아직 없어요. <br /> 다른 키워드로 시도해보세요!
                               </div>
                             )}
                           </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 상위 노출 가이드 */}
                {exposureGuide && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center gap-2 mb-3">
                      <div className="bg-red-500 text-white p-1 rounded-md">
                        <BarChart3 className="w-4 h-4" />
                      </div>
                      <span className="text-sm font-bold text-slate-700">상위 노출 공략집 (TOP 5 분석)</span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 mb-1">목표 글자수</p>
                        <p className="text-lg font-black text-slate-700">{exposureGuide.charCount.toLocaleString()}</p>
                        <p className="text-[9px] text-blue-500 font-bold">2,000자 이상</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 mb-1">사진 개수</p>
                        <p className="text-lg font-black text-slate-700">{exposureGuide.imgCount}장</p>
                        <p className="text-[9px] text-blue-500 font-bold">15장 이상 권장</p>
                      </div>
                      <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                        <p className="text-[10px] text-slate-400 mb-1">키워드 반복</p>
                        <p className="text-lg font-black text-slate-700">{exposureGuide.keywordCount}회</p>
                        <p className="text-[9px] text-blue-500 font-bold">자연스럽게 반복</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-[10px] text-slate-400 bg-slate-100 p-2 rounded-lg flex items-center gap-2">
                      <span>💡</span>
                      <span>
                        상위 블로그 평균 기준 <b>{exposureGuide.charCount.toLocaleString()}자</b> 수준으로 작성하면 노출 안정성에 도움이 됩니다.
                      </span>
                    </div>
                  </div>
                )}

                {/* 가이드 입력 아코디언 */}
                <div className="relative px-2">
                   <button 
                     onClick={() => setUseGuide(!useGuide)}
                     className={`flex items-center gap-2 text-sm font-medium transition-colors ${useGuide ? themeStyles.accentText : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${useGuide ? `${isBasicMode ? 'bg-orange-500 border-orange-500' : 'bg-blue-500 border-blue-500'}` : 'bg-white border-slate-300'}`}>
                        {useGuide && <span className="text-white text-[10px]">✔</span>}
                     </div>
                     <MessageSquarePlus className="w-4 h-4" />
                     <span>AI에게 상세 가이드 주기 (선택사항)</span>
                   </button>
                   
                   <AnimatePresence>
                      {useGuide && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="relative">
                             {/* 말투 선택/저장 영역 */}
                            <div className="flex gap-2 mb-2 mt-2">
                              <select 
                                value={selectedPromptId}
                                onChange={(e) => {
                                  const pid = e.target.value;
                                  setSelectedPromptId(pid);
                                  if (!pid) { setGuide(''); return; }

                                  // 1. 사용자 저장 목록에서 찾기
                                  let selected = prompts.find(p => p.id === pid);
                                  // 2. 없으면 기본 프리셋에서 찾기
                                  if (!selected) selected = defaultPrompts.find(p => p.id === pid);

                                  if (selected) {
                                    setGuide(selected.system_prompt);
                                    setUseGuide(true);
                                  }
                                }}
                                className="..."
                              >
                                <option value="">💬 저장된 말투 불러오기...</option>
                                
                                {/* 기본 제공 프리셋 */}
                                <optgroup label="✨ Briter AI 추천 프리셋">
                                  {defaultPrompts.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                  ))}
                                </optgroup>

                                {/* 내가 저장한 말투 목록 */}
                                {prompts.length > 0 && (
                                  <optgroup label="👤 내 저장 목록">
                                    {prompts.map(p => (
                                      <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>

                              {/* 선택된 말투 삭제 버튼 */}
                              {selectedPromptId && (
                                <button 
                                  onClick={handleDeletePrompt}
                                  className="px-3 py-1 bg-red-100 hover:bg-red-200 rounded-lg text-xs font-bold text-red-500 transition-colors"
                                  title="선택한 말투 삭제"
                                >
                                  삭제
                                </button>
                              )}
                              
                              <button 
                                onClick={() => setIsPromptModalOpen(true)}
                                className="px-3 py-1 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-bold text-slate-600 transition-colors"
                              >
                                + 저장
                              </button>
                            </div>

                            <textarea
                              value={guide}
                              onChange={(e) => setGuide(e.target.value)}
                              placeholder="예시: '30대 직장인 말투로 써줘...' / '업체 가이드를 여기에 붙여넣으세요...'"
                              className={`w-full mt-3 p-4 rounded-xl border bg-white/50 focus:bg-white text-sm text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-2 resize-none h-40 transition-all ${themeStyles.border} ${themeStyles.focusRing}`}
                            />
                            
                            {/* 글자 수 카운터 */}
                            <div className="flex justify-between items-center mt-2 px-1">
                               <p className="text-[11px] text-slate-400">
                                 * 업체 가이드를 통째로 붙여넣으셔도 됩니다. (길이 제한 없음)
                               </p>
                               <div className="text-xs text-slate-400 font-medium bg-white/50 px-2 py-1 rounded-md border border-slate-100">
                                 📝 현재 <span className={`font-bold ${themeStyles.accentText}`}>{guide.length.toLocaleString()}</span>자
                               </div>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                </div>
              </div>

              {/* 말투 저장 모달 */}
              {isPromptModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                  <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in-up">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">나만의 말투 저장</h3>
                    <p className="text-xs text-slate-500 mb-4">현재 작성 중인 가이드를 저장해두고 계속 재사용할 수 있어요.</p>
                    
                    <input 
                      type="text" 
                      placeholder="말투 이름 (예: 20대 감성, 맛집 전문가)"
                      value={newPromptTitle}
                      onChange={(e) => setNewPromptTitle(e.target.value)}
                      className="w-full p-3 border rounded-xl mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    
                    <div className="flex gap-2">
                      <button onClick={() => setIsPromptModalOpen(false)} className="flex-1 py-3 bg-slate-100 rounded-xl text-sm font-bold text-slate-600">취소</button>
                      <button onClick={handleSavePrompt} className="flex-1 py-3 bg-slate-800 rounded-xl text-sm font-bold text-white">저장하기</button>
                    </div>
                  </div>
                </div>
              )}

              {/* 생성 기록 보관함 */}
              {history.length > 0 && !isLoading && (
                <div className="animate-fade-in-up px-2">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="min-w-0 flex items-center gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
                      <Clock className="w-3 h-3" /> Generated Archive
                    </div>
                    <div className="shrink-0 flex items-center gap-1 md:gap-2">
                      <div className="flex items-center gap-1 rounded-lg bg-slate-100 p-1">
                        <button
                          type="button"
                          onClick={() => setHistoryView('recent')}
                          className={`rounded-md px-2 py-1 text-[10px] md:text-[11px] font-bold transition-colors ${
                            historyView === 'recent' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          최근
                        </button>
                        <button
                          type="button"
                          onClick={() => setHistoryView('archive')}
                          className={`rounded-md px-2 py-1 text-[10px] md:text-[11px] font-bold transition-colors ${
                            historyView === 'archive' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500'
                          }`}
                        >
                          보관함
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsArchiveOpen((prev) => !prev)}
                        className="inline-flex items-center gap-0.5 md:gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] md:text-[11px] font-bold text-slate-500 shadow-sm hover:bg-slate-50"
                        aria-label={isArchiveOpen ? '접기' : '펼치기'}
                      >
                        <span className="hidden md:inline">{isArchiveOpen ? '접기' : '펼치기'}</span>
                        {isArchiveOpen ? <ChevronUp className="w-3 h-3 md:w-3.5 md:h-3.5" /> : <ChevronDown className="w-3 h-3 md:w-3.5 md:h-3.5" />}
                      </button>
                    </div>
                  </div>
                  {isArchiveOpen && (
                    <>
                      <div className="max-h-44 overflow-y-auto rounded-xl border border-slate-200 bg-white/70 p-2 custom-scrollbar">
                        <div className="space-y-2">
                          {displayedHistory.map((item) => (
                            <button
                              key={item.id}
                              type="button"
                              onClick={() => loadFromHistory(item)}
                              className="w-full rounded-xl border border-slate-100 bg-white px-3 py-2 text-left shadow-sm transition-colors hover:border-slate-200 hover:bg-slate-50"
                            >
                              <div className="flex items-center justify-between gap-2">
                                <div className="flex min-w-0 items-center gap-2">
                                  <span className={`h-2 w-2 rounded-full ${item.mode === 'basic' ? 'bg-orange-400' : 'bg-blue-400'}`} />
                                  <span className="truncate text-sm font-bold text-slate-700">{item.keyword}</span>
                                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-500">
                                    {item.mode.toUpperCase()}
                                  </span>
                                </div>
                                <button
                                  onClick={(e) => deleteHistoryItem(e, item.id)}
                                  className="rounded-full p-1 text-slate-300 transition-colors hover:bg-red-100 hover:text-red-500"
                                  title="삭제"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                              <p className="mt-1 truncate text-[11px] text-slate-400">
                                {item.toneGuide ? `가이드 저장됨 · ${item.date}` : `가이드 없음 · ${item.date}`}
                              </p>
                            </button>
                          ))}
                        </div>
                      </div>
                      {historyView === 'archive' && totalArchivePages > 1 && (
                        <div className="mt-2 flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setArchivePage((prev) => Math.max(1, prev - 1))}
                            disabled={archivePage === 1}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 disabled:opacity-40"
                          >
                            이전
                          </button>
                          <span className="text-[11px] font-bold text-slate-500">
                            {archivePage} / {totalArchivePages}
                          </span>
                          <button
                            type="button"
                            onClick={() => setArchivePage((prev) => Math.min(totalArchivePages, prev + 1))}
                            disabled={archivePage === totalArchivePages}
                            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 disabled:opacity-40"
                          >
                            다음
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Status & Result Area */}
          <div className="flex-1 relative w-full max-w-4xl mx-auto min-h-[300px]">
            <AnimatePresence mode='wait'>
              
              {step === 'idle' && (
                <motion.div 
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center text-slate-300 pb-10"
                >
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center mb-6 transition-colors ${themeStyles.lightBg}`}>
                    <Sparkles className={`w-10 h-10 ${themeStyles.subText}`} />
                  </div>
                  <p className="text-slate-400 font-medium text-center leading-relaxed">
                    주제를 선택하고 키워드를 입력해 주세요.<br/>
                    <span className={`${themeStyles.accentText} font-semibold`}>제품 리뷰</span>부터 <span className={`${themeStyles.accentText} font-semibold`}>맛집 탐방</span>까지.<br/>
                    {isBasicMode ? '일반 모드: 빠르게 초안을 만듭니다.' : '고성능 모드: 검색 기반으로 정교하게 작성합니다.'}
                  </p>
                </motion.div>
              )}

              {(step === 'searching' || step === 'writing') && (
                <motion.div 
                  key="loading"
                  initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                  className="absolute inset-0 flex flex-col items-center justify-center gap-8 pb-10"
                >
                  <div className="relative">
                    <div className={`w-20 h-20 border-4 border-slate-100 rounded-full animate-spin border-t-${isBasicMode ? 'orange' : 'blue'}-400`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full animate-ping ${isBasicMode ? 'bg-orange-400' : 'bg-blue-400'}`} />
                    </div>
                  </div>
                  <div className="text-center space-y-2">
                    <h3 className="text-xl font-bold text-slate-700">
                      {step === 'searching' ? '스토리텔링 초안 준비 중...' : 'AI 문장 다듬는 중...'}
                    </h3>
                    <p className="text-slate-500 text-sm font-semibold">{currentLoadingMessage}</p>
                    <p className="text-slate-400 text-xs">
                      단계 {loadingMessageIndex + 1} / {loadingMessages.length}
                    </p>
                  </div>
                </motion.div>
              )}

              {step === 'done' && (
                <motion.div 
                  key="result"
                  initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                  className={`h-full flex flex-col bg-white rounded-3xl border border-white/60 shadow-lg overflow-hidden transition-all duration-500 ${isMobileView ? 'max-w-[375px] mx-auto border-4 border-slate-200' : ''}`}
                >
                  {/* 결과 헤더 */}
                  <div className={`px-4 md:px-6 py-4 border-b flex justify-between items-center transition-colors ${isBasicMode ? 'bg-orange-50/50 border-orange-100' : 'bg-blue-50/50 border-blue-100'}`}>
                    
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                        <button onClick={resetToHome} className={`p-2 -ml-2 text-slate-400 hover:bg-white/50 rounded-xl transition-all hover:${themeStyles.accentText} flex-shrink-0`} title="처음으로">
                          <RotateCcw className="w-5 h-5" />
                        </button>
                        <h2 className="font-bold text-lg text-slate-700 flex items-center gap-2 overflow-hidden">
                          <span className="truncate block">{keyword}</span> 
                        </h2>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-2">
                        {isEditing ? (
                          <>
                            <button onClick={cancelEditing} className="p-2 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-colors flex items-center gap-1 text-xs font-bold">
                              <XCircle className="w-4 h-4" /> 취소
                            </button>
                            <button onClick={saveEditing} className="p-2 bg-slate-800 text-white hover:bg-slate-900 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold shadow-sm">
                              <Save className="w-4 h-4" /> 저장
                            </button>
                          </>
                        ) : (
                          <>
                            <button onClick={() => setIsMobileView(!isMobileView)} className={`p-2 rounded-lg transition-colors ${isMobileView ? `${themeStyles.lightBg} ${themeStyles.accentText}` : 'text-slate-400 hover:bg-white'}`} title="모바일 미리보기">
                              {isMobileView ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                            </button>

                            <button onClick={startEditing} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors" title="내용 수정하기">
                              <PenLine className="w-5 h-5" />
                            </button>

                            <button onClick={handleDownloadThumbnail} className="p-2 text-slate-400 hover:text-pink-500 hover:bg-white rounded-lg transition-colors" title="썸네일 이미지 만들기">
                              <ImageIcon className="w-5 h-5" />
                            </button>

                            <button onClick={handleDownloadFile} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-white rounded-lg transition-colors" title="텍스트 파일로 저장">
                              <Download className="w-5 h-5" />
                            </button>
                        
                            <button onClick={handleCopyCleanText} className={`flex-shrink-0 flex items-center gap-2 font-bold transition-all rounded-xl shadow-sm transform active:scale-95 text-xs px-3 py-2 md:text-sm md:px-4 md:py-2 whitespace-nowrap ${copyStatus === 'copied' ? 'bg-green-500 text-white' : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'}`}>
                              {copyStatus === 'copied' ? <CheckCircle className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                              <span>{copyStatus === 'copied' ? '완료' : '복사'}</span>
                            </button>
                          </>
                        )}
                    </div>
                  </div>
                  
                  {/* 결과 본문 */}
                  <div className={`flex-1 overflow-y-auto p-8 custom-scrollbar bg-white/50 ${isMobileView ? 'text-sm' : ''}`}>
                    
                    {isEditing ? (
                      <textarea
                        value={editableResult}
                        onChange={(e) => setEditableResult(e.target.value)}
                        className={`w-full h-full min-h-[400px] p-4 bg-white border-2 rounded-xl focus:outline-none resize-none font-mono text-sm leading-relaxed ${themeStyles.focusRing} ${isBasicMode ? 'border-orange-200' : 'border-blue-200'}`}
                      />
                    ) : (
                      <div className={`prose prose-slate max-w-none 
                        prose-headings:text-slate-800 prose-headings:font-bold 
                        prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8
                        prose-p:text-slate-600 prose-p:leading-8 
                        prose-strong:font-bold
                        prose-li:text-slate-600 ${isBasicMode ? 'prose-h2:text-orange-600 prose-strong:text-orange-500 prose-li:marker:text-orange-300' : 'prose-h2:text-blue-600 prose-strong:text-blue-500 prose-li:marker:text-blue-300'}`}>
                        <ReactMarkdown>
                          {result.replace(/\\#/g, '#')}
                        </ReactMarkdown>
                      </div>
                    )}
                    
                    {/* 하단 정보 */}
                    <div className="mt-10 pt-6 border-t border-dashed border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                        <div className="flex flex-col gap-1 text-center md:text-left">
                          <span className="opacity-80">Briter AI가 작성한 초안입니다. ({isResultBasicMode ? '일반 모드' : '고성능 모드'})</span>
                          <span className={`font-bold ${themeStyles.accentText} tracking-tight`}>
                            Copyright 짤 Simsimpuri All Rights Reserved.
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 font-medium bg-white/50 px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-1.5">
                             <AlignLeft className="w-3 h-3" />
                             <span>공백포함 <b className={`text-slate-600 ${themeStyles.accentText}`}>{result.length}</b></span>
                          </div>
                          <span className="w-px h-3 bg-slate-300"></span>
                          <div>
                             <span>공백제외 <b className={`text-slate-600 ${themeStyles.accentText}`}>{result.replace(/\s/g, '').length}</b></span>
                          </div>
                        </div>
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>
        </div>
  );
}







