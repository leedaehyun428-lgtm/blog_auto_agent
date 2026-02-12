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
}

interface WritingSectionProps {
  step: 'idle' | 'searching' | 'writing' | 'done';
  isLoading: boolean;
  isAnalyzing: boolean;
  mode: GenerateMode;
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
  return (
                <div className="p-4 md:p-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          
          {step !== 'done' && (
            <div className="w-full max-w-2xl mx-auto mt-4 transition-all duration-500">
              
              {/* 테마 선택 */}
              <div className="mb-8">
                <p className="text-center text-sm font-medium text-slate-400 mb-4">오늘의 포스팅 주제는 무엇인가요?</p>
                {/* ✨ 모바일: grid-cols-3 (3개씩), PC: grid-cols-6 (6개씩) */}
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
                    )
                  })}
                </div>
              </div>

             {/* ✨ 검색창 & 분석 버튼 영역 */}
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
                  
                  {/* 버튼 영역 (모바일에서는 가로로 꽉 차게, PC에서는 내용물만큼만) */}
                  <div className="flex gap-2 w-full md:w-auto">
                      {/* 📊 분석 버튼 (모바일: flex-1로 반반 차지) */}
                      <button 
                        onClick={handleAnalyze}
                        disabled={isAnalyzing || isLoading}
                        className="flex-1 md:flex-none px-4 py-4 bg-slate-800 text-white rounded-2xl font-bold shadow-lg hover:bg-slate-700 active:scale-95 disabled:opacity-50 transition-all flex flex-col items-center justify-center min-w-[80px]"
                      >
                        {isAnalyzing ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <BarChart3 className="w-6 h-6" />}
                        <span className="text-[10px] mt-1 font-medium">분석</span>
                      </button>

                      {/* ✨ 생성 버튼 (모바일: flex-1로 반반 차지) */}
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

                {/* 📊 분석 결과 리포트 (분석 완료 시 표시) */}
                <AnimatePresence>
                  {analysisData && (
                    <motion.div 
                      initial={{ opacity: 0, y: -10, height: 0 }} 
                      animate={{ opacity: 1, y: 0, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-white/80 backdrop-blur-md rounded-2xl border border-slate-200 p-5 shadow-sm space-y-4">
                        
                        {/* 1. 내 키워드 진단 */}
                        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                          <div>
                            <span className="text-xs font-bold text-slate-400 uppercase">Current Keyword</span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-lg font-bold text-slate-800">{analysisData.main.keyword}</span>
                              {analysisData.main.compIdx === 'HIGH' && <span className="text-[10px] font-bold bg-red-100 text-red-600 px-2 py-0.5 rounded-full">🔥 경쟁높음</span>}
                              {analysisData.main.compIdx === 'MID' && <span className="text-[10px] font-bold bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">⚡ 경쟁중간</span>}
                              {analysisData.main.compIdx === 'LOW' && <span className="text-[10px] font-bold bg-green-100 text-green-600 px-2 py-0.5 rounded-full">🍀 경쟁낮음</span>}
                            </div>
                          </div>
                          <div className="flex gap-4 text-right">
                            <div>
                              <p className="text-xs text-slate-400 mb-0.5">월간 검색수</p>
                              <p className="font-bold text-slate-700">{analysisData.main.totalSearch.toLocaleString()}</p>
                            </div>
                            <div>
                              <p className="text-xs text-slate-400 mb-0.5">클릭수</p>
                              <p className="font-bold text-slate-700">{analysisData.main.totalClick}</p>
                            </div>
                          </div>
                        </div>

                        {/* 2. 황금 키워드 추천 */}
                        <div>
                           <div className="flex items-center gap-2 mb-3">
                             <Sparkles className="w-4 h-4 text-yellow-500" />
                             <span className="text-sm font-bold text-slate-600">AI 추천 황금 키워드 (클릭하여 교체)</span>
                           </div>
                           
                           <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                             {analysisData.recommendations.length > 0 ? (
                               analysisData.recommendations.map((item, idx) => (
                                 <button 
                                   key={idx}
                                   onClick={() => {
                                     setKeyword(item.keyword);
                                     handleAnalyze(); // 교체 후 바로 재분석
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
                                 추천할 만한 연관 키워드가 없네요 😅 <br/> 다른 키워드로 시도해보세요!
                               </div>
                             )}
                           </div>
                        </div>

                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* ... 기존 키워드 분석 결과 아래에 추가 ... */}

                {/* 🏆 상위 노출 전략 가이드 (New) */}
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
                        <p className="text-[9px] text-blue-500 font-bold">자연스럽게</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-[10px] text-slate-400 bg-slate-100 p-2 rounded-lg flex items-center gap-2">
                      <span>💡</span>
                      <span>
                        상위 블로거들은 평균 <b>{exposureGuide.charCount}자</b>를 쓰고 있습니다. 
                        비슷한 분량으로 작성하면 노출 확률이 올라갑니다!
                      </span>
                    </div>
                  </div>
                )}

                {/* ✨ 가이드 입력 아코디언 */}
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
                             {/* ✨ [추가된 부분] 말투 선택 및 저장 영역 */}
                            <div className="flex gap-2 mb-2 mt-2">
                              <select 
                                value={selectedPromptId}
                                onChange={(e) => {
                                  const pid = e.target.value;
                                  setSelectedPromptId(pid);
                                  if (!pid) { setGuide(''); return; }

                                  // 1. 내 저장 목록에서 찾기
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
                                <option value="">📋 저장된 말투 불러오기...</option>
                                
                                {/* ✨ [추가] 기본 제공 프리셋 */}
                                <optgroup label="✨ Briter AI 추천 프리셋">
                                  {defaultPrompts.map(p => (
                                    <option key={p.id} value={p.id}>{p.title}</option>
                                  ))}
                                </optgroup>

                                {/* 기존 내 말투 목록 */}
                                {prompts.length > 0 && (
                                  <optgroup label="📂 내 저장 목록">
                                    {prompts.map(p => (
                                      <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                  </optgroup>
                                )}
                              </select>

                              {/* ✨ [삭제] 버튼 추가: 선택된 게 있을 때만 보임 */}
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
                              placeholder="예시: '30대 직장인 말투로 써줘...' / '업체에서 준 가이드를 여기에 붙여넣으세요...'"
                              className={`w-full mt-3 p-4 rounded-xl border bg-white/50 focus:bg-white text-sm text-slate-600 placeholder:text-slate-300 focus:outline-none focus:ring-2 resize-none h-40 transition-all ${themeStyles.border} ${themeStyles.focusRing}`}
                            />
                            
                            {/* ✨ 글자 수 카운터 */}
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

              {/* ✨ [추가] 말투 저장 팝업 (모달) */}
              {isPromptModalOpen && (
                <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4">
                  <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in-up">
                    <h3 className="text-lg font-bold text-slate-800 mb-2">나만의 말투 저장</h3>
                    <p className="text-xs text-slate-500 mb-4">현재 작성한 가이드를 저장해두고 계속 쓰세요!</p>
                    
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

              {/* 히스토리 */}
              {history.length > 0 && !isLoading && (
                <div className="animate-fade-in-up px-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Clock className="w-3 h-3" /> Recent Drafts
                    </div>
                  </div>
                  {/* 히스토리 영역 수정 */}
                  <div className="flex flex-wrap gap-2">
                    {history.map((item) => (
                      <div // button을 div로 감싸거나, button 안에 로직 수정
                        key={item.id}
                        className={`relative pl-4 pr-2 py-2 bg-white/60 hover:bg-white border border-white/50 rounded-full text-sm text-slate-500 shadow-sm hover:shadow-md transition-all flex items-center gap-2 group hover:${themeStyles.border} cursor-pointer`}
                        onClick={() => loadFromHistory(item)} // 클릭하면 불러오기
                      >
                        <span className={`w-1.5 h-1.5 rounded-full bg-slate-300 transition-colors group-hover:${item.mode === 'basic' ? 'bg-orange-400' : 'bg-blue-400'}`}></span>
                        <span className={`group-hover:${themeStyles.accentText} mr-1`}>{item.keyword}</span>
                        
                        {/* ✨ [X] 삭제 버튼 추가 */}
                        <button
                          onClick={(e) => deleteHistoryItem(e, item.id)}
                          className="p-1 rounded-full hover:bg-red-100 text-slate-300 hover:text-red-500 transition-colors"
                          title="삭제"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
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
                    주제를 선택하고 키워드를 던져주세요.<br/>
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
                      {step === 'searching' ? '정보를 모으고 있어요...' : '글을 다듬고 있어요...'}
                    </h3>
                    <p className="text-slate-400 text-sm">
                        {step === 'searching' ? '최신 리뷰와 꿀팁을 찾는 중 🔍' : '소녀 감성 한 스푼 넣는 중 ✨'}
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
                            Copyright © Simsimpuri All Rights Reserved.
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-3 font-medium bg-white/50 px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm">
                          <div className="flex items-center gap-1.5">
                             <AlignLeft className="w-3 h-3" />
                             <span>공백포함 <b className={`text-slate-600 ${themeStyles.accentText}`}>{result.length}</b></span>
                          </div>
                          <span className="w-px h-3 bg-slate-300"></span>
                          <div>
                             <span>제외 <b className={`text-slate-600 ${themeStyles.accentText}`}>{result.replace(/\s/g, '').length}</b></span>
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




