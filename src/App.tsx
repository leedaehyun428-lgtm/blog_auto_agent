import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Search, Copy, Clock, Trash2, CheckCircle, RotateCcw, Menu, X, Utensils, Plane, Shirt, Landmark, Smile, AlignLeft, Smartphone, Monitor, Download, Image as ImageIcon, PenLine, Save, XCircle, UploadCloud, DownloadCloud } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { searchInfo, generateBlogPost, type ThemeType } from './api';

const MY_BLOG_ID = 'leedh428';
const MY_INFLUENCER_URL = 'https://in.naver.com/simsimpuri';

interface HistoryItem {
  id: number;
  keyword: string;
  content: string;
  date: string;
  theme: ThemeType;
  isTestMode: boolean;
}

const THEMES: { id: ThemeType; label: string; icon: any }[] = [
  { id: 'restaurant', label: '맛집/카페', icon: Utensils },
  { id: 'travel', label: '여행/명소', icon: Plane },
  { id: 'fashion', label: '패션/뷰티', icon: Shirt },
  { id: 'finance', label: '금융/정보', icon: Landmark },
  { id: 'daily', label: '일상/생각', icon: Smile },
];

function App() {
  const [keyword, setKeyword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [step, setStep] = useState<'idle' | 'searching' | 'writing' | 'done'>('idle');
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('restaurant');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [isTestMode, setIsTestMode] = useState(true); 
  const [resultIsTestMode, setResultIsTestMode] = useState(true);
  
  const [isMobileView, setIsMobileView] = useState(false);

  // ✨ 수정 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editableResult, setEditableResult] = useState('');

  const thumbnailRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null); // 파일 업로드용

  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [copyStatus, setCopyStatus] = useState('idle');

  const themeStyles = isTestMode ? {
    bg: "from-orange-50 via-amber-50 to-yellow-50",
    containerBorder: "border-orange-100",
    accentText: "text-orange-600",
    subText: "text-orange-400",
    button: "bg-gradient-to-br from-orange-400 to-amber-500 shadow-orange-200",
    ring: "ring-orange-400",
    lightBg: "bg-orange-50",
    iconBg: "bg-orange-100 text-orange-600",
    border: "border-orange-200",
    focusRing: "focus:ring-orange-200",
    selection: "selection:bg-orange-200"
  } : {
    bg: "from-blue-50 via-indigo-50 to-purple-50",
    containerBorder: "border-white/50",
    accentText: "text-blue-600",
    subText: "text-blue-400",
    button: "bg-gradient-to-br from-sky-400 to-blue-500 shadow-blue-200",
    ring: "ring-blue-400",
    lightBg: "bg-blue-50",
    iconBg: "bg-blue-100 text-blue-600",
    border: "border-blue-200",
    focusRing: "focus:ring-blue-200",
    selection: "selection:bg-blue-200"
  };

  useEffect(() => {
    const savedHistory = localStorage.getItem('blog_full_history');
    if (savedHistory) setHistory(JSON.parse(savedHistory));
    
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const saveToHistory = (newKeyword: string, newContent: string) => {
    const newItem: HistoryItem = {
      id: Date.now(),
      keyword: newKeyword,
      content: newContent,
      date: new Date().toLocaleDateString(),
      theme: selectedTheme,
      isTestMode: isTestMode
    };
    const updatedHistory = [newItem, ...history.filter(h => h.keyword !== newKeyword)].slice(0, 10);
    setHistory(updatedHistory);
    localStorage.setItem('blog_full_history', JSON.stringify(updatedHistory));
  };

  const clearHistory = () => {
    if(confirm('모든 기록을 삭제하시겠습니까?')) {
      setHistory([]);
      localStorage.removeItem('blog_full_history');
    }
  };

  // ✨ JSON 내보내기 (백업)
  const exportHistory = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(history)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `blog_master_backup_${new Date().toLocaleDateString()}.json`;
    link.click();
  };

  // ✨ JSON 가져오기 (복원)
  const importHistory = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        if (e.target?.result) {
          try {
            const parsedData = JSON.parse(e.target.result as string);
            if (Array.isArray(parsedData)) {
              setHistory(parsedData);
              localStorage.setItem('blog_full_history', JSON.stringify(parsedData));
              alert("성공적으로 복원되었습니다! 🎉");
            } else {
              alert("올바른 백업 파일이 아닙니다.");
            }
          } catch (error) {
            alert("파일을 읽는 중 오류가 발생했습니다.");
          }
        }
      };
    }
  };

  const loadFromHistory = (item: HistoryItem) => {
    setKeyword(item.keyword);
    setResult(item.content);
    setSelectedTheme(item.theme || 'restaurant');
    setResultIsTestMode(item.isTestMode ?? true); 
    setStep('done');
    setIsMobileView(false);
    setIsEditing(false); // 편집 모드 초기화
  };

  const resetToHome = () => {
    setStep('idle');
    setKeyword('');
    setResult('');
    setIsMobileView(false);
    setIsEditing(false);
  };

  const handleGenerate = async () => {
    if (!keyword) return;
    setIsLoading(true);
    setResult('');
    setCopyStatus('idle');
    try {
      setStep('searching');
      const searchData = await searchInfo(keyword, isTestMode, selectedTheme);
      setStep('writing');
      const blogPost = await generateBlogPost(keyword, searchData, selectedTheme);
      
      setResult(blogPost);
      setResultIsTestMode(isTestMode);
      setStep('done');
      saveToHistory(keyword, blogPost);
    } catch (error) {
      console.error(error);
      alert("오류가 발생했어요. 다시 시도해주세요!");
      setStep('idle');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadFile = () => {
    const element = document.createElement("a");
    const file = new Blob([result], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `${keyword}_블로그원고.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleDownloadThumbnail = async () => {
    if (!thumbnailRef.current) return;
    try {
      const canvas = await html2canvas(thumbnailRef.current, {
        scale: 2,
        backgroundColor: null,
        logging: false,
      });
      const link = document.createElement('a');
      link.download = `${keyword}_썸네일.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch (err) {
      console.error("썸네일 생성 실패:", err);
      alert("이미지 생성에 실패했어요.");
    }
  };

  const handleCopyCleanText = async () => {
    if (!result) return;
    try {
      let cleanText = result
        .replace(/^#+\s+/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/^\s*[-*+]\s+/gm, '• ')
        .replace(/^\||\|$/gm, '')
        .replace(/\|/g, ' ')
        .replace(/^---$/gm, '')
        .replace(/\n{3,}/g, '\n\n');

      await navigator.clipboard.writeText(cleanText);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch (err) {
      console.error('복사 실패:', err);
      alert('복사에 실패했습니다.');
    }
  };

  // ✨ 편집 모드 시작
  const startEditing = () => {
    setEditableResult(result);
    setIsEditing(true);
  };

  // ✨ 편집 내용 저장
  const saveEditing = () => {
    setResult(editableResult);
    setIsEditing(false);
  };

  // ✨ 편집 취소
  const cancelEditing = () => {
    setIsEditing(false);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeStyles.bg} flex items-center justify-center p-4 md:p-6 text-slate-700 font-sans transition-colors duration-700 ${themeStyles.selection}`}>
      
      {/* 썸네일 생성용 디자인 */}
      <div className="fixed left-[-9999px] top-0">
        <div 
          ref={thumbnailRef}
          className={`w-[1200px] h-[1200px] flex flex-col items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br ${isTestMode ? 'from-orange-50 to-amber-100' : 'from-blue-50 to-indigo-100'}`}
        >
          <div className={`absolute top-[-150px] right-[-150px] w-[600px] h-[600px] rounded-full blur-[100px] opacity-30 ${isTestMode ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
          <div className={`absolute bottom-[-150px] left-[-150px] w-[600px] h-[600px] rounded-full blur-[100px] opacity-30 ${isTestMode ? 'bg-yellow-400' : 'bg-purple-400'}`}></div>
          
          <div className="z-10 text-center flex flex-col items-center gap-10">
            <div className={`px-10 py-4 rounded-full text-4xl font-bold bg-white/80 backdrop-blur shadow-sm ${themeStyles.accentText}`}>
              {THEMES.find(t=>t.id===selectedTheme)?.label} Review
            </div>
            <h1 className="text-[180px] font-black text-slate-800 leading-none drop-shadow-sm tracking-tight" style={{ wordBreak: 'keep-all' }}>
              {keyword}
            </h1>
            <p className="text-5xl font-medium text-slate-500 mt-4 opacity-80">
              솔직하고 꼼꼼한 방문 후기 ✨
            </p>
          </div>
          <div className="absolute bottom-16 right-16 flex items-center gap-4 opacity-50">
            <div className={`w-5 h-5 rounded-full ${isTestMode ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
            <span className="text-4xl font-bold text-slate-400 tracking-widest">Blog Master AI</span>
          </div>
        </div>
      </div>

      <div className={`max-w-4xl w-full bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border ${themeStyles.containerBorder} min-h-[650px] flex flex-col overflow-hidden relative transition-all duration-500`}>
        
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between z-20">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={resetToHome}>
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white shadow-lg group-hover:scale-105 transition-transform ${themeStyles.button}`}>
              <Sparkles className="w-5 h-5" fill="currentColor" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-800 tracking-tight">Blog Master</h1>
              <p className={`text-[10px] font-bold tracking-widest uppercase ${themeStyles.subText}`}>
                {isTestMode ? 'Test Mode On' : 'AI Writing Assistant'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden md:flex items-center gap-4 bg-white/50 px-4 py-2 rounded-full border border-white/60 shadow-sm">
               <a href={`https://blog.naver.com/${MY_BLOG_ID}`} target="_blank" rel="noreferrer" className={`text-xs font-semibold text-slate-500 hover:${themeStyles.accentText} transition-colors`}>내 블로그</a>
               <span className="text-slate-300 text-[10px]">●</span>
               <a href={MY_INFLUENCER_URL} target="_blank" rel="noreferrer" className={`text-xs font-semibold text-slate-500 hover:${themeStyles.accentText} transition-colors`}>인플루언서</a>
               <span className="text-slate-300 text-[10px]">●</span>
               <a href={`https://blog.naver.com/PostWriteForm.naver?blogId=${MY_BLOG_ID}`} target="_blank" rel="noreferrer" className={`text-xs font-bold ${themeStyles.accentText} hover:opacity-80 transition-colors flex items-center gap-1`}>
                 글쓰기 →
               </a>
            </div>

            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2.5 bg-white border border-white/60 shadow-sm text-slate-500 hover:${themeStyles.accentText} rounded-full transition-all active:scale-95`}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.9 }}
                    className="absolute right-0 top-full mt-3 w-64 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-white/50 p-2 z-50 overflow-hidden ring-1 ring-slate-900/5"
                  >
                    <div className="px-4 py-3 border-b border-slate-100">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Settings</p>
                    </div>
                    
                    {/* 토큰 모드 */}
                    <button 
                      onClick={() => setIsTestMode(!isTestMode)}
                      className="w-full flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-50 transition-colors group"
                    >
                      <div className="flex flex-col items-start">
                        <span className={`text-sm font-bold ${isTestMode ? 'text-orange-500' : 'text-slate-600'}`}>
                          {isTestMode ? '테스트 모드 (ON)' : '실전 모드 (OFF)'}
                        </span>
                        <span className="text-[10px] text-slate-400">토큰 미사용 / 가짜 데이터</span>
                      </div>
                      <div className={`w-9 h-5 rounded-full relative transition-colors ${isTestMode ? 'bg-orange-400' : 'bg-slate-200'}`}>
                        <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${isTestMode ? 'left-5' : 'left-0.5'}`} />
                      </div>
                    </button>

                    <div className="my-1 border-t border-slate-100" />

                    {/* ✨ 백업 및 복원 메뉴 */}
                    <button onClick={exportHistory} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-600">
                      <DownloadCloud className="w-4 h-4 text-slate-400" /> 기록 백업하기
                    </button>
                    
                    <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-600">
                      <UploadCloud className="w-4 h-4 text-slate-400" /> 기록 복원하기
                    </button>
                    <input type="file" ref={fileInputRef} onChange={importHistory} className="hidden" accept=".json" />

                    <div className="my-1 border-t border-slate-100" />

                    <button 
                      onClick={clearHistory}
                      className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl hover:bg-red-50 text-red-500 transition-colors text-sm"
                    >
                      <Trash2 className="w-4 h-4" /> 기록 전체 삭제
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="p-4 md:p-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar">
          
          {step !== 'done' && (
            <div className="w-full max-w-2xl mx-auto mt-4 transition-all duration-500">
              
              {/* 테마 선택 */}
              <div className="mb-8">
                <p className="text-center text-sm font-medium text-slate-400 mb-4">오늘의 포스팅 주제는 무엇인가요?</p>
                <div className="grid grid-cols-5 gap-3">
                  {THEMES.map((theme) => {
                    const Icon = theme.icon;
                    const isSelected = selectedTheme === theme.id;
                    return (
                      <button
                        key={theme.id}
                        onClick={() => setSelectedTheme(theme.id)}
                        className={`flex flex-col items-center justify-center gap-2 p-3 rounded-2xl transition-all duration-300 ${
                          isSelected 
                            ? `bg-white shadow-lg shadow-slate-200 ring-2 ${themeStyles.ring} -translate-y-1` 
                            : 'bg-white/40 hover:bg-white/80 hover:shadow-md text-slate-400'
                        }`}
                      >
                        <div className={`p-2 rounded-full transition-colors ${isSelected ? themeStyles.iconBg : 'bg-slate-100 text-slate-400'}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <span className={`text-[11px] font-semibold ${isSelected ? 'text-slate-700' : 'text-slate-400'}`}>
                          {theme.label.split('/')[0]}
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* 검색창 */}
              <div className="relative mb-10 group">
                <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${isTestMode ? 'from-orange-300 to-yellow-400' : 'from-sky-300 to-blue-400'} blur opacity-20 group-hover:opacity-40 transition-opacity ${isLoading ? 'animate-pulse' : ''}`}></div>
                <input 
                  type="text" 
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  placeholder={`${THEMES.find(t=>t.id===selectedTheme)?.label.split('/')[0]} 키워드를 입력해보세요`}
                  className={`relative w-full pl-8 pr-16 py-6 text-lg bg-white border rounded-full focus:outline-none focus:ring-4 shadow-xl shadow-slate-100/50 text-slate-700 placeholder:text-slate-300 transition-all ${themeStyles.border} ${themeStyles.focusRing}`}
                  onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
                />
                <button 
                  onClick={handleGenerate}
                  disabled={isLoading}
                  className={`absolute right-3 top-3 p-3 text-white rounded-full shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:scale-100 transition-all duration-300 ${themeStyles.button}`}
                >
                  {isLoading ? <Sparkles className="w-6 h-6 animate-spin" /> : <Search className="w-6 h-6" />}
                </button>
              </div>

              {/* 히스토리 */}
              {history.length > 0 && !isLoading && (
                <div className="animate-fade-in-up px-2">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-wider">
                      <Clock className="w-3 h-3" /> Recent Drafts
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {history.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => loadFromHistory(item)}
                        className={`px-4 py-2 bg-white/60 hover:bg-white border border-white/50 rounded-full text-sm text-slate-500 shadow-sm hover:shadow-md transition-all flex items-center gap-2 group hover:${themeStyles.border}`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full bg-slate-300 transition-colors group-hover:${item.isTestMode ? 'bg-orange-400' : 'bg-blue-400'}`}></span>
                        <span className={`group-hover:${themeStyles.accentText}`}>{item.keyword}</span>
                      </button>
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
                    <span className={`${themeStyles.accentText} font-semibold`}>제목 추천</span>부터 <span className={`${themeStyles.accentText} font-semibold`}>해시태그</span>까지.<br/>
                    {isTestMode ? '테스트 모드라 안심하고 쓰세요!' : '감성 가득한 글을 써드릴게요.'} ☁️
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
                    <div className={`w-20 h-20 border-4 border-slate-100 rounded-full animate-spin border-t-${isTestMode ? 'orange' : 'blue'}-400`} />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className={`w-2 h-2 rounded-full animate-ping ${isTestMode ? 'bg-orange-400' : 'bg-blue-400'}`} />
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
                  <div className={`px-4 md:px-6 py-4 border-b flex justify-between items-center transition-colors ${isTestMode ? 'bg-orange-50/50 border-orange-100' : 'bg-blue-50/50 border-blue-100'}`}>
                    
                    <div className="flex items-center gap-2 overflow-hidden mr-2">
                        <button onClick={resetToHome} className={`p-2 -ml-2 text-slate-400 hover:bg-white/50 rounded-xl transition-all hover:${themeStyles.accentText} flex-shrink-0`} title="처음으로">
                          <RotateCcw className="w-5 h-5" />
                        </button>
                        <h2 className="font-bold text-lg text-slate-700 flex items-center gap-2 overflow-hidden">
                          <span className="truncate block">{keyword}</span> 
                        </h2>
                    </div>

                    <div className="flex items-center gap-1.5 md:gap-2">
                       {/* ✨ 수정 모드일 때는 [취소] [저장] 버튼 표시 */}
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
                            {/* 평소에는 툴바 버튼들 */}
                           <button onClick={() => setIsMobileView(!isMobileView)} className={`p-2 rounded-lg transition-colors ${isMobileView ? `${themeStyles.lightBg} ${themeStyles.accentText}` : 'text-slate-400 hover:bg-white'}`} title="모바일 미리보기">
                             {isMobileView ? <Smartphone className="w-5 h-5" /> : <Monitor className="w-5 h-5" />}
                           </button>

                           {/* ✨ 수정하기 버튼 추가 */}
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
                    
                    {/* ✨ 수정 모드일 때는 Textarea, 아닐 때는 Markdown */}
                    {isEditing ? (
                      <textarea
                        value={editableResult}
                        onChange={(e) => setEditableResult(e.target.value)}
                        className={`w-full h-full min-h-[400px] p-4 bg-white border-2 rounded-xl focus:outline-none resize-none font-mono text-sm leading-relaxed ${themeStyles.focusRing} ${isTestMode ? 'border-orange-200' : 'border-blue-200'}`}
                      />
                    ) : (
                      <div className={`prose prose-slate max-w-none 
                        prose-headings:text-slate-800 prose-headings:font-bold 
                        prose-h1:text-2xl prose-h2:text-xl prose-h2:mt-8
                        prose-p:text-slate-600 prose-p:leading-8 
                        prose-strong:font-bold
                        prose-li:text-slate-600 ${isTestMode ? 'prose-h2:text-orange-600 prose-strong:text-orange-500 prose-li:marker:text-orange-300' : 'prose-h2:text-blue-600 prose-strong:text-blue-500 prose-li:marker:text-blue-300'}`}>
                        <ReactMarkdown>{result}</ReactMarkdown>
                      </div>
                    )}
                    
                    {/* 하단 정보 */}
                    <div className="mt-10 pt-6 border-t border-dashed border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-slate-400">
                       <div className="flex flex-col gap-1 text-center md:text-left">
                          <span className="opacity-80">Blog Master AI가 작성한 초안입니다. ({resultIsTestMode ? '테스트 모드' : '실전 모드'})</span>
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
      </div>
    </div>
  );
}

export default App;