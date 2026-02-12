import { useState, useEffect, useRef, lazy, Suspense } from 'react';
import { X, Utensils, Plane, Shirt, Landmark, Smile, Package, Sparkles } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { type ThemeType } from './api';
import { supabase } from './supabaseClient';
import Header from './components/layout/Header';
import WalletModal from './components/WalletModal';
import Modal from './components/common/Modal';
import Toast, { type ToastType } from './components/common/Toast';
import { useAuth } from './hooks/useAuth';
import { useHistory } from './hooks/useHistory';
import { useGeneration } from './hooks/useGeneration';

interface PromptItem {
  id: string;
  title: string;
  system_prompt: string;
}

interface ConfirmOptions {
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  danger?: boolean;
}

interface ConfirmState {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  danger: boolean;
}

const AdminPage = lazy(() => import('./AdminPage'));
const WritingSection = lazy(() => import('./components/features/writing/WritingSection'));
const SPLASH_FADE_MS = 450;

const THEMES: { id: ThemeType; label: string; icon: LucideIcon }[] = [
  { id: 'restaurant', label: '맛집/카페', icon: Utensils },
  { id: 'travel', label: '여행/명소', icon: Plane },
  { id: 'review', label: '제품/리뷰', icon: Package },
  { id: 'fashion', label: '패션/뷰티', icon: Shirt },
  { id: 'finance', label: '금융/정보', icon: Landmark },
  { id: 'daily', label: '일상/생각', icon: Smile },
];

const DEFAULT_PROMPTS: PromptItem[] = [
  { id: 'preset_1', title: '📢 [기본] 친근한 리뷰어', system_prompt: '너는 20대 후반의 친근하고 활발한 블로거야. 이모티콘을 적절히 섞어서("ㅎㅎ", "ㅠㅠ" 등) 생동감 있게 작성해줘. 독자에게 말을 걸듯이 해요체를 사용해.' },
  { id: 'preset_2', title: '🧐 [기본] 전문적인 분석가', system_prompt: '너는 IT/테크/금융 전문 에디터야. 신뢰감을 주는 "하십시오"체와 "해요"체를 섞어서 정중하게 작성해. 객관적인 사실과 숫자를 강조해서 글을 써줘.' },
  { id: 'preset_3', title: '✨ [기본] 감성 인스타그래머', system_prompt: '너는 감성적인 사진과 글을 즐기는 인스타그래머야. 문장은 짧고 간결하게, 여운을 남기는 말투로 작성해. #해시태그를 센스 있게 배치해줘.' },
];

function App() {
  // --- [상태 관리: State] ---
  const [keyword, setKeyword] = useState('');
  const [keywordError, setKeywordError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState('');
  const [step, setStep] = useState<'idle' | 'searching' | 'writing' | 'done'>('idle');
  const [selectedTheme, setSelectedTheme] = useState<ThemeType>('restaurant');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  const [mode, setMode] = useState<'basic' | 'pro'>('basic');
  const [resultMode, setResultMode] = useState<'basic' | 'pro'>('basic');
  const [isMobileView, setIsMobileView] = useState(false);
  const isBasicMode = mode === 'basic';

  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editableResult, setEditableResult] = useState('');

  // AI 가이드 관련 상태
  const [useGuide, setUseGuide] = useState(false);
  const [guide, setGuide] = useState('');

  // 키워드 분석 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<{
    main: { keyword: string; totalSearch: number; totalClick: string; compIdx: string };
    recommendations: { keyword: string; totalSearch: number; totalClick: string; compIdx: string }[];
  } | null>(null);

  // Refs
  const thumbnailRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 히스토리 및 기타 상태
  const [copyStatus, setCopyStatus] = useState('idle');

  const [exposureGuide, setExposureGuide] = useState<{
    charCount: number;
    imgCount: number;
    keywordCount: number;
  } | null>(null);

  // 관리자 및 결제(볼트) 상태
  const [showAdmin, setShowAdmin] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [volts, setVolts] = useState(0); // ✨ [핵심] 볼트 잔액
  const [userGrade, setUserGrade] = useState('basic');

  // 말투(Persona) 관련 상태
  const [prompts, setPrompts] = useState<PromptItem[]>([]);
  const [selectedPromptId, setSelectedPromptId] = useState('');
  const [isPromptModalOpen, setIsPromptModalOpen] = useState(false);
  const [newPromptTitle, setNewPromptTitle] = useState('');

  // 내 블로그 설정 상태
  const [myBlogId, setMyBlogId] = useState('');
  const [myInfluencerUrl, setMyInfluencerUrl] = useState('');
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false); // 설정창 열기/닫기
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // [신규] 모달 안에서만 쓸 '임시 수정용' 변수
  const [editBlogId, setEditBlogId] = useState('');
  const [editInfluencerUrl, setEditInfluencerUrl] = useState('');

  // 모바일 로그인 오픈 여부
  const [isMobileLoginOpen, setIsMobileLoginOpen] = useState(false);
  const [toast, setToast] = useState<{ type: ToastType; message: string } | null>(null);
  const [confirmState, setConfirmState] = useState<ConfirmState>({
    isOpen: false,
    title: '',
    message: '',
    confirmText: '확인',
    cancelText: '취소',
    danger: false,
  });
  const confirmResolverRef = useRef<((result: boolean) => void) | null>(null);
  const [isBootLoading, setIsBootLoading] = useState(true);
  const [showSplash, setShowSplash] = useState(true);
  const [isSplashVisible, setIsSplashVisible] = useState(true);


  // 테마 스타일 정의
  const themeStyles = isBasicMode ? {
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

  const notify = (type: ToastType, message: string) => {
    setToast({ type, message });
  };

  const closeConfirm = (result: boolean) => {
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
    if (confirmResolverRef.current) {
      confirmResolverRef.current(result);
      confirmResolverRef.current = null;
    }
  };

  const requestConfirm = (options: ConfirmOptions) =>
    new Promise<boolean>((resolve) => {
      confirmResolverRef.current = resolve;
      setConfirmState({
        isOpen: true,
        title: options.title,
        message: options.message,
        confirmText: options.confirmText ?? '확인',
        cancelText: options.cancelText ?? '취소',
        danger: options.danger ?? false,
      });
    });

  const handleKeywordChange = (value: string) => {
    setKeyword(value);
    if (keywordError) setKeywordError('');
  };

  const {
    user,
    isAuthLoading,
    handleLogin,
    handleKakaoLogin,
    handleLogout: authLogout,
  } = useAuth();

  const {
    history,
    setHistory,
    fetchHistory,
    saveToHistory,
    clearHistory,
    deleteHistoryItem,
    loadFromHistory,
    exportHistory,
    importHistory,
  } = useHistory({
    user,
    selectedTheme,
    mode,
    notify,
    requestConfirm,
    setKeyword: handleKeywordChange,
    setResult,
    setSelectedTheme,
    setResultMode,
    setStep,
    setIsMobileView,
    setIsEditing,
  });

  const {
    handleAnalyze,
    handleGenerate,
    resetToHome,
  } = useGeneration({
    user,
    keyword,
    setKeywordError,
    mode,
    selectedTheme,
    useGuide,
    guide,
    volts,
    handleLogin,
    requestConfirm,
    saveToHistory,
    setVolts,
    setIsLoading,
    setResult,
    setCopyStatus,
    setStep,
    setResultMode,
    setIsAnalyzing,
    setAnalysisData,
    setExposureGuide,
    setKeyword: handleKeywordChange,
    setIsMobileView,
    setIsEditing,
    setGuide,
    setUseGuide,
    setSelectedPromptId,
    notify,
  });

  // 메뉴 닫기 이벤트 핸들러
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isProfileModalOpen || isWalletModalOpen) return;
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isProfileModalOpen, isWalletModalOpen]);

  useEffect(() => {
    return () => {
      if (confirmResolverRef.current) {
        confirmResolverRef.current(false);
        confirmResolverRef.current = null;
      }
    };
  }, []);

  // --------------- [데이터 가져오기 함수들 (Data Fetching)] ---------------

  // 1. 관리자 여부 체크
  const checkAdmin = async (id: string) => {
    const { data } = await supabase.from('profiles').select('grade').eq('id', id).single();
    if (data && data.grade === 'admin') {
      setIsAdmin(true);
    } else {
      setIsAdmin(false);
      setShowAdmin(false);
    }
  };

  // 2. 내 말투 목록 가져오기
  const fetchPrompts = async () => {
    const { data } = await supabase
      .from('user_prompts')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setPrompts(data as PromptItem[]);
  };

  // ✨ [수정됨] 내 볼트와 등급(Grade) 함께 가져오기
  const fetchUserData = async (userId: string) => {
      const { data } = await supabase
        .from('profiles')
        .select('volts, grade, blog_id, influencer_url') // 👈 여기 추가
        .eq('id', userId)
        .single();
      
      if (data) {
        setVolts(data.volts);
        setUserGrade(data.grade || 'basic');
        setMyBlogId(data.blog_id || '');             // 👈 저장
        setMyInfluencerUrl(data.influencer_url || ''); // 👈 저장
      }
    };

    // ✨ 저장 버튼 눌렀을 때만 DB & 화면 업데이트
      const handleUpdateProfile = async () => {
        if (!user) return;
        
        const { error } = await supabase
          .from('profiles')
          .update({ 
            blog_id: editBlogId,           // 임시 변수 값으로 DB 저장
            influencer_url: editInfluencerUrl 
          })
          .eq('id', user.id);

        if (error) {
          notify('error', '저장에 실패했습니다.');
        } else {
          notify('success', '내 정보가 저장되었습니다.');
          setMyBlogId(editBlogId);             // 성공하면 진짜 변수에 반영
          setMyInfluencerUrl(editInfluencerUrl);
          setIsProfileModalOpen(false);        // 창 닫기
        }
      };
  
  // --------------- [초기화 및 인증 로직 (Auth & Init)] ---------------
  useEffect(() => {
    let isMounted = true;

    const initializeUserData = async () => {
      try {
        if (isMounted) {
          setIsBootLoading(true);
        }

        if (user) {
          await supabase.from('profiles').update({
            email: user.email,
            user_name: user.user_metadata.full_name || user.email?.split('@')[0],
          }).eq('id', user.id);

          await Promise.all([
            fetchHistory(),
            checkAdmin(user.id),
            fetchPrompts(),
            fetchUserData(user.id),
          ]);
        } else {
          setHistory([]);
          setPrompts([]);
          setIsAdmin(false);
          setVolts(0);
          setUserGrade('basic');
        }
      } finally {
        if (isMounted) {
          setIsBootLoading(false);
        }
      }
    };

    initializeUserData();

    return () => {
      isMounted = false;
    };
  }, [user]); // eslint-disable-line react-hooks/exhaustive-deps

  const loading = isAuthLoading || isBootLoading;

  useEffect(() => {
    let fadeTimeout: ReturnType<typeof setTimeout> | undefined;

    if (loading) {
      setShowSplash(true);
      setIsSplashVisible(true);
      return undefined;
    }

    setIsSplashVisible(false);
    fadeTimeout = setTimeout(() => {
      setShowSplash(false);
    }, SPLASH_FADE_MS);

    return () => {
      if (fadeTimeout) clearTimeout(fadeTimeout);
    };
  }, [loading]);


  // --------------- [핸들러 함수들 (Handlers)] ---------------
  const handleLogout = async () => {
    await authLogout();

    setVolts(0);
    setUserGrade('basic');
    setMyBlogId('');
    setMyInfluencerUrl('');
    setIsAdmin(false);
    setHistory([]);

    notify('info', '로그아웃 되었습니다.');
  };

  const openProfileModal = () => {
    setEditBlogId(myBlogId);
    setEditInfluencerUrl(myInfluencerUrl);
    setIsProfileModalOpen(true);
  };
  const closeProfileModal = () => {
    setIsProfileModalOpen(false);
  };
  const openWalletModal = () => {
    setIsWalletModalOpen(true);
  };
  const closeWalletModal = () => {
    setIsWalletModalOpen(false);
  };

  // 말투 저장
  const handleSavePrompt = async () => {
    if (!user) return notify('error', '로그인이 필요합니다.');
    if (!guide.trim()) return notify('error', '저장할 내용이 없습니다.');
    if (!newPromptTitle.trim()) return notify('error', '말투의 별명을 입력해주세요.');

    const { error } = await supabase.from('user_prompts').insert({
      user_id: user.id,
      title: newPromptTitle,
      system_prompt: guide,
    });

    if (error) {
      notify('error', '저장에 실패했습니다.');
    } else {
      notify('success', '저장되었습니다.');
      setNewPromptTitle('');
      setIsPromptModalOpen(false);
      fetchPrompts();
    }
  };

  // 말투 삭제
  const handleDeletePrompt = async () => {
    if (!selectedPromptId) return notify('error', '삭제할 말투를 선택해주세요.');
    
    if (DEFAULT_PROMPTS.find(p => p.id === selectedPromptId)) {
      return notify('error', '기본 프리셋은 삭제할 수 없습니다.');
    }

    const shouldDelete = await requestConfirm({
      title: '말투 삭제',
      message: '정말 이 말투를 삭제하시겠습니까?',
      confirmText: '삭제',
      cancelText: '취소',
      danger: true,
    });
    if (!shouldDelete) return;

    const { error } = await supabase
      .from('user_prompts')
      .delete()
      .eq('id', selectedPromptId);

    if (error) {
      notify('error', '삭제에 실패했습니다.');
    } else {
      notify('success', '삭제되었습니다.');
      setSelectedPromptId('');
      setGuide('');
      if(user) fetchPrompts();
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
      const { default: html2canvas } = await import('html2canvas');
      const canvas = await html2canvas(thumbnailRef.current, { scale: 2, backgroundColor: null, logging: false });
      const link = document.createElement('a');
      link.download = `${keyword}_썸네일.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    } catch { notify('error', '이미지 생성 실패'); }
  };

  const handleCopyCleanText = async () => {
    if (!result) return;
    try {
      const cleanText = result
        .replace(/^#+\s+/gm, '')
        .replace(/\*\*(.*?)\*\*/g, '$1')
        .replace(/\*(.*?)\*/g, '$1')
        .replace(/`([^`]+)`/g, '$1')
        .replace(/\[(.*?)\]\(.*?\)/g, '$1')
        .replace(/^\s*[-*+]\s+/gm, '• ')
        .replace(/^\||\|$/gm, '')
        .replace(/\|/g, ' ')
        .replace(/^---$/gm, '')
        .replace(/\n{3,}/g, '\n\n')
        .replace(/\\#/g, '#');

      await navigator.clipboard.writeText(cleanText);
      setCopyStatus('copied');
      setTimeout(() => setCopyStatus('idle'), 2000);
    } catch { notify('error', '복사 실패'); }
  };

  const startEditing = () => { setEditableResult(result); setIsEditing(true); };
  const saveEditing = () => { setResult(editableResult); setIsEditing(false); };
  const cancelEditing = () => { setIsEditing(false); };

  if (showSplash) {
    return (
      <div
        className={`fixed inset-0 z-[200] flex items-center justify-center bg-white transition-opacity ${
          isSplashVisible ? 'opacity-100' : 'opacity-0'
        }`}
        style={{ transitionDuration: `${SPLASH_FADE_MS}ms` }}
      >
        <div className="flex flex-col items-center gap-4">
          <Sparkles className="h-12 w-12 text-orange-500 animate-splash-logo" />
          <p className="text-3xl font-bold tracking-tight text-slate-800 animate-splash-text">Briter AI</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeStyles.bg} flex items-center justify-center p-4 md:p-6 text-slate-700 font-sans transition-colors duration-700 ${themeStyles.selection}`}>
      
      {/* 썸네일 생성용 디자인 (보이지 않음) */}
      <div className="fixed left-[-9999px] top-0">
        <div 
          ref={thumbnailRef}
          className={`w-[1200px] h-[1200px] flex flex-col items-center justify-center p-12 relative overflow-hidden bg-gradient-to-br ${isBasicMode ? 'from-orange-50 to-amber-100' : 'from-blue-50 to-indigo-100'}`}
        >
          <div className={`absolute top-[-150px] right-[-150px] w-[600px] h-[600px] rounded-full blur-[100px] opacity-30 ${isBasicMode ? 'bg-orange-400' : 'bg-blue-400'}`}></div>
          <div className={`absolute bottom-[-150px] left-[-150px] w-[600px] h-[600px] rounded-full blur-[100px] opacity-30 ${isBasicMode ? 'bg-yellow-400' : 'bg-purple-400'}`}></div>
          
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
            <div className={`w-5 h-5 rounded-full ${isBasicMode ? 'bg-orange-500' : 'bg-blue-500'}`}></div>
            <span className="text-4xl font-bold text-slate-400 tracking-widest">Briter AI</span>
          </div>
        </div>
      </div>

      <div className={`max-w-4xl w-full bg-white/70 backdrop-blur-xl rounded-[2.5rem] shadow-2xl border ${themeStyles.containerBorder} min-h-[650px] flex flex-col overflow-hidden relative transition-all duration-500`}>
        <Header
          user={user}
          mode={mode}
          themeStyles={themeStyles}
          resetToHome={resetToHome}
          myBlogId={myBlogId}
          myInfluencerUrl={myInfluencerUrl}
          openProfileModal={openProfileModal}
          openWalletModal={openWalletModal}
          userGrade={userGrade}
          volts={volts}
          handleLogout={handleLogout}
          isMenuOpen={isMenuOpen}
          setIsMenuOpen={setIsMenuOpen}
          menuRef={menuRef}
          isAdmin={isAdmin}
          setShowAdmin={setShowAdmin}
          setMode={setMode}
          exportHistory={exportHistory}
          fileInputRef={fileInputRef}
          importHistory={importHistory}
          clearHistory={clearHistory}
          handleLogin={handleLogin}
          handleKakaoLogin={handleKakaoLogin}
          isMobileLoginOpen={isMobileLoginOpen}
          setIsMobileLoginOpen={setIsMobileLoginOpen}
        />

        <Suspense
          fallback={
            <div className="flex flex-1 items-center justify-center bg-white/70">
              <div className="flex flex-col items-center gap-3">
                <Sparkles className="h-8 w-8 text-orange-500 animate-splash-logo" />
                <p className="text-lg font-semibold text-slate-700 animate-splash-text">Briter AI</p>
              </div>
            </div>
          }
        >
          <WritingSection
            step={step}
            isLoading={isLoading}
            isAnalyzing={isAnalyzing}
            mode={mode}
            resultMode={resultMode}
            isMobileView={isMobileView}
            isEditing={isEditing}
            keyword={keyword}
            keywordError={keywordError}
            setKeyword={handleKeywordChange}
            selectedTheme={selectedTheme}
            setSelectedTheme={setSelectedTheme}
            themeStyles={themeStyles}
            themes={THEMES}
            handleAnalyze={handleAnalyze}
            handleGenerate={handleGenerate}
            analysisData={analysisData}
            exposureGuide={exposureGuide}
            useGuide={useGuide}
            setUseGuide={setUseGuide}
            selectedPromptId={selectedPromptId}
            setSelectedPromptId={setSelectedPromptId}
            prompts={prompts}
            defaultPrompts={DEFAULT_PROMPTS}
            guide={guide}
            setGuide={setGuide}
            handleDeletePrompt={handleDeletePrompt}
            setIsPromptModalOpen={setIsPromptModalOpen}
            isPromptModalOpen={isPromptModalOpen}
            newPromptTitle={newPromptTitle}
            setNewPromptTitle={setNewPromptTitle}
            handleSavePrompt={handleSavePrompt}
            history={history}
            loadFromHistory={loadFromHistory}
            deleteHistoryItem={deleteHistoryItem}
            resetToHome={resetToHome}
            cancelEditing={cancelEditing}
            saveEditing={saveEditing}
            startEditing={startEditing}
            setIsMobileView={setIsMobileView}
            handleDownloadThumbnail={handleDownloadThumbnail}
            handleDownloadFile={handleDownloadFile}
            handleCopyCleanText={handleCopyCleanText}
            copyStatus={copyStatus}
            result={result}
            editableResult={editableResult}
            setEditableResult={setEditableResult}
          />
        </Suspense>
      </div>

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-[120] w-full max-w-md -translate-x-1/2 px-4">
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        </div>
      )}

      <Modal
        isOpen={confirmState.isOpen}
        onClose={() => closeConfirm(false)}
        className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl"
      >
        <h3 className="text-lg font-bold text-slate-800">{confirmState.title}</h3>
        <p className="mt-2 whitespace-pre-line text-sm text-slate-600">{confirmState.message}</p>
        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={() => closeConfirm(false)}
            className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-100"
          >
            {confirmState.cancelText}
          </button>
          <button
            type="button"
            onClick={() => closeConfirm(true)}
            className={`rounded-xl px-4 py-2 text-sm font-bold text-white ${
              confirmState.danger ? 'bg-red-500 hover:bg-red-600' : 'bg-slate-800 hover:bg-slate-900'
            }`}
          >
            {confirmState.confirmText}
          </button>
        </div>
      </Modal>

      {/* ✨ 내 정보 설정 모달 */}
          {isProfileModalOpen && (
            <div className="fixed inset-0 bg-black/50 z-[80] flex items-center justify-center p-4">
              <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl animate-fade-in-up relative">
                <button onClick={closeProfileModal} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"><X className="w-5 h-5"/></button>
                <h3 className="text-lg font-bold text-slate-800 mb-1">내 블로그 정보 설정</h3>
                <p className="text-xs text-slate-400 mb-4">입력해두시면 바로가기 버튼이 자동으로 연결됩니다!</p>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">네이버 블로그 ID</label>
                    {/* ✨ [수정] value와 onChange를 editBlogId로 변경 */}
                    <input type="text" value={editBlogId} onChange={(e) => setEditBlogId(e.target.value)} placeholder="예: leedh428" className="w-full p-3 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600 mb-1 block">인플루언서 홈 URL (선택)</label>
                    {/* ✨ [수정] value와 onChange를 editInfluencerUrl로 변경 */}
                    <input type="text" value={editInfluencerUrl} onChange={(e) => setEditInfluencerUrl(e.target.value)} placeholder="https://in.naver.com/..." className="w-full p-3 border rounded-xl text-sm bg-slate-50 focus:bg-white focus:ring-2 focus:ring-blue-200 outline-none transition-all" />
                  </div>
                  <button onClick={handleUpdateProfile} className="w-full py-3 mt-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 transition-colors">
                    저장하기
                  </button>
                </div>
              </div>
            </div>
          )}

      {user && (
        <WalletModal
          isOpen={isWalletModalOpen}
          onClose={closeWalletModal}
          userId={user.id}
          currentVolts={volts}
        />
      )}

      {/* ✨ 4. 관리자 페이지 모달 (Props 추가됨!) */}
      {showAdmin && user && (
        <Suspense fallback={
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40">
            <div className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-slate-600 shadow-lg">관리자 페이지 로딩 중...</div>
          </div>
        }>
          <AdminPage
            onClose={() => setShowAdmin(false)}
            currentUserId={user.id}
            onMyGradeChanged={() => checkAdmin(user.id)}
          />
        </Suspense>
      )}
        </div>
      );
    }

export default App;
