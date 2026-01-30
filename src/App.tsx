import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Sparkles, Search, Copy, Clock, Trash2, CheckCircle, RotateCcw, Menu, X, 
  Utensils, Plane, Shirt, Landmark, Smile, AlignLeft, Smartphone, Monitor, 
  Download, Image as ImageIcon, PenLine, Save, XCircle, UploadCloud, DownloadCloud, 
  Package, MessageSquarePlus, BarChart3 // BarChart3 아이콘 추가
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import html2canvas from 'html2canvas';
import { searchInfo, generateBlogPost, analyzeKeyword, type ThemeType } from './api'; // ✨ analyzeKeyword 추가
import { supabase } from './supabaseClient'; //DB 연동 추가

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
  { id: 'review', label: '제품/리뷰', icon: Package },
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

  // 편집 모드 상태
  const [isEditing, setIsEditing] = useState(false);
  const [editableResult, setEditableResult] = useState('');

  // AI 가이드 관련 상태
  const [useGuide, setUseGuide] = useState(false);
  const [guide, setGuide] = useState('');

  // ✨ [신규] 키워드 분석 상태
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState<{
    main: { keyword: string; totalSearch: number; totalClick: string; compIdx: string };
    recommendations: { keyword: string; totalSearch: number; totalClick: string; compIdx: string }[];
  } | null>(null);

  const thumbnailRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  /* localStorage 브라우저 캐시 사용하는 저장소 (DB로 변경)
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
  }, []);*/

  // 메뉴 바깥 클릭 시 닫기 기능
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Supabase DB 연동 로그인하면 DB에서 히스토리 가져오기
  useEffect(() => {
    // 1. 사용자 세션 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchHistory(session.user.id); // 👈 로그인 했으면 데이터 로드
    });

    // 2. 로그인 상태 변화 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchHistory(session.user.id); // 👈 로그인 시 로드
      } else {
        setHistory([]); // 👈 로그아웃 시 화면 비우기
      }
    });

    return () => subscription.unsubscribe();
  }, []);

    // Supabase DB에서 데이터 긁어오는 함수
      const fetchHistory = async (userId: string) => {
        const { data, error } = await supabase
          .from('posts')
          .select('*')
          .order('created_at', { ascending: false }) // 최신순 정렬
          .limit(10); // 10개만

        if (error) console.error('Error fetching history:', error);
        else if (data) {
          // DB 컬럼명과 앱 내 타입이 약간 다를 수 있으니 매핑
          const formatted: HistoryItem[] = data.map((item: any) => ({
            id: item.id,
            keyword: item.keyword,
            content: item.content,
            date: new Date(item.created_at).toLocaleDateString(),
            theme: item.theme as ThemeType,
            isTestMode: item.is_test_mode
          }));
          setHistory(formatted);
        }
      };


  // 260129_Supabase cheak
  useEffect(() => {
    console.log("Checking Supabase connection...");
    console.log("Supabase Client:", supabase);
  }, []);

  // ✨ 260129_사용자 로그인 상태
  const [user, setUser] = useState<any>(null);

  // ✨ [신규] 초기 실행 시 로그인 상태 확인
  useEffect(() => {
    // 1. 이미 로그인된 상태인지 확인
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // 2. 로그인/로그아웃 상태 변화 감지 (실시간)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ✨ [신규] 구글 로그인 핸들러
const handleLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        // 핵심: 현재 브라우저의 주소(Origin)로 돌아오라고 명시
        // 로컬에서는 localhost로, 배포환경에서는 vercel.app으로 자동 설정됨
        redirectTo: window.location.origin 
      }
    });
  };

  // ✨ 카카오 로그인 핸들러
  const handleKakaoLogin = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'kakao',
      options: { redirectTo: window.location.origin }
    });
  };

  // ✨ [신규] 로그아웃 핸들러
  const handleLogout = async () => {
    await supabase.auth.signOut();
    alert("로그아웃 되었습니다.");
  };

  /* local 사용 저장 로직 (DB 연동 후 미사용)
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
  */

  // Supabase DB에 저장하는 함수
  const saveToHistory = async (newKeyword: string, newContent: string) => {
    // 1. 로그인 안 했으면 저장 안 함 (또는 로컬에만 하거나)
    if (!user) return;

    // Supabase DB insert
    const { error } = await supabase
      .from('posts')
      .insert({
        user_id: user.id,
        keyword: newKeyword,
        content: newContent,
        theme: selectedTheme,
        is_test_mode: isTestMode
      });

    if (error) {
      console.error('저장 실패:', error);
      alert("저장에 실패했습니다.");
    } else {
      // 3. 저장 성공하면 목록 다시 불러오기
      fetchHistory(user.id);
    }
  };

  /* local 사용 삭제 로직 (DB 연동 후 미사용)
  const clearHistory = () => {
    if(confirm('모든 기록을 삭제하시겠습니까?')) {
      setHistory([]);
      localStorage.removeItem('blog_full_history');
    }
  };
  */

  // Supabase DB에 삭제하는 함수
  const clearHistory = async () => {
    if (!user) return;
    if (confirm('서버에 저장된 모든 기록을 삭제하시겠습니까?')) {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('user_id', user.id); // 내 아이디로 된 글만 삭제

      if (error) {
        alert("삭제 중 오류가 발생했습니다.");
      } else {
        setHistory([]);
      }
    }
  };

  const exportHistory = () => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(
      JSON.stringify(history)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `blog_master_backup_${new Date().toLocaleDateString()}.json`;
    link.click();
  };

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
              // localStorage.setItem('blog_full_history', JSON.stringify(parsedData));
              // 추후 기능 개발 필요
              alert("화면에는 복원되었지만, DB에는 저장되지 않았습니다.");
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
    setIsEditing(false);
  };

  const resetToHome = () => {
    setStep('idle');
    setKeyword('');
    setResult('');
    setAnalysisData(null); // 분석 데이터 초기화
    setIsMobileView(false);
    setIsEditing(false);
  };

// ✨ [신규] 키워드 분석 핸들러
  const handleAnalyze = async () => {
    // 🔒 [문지기] 로그인 안 했으면 여기서 멈춤!
    if (!user) {
      if (confirm("로그인이 필요한 서비스입니다.\n로그인하고 무료로 분석해볼까요?")) {
        handleLogin();
      }
      return; // 👈 핵심: 여기서 함수를 강제로 끝내버림 (아래 코드 실행 X)
    }

    if (!keyword.trim()) {
      alert("키워드를 입력해주세요!");
      return;
    }

    setIsAnalyzing(true);
    setAnalysisData(null); // 기존 결과 초기화

    try {
      const data = await analyzeKeyword(keyword);
      setAnalysisData(data);
    } catch (error) {
      alert("분석에 실패했습니다. API 키 설정을 확인하거나 잠시 후 시도해주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 📊 [핵심] 사용량 체크 및 카운트 증가 함수
  const checkAndIncrementUsage = async (userId: string): Promise<boolean> => {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD 형식 (UTC 기준)

    // 1. 내 정보(Profile) 가져오기 (Select)
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !profile) {
      console.error("프로필 조회 실패:", error);
      return false; // 안전을 위해 실패 시 차단
    }

    // 2. 날짜가 지났으면 초기화 (Lazy Reset)
    // DB에 저장된 날짜와 오늘이 다르면 -> 카운트 0으로 리셋
    if (profile.last_used_date !== today) {
      const { error: resetError } = await supabase
        .from('profiles')
        .update({ daily_count: 0, last_used_date: today })
        .eq('id', userId);
      
      if (resetError) console.error("날짜 리셋 실패", resetError);
      
      // 메모리 상의 프로필도 0으로 초기화해줌
      profile.daily_count = 0; 
    }

    // 3. 한도 체크 (Validation)
    if (profile.daily_count >= profile.max_daily_count) {
      alert(`오늘 무료 사용량(${profile.max_daily_count}회)을 모두 쓰셨네요! 😭\n내일 다시 이용해주세요!`);
      return false; // 사용 불가
    }

    // 4. 사용량 1 증가 (Increment)
    // 오라클과 달리 여기서는 '현재값 + 1'을 직접 계산해서 업데이트합니다.
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ daily_count: profile.daily_count + 1 })
      .eq('id', userId);

    if (updateError) {
      console.error("카운트 증가 실패", updateError);
      return false;
    }

    return true; // 사용 가능!
  };

  const handleGenerate = async () => {
      // 1. 비로그인 차단
      if (!user) {
          if (confirm("로그인이 필요한 서비스입니다.\n로그인하고 이용해보세요!")) {
            // 모달을 띄우거나 로그인 유도
          }
          return;
      }

      // 사용량 체크
      // checkAndIncrementUsage 함수가 false를 리턴하면(한도초과) 여기서 멈춤
      const isAllowed = await checkAndIncrementUsage(user.id);
      if (!isAllowed) return;
    
    if (!keyword.trim()) {
      alert("키워드를 입력해주세요!");
      return;
    }

    setIsLoading(true);
    setResult('');
    setCopyStatus('idle');
    try {
      setStep('searching');
      const searchData = await searchInfo(keyword, isTestMode, selectedTheme);
      
      setStep('writing');
      const blogPost = await generateBlogPost(
        keyword, 
        searchData, 
        selectedTheme, 
        useGuide ? guide : undefined
      );
      
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

  const startEditing = () => {
    setEditableResult(result);
    setIsEditing(true);
  };

  const saveEditing = () => {
    setResult(editableResult);
    setIsEditing(false);
  };

  const cancelEditing = () => {
    setIsEditing(false);
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br ${themeStyles.bg} flex items-center justify-center p-4 md:p-6 text-slate-700 font-sans transition-colors duration-700 ${themeStyles.selection}`}>
      
      {/* 썸네일 생성용 디자인 (보이지 않음) */}
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
               {/* 여기부터 구글 로그인 로직 */}
               {user ? (
                 <div className="flex items-center gap-3">
                   <div className="flex items-center gap-2">
                     {/* 프로필 이미지 (있으면) */}
                     {user.user_metadata.avatar_url && (
                       <img src={user.user_metadata.avatar_url} alt="Profile" className="w-6 h-6 rounded-full border border-slate-200" />
                     )}
                     <span className="text-xs font-bold text-slate-700">
                       {user.user_metadata.full_name || user.email?.split('@')[0]}님
                     </span>
                   </div>
                   <button 
                     onClick={handleLogout}
                     className="text-[10px] bg-slate-200 hover:bg-slate-300 text-slate-600 px-2 py-1 rounded-md transition-colors font-bold"
                   >
                     로그아웃
                   </button>
                 </div>
               ) : (
                 <button 
                   onClick={handleLogin}
                   className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-slate-200 shadow-sm hover:bg-slate-50 transition-all active:scale-95 group`}
                 >
                   {/* 구글 G 로고 (SVG) */}
                   <svg className="w-3.5 h-3.5" viewBox="0 0 24 24">
                     <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                     <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                     <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                     <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                   </svg>
                   <span className="text-xs font-bold text-slate-600 group-hover:text-slate-800">구글 로그인</span>
                 </button>
               )}

          {/* 카카오 로그인 버튼 */}
            <button 
              onClick={handleKakaoLogin}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#FEE500] border border-[#FEE500] shadow-sm hover:bg-[#FDD835] transition-all active:scale-95 group text-slate-900"
            >
              {/* 카카오 말풍선 아이콘 SVG */}
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 3C5.925 3 1 6.925 1 11.772c0 2.91 1.879 5.48 4.788 7.02-.215.79-.785 2.87-0.9 3.32-.14.545.2.535.42.355.285-.235 4.545-3.085 5.17-3.52.505.075 1.025.115 1.522.115 6.075 0 11-3.925 11-8.772C23 6.925 18.075 3 12 3z"/>
              </svg>
              <span className="text-xs font-bold text-slate-900/90">카카오 로그인</span>
            </button>

            <div className="relative" ref={menuRef}>
              <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2.5 bg-white border border-white/60 shadow-sm text-slate-500 hover:${themeStyles.accentText} rounded-full transition-all active:scale-95`}
              >
                {isMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              
            </div>

              <AnimatePresence>
                {isMenuOpen && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-3 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 z-50 overflow-hidden ring-1 ring-slate-900/5 origin-top-right"
                  >
                    
                    {/* ✨ [1] 모바일 전용: 프로필 및 로그인 영역 (PC에서는 헤더에 있으므로 md:hidden) */}
                    <div className="md:hidden px-5 py-4 bg-slate-50/80 border-b border-slate-100">
                      {user ? (
                        <div className="flex flex-col gap-3">
                          <div className="flex items-center gap-3">
                            {user.user_metadata.avatar_url ? (
                              <img src={user.user_metadata.avatar_url} alt="Profile" className="w-10 h-10 rounded-full border border-white shadow-sm" />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-lg">
                                {user.email?.[0].toUpperCase()}
                              </div>
                            )}
                            <div className="flex flex-col">
                              <span className="text-sm font-bold text-slate-800">
                                {user.user_metadata.full_name || user.email?.split('@')[0]}님
                              </span>
                              <span className="text-[10px] text-slate-400">{user.email}</span>
                            </div>
                          </div>
                          <button 
                            onClick={handleLogout}
                            className="w-full py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-600 shadow-sm hover:bg-slate-50 transition-colors"
                          >
                            로그아웃
                          </button>
                        </div>
                      ) : (
                        <div>
                          <p className="text-xs text-slate-400 mb-2 font-medium">로그인하고 기록을 저장하세요!</p>
                          <button 
                            onClick={handleLogin}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 transition-all active:scale-95"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24">
                                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                            </svg>
                            <span className="text-sm font-bold text-slate-700">구글 로그인</span>
                          </button>
                        </div>
                      )}
                    </div>

                    {/* ✨ [2] 모바일 전용: 바로가기 링크들 (md:hidden) */}
                    <div className="md:hidden p-2 grid grid-cols-2 gap-1 border-b border-slate-100 bg-white">
                        <a href={`https://blog.naver.com/${MY_BLOG_ID}`} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-50 transition-colors gap-1 text-slate-600">
                           <img src="https://blog.naver.com/favicon.ico" className="w-5 h-5 opacity-70" alt="blog" />
                           <span className="text-xs font-bold">내 블로그</span>
                        </a>
                         <a href={MY_INFLUENCER_URL} target="_blank" rel="noreferrer" className="flex flex-col items-center justify-center p-3 rounded-xl hover:bg-slate-50 transition-colors gap-1 text-slate-600">
                           <span className="text-lg">👑</span>
                           <span className="text-xs font-bold">인플루언서</span>
                        </a>
                         <a href={`https://blog.naver.com/PostWriteForm.naver?blogId=${MY_BLOG_ID}`} target="_blank" rel="noreferrer" className={`col-span-2 flex items-center justify-center gap-2 p-3 rounded-xl hover:bg-blue-50 transition-colors ${themeStyles.accentText} font-bold bg-slate-50`}>
                           <PenLine className="w-4 h-4" />
                           <span className="text-xs">블로그 글쓰기 바로가기</span>
                        </a>
                    </div>
                    
                    {/* ✨ [3] 기존 설정 메뉴들 (Settings) */}
                    <div className="px-4 py-3 bg-white">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Settings</p>
                      
                      {/* 토큰 모드 */}
                      <button 
                        onClick={() => setIsTestMode(!isTestMode)}
                        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors group"
                      >
                        <div className="flex flex-col items-start">
                          <span className={`text-sm font-bold ${isTestMode ? 'text-orange-500' : 'text-slate-600'}`}>
                            {isTestMode ? '테스트 모드 (ON)' : '실전 모드 (OFF)'}
                          </span>
                        </div>
                        <div className={`w-9 h-5 rounded-full relative transition-colors ${isTestMode ? 'bg-orange-400' : 'bg-slate-200'}`}>
                          <div className={`w-3.5 h-3.5 bg-white rounded-full shadow-sm absolute top-0.5 transition-all ${isTestMode ? 'left-5' : 'left-0.5'}`} />
                        </div>
                      </button>

                      <div className="my-1 border-t border-slate-100" />

                      {/* 백업 및 복원 메뉴 */}
                      <button onClick={exportHistory} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-600">
                        <DownloadCloud className="w-4 h-4 text-slate-400" /> 기록 백업하기
                      </button>
                      
                      <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm text-slate-600">
                        <UploadCloud className="w-4 h-4 text-slate-400" /> 기록 복원하기
                      </button>
                      <input type="file" ref={fileInputRef} onChange={importHistory} className="hidden" accept=".json" />

                      <div className="my-1 border-t border-slate-100" />

                      <button 
                        onClick={clearHistory}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-500 transition-colors text-sm"
                      >
                        <Trash2 className="w-4 h-4" /> 기록 전체 삭제
                      </button>
                    </div>
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
                {/* ✨ 모바일: grid-cols-3 (3개씩), PC: grid-cols-6 (6개씩) */}
                <div className="grid grid-cols-3 md:grid-cols-6 gap-2 md:gap-3">
                  {THEMES.map((theme) => {
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
                    <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${isTestMode ? 'from-orange-300 to-yellow-400' : 'from-sky-300 to-blue-400'} blur opacity-20 group-hover:opacity-40 transition-opacity`}></div>
                    <input 
                      type="text" 
                      value={keyword}
                      onChange={(e) => setKeyword(e.target.value)}
                      placeholder={`${THEMES.find(t=>t.id===selectedTheme)?.label.split('/')[0]} 키워드 입력`}
                      className={`relative w-full px-6 py-4 text-lg bg-white border rounded-2xl focus:outline-none focus:ring-4 shadow-lg text-slate-700 placeholder:text-slate-300 transition-all ${themeStyles.border} ${themeStyles.focusRing}`}
                      onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleGenerate()}
                    />
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

                {/* ✨ 가이드 입력 아코디언 */}
                <div className="relative px-2">
                   <button 
                     onClick={() => setUseGuide(!useGuide)}
                     className={`flex items-center gap-2 text-sm font-medium transition-colors ${useGuide ? themeStyles.accentText : 'text-slate-400 hover:text-slate-600'}`}
                   >
                     <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${useGuide ? `${isTestMode ? 'bg-orange-500 border-orange-500' : 'bg-blue-500 border-blue-500'}` : 'bg-white border-slate-300'}`}>
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
                    <span className={`${themeStyles.accentText} font-semibold`}>제품 리뷰</span>부터 <span className={`${themeStyles.accentText} font-semibold`}>맛집 탐방</span>까지.<br/>
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