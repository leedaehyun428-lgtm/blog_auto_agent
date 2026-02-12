import type { ChangeEvent, RefObject } from 'react';
import type { User } from '@supabase/supabase-js';
import { motion, AnimatePresence } from 'framer-motion';
import type { GenerateMode } from '../../api';
import {
  Sparkles,
  Menu,
  X,
  PenLine,
  UserCog,
  LogOut,
  LogIn,
  DownloadCloud,
  UploadCloud,
  Trash2,
} from 'lucide-react';

interface ThemeStyles {
  accentText: string;
  subText: string;
  button: string;
}

interface HeaderProps {
  user: User | null;
  mode: GenerateMode;
  themeStyles: ThemeStyles;
  resetToHome: () => void;
  myBlogId: string;
  myInfluencerUrl: string;
  openProfileModal: () => void;
  userGrade: string;
  volts: number;
  handleLogout: () => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (value: boolean) => void;
  menuRef: RefObject<HTMLDivElement | null>;
  isAdmin: boolean;
  setShowAdmin: (value: boolean) => void;
  setMode: (value: GenerateMode) => void;
  exportHistory: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  importHistory: (event: ChangeEvent<HTMLInputElement>) => void;
  clearHistory: () => void;
  handleLogin: () => void;
  handleKakaoLogin: () => void;
  isMobileLoginOpen: boolean;
  setIsMobileLoginOpen: (value: boolean) => void;
}

export default function Header({
  user,
  mode,
  themeStyles,
  resetToHome,
  myBlogId,
  myInfluencerUrl,
  openProfileModal,
  userGrade,
  volts,
  handleLogout,
  isMenuOpen,
  setIsMenuOpen,
  menuRef,
  isAdmin,
  setShowAdmin,
  setMode,
  exportHistory,
  fileInputRef,
  importHistory,
  clearHistory,
  handleLogin,
  handleKakaoLogin,
  isMobileLoginOpen,
  setIsMobileLoginOpen,
}: HeaderProps) {
  const isBasicMode = mode === 'basic';
  return (
    <div className="px-4 md:px-8 py-4 md:py-6 flex items-center justify-between z-20 relative">
      <div className="flex items-center gap-2 cursor-pointer group shrink-0" onClick={resetToHome}>
        <div className={`w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center text-white shadow-lg transition-transform ${themeStyles.button}`}>
          <Sparkles className="w-5 h-5" fill="currentColor" />
        </div>
        <div>
          <h1 className="text-lg md:text-xl font-extrabold text-slate-800 tracking-tight">Briter AI</h1>
          <p className={`text-[9px] md:text-[10px] font-bold tracking-widest uppercase whitespace-nowrap ${themeStyles.subText}`}>
            {isBasicMode ? 'Basic Mode' : 'Pro Mode'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {user && (
          <div className="hidden md:flex items-center gap-1 bg-white/40 px-2 py-1.5 rounded-2xl border border-white/50 shadow-sm backdrop-blur-sm mr-2">
            <button
              onClick={() => !myBlogId ? openProfileModal() : window.open(`https://blog.naver.com/${myBlogId}`, '_blank')}
              className={`p-2 rounded-lg transition-colors ${!myBlogId ? 'text-red-400 hover:bg-red-50 hover:text-red-500' : 'text-slate-500 hover:bg-green-50 hover:text-green-600'}`}
              title={myBlogId ? '내 블로그 열기' : '블로그 연동 필요'}
              aria-label={myBlogId ? '내 블로그 열기' : '블로그 연동 필요'}
            >
              <img src="https://blog.naver.com/favicon.ico" className="w-4 h-4 opacity-80" alt="Naver Blog" />
            </button>
            <button
              onClick={() => !myInfluencerUrl ? openProfileModal() : window.open(myInfluencerUrl, '_blank')}
              className={`p-2 rounded-lg transition-colors ${!myInfluencerUrl ? 'text-red-400 hover:bg-red-50 hover:text-red-500' : 'text-slate-500 hover:bg-purple-50 hover:text-purple-600'}`}
              title={myInfluencerUrl ? '인플루언서 홈 열기' : '인플루언서 연동 필요'}
              aria-label={myInfluencerUrl ? '인플루언서 홈 열기' : '인플루언서 연동 필요'}
            >
              <span className="block text-base leading-none">👑</span>
            </button>
            <button
              onClick={() => !myBlogId ? openProfileModal() : window.open(`https://blog.naver.com/PostWriteForm.naver?blogId=${myBlogId}`, '_blank')}
              className={`p-2 rounded-lg transition-colors hover:bg-blue-50 ${themeStyles.accentText}`}
              title={myBlogId ? '블로그 글쓰기' : '블로그 연동 필요'}
              aria-label={myBlogId ? '블로그 글쓰기' : '블로그 연동 필요'}
            >
              <PenLine className="w-4 h-4" />
            </button>
            <button
              onClick={openProfileModal}
              className="p-2 rounded-lg transition-colors text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              title="내 정보 설정"
              aria-label="내 정보 설정"
            >
              <UserCog className="w-4 h-4" />
            </button>
          </div>
        )}

        {user ? (
          <>
            <div className="hidden md:flex items-center gap-3 bg-white/80 px-4 py-2 rounded-2xl border border-white/60 shadow-sm backdrop-blur-md">
              <div className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase border tracking-wider ${
                  userGrade === 'admin' ? 'bg-slate-900 text-white border-slate-700' :
                  userGrade === 'pro' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                  'bg-green-100 text-green-600 border-green-200'
              }`}>
                {userGrade === 'admin' ? 'ADMIN' : userGrade === 'pro' ? 'PRO' : 'BASIC'}
              </div>

              <div className="flex items-center gap-1 px-2 py-0.5 bg-yellow-50 text-yellow-700 rounded-md text-xs font-bold border border-yellow-200 cursor-help" title="잔액 충전하기 (준비중)">
                <span>⚡</span><span>{volts.toLocaleString()}</span>
              </div>

              <div className="flex items-center gap-2 pl-2 border-l border-slate-200 ml-1">
                {user.user_metadata.avatar_url ? (
                  <img src={user.user_metadata.avatar_url} alt="Profile" referrerPolicy="no-referrer" className="w-6 h-6 rounded-full border border-slate-200 shadow-sm" />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center text-xs text-indigo-500 font-bold">{user.email?.[0].toUpperCase()}</div>
                )}
                <span className="text-xs font-bold text-slate-700 max-w-[80px] truncate">{user.user_metadata.full_name || '유저'}님</span>
                <button onClick={handleLogout} className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="로그아웃">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
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
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-3 w-72 bg-white/95 backdrop-blur-md rounded-2xl shadow-2xl border border-white/50 z-50 overflow-hidden ring-1 ring-slate-900/5 origin-top-right"
                  >
                    {isAdmin && (
                      <button onClick={() => setShowAdmin(true)} className="w-full flex items-center justify-center gap-2 px-4 py-3 mt-2 bg-slate-800 text-white rounded-xl font-bold hover:bg-slate-900 shadow-lg">
                        <UserCog className="w-4 h-4" /> 관리자 페이지 열기
                      </button>
                    )}

                    <div className="md:hidden px-5 py-4 bg-slate-50/80 border-b border-slate-100">
                      <div className="flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          {user.user_metadata.avatar_url ? (
                            <img src={user.user_metadata.avatar_url} referrerPolicy="no-referrer" className="w-10 h-10 rounded-full border border-white shadow-sm" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-500 font-bold text-lg">{user.email?.[0].toUpperCase()}</div>
                          )}
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-slate-800">{user.user_metadata.full_name || user.email?.split('@')[0]}님</span>
                            <span className="text-[10px] text-slate-400">{user.email}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border tracking-wider text-center ${
                            userGrade === 'admin' ? 'bg-slate-800 text-white border-slate-700' :
                            userGrade === 'pro' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {userGrade === 'admin' ? 'ADMIN' : userGrade === 'pro' ? 'PRO' : 'FREE'}
                          </div>
                          <div className="flex-1 flex items-center justify-between px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-bold border border-yellow-100">
                            <span>⚡ 보유 볼트</span><span>{volts.toLocaleString()} V</span>
                          </div>
                        </div>
                        <button onClick={handleLogout} className="w-full py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-600 shadow-sm hover:bg-slate-50">로그아웃</button>
                      </div>
                    </div>

                    <div className="md:hidden p-2 grid grid-cols-4 gap-2 border-b border-slate-100 bg-white">
                      <button
                        onClick={() => !myBlogId ? openProfileModal() : window.open(`https://blog.naver.com/${myBlogId}`, '_blank')}
                        className={`flex items-center justify-center p-3 rounded-xl transition-colors ${!myBlogId ? 'text-red-400 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-50'}`}
                        title={myBlogId ? '내 블로그 열기' : '블로그 연동 필요'}
                        aria-label={myBlogId ? '내 블로그 열기' : '블로그 연동 필요'}
                      >
                        <img src="https://blog.naver.com/favicon.ico" className="w-5 h-5 opacity-80" alt="blog" />
                      </button>

                      <button
                        onClick={() => !myInfluencerUrl ? openProfileModal() : window.open(myInfluencerUrl, '_blank')}
                        className={`flex items-center justify-center p-3 rounded-xl transition-colors ${!myInfluencerUrl ? 'text-red-400 hover:bg-red-50' : 'text-slate-600 hover:bg-slate-50'}`}
                        title={myInfluencerUrl ? '인플루언서 홈 열기' : '인플루언서 연동 필요'}
                        aria-label={myInfluencerUrl ? '인플루언서 홈 열기' : '인플루언서 연동 필요'}
                      >
                        <span className="text-lg leading-none">👑</span>
                      </button>

                      <button
                        onClick={() => !myBlogId ? openProfileModal() : window.open(`https://blog.naver.com/PostWriteForm.naver?blogId=${myBlogId}`, '_blank')}
                        className={`flex items-center justify-center p-3 rounded-xl transition-colors hover:bg-blue-50 ${themeStyles.accentText} bg-slate-50`}
                        title={myBlogId ? '블로그 글쓰기' : '블로그 연동 필요'}
                        aria-label={myBlogId ? '블로그 글쓰기' : '블로그 연동 필요'}
                      >
                        <PenLine className="w-4 h-4" />
                      </button>
                      <button
                        onClick={openProfileModal}
                        className="flex items-center justify-center p-3 rounded-xl transition-colors text-slate-600 hover:bg-slate-50"
                        title="내 정보 설정"
                        aria-label="내 정보 설정"
                      >
                        <UserCog className="w-4 h-4" />
                      </button>
                    </div>

                    <div className="px-4 py-3 bg-white">
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-1">Settings</p>
                      <div className="w-full rounded-xl bg-slate-100 p-1 grid grid-cols-2 gap-1">
                        <button
                          onClick={() => setMode('basic')}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${isBasicMode ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          ⚡ 일반 모드 (20V)
                        </button>
                        <button
                          onClick={() => setMode('pro')}
                          className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${!isBasicMode ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                        >
                          🚀 고성능 모드 (100V)
                        </button>
                      </div>

                      <div className="my-1 border-t border-slate-100" />

                      <button onClick={exportHistory} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-600"><DownloadCloud className="w-4 h-4 text-slate-400" /> 기록 백업하기</button>
                      <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-600"><UploadCloud className="w-4 h-4 text-slate-400" /> 기록 복원하기</button>
                      <input type="file" ref={fileInputRef} onChange={importHistory} className="hidden" accept=".json" />

                      <div className="my-1 border-t border-slate-100" />

                      <button onClick={clearHistory} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-50 text-red-500 text-sm"><Trash2 className="w-4 h-4" /> 기록 전체 삭제</button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center gap-2">
              <button onClick={handleLogin} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm">
                <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-3.5 h-3.5" alt="G" /> 구글
              </button>
              <button onClick={handleKakaoLogin} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#FEE500] text-xs font-bold text-slate-900 hover:bg-[#FDD835] transition-all shadow-sm">
                <img src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg" className="w-3 h-3" alt="K" /> 카카오
              </button>
            </div>

            <div className="relative md:hidden">
              <button
                onClick={() => setIsMobileLoginOpen(!isMobileLoginOpen)}
                className="p-2.5 bg-white border border-slate-200 text-slate-500 rounded-full shadow-sm active:scale-95 transition-all"
                title="로그인하기"
              >
                {isMobileLoginOpen ? <X className="w-5 h-5" /> : <LogIn className="w-5 h-5" />}
              </button>

              <AnimatePresence>
                {isMobileLoginOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-48 bg-white/95 backdrop-blur-md rounded-2xl shadow-xl border border-slate-100 p-2 z-50 flex flex-col gap-2 origin-top-right"
                  >
                    <button onClick={handleLogin} className="flex items-center justify-center gap-2 py-2.5 bg-white border border-slate-200 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all">
                      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-4 h-4" alt="G" />
                      <span className="text-xs font-bold text-slate-700">구글 로그인</span>
                    </button>
                    <button onClick={handleKakaoLogin} className="flex items-center justify-center gap-2 py-2.5 bg-[#FEE500] rounded-xl shadow-sm hover:bg-[#FDD835] active:scale-95 transition-all">
                      <img src="https://upload.wikimedia.org/wikipedia/commons/e/e3/KakaoTalk_logo.svg" className="w-4 h-4" alt="K" />
                      <span className="text-xs font-bold text-slate-900">카카오 로그인</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}


