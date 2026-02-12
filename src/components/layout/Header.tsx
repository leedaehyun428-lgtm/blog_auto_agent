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
  Plus,
  Zap,
  ShieldAlert,
  ChevronRight,
  Megaphone,
  CircleHelp,
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
  openWalletModal: () => void;
  userGrade: string;
  volts: number;
  handleLogout: () => void;
  isMenuOpen: boolean;
  setIsMenuOpen: (value: boolean) => void;
  menuRef: RefObject<HTMLDivElement | null>;
  isAdmin: boolean;
  setShowAdmin: (value: boolean) => void;
  exportHistory: () => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  importHistory: (event: ChangeEvent<HTMLInputElement>) => void;
  clearHistory: () => void;
  openNoticeModal: () => void;
  openGuideModal: () => void;
  openAuthModal: () => void;
}

export default function Header({
  user,
  mode,
  themeStyles,
  resetToHome,
  myBlogId,
  myInfluencerUrl,
  openProfileModal,
  openWalletModal,
  userGrade,
  volts,
  handleLogout,
  isMenuOpen,
  setIsMenuOpen,
  menuRef,
  isAdmin,
  setShowAdmin,
  exportHistory,
  fileInputRef,
  importHistory,
  clearHistory,
  openNoticeModal,
  openGuideModal,
  openAuthModal,
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

              <button
                type="button"
                onClick={openWalletModal}
                className="group flex items-center gap-2 pl-3 pr-1.5 py-1.5 bg-yellow-50/80 hover:bg-yellow-100 border border-yellow-200 rounded-full transition-all hover:scale-105 cursor-pointer"
                title="볼트 충전하기"
              >
                <div className="flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-yellow-600 fill-yellow-600" />
                  <span className="text-sm font-bold text-slate-800 tabular-nums">{volts.toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-center w-5 h-5 bg-yellow-400 text-white rounded-full shadow-sm group-hover:scale-110 transition-transform">
                  <Plus className="w-3.5 h-3.5" strokeWidth={3} />
                </div>
              </button>

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
                      <button
                        onClick={() => setShowAdmin(true)}
                        className="group mx-2 mt-2 flex w-[calc(100%-1rem)] items-center justify-between rounded-xl bg-gradient-to-r from-slate-800 to-slate-900 p-3 text-white shadow-md transition-all hover:from-slate-700 hover:to-slate-800 hover:shadow-lg"
                      >
                        <div className="flex items-center gap-2">
                          <div className="rounded-lg bg-white/10 p-1.5">
                            <ShieldAlert className="h-4 w-4 text-yellow-400" />
                          </div>
                          <div className="flex flex-col items-start">
                            <span className="text-[10px] font-bold tracking-wide text-yellow-400">ADMIN</span>
                            <span className="text-xs text-slate-300">관리자 페이지</span>
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 text-slate-400 transition-all group-hover:translate-x-1 group-hover:text-white" />
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
                        <button onClick={handleLogout} className="w-full py-2 text-xs font-bold bg-white border border-slate-200 rounded-lg text-slate-600 shadow-sm hover:bg-slate-50">로그아웃</button>
                        <div className="flex items-center gap-2 p-2 bg-white rounded-xl border border-slate-100 shadow-sm">
                          <div className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase border tracking-wider text-center ${
                            userGrade === 'admin' ? 'bg-slate-800 text-white border-slate-700' :
                            userGrade === 'pro' ? 'bg-purple-100 text-purple-700 border-purple-200' :
                            'bg-slate-100 text-slate-500 border-slate-200'
                          }`}>
                            {userGrade === 'admin' ? 'ADMIN' : userGrade === 'pro' ? 'PRO' : 'FREE'}
                          </div>
                          <button
                            type="button"
                            onClick={openWalletModal}
                            className="flex-1 flex items-center justify-between px-3 py-1 bg-yellow-50 text-yellow-700 rounded-lg text-xs font-bold border border-yellow-100 hover:bg-yellow-100 transition-colors"
                          >
                            <span>⚡ 보유 볼트</span><span>{volts.toLocaleString()} V</span>
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            openWalletModal();
                            setIsMenuOpen(false);
                          }}
                          className="group w-full flex items-center justify-center gap-2 py-2 text-xs font-bold rounded-lg text-white shadow-md bg-gradient-to-r from-violet-500 to-indigo-500 hover:from-violet-600 hover:to-indigo-600 transition-all active:scale-95"
                        >
                          <Zap className="w-4 h-4 text-white/90 group-hover:scale-110 transition-transform" />
                          ⚡ 볼트 충전소
                        </button>
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

                    <div className="px-4 py-3 bg-white space-y-3">
                      <div>
                        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">알림/가이드</p>
                        <div className="space-y-1">
                          <button
                            onClick={() => {
                              openNoticeModal();
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-600"
                          >
                            <Megaphone className="w-4 h-4 text-slate-400" /> 공지사항
                          </button>
                          <button
                            onClick={() => {
                              openGuideModal();
                              setIsMenuOpen(false);
                            }}
                            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-600"
                          >
                            <CircleHelp className="w-4 h-4 text-slate-400" /> 사용법
                          </button>
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">기록 관리</p>
                        <div className="space-y-1">
                          <button onClick={exportHistory} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-600"><DownloadCloud className="w-4 h-4 text-slate-400" /> 기록 백업하기</button>
                          <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 text-sm text-slate-600"><UploadCloud className="w-4 h-4 text-slate-400" /> 기록 복원하기</button>
                          <input type="file" ref={fileInputRef} onChange={importHistory} className="hidden" accept=".json" />
                        </div>
                      </div>

                      <div className="border-t border-slate-100 pt-3">
                        <p className="mb-2 px-1 text-[11px] font-bold uppercase tracking-wider text-amber-500">주의 기능</p>
                        <button onClick={clearHistory} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl bg-red-50/70 hover:bg-red-100 text-red-600 text-sm font-semibold"><Trash2 className="w-4 h-4" /> 기록 전체 삭제</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={openAuthModal}
              className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
            >
              <LogIn className="w-4 h-4" />
              로그인
            </button>
            <button
              type="button"
              onClick={openAuthModal}
              className="md:hidden p-2.5 bg-white border border-slate-200 text-slate-500 rounded-full shadow-sm active:scale-95 transition-all"
              title="로그인하기"
            >
              <LogIn className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
