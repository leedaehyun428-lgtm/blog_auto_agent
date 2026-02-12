import { useState, useEffect } from 'react';
import { 
  X, RefreshCw, Plus, Minus, AlertCircle, CheckCircle, 
  ShieldAlert, Zap, XCircle, ChevronLeft, ChevronRight 
} from 'lucide-react';
import { supabase } from './supabaseClient';

interface AdminPageProps {
  onClose: () => void;
  currentUserId: string;
  onMyGradeChanged: () => void;
}

// ✨ Toast 메시지 타입 정의
interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error';
}

interface ProfileRow {
  id: string;
  user_name?: string;
  full_name?: string;
  email?: string;
  grade: string;
  volts: number;
  created_at: string;
}

interface LogRow {
  id: number;
  user_id: string;
  keyword: string;
  theme: string;
  used_volts: number;
  status: string;
  error_message?: string;
  created_at: string;
}

export default function AdminPage({ onClose, currentUserId, onMyGradeChanged }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [users, setUsers] = useState<ProfileRow[]>([]);
  const [logs, setLogs] = useState<LogRow[]>([]);
  
  // ✨ Toast 상태 관리
  const [toasts, setToasts] = useState<Toast[]>([]);

  // ✨ 페이지네이션 상태 (로그 탭용)
  const [page, setPage] = useState(1);
  const LOGS_PER_PAGE = 20;

  // 로그 필터 상태
  const [logFilter, setLogFilter] = useState<'all' | 'use' | 'charge' | 'refund'>('all');

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, [page]);
  /* eslint-enable react-hooks/exhaustive-deps */ // 페이지가 바뀔 때마다 로그 다시 가져옴

  // ✨ Toast 추가 함수 (3초 후 자동 삭제)
  const addToast = (message: string, type: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const fetchUsers = async () => {    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('유저 로딩 실패:', error);
      addToast('유저 목록을 불러오지 못했습니다.', 'error');
    } else {
      setUsers(profiles || []);
    }  };

  const fetchLogs = async () => {
    // ✨ 페이지네이션 적용: range(시작, 끝)
    const start = (page - 1) * LOGS_PER_PAGE;
    const end = start + LOGS_PER_PAGE - 1;

    const { data, error } = await supabase
      .from('generation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .range(start, end);

    if (error) {
      console.error('로그 로딩 실패:', error);
      addToast('로그를 불러오지 못했습니다.', 'error');
    } else {
      setLogs(data || []);
    }
  };

// ⚡ 볼트 수정 함수 (낙관적 업데이트 적용: UI 먼저 변경 -> 서버 전송)
  const updateVolts = async (userId: string, currentVolts: number, change: number, userEmail: string) => {
    // 1. 계산된 새로운 값
    const newVolts = currentVolts + change;
    if (newVolts < 0) return addToast("0보다 작을 수 없습니다.", 'error');

    // 2. ✨ [핵심] 서버 기다리지 않고 UI부터 즉시 업데이트 (Optimistic UI)
    // 이전 상태 백업 (에러 시 복구용)
    const prevUsers = [...users];
    
    // 화면의 숫자를 즉시 바꿈
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, volts: newVolts } : u));
    
    // 토스트도 즉시 띄움 (기다리지 않음)
    addToast(`${userEmail}님의 볼트를 ${change > 0 ? '+' : ''}${change} 변경했습니다.`);

    try {
      // 3. 서버에 실제 데이터 전송 (비동기)
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ volts: newVolts })
        .eq('id', userId);

      if (updateError) throw updateError;

      // 4. 로그 저장 (이것도 조용히 백그라운드 처리)
      const { error: logError } = await supabase.from('generation_logs').insert({
        user_id: userId,
        keyword: change > 0 ? '관리자 지급 (보너스)' : '관리자 차감 (페널티)',
        theme: 'SYSTEM',
        used_volts: change * -1,
        status: change > 0 ? 'admin_gift' : 'admin_deduct',
        error_message: `Admin adjusted balance by ${change} VT`
      });

      if (logError) throw logError;

      // 5. 로그 탭이 보고 있다면, 로그 목록만 조용히 갱신 (사용자 방해 X)
      if (activeTab === 'logs') {
        const { data: newLogs } = await supabase
          .from('generation_logs')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(20); // 최신 것만 살짝 긁어옴
        if (newLogs) setLogs(newLogs);
      }

    } catch (error) {
      // 💥 실패 시: 아까 백업해둔 값으로 UI 롤백
      console.error("업데이트 실패:", error);
      setUsers(prevUsers); 
      addToast("서버 오류로 취소되었습니다.", 'error');
    }
  };
  
  const updateGrade = async (userId: string, newGrade: string) => {
    const { error } = await supabase.from('profiles').update({ grade: newGrade }).eq('id', userId);
    if (error) addToast("등급 수정 실패", 'error');
    else {
      setUsers(users.map(u => u.id === userId ? { ...u, grade: newGrade } : u));
      if (userId === currentUserId) onMyGradeChanged();
      addToast("등급이 변경되었습니다.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up relative">
        
        {/* ✨ Toast 알림 컨테이너 (화면 하단 중앙) */}
        <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-50 pointer-events-none w-full max-w-md px-4">
          {toasts.map(toast => (
            <div key={toast.id} className={`pointer-events-auto px-4 py-3 rounded-xl shadow-lg text-sm font-bold flex items-center gap-2 animate-fade-in-up ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-800 text-white'}`}>
              {toast.type === 'error' ? <AlertCircle className="w-4 h-4"/> : <CheckCircle className="w-4 h-4"/>}
              {toast.message}
            </div>
          ))}
        </div>

        {/* 헤더 */}
        <div className="bg-slate-900 p-4 md:p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-xl md:text-2xl font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-yellow-400" /> <span className="hidden md:inline">Briter</span> Admin
            </h2>
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button onClick={() => setActiveTab('users')} className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>유저 관리</button>
              <button onClick={() => setActiveTab('logs')} className={`px-3 md:px-4 py-1.5 rounded-md text-xs md:text-sm font-bold transition-colors ${activeTab === 'logs' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>사용 로그</button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-red-500 text-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4 md:p-6 custom-scrollbar">
          
          {/* 1. 유저 관리 탭 */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-bold text-slate-700">등록된 유저 ({users.length}명)</h3>
                <button onClick={fetchUsers} className="p-2 bg-white border rounded-lg hover:bg-slate-50"><RefreshCw className="w-4 h-4" /></button>
              </div>

              {/* ✨ [반응형] PC에서는 테이블(Table), 모바일에서는 카드(Card) */}
              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                
                {/* 🖥️ PC 뷰: 테이블 */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm text-left whitespace-nowrap">
                    <thead className="bg-slate-100 text-slate-500 font-medium uppercase text-xs">
                      <tr>
                        <th className="px-6 py-4">유저 정보 (이메일/이름)</th>
                        <th className="px-6 py-4">등급 (Grade)</th>
                        <th className="px-6 py-4">⚡ 보유 볼트</th>
                        <th className="px-6 py-4">가입일</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {users.map((u) => (
                        <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-6 py-4">
                            <div className="font-bold text-slate-800 text-base">{u.user_name || u.full_name || '이름 없음'}</div>                           
                            <div className="text-slate-500 text-xs mb-1">{u.email || '이메일 정보 없음'}</div>
                            <div className="font-mono text-[10px] text-slate-300 select-all">{u.id}</div>
                          </td>
                          <td className="px-6 py-4">
                            <select 
                              value={u.grade} 
                              onChange={(e) => updateGrade(u.id, e.target.value)}
                              className={`px-2 py-1 rounded border text-xs font-bold outline-none cursor-pointer ${
                                u.grade === 'admin' ? 'bg-slate-900 text-white border-slate-700' :
                                u.grade === 'pro' ? 'bg-blue-100 text-blue-600 border-blue-200' :
                                'bg-green-100 text-green-600 border-green-200'
                              }`}
                            >
                              <option value="basic" className="bg-white text-slate-700">Basic</option>
                              <option value="pro" className="bg-white text-slate-700">Pro</option>
                              <option value="admin" className="bg-white text-slate-700">Admin</option>
                              <option value="ban" className="bg-white text-slate-700">Ban</option>
                            </select>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <span className="font-bold text-slate-700 w-12 text-right">{u.volts.toLocaleString()}</span>
                              <div className="flex gap-1">
                                <button onClick={() => updateVolts(u.id, u.volts, 100, u.email)} className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" title="+100"><Plus className="w-3 h-3" /></button>
                                <button onClick={() => updateVolts(u.id, u.volts, -100, u.email)} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200" title="-100"><Minus className="w-3 h-3" /></button>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-xs text-slate-400">{new Date(u.created_at).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* 📱 모바일 뷰: 카드 리스트 */}
                <div className="md:hidden divide-y divide-slate-100">
                  {users.map((u) => (
                    <div key={u.id} className="p-4 space-y-3">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-slate-800">{u.user_name || u.full_name || '이름 없음'}</div>
                          <div className="text-xs text-slate-500">{u.email}</div>
                        </div>
                        <select 
                          value={u.grade} 
                          onChange={(e) => updateGrade(u.id, e.target.value)}
                          className={`px-2 py-1 rounded border text-xs font-bold outline-none ${
                            u.grade === 'admin' ? 'bg-slate-900 text-white' :
                            u.grade === 'pro' ? 'bg-blue-100 text-blue-600' :
                            'bg-green-100 text-green-600'
                          }`}
                        >
                          <option value="basic">Basic</option>
                          <option value="pro">Pro</option>
                          <option value="admin">Admin</option>
                          <option value="ban">Ban</option>
                        </select>
                      </div>
                      
                      <div className="flex justify-between items-center bg-slate-50 p-3 rounded-lg">
                        <span className="text-xs font-bold text-slate-500">보유 볼트</span>
                        <div className="flex items-center gap-3">
                          <span className="font-bold text-slate-800">{u.volts.toLocaleString()} V</span>
                          <div className="flex gap-1">
                            <button onClick={() => updateVolts(u.id, u.volts, 100, u.email)} className="p-1.5 bg-white border rounded shadow-sm text-blue-600"><Plus className="w-3 h-3" /></button>
                            <button onClick={() => updateVolts(u.id, u.volts, -100, u.email)} className="p-1.5 bg-white border rounded shadow-sm text-red-600"><Minus className="w-3 h-3" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

              </div>
            </div>
          )}

          {/* 2. 사용 로그 탭 */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                <h3 className="text-lg font-bold text-slate-700">활동 기록</h3>
                
                <div className="flex w-full md:w-auto items-center gap-2">
                  <div className="flex p-1 bg-slate-200/60 rounded-xl overflow-x-auto hide-scrollbar flex-1 md:flex-none">
                    {[{ id: 'all', label: '전체' }, { id: 'use', label: '사용' }, { id: 'charge', label: '충전' }, { id: 'refund', label: '환불' }].map((tab) => (
                      <button key={tab.id} onClick={() => setLogFilter(tab.id as 'all' | 'use' | 'charge' | 'refund')} className={`px-3 py-1.5 text-xs font-bold rounded-lg whitespace-nowrap transition-all ${logFilter === tab.id ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>{tab.label}</button>
                    ))}
                  </div>
                  <button onClick={fetchLogs} className="p-2 bg-white border rounded-lg hover:bg-slate-50 shrink-0"><RefreshCw className="w-4 h-4" /></button>
                </div>
              </div>

              <div className="space-y-3">
                {logs
                  .filter((log) => {
                    if (logFilter === 'all') return true;
                    if (logFilter === 'refund') return log.status === 'refunded';
                    if (logFilter === 'charge') return (log.used_volts < 0 && log.status !== 'refunded') || log.status === 'admin_gift';
                    if (logFilter === 'use') return (log.used_volts > 0 && log.status !== 'refunded') || log.status === 'admin_deduct';
                    return true;
                  })
                  .map((log) => {
                    const targetUser = users.find(u => u.id === log.user_id);
                    const userName = targetUser ? (targetUser.user_name || targetUser.full_name || '이름 없음') : '알 수 없음';
                    const userEmail = targetUser ? targetUser.email : log.user_id.slice(0, 8) + '...';

                    return (
                      <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3 hover:border-blue-300 transition-colors">
                        
                        {/* 로그 내용 */}
                        <div className="flex items-start gap-3 overflow-hidden">
                          <div className={`mt-1 p-2 rounded-full shrink-0 ${
                            log.status === 'refunded' ? 'bg-red-100 text-red-500' :
                            log.status === 'admin_gift' ? 'bg-purple-100 text-purple-600' :
                            log.used_volts < 0 ? 'bg-purple-100 text-purple-600' : 
                            log.status === 'admin_deduct' ? 'bg-orange-100 text-orange-600' :
                            'bg-green-100 text-green-600' 
                          }`}>
                            {log.status === 'refunded' ? <XCircle className="w-5 h-5" /> : 
                            (log.used_volts < 0 || log.status === 'admin_gift') ? <Zap className="w-5 h-5" /> :
                            log.status.includes('admin') ? <ShieldAlert className="w-5 h-5" /> :
                            <CheckCircle className="w-5 h-5" />}
                          </div>
                          
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-bold text-slate-800 text-sm md:text-base truncate">{log.keyword || '시스템 메시지'}</span>
                              <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold shrink-0 ${log.theme==='SYSTEM' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>{log.theme || 'ETC'}</span>
                            </div>
                            
                            <div className="text-xs text-slate-500 flex flex-col md:flex-row md:items-center gap-1 md:gap-2">
                              <span className="font-mono text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                              <div className="flex items-center gap-1">
                                <span className="font-bold text-slate-700">{userName}</span>
                                <span className="text-slate-400 text-[10px]">({userEmail})</span>
                              </div>
                            </div>
                            {log.error_message && <div className="mt-2 text-xs bg-slate-50 text-slate-600 p-2 rounded border border-slate-100 font-mono break-all">Memo: {log.error_message}</div>}
                          </div>
                        </div>

                        {/* 로그 금액 (우측 정렬) */}
                        <div className="flex justify-between md:block items-center pl-12 md:pl-0 md:text-right w-full md:w-auto">
                           <div className="text-xs text-slate-400 md:hidden">변동 내역</div>
                           <div className="flex flex-col items-end">
                             {log.status === 'admin_gift' ? (
                                 <div className="font-bold text-base md:text-lg text-purple-600 whitespace-nowrap">⚡ +{Math.abs(log.used_volts)}</div>
                             ) : (log.status === 'admin_deduct' || (log.used_volts > 0)) ? ( 
                                 <div className={`font-bold text-base md:text-lg whitespace-nowrap ${log.status === 'refunded' ? 'text-slate-400 line-through' : 'text-orange-600'}`}>⚡ -{Math.abs(log.used_volts)}</div>
                             ) : ( 
                                 <div className="font-bold text-base md:text-lg text-purple-600 whitespace-nowrap">⚡ +{Math.abs(log.used_volts)}</div>
                             )}
                             {log.status === 'refunded' && <div className="text-xs font-bold text-green-500 mt-1">환불됨</div>}
                           </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* ✨ 페이지네이션 버튼 */}
              <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t border-slate-200">
                <button 
                  onClick={() => setPage(p => Math.max(1, p - 1))} 
                  disabled={page === 1}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
                >
                  <ChevronLeft className="w-4 h-4" /> 이전
                </button>
                <span className="text-sm font-bold text-slate-600">Page {page}</span>
                <button 
                  onClick={() => setPage(p => p + 1)}
                  // 데이터가 ITEMS_PER_PAGE보다 적으면 다음 페이지가 없다고 가정
                  disabled={logs.length < LOGS_PER_PAGE}
                  className="flex items-center gap-1 px-4 py-2 rounded-lg bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-50 disabled:cursor-not-allowed font-bold text-sm"
                >
                  다음 <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          )}

        </div>
      </div>
    </div>
  );
}

