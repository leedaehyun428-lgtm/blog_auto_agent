import { useState, useEffect } from 'react';
import { X, RefreshCw, Plus, Minus, Search, AlertCircle, CheckCircle, ShieldAlert } from 'lucide-react';
import { supabase } from './supabaseClient';

interface AdminPageProps {
  onClose: () => void;
  currentUserId: string;
  onMyGradeChanged: () => void;
}

export default function AdminPage({ onClose, currentUserId, onMyGradeChanged }: AdminPageProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'logs'>('users');
  const [users, setUsers] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
    fetchLogs();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    // ✨ email, user_name 컬럼까지 가져오기
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) console.error('유저 로딩 실패:', error);
    else setUsers(profiles || []);
    setLoading(false);
  };

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('generation_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50); 

    if (error) console.error('로그 로딩 실패:', error);
    else setLogs(data || []);
  };

  // ⚡ 볼트 수정 함수 (로그 기록 기능 추가)
  const updateVolts = async (userId: string, currentVolts: number, change: number, userEmail: string) => {
    const newVolts = currentVolts + change;
    if (newVolts < 0) return alert("0보다 작을 수 없습니다.");

    // 1. 프로필 업데이트
    const { error } = await supabase
      .from('profiles')
      .update({ volts: newVolts })
      .eq('id', userId);

    if (error) {
      alert("수정 실패: " + error.message);
    } else {
      // 2. ✨ [로그 기록] 관리자 권한으로 수정했다는 증거 남기기
      await supabase.from('generation_logs').insert({
        user_id: userId,
        keyword: change > 0 ? '관리자 지급 (보너스)' : '관리자 차감 (페널티)',
        theme: 'SYSTEM',
        used_volts: change * -1, // 지급이면(-), 차감이면(+)로 표현하거나, 그냥 변화량 기록
        status: change > 0 ? 'admin_gift' : 'admin_deduct',
        error_message: `Admin adjusted balance by ${change} VT`
      });

      // UI 갱신
      setUsers(users.map(u => u.id === userId ? { ...u, volts: newVolts } : u));
      fetchLogs(); // 로그 탭도 갱신
      alert(`${userEmail}님의 볼트를 ${change > 0 ? '+' : ''}${change} 변경했습니다.`);
    }
  };

  const updateGrade = async (userId: string, newGrade: string) => {
    const { error } = await supabase.from('profiles').update({ grade: newGrade }).eq('id', userId);
    if (error) alert("등급 수정 실패");
    else {
      setUsers(users.map(u => u.id === userId ? { ...u, grade: newGrade } : u));
      if (userId === currentUserId) onMyGradeChanged();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
      <div className="bg-white w-full max-w-6xl h-[85vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col animate-fade-in-up">
        
        {/* 헤더 */}
        <div className="bg-slate-900 p-6 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-6 h-6 text-yellow-400" /> Briter Admin
            </h2>
            <div className="flex bg-slate-800 rounded-lg p-1">
              <button onClick={() => setActiveTab('users')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${activeTab === 'users' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>유저 관리</button>
              <button onClick={() => setActiveTab('logs')} className={`px-4 py-1.5 rounded-md text-sm font-bold transition-colors ${activeTab === 'logs' ? 'bg-white text-slate-900' : 'text-slate-400 hover:text-white'}`}>사용 로그</button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-red-500 text-white rounded-full transition-colors"><X className="w-5 h-5" /></button>
        </div>

        {/* 컨텐츠 영역 */}
        <div className="flex-1 overflow-auto bg-slate-50 p-6">
          
          {/* 1. 유저 관리 탭 */}
          {activeTab === 'users' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-700">등록된 유저 ({users.length}명)</h3>
                <button onClick={fetchUsers} className="p-2 bg-white border rounded-lg hover:bg-slate-50"><RefreshCw className="w-4 h-4" /></button>
              </div>

              <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-sm text-left">
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
                          {/* ✨ 이메일과 이름 표시 */}
                        <div className="font-bold text-slate-800 text-base">
                          {u.user_name || u.full_name || '이름 없음'}
                        </div>                          
                        <div className="text-slate-500 text-xs mb-1">{u.email || '이메일 정보 없음'}</div>
                          <div className="font-mono text-[10px] text-slate-300 select-all">{u.id}</div>
                        </td>
                        <td className="px-6 py-4">
                          <select 
                            value={u.grade} 
                            onChange={(e) => updateGrade(u.id, e.target.value)}
                            className={`px-2 py-1 rounded border text-xs font-bold transition-colors outline-none ${
                              u.grade === 'admin' ? 'bg-slate-900 text-white border-slate-700' : // Admin: 검정
                              u.grade === 'pro' ? 'bg-blue-100 text-blue-600 border-blue-200' :   // Pro: 파랑
                              u.grade === 'ban' ? 'bg-red-100 text-red-600 border-red-200' :       // Ban: 빨강
                              'bg-green-100 text-green-600 border-green-200'                         // Basic: 초록
                            }`}
                          >
                            <option value="basic" className="bg-white text-slate-700">Basic (무료)</option>
                            <option value="pro" className="bg-white text-slate-700">Pro (유료)</option>
                            <option value="admin" className="bg-white text-slate-700">Admin (관리자)</option>
                            <option value="ban" className="bg-white text-slate-700">Ban (정지)</option>
                          </select>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <span className="font-bold text-slate-700 w-12 text-right">{u.volts.toLocaleString()}</span>
                            <div className="flex gap-1">
                              <button onClick={() => updateVolts(u.id, u.volts, 100, u.email)} className="p-1 bg-blue-100 text-blue-600 rounded hover:bg-blue-200" title="+100 선물"><Plus className="w-3 h-3" /></button>
                              <button onClick={() => updateVolts(u.id, u.volts, -100, u.email)} className="p-1 bg-red-100 text-red-600 rounded hover:bg-red-200" title="-100 차감"><Minus className="w-3 h-3" /></button>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-xs text-slate-400">
                           {new Date(u.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 2. 사용 로그 탭 */}
          {activeTab === 'logs' && (
            <div className="space-y-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-700">최근 활동 기록 (50건)</h3>
                <button onClick={fetchLogs} className="p-2 bg-white border rounded-lg hover:bg-slate-50"><RefreshCw className="w-4 h-4" /></button>
              </div>

              <div className="space-y-3">
                {logs.map((log) => (
                  <div key={log.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex justify-between items-center hover:border-blue-300 transition-colors">
                    <div className="flex items-start gap-4">
                      {/* 상태 아이콘 구분 */}
                      <div className={`mt-1 p-2 rounded-full ${
                        log.status === 'success' ? 'bg-green-100 text-green-600' : 
                        log.status === 'admin_gift' ? 'bg-purple-100 text-purple-600' :
                        log.status === 'admin_deduct' ? 'bg-orange-100 text-orange-600' :
                        'bg-red-100 text-red-600'
                      }`}>
                        {log.status === 'success' ? <CheckCircle className="w-5 h-5" /> : 
                         log.status.includes('admin') ? <ShieldAlert className="w-5 h-5" /> :
                         <AlertCircle className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-slate-800 text-lg">{log.keyword}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full uppercase font-bold ${log.theme==='SYSTEM' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-500'}`}>{log.theme || 'ETC'}</span>
                        </div>
                        <div className="text-xs text-slate-400 flex gap-3 font-mono">
                            {/* 여기서 user_id로 찾아서 이름을 보여주면 좋지만, 간단하게 ID 앞자리만 */}
                          <span>{new Date(log.created_at).toLocaleString()}</span>
                          <span>•</span>
                          <span>User: {log.user_id.slice(0, 8)}...</span>
                        </div>
                        {log.error_message && (
                          <div className="mt-2 text-xs bg-slate-50 text-slate-600 p-2 rounded border border-slate-100 font-mono">
                            Memo: {log.error_message}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                       {/* 로그 표시: 관리자가 준건 (+)로, 쓴건 (-)로 보이게 */}
                       {log.status === 'admin_gift' ? (
                           <div className="font-bold text-lg text-purple-600">⚡ +{Math.abs(log.used_volts)}</div>
                       ) : log.status === 'admin_deduct' ? (
                           <div className="font-bold text-lg text-orange-600">⚡ -{Math.abs(log.used_volts)}</div>
                       ) : (
                           <div className={`font-bold text-lg ${log.status === 'refunded' ? 'text-slate-400 line-through' : 'text-yellow-600'}`}>
                               ⚡ -{log.used_volts}
                           </div>
                       )}
                      
                      {log.status === 'refunded' && <div className="text-xs font-bold text-green-500">환불됨</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}