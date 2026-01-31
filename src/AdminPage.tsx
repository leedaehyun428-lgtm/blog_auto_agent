import { useState, useEffect } from 'react';
import { supabase } from './supabaseClient';
import { X, Search, UserCog, RotateCcw } from 'lucide-react';

interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  grade: 'free' | 'pro' | 'admin';
  daily_count: number;
  max_daily_count: number;
  last_used_date: string;
  created_at: string;
}

interface AdminPageProps {
  onClose: () => void;
  currentUserId: string; // 로그인한 사람 ID
  onMyGradeChanged: () => void; // 내 등급이 바뀌면 호출할 함수
}

export default function AdminPage({ onClose, currentUserId, onMyGradeChanged }: AdminPageProps) {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // 유저 목록 불러오기
  const fetchUsers = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (searchTerm) {
        query = query.ilike('email', `%${searchTerm}%`);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setUsers(data as UserProfile[]);
    } catch (error: any) {
      alert("데이터 로딩 실패: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  // ✨ 등급 변경 핸들러 (수정됨: 중복 제거 및 로직 통합)
  const handleGradeChange = async (userId: string, newGrade: string) => {
    if (!confirm(`해당 유저의 등급을 ${newGrade}(으)로 변경하시겠습니까?`)) return;

    // 등급별 한도 자동 설정
    let newMaxCount = 2; 
    if (newGrade === 'pro') newMaxCount = 30;
    if (newGrade === 'admin') newMaxCount = 99999;

    const { error } = await supabase
      .from('profiles')
      .update({ 
        grade: newGrade,
        max_daily_count: newMaxCount 
      })
      .eq('id', userId);

    if (error) {
      alert("변경 실패: " + error.message);
    } else {
      alert(`등급이 ${newGrade}로 변경되었습니다!`);
      
      // 만약 "내가 내 등급을 바꾼 경우"라면? -> 부모(App.tsx)에게 알림!
      if (userId === currentUserId) {
        onMyGradeChanged(); 
      }
      
      fetchUsers();
    }
  };

  // ✨ 횟수 리셋 핸들러
  const handleResetCount = async (userId: string) => {
    if (!confirm("이 유저의 오늘 사용 횟수를 0으로 리셋하시겠습니까?")) return;

    const { error } = await supabase
      .from('profiles')
      .update({ daily_count: 0 })
      .eq('id', userId);

    if (error) {
      alert("리셋 실패: " + error.message);
    } else {
      alert("횟수가 리셋되었습니다! 🔄");
      fetchUsers();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-5xl h-[80vh] rounded-2xl shadow-2xl flex flex-col overflow-hidden animate-fade-in-up">
        
        {/* 헤더 */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-slate-50">
          <div className="flex items-center gap-2">
            <UserCog className="w-6 h-6 text-slate-700" />
            <h2 className="text-xl font-bold text-slate-800">유저 관리자 페이지</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-6 h-6 text-slate-500" />
          </button>
        </div>

        {/* 툴바 */}
        <div className="p-4 border-b bg-white flex gap-2">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="이메일 검색..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
              className="w-full pl-9 pr-4 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button onClick={fetchUsers} className="px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-bold hover:bg-slate-700">
            조회
          </button>
        </div>

        {/* 테이블 */}
        <div className="flex-1 overflow-auto bg-slate-50 p-4">
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left text-slate-600">
              <thead className="bg-slate-100 text-xs uppercase font-bold text-slate-500">
                <tr>
                  <th className="px-6 py-3">가입일</th>
                  <th className="px-6 py-3">이메일 / 이름</th>
                  <th className="px-6 py-3">등급 (Grade)</th>
                  <th className="px-6 py-3">사용 현황</th>
                  <th className="px-6 py-3">관리</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={5} className="text-center py-10">로딩중...</td></tr>
                ) : users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-400">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{user.email}</div>
                      <div className="text-xs text-slate-400">{user.full_name}</div>
                    </td>
                    <td className="px-6 py-4">
                      <select 
                        value={user.grade}
                        onChange={(e) => handleGradeChange(user.id, e.target.value)}
                        className={`border rounded px-2 py-1 text-xs font-bold focus:ring-2 outline-none cursor-pointer ${
                            user.grade === 'admin' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                            user.grade === 'pro' ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-slate-50 text-slate-500 border-slate-200'
                        }`}
                      >
                        <option value="free">Free (2회)</option>
                        <option value="pro">Pro (30회)</option>
                        <option value="admin">Admin (∞)</option>
                      </select>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`font-mono font-bold ${user.daily_count >= user.max_daily_count ? 'text-red-500' : 'text-slate-700'}`}>
                            {user.daily_count} / {user.max_daily_count > 1000 ? '∞' : user.max_daily_count}
                        </span>
                        {/* 리셋 버튼 */}
                        <button 
                            onClick={() => handleResetCount(user.id)}
                            className="p-1.5 hover:bg-slate-200 rounded-full text-slate-400 hover:text-blue-500 transition-colors"
                            title="횟수 초기화"
                        >
                            <RotateCcw className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                        <span className="text-[10px] text-slate-300">ID: {user.id.slice(0,4)}...</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && !loading && (
              <div className="text-center py-10 text-slate-400">데이터가 없습니다.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}