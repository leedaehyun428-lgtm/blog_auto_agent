import { createClient } from '@supabase/supabase-js';

// .env에서 키 가져오기
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL 또는 Anon Key가 설정되지 않았습니다.");
}

// 클라이언트 생성 및 내보내기
export const supabase = createClient(supabaseUrl, supabaseAnonKey);