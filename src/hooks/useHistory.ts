import { useCallback, useState } from 'react';
import type { ChangeEvent, MouseEvent } from 'react';
import type { User } from '@supabase/supabase-js';
import type { ThemeType } from '../api';
import { supabase } from '../supabaseClient';

interface HistoryItem {
  id: number;
  keyword: string;
  content: string;
  date: string;
  theme: ThemeType;
  isTestMode: boolean;
}

interface PostRow {
  id: number;
  keyword: string;
  content: string;
  created_at: string;
  theme: ThemeType;
  is_test_mode: boolean;
}

interface UseHistoryParams {
  user: User | null;
  selectedTheme: ThemeType;
  isTestMode: boolean;
  notify: (type: 'success' | 'error' | 'info', message: string) => void;
  requestConfirm: (options: { title: string; message: string; confirmText?: string; cancelText?: string; danger?: boolean }) => Promise<boolean>;
  setKeyword: (value: string) => void;
  setResult: (value: string) => void;
  setSelectedTheme: (value: ThemeType) => void;
  setResultIsTestMode: (value: boolean) => void;
  setStep: (value: 'idle' | 'searching' | 'writing' | 'done') => void;
  setIsMobileView: (value: boolean) => void;
  setIsEditing: (value: boolean) => void;
}

export function useHistory({
  user,
  selectedTheme,
  isTestMode,
  notify,
  requestConfirm,
  setKeyword,
  setResult,
  setSelectedTheme,
  setResultIsTestMode,
  setStep,
  setIsMobileView,
  setIsEditing,
}: UseHistoryParams) {
  const [history, setHistory] = useState<HistoryItem[]>([]);

  const fetchHistory = useCallback(async () => {
    const { data } = await supabase
      .from('posts')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      const formatted: HistoryItem[] = (data as PostRow[]).map((item) => ({
        id: item.id,
        keyword: item.keyword,
        content: item.content,
        date: new Date(item.created_at).toLocaleDateString(),
        theme: item.theme,
        isTestMode: item.is_test_mode,
      }));
      setHistory(formatted);
    }
  }, []);

  const saveToHistory = useCallback(async (newKeyword: string, newContent: string) => {
    if (!user) return;
    const { error } = await supabase.from('posts').insert({
      user_id: user.id,
      keyword: newKeyword,
      content: newContent,
      theme: selectedTheme,
      is_test_mode: isTestMode,
    });

    if (error) {
      notify('error', '저장에 실패했습니다.');
    } else {
      fetchHistory();
      notify('success', '기록이 저장되었습니다.');
    }
  }, [fetchHistory, isTestMode, notify, selectedTheme, user]);

  const clearHistory = useCallback(async () => {
    if (!user) return;
    const shouldClear = await requestConfirm({
      title: '기록 전체 삭제',
      message: '서버에 저장된 모든 기록을 삭제하시겠습니까?',
      confirmText: '전체 삭제',
      cancelText: '취소',
      danger: true,
    });
    if (!shouldClear) return;

    const { error } = await supabase.from('posts').delete().eq('user_id', user.id);
    if (error) notify('error', '삭제 중 오류가 발생했습니다.');
    else {
      setHistory([]);
      notify('success', '기록을 모두 삭제했습니다.');
    }
  }, [notify, requestConfirm, user]);

  const deleteHistoryItem = useCallback(async (e: MouseEvent, itemId: number) => {
    e.stopPropagation();
    const shouldDelete = await requestConfirm({
      title: '기록 삭제',
      message: '이 기록을 삭제하시겠습니까?',
      confirmText: '삭제',
      cancelText: '취소',
      danger: true,
    });
    if (!shouldDelete) return;

    const { error } = await supabase.from('posts').delete().eq('id', itemId);
    if (error) notify('error', '삭제에 실패했습니다.');
    else if (user) {
      fetchHistory();
      notify('success', '기록을 삭제했습니다.');
    }
  }, [fetchHistory, notify, requestConfirm, user]);

  const loadFromHistory = useCallback((item: HistoryItem) => {
    setKeyword(item.keyword);
    setResult(item.content);
    setSelectedTheme(item.theme || 'restaurant');
    setResultIsTestMode(item.isTestMode ?? true);
    setStep('done');
    setIsMobileView(false);
    setIsEditing(false);
  }, [setIsEditing, setIsMobileView, setKeyword, setResult, setResultIsTestMode, setSelectedTheme, setStep]);

  const exportHistory = useCallback(() => {
    const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(history))}`;
    const link = document.createElement('a');
    link.href = jsonString;
    link.download = `briter_ai_backup_${new Date().toLocaleDateString()}.json`;
    link.click();
  }, [history]);

  const importHistory = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files.length > 0) {
      fileReader.readAsText(event.target.files[0], 'UTF-8');
      fileReader.onload = (e) => {
        if (e.target?.result) {
          try {
            const parsedData = JSON.parse(e.target.result as string);
            if (Array.isArray(parsedData)) {
              setHistory(parsedData as HistoryItem[]);
              notify('success', '복원 완료! (DB 저장은 안 됨)');
            }
          } catch {
            notify('error', '파일 오류');
          }
        }
      };
    }
  }, [notify]);

  return {
    history,
    setHistory,
    fetchHistory,
    saveToHistory,
    clearHistory,
    deleteHistoryItem,
    loadFromHistory,
    exportHistory,
    importHistory,
  };
}
